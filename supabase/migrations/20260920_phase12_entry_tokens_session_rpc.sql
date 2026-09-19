-- ==============================================================================
-- PHASE 12: UNIVERSAL ENTRY TOKENS + SESSION RPCs + CUSTOMER AUTH FLOW
-- QR/NFC entry token resolution, atomic session create/join, customer participant
-- idempotency, and secure RLS for customer-facing operations
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE ENTRY TOKENS
-- Opaque UUID tokens that resolve to restaurant + table
-- QR codes and NFC tags point to /e/<token>
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.table_entry_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
    label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entry_tokens_token ON public.table_entry_tokens(token);
CREATE INDEX IF NOT EXISTS idx_entry_tokens_restaurant_table ON public.table_entry_tokens(restaurant_id, table_id);
CREATE INDEX IF NOT EXISTS idx_entry_tokens_active ON public.table_entry_tokens(token) WHERE is_active = TRUE;

-- ------------------------------------------------------------------------------
-- 2. UPGRADE SESSION_PARTICIPANTS -- add user_id for auth linkage
-- (Needed for idempotent join: same auth user = same participant)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.session_participants
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '🍗',
    ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Unique constraint: one participant per user per session (idempotency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uq_participant_user_session'
        AND table_name = 'session_participants'
    ) THEN
        ALTER TABLE public.session_participants
            ADD CONSTRAINT uq_participant_user_session UNIQUE (session_id, user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 3. UPGRADE TABLE_SESSIONS -- add created_by_user_id
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.table_sessions
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.table_entry_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can read active tokens (needed to resolve QR without auth)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can read active entry tokens" ON public.table_entry_tokens;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Public can read active entry tokens" ON public.table_entry_tokens
    FOR SELECT USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Staff can manage tokens for their restaurant
DO $$ BEGIN
  DROP POLICY IF EXISTS "Staff can manage entry tokens" ON public.table_entry_tokens;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Staff can manage entry tokens" ON public.table_entry_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_memberships rm
            WHERE rm.restaurant_id = table_entry_tokens.restaurant_id
            AND rm.user_id = auth.uid()
            AND rm.is_active = TRUE
            AND rm.role IN ('ADMIN', 'MANAGER')
        )
    );

-- Session participants: users can see participants in sessions they belong to
DO $$ BEGIN
  DROP POLICY IF EXISTS "Participants can view session members" ON public.session_participants;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE IF EXISTS public.session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view session members" ON public.session_participants
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM public.session_participants WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.restaurant_memberships rm
            JOIN public.table_sessions ts ON ts.restaurant_id = rm.restaurant_id
            WHERE ts.id = session_participants.session_id
            AND rm.user_id = auth.uid()
            AND rm.is_active = TRUE
        )
    );

-- Authenticated users can insert themselves as a participant
DO $$ BEGIN
  DROP POLICY IF EXISTS "Auth users can join session" ON public.session_participants;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Auth users can join session" ON public.session_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. RPC: resolve_entry_token(p_token)
-- Returns restaurant and table info for a given token
-- Returns error codes for invalid/expired/revoked tokens
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_entry_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
    v_token_row public.table_entry_tokens%ROWTYPE;
    v_restaurant JSONB;
    v_table JSONB;
BEGIN
    -- Find token
    SELECT * INTO v_token_row
    FROM public.table_entry_tokens
    WHERE token = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'INVALID_TOKEN',
            'message', 'Table link not found. Please scan the QR code again.'
        );
    END IF;

    IF NOT v_token_row.is_active THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'REVOKED',
            'message', 'This table link has been deactivated. Please ask staff for assistance.'
        );
    END IF;

    IF v_token_row.expires_at IS NOT NULL AND v_token_row.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'is_valid', FALSE,
            'error_code', 'EXPIRED',
            'message', 'This QR code has expired. Please scan the table QR code again.'
        );
    END IF;

    -- Fetch restaurant
    SELECT jsonb_build_object(
        'id', r.id,
        'name', r.name,
        'slug', r.slug,
        'logo_url', r.logo_url,
        'address', r.address,
        'currency', r.currency,
        'currency_symbol', r.currency_symbol,
        'timezone', r.timezone,
        'gst_percent', r.gst_percent,
        'branding', r.branding
    ) INTO v_restaurant
    FROM public.restaurants r
    WHERE r.id = v_token_row.restaurant_id;

    -- Fetch table
    SELECT jsonb_build_object(
        'id', rt.id,
        'table_number', rt.table_number,
        'capacity', rt.capacity,
        'zone', rt.zone,
        'status', rt.status
    ) INTO v_table
    FROM public.restaurant_tables rt
    WHERE rt.id = v_token_row.table_id;

    RETURN jsonb_build_object(
        'is_valid', TRUE,
        'token_id', v_token_row.id,
        'restaurant_id', v_token_row.restaurant_id,
        'table_id', v_token_row.table_id,
        'restaurant', v_restaurant,
        'table', v_table
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 6. RPC: get_or_create_active_table_session(p_restaurant_id, p_table_id, p_user_id)
-- Atomically gets or creates exactly ONE active session per table
-- Concurrency-safe: uses INSERT ... ON CONFLICT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_active_table_session(
    p_restaurant_id UUID,
    p_table_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_session public.table_sessions%ROWTYPE;
    v_session_id UUID;
    v_participant_count INT;
BEGIN
    -- Try to find existing active session
    SELECT * INTO v_session
    FROM public.table_sessions
    WHERE restaurant_id = p_restaurant_id
      AND table_id = p_table_id
      AND status IN ('ACTIVE', 'ORDERING', 'KITCHEN_PROCESSING', 'BILLING')
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Session exists, get participant count
        SELECT COUNT(*) INTO v_participant_count
        FROM public.session_participants
        WHERE session_id = v_session.id AND is_active = TRUE;

        RETURN jsonb_build_object(
            'session_id', v_session.id,
            'restaurant_id', v_session.restaurant_id,
            'table_id', v_session.table_id,
            'table_number', v_session.table_number,
            'status', v_session.status,
            'participant_count', v_participant_count,
            'is_new', FALSE,
            'created_at', v_session.created_at
        );
    END IF;

    -- No active session: create one
    -- Use a table_number lookup
    INSERT INTO public.table_sessions (
        restaurant_id,
        table_id,
        table_number,
        status,
        created_by_user_id
    )
    SELECT
        p_restaurant_id,
        p_table_id,
        rt.table_number,
        'ACTIVE',
        p_user_id
    FROM public.restaurant_tables rt
    WHERE rt.id = p_table_id
    RETURNING id INTO v_session_id;

    -- Re-fetch to get full row
    SELECT * INTO v_session
    FROM public.table_sessions
    WHERE id = v_session_id;

    RETURN jsonb_build_object(
        'session_id', v_session.id,
        'restaurant_id', v_session.restaurant_id,
        'table_id', v_session.table_id,
        'table_number', v_session.table_number,
        'status', v_session.status,
        'participant_count', 0,
        'is_new', TRUE,
        'created_at', v_session.created_at
    );
EXCEPTION WHEN unique_violation THEN
    -- Concurrent session was created; re-fetch it
    SELECT * INTO v_session
    FROM public.table_sessions
    WHERE restaurant_id = p_restaurant_id
      AND table_id = p_table_id
      AND status IN ('ACTIVE', 'ORDERING', 'KITCHEN_PROCESSING', 'BILLING')
    ORDER BY created_at DESC
    LIMIT 1;

    SELECT COUNT(*) INTO v_participant_count
    FROM public.session_participants
    WHERE session_id = v_session.id AND is_active = TRUE;

    RETURN jsonb_build_object(
        'session_id', v_session.id,
        'restaurant_id', v_session.restaurant_id,
        'table_id', v_session.table_id,
        'table_number', v_session.table_number,
        'status', v_session.status,
        'participant_count', v_participant_count,
        'is_new', FALSE,
        'created_at', v_session.created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 7. RPC: join_table_session(p_session_id, p_user_id, p_display_name, p_avatar)
-- Idempotent participant upsert: same user always gets same participant record
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_table_session(
    p_session_id UUID,
    p_user_id UUID,
    p_display_name TEXT,
    p_avatar TEXT DEFAULT '🍗'
)
RETURNS JSONB AS $$
DECLARE
    v_participant public.session_participants%ROWTYPE;
    v_participant_id UUID;
    v_is_host BOOLEAN;
    v_existing_count INT;
BEGIN
    -- Check if participant already exists for this user+session
    SELECT * INTO v_participant
    FROM public.session_participants
    WHERE session_id = p_session_id AND user_id = p_user_id
    LIMIT 1;

    IF FOUND THEN
        -- Already joined: return existing participant
        RETURN jsonb_build_object(
            'participant_id', v_participant.id,
            'session_id', v_participant.session_id,
            'user_id', v_participant.user_id,
            'display_name', v_participant.display_name,
            'avatar_emoji', v_participant.avatar_emoji,
            'role', v_participant.role,
            'joined_at', v_participant.joined_at,
            'is_new', FALSE
        );
    END IF;

    -- Count existing participants to determine HOST vs GUEST
    SELECT COUNT(*) INTO v_existing_count
    FROM public.session_participants
    WHERE session_id = p_session_id;

    v_is_host := (v_existing_count = 0);

    -- Insert new participant
    INSERT INTO public.session_participants (
        session_id,
        user_id,
        display_name,
        avatar_emoji,
        role,
        is_active
    ) VALUES (
        p_session_id,
        p_user_id,
        p_display_name,
        p_avatar,
        CASE WHEN v_is_host THEN 'HOST' ELSE 'GUEST' END,
        TRUE
    )
    ON CONFLICT (session_id, user_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            is_active = TRUE,
            updated_at = NOW()
    RETURNING id INTO v_participant_id;

    SELECT * INTO v_participant
    FROM public.session_participants
    WHERE id = v_participant_id;

    RETURN jsonb_build_object(
        'participant_id', v_participant.id,
        'session_id', v_participant.session_id,
        'user_id', v_participant.user_id,
        'display_name', v_participant.display_name,
        'avatar_emoji', v_participant.avatar_emoji,
        'role', v_participant.role,
        'joined_at', v_participant.joined_at,
        'is_new', TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 8. RPC: seed_entry_tokens(p_restaurant_id)
-- Seeds one token per table for a restaurant (run once per restaurant for setup)
-- Returns count of tokens created
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_entry_tokens(p_restaurant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_count INT := 0;
    v_table_row RECORD;
BEGIN
    FOR v_table_row IN
        SELECT id, table_number FROM public.restaurant_tables
        WHERE restaurant_id = p_restaurant_id
    LOOP
        INSERT INTO public.table_entry_tokens (
            restaurant_id,
            table_id,
            label,
            is_active
        ) VALUES (
            p_restaurant_id,
            v_table_row.id,
            'Table ' || v_table_row.table_number,
            TRUE
        )
        ON CONFLICT DO NOTHING;
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'seeded', v_count,
        'restaurant_id', p_restaurant_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant_table_active
    ON public.table_sessions(restaurant_id, table_id)
    WHERE status IN ('ACTIVE', 'ORDERING', 'KITCHEN_PROCESSING', 'BILLING');

CREATE INDEX IF NOT EXISTS idx_session_participants_user_session
    ON public.session_participants(user_id, session_id);

-- ------------------------------------------------------------------------------
-- 10. SEED ENTRY TOKENS FOR FLAGSHIP RESTAURANT
-- Call this after applying migration to generate real QR tokens
-- SELECT public.seed_entry_tokens('7bd24e21-8fd0-46c2-ac57-1b30838d1460');
-- Uncomment and run the line above in SQL editor after applying migration
-- ------------------------------------------------------------------------------
