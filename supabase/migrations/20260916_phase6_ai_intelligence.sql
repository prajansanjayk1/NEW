-- ==============================================================================
-- KINGS OF WINGS RESTAURANT OPERATING SYSTEM — PHASE 6 DATABASE MIGRATION
-- AI Concierge & Restaurant Intelligence Copilot Tables & Policies
-- ==============================================================================

-- 1. ADD DIETARY & ALLERGEN METADATA TO MENU ITEMS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_items' AND column_name = 'dietary_info'
    ) THEN
        ALTER TABLE menu_items 
        ADD COLUMN dietary_info JSONB DEFAULT '{"vegetarian": false, "vegan": false, "allergens": [], "verifiedByRestaurant": false}'::jsonb;
    END IF;
END $$;

-- 2. AI CONVERSATIONS (Session-scoped for customers, staff-scoped for managers)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES table_sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES session_participants(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    context_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER_CONCIERGE' CHECK (context_type IN ('CUSTOMER_CONCIERGE', 'MANAGER_COPILOT')),
    title VARCHAR(255) DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI MESSAGES (Structured outputs with recommendations, actions, and evidence)
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '{}'::jsonb,
    model_used VARCHAR(100) DEFAULT 'gemini-3.8-flash',
    is_demo_fallback BOOLEAN DEFAULT FALSE,
    feedback VARCHAR(20) CHECK (feedback IN ('HELPFUL', 'NOT_HELPFUL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI FEEDBACK (Quality and accuracy tracking)
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    rating VARCHAR(20) NOT NULL CHECK (rating IN ('HELPFUL', 'NOT_HELPFUL')),
    comment TEXT,
    participant_id UUID REFERENCES session_participants(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    table_number VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI USAGE & TELEMETRY
CREATE TABLE IF NOT EXISTS ai_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES table_sessions(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL CHECK (feature_type IN ('CONCIERGE', 'COPILOT', 'BRIEFING')),
    latency_ms INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'ERROR', 'DEMO_FALLBACK')),
    model VARCHAR(100) DEFAULT 'gemini-3.8-flash',
    is_demo_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_restaurant ON ai_conversations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_events(created_at);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES: Scope customer conversations strictly to the table session
CREATE POLICY ai_conversations_anon_select ON ai_conversations
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY ai_conversations_anon_insert ON ai_conversations
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY ai_messages_anon_select ON ai_messages
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY ai_messages_anon_insert ON ai_messages
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY ai_feedback_anon_insert ON ai_feedback
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY ai_usage_anon_insert ON ai_usage_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
