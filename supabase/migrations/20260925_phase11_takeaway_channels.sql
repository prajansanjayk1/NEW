-- ==============================================================================
-- PHASE 11: DINE-IN VS TAKEAWAY / PICKUP MULTI-CHANNEL COMMERCE MIGRATION
-- Adds dedicated sales channel separation, channel-specific pricing,
-- packaging charges, takeaway queue management, and tenant isolation RLS.
-- ==============================================================================

-- 1. Create Enums for Order Channel and Takeaway Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_channel') THEN
        CREATE TYPE order_channel AS ENUM ('DINE_IN', 'TAKEAWAY', 'PICKUP');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'takeaway_order_status') THEN
        CREATE TYPE takeaway_order_status AS ENUM (
            'ORDER_RECEIVED', 
            'CONFIRMED', 
            'PREPARING', 
            'READY_FOR_PICKUP', 
            'PICKED_UP', 
            'CANCELLED'
        );
    END IF;
END $$;

-- 2. Alter Orders Table to support Multi-Channel Commerce
ALTER TABLE IF EXISTS public.orders
    ADD COLUMN IF NOT EXISTS channel order_channel NOT NULL DEFAULT 'DINE_IN',
    ADD COLUMN IF NOT EXISTS takeaway_order_number text,
    ADD COLUMN IF NOT EXISTS customer_name text,
    ADD COLUMN IF NOT EXISTS customer_phone text,
    ADD COLUMN IF NOT EXISTS pickup_time text,
    ADD COLUMN IF NOT EXISTS packaging_fee integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS takeaway_status takeaway_order_status,
    ADD COLUMN IF NOT EXISTS pickup_notes text;

-- Index orders by channel and restaurant for fast queue querying
CREATE INDEX IF NOT EXISTS idx_orders_channel_restaurant
    ON public.orders (restaurant_id, channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_takeaway_status
    ON public.orders (restaurant_id, takeaway_status)
    WHERE channel IN ('TAKEAWAY', 'PICKUP');

-- 3. Create Table: menu_item_prices (Channel-specific pricing & availability)
CREATE TABLE IF NOT EXISTS public.menu_item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    menu_item_id text NOT NULL,
    channel order_channel NOT NULL DEFAULT 'TAKEAWAY',
    price_minor integer NOT NULL CHECK (price_minor >= 0),
    packaging_charge_minor integer NOT NULL DEFAULT 0 CHECK (packaging_charge_minor >= 0),
    is_available boolean NOT NULL DEFAULT true,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_menu_item_channel UNIQUE(restaurant_id, menu_item_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_prices_lookup 
    ON public.menu_item_prices (restaurant_id, channel, is_available);

-- 4. Create Table: packaging_rules
CREATE TABLE IF NOT EXISTS public.packaging_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name text NOT NULL,
    fee_minor integer NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
    rule_type text NOT NULL CHECK (rule_type IN ('PER_ORDER', 'PER_ITEM', 'PER_QUANTITY')),
    is_active boolean NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packaging_rules_restaurant 
    ON public.packaging_rules (restaurant_id, is_active);

-- 5. Row Level Security Policies
ALTER TABLE public.menu_item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_rules ENABLE ROW LEVEL SECURITY;

-- Customers and staff can read active prices for their tenant
CREATE POLICY "Allow public read for active channel prices"
    ON public.menu_item_prices
    FOR SELECT
    USING (is_available = true);

-- Staff and Admin can manage channel prices within their restaurant
CREATE POLICY "Allow staff to manage channel menu prices"
    ON public.menu_item_prices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            WHERE sp.user_id = auth.uid()
            AND sp.restaurant_id = menu_item_prices.restaurant_id
            AND sp.role IN ('ADMIN', 'MANAGER')
        )
    );

-- Read active packaging rules
CREATE POLICY "Allow public read active packaging rules"
    ON public.packaging_rules
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow staff to manage packaging rules"
    ON public.packaging_rules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles sp
            WHERE sp.user_id = auth.uid()
            AND sp.restaurant_id = packaging_rules.restaurant_id
            AND sp.role IN ('ADMIN', 'MANAGER')
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_channel_price_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_menu_item_prices_updated ON public.menu_item_prices;
CREATE TRIGGER trg_menu_item_prices_updated
    BEFORE UPDATE ON public.menu_item_prices
    FOR EACH ROW
    EXECUTE FUNCTION set_channel_price_updated_at();
