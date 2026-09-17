-- ==============================================================================
-- KINGS OF WINGS RESTAURANT OPERATING SYSTEM — PHASE 9 DATABASE MIGRATION
-- Multi-Tenant Restaurant SaaS Platform, Tenant Isolation & Organization Management
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Business/Enterprise holding company layer)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    billing_email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. ORGANIZATION MEMBERS (Corporate / Multi-Branch level roles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id)
    role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'ORGANIZATION_ADMIN', 'ORGANIZATION_MANAGER')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 3. UPGRADE RESTAURANTS TABLE FOR FULL TENANT PROFILES & BRANDING
-- ------------------------------------------------------------------------------
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cover_image TEXT,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Chennai',
    ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Tamil Nadu',
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS tax_configuration JSONB DEFAULT '{"taxName": "GST", "ratePercent": 5.0, "taxNumber": "33AAAAA0000A1Z5", "inclusive": true}'::jsonb,
    ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{"monday": {"open": "11:00", "close": "23:00", "closed": false}, "tuesday": {"open": "11:00", "close": "23:00", "closed": false}, "wednesday": {"open": "11:00", "close": "23:00", "closed": false}, "thursday": {"open": "11:00", "close": "23:00", "closed": false}, "friday": {"open": "11:00", "close": "00:00", "closed": false}, "saturday": {"open": "11:00", "close": "00:00", "closed": false}, "sunday": {"open": "11:00", "close": "23:00", "closed": false}}'::jsonb,
    ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{"primaryColor": "#ff5708", "secondaryColor": "#ffb86d", "tagline": "Flame-Kissed Smoked Craft Wings", "themeMode": "DARK"}'::jsonb;

-- Ensure status constraint covers SETUP, ACTIVE, SUSPENDED, ARCHIVED
DO $$
BEGIN
    ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS chk_restaurant_status;
    ALTER TABLE restaurants ADD CONSTRAINT chk_restaurant_status CHECK (status IN ('SETUP', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RESTAURANT MEMBERSHIPS (Multi-tenant Staff & Role Mapping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id)
    role VARCHAR(50) NOT NULL CHECK (role IN ('STAFF', 'KITCHEN', 'MANAGER', 'ADMIN', 'PLATFORM_ADMIN')),
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 5. SAAS SUBSCRIPTION PLANS & ENTITLEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL CHECK (code IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly_minor INT NOT NULL DEFAULT 0,
    price_annual_minor INT NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    features TEXT[] NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    plan_code VARCHAR(50) NOT NULL REFERENCES subscription_plans(code),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id)
);

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    monthly_orders INT DEFAULT 0,
    ai_requests INT DEFAULT 0,
    active_tables INT DEFAULT 0,
    staff_accounts INT DEFAULT 0,
    storage_mb NUMERIC(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, period_start)
);

-- ------------------------------------------------------------------------------
-- 6. AUDIT LOG EXTENSIONS FOR PLATFORM & TENANT EVENTS
-- ------------------------------------------------------------------------------
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS target_tenant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES FOR TENANT ISOLATION
-- ------------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Helper security functions for multi-tenant checks
CREATE OR REPLACE FUNCTION current_user_has_restaurant_membership(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow authenticated user if they possess active membership in the target restaurant
    RETURN EXISTS (
        SELECT 1 FROM restaurant_memberships
        WHERE restaurant_id = target_restaurant_id
          AND user_id = auth.uid()
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM restaurant_memberships
        WHERE user_id = auth.uid()
          AND role = 'PLATFORM_ADMIN'
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations RLS
CREATE POLICY "Org members can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = TRUE)
        OR current_user_is_platform_admin()
    );

CREATE POLICY "Platform admins can manage organizations" ON organizations
    FOR ALL USING (current_user_is_platform_admin());

-- Organization Members RLS
CREATE POLICY "Org members view roster" ON organization_members
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR current_user_is_platform_admin()
    );

-- Restaurant Memberships RLS
CREATE POLICY "Staff can view their own memberships" ON restaurant_memberships
    FOR SELECT USING (
        user_id = auth.uid()
        OR current_user_has_restaurant_membership(restaurant_id)
        OR current_user_is_platform_admin()
    );

CREATE POLICY "Managers and platform admins can manage memberships" ON restaurant_memberships
    FOR ALL USING (
        current_user_is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM restaurant_memberships
            WHERE restaurant_id = restaurant_memberships.restaurant_id
              AND user_id = auth.uid()
              AND role IN ('MANAGER', 'ADMIN')
              AND is_active = TRUE
        )
    );

-- Subscription Plans RLS: public read
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = TRUE);

-- Subscriptions RLS
CREATE POLICY "Restaurant staff can view their restaurant subscription" ON subscriptions
    FOR SELECT USING (
        current_user_has_restaurant_membership(restaurant_id)
        OR current_user_is_platform_admin()
    );

-- Usage Records RLS
CREATE POLICY "Restaurant staff can view their usage records" ON usage_records
    FOR SELECT USING (
        current_user_has_restaurant_membership(restaurant_id)
        OR current_user_is_platform_admin()
    );

-- ------------------------------------------------------------------------------
-- 8. COMPOSITE PERFORMANCE & TENANT INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_restaurants_org_id ON restaurants(organization_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_rest_memberships_user_rest ON restaurant_memberships(user_id, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_rest ON subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_rest_period ON usage_records(restaurant_id, period_start);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_rest_status ON restaurant_tables(restaurant_id, status);

-- ------------------------------------------------------------------------------
-- 9. SEED DEFAULT SUBSCRIPTION PLANS & PRODUCTION TENANT HIERARCHY
-- ------------------------------------------------------------------------------
INSERT INTO subscription_plans (code, name, description, price_monthly_minor, price_annual_minor, currency, features, limits)
VALUES
    ('FREE', 'Community Starter', 'Single-table or trial cloud POS with basic QR menu', 0, 0, 'INR', 
     ARRAY['BASIC_MENU', 'QR_ORDERING'], 
     '{"activeTables": 4, "monthlyOrders": 150, "staffAccounts": 2, "aiRequests": 20, "locations": 1}'::jsonb),
    ('STARTER', 'Express Pitmaster', 'Perfect for food trucks, single-concept diners & cafes', 299900, 2999000, 'INR', 
     ARRAY['BASIC_MENU', 'QR_ORDERING', 'KDS', 'BASIC_INVENTORY', 'CUSTOM_BRANDING'], 
     '{"activeTables": 12, "monthlyOrders": 1000, "staffAccounts": 6, "aiRequests": 100, "locations": 1}'::jsonb),
    ('PRO', 'Culinary Flagship', 'Comprehensive operations with AI Concierge, Recipes & Predictive Forecasting', 799900, 7999000, 'INR', 
     ARRAY['BASIC_MENU', 'QR_ORDERING', 'KDS', 'INVENTORY', 'PROCUREMENT', 'RECIPES', 'AI_CONCIERGE', 'AI_COPILOT', 'ADVANCED_ANALYTICS', 'FORECASTING', 'CUSTOM_BRANDING', 'EXPORTS'], 
     '{"activeTables": 35, "monthlyOrders": 5000, "staffAccounts": 20, "aiRequests": 500, "locations": 3}'::jsonb),
    ('ENTERPRISE', 'Hospitality Empire', 'Multi-location enterprise groups with corporate analytics & dedicated SLAs', 1999900, 19999000, 'INR', 
     ARRAY['BASIC_MENU', 'QR_ORDERING', 'KDS', 'INVENTORY', 'PROCUREMENT', 'RECIPES', 'AI_CONCIERGE', 'AI_COPILOT', 'ADVANCED_ANALYTICS', 'FORECASTING', 'MULTI_LOCATION', 'ORGANIZATION_ANALYTICS', 'CUSTOM_BRANDING', 'EXPORTS', 'API_ACCESS', 'PRIORITY_SUPPORT'], 
     '{"activeTables": 999, "monthlyOrders": 999999, "staffAccounts": 999, "aiRequests": 5000, "locations": 50}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    price_monthly_minor = EXCLUDED.price_monthly_minor;

-- Seed Organization: Atherion Foods Pvt Ltd
INSERT INTO organizations (id, name, legal_name, slug, billing_email, phone, address, tax_id, status)
VALUES (
    '88888888-8888-4888-a888-888888888888',
    'Atherion Foods Hospitality Group',
    'Atherion Foods Private Limited',
    'atherion-foods',
    'corporate@atherionfoods.com',
    '+91 44 2834 9000',
    'Level 7, Apex Tech Park, Anna Salai, Chennai, TN 600002',
    '33AAAAA8888A1Z9',
    'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- Link existing flagship restaurant (7bd24e21-8fd0-46c2-ac57-1b30838d1460) to Atherion Foods
UPDATE restaurants
SET 
    organization_id = '88888888-8888-4888-a888-888888888888',
    legal_name = 'Kings of Wings Live Grill Private Limited',
    city = 'Chennai',
    state = 'Tamil Nadu',
    country = 'India',
    status = 'ACTIVE',
    branding = '{"primaryColor": "#ff5708", "secondaryColor": "#ffb86d", "tagline": "Flame-Kissed Smoked Craft Wings — Table 18 Live Grill", "themeMode": "DARK"}'::jsonb
WHERE id = '7bd24e21-8fd0-46c2-ac57-1b30838d1460';

-- Seed Branch 2: WingHouse Tambaram Grill (Demonstrates Tenant Isolation & Multi-Branch)
INSERT INTO restaurants (
    id, organization_id, name, slug, logo_url, description, currency, currency_symbol,
    timezone, address, city, state, country, phone, email, wifi_ssid, gst_percent, status,
    branding
) VALUES (
    'b1234567-8fd0-46c2-ac57-1b30838d1461',
    '88888888-8888-4888-a888-888888888888',
    'WingHouse — Tambaram Express',
    'winghouse-tambaram',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    'Fast-casual express pit grill and drive-in wings at Tambaram West junction.',
    'INR', '₹', 'Asia/Kolkata',
    '44 GST Road, Tambaram West, Chennai, TN 600045', 'Chennai', 'Tamil Nadu', 'India',
    '+91 44 2226 8900', 'tambaram@winghouse.menu', 'WingHouse_Tambaram_Guest', 5.00, 'ACTIVE',
    '{"primaryColor": "#e11d48", "secondaryColor": "#fda4af", "tagline": "Fast, Crispy & Blazing Hot — Tambaram Express", "themeMode": "DARK"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Seed Branch 3: WingHouse Bengaluru Brigade Road (Setup Location)
INSERT INTO restaurants (
    id, organization_id, name, slug, logo_url, description, currency, currency_symbol,
    timezone, address, city, state, country, phone, email, wifi_ssid, gst_percent, status,
    branding
) VALUES (
    'c2345678-8fd0-46c2-ac57-1b30838d1462',
    '88888888-8888-4888-a888-888888888888',
    'WingHouse — Bengaluru Brigade Road',
    'winghouse-bengaluru',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    'Signature roof deck smokehouse and craft taproom on Brigade Road.',
    'INR', '₹', 'Asia/Kolkata',
    '102 Brigade Road, Shanthala Nagar, Ashok Nagar, Bengaluru, KA 560025', 'Bengaluru', 'Karnataka', 'India',
    '+91 80 4123 7700', 'bengaluru@winghouse.menu', 'WingHouse_BLR_Guest', 5.00, 'SETUP',
    '{"primaryColor": "#8b5cf6", "secondaryColor": "#c4b5fd", "tagline": "Roof Deck Smokehouse & Craft Taps — Bengaluru", "themeMode": "DARK"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Seed Active Subscriptions for Restaurants
INSERT INTO subscriptions (restaurant_id, organization_id, plan_code, status)
VALUES
    ('7bd24e21-8fd0-46c2-ac57-1b30838d1460', '88888888-8888-4888-a888-888888888888', 'ENTERPRISE', 'ACTIVE'),
    ('b1234567-8fd0-46c2-ac57-1b30838d1461', '88888888-8888-4888-a888-888888888888', 'PRO', 'ACTIVE'),
    ('c2345678-8fd0-46c2-ac57-1b30838d1462', '88888888-8888-4888-a888-888888888888', 'STARTER', 'TRIALING')
ON CONFLICT (restaurant_id) DO UPDATE SET plan_code = EXCLUDED.plan_code, status = EXCLUDED.status;

-- Seed Initial Usage for Flagship Restaurant
INSERT INTO usage_records (restaurant_id, period_start, period_end, monthly_orders, ai_requests, active_tables, staff_accounts, storage_mb)
VALUES (
    '7bd24e21-8fd0-46c2-ac57-1b30838d1460',
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
    348,
    184,
    12,
    8,
    42.50
) ON CONFLICT (restaurant_id, period_start) DO UPDATE SET
    monthly_orders = EXCLUDED.monthly_orders,
    ai_requests = EXCLUDED.ai_requests;
