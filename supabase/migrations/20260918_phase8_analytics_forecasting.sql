-- ==============================================================================
-- KINGS OF WINGS RESTAURANT OPERATING SYSTEM — PHASE 8 DATABASE MIGRATION
-- ADVANCED RESTAURANT ANALYTICS, FORECASTING & BUSINESS INTELLIGENCE
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DAILY AGGREGATED ANALYTICS ROLLUP
CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    gross_sales_cents BIGINT NOT NULL DEFAULT 0,
    discounts_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    service_charge_cents BIGINT NOT NULL DEFAULT 0,
    net_sales_cents BIGINT NOT NULL DEFAULT 0,
    refunds_cents BIGINT NOT NULL DEFAULT 0,
    paid_amount_cents BIGINT NOT NULL DEFAULT 0,
    outstanding_amount_cents BIGINT NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    completed_orders INT NOT NULL DEFAULT 0,
    cancelled_orders INT NOT NULL DEFAULT 0,
    total_items_sold INT NOT NULL DEFAULT 0,
    avg_order_value_cents BIGINT NOT NULL DEFAULT 0,
    avg_prep_time_minutes NUMERIC(5, 2) DEFAULT 0,
    total_customers_count INT NOT NULL DEFAULT 0,
    table_utilization_pct NUMERIC(5, 2) DEFAULT 0,
    food_cost_cents BIGINT NOT NULL DEFAULT 0,
    gross_margin_cents BIGINT NOT NULL DEFAULT 0,
    food_cost_pct NUMERIC(5, 2) DEFAULT 0,
    wastage_cents BIGINT NOT NULL DEFAULT 0,
    payment_success_rate NUMERIC(5, 2) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_restaurant_date ON analytics_daily(restaurant_id, date DESC);

-- 2. HOURLY OPERATIONS ANALYTICS
CREATE TABLE IF NOT EXISTS analytics_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour_of_day INT NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
    order_count INT NOT NULL DEFAULT 0,
    revenue_cents BIGINT NOT NULL DEFAULT 0,
    items_sold INT NOT NULL DEFAULT 0,
    avg_prep_minutes NUMERIC(5, 2) DEFAULT 0,
    active_tables_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, date, hour_of_day)
);

CREATE INDEX IF NOT EXISTS idx_analytics_hourly_rest_date_hour ON analytics_hourly(restaurant_id, date DESC, hour_of_day);

-- 3. MENU ITEM DAILY PERFORMANCE STATS
CREATE TABLE IF NOT EXISTS menu_item_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    orders_count INT NOT NULL DEFAULT 0,
    units_sold INT NOT NULL DEFAULT 0,
    revenue_cents BIGINT NOT NULL DEFAULT 0,
    ingredient_cost_cents BIGINT NOT NULL DEFAULT 0,
    estimated_gross_margin_cents BIGINT NOT NULL DEFAULT 0,
    food_cost_pct NUMERIC(5, 2) DEFAULT 0,
    cancellations_count INT NOT NULL DEFAULT 0,
    stockout_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, date, item_name)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_daily_rest_date ON menu_item_daily_stats(restaurant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_menu_item_daily_item ON menu_item_daily_stats(menu_item_id);

-- 4. KITCHEN DAILY PERFORMANCE STATS
CREATE TABLE IF NOT EXISTS kitchen_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    station VARCHAR(100) NOT NULL,
    tickets_count INT NOT NULL DEFAULT 0,
    avg_prep_seconds INT NOT NULL DEFAULT 0,
    median_prep_seconds INT NOT NULL DEFAULT 0,
    stage_locked_seconds INT DEFAULT 0,
    stage_assigned_seconds INT DEFAULT 0,
    stage_cooking_seconds INT DEFAULT 0,
    stage_saucing_seconds INT DEFAULT 0,
    stage_ready_seconds INT DEFAULT 0,
    delayed_tickets_count INT NOT NULL DEFAULT 0,
    peak_hour INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, date, station)
);

CREATE INDEX IF NOT EXISTS idx_kitchen_daily_rest_date ON kitchen_daily_stats(restaurant_id, date DESC);

-- 5. TABLE DAILY STATS
CREATE TABLE IF NOT EXISTS table_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    zone VARCHAR(100) DEFAULT 'Main Dining',
    capacity INT DEFAULT 4,
    sessions_count INT NOT NULL DEFAULT 0,
    total_revenue_cents BIGINT NOT NULL DEFAULT 0,
    total_orders_count INT NOT NULL DEFAULT 0,
    avg_session_minutes INT NOT NULL DEFAULT 0,
    utilization_pct NUMERIC(5, 2) DEFAULT 0,
    turnover_rate NUMERIC(4, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, date, table_number)
);

CREATE INDEX IF NOT EXISTS idx_table_daily_rest_date ON table_daily_stats(restaurant_id, date DESC);

-- 6. SERVICE REQUEST DAILY STATS
CREATE TABLE IF NOT EXISTS service_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    total_requests INT NOT NULL DEFAULT 0,
    resolved_requests INT NOT NULL DEFAULT 0,
    unresolved_requests INT NOT NULL DEFAULT 0,
    avg_resolution_seconds INT NOT NULL DEFAULT 0,
    peak_hour INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, date, request_type)
);

CREATE INDEX IF NOT EXISTS idx_service_daily_rest_date ON service_daily_stats(restaurant_id, date DESC);

-- 7. FORECAST RUNS RECORD
CREATE TABLE IF NOT EXISTS forecast_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    forecast_type VARCHAR(50) NOT NULL CHECK (forecast_type IN ('DEMAND_ORDERS', 'REVENUE', 'MENU_ITEM', 'INGREDIENT_BOM', 'HOURLY_PROFILE')),
    horizon VARCHAR(20) NOT NULL CHECK (horizon IN ('NEXT_DAY', 'NEXT_7_DAYS', 'NEXT_30_DAYS')),
    method VARCHAR(100) NOT NULL, -- e.g. '7_DAY_WEIGHTED_MOVING_AVG', 'EXPONENTIAL_SMOOTHING', 'DOW_SEASONAL_PROFILE', 'LINEAR_TREND'
    training_data_start DATE NOT NULL,
    training_data_end DATE NOT NULL,
    sample_size_days INT NOT NULL,
    validation_mae NUMERIC(10, 2),
    validation_rmse NUMERIC(10, 2),
    validation_mape_pct NUMERIC(5, 2),
    confidence_level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_runs_rest_type ON forecast_runs(restaurant_id, forecast_type, created_at DESC);

-- 8. FORECAST RESULTS (Detailed Predictions)
CREATE TABLE IF NOT EXISTS forecast_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('RESTAURANT_ORDERS', 'REVENUE_INR', 'MENU_ITEM', 'INGREDIENT_KG_OR_UNIT', 'HOURLY_ORDERS')),
    entity_id VARCHAR(100),
    entity_name VARCHAR(255) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_hour INT CHECK (forecast_hour BETWEEN 0 AND 23),
    predicted_value NUMERIC(12, 3) NOT NULL,
    lower_bound NUMERIC(12, 3),
    upper_bound NUMERIC(12, 3),
    actual_value NUMERIC(12, 3),
    variance_abs NUMERIC(12, 3),
    variance_pct NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_results_run ON forecast_results(run_id);
CREATE INDEX IF NOT EXISTS idx_forecast_results_date ON forecast_results(restaurant_id, forecast_date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: Manager/Admin can read, Customers are denied
-- ==============================================================================

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_results ENABLE ROW LEVEL SECURITY;

-- Analytics Daily RLS
CREATE POLICY "Allow manager/admin read analytics_daily" ON analytics_daily
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = analytics_daily.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert analytics_daily" ON analytics_daily
    FOR ALL USING (true) WITH CHECK (true);

-- Analytics Hourly RLS
CREATE POLICY "Allow manager/admin read analytics_hourly" ON analytics_hourly
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = analytics_hourly.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert analytics_hourly" ON analytics_hourly
    FOR ALL USING (true) WITH CHECK (true);

-- Menu Item Stats RLS
CREATE POLICY "Allow manager/admin read menu_item_daily_stats" ON menu_item_daily_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = menu_item_daily_stats.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert menu_item_daily_stats" ON menu_item_daily_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Kitchen Daily Stats RLS
CREATE POLICY "Allow manager/admin read kitchen_daily_stats" ON kitchen_daily_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = kitchen_daily_stats.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN', 'KITCHEN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert kitchen_daily_stats" ON kitchen_daily_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Table Daily Stats RLS
CREATE POLICY "Allow manager/admin read table_daily_stats" ON table_daily_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = table_daily_stats.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert table_daily_stats" ON table_daily_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Service Daily Stats RLS
CREATE POLICY "Allow manager/admin read service_daily_stats" ON service_daily_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = service_daily_stats.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert service_daily_stats" ON service_daily_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Forecast Runs RLS
CREATE POLICY "Allow manager/admin read forecast_runs" ON forecast_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = forecast_runs.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert forecast_runs" ON forecast_runs
    FOR ALL USING (true) WITH CHECK (true);

-- Forecast Results RLS
CREATE POLICY "Allow manager/admin read forecast_results" ON forecast_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles sp
            WHERE sp.restaurant_id = forecast_results.restaurant_id
            AND sp.role IN ('MANAGER', 'ADMIN')
            AND sp.is_active = true
        )
    );

CREATE POLICY "Allow server/admin insert forecast_results" ON forecast_results
    FOR ALL USING (true) WITH CHECK (true);
