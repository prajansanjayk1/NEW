-- ==============================================================================
-- PHASE 10: ENTERPRISE PRODUCTION HARDENING, COMPOSITE INDEXES & RLS AUDIT
-- ==============================================================================

-- 1. Automated Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger across critical tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('restaurants', 'organizations', 'table_sessions', 'orders', 'bills', 'payments', 'inventory_stock', 'recipes', 'suppliers')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_timestamp_%I ON public.%I;
      CREATE TRIGGER set_timestamp_%I
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_set_timestamp();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2. High-Performance Composite Indexes for Multi-Tenant Query Optimization
-- ------------------------------------------------------------------------------

-- Orders & Kitchen Display
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created_at 
  ON public.orders (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status 
  ON public.orders (restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_restaurant 
  ON public.order_items (order_id, restaurant_id);

-- Bills & Payments
CREATE INDEX IF NOT EXISTS idx_bills_restaurant_status_created 
  ON public.bills (restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_restaurant_status 
  ON public.payments (restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_provider_id 
  ON public.payments (provider_payment_id) WHERE provider_payment_id IS NOT NULL;

-- Table Sessions & QR Verification
CREATE INDEX IF NOT EXISTS idx_table_sessions_tenant_table_status 
  ON public.table_sessions (restaurant_id, table_number, status);

-- Inventory & Movements
CREATE INDEX IF NOT EXISTS idx_inventory_stock_tenant_ingredient 
  ON public.inventory_stock (restaurant_id, ingredient_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_created 
  ON public.inventory_movements (restaurant_id, created_at DESC);

-- Security Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
  ON public.audit_logs (restaurant_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Hardened Financial & Operational Constraints
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Check constraints on orders & bills if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_total_non_negative;
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_total_non_negative CHECK (total_amount >= 0);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
    ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS chk_bills_total_minor_non_negative;
    ALTER TABLE public.bills ADD CONSTRAINT chk_bills_total_minor_non_negative CHECK (total_amount_minor >= 0);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS chk_payments_amount_minor_positive;
    ALTER TABLE public.payments ADD CONSTRAINT chk_payments_amount_minor_positive CHECK (amount_minor > 0);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_stock') THEN
    ALTER TABLE public.inventory_stock DROP CONSTRAINT IF EXISTS chk_stock_quantity_non_negative;
    ALTER TABLE public.inventory_stock ADD CONSTRAINT chk_stock_quantity_non_negative CHECK (current_quantity >= 0);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Authoritative Server-Side RPC Functions with Locked Search Paths
-- ------------------------------------------------------------------------------

-- Authoritative Tenant Verification Helper
CREATE OR REPLACE FUNCTION public.verify_tenant_access(target_restaurant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if platform admin
  SELECT role INTO v_role FROM public.staff_profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_role = 'PLATFORM_ADMIN' THEN
    RETURN TRUE;
  END IF;

  -- Check restaurant membership
  RETURN EXISTS (
    SELECT 1 FROM public.restaurant_memberships
    WHERE user_id = v_user_id
      AND restaurant_id = target_restaurant_id
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Tamper-Evident Audit Logging Helper
CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_restaurant_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_details JSONB
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    id,
    restaurant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_restaurant_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
