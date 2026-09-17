-- ==============================================================================
-- KINGS OF WINGS RESTAURANT OPERATING SYSTEM — PHASE 7 DATABASE MIGRATION
-- INVENTORY, PROCUREMENT, RECIPE COSTING & FOOD WASTAGE MANAGEMENT SYSTEM
-- ==============================================================================

-- 1. INGREDIENT CATEGORIES
CREATE TABLE IF NOT EXISTS ingredient_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_categories_restaurant ON ingredient_categories(restaurant_id);

-- 2. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    gst_number VARCHAR(50),
    payment_terms VARCHAR(100) DEFAULT 'Net 15',
    lead_time_days INT DEFAULT 2,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_restaurant ON suppliers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(restaurant_id, active);

-- 3. INGREDIENT MASTER
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('g', 'kg', 'ml', 'litre', 'piece', 'packet', 'box', 'bottle', 'portion')),
    current_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
    minimum_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    reorder_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    maximum_quantity NUMERIC(12, 3),
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0, -- in INR
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    storage_location VARCHAR(100) DEFAULT 'Walk-in Cooler',
    expiry_tracking_enabled BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock ON ingredients(restaurant_id, current_quantity, minimum_quantity);

-- 4. INVENTORY BATCHES (LOT TRACKING / FEFO)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    initial_quantity NUMERIC(12, 3) NOT NULL,
    remaining_quantity NUMERIC(12, 3) NOT NULL CHECK (remaining_quantity >= 0),
    unit VARCHAR(20) NOT NULL,
    cost_per_unit NUMERIC(10, 2) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_order_id UUID,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEPLETED', 'EXPIRED', 'DISPOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_restaurant ON inventory_batches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_batches_ingredient ON inventory_batches(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date, status);

-- 5. STOCK MOVEMENTS (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 3) NOT NULL, -- signed change or quantity with movement type
    unit VARCHAR(20) NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'PURCHASE', 'SALE_CONSUMPTION', 'WASTAGE', 'DAMAGE', 'SPOILAGE',
        'STOCK_ADJUSTMENT', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT', 'INITIAL_STOCK'
    )),
    reference VARCHAR(255), -- e.g. order_id, po_number, wastage_id
    reason TEXT,
    actor_id VARCHAR(100),
    actor_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_restaurant ON inventory_movements(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_movements_ingredient ON inventory_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);

-- 6. RECIPES & RECIPE ITEMS (MENU ITEM -> INVENTORY MAPPING)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    yield_portions INT DEFAULT 1,
    prep_time_minutes INT DEFAULT 12,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_restaurant ON recipes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON recipes(restaurant_id, menu_item_id);

CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_portion NUMERIC(10, 2) DEFAULT 0,
    notes VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_ingredient ON recipe_items(ingredient_id);

-- 7. PURCHASE ORDERS & LINE ITEMS
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    po_number VARCHAR(50) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
    )),
    expected_delivery_date DATE,
    notes TEXT,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    created_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_restaurant ON purchase_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    ordered_quantity NUMERIC(12, 3) NOT NULL,
    received_quantity NUMERIC(12, 3) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);

-- 8. WASTAGE RECORDS
CREATE TABLE IF NOT EXISTS wastage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'SPOILED', 'EXPIRED', 'DAMAGED', 'OVERPRODUCTION', 'PREPARATION_ERROR', 'CUSTOMER_RETURN', 'SPILLAGE', 'OTHER'
    )),
    estimated_cost NUMERIC(10, 2) NOT NULL,
    staff_id VARCHAR(100) NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wastage_restaurant ON wastage_records(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_wastage_ingredient ON wastage_records(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_wastage_reason ON wastage_records(reason);
CREATE INDEX IF NOT EXISTS idx_wastage_created ON wastage_records(created_at DESC);

-- 9. STOCK TAKES & ITEMS
CREATE TABLE IF NOT EXISTS stock_takes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    take_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    performed_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    total_system_value NUMERIC(12, 2) DEFAULT 0,
    total_actual_value NUMERIC(12, 2) DEFAULT 0,
    discrepancy_value NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE (restaurant_id, take_number)
);

CREATE INDEX IF NOT EXISTS idx_stock_takes_restaurant ON stock_takes(restaurant_id);

CREATE TABLE IF NOT EXISTS stock_take_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_take_id UUID NOT NULL REFERENCES stock_takes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    system_quantity NUMERIC(12, 3) NOT NULL,
    physical_quantity NUMERIC(12, 3) NOT NULL,
    difference NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit NUMERIC(10, 2) NOT NULL,
    discrepancy_cost NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_stock_take_items ON stock_take_items(stock_take_id);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_take_items ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users within the same tenant restaurant
DO $$
BEGIN
    -- Public read policy for demo/anon (fallback when offline)
    CREATE POLICY "anon_read_categories" ON ingredient_categories FOR SELECT USING (true);
    CREATE POLICY "anon_read_suppliers" ON suppliers FOR SELECT USING (true);
    CREATE POLICY "anon_read_ingredients" ON ingredients FOR SELECT USING (true);
    CREATE POLICY "anon_read_batches" ON inventory_batches FOR SELECT USING (true);
    CREATE POLICY "anon_read_movements" ON inventory_movements FOR SELECT USING (true);
    CREATE POLICY "anon_read_recipes" ON recipes FOR SELECT USING (true);
    CREATE POLICY "anon_read_recipe_items" ON recipe_items FOR SELECT USING (true);
    CREATE POLICY "anon_read_pos" ON purchase_orders FOR SELECT USING (true);
    CREATE POLICY "anon_read_po_items" ON purchase_order_items FOR SELECT USING (true);
    CREATE POLICY "anon_read_wastage" ON wastage_records FOR SELECT USING (true);
    CREATE POLICY "anon_read_stock_takes" ON stock_takes FOR SELECT USING (true);
    CREATE POLICY "anon_read_stock_take_items" ON stock_take_items FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
