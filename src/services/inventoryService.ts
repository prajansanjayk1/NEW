import { 
  Ingredient, 
  IngredientCategory, 
  InventoryBatch, 
  StockMovement, 
  Recipe, 
  PurchaseOrder, 
  WastageRecord, 
  StockTake, 
  StockStatus, 
  InventoryDashboardMetrics, 
  MenuProfitabilityItem, 
  PurchaseSuggestion,
  Order,
  InventoryUnit,
  WastageReason,
  PurchaseOrderStatus
} from '../types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SUPPLIERS, 
  INITIAL_INGREDIENTS, 
  INITIAL_BATCHES, 
  INITIAL_RECIPES, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_MOVEMENTS, 
  INITIAL_WASTAGE,
  RESTAURANT_ID 
} from '../data/inventorySeedData';
import { isSupabaseConfigured, getSupabaseClient } from './supabaseClient';
import { auditService } from './auditService';

const STORAGE_KEYS = {
  CATEGORIES: 'kow_inventory_categories',
  SUPPLIERS: 'kow_inventory_suppliers',
  INGREDIENTS: 'kow_inventory_ingredients',
  BATCHES: 'kow_inventory_batches',
  RECIPES: 'kow_inventory_recipes',
  PURCHASE_ORDERS: 'kow_inventory_purchase_orders',
  MOVEMENTS: 'kow_inventory_movements',
  WASTAGE: 'kow_inventory_wastage',
  STOCK_TAKES: 'kow_inventory_stock_takes',
  CONSUMED_ORDERS: 'kow_inventory_consumed_orders',
  AUTO_AVAILABILITY: 'kow_inventory_auto_availability',
};

type StockListener = () => void;

class InventoryService {
  private listeners: Set<StockListener> = new Set();

  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INGREDIENTS)) {
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(INITIAL_INGREDIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECIPES)) {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(INITIAL_PURCHASE_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WASTAGE)) {
      localStorage.setItem(STORAGE_KEYS.WASTAGE, JSON.stringify(INITIAL_WASTAGE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONSUMED_ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.CONSUMED_ORDERS, JSON.stringify([]));
    }
    if (localStorage.getItem(STORAGE_KEYS.AUTO_AVAILABILITY) === null) {
      localStorage.setItem(STORAGE_KEYS.AUTO_AVAILABILITY, 'false');
    }
  }

  // ---------------------------------------------------------------------------
  // REAL-TIME SUBSCRIBERS
  // ---------------------------------------------------------------------------
  public subscribe(callback: StockListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[Inventory Listener Error]', err);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // AUTHORITATIVE STOCK STATUS CALCULATION
  // ---------------------------------------------------------------------------
  public calculateStockStatus(current: number, min: number): StockStatus {
    if (current <= 0) return 'OUT_OF_STOCK';
    if (current <= min * 0.5) return 'CRITICAL';
    if (current <= min) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  // ---------------------------------------------------------------------------
  // INGREDIENTS MASTER
  // ---------------------------------------------------------------------------
  public getIngredients(): Ingredient[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      if (!stored) return INITIAL_INGREDIENTS;
      const parsed: Ingredient[] = JSON.parse(stored);
      return parsed.map((item) => {
        const stockStatus = this.calculateStockStatus(item.currentQuantity, item.minimumQuantity);
        const totalValue = Number((item.currentQuantity * item.costPerUnit).toFixed(2));
        return { ...item, stockStatus, totalValue };
      });
    } catch {
      return INITIAL_INGREDIENTS;
    }
  }

  public getIngredientById(id: string): Ingredient | undefined {
    return this.getIngredients().find((i) => i.id === id);
  }

  public saveIngredient(ingredient: Partial<Ingredient> & { name: string; unit: InventoryUnit }): Ingredient {
    const list = this.getIngredients();
    const existingIndex = list.findIndex((i) => i.id === ingredient.id);

    const now = new Date().toISOString();
    const cost = Number(ingredient.costPerUnit || 0);
    const qty = Number(ingredient.currentQuantity || 0);
    const minQty = Number(ingredient.minimumQuantity || 0);
    const status = this.calculateStockStatus(qty, minQty);

    let savedItem: Ingredient;

    if (existingIndex >= 0) {
      savedItem = {
        ...list[existingIndex],
        ...ingredient,
        costPerUnit: cost,
        currentQuantity: qty,
        minimumQuantity: minQty,
        stockStatus: status,
        totalValue: Number((qty * cost).toFixed(2)),
        updatedAt: now,
      };
      list[existingIndex] = savedItem;
    } else {
      const id = ingredient.id || `ing-${Date.now()}`;
      savedItem = {
        id,
        restaurantId: RESTAURANT_ID,
        name: ingredient.name,
        sku: ingredient.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
        category: ingredient.category || 'Other',
        unit: ingredient.unit,
        currentQuantity: qty,
        minimumQuantity: minQty,
        reorderQuantity: ingredient.reorderQuantity || minQty * 2,
        maximumQuantity: ingredient.maximumQuantity,
        costPerUnit: cost,
        supplierId: ingredient.supplierId,
        supplierName: ingredient.supplierName,
        storageLocation: ingredient.storageLocation || 'Walk-in Cooler',
        expiryTrackingEnabled: ingredient.expiryTrackingEnabled ?? true,
        active: ingredient.active ?? true,
        stockStatus: status,
        totalValue: Number((qty * cost).toFixed(2)),
        createdAt: now,
        updatedAt: now,
      };
      list.push(savedItem);

      // Record INITIAL_STOCK movement if quantity > 0
      if (qty > 0) {
        this.recordStockMovement({
          ingredientId: savedItem.id,
          ingredientName: savedItem.name,
          quantity: qty,
          unit: savedItem.unit,
          movementType: 'INITIAL_STOCK',
          reference: 'INITIAL-SETUP',
          reason: 'Initial stock register on onboarding',
          actorName: 'Admin / Inventory Manager',
        });
      }
    }

    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(list));
    this.notifyListeners();
    return savedItem;
  }

  // ---------------------------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------------------------
  public getCategories(): IngredientCategory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return stored ? JSON.parse(stored) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  public addCategory(name: string, description?: string): IngredientCategory {
    const list = this.getCategories();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: IngredientCategory = {
      id: `cat-${Date.now()}`,
      restaurantId: RESTAURANT_ID,
      name,
      slug,
      description,
      isSystem: false,
    };
    list.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return newCat;
  }

  // ---------------------------------------------------------------------------
  // SUPPLIERS
  // ---------------------------------------------------------------------------
  public getSuppliers(): any[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return stored ? JSON.parse(stored) : INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  }

  public saveSupplier(supplier: any): any {
    const list = this.getSuppliers();
    const idx = list.findIndex((s) => s.id === supplier.id);
    const now = new Date().toISOString();

    let saved: any;
    if (idx >= 0) {
      saved = { ...list[idx], ...supplier, updatedAt: now };
      list[idx] = saved;
    } else {
      saved = {
        id: supplier.id || `sup-${Date.now()}`,
        restaurantId: RESTAURANT_ID,
        ...supplier,
        active: supplier.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(list));
    this.notifyListeners();
    return saved;
  }

  // ---------------------------------------------------------------------------
  // BATCH / LOT TRACKING (FEFO)
  // ---------------------------------------------------------------------------
  public getBatches(): InventoryBatch[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BATCHES);
      const raw: InventoryBatch[] = stored ? JSON.parse(stored) : INITIAL_BATCHES;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return raw.map((b) => {
        const exp = new Date(b.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = diffDays < 0;
        const isExpiringSoon = diffDays >= 0 && diffDays <= 3;
        const status = isExpired ? 'EXPIRED' : b.remainingQuantity <= 0 ? 'DEPLETED' : 'ACTIVE';

        return {
          ...b,
          daysUntilExpiry: diffDays,
          isExpired,
          isExpiringSoon,
          status,
        };
      });
    } catch {
      return INITIAL_BATCHES;
    }
  }

  public getExpiringBatches() {
    const batches = this.getBatches().filter((b) => b.remainingQuantity > 0);
    return {
      expired: batches.filter((b) => b.isExpired),
      expiringToday: batches.filter((b) => b.daysUntilExpiry === 0),
      expiringIn3Days: batches.filter((b) => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= 3),
      expiringIn7Days: batches.filter((b) => b.daysUntilExpiry > 3 && b.daysUntilExpiry <= 7),
    };
  }

  // ---------------------------------------------------------------------------
  // STOCK MOVEMENTS
  // ---------------------------------------------------------------------------
  public getStockMovements(): StockMovement[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return stored ? JSON.parse(stored) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  }

  public recordStockMovement(data: Omit<StockMovement, 'id' | 'createdAt' | 'restaurantId'>): StockMovement {
    const list = this.getStockMovements();
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      restaurantId: RESTAURANT_ID,
      ...data,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newMovement);
    // Keep last 300 movements in storage
    const trimmed = list.slice(0, 300);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(trimmed));
    return newMovement;
  }

  // ---------------------------------------------------------------------------
  // PURCHASE ORDERS & STOCK RECEIVING
  // ---------------------------------------------------------------------------
  public getPurchaseOrders(): PurchaseOrder[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
      return stored ? JSON.parse(stored) : INITIAL_PURCHASE_ORDERS;
    } catch {
      return INITIAL_PURCHASE_ORDERS;
    }
  }

  public createPurchaseOrder(params: {
    supplierId: string;
    supplierName: string;
    items: Array<{ ingredientId: string; ingredientName: string; orderedQuantity: number; unit: InventoryUnit; unitCost: number }>;
    expectedDeliveryDate?: string;
    notes?: string;
    createdBy: string;
  }): PurchaseOrder {
    const list = this.getPurchaseOrders();
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const subtotal = params.items.reduce((sum, item) => sum + item.orderedQuantity * item.unitCost, 0);
    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      restaurantId: RESTAURANT_ID,
      poNumber,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      status: 'DRAFT',
      expectedDeliveryDate: params.expectedDeliveryDate,
      notes: params.notes,
      subtotal,
      tax,
      total,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      items: params.items.map((i) => ({
        id: `poi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ingredientId: i.ingredientId,
        ingredientName: i.ingredientName,
        orderedQuantity: i.orderedQuantity,
        receivedQuantity: 0,
        unit: i.unit,
        unitCost: i.unitCost,
        totalCost: Number((i.orderedQuantity * i.unitCost).toFixed(2)),
      })),
    };

    list.unshift(newPO);
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(list));
    this.notifyListeners();
    return newPO;
  }

  public updatePurchaseOrderStatus(poId: string, status: PurchaseOrderStatus, actor: string): PurchaseOrder | null {
    const list = this.getPurchaseOrders();
    const po = list.find((p) => p.id === poId);
    if (!po) return null;

    po.status = status;
    po.updatedAt = new Date().toISOString();
    if (status === 'APPROVED') {
      po.approvedBy = actor;
    }
    if (status === 'ORDERED') {
      po.orderedAt = new Date().toISOString();
    }

    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(list));
    this.notifyListeners();
    return po;
  }

  /**
   * Part 11: Receive Stock workflow (with partial receiving and batch creation)
   */
  public receivePurchaseOrder(params: {
    poId: string;
    receivedItems: Array<{
      ingredientId: string;
      receivedQuantity: number;
      batchNumber: string;
      expiryDate: string;
    }>;
    staffName: string;
    notes?: string;
  }): { success: boolean; po: PurchaseOrder; movements: StockMovement[] } {
    const poList = this.getPurchaseOrders();
    const po = poList.find((p) => p.id === params.poId);
    if (!po) throw new Error('Purchase Order not found');

    const ingredients = this.getIngredients();
    const batches = this.getBatches();
    const createdMovements: StockMovement[] = [];

    let allItemsFullyReceived = true;

    for (const line of po.items) {
      const rec = params.receivedItems.find((r) => r.ingredientId === line.ingredientId);
      if (rec && rec.receivedQuantity > 0) {
        line.receivedQuantity = Number((line.receivedQuantity + rec.receivedQuantity).toFixed(3));

        // 1. Update ingredient current stock
        const ingIndex = ingredients.findIndex((i) => i.id === line.ingredientId);
        if (ingIndex >= 0) {
          ingredients[ingIndex].currentQuantity = Number(
            (ingredients[ingIndex].currentQuantity + rec.receivedQuantity).toFixed(3)
          );
          ingredients[ingIndex].stockStatus = this.calculateStockStatus(
            ingredients[ingIndex].currentQuantity,
            ingredients[ingIndex].minimumQuantity
          );
          ingredients[ingIndex].totalValue = Number(
            (ingredients[ingIndex].currentQuantity * ingredients[ingIndex].costPerUnit).toFixed(2)
          );
          ingredients[ingIndex].updatedAt = new Date().toISOString();
        }

        // 2. Create batch record with expiry
        const newBatch: InventoryBatch = {
          id: `batch-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          restaurantId: RESTAURANT_ID,
          ingredientId: line.ingredientId,
          ingredientName: line.ingredientName,
          batchNumber: rec.batchNumber || `BATCH-${Date.now().toString(36).toUpperCase()}`,
          initialQuantity: rec.receivedQuantity,
          remainingQuantity: rec.receivedQuantity,
          unit: line.unit,
          costPerUnit: line.unitCost,
          receivedDate: new Date().toISOString().slice(0, 10),
          expiryDate: rec.expiryDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          supplierId: po.supplierId,
          purchaseOrderId: po.id,
          status: 'ACTIVE',
          daysUntilExpiry: 14,
          isExpiringSoon: false,
          isExpired: false,
        };
        batches.unshift(newBatch);

        // 3. Record PURCHASE stock movement
        const mov = this.recordStockMovement({
          ingredientId: line.ingredientId,
          ingredientName: line.ingredientName,
          batchId: newBatch.id,
          batchNumber: newBatch.batchNumber,
          quantity: rec.receivedQuantity,
          unit: line.unit,
          movementType: 'PURCHASE',
          reference: po.poNumber,
          reason: `Goods receipt from ${po.supplierName}. ${params.notes || ''}`.trim(),
          actorName: params.staffName,
        });
        createdMovements.push(mov);
      }

      if (line.receivedQuantity < line.orderedQuantity) {
        allItemsFullyReceived = false;
      }
    }

    po.status = allItemsFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    po.receivedAt = new Date().toISOString();
    po.updatedAt = new Date().toISOString();

    // Persist all updates atomically in local store
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(poList));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));

    this.notifyListeners();
    return { success: true, po, movements: createdMovements };
  }

  // ---------------------------------------------------------------------------
  // RECIPES & RECIPE ITEMS
  // ---------------------------------------------------------------------------
  public getRecipes(): Recipe[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECIPES);
      const raw: Recipe[] = stored ? JSON.parse(stored) : INITIAL_RECIPES;
      const ingredients = this.getIngredients();

      return raw.map((r) => {
        // Recalculate food cost from current ingredient costs
        const updatedItems = r.items.map((item) => {
          const ing = ingredients.find((i) => i.id === item.ingredientId);
          const costPerPortion = ing ? Number((ing.costPerUnit * item.quantity).toFixed(2)) : item.costPerPortion;
          return { ...item, costPerPortion, ingredientName: ing?.name || item.ingredientName };
        });

        const totalFoodCost = Number(updatedItems.reduce((sum, it) => sum + it.costPerPortion, 0).toFixed(2));
        const sellingPrice = r.sellingPrice || 250;
        const foodCostPercentage = Number(((totalFoodCost / sellingPrice) * 100).toFixed(1));
        const estimatedGrossMargin = Number((sellingPrice - totalFoodCost).toFixed(2));

        return {
          ...r,
          items: updatedItems,
          totalFoodCost,
          foodCostPercentage,
          estimatedGrossMargin,
        };
      });
    } catch {
      return INITIAL_RECIPES;
    }
  }

  public getRecipeByMenuItemId(menuItemId: string): Recipe | undefined {
    return this.getRecipes().find((r) => r.menuItemId === menuItemId);
  }

  public saveRecipe(recipe: Partial<Recipe> & { menuItemId: string; name: string; items: any[] }): Recipe {
    const list = this.getRecipes();
    const idx = list.findIndex((r) => r.menuItemId === recipe.menuItemId);
    const ingredients = this.getIngredients();

    const items = recipe.items.map((it) => {
      const ing = ingredients.find((i) => i.id === it.ingredientId);
      const cost = ing ? Number((ing.costPerUnit * it.quantity).toFixed(2)) : Number(it.costPerPortion || 0);
      return {
        ...it,
        costPerPortion: cost,
        ingredientName: ing?.name || it.ingredientName,
      };
    });

    const totalFoodCost = Number(items.reduce((sum, it) => sum + it.costPerPortion, 0).toFixed(2));
    const sellingPrice = recipe.sellingPrice || 250;
    const foodCostPercentage = Number(((totalFoodCost / sellingPrice) * 100).toFixed(1));
    const estimatedGrossMargin = Number((sellingPrice - totalFoodCost).toFixed(2));

    const saved: Recipe = {
      id: recipe.id || `rec-${Date.now()}`,
      restaurantId: RESTAURANT_ID,
      menuItemId: recipe.menuItemId,
      name: recipe.name,
      description: recipe.description,
      yieldPortions: recipe.yieldPortions || 1,
      prepTimeMinutes: recipe.prepTimeMinutes || 10,
      active: recipe.active ?? true,
      sellingPrice,
      items,
      totalFoodCost,
      foodCostPercentage,
      estimatedGrossMargin,
    };

    if (idx >= 0) {
      list[idx] = saved;
    } else {
      list.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(list));
    this.notifyListeners();
    return saved;
  }

  // ---------------------------------------------------------------------------
  // PART 14: IDEMPOTENT ORDER INVENTORY CONSUMPTION (SALE_CONSUMPTION)
  // ---------------------------------------------------------------------------
  public consumeInventoryForOrder(order: Order, actorName: string = 'Kitchen Pit / KDS'): {
    consumed: boolean;
    alreadyProcessed?: boolean;
    deductions: Array<{ ingredientName: string; quantity: number; unit: string }>;
  } {
    if (!order || !order.id) {
      return { consumed: false, deductions: [] };
    }

    const idempotencyKey = `order_consumed_${order.id}`;
    const consumedOrders: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSUMED_ORDERS) || '[]');

    if (consumedOrders.includes(idempotencyKey)) {
      console.log(`[Inventory] Order ${order.id} already consumed. Skipping duplicate event (Idempotent).`);
      return { consumed: false, alreadyProcessed: true, deductions: [] };
    }

    const recipes = this.getRecipes();
    const ingredients = this.getIngredients();
    const batches = this.getBatches();
    const deductions: Array<{ ingredientName: string; quantity: number; unit: string }> = [];

    for (const orderItem of order.items) {
      // Find matching recipe
      const recipe = recipes.find((r) => r.menuItemId === orderItem.menuItemId);
      if (!recipe) continue;

      const orderQty = orderItem.quantity || 1;

      for (const recipeItem of recipe.items) {
        const requiredQty = Number((recipeItem.quantity * orderQty).toFixed(3));
        const ingIndex = ingredients.findIndex((i) => i.id === recipeItem.ingredientId);
        if (ingIndex === -1) continue;

        // Deduct from ingredient total
        const newQty = Math.max(0, Number((ingredients[ingIndex].currentQuantity - requiredQty).toFixed(3)));
        ingredients[ingIndex].currentQuantity = newQty;
        ingredients[ingIndex].stockStatus = this.calculateStockStatus(
          newQty,
          ingredients[ingIndex].minimumQuantity
        );
        ingredients[ingIndex].totalValue = Number((newQty * ingredients[ingIndex].costPerUnit).toFixed(2));
        ingredients[ingIndex].updatedAt = new Date().toISOString();

        // Deduct from batches using FEFO (First Expired First Out)
        let qtyToDeduct = requiredQty;
        const availableBatches = batches
          .filter((b) => b.ingredientId === recipeItem.ingredientId && b.remainingQuantity > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        for (const batch of availableBatches) {
          if (qtyToDeduct <= 0) break;
          const deductFromBatch = Math.min(batch.remainingQuantity, qtyToDeduct);
          batch.remainingQuantity = Number((batch.remainingQuantity - deductFromBatch).toFixed(3));
          qtyToDeduct = Number((qtyToDeduct - deductFromBatch).toFixed(3));
        }

        // Record SALE_CONSUMPTION movement
        this.recordStockMovement({
          ingredientId: recipeItem.ingredientId,
          ingredientName: ingredients[ingIndex].name,
          quantity: -requiredQty,
          unit: recipeItem.unit,
          movementType: 'SALE_CONSUMPTION',
          reference: order.ticketNumber || order.id,
          reason: `Order served: ${orderQty} × ${recipe.name}`,
          actorName,
        });

        deductions.push({
          ingredientName: ingredients[ingIndex].name,
          quantity: requiredQty,
          unit: recipeItem.unit,
        });
      }
    }

    // Mark order as consumed
    consumedOrders.push(idempotencyKey);
    localStorage.setItem(STORAGE_KEYS.CONSUMED_ORDERS, JSON.stringify(consumedOrders));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));

    this.notifyListeners();
    console.log(`[Inventory] Consumed inventory for Order ${order.id}:`, deductions);
    return { consumed: true, deductions };
  }

  // ---------------------------------------------------------------------------
  // PART 15: WASTAGE MANAGEMENT
  // ---------------------------------------------------------------------------
  public getWastageRecords(): WastageRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WASTAGE);
      return stored ? JSON.parse(stored) : INITIAL_WASTAGE;
    } catch {
      return INITIAL_WASTAGE;
    }
  }

  public recordWastage(params: {
    ingredientId: string;
    quantity: number;
    reason: WastageReason;
    batchId?: string;
    staffId: string;
    staffName: string;
    notes?: string;
  }): WastageRecord {
    const ingredients = this.getIngredients();
    const ingIndex = ingredients.findIndex((i) => i.id === params.ingredientId);
    if (ingIndex === -1) throw new Error('Ingredient not found');

    const ing = ingredients[ingIndex];
    const qty = Number(params.quantity);
    const estimatedCost = Number((qty * ing.costPerUnit).toFixed(2));

    // 1. Deduct stock
    const newQty = Math.max(0, Number((ing.currentQuantity - qty).toFixed(3)));
    ing.currentQuantity = newQty;
    ing.stockStatus = this.calculateStockStatus(newQty, ing.minimumQuantity);
    ing.totalValue = Number((newQty * ing.costPerUnit).toFixed(2));
    ing.updatedAt = new Date().toISOString();

    // 2. If batch specified, deduct from batch
    const batches = this.getBatches();
    let batchNumber: string | undefined;
    if (params.batchId) {
      const b = batches.find((b) => b.id === params.batchId);
      if (b) {
        batchNumber = b.batchNumber;
        b.remainingQuantity = Math.max(0, Number((b.remainingQuantity - qty).toFixed(3)));
      }
    }

    // 3. Create Wastage record
    const wastageList = this.getWastageRecords();
    const newWastage: WastageRecord = {
      id: `waste-${Date.now()}`,
      restaurantId: RESTAURANT_ID,
      ingredientId: ing.id,
      ingredientName: ing.name,
      batchId: params.batchId,
      batchNumber,
      quantity: qty,
      unit: ing.unit,
      reason: params.reason,
      estimatedCost,
      staffId: params.staffId,
      staffName: params.staffName,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };
    wastageList.unshift(newWastage);

    // 4. Create WASTAGE stock movement
    this.recordStockMovement({
      ingredientId: ing.id,
      ingredientName: ing.name,
      batchId: params.batchId,
      batchNumber,
      quantity: -qty,
      unit: ing.unit,
      movementType: 'WASTAGE',
      reference: newWastage.id,
      reason: `Wastage (${params.reason}): ${params.notes || 'Logged by kitchen staff'}`,
      actorId: params.staffId,
      actorName: params.staffName,
    });

    // Save
    localStorage.setItem(STORAGE_KEYS.WASTAGE, JSON.stringify(wastageList));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));

    this.notifyListeners();
    return newWastage;
  }

  // ---------------------------------------------------------------------------
  // PART 23: STOCK TAKE WORKFLOW
  // ---------------------------------------------------------------------------
  public getStockTakes(): StockTake[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STOCK_TAKES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public submitStockTake(params: {
    performedBy: string;
    approvedBy: string;
    items: Array<{
      ingredientId: string;
      physicalQuantity: number;
      reason?: string;
    }>;
    notes?: string;
  }): StockTake {
    const ingredients = this.getIngredients();
    const takeNumber = `TAKE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;

    let totalSystemVal = 0;
    let totalActualVal = 0;

    const stockTakeItems = params.items.map((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) throw new Error(`Ingredient ${item.ingredientId} not found`);

      const sysQty = ing.currentQuantity;
      const physQty = Number(item.physicalQuantity);
      const diff = Number((physQty - sysQty).toFixed(3));
      const discCost = Number((diff * ing.costPerUnit).toFixed(2));

      totalSystemVal += sysQty * ing.costPerUnit;
      totalActualVal += physQty * ing.costPerUnit;

      // Adjust actual ingredient stock to physical count
      ing.currentQuantity = physQty;
      ing.stockStatus = this.calculateStockStatus(physQty, ing.minimumQuantity);
      ing.totalValue = Number((physQty * ing.costPerUnit).toFixed(2));
      ing.updatedAt = new Date().toISOString();

      // Record STOCK_ADJUSTMENT movement if difference != 0
      if (diff !== 0) {
        this.recordStockMovement({
          ingredientId: ing.id,
          ingredientName: ing.name,
          quantity: diff,
          unit: ing.unit,
          movementType: 'STOCK_ADJUSTMENT',
          reference: takeNumber,
          reason: `Physical count adjustment (${diff > 0 ? '+' : ''}${diff} ${ing.unit}). Reason: ${item.reason || 'Variance reconciliation'}`,
          actorName: params.approvedBy,
        });
      }

      return {
        ingredientId: ing.id,
        ingredientName: ing.name,
        systemQuantity: sysQty,
        physicalQuantity: physQty,
        difference: diff,
        unit: ing.unit,
        costPerUnit: ing.costPerUnit,
        discrepancyCost: discCost,
        reason: item.reason,
      };
    });

    const newTake: StockTake = {
      id: `take-${Date.now()}`,
      restaurantId: RESTAURANT_ID,
      takeNumber,
      status: 'COMPLETED',
      performedBy: params.performedBy,
      approvedBy: params.approvedBy,
      totalSystemValue: Number(totalSystemVal.toFixed(2)),
      totalActualValue: Number(totalActualVal.toFixed(2)),
      discrepancyValue: Number((totalActualVal - totalSystemVal).toFixed(2)),
      notes: params.notes,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      items: stockTakeItems,
    };

    const takes = this.getStockTakes();
    takes.unshift(newTake);

    localStorage.setItem(STORAGE_KEYS.STOCK_TAKES, JSON.stringify(takes));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));

    this.notifyListeners();
    return newTake;
  }

  // ---------------------------------------------------------------------------
  // METRICS & ANALYTICS
  // ---------------------------------------------------------------------------
  public getDashboardMetrics(): InventoryDashboardMetrics {
    const ingredients = this.getIngredients();
    const batches = this.getBatches();
    const pos = this.getPurchaseOrders();
    const wastage = this.getWastageRecords();
    const movements = this.getStockMovements();

    const totalValue = ingredients.reduce((sum, i) => sum + i.totalValue, 0);
    const lowStock = ingredients.filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'CRITICAL').length;
    const outOfStock = ingredients.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;

    const expiringBatches = batches.filter((b) => b.isExpiringSoon && b.remainingQuantity > 0).length;
    const expiredBatches = batches.filter((b) => b.isExpired && b.remainingQuantity > 0).length;

    // Today's wastage (last 24 hours)
    const today = new Date().toISOString().slice(0, 10);
    const todaysWastage = wastage
      .filter((w) => w.createdAt.startsWith(today))
      .reduce((sum, w) => sum + w.estimatedCost, 0);

    const weeklyWastage = wastage.reduce((sum, w) => sum + w.estimatedCost, 0);
    const pendingPOs = pos.filter((p) => p.status === 'SUBMITTED' || p.status === 'APPROVED' || p.status === 'ORDERED').length;

    return {
      totalIngredients: ingredients.length,
      totalInventoryValue: Math.round(totalValue),
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      expiringSoonCount: expiringBatches,
      expiredCount: expiredBatches,
      todaysWastageValue: Math.round(todaysWastage),
      weeklyWastageValue: Math.round(weeklyWastage),
      monthlyWastageValue: Math.round(weeklyWastage * 3.2),
      pendingPurchasesCount: pendingPOs,
      recentMovementsCount: movements.length,
    };
  }

  public getMenuProfitability(orders: Order[] = []): MenuProfitabilityItem[] {
    const recipes = this.getRecipes();

    return recipes.map((recipe) => {
      // Calculate total units sold from orders
      let soldCount = 0;
      orders.forEach((o) => {
        o.items.forEach((item) => {
          if (item.menuItemId === recipe.menuItemId) {
            soldCount += item.quantity || 1;
          }
        });
      });

      // Default baseline sold count for demo analytics if no orders yet
      if (soldCount === 0) {
        soldCount = recipe.menuItemId === 'wings-korean' ? 42 : recipe.menuItemId === 'wings-firecracker' ? 36 : 22;
      }

      const sellingPrice = recipe.sellingPrice || 250;
      const foodCost = recipe.totalFoodCost;
      const margin = sellingPrice - foodCost;
      const foodCostPct = Number(((foodCost / sellingPrice) * 100).toFixed(1));
      const revenue = soldCount * sellingPrice;
      const totalMargin = soldCount * margin;

      return {
        menuItemId: recipe.menuItemId,
        name: recipe.name,
        category: 'Wings',
        sellingPrice,
        foodCost,
        estimatedGrossMargin: margin,
        foodCostPercentage: foodCostPct,
        ordersCount: soldCount,
        totalRevenue: revenue,
        totalEstimatedMargin: totalMargin,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // PART 21: AI PURCHASE SUGGESTIONS
  // ---------------------------------------------------------------------------
  public getPurchaseSuggestions(): PurchaseSuggestion[] {
    const ingredients = this.getIngredients();
    const suggestions: PurchaseSuggestion[] = [];

    ingredients.forEach((ing) => {
      if (ing.currentQuantity <= ing.minimumQuantity) {
        // Average daily rate estimate
        const estimatedDailyUse = Math.max(1, Math.round(ing.minimumQuantity / 3));
        const needed = ing.minimumQuantity - ing.currentQuantity;
        const suggestedQty = Math.ceil(needed + estimatedDailyUse * 3);
        const estCost = Math.round(suggestedQty * ing.costPerUnit);

        suggestions.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          currentQuantity: ing.currentQuantity,
          minimumQuantity: ing.minimumQuantity,
          unit: ing.unit,
          recentAvgDailyConsumption: estimatedDailyUse,
          suggestedQuantity: suggestedQty,
          estimatedCost: estCost,
          reason: `Stock is at ${ing.currentQuantity} ${ing.unit} (below minimum ${ing.minimumQuantity} ${ing.unit}). Suggested quantity covers safety buffer + 3 days consumption.`,
          supplierId: ing.supplierId,
          supplierName: ing.supplierName,
        });
      }
    });

    return suggestions;
  }

  // ---------------------------------------------------------------------------
  // PART 32: AUTO MENU AVAILABILITY TOGGLE
  // ---------------------------------------------------------------------------
  public getAutoMenuAvailability(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.AUTO_AVAILABILITY) === 'true';
  }

  public setAutoMenuAvailability(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTO_AVAILABILITY, enabled ? 'true' : 'false');
    this.notifyListeners();
  }
}

export const inventoryService = new InventoryService();
