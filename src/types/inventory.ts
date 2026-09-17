export type InventoryUnit = 
  | 'g' 
  | 'kg' 
  | 'ml' 
  | 'litre' 
  | 'piece' 
  | 'packet' 
  | 'box' 
  | 'bottle' 
  | 'portion';

export type StockMovementType = 
  | 'PURCHASE'
  | 'SALE_CONSUMPTION'
  | 'WASTAGE'
  | 'DAMAGE'
  | 'SPOILAGE'
  | 'STOCK_ADJUSTMENT'
  | 'RETURN'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'INITIAL_STOCK';

export type WastageReason = 
  | 'SPOILED'
  | 'EXPIRED'
  | 'DAMAGED'
  | 'OVERPRODUCTION'
  | 'PREPARATION_ERROR'
  | 'CUSTOMER_RETURN'
  | 'SPILLAGE'
  | 'OTHER';

export type PurchaseOrderStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type StockTakeStatus = 
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type StockStatus = 
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'CRITICAL'
  | 'OUT_OF_STOCK';

export interface IngredientCategory {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
}

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  paymentTerms: string; // e.g. 'Net 15', 'Net 30', 'COD'
  leadTimeDays?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Ingredient {
  id: string;
  restaurantId: string;
  name: string;
  sku: string;
  category: string;
  unit: InventoryUnit;
  currentQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number;
  maximumQuantity?: number;
  costPerUnit: number; // in INR
  supplierId?: string;
  supplierName?: string;
  storageLocation: string;
  expiryTrackingEnabled: boolean;
  active: boolean;
  stockStatus: StockStatus;
  totalValue: number; // currentQuantity * costPerUnit
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBatch {
  id: string;
  restaurantId: string;
  ingredientId: string;
  ingredientName?: string;
  batchNumber: string;
  initialQuantity: number;
  remainingQuantity: number;
  unit: InventoryUnit;
  costPerUnit: number;
  receivedDate: string;
  expiryDate: string;
  supplierId?: string;
  purchaseOrderId?: string;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'DISPOSED';
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export interface StockMovement {
  id: string;
  restaurantId: string;
  ingredientId: string;
  ingredientName?: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  unit: InventoryUnit;
  movementType: StockMovementType;
  reference?: string; // orderId, poNumber, wastageId
  reason?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
}

export interface RecipeItem {
  id?: string;
  recipeId?: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: InventoryUnit;
  costPerPortion: number;
  notes?: string;
}

export interface Recipe {
  id: string;
  restaurantId: string;
  menuItemId: string;
  name: string;
  description?: string;
  yieldPortions: number;
  prepTimeMinutes: number;
  active: boolean;
  items: RecipeItem[];
  totalFoodCost: number;
  foodCostPercentage?: number; // foodCost / sellingPrice * 100
  estimatedGrossMargin?: number; // sellingPrice - foodCost
  sellingPrice?: number;
}

export interface PurchaseOrderItem {
  id?: string;
  purchaseOrderId?: string;
  ingredientId: string;
  ingredientName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: InventoryUnit;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  restaurantId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  createdBy: string;
  approvedBy?: string;
  orderedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseOrderItem[];
}

export interface WastageRecord {
  id: string;
  restaurantId: string;
  ingredientId: string;
  ingredientName: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  unit: InventoryUnit;
  reason: WastageReason;
  estimatedCost: number;
  staffId: string;
  staffName: string;
  notes?: string;
  createdAt: string;
}

export interface StockTakeItem {
  id?: string;
  stockTakeId?: string;
  ingredientId: string;
  ingredientName: string;
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  unit: InventoryUnit;
  costPerUnit: number;
  discrepancyCost: number;
  reason?: string;
}

export interface StockTake {
  id: string;
  restaurantId: string;
  takeNumber: string;
  status: StockTakeStatus;
  performedBy: string;
  approvedBy?: string;
  totalSystemValue: number;
  totalActualValue: number;
  discrepancyValue: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  items: StockTakeItem[];
}

export interface InventoryDashboardMetrics {
  totalIngredients: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  todaysWastageValue: number;
  weeklyWastageValue: number;
  monthlyWastageValue: number;
  pendingPurchasesCount: number;
  recentMovementsCount: number;
}

export interface MenuProfitabilityItem {
  menuItemId: string;
  name: string;
  category: string;
  sellingPrice: number;
  foodCost: number;
  estimatedGrossMargin: number;
  foodCostPercentage: number;
  ordersCount: number;
  totalRevenue: number;
  totalEstimatedMargin: number;
}

export interface PurchaseSuggestion {
  ingredientId: string;
  ingredientName: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: InventoryUnit;
  recentAvgDailyConsumption: number;
  suggestedQuantity: number;
  estimatedCost: number;
  reason: string;
  supplierId?: string;
  supplierName?: string;
}
