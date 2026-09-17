// ==============================================================================
// KINGS OF WINGS — RESTAURANT BUSINESS INTELLIGENCE & FORECASTING TYPES
// ==============================================================================

import { PaymentMethod, TableStatus, WastageReason } from '../../types';

export type AnalyticsDateRangePreset = 
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'CUSTOM_RANGE';

export interface DateInterval {
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string;
  label: string;
}

export interface MetricComparison<T = number> {
  current: T;
  previous: T;
  delta: number;
  percentChange: number | null; // null if previous is 0
  isIncreaseFavorable?: boolean;
}

// -------------------------------------------------------------------
// 1. TOP-LEVEL OPERATIONAL & FINANCIAL KPIS
// -------------------------------------------------------------------

export interface TopLevelKPIs {
  revenue: MetricComparison<number>; // Gross Sales
  netSales: MetricComparison<number>;
  orders: MetricComparison<number>;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: MetricComparison<number>;
  totalItemsSold: MetricComparison<number>;
  customersCount: MetricComparison<number>;
  tableUtilizationPct: MetricComparison<number>;
  foodCostPct: MetricComparison<number>;
  estimatedGrossMargin: MetricComparison<number>;
  grossMarginPct: MetricComparison<number>;
  wastageValue: MetricComparison<number>;
  wastageQuantity: MetricComparison<number>;
  paymentSuccessRate: MetricComparison<number>;
}

// -------------------------------------------------------------------
// 2. REVENUE ANALYTICS
// -------------------------------------------------------------------

export interface RevenueBreakdown {
  grossSales: number;
  discounts: number;
  tax: number;
  serviceCharge: number;
  netSales: number;
  refunds: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface DailyRevenuePoint {
  date: string;
  dayLabel: string;
  grossSales: number;
  netSales: number;
  tax: number;
  discounts: number;
  orderCount: number;
}

export interface HourlyRevenuePoint {
  hour: string; // e.g. "12:00", "13:00"
  hourNum: number;
  orderCount: number;
  grossSales: number;
  netSales: number;
  avgOrderValue: number;
}

export interface CategoryRevenuePoint {
  category: string;
  orderCount: number;
  quantitySold: number;
  revenue: number;
  percentageOfTotal: number;
}

export interface TableRevenuePoint {
  tableNumber: string;
  zone: string;
  sessionCount: number;
  orderCount: number;
  revenue: number;
  avgSpendPerSession: number;
}

export interface PaymentMethodRevenuePoint {
  method: PaymentMethod;
  transactionCount: number;
  totalCollected: number;
  successCount: number;
  failedCount: number;
  refundedAmount: number;
  percentageOfRevenue: number;
}

export interface RevenueAnalyticsData {
  breakdown: RevenueBreakdown;
  byDay: DailyRevenuePoint[];
  byHour: HourlyRevenuePoint[];
  byCategory: CategoryRevenuePoint[];
  byTable: TableRevenuePoint[];
  byPaymentMethod: PaymentMethodRevenuePoint[];
}

// -------------------------------------------------------------------
// 3. ORDER ANALYTICS
// -------------------------------------------------------------------

export interface OrderAnalyticsData {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  averageItemsPerOrder: number;
  averageOrderValue: number;
  ordersPerHourAvg: number;
  peakHour: string;
  peakHourOrderCount: number;
  ordersByHour: HourlyRevenuePoint[];
  ordersByDay: DailyRevenuePoint[];
  ordersByCategory: CategoryRevenuePoint[];
  repeatSessionPercentage: number;
}

// -------------------------------------------------------------------
// 4. MENU PERFORMANCE & 2x2 MENU MATRIX
// -------------------------------------------------------------------

export type MenuMatrixQuadrant = 
  | 'STARS'         // High Demand, High Profitability
  | 'PLOWHORSES'    // High Demand, Low Profitability (Workhorses)
  | 'PUZZLES'       // Low Demand, High Profitability (Opportunities)
  | 'DOGS';         // Low Demand, Low Profitability (Underperformers)

export interface MenuItemPerformance {
  menuItemId: string;
  name: string;
  category: string;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
  averageSellingPrice: number;
  ingredientCost: number; // Food cost per portion
  estimatedGrossMargin: number; // selling price - ingredient cost
  foodCostPercentage: number; // (ingredientCost / sellingPrice) * 100
  totalFoodCost: number;
  totalGrossMargin: number;
  cancellationCount: number;
  isAvailable: boolean;
  stockoutMinutes: number;
  // Matrix placement
  quadrant: MenuMatrixQuadrant;
  demandScore: number; // relative to median demand
  profitabilityScore: number; // relative to target margin
}

export type MenuSortView = 
  | 'TOP_SELLERS'
  | 'HIGH_REVENUE'
  | 'HIGH_MARGIN'
  | 'LOW_MARGIN'
  | 'LOW_DEMAND'
  | 'HIGH_WASTAGE_IMPACT';

export interface MenuMatrixConfig {
  demandMedianThreshold: number; // units sold threshold for "high demand"
  marginPercentageThreshold: number; // gross margin % threshold for "high margin" (e.g. 70%)
}

export interface MenuAnalyticsData {
  items: MenuItemPerformance[];
  matrixConfig: MenuMatrixConfig;
  quadrantCounts: Record<MenuMatrixQuadrant, number>;
  categoryBreakdown: CategoryRevenuePoint[];
  totalMenuRevenue: number;
  overallFoodCostPercentage: number;
}

// -------------------------------------------------------------------
// 5. KITCHEN ANALYTICS & BOTTLENECK DETECTION
// -------------------------------------------------------------------

export interface KDSStepDuration {
  stage: 'LOCKED' | 'ASSIGNED' | 'COOKING' | 'SAUCING' | 'READY' | 'DELIVERED';
  label: string;
  averageDurationSeconds: number;
  targetDurationSeconds: number;
  isDelayed: boolean;
}

export interface KitchenStationMetrics {
  station: string;
  ticketsCount: number;
  averagePrepSeconds: number;
  medianPrepSeconds: number;
  delayedTicketsCount: number;
  delayedPercentage: number;
  utilizationPercentage: number;
}

export interface KitchenBottleneckHypothesis {
  station: string;
  observedDifferenceMinutes: number;
  currentAverageMinutes: number;
  previousAverageMinutes: number;
  supportedHypotheses: Array<{
    cause: 'HIGHER_TICKET_VOLUME' | 'STAFFING_VARIATION' | 'MENU_MIX_SPICY_WINGS' | 'VAT_EQUIPMENT_LOAD';
    description: string;
    supportingMetric: string;
  }>;
  actionRecommendation: string;
}

export interface KitchenAnalyticsData {
  averagePrepTimeMinutes: number;
  medianPrepTimeMinutes: number;
  totalTicketsCompleted: number;
  ticketsPerHourAverage: number;
  currentQueueLength: number;
  stageDurations: KDSStepDuration[];
  stations: KitchenStationMetrics[];
  delayedTicketsCount: number;
  delayedTicketsPercentage: number;
  peakKitchenPeriod: string;
  bottlenecks: KitchenBottleneckHypothesis[];
}

// -------------------------------------------------------------------
// 6. TABLE & DINING ROOM ANALYTICS
// -------------------------------------------------------------------

export interface TablePerformanceMetric {
  tableNumber: string;
  zone: string;
  capacity: number;
  sessionsCount: number;
  totalRevenue: number;
  totalOrders: number;
  averageSessionMinutes: number;
  turnoverRate: number; // sessions per operating day
  utilizationRate: number; // % of open hours occupied
  revenuePerAvailableSeatHour: number; // RevPASH
  status: TableStatus;
}

export interface TableAnalyticsData {
  averageTableUtilizationPct: number;
  totalSessionsCount: number;
  averageSessionDurationMinutes: number;
  averageOrderValuePerTable: number;
  averageOrdersPerTable: number;
  averageTurnoverRate: number;
  peakOccupancyPeriod: string;
  zoneBreakdown: Array<{
    zone: string;
    tableCount: number;
    sessionsCount: number;
    revenue: number;
    avgUtilizationPct: number;
  }>;
  tables: TablePerformanceMetric[];
}

// -------------------------------------------------------------------
// 7. SERVICE REQUEST ANALYTICS
// -------------------------------------------------------------------

export interface ServiceRequestTypeStat {
  type: string;
  label: string;
  count: number;
  resolvedCount: number;
  unresolvedCount: number;
  averageResolutionSeconds: number;
  percentageOfTotal: number;
}

export interface ServiceAnalyticsData {
  totalRequests: number;
  requestsPerHourAverage: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  averageResolutionTimeMinutes: number;
  unresolvedPercentage: number;
  peakRequestPeriod: string;
  byType: ServiceRequestTypeStat[];
  hourlyVolume: Array<{ hour: string; count: number }>;
}

// -------------------------------------------------------------------
// 8. INVENTORY, WASTAGE & PROCUREMENT ANALYTICS
// -------------------------------------------------------------------

export interface WastageReasonStat {
  reason: WastageReason;
  label: string;
  quantity: number;
  value: number;
  percentageOfWastageValue: number;
}

export interface WastageIngredientStat {
  ingredientId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  value: number;
}

export interface InventoryAnalyticsData {
  totalInventoryValuation: number;
  consumptionValue: number;
  purchaseValue: number;
  totalWastageValue: number;
  totalWastageQuantity: number;
  /**
   * Wastage percentage calculation formula:
   * (Wastage Value / (Cost of Goods Consumed + Wastage Value)) * 100
   */
  wastagePercentage: number;
  stockoutEventsCount: number;
  lowStockEventsCount: number;
  expiryLossesValue: number;
  foodCostValue: number;
  foodCostPercentageOfSales: number;
  consumptionTrends: Array<{ date: string; value: number; quantity: number }>;
  inventoryValueTrend: Array<{ date: string; value: number }>;
  wastageByReason: WastageReasonStat[];
  topWastedIngredients: WastageIngredientStat[];
}

export interface SupplierSpendStat {
  supplierId: string;
  name: string;
  ordersCount: number;
  totalSpend: number;
  averageDeliveryLeadDays: number;
  lateDeliveriesCount: number;
  partialDeliveriesCount: number;
  onTimeDeliveryRate: number;
}

export interface ProcurementAnalyticsData {
  totalPurchaseOrdersCount: number;
  totalPurchaseSpend: number;
  activeSuppliersCount: number;
  averageDeliveryLeadDays: number;
  lateDeliveriesCount: number;
  partialDeliveriesCount: number;
  supplierPerformance: SupplierSpendStat[];
  frequentlyPurchasedIngredients: Array<{
    name: string;
    category: string;
    totalQuantity: number;
    unit: string;
    totalSpend: number;
  }>;
}

// -------------------------------------------------------------------
// 9. CUSTOMER BEHAVIOR & ORDER COMBINATIONS
// -------------------------------------------------------------------

export interface OrderCombinationItem {
  combinationId: string;
  itemNames: string[];
  ordersCount: number;
  percentageOfQualifyingOrders: number;
  totalCombinationRevenue: number;
  sampleSizeOrders: number;
}

export interface CustomerBehaviorAnalyticsData {
  averagePartySize: number;
  spendByPartySize: Array<{ partySize: number; sessionCount: number; avgSpend: number }>;
  averageItemsPerSession: number;
  peakOrderingTime: string;
  topCombinations: OrderCombinationItem[];
  repeatSessionsCount: number;
  repeatSessionPercentage: number;
}

// -------------------------------------------------------------------
// 10. DEMAND FORECASTING & VALIDATION
// -------------------------------------------------------------------

export type ForecastHorizon = 'NEXT_DAY' | 'NEXT_7_DAYS' | 'NEXT_30_DAYS';

export type ForecastingMethod = 
  | '7_DAY_WEIGHTED_MOVING_AVG'
  | 'EXPONENTIAL_SMOOTHING'
  | 'DOW_SEASONAL_PROFILE'
  | 'LINEAR_TREND';

export type ForecastConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';

export interface ForecastValidationMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error (%)
  evaluationPeriod: string;
  backtestObservationsCount: number;
}

export interface DailyForecastPoint {
  date: string;
  dayName: string;
  predictedOrders: number;
  predictedRevenue: number;
  lowerBoundOrders: number;
  upperBoundOrders: number;
}

export interface HourlyForecastPoint {
  hour: string;
  hourNum: number;
  predictedOrders: number;
  isLunchRush: boolean;
  isDinnerRush: boolean;
}

export interface MenuItemForecast {
  menuItemId: string;
  name: string;
  category: string;
  historicalDailyAvg: number;
  nextDayForecast: number;
  next7DaysForecast: number;
  confidence: ForecastConfidenceLevel;
  supportingObservationsCount: number;
}

export interface IngredientRequirementForecast {
  ingredientId: string;
  name: string;
  unit: string;
  currentOnHandStock: number;
  expectedRequirement: number; // Derived from forecast units * BOM per recipe
  potentialShortage: number; // requirement - onHandStock (if positive)
  safetyParLevel: number;
  hasShortageRisk: boolean;
  estimatedReplenishCost: number;
}

export interface StaffingInsight {
  timeWindow: string;
  projectedOrdersPerHour: number;
  historicalPrepTimeVariancePct: number;
  observationSummary: string;
  operationalRecommendation: string;
}

export interface RestaurantForecastData {
  horizon: ForecastHorizon;
  methodUsed: ForecastingMethod;
  methodDisplayName: string;
  confidenceLevel: ForecastConfidenceLevel;
  historicalObservationsDays: number;
  hasEnoughData: boolean;
  insufficientDataReason?: string;
  nextDayOrders: number;
  nextDayRevenue: number;
  forecastPoints: DailyForecastPoint[];
  hourlyDemandProfile: HourlyForecastPoint[];
  menuItemForecasts: MenuItemForecast[];
  ingredientRequirements: IngredientRequirementForecast[];
  staffingInsights: StaffingInsight[];
  validationMetrics?: ForecastValidationMetrics;
}

// -------------------------------------------------------------------
// 11. COMPREHENSIVE BUSINESS REPORT
// -------------------------------------------------------------------

export type BusinessReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface BusinessReportData {
  reportType: BusinessReportType;
  restaurantName: string;
  periodLabel: string;
  dateRange: { start: string; end: string };
  generatedAt: string;
  generatedBy: string;
  executiveSummary: {
    revenue: number;
    netSales: number;
    ordersCount: number;
    aov: number;
    itemsSold: number;
    foodCostPct: number;
    grossMarginPct: number;
    wastageLoss: number;
  };
  revenueSection: RevenueBreakdown;
  orderSection: OrderAnalyticsData;
  topMenuItems: MenuItemPerformance[];
  kitchenSection: KitchenAnalyticsData;
  tableSection: TableAnalyticsData;
  inventorySection: InventoryAnalyticsData;
  procurementSection: ProcurementAnalyticsData;
  forecastSection: RestaurantForecastData;
  aiObservations: string[];
}

// -------------------------------------------------------------------
// 12. FULL MASTER RESTAURANT ANALYTICS PAYLOAD
// -------------------------------------------------------------------

export interface CompleteAnalyticsPayload {
  restaurantId: string;
  dateRangePreset: AnalyticsDateRangePreset;
  currentInterval: DateInterval;
  comparisonInterval: DateInterval;
  isDemoData: boolean;
  hasEnoughData: boolean;
  insufficientDataNotice?: string;
  kpis: TopLevelKPIs;
  revenue: RevenueAnalyticsData;
  orders: OrderAnalyticsData;
  menu: MenuAnalyticsData;
  kitchen: KitchenAnalyticsData;
  tables: TableAnalyticsData;
  service: ServiceAnalyticsData;
  inventory: InventoryAnalyticsData;
  procurement: ProcurementAnalyticsData;
  customerBehavior: CustomerBehaviorAnalyticsData;
  forecast: RestaurantForecastData;
}
