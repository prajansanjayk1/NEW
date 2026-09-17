export type HeatLevel = 'MILD' | 'MED' | 'HOT' | 'INSANE';

export interface CustomizationOption {
  portionSize: '6 PC' | '10 PC' | '15 PC' | '20 PC Feast';
  portionPriceDelta: number;
  heatLevel: HeatLevel;
  styleCut: 'Classic Bone-In' | 'Boneless Bites';
  styleCutDelta: number;
  dip: 'Cool Ranch' | 'Blue Cheese' | 'Truffle Mayo' | 'Extra Glaze' | 'Ghost Reaper Dip';
  extraNotes?: string;
}

export interface DietaryInfo {
  vegetarian?: boolean;
  vegan?: boolean;
  containsDairy?: boolean;
  containsEgg?: boolean;
  containsGluten?: boolean;
  containsNuts?: boolean;
  containsSoy?: boolean;
  allergens?: string[];
  verifiedByRestaurant?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Wings' | 'Combos' | 'Burgers' | 'Sides' | 'Dips' | 'Drinks';
  description: string;
  price: number; // in INR (default / dine-in)
  dineInPrice?: number;
  takeawayPrice?: number;
  availableDineIn?: boolean;
  availableTakeaway?: boolean;
  packagingCharge?: number;
  image: string;
  heatFlames: number; // 0 to 5
  scovilleShu?: number;
  badges?: string[];
  tags?: string[];
  isHouseIcon?: boolean;
  prepTimeMinutes: number;
  available: boolean;
  dietary?: DietaryInfo;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  image: string;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  customization: CustomizationOption;
  addedBy: string;
  participantId?: string;
  addedAt?: string;
}

// -------------------------------------------------------------------
// RESTAURANT & TABLE SESSION ARCHITECTURE (PHASE 2)
// -------------------------------------------------------------------

export type SessionStatus = 
  | 'LOBBY' 
  | 'ACTIVE' 
  | 'ORDERING' 
  | 'KITCHEN_PROCESSING' 
  | 'BILLING' 
  | 'CLOSED' 
  | 'EXPIRED';

export type TableStatus = 
  | 'AVAILABLE' 
  | 'OCCUPIED' 
  | 'ORDERING' 
  | 'DINING' 
  | 'BILL_REQUESTED' 
  | 'CLEANING' 
  | 'CLOSED';

export type UserRole = 'CUSTOMER' | 'STAFF' | 'KITCHEN' | 'MANAGER' | 'ADMIN';

export type SessionParticipantRole = 'HOST' | 'GUEST';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  branch: string;
  address: string;
  phone?: string;
  email?: string;
  wifiSsid: string;
  wifiPassword?: string;
  organizationId?: string;
  status?: import('./types/saas').RestaurantStatus;
  legalName?: string;
  coverImage?: string;
  city?: string;
  state?: string;
  country?: string;
  branding?: import('./types/saas').RestaurantBranding;
  operatingHours?: import('./types/saas').OperatingHours;
  taxConfiguration?: import('./types/saas').TaxConfiguration;
  settings: {
    gstPercent: number;
    allowEqualSplit: boolean;
    allowItemSplit: boolean;
    requireHostApproval: boolean;
  };
}

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  zone: string;
  status: TableStatus;
  currentSessionId?: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  displayName: string;
  avatarEmoji: string;
  initials: string;
  color: string;
  role: SessionParticipantRole;
  joinedAt: string;
  isActive: boolean;
  isCurrentDevice?: boolean;
  itemCount: number;
}

export interface TableSession {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  sessionToken: string;
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
  participants: SessionParticipant[];
  currentOrderIds: string[];
}

export type TableSessionEventType =
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_LEFT'
  | 'CART_UPDATED'
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_STARTED'
  | 'ORDER_READY'
  | 'ORDER_DELIVERED'
  | 'SERVICE_REQUEST_CREATED'
  | 'SERVICE_REQUEST_ACKNOWLEDGED'
  | 'SERVICE_REQUEST_RESOLVED'
  | 'BILL_REQUESTED'
  | 'SESSION_STATUS_CHANGED'
  | 'SESSION_CLOSED';

export interface TableSessionEvent {
  id: string;
  sessionId: string;
  type: TableSessionEventType;
  actorId: string;
  actorName: string;
  timestamp: string;
  payload?: any;
}

// -------------------------------------------------------------------
// ORDER & KITCHEN TICKET MODEL
// -------------------------------------------------------------------

export type OrderStatus = 'LOCKED' | 'ASSIGNED' | 'COOKING' | 'SAUCING' | 'READY' | 'DELIVERED';

export type OrderChannel = 'DINE_IN' | 'TAKEAWAY' | 'PICKUP';

export type TakeawayStatus = 
  | 'ORDER_RECEIVED' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'READY_FOR_PICKUP' 
  | 'PICKED_UP' 
  | 'CANCELLED';

export interface Order {
  id: string;
  restaurantId?: string;
  ticketNumber: string;
  tableNumber: string;
  section: string;
  status: OrderStatus;
  station: string;
  pitmaster: string;
  oilTempF: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  estServeMinutes: number;
  sharedCrewCount: number;
  placedByParticipantId?: string;
  placedByParticipantName?: string;
  channel?: OrderChannel;
  takeawayOrderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string;
  packagingCharge?: number;
  takeawayStatus?: TakeawayStatus;
  pickupNotes?: string;
  paymentMethod?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
}

// -------------------------------------------------------------------
// SERVICE REQUESTS MODEL
// -------------------------------------------------------------------

export type ServiceRequestType = 
  | 'WAITER' 
  | 'WATER' 
  | 'CUTLERY' 
  | 'NAPKINS' 
  | 'TISSUES'
  | 'CLEAN_TABLE'
  | 'EXTRA_SAUCE' 
  | 'BILL' 
  | 'ASSISTANCE';

export type ServiceRequestStatus = 
  | 'REQUESTED' 
  | 'ACKNOWLEDGED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

export interface ServiceRequest {
  id: string;
  tableNumber: string;
  title: string;
  description: string;
  type: ServiceRequestType;
  icon: string;
  status: ServiceRequestStatus;
  requestedAt: string;
  requestedByParticipantId?: string;
  requestedByParticipantName?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// -------------------------------------------------------------------
// BILLING & SPLITTING MODEL
// -------------------------------------------------------------------

export type BillSplitMode = 'FULL_BILL' | 'EQUAL_SPLIT' | 'ITEM_SPLIT' | 'CUSTOM_SPLIT';

export type BillStatus = 'OPEN' | 'PAYMENT_PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';

export interface BillParticipantShare {
  participantId: string;
  participantName: string;
  avatarEmoji: string;
  itemCount: number;
  itemSubtotal: number; // in major units (INR)
  taxShare: number; // in major units (INR)
  totalShare: number; // in major units (INR)
  itemSubtotal_minor?: number; // in paise
  taxShare_minor?: number; // in paise
  totalShare_minor?: number; // in paise
  shareAmount?: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  orderedItems: CartItem[];
  items?: any[];
}

export interface BillItemSnapshot {
  id: string;
  menuItemId?: string;
  name: string;
  unitPrice_minor: number;
  quantity: number;
  totalPrice_minor: number;
  participantId?: string;
  participantName?: string;
  customizations?: Record<string, any>;
}

export interface Bill {
  id: string;
  restaurantId?: string;
  sessionId: string;
  ticketNumber: string;
  tableNumber: string;
  splitMode: BillSplitMode;
  
  // Minor units (authoritative paise)
  subtotal_minor?: number;
  tax_minor?: number;
  discount_minor?: number;
  service_charge_minor?: number;
  total_minor?: number;
  amount_paid_minor?: number;
  amount_due_minor?: number;

  // Major units for view convenience
  subtotal: number;
  tax: number;
  discount?: number;
  serviceCharge?: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;

  shares: BillParticipantShare[];
  itemsSnapshot?: BillItemSnapshot[];
  paymentStatus: BillStatus | 'UNPAID' | 'PROCESSING';
  isLocked?: boolean;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RefundRecord {
  id: string;
  restaurantId: string;
  billId: string;
  paymentId: string;
  amount_minor: number;
  amount: number;
  currency: string;
  reason: string;
  requestedBy: string;
  processedBy: string;
  providerRefundId?: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  orderId?: string; // provider order ID (e.g. Razorpay order_*)
  billId: string;
  restaurantId: string;
  participantId?: string;
  amount_minor: number;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'DEMO' | 'CASH';
  mode: 'LIVE' | 'DEMO';
  providerKeyId?: string;
  clientSecret?: string;
  status: 'CREATED' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
}

export interface DailyPaymentSummary {
  totalSales_minor: number;
  successfulPaymentsCount: number;
  successfulAmount_minor: number;
  pendingAmount_minor: number;
  failedPaymentsCount: number;
  refundsCount: number;
  refundsAmount_minor: number;
  netCollected_minor: number;
  methodBreakdown: Record<PaymentMethod, number>;
}

export interface PaymentReconciliation {
  billId: string;
  ticketNumber: string;
  tableNumber: string;
  expectedTotal_minor: number;
  collectedAmount_minor: number;
  dueAmount_minor: number;
  refundedAmount_minor: number;
  status: 'RECONCILED' | 'PAYMENT_MISMATCH';
  difference_minor: number;
  paymentCount: number;
  refundCount: number;
}

// Backward compatibility with Phase 1 types
export interface CrewMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  isHost?: boolean;
  itemCount: number;
  avatarEmoji?: string;
}

export type AppScreen = 'WELCOME' | 'MENU' | 'TRACKER' | 'KITCHEN';

// -------------------------------------------------------------------
// PHASE 3 BACKEND & RELATIONAL DATA ARCHITECTURE
// -------------------------------------------------------------------

export type BackendMode = 'REAL_BACKEND' | 'DEMO_MODE';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItemOption {
  id: string;
  menuItemId: string;
  optionType: 'PORTION' | 'HEAT' | 'STYLE' | 'DIP' | 'EXTRA';
  name: string;
  priceDelta: number; // in INR
  isDefault: boolean;
  sortOrder: number;
}

export interface StaffProfile {
  id: string;
  restaurantId: string;
  userId?: string;
  displayName: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  lastActive?: string;
}

export type StaffPortalTab = 
  | 'OVERVIEW'
  | 'ORDERS'
  | 'KITCHEN'
  | 'TABLES'
  | 'SERVICE'
  | 'TAKEAWAY_QUEUE'
  | 'TAKEAWAY_MENU'
  | 'INVENTORY'
  | 'RECIPES'
  | 'MENU'
  | 'TEAM'
  | 'ANALYTICS'
  | 'BILLING'
  | 'SETTINGS'
  | 'AI_COPILOT'
  | 'PLATFORM'
  | 'READINESS'
  | 'CHECKLIST';

// Export SaaS & Multi-Tenant Types (Phase 9)
export * from './types/saas';

// Export AI System Types (Phase 6)
export * from './types/ai';

// Export Inventory & Recipe Costing Types (Phase 7)
export * from './types/inventory';

// Export Advanced Analytics & Business Intelligence Types (Phase 8)
export * from './services/analytics/analyticsTypes';

export interface OperationsMetrics {
  todaysSales: number;
  totalOrdersCount: number;
  activeTablesCount: number;
  totalTablesCount: number;
  averageOrderValue: number;
  openServiceRequestsCount: number;
  kitchenQueueCount: number;
}

export interface PopularMenuItemStat {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
}

export interface HourlyOrderStat {
  hour: string;
  orderCount: number;
  revenue: number;
}

export interface TableUtilizationStat {
  tableNumber: string;
  zone: string;
  capacity: number;
  sessionCount: number;
  totalRevenue: number;
  avgDiningMinutes: number;
  currentStatus: TableStatus;
}

export interface AnalyticsData {
  timeRange: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME';
  hasEnoughData: boolean;
  metrics: {
    grossSales: number;
    discounts: number;
    tax: number;
    serviceCharge: number;
    netCollected: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
    averagePrepTimeMinutes: number;
  };
  popularItems: PopularMenuItemStat[];
  hourlyOrders: HourlyOrderStat[];
  tableUtilization: TableUtilizationStat[];
}

export type KitchenTicketPriority = 'LOW' | 'NORMAL' | 'RUSH' | 'VIP';

export interface KitchenTicket {
  id: string;
  restaurantId: string;
  orderId: string;
  ticketNumber: string;
  station: string;
  priority: KitchenTicketPriority;
  status: OrderStatus;
  assignedTo?: string;
  startedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'UPI' | 'CARD' | 'CASH' | 'WALLET';
export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  restaurantId: string;
  billId: string;
  participantId?: string;
  participantName?: string;
  paymentMethod: PaymentMethod;
  amount_minor: number; // in paise
  amount: number; // in INR (major)
  currency: string;
  transactionReference: string;
  status: PaymentStatus;
  provider: 'RAZORPAY' | 'DEMO' | 'CASH' | string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  failureReason?: string;
  verifiedAt?: string;
  metadata?: Record<string, any>;
  refundedAmount_minor?: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  restaurantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BackendStatusInfo {
  mode: BackendMode;
  connectionStatus: ConnectionStatus;
  provider: 'SUPABASE' | 'DEMO_ENGINE';
  databaseConnected: boolean;
  realtimeConnected: boolean;
  authenticatedStaff?: StaffProfile | null;
}
