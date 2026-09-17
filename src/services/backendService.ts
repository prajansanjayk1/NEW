import {
  Restaurant,
  RestaurantTable,
  TableSession,
  SessionParticipant,
  SessionStatus,
  TableStatus,
  MenuItem,
  Order,
  OrderStatus,
  CartItem,
  KitchenTicket,
  ServiceRequest,
  ServiceRequestType,
  Bill,
  BillSplitMode,
  BackendStatusInfo,
  PaymentMethod,
  OperationsMetrics,
  AnalyticsData,
  KitchenTicketPriority,
} from '../types';
import { restaurantDataService } from './restaurantDataService';

/**
 * Valid order state transition machine
 * Enforces strict culinary pipeline
 */
const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  LOCKED: ['ASSIGNED', 'COOKING'],
  ASSIGNED: ['COOKING', 'LOCKED'],
  COOKING: ['SAUCING', 'ASSIGNED'],
  SAUCING: ['READY', 'COOKING'],
  READY: ['DELIVERED', 'SAUCING'],
  DELIVERED: [],
};

export const isValidOrderTransition = (current: OrderStatus, next: OrderStatus): boolean => {
  const allowed = VALID_ORDER_TRANSITIONS[current] || [];
  return allowed.includes(next);
};

export const backendService = {
  getBackendStatus(): BackendStatusInfo {
    return restaurantDataService.getBackendStatus();
  },

  async getRestaurant(slug?: string): Promise<Restaurant> {
    return restaurantDataService.getRestaurant();
  },

  async getFloorTables(restaurantId?: string): Promise<RestaurantTable[]> {
    return restaurantDataService.getFloorTables(restaurantId);
  },

  async updateTableFloorStatus(tableId: string, status: TableStatus): Promise<RestaurantTable[]> {
    return restaurantDataService.updateTableFloorStatus(tableId, status);
  },

  async regenerateTableQR(tableId: string): Promise<{ success: boolean; newToken: string }> {
    return restaurantDataService.regenerateTableQR(tableId);
  },

  async validateSession(restaurantSlug: string, sessionToken: string): Promise<{
    isValid: boolean;
    session?: TableSession;
    error?: string;
  }> {
    return restaurantDataService.getTableSession(sessionToken);
  },

  async joinTableSession(
    session: TableSession,
    displayName: string,
    avatarEmoji: string = '🍗'
  ): Promise<{ session: TableSession; participant: SessionParticipant }> {
    return restaurantDataService.joinTableSession(session.sessionToken, displayName, avatarEmoji);
  },

  async updateSessionStatus(session: TableSession, newStatus: SessionStatus): Promise<TableSession> {
    return restaurantDataService.updateSessionStatus(session, newStatus);
  },

  async getMenu(restaurantId?: string): Promise<MenuItem[]> {
    const res = await restaurantDataService.getMenu(restaurantId);
    return res.items;
  },

  async updateMenuItem(itemUpdate: Partial<MenuItem> & { id: string }): Promise<MenuItem[]> {
    return restaurantDataService.updateMenuItem(itemUpdate);
  },

  async createOrder(params: {
    session: TableSession;
    cartItems: CartItem[];
    idempotencyKey?: string;
    specialInstructions?: string;
    placedByParticipantId?: string;
    placedByParticipantName?: string;
  }): Promise<{ success: boolean; order: Order; isDuplicate?: boolean; error?: string }> {
    return restaurantDataService.createOrder(params);
  },

  async getOrders(sessionId?: string, restaurantId?: string): Promise<Order[]> {
    return restaurantDataService.getOrders(sessionId, restaurantId);
  },

  async updateOrderStatus(orderId: string, nextStatus: OrderStatus, staffName: string = 'Staff'): Promise<{ success: boolean; order?: Order; error?: string }> {
    return restaurantDataService.updateOrderStatus(orderId, nextStatus, staffName);
  },

  async getKitchenTickets(restaurantId?: string): Promise<KitchenTicket[]> {
    return restaurantDataService.getKitchenTickets(restaurantId);
  },

  async createServiceRequest(params: {
    tableNumber: string;
    sessionToken?: string;
    type: ServiceRequestType;
    title: string;
    description: string;
    icon: string;
    participantId?: string;
    participantName?: string;
  }): Promise<ServiceRequest> {
    return restaurantDataService.createServiceRequest(params);
  },

  async getServiceRequests(restaurantId?: string, tableNumber?: string): Promise<ServiceRequest[]> {
    return restaurantDataService.getServiceRequests(restaurantId, tableNumber);
  },

  async acknowledgeServiceRequest(requestId: string, staffName: string = 'Floor Captain'): Promise<ServiceRequest | null> {
    return restaurantDataService.acknowledgeServiceRequest(requestId, staffName);
  },

  async resolveServiceRequest(requestId: string, staffName: string = 'Floor Captain'): Promise<ServiceRequest | null> {
    return restaurantDataService.resolveServiceRequest(requestId, staffName);
  },

  async getBillForOrder(order: Order, participants: SessionParticipant[], mode: BillSplitMode = 'ITEM_SPLIT'): Promise<Bill> {
    return restaurantDataService.getBillForOrder(order, participants, mode);
  },

  async recordSharePayment(params: {
    billId: string;
    participantId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  }): Promise<{ success: boolean; bill: Bill }> {
    return restaurantDataService.recordSharePayment(params);
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>, restaurantId?: string): Promise<MenuItem> {
    return restaurantDataService.createMenuItem(item, restaurantId);
  },

  async deleteMenuItem(id: string): Promise<void> {
    return restaurantDataService.deleteMenuItem(id);
  },

  async updateKitchenTicketPriority(ticketId: string, priority: KitchenTicketPriority): Promise<void> {
    return restaurantDataService.updateKitchenTicketPriority(ticketId, priority);
  },

  async getBills(restaurantId?: string): Promise<Bill[]> {
    return restaurantDataService.getBills(restaurantId);
  },

  async updateBillStatus(billId: string, status: 'OPEN' | 'PAYMENT_PENDING' | 'PARTIALLY_PAID' | 'PAID'): Promise<void> {
    return restaurantDataService.updateBillStatus(billId, status);
  },

  async getOperationsMetrics(restaurantId?: string): Promise<OperationsMetrics> {
    return restaurantDataService.getOperationsMetrics(restaurantId);
  },

  async getAnalytics(timeRange: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME', restaurantId?: string): Promise<AnalyticsData> {
    return restaurantDataService.getAnalytics(timeRange, restaurantId);
  },

  async updateRestaurantSettings(settings: Partial<Restaurant>): Promise<Restaurant> {
    return restaurantDataService.updateRestaurantSettings(settings);
  },
};
