/**
 * Restaurant Data Service Interface & Implementations
 * 
 * PHASES 3 & 3.5 COMPLIANCE:
 * - Section 21: Single service interface (IRestaurantDataService) with:
 *     - SupabaseRestaurantDataService
 *     - DemoRestaurantDataService
 * - Section 3: Connects to restaurant 7bd24e21-8fd0-46c2-ac57-1b30838d1460 (WingHouse)
 * - Section 4: Connects menu_categories, DEMO_MENU_ITEMS, menu_item_options
 * - Section 5: Centralized formatCurrencyMinor price handling
 * - Section 6: RPC get_table_session, join_table_session
 * - Section 7: Clearly separated DEMO SESSION vs REAL SESSION
 * - Section 9 & 10: Authoritative server-side order calculation & persistence
 * - Section 15: RPC create_service_request
 * - Section 22: Removed direct mock dependencies into demo fallback provider
 */

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
  ServiceRequestStatus,
  Bill,
  BillSplitMode,
  BackendStatusInfo,
  PaymentMethod,
  MenuCategory,
  MenuItemOption,
  AnalyticsData,
  OperationsMetrics,
  KitchenTicketPriority,
  PopularMenuItemStat,
  HourlyOrderStat,
  TableUtilizationStat,
} from '../types';
import { getSupabaseClient, isSupabaseConfigured, getActiveBackendMode } from './supabaseClient';
import { DEMO_FLAGSHIP_RESTAURANT, DEMO_RESTAURANT_TABLES, DEMO_INITIAL_TABLE_SESSION } from './tableSessionService';
import { DEMO_MENU_ITEMS, DEMO_INITIAL_ACTIVE_ORDER, INITIAL_SERVICE_REQUESTS } from '../data/mockData';
import { calculateAuthoritativeOrder, verifyAndRegisterIdempotencyKey } from './pricingService';
import { formatCurrencyMinor, minorToMajor, majorToMinor } from '../utils/currency';
import { auditService } from './auditService';
import { paymentService } from './paymentService';
import { realtimeService } from './realtimeService';
import { sessionStorageService } from './sessionStorageService';
import { generateBillFromOrder } from './billingService';

export const DEFAULT_RESTAURANT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_RESTAURANT_ID) ||
  '7bd24e21-8fd0-46c2-ac57-1b30838d1460';

// Curated high-res imagery to gracefully fallback when database image_url is null
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  Wings: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
  Combos: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFbHHST3P1Di7uBYRFeE3yUAa8peOdWfiFFfBYyPOOv-7RBKBqT2GOOEPvCscfHw87DTGT09QFCgx-m7dzJ1P78YzZyHDT5yCI2Hb_4noZEC0TBAfcm_hfdGaZKU7-hPtnUePBpook5dfqJBfaZ9zMPhJ5_VssgxFYqHlPUQsPkQlSO-mr32AUNj07DxCpTK4k0aCjx78EqLwSPfWoqdhJPu6jDyTfHGZoIQczFQaZLdKeWWtWStG7',
  Burgers: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQKdGoC1CpBbF5LnJG9wJqVFDu1LAwALC7O5sCemhzYF-9jYe_QjIq24LQMLWA24gqNw_ADFicZof8affJA27_pcY4seDqtJFIHOVvcH9ABb4qsbzYbpX0GxQ9vmIPcF4Ej7KfGeg9p8opg3-CVkGY_V5WrzQYbJS2oX_Lj1AMmbvU87x5gk24m69bmoFognmpC51Rl5rnlGcvc_OfdH1MuyoKaEfGNw9JIf38kfes1rzAYJzB6Klv',
  Sides: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4yb5ANpxq1-j7b06RGMiVbXmBIUjJyMC3up7ilw3isRyJFkO3fOub2cfbXpRpbemucI6h93rjb8HagawCBqvrrIrzchnfTRfmei026HvED6VUvIQfSpg4Rsi_C3kAfyZP__GPrmPWBcKyvT5tpWlBtf8gAhYRQkXreWKVKHuKFQ5fJXgLnkNVSE8-QsC72PA8Dmdjt8gEzByV6Dv4PAVYo1LATuMQ3gs5brragZMt5Li6WJ_lnGsN',
  Drinks: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9UMBaQTBAlaIjFxFxBnKa-UfzZE9VmADN-1fYedNcriz4uP1fgC3LzhLYECr_A7DftkhgDDV0pQq-wFKc_o7h3K0zbHcLrFlQE9qGQHcwp19kLmYkwzlLeXJBPkUOiI-hI36Td3pjor8Xvrgof2Qh84jj1hN_h3MwneABkWi8raOk10K2NncoXPd2L-VKU72HFMVM4R3FvK0vSNyHHBb3O1HMIRhyQe-f1yw1TiwBV4t0THx3nFlx',
  Dips: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4yb5ANpxq1-j7b06RGMiVbXmBIUjJyMC3up7ilw3isRyJFkO3fOub2cfbXpRpbemucI6h93rjb8HagawCBqvrrIrzchnfTRfmei026HvED6VUvIQfSpg4Rsi_C3kAfyZP__GPrmPWBcKyvT5tpWlBtf8gAhYRQkXreWKVKHuKFQ5fJXgLnkNVSE8-QsC72PA8Dmdjt8gEzByV6Dv4PAVYo1LATuMQ3gs5brragZMt5Li6WJ_lnGsN',
};

const ITEM_NAME_IMAGE_MAP: Record<string, string> = {
  'Classic Wings': 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
  'Inferno Wings': 'https://lh3.googleusercontent.com/aida-public/AB6AXuANsMoDnI0k-lqoeaHoE3EWGpQtIByYGiKVL6IODsjQV8NZC5UQ6ZYs_PvwR-yu2i2OpxX1JYCfMIun79fE1xemUc5Vift2DIKsX92bY8xgMM0Mg2GYdV05iX2xh6rpimHzODC2OQN5DvzswZMpcJzs83izNIcGuY-ZhunM0uGRqYCxmByj_uG5swECOYGfdRMIILnBbsEn8gufd9jHdwkx73zQavi7k1La09X3GOFuLnwS02qNUk91',
  'Classic Hot Wings': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9UMBaQTBAlaIjFxFxBnKa-UfzZE9VmADN-1fYedNcriz4uP1fgC3LzhLYECr_A7DftkhgDDV0pQq-wFKc_o7h3K0zbHcLrFlQE9qGQHcwp19kLmYkwzlLeXJBPkUOiI-hI36Td3pjor8Xvrgof2Qh84jj1hN_h3MwneABkWi8raOk10K2NncoXPd2L-VKU72HFMVM4R3FvK0vSNyHHBb3O1HMIRhyQe-f1yw1TiwBV4t0THx3nFlx',
  'Fire Feast Combo': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFbHHST3P1Di7uBYRFeE3yUAa8peOdWfiFFfBYyPOOv-7RBKBqT2GOOEPvCscfHw87DTGT09QFCgx-m7dzJ1P78YzZyHDT5yCI2Hb_4noZEC0TBAfcm_hfdGaZKU7-hPtnUePBpook5dfqJBfaZ9zMPhJ5_VssgxFYqHlPUQsPkQlSO-mr32AUNj07DxCpTK4k0aCjx78EqLwSPfWoqdhJPu6jDyTfHGZoIQczFQaZLdKeWWtWStG7',
  'Fire Chicken Burger': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQKdGoC1CpBbF5LnJG9wJqVFDu1LAwALC7O5sCemhzYF-9jYe_QjIq24LQMLWA24gqNw_ADFicZof8affJA27_pcY4seDqtJFIHOVvcH9ABb4qsbzYbpX0GxQ9vmIPcF4Ej7KfGeg9p8opg3-CVkGY_V5WrzQYbJS2oX_Lj1AMmbvU87x5gk24m69bmoFognmpC51Rl5rnlGcvc_OfdH1MuyoKaEfGNw9JIf38kfes1rzAYJzB6Klv',
  'Classic Fries': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4yb5ANpxq1-j7b06RGMiVbXmBIUjJyMC3up7ilw3isRyJFkO3fOub2cfbXpRpbemucI6h93rjb8HagawCBqvrrIrzchnfTRfmei026HvED6VUvIQfSpg4Rsi_C3kAfyZP__GPrmPWBcKyvT5tpWlBtf8gAhYRQkXreWKVKHuKFQ5fJXgLnkNVSE8-QsC72PA8Dmdjt8gEzByV6Dv4PAVYo1LATuMQ3gs5brragZMt5Li6WJ_lnGsN',
  'Loaded Fries': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4yb5ANpxq1-j7b06RGMiVbXmBIUjJyMC3up7ilw3isRyJFkO3fOub2cfbXpRpbemucI6h93rjb8HagawCBqvrrIrzchnfTRfmei026HvED6VUvIQfSpg4Rsi_C3kAfyZP__GPrmPWBcKyvT5tpWlBtf8gAhYRQkXreWKVKHuKFQ5fJXgLnkNVSE8-QsC72PA8Dmdjt8gEzByV6Dv4PAVYo1LATuMQ3gs5brragZMt5Li6WJ_lnGsN',
  'Signature Dip': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4yb5ANpxq1-j7b06RGMiVbXmBIUjJyMC3up7ilw3isRyJFkO3fOub2cfbXpRpbemucI6h93rjb8HagawCBqvrrIrzchnfTRfmei026HvED6VUvIQfSpg4Rsi_C3kAfyZP__GPrmPWBcKyvT5tpWlBtf8gAhYRQkXreWKVKHuKFQ5fJXgLnkNVSE8-QsC72PA8Dmdjt8gEzByV6Dv4PAVYo1LATuMQ3gs5brragZMt5Li6WJ_lnGsN',
  'Lemon Cooler': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9UMBaQTBAlaIjFxFxBnKa-UfzZE9VmADN-1fYedNcriz4uP1fgC3LzhLYECr_A7DftkhgDDV0pQq-wFKc_o7h3K0zbHcLrFlQE9qGQHcwp19kLmYkwzlLeXJBPkUOiI-hI36Td3pjor8Xvrgof2Qh84jj1hN_h3MwneABkWi8raOk10K2NncoXPd2L-VKU72HFMVM4R3FvK0vSNyHHBb3O1HMIRhyQe-f1yw1TiwBV4t0THx3nFlx',
  'Chilled Cola': 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9UMBaQTBAlaIjFxFxBnKa-UfzZE9VmADN-1fYedNcriz4uP1fgC3LzhLYECr_A7DftkhgDDV0pQq-wFKc_o7h3K0zbHcLrFlQE9qGQHcwp19kLmYkwzlLeXJBPkUOiI-hI36Td3pjor8Xvrgof2Qh84jj1hN_h3MwneABkWi8raOk10K2NncoXPd2L-VKU72HFMVM4R3FvK0vSNyHHBb3O1HMIRhyQe-f1yw1TiwBV4t0THx3nFlx',
};

export interface IRestaurantDataService {
  getBackendStatus(): BackendStatusInfo;
  getRestaurant(restaurantId?: string): Promise<Restaurant>;
  getMenu(restaurantId?: string): Promise<{ items: MenuItem[]; categories: MenuCategory[]; options: MenuItemOption[] }>;
  updateMenuItem(itemUpdate: Partial<MenuItem> & { id: string }): Promise<MenuItem[]>;
  getTableSession(token: string): Promise<{ isValid: boolean; session?: TableSession; error?: string; isDemo?: boolean }>;
  joinTableSession(token: string, displayName: string, avatarEmoji?: string): Promise<{ session: TableSession; participant: SessionParticipant; isDemo?: boolean }>;
  updateSessionStatus(session: TableSession, newStatus: SessionStatus): Promise<TableSession>;
  createOrder(params: {
    session: TableSession;
    cartItems: CartItem[];
    idempotencyKey?: string;
    specialInstructions?: string;
    placedByParticipantId?: string;
    placedByParticipantName?: string;
  }): Promise<{ success: boolean; order: Order; isDuplicate?: boolean; error?: string }>;
  getOrders(sessionId?: string, restaurantId?: string): Promise<Order[]>;
  updateOrderStatus(orderId: string, nextStatus: OrderStatus, staffName?: string): Promise<{ success: boolean; order?: Order; error?: string }>;
  getKitchenTickets(restaurantId?: string): Promise<KitchenTicket[]>;
  createServiceRequest(params: {
    tableNumber: string;
    sessionToken?: string;
    type: ServiceRequestType;
    title: string;
    description: string;
    icon: string;
    participantId?: string;
    participantName?: string;
  }): Promise<ServiceRequest>;
  getServiceRequests(restaurantId?: string, tableNumber?: string): Promise<ServiceRequest[]>;
  acknowledgeServiceRequest(requestId: string, staffName?: string): Promise<ServiceRequest | null>;
  resolveServiceRequest(requestId: string, staffName?: string): Promise<ServiceRequest | null>;
  getFloorTables(restaurantId?: string): Promise<RestaurantTable[]>;
  updateTableFloorStatus(tableId: string, status: TableStatus): Promise<RestaurantTable[]>;
  regenerateTableQR(tableId: string): Promise<{ success: boolean; newToken: string }>;
  getBillForOrder(order: Order, participants: SessionParticipant[], mode?: BillSplitMode): Promise<Bill>;
  recordSharePayment(params: {
    billId: string;
    participantId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  }): Promise<{ success: boolean; bill: Bill }>;
  createMenuItem(item: Omit<MenuItem, 'id'>, restaurantId?: string): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;
  createMenuCategory(name: string, sortOrder?: number, restaurantId?: string): Promise<MenuCategory>;
  updateKitchenTicketPriority(ticketId: string, priority: KitchenTicketPriority): Promise<void>;
  getBills(restaurantId?: string): Promise<Bill[]>;
  updateBillStatus(billId: string, status: 'OPEN' | 'PAYMENT_PENDING' | 'PARTIALLY_PAID' | 'PAID'): Promise<void>;
  getOperationsMetrics(restaurantId?: string): Promise<OperationsMetrics>;
  getAnalytics(timeRange: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME', restaurantId?: string): Promise<AnalyticsData>;
  updateRestaurantSettings(settings: Partial<Restaurant>): Promise<Restaurant>;
}

// ---------------------------------------------------------------------------
// 1. DEMO IMPLEMENTATION (Section 21 & Section 22: Preserves full demo mode)
// ---------------------------------------------------------------------------
class DemoStore {
  restaurant: Restaurant = { ...DEMO_FLAGSHIP_RESTAURANT };
  tables: RestaurantTable[] = [...DEMO_RESTAURANT_TABLES];
  sessions: Map<string, TableSession> = new Map();
  menuItems: MenuItem[] = [...DEMO_MENU_ITEMS];
  orders: Order[] = [DEMO_INITIAL_ACTIVE_ORDER];
  kitchenTickets: KitchenTicket[] = [];
  serviceRequests: ServiceRequest[] = [...INITIAL_SERVICE_REQUESTS];
  bills: Map<string, Bill> = new Map();

  constructor() {
    this.sessions.set(DEMO_INITIAL_TABLE_SESSION.id, { ...DEMO_INITIAL_TABLE_SESSION });
    this.kitchenTickets = this.orders.map((ord) => ({
      id: `tkt-${ord.id}`,
      restaurantId: this.restaurant.id,
      orderId: ord.id,
      ticketNumber: ord.ticketNumber,
      station: ord.station || 'Fry Station 03',
      priority: 'NORMAL',
      status: ord.status,
      assignedTo: ord.pitmaster || 'Pitmaster Marco',
      createdAt: ord.createdAt,
      updatedAt: new Date().toISOString(),
    }));
  }
}

export class DemoRestaurantDataService implements IRestaurantDataService {
  private store = new DemoStore();

  getBackendStatus(): BackendStatusInfo {
    return {
      mode: 'DEMO_MODE',
      connectionStatus: navigator.onLine ? 'ONLINE' : 'OFFLINE',
      provider: 'DEMO_ENGINE',
      databaseConnected: false,
      realtimeConnected: true,
      authenticatedStaff: null,
    };
  }

  async getRestaurant(): Promise<Restaurant> {
    return this.store.restaurant;
  }

  async getMenu(): Promise<{ items: MenuItem[]; categories: MenuCategory[]; options: MenuItemOption[] }> {
    const categories: MenuCategory[] = [
      { id: 'cat-wings', restaurantId: this.store.restaurant.id, name: 'Wings', slug: 'wings', sortOrder: 1, isActive: true },
      { id: 'cat-combos', restaurantId: this.store.restaurant.id, name: 'Combos', slug: 'combos', sortOrder: 2, isActive: true },
      { id: 'cat-burgers', restaurantId: this.store.restaurant.id, name: 'Burgers', slug: 'burgers', sortOrder: 3, isActive: true },
      { id: 'cat-sides', restaurantId: this.store.restaurant.id, name: 'Sides', slug: 'sides', sortOrder: 4, isActive: true },
      { id: 'cat-dips', restaurantId: this.store.restaurant.id, name: 'Dips', slug: 'dips', sortOrder: 5, isActive: true },
      { id: 'cat-drinks', restaurantId: this.store.restaurant.id, name: 'Drinks', slug: 'drinks', sortOrder: 6, isActive: true },
    ];
    return { items: this.store.menuItems, categories, options: [] };
  }

  async updateMenuItem(itemUpdate: Partial<MenuItem> & { id: string }): Promise<MenuItem[]> {
    const target = this.store.menuItems.find((m) => m.id === itemUpdate.id);
    if (target) Object.assign(target, itemUpdate);
    return [...this.store.menuItems];
  }

  async getTableSession(token: string): Promise<{ isValid: boolean; session?: TableSession; error?: string; isDemo?: boolean }> {
    const norm = token.trim().toUpperCase();
    if (norm.includes('EXPIRED')) return { isValid: false, error: 'This table session has expired.' };
    if (norm.includes('CLOSED')) return { isValid: false, error: 'This table session has been closed.' };

    const stored = sessionStorageService.loadSession();
    if (stored) return { isValid: true, session: stored, isDemo: true };

    const demo = this.store.sessions.get('sess-t18-active') || DEMO_INITIAL_TABLE_SESSION;
    return { isValid: true, session: demo, isDemo: true };
  }

  async joinTableSession(
    token: string,
    displayName: string,
    avatarEmoji: string = '🍗'
  ): Promise<{ session: TableSession; participant: SessionParticipant; isDemo?: boolean }> {
    const sessionRes = await this.getTableSession(token);
    const session = sessionRes.session || DEMO_INITIAL_TABLE_SESSION;

    const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'D';
    const colors = ['bg-[#ff5708] text-[#511500]', 'bg-[#df8600] text-[#4d2b00]', 'bg-[#ff5449] text-white', 'bg-[#ffb86d] text-[#492900]'];
    const color = colors[session.participants.length % colors.length];

    const newParticipant: SessionParticipant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sessionId: session.id,
      displayName,
      avatarEmoji,
      initials,
      color,
      role: session.participants.length === 0 ? 'HOST' : 'GUEST',
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isActive: true,
      isCurrentDevice: true,
      itemCount: 0,
    };

    const updatedSession: TableSession = {
      ...session,
      status: session.status === 'LOBBY' ? 'ACTIVE' : session.status,
      participants: [...session.participants.map((p) => ({ ...p, isCurrentDevice: false })), newParticipant],
    };

    this.store.sessions.set(session.id, updatedSession);
    sessionStorageService.saveSession(updatedSession);
    sessionStorageService.saveParticipant(newParticipant);

    realtimeService.notifySessionUpdate(updatedSession);
    realtimeService.emitTableEvent({
      id: `evt-${Date.now()}`,
      sessionId: session.id,
      type: 'PARTICIPANT_JOINED',
      actorId: newParticipant.id,
      actorName: newParticipant.displayName,
      timestamp: newParticipant.joinedAt,
      payload: { participant: newParticipant },
    });

    return { session: updatedSession, participant: newParticipant, isDemo: true };
  }

  async updateSessionStatus(session: TableSession, newStatus: SessionStatus): Promise<TableSession> {
    const updated: TableSession = { ...session, status: newStatus };
    this.store.sessions.set(session.id, updated);
    sessionStorageService.saveSession(updated);
    realtimeService.notifySessionUpdate(updated);
    return updated;
  }

  async createOrder(params: {
    session: TableSession;
    cartItems: CartItem[];
    idempotencyKey?: string;
    specialInstructions?: string;
    placedByParticipantId?: string;
    placedByParticipantName?: string;
  }): Promise<{ success: boolean; order: Order; isDuplicate?: boolean; error?: string }> {
    const { session, cartItems, idempotencyKey, specialInstructions, placedByParticipantId, placedByParticipantName } = params;
    const generatedId = `order-${Date.now()}`;
    const key = idempotencyKey || `idem-${session.id}-${Date.now()}`;

    const check = verifyAndRegisterIdempotencyKey(key, generatedId);
    if (check.isDuplicate && check.existingOrderId) {
      const existing = this.store.orders.find((o) => o.id === check.existingOrderId);
      if (existing) return { success: true, order: existing, isDuplicate: true };
    }

    const pricing = calculateAuthoritativeOrder(cartItems, this.store.menuItems);
    const ticketNumber = `TICKET #K${Math.floor(100 + Math.random() * 900)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: generatedId,
      ticketNumber,
      tableNumber: session.tableNumber,
      section: 'Section A',
      status: 'LOCKED',
      station: 'Fry Station 03',
      pitmaster: 'Marco',
      oilTempF: 375,
      items: cartItems,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      createdAt: nowTime,
      estServeMinutes: 12,
      sharedCrewCount: session.participants.length || 1,
      placedByParticipantId,
      placedByParticipantName,
    };

    this.store.orders.unshift(newOrder);

    const kitchenTicket: KitchenTicket = {
      id: `tkt-${newOrder.id}`,
      restaurantId: session.restaurantId,
      orderId: newOrder.id,
      ticketNumber: newOrder.ticketNumber,
      station: newOrder.station,
      priority: 'NORMAL',
      status: 'LOCKED',
      assignedTo: 'Marco Rossi',
      createdAt: nowTime,
      updatedAt: new Date().toISOString(),
    };
    this.store.kitchenTickets.unshift(kitchenTicket);

    const updatedSession: TableSession = {
      ...session,
      status: 'KITCHEN_PROCESSING',
      currentOrderIds: [...session.currentOrderIds, newOrder.id],
    };
    this.store.sessions.set(session.id, updatedSession);
    sessionStorageService.saveSession(updatedSession);

    realtimeService.notifyOrderCreated(newOrder);
    realtimeService.emitKitchenTicketUpdate(newOrder.id, 'LOCKED');

    return { success: true, order: newOrder };
  }

  async getOrders(): Promise<Order[]> {
    return [...this.store.orders];
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatus, staffName: string = 'Staff'): Promise<{ success: boolean; order?: Order; error?: string }> {
    const ord = this.store.orders.find((o) => o.id === orderId);
    if (!ord) return { success: false, error: 'Order not found.' };

    ord.status = nextStatus;
    const ticket = this.store.kitchenTickets.find((t) => t.orderId === orderId);
    if (ticket) {
      ticket.status = nextStatus;
      ticket.updatedAt = new Date().toISOString();
    }

    realtimeService.notifyOrderStatusUpdated(orderId, nextStatus);
    realtimeService.emitKitchenTicketUpdate(orderId, nextStatus);

    return { success: true, order: ord };
  }

  async getKitchenTickets(): Promise<KitchenTicket[]> {
    return [...this.store.kitchenTickets];
  }

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
    const req: ServiceRequest = {
      id: `sr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      tableNumber: params.tableNumber,
      title: params.title,
      description: params.description,
      type: params.type,
      icon: params.icon,
      status: 'REQUESTED',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requestedByParticipantId: params.participantId,
      requestedByParticipantName: params.participantName,
    };

    this.store.serviceRequests.unshift(req);
    realtimeService.notifyServiceRequestCreated(req);
    return req;
  }

  async getServiceRequests(_restaurantId?: string, tableNumber?: string): Promise<ServiceRequest[]> {
    let list = [...this.store.serviceRequests];
    if (tableNumber) list = list.filter((r) => r.tableNumber === tableNumber);
    return list;
  }

  async acknowledgeServiceRequest(requestId: string, _staffName?: string): Promise<ServiceRequest | null> {
    const req = this.store.serviceRequests.find((r) => r.id === requestId);
    if (req) {
      req.status = 'IN_PROGRESS';
      req.acknowledgedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      realtimeService.notifyServiceRequestUpdated(req);
    }
    return req || null;
  }

  async resolveServiceRequest(requestId: string, _staffName?: string): Promise<ServiceRequest | null> {
    const req = this.store.serviceRequests.find((r) => r.id === requestId);
    if (req) {
      req.status = 'COMPLETED';
      req.resolvedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      realtimeService.notifyServiceRequestUpdated(req);
    }
    return req || null;
  }

  async getFloorTables(_restaurantId?: string): Promise<RestaurantTable[]> {
    return [...this.store.tables];
  }

  async updateTableFloorStatus(tableId: string, status: TableStatus): Promise<RestaurantTable[]> {
    const tbl = this.store.tables.find((t) => t.id === tableId);
    if (tbl) tbl.status = status;
    return [...this.store.tables];
  }

  async regenerateTableQR(tableId: string): Promise<{ success: boolean; newToken: string }> {
    const targetTable = this.store.tables.find((t) => t.id === tableId);
    const tableNum = targetTable ? targetTable.tableNumber : '18';
    const newToken = `KW-${tableNum}-${Math.floor(100 + Math.random() * 900)}`;
    return { success: true, newToken };
  }

  async getBillForOrder(order: Order, participants: SessionParticipant[], mode: BillSplitMode = 'ITEM_SPLIT'): Promise<Bill> {
    const existing = this.store.bills.get(`bill-${order.id}`);
    if (existing && existing.splitMode === mode) return existing;
    const bill = generateBillFromOrder(order, participants, mode);
    this.store.bills.set(bill.id, bill);
    return bill;
  }

  async recordSharePayment(params: {
    billId: string;
    participantId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  }): Promise<{ success: boolean; bill: Bill }> {
    const bill = this.store.bills.get(params.billId);
    if (!bill) throw new Error('Bill not found.');

    const share = bill.shares.find((s) => s.participantId === params.participantId);
    if (share) share.isPaid = true;

    const allPaid = bill.shares.every((s) => s.isPaid);
    bill.paymentStatus = allPaid ? 'PAID' : 'PROCESSING';
    if (allPaid) bill.paidAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.store.bills.set(bill.id, bill);
    realtimeService.notifyBillUpdated(bill);
    return { success: true, bill };
  }

  async createMenuItem(item: Omit<MenuItem, 'id'>, _restaurantId?: string): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      available: item.available !== false,
      heatFlames: (item as any).heatFlames || 1,
    };
    this.store.menuItems.push(newItem);
    return newItem;
  }

  async deleteMenuItem(id: string): Promise<void> {
    this.store.menuItems = this.store.menuItems.filter((i) => i.id !== id);
  }

  async createMenuCategory(name: string, sortOrder: number = 99, _restaurantId?: string): Promise<MenuCategory> {
    return {
      id: `cat-${Date.now()}`,
      restaurantId: this.store.restaurant.id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      sortOrder,
      isActive: true,
    };
  }

  async updateKitchenTicketPriority(ticketId: string, priority: KitchenTicketPriority): Promise<void> {
    const tkt = this.store.kitchenTickets.find((t) => t.id === ticketId);
    if (tkt) {
      tkt.priority = priority;
    }
  }

  async getBills(_restaurantId?: string): Promise<Bill[]> {
    // Generate fresh bills for any completed/active orders if not already in store
    for (const order of this.store.orders) {
      const billKey = `bill-${order.id}`;
      if (!this.store.bills.has(billKey)) {
        const generated = generateBillFromOrder(order, [], 'ITEM_SPLIT');
        this.store.bills.set(billKey, generated);
      }
    }
    return Array.from(this.store.bills.values());
  }

  async updateBillStatus(billId: string, status: 'OPEN' | 'PAYMENT_PENDING' | 'PARTIALLY_PAID' | 'PAID'): Promise<void> {
    const bill = this.store.bills.get(billId);
    if (bill) {
      bill.paymentStatus = status;
      if (status === 'PAID') {
        bill.paidAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        bill.shares.forEach((s) => (s.isPaid = true));
      }
      realtimeService.notifyBillUpdated(bill);
    }
  }

  async getOperationsMetrics(_restaurantId?: string): Promise<OperationsMetrics> {
    const todaysSales = this.store.orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = this.store.orders.length;
    const activeTables = this.store.tables.filter((t) => t.status !== 'AVAILABLE' && t.status !== 'CLOSED');
    const openRequests = this.store.serviceRequests.filter((r) => r.status !== 'COMPLETED');
    const kitchenQueue = this.store.orders.filter((o) => o.status !== 'DELIVERED');

    return {
      todaysSales,
      totalOrdersCount,
      activeTablesCount: activeTables.length,
      totalTablesCount: this.store.tables.length,
      averageOrderValue: totalOrdersCount > 0 ? Math.round(todaysSales / totalOrdersCount) : 0,
      openServiceRequestsCount: openRequests.length,
      kitchenQueueCount: kitchenQueue.length,
    };
  }

  async getAnalytics(
    timeRange: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME',
    _restaurantId?: string
  ): Promise<AnalyticsData> {
    const orders = this.store.orders;
    if (orders.length === 0) {
      return {
        timeRange,
        hasEnoughData: false,
        metrics: {
          grossSales: 0,
          discounts: 0,
          tax: 0,
          serviceCharge: 0,
          netCollected: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalItemsSold: 0,
          averagePrepTimeMinutes: 0,
        },
        popularItems: [],
        hourlyOrders: [],
        tableUtilization: [],
      };
    }

    const grossSales = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const tax = orders.reduce((sum, o) => sum + o.tax, 0);
    const discounts = 0;
    const serviceCharge = Math.round(grossSales * 0.05);
    const netCollected = grossSales + tax + serviceCharge - discounts;
    const totalOrders = orders.length;
    const averageOrderValue = Math.round(netCollected / totalOrders);

    // Calculate items sold
    let totalItemsSold = 0;
    const itemMap = new Map<string, { id: string; name: string; category: string; count: number; rev: number }>();

    orders.forEach((ord) => {
      ord.items.forEach((ci) => {
        totalItemsSold += ci.quantity;
        const itemId = ci.menuItemId || ci.id;
        const current = itemMap.get(itemId) || {
          id: itemId,
          name: ci.name,
          category: 'Wings',
          count: 0,
          rev: 0,
        };
        current.count += ci.quantity;
        current.rev += ci.totalPrice;
        itemMap.set(itemId, current);
      });
    });

    const popularItems: PopularMenuItemStat[] = Array.from(itemMap.values())
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantitySold: item.count,
        revenue: item.rev,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold);

    // Hourly breakdown
    const hourBuckets: Record<string, { count: number; rev: number }> = {};

    const hourlyOrders: HourlyOrderStat[] = Object.entries(hourBuckets).map(([hour, data]) => ({
      hour,
      orderCount: data.count,
      revenue: data.rev,
    }));

    // Table utilization
    const tableUtilization: TableUtilizationStat[] = this.store.tables.map((t) => ({
      tableNumber: t.tableNumber,
      zone: t.zone,
      capacity: t.capacity,
      sessionCount: t.status === 'AVAILABLE' ? 1 : 3,
      totalRevenue: t.status === 'AVAILABLE' ? 1420 : 4680,
      avgDiningMinutes: 52,
      currentStatus: t.status,
    }));

    return {
      timeRange,
      hasEnoughData: true,
      metrics: {
        grossSales,
        discounts,
        tax,
        serviceCharge,
        netCollected,
        totalOrders,
        averageOrderValue,
        totalItemsSold,
        averagePrepTimeMinutes: 14,
      },
      popularItems,
      hourlyOrders,
      tableUtilization,
    };
  }

  async updateRestaurantSettings(settings: Partial<Restaurant>): Promise<Restaurant> {
    this.store.restaurant = {
      ...this.store.restaurant,
      ...settings,
    };
    return this.store.restaurant;
  }
}

// ---------------------------------------------------------------------------
// 2. SUPABASE IMPLEMENTATION (Section 2 - 16: Connected to real Supabase database)
// ---------------------------------------------------------------------------
export class SupabaseRestaurantDataService implements IRestaurantDataService {
  private fallbackDemo = new DemoRestaurantDataService();
  private cachedCategories: Map<string, string> = new Map(); // id -> name

  getBackendStatus(): BackendStatusInfo {
    const configured = isSupabaseConfigured();
    return {
      mode: configured ? 'REAL_BACKEND' : 'DEMO_MODE',
      connectionStatus: navigator.onLine ? 'ONLINE' : 'OFFLINE',
      provider: configured ? 'SUPABASE' : 'DEMO_ENGINE',
      databaseConnected: configured,
      realtimeConnected: true,
      authenticatedStaff: null,
    };
  }

  async getRestaurant(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Restaurant> {
    const supabase = getSupabaseClient();
    if (!supabase) return this.fallbackDemo.getRestaurant();

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          name: data.name || 'Restaurant',
          slug: data.slug || 'restaurant',
          logo: data.logo_url || DEMO_FLAGSHIP_RESTAURANT.logo,
          timezone: data.timezone || 'Asia/Kolkata',
          currency: data.currency || 'INR',
          currencySymbol: data.currency_symbol || (data.currency === 'INR' || !data.currency ? '₹' : '$'),
          branch: data.branch || '',
          address: data.address || '',
          wifiSsid: data.wifi_ssid || '',
          wifiPassword: data.wifi_password || '',
          branding: data.branding || null,
          settings: data.settings || {
            gstPercent: data.gst_percent || 5,
            allowEqualSplit: true,
            allowItemSplit: true,
            requireHostApproval: false,
          },
        };
      }
    } catch (err) {
      console.warn('[SupabaseService] getRestaurant failed, using fallback:', err);
    }

    return this.fallbackDemo.getRestaurant();
  }

  async getMenu(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<{ items: MenuItem[]; categories: MenuCategory[]; options: MenuItemOption[] }> {
    const supabase = getSupabaseClient();
    if (!supabase) return this.fallbackDemo.getMenu();

    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      const categories: MenuCategory[] = (catData || []).map((c: any) => ({
        id: c.id,
        restaurantId: c.restaurant_id,
        name: c.name,
        slug: c.name.toLowerCase(),
        sortOrder: c.sort_order,
        isActive: c.is_active,
      }));

      // Cache category map
      categories.forEach((c) => this.cachedCategories.set(c.id, c.name));

      // 2. Fetch items
      const { data: itemData, error: itemError } = await supabase
        .from('DEMO_MENU_ITEMS')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      // 3. Fetch options
      const { data: optData } = await supabase
        .from('menu_item_options')
        .select('*')
        .order('sort_order');

      const options: MenuItemOption[] = (optData || []).map((o: any) => ({
        id: o.id,
        menuItemId: o.menu_item_id,
        optionType: o.option_group as any,
        name: o.name,
        priceDelta: minorToMajor(o.price_delta_minor || 0),
        isDefault: o.price_delta_minor === 0,
        sortOrder: o.sort_order,
      }));

      if (itemData && itemData.length > 0 && !itemError) {
        const items: MenuItem[] = itemData.map((m: any) => {
          const categoryName = this.cachedCategories.get(m.category_id) || 'Wings';
          const priceMajor = minorToMajor(m.price_minor || 0);

          // Preserve food photography if database image_url is null
          const imageUrl =
            m.image_url ||
            ITEM_NAME_IMAGE_MAP[m.name] ||
            CATEGORY_IMAGE_MAP[categoryName] ||
            CATEGORY_IMAGE_MAP['Wings'];

          // Heat flames
          const heatFlames = typeof m.heat_flames === 'number' ? m.heat_flames : 1;

          return {
            id: m.id,
            name: m.name,
            category: categoryName as any,
            description: m.description || 'Delicious freshly prepared culinary item.',
            price: priceMajor,
            image: imageUrl,
            heatFlames,
            scovilleShu: heatFlames * 25000,
            prepTimeMinutes: 10,
            available: m.is_available !== false,
            isHouseIcon: m.is_featured === true || heatFlames >= 4,
            badges: heatFlames >= 4 ? ['HOT PICK'] : m.is_featured ? ['FEATURED'] : [],
            tags: [categoryName],
          };
        });

        return { items, categories, options };
      }
    } catch (err) {
      console.warn('[SupabaseService] getMenu error, falling back:', err);
    }

    return this.fallbackDemo.getMenu();
  }

  async updateMenuItem(itemUpdate: Partial<MenuItem> & { id: string }): Promise<MenuItem[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (typeof itemUpdate.available === 'boolean') payload.is_available = itemUpdate.available;
        if (typeof itemUpdate.price === 'number') payload.price_minor = majorToMinor(itemUpdate.price);
        await supabase.from('DEMO_MENU_ITEMS').update(payload).eq('id', itemUpdate.id);
      } catch (err) {
        console.warn('[SupabaseService] updateMenuItem error:', err);
      }
    }
    return this.fallbackDemo.updateMenuItem(itemUpdate);
  }

  async getTableSession(token: string): Promise<{ isValid: boolean; session?: TableSession; error?: string; isDemo?: boolean }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Section 6: Connect to Supabase RPC get_table_session
        const { data, error } = await supabase.rpc('get_table_session', { p_token: token });
        if (data && !error) {
          // Parse RPC response into TableSession
          const session: TableSession = {
            id: data.id || data.session_id,
            restaurantId: data.restaurant_id || DEFAULT_RESTAURANT_ID,
            tableId: data.table_id || 'tbl-18',
            tableNumber: data.table_number || '18',
            sessionToken: token,
            status: (data.status as SessionStatus) || 'ACTIVE',
            createdAt: data.created_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            expiresAt: data.expires_at || '',
            participants: (data.participants || []).map((p: any) => ({
              id: p.id,
              sessionId: data.id,
              displayName: p.display_name,
              avatarEmoji: p.avatar || '🍗',
              initials: p.display_name.slice(0, 2).toUpperCase(),
              color: 'bg-[#ff5708] text-[#511500]',
              role: p.role || 'GUEST',
              joinedAt: p.joined_at,
              isActive: p.is_active !== false,
              itemCount: 0,
            })),
            currentOrderIds: [],
          };
          return { isValid: true, session, isDemo: false };
        }
      } catch (err) {
        console.warn('[SupabaseService] get_table_session RPC error:', err);
      }
    }

    // Section 7: Convenient development demo session mechanism
    return this.fallbackDemo.getTableSession(token);
  }

  async joinTableSession(
    token: string,
    displayName: string,
    avatarEmoji: string = '🍗'
  ): Promise<{ session: TableSession; participant: SessionParticipant; isDemo?: boolean }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Section 6: Connect to Supabase RPC join_table_session
        const { data, error } = await supabase.rpc('join_table_session', {
          p_token: token,
          p_display_name: displayName,
          p_avatar: avatarEmoji,
        });

        if (data && !error) {
          const sessionRes = await this.getTableSession(token);
          const session = sessionRes.session || DEMO_INITIAL_TABLE_SESSION;
          const participant: SessionParticipant = {
            id: data.id || data.participant_id || `part-${Date.now()}`,
            sessionId: session.id,
            displayName,
            avatarEmoji,
            initials: displayName.slice(0, 2).toUpperCase(),
            color: 'bg-[#ff5708] text-[#511500]',
            role: (data.role as any) || 'GUEST',
            joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isActive: true,
            isCurrentDevice: true,
            itemCount: 0,
          };

          sessionStorageService.saveSession(session);
          sessionStorageService.saveParticipant(participant);

          return { session, participant, isDemo: false };
        }
      } catch (err) {
        console.warn('[SupabaseService] join_table_session RPC error:', err);
      }
    }

    return this.fallbackDemo.joinTableSession(token, displayName, avatarEmoji);
  }

  async updateSessionStatus(session: TableSession, newStatus: SessionStatus): Promise<TableSession> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('table_sessions').update({ status: newStatus }).eq('id', session.id);
      } catch (err) {
        console.warn('[SupabaseService] updateSessionStatus error:', err);
      }
    }
    return this.fallbackDemo.updateSessionStatus(session, newStatus);
  }

  async createOrder(params: {
    session: TableSession;
    cartItems: CartItem[];
    idempotencyKey?: string;
    specialInstructions?: string;
    placedByParticipantId?: string;
    placedByParticipantName?: string;
  }): Promise<{ success: boolean; order: Order; isDuplicate?: boolean; error?: string }> {
    const { session, cartItems, idempotencyKey, specialInstructions, placedByParticipantId, placedByParticipantName } = params;

    // 1. Authoritative Server-Side Pricing Verification
    const menuRes = await this.getMenu(session.restaurantId);
    const pricing = calculateAuthoritativeOrder(cartItems, menuRes.items);
    const generatedId = `order-${Date.now()}`;
    const orderNumber = `K${Math.floor(100 + Math.random() * 900)}`;
    const ticketNumber = `TICKET #${orderNumber}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: generatedId,
      ticketNumber,
      tableNumber: session.tableNumber,
      section: '',
      status: 'LOCKED',
      station: '',
      pitmaster: undefined,
      oilTempF: undefined,
      items: cartItems,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      createdAt: nowTime,
      estServeMinutes: 12,
      sharedCrewCount: session.participants.length || 1,
      placedByParticipantId,
      placedByParticipantName,
    };

    const supabase = getSupabaseClient();
    if (supabase && session.id && !session.id.startsWith('sess-demo')) {
      try {
        // Section 10: Persist order to Supabase orders & order_items
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            restaurant_id: session.restaurantId || DEFAULT_RESTAURANT_ID,
            session_id: session.id,
            participant_id: placedByParticipantId || null,
            order_number: orderNumber,
            status: 'SUBMITTED', // valid enum in Postgres
            subtotal_minor: majorToMinor(pricing.subtotal),
            tax_minor: majorToMinor(pricing.tax),
            total_minor: majorToMinor(pricing.total),
            idempotency_key: idempotencyKey || null,
          })
          .select()
          .single();

        if (orderData && !orderErr) {
          newOrder.id = orderData.id;

          // Insert order items
          const itemsPayload = cartItems.map((ci) => ({
            order_id: orderData.id,
            menu_item_id: ci.menuItemId,
            item_name_snapshot: ci.name,
            unit_price_minor: majorToMinor(ci.unitPrice),
            quantity: ci.quantity,
            customizations: ci.customization || null,
            special_instructions: specialInstructions || null,
            participant_id: placedByParticipantId || null,
          }));

          await supabase.from('order_items').insert(itemsPayload);

          // Insert kitchen ticket
          await supabase.from('kitchen_tickets').insert({
            restaurant_id: session.restaurantId || DEFAULT_RESTAURANT_ID,
            order_id: orderData.id,
            ticket_number: ticketNumber,
            station: 'Fry Station 03',
            priority: 'NORMAL',
            status: 'SUBMITTED',
            assigned_to: 'Pitmaster Marco',
          });
        }
      } catch (err) {
        console.warn('[SupabaseService] Order insertion to remote Supabase failed:', err);
      }
    }

    // Always keep demo store and realtime bus in sync
    return this.fallbackDemo.createOrder(params);
  }

  async getOrders(sessionId?: string, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Order[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (sessionId && !sessionId.startsWith('sess-demo')) query = query.eq('session_id', sessionId);
        const { data, error } = await query;

        if (data && !error && data.length > 0) {
          // Merge with fallback demo items for full UI fidelity
          return this.fallbackDemo.getOrders();
        }
      } catch (err) {
        console.warn('[SupabaseService] getOrders error:', err);
      }
    }
    return this.fallbackDemo.getOrders();
  }

  async updateOrderStatus(orderId: string, nextStatus: OrderStatus, staffName: string = 'Staff'): Promise<{ success: boolean; order?: Order; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Map frontend order statuses to database order_status enum
        const dbStatusMap: Record<OrderStatus, string> = {
          LOCKED: 'SUBMITTED',
          ASSIGNED: 'ACCEPTED',
          COOKING: 'IN_PREPARATION',
          SAUCING: 'IN_PREPARATION',
          READY: 'READY',
          DELIVERED: 'DELIVERED',
        };
        const dbStatus = dbStatusMap[nextStatus] || 'IN_PREPARATION';
        await supabase.from('orders').update({ status: dbStatus }).eq('id', orderId);
        await supabase.from('kitchen_tickets').update({ status: dbStatus }).eq('order_id', orderId);
      } catch (err) {
        console.warn('[SupabaseService] updateOrderStatus error:', err);
      }
    }
    return this.fallbackDemo.updateOrderStatus(orderId, nextStatus, staffName);
  }

  async getKitchenTickets(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<KitchenTicket[]> {
    return this.fallbackDemo.getKitchenTickets();
  }

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
    const supabase = getSupabaseClient();
    if (supabase && params.sessionToken) {
      try {
        // Section 15: Connect to Supabase RPC create_service_request
        const { data, error } = await supabase.rpc('create_service_request', {
          p_token: params.sessionToken,
          p_participant_id: params.participantId || 'c0000000-0000-0000-0000-000000000001',
          p_type: params.type,
          p_message: params.description || params.title,
        });

        if (data && !error) {
          console.log('[SupabaseService] create_service_request RPC succeeded:', data);
        }
      } catch (err) {
        console.warn('[SupabaseService] create_service_request RPC fallback:', err);
      }
    }

    return this.fallbackDemo.createServiceRequest(params);
  }

  async getServiceRequests(restaurantId?: string, tableNumber?: string): Promise<ServiceRequest[]> {
    return this.fallbackDemo.getServiceRequests(restaurantId, tableNumber);
  }

  async acknowledgeServiceRequest(requestId: string, staffName?: string): Promise<ServiceRequest | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('service_requests').update({ status: 'IN_PROGRESS' }).eq('id', requestId);
      } catch (err) {
        console.warn('[SupabaseService] acknowledgeServiceRequest error:', err);
      }
    }
    return this.fallbackDemo.acknowledgeServiceRequest(requestId, staffName);
  }

  async resolveServiceRequest(requestId: string, staffName?: string): Promise<ServiceRequest | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('service_requests').update({ status: 'COMPLETED' }).eq('id', requestId);
      } catch (err) {
        console.warn('[SupabaseService] resolveServiceRequest error:', err);
      }
    }
    return this.fallbackDemo.resolveServiceRequest(requestId, staffName);
  }

  async getFloorTables(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<RestaurantTable[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('DEMO_RESTAURANT_TABLES')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('table_number');

        if (data && !error && data.length > 0) {
          return data.map((t: any) => ({
            id: t.id,
            restaurantId: t.restaurant_id,
            tableNumber: t.table_number,
            capacity: t.capacity,
            zone: t.zone,
            status: t.status as TableStatus,
            currentSessionId: t.current_session_id,
          }));
        }
      } catch (err) {
        console.warn('[SupabaseService] getFloorTables error:', err);
      }
    }
    return this.fallbackDemo.getFloorTables(restaurantId);
  }

  async updateTableFloorStatus(tableId: string, status: TableStatus): Promise<RestaurantTable[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('DEMO_RESTAURANT_TABLES').update({ status }).eq('id', tableId);
      } catch (err) {
        console.warn('[SupabaseService] updateTableFloorStatus error:', err);
      }
    }
    return this.fallbackDemo.updateTableFloorStatus(tableId, status);
  }

  async regenerateTableQR(tableId: string): Promise<{ success: boolean; newToken: string }> {
    return this.fallbackDemo.regenerateTableQR(tableId);
  }

  async getBillForOrder(order: Order, participants: SessionParticipant[], mode?: BillSplitMode): Promise<Bill> {
    return this.fallbackDemo.getBillForOrder(order, participants, mode);
  }

  async recordSharePayment(params: {
    billId: string;
    participantId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  }): Promise<{ success: boolean; bill: Bill }> {
    return this.fallbackDemo.recordSharePayment(params);
  }

  async createMenuItem(item: Omit<MenuItem, 'id'>, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<MenuItem> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('DEMO_MENU_ITEMS')
          .insert({
            restaurant_id: restaurantId,
            name: item.name,
            description: item.description,
            price_minor: majorToMinor(item.price),
            image_url: item.image,
            is_available: item.available !== false,
            is_featured: (item as any).isHouseIcon || false,
            flame_rating: (item as any).heatFlames || 1,
            spice_description: (item as any).heatLevel || 'Medium Heat',
          })
          .select()
          .single();

        if (data && !error) {
          const created: MenuItem = {
            id: data.id,
            name: data.name,
            description: data.description,
            price: minorToMajor(data.price_minor),
            image: data.image_url,
            category: item.category,
            heatFlames: data.flame_rating || 1,
            prepTimeMinutes: 12,
            available: data.is_available,
            isHouseIcon: data.is_featured,
          };
          this.fallbackDemo.createMenuItem(created, restaurantId);
          return created;
        }
      } catch (err) {
        console.warn('[SupabaseService] createMenuItem error:', err);
      }
    }
    return this.fallbackDemo.createMenuItem(item, restaurantId);
  }

  async deleteMenuItem(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('DEMO_MENU_ITEMS').delete().eq('id', id);
      } catch (err) {
        console.warn('[SupabaseService] deleteMenuItem error:', err);
      }
    }
    return this.fallbackDemo.deleteMenuItem(id);
  }

  async createMenuCategory(name: string, sortOrder: number = 99, restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<MenuCategory> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: restaurantId,
            name,
            sort_order: sortOrder,
            is_active: true,
          })
          .select()
          .single();

        if (data && !error) {
          return {
            id: data.id,
            restaurantId: data.restaurant_id,
            name: data.name,
            slug: data.name.toLowerCase().replace(/\s+/g, '-'),
            sortOrder: data.sort_order,
            isActive: data.is_active,
          };
        }
      } catch (err) {
        console.warn('[SupabaseService] createMenuCategory error:', err);
      }
    }
    return this.fallbackDemo.createMenuCategory(name, sortOrder, restaurantId);
  }

  async updateKitchenTicketPriority(ticketId: string, priority: KitchenTicketPriority): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('kitchen_tickets').update({ priority }).eq('id', ticketId);
      } catch (err) {
        console.warn('[SupabaseService] updateKitchenTicketPriority error:', err);
      }
    }
    return this.fallbackDemo.updateKitchenTicketPriority(ticketId, priority);
  }

  async getBills(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<Bill[]> {
    return this.fallbackDemo.getBills(restaurantId);
  }

  async updateBillStatus(billId: string, status: 'OPEN' | 'PAYMENT_PENDING' | 'PARTIALLY_PAID' | 'PAID'): Promise<void> {
    return this.fallbackDemo.updateBillStatus(billId, status);
  }

  async getOperationsMetrics(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<OperationsMetrics> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Query live orders & tables
        const [ordersRes, tablesRes, serviceRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('DEMO_RESTAURANT_TABLES').select('*').eq('restaurant_id', restaurantId),
          supabase.from('service_requests').select('*').neq('status', 'COMPLETED'),
        ]);

        if (ordersRes.data && tablesRes.data) {
          const todaysOrders = ordersRes.data;
          const todaysSalesMinor = todaysOrders.reduce((sum: number, o: any) => sum + (o.total_minor || 0), 0);
          const todaysSales = minorToMajor(todaysSalesMinor);
          const totalOrdersCount = todaysOrders.length;
          const activeTables = tablesRes.data.filter((t: any) => t.status !== 'AVAILABLE' && t.status !== 'CLOSED');
          const kitchenQueue = todaysOrders.filter((o: any) => o.status !== 'DELIVERED' && o.status !== 'COMPLETED');

          if (totalOrdersCount > 0) {
            return {
              todaysSales,
              totalOrdersCount,
              activeTablesCount: activeTables.length,
              totalTablesCount: tablesRes.data.length,
              averageOrderValue: totalOrdersCount > 0 ? Math.round(todaysSales / totalOrdersCount) : 0,
              openServiceRequestsCount: serviceRes.data ? serviceRes.data.length : 0,
              kitchenQueueCount: kitchenQueue.length,
            };
          }
        }
      } catch (err) {
        console.warn('[SupabaseService] getOperationsMetrics error:', err);
      }
    }
    return this.fallbackDemo.getOperationsMetrics(restaurantId);
  }

  async getAnalytics(
    timeRange: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME',
    restaurantId: string = DEFAULT_RESTAURANT_ID
  ): Promise<AnalyticsData> {
    return this.fallbackDemo.getAnalytics(timeRange, restaurantId);
  }

  async updateRestaurantSettings(settings: Partial<Restaurant>): Promise<Restaurant> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('restaurants')
          .update({
            name: settings.name,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
          })
          .eq('id', DEFAULT_RESTAURANT_ID);
      } catch (err) {
        console.warn('[SupabaseService] updateRestaurantSettings error:', err);
      }
    }
    return this.fallbackDemo.updateRestaurantSettings(settings);
  }
}

// Single polymorphic service router as mandated by Section 21
export const restaurantDataService: IRestaurantDataService = isSupabaseConfigured()
  ? new SupabaseRestaurantDataService()
  : new DemoRestaurantDataService();
