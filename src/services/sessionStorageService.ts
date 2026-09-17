/**
 * Session Storage Service
 * 
 * Manages local persistence for:
 * - Table session metadata & status
 * - Current participant identity
 * - Shared / personal cart items
 * - Active orders & kitchen tickets
 * - Service requests
 * 
 * BACKEND INTEGRATION NOTE:
 * This abstraction currently persists to browser localStorage with an in-memory fallback.
 * When integrating with a production backend (e.g. Node/Express, Firebase Firestore,
 * or WebSocket sync), this service can be swapped or augmented with remote HTTP/RPC calls
 * without modifying UI components.
 */

import { 
  TableSession, 
  SessionParticipant, 
  CartItem, 
  Order, 
  ServiceRequest, 
  UserRole 
} from '../types';

const STORAGE_KEYS = {
  SESSION: 'kow_table_session_v2',
  PARTICIPANT: 'kow_current_participant_v2',
  ROLE: 'kow_user_role_v2',
  CART: 'kow_table_cart_v2',
  ORDERS: 'kow_orders_v2',
  REQUESTS: 'kow_service_requests_v2',
};

// In-memory fallback in case localStorage is blocked in sandbox/iframes
const memoryStore: Record<string, string> = {};

const safeGet = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? memoryStore[key] ?? null;
    }
  } catch (e) {
    // Local storage disabled or sandboxed
  }
  return memoryStore[key] ?? null;
};

const safeSet = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    // Ignore quota or security errors
  }
  memoryStore[key] = value;
};

const safeRemove = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {}
  delete memoryStore[key];
};

export const sessionStorageService = {
  // Session
  loadSession(): TableSession | null {
    const raw = safeGet(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveSession(session: TableSession): void {
    safeSet(STORAGE_KEYS.SESSION, JSON.stringify(session));
  },

  // Participant Identity
  loadParticipant(): SessionParticipant | null {
    const raw = safeGet(STORAGE_KEYS.PARTICIPANT);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveParticipant(participant: SessionParticipant): void {
    safeSet(STORAGE_KEYS.PARTICIPANT, JSON.stringify(participant));
  },

  // Role
  loadRole(): UserRole {
    const raw = safeGet(STORAGE_KEYS.ROLE);
    if (raw && ['CUSTOMER', 'STAFF', 'KITCHEN', 'MANAGER', 'ADMIN'].includes(raw)) {
      return raw as UserRole;
    }
    return 'CUSTOMER';
  },

  saveRole(role: UserRole): void {
    safeSet(STORAGE_KEYS.ROLE, role);
  },

  // Cart
  loadCart(): CartItem[] {
    const raw = safeGet(STORAGE_KEYS.CART);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCart(cart: CartItem[]): void {
    safeSet(STORAGE_KEYS.CART, JSON.stringify(cart));
  },

  // Orders
  loadOrders(): Order[] | null {
    const raw = safeGet(STORAGE_KEYS.ORDERS);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveOrders(orders: Order[]): void {
    safeSet(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  // Service Requests
  loadServiceRequests(): ServiceRequest[] | null {
    const raw = safeGet(STORAGE_KEYS.REQUESTS);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveServiceRequests(requests: ServiceRequest[]): void {
    safeSet(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  },

  // Clear entire demo state
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(safeRemove);
  },
};
