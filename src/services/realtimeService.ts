/**
 * Realtime Event Bus & Supabase Channel Bridge
 * 
 * CORE ARCHITECTURE:
 * Provides unified reactive subscriptions across:
 * - Table session status changes
 * - Orders & kitchen tickets
 * - Service requests
 * - Billing updates & bill splitting
 * - Table floor occupancy
 * - Broadcasted table-wide events
 * 
 * In REAL_BACKEND mode, bridges to Supabase Realtime postgres_changes channels.
 * In DEMO_MODE, dispatches across reactive in-memory listeners.
 */

import { TableSession, Order, OrderStatus, ServiceRequest, TableSessionEvent, Bill, RestaurantTable, ConnectionStatus } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

type Listener<T> = (data: T) => void;

class RealtimeEventBus {
  private sessionListeners: Map<string, Set<Listener<TableSession>>> = new Map();
  private ordersListeners: Map<string, Set<Listener<Order[]>>> = new Map();
  private orderStatusListeners: Map<string, Set<Listener<OrderStatus>>> = new Map();
  private kitchenListeners: Set<Listener<Order[]>> = new Set();
  private serviceListeners: Set<Listener<ServiceRequest[]>> = new Set();
  private billListeners: Map<string, Set<Listener<Bill>>> = new Map();
  private eventListeners: Map<string, Set<Listener<TableSessionEvent>>> = new Map();
  private tableListeners: Set<Listener<RestaurantTable[]>> = new Set();
  private connectionListeners: Set<Listener<ConnectionStatus>> = new Set();
  private orderChangeListeners: Set<() => void> = new Set();

  private supabaseChannelInitialized = false;
  private currentConnectionStatus: ConnectionStatus = 'ONLINE';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateConnectionStatus('ONLINE'));
      window.addEventListener('offline', () => this.updateConnectionStatus('OFFLINE'));
      this.initSupabaseChannel();
      this.initServerEventsStream();
    }
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.currentConnectionStatus = status;
    this.connectionListeners.forEach((cb) => cb(status));
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.currentConnectionStatus;
  }

  public subscribeToConnectionStatus(callback: Listener<ConnectionStatus>): () => void {
    this.connectionListeners.add(callback);
    callback(this.currentConnectionStatus);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Initializes Supabase Realtime channel if credentials are provided
   */
  private initSupabaseChannel(): void {
    if (!isSupabaseConfigured() || this.supabaseChannelInitialized) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel('restaurant-live-feed');
      
      // Listen for database changes
      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('[Supabase Realtime] Orders change:', payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_requests' },
          (payload) => {
            console.log('[Supabase Realtime] Service requests change:', payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Supabase Realtime] Connected to live channel');
            this.updateConnectionStatus('ONLINE');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.updateConnectionStatus('RECONNECTING');
          }
        });

      this.supabaseChannelInitialized = true;
    } catch (err) {
      console.warn('[Supabase Realtime] Channel setup fallback:', err);
    }
  }

  /**
   * Initializes Server-Sent Events stream for instant cross-device synchronization
   */
  private initServerEventsStream(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      const eventSource = new EventSource('/api/realtime/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ORDER_CREATED') {
            const order: Order = payload.data;
            this.notifyOrderCreated(order);
            this.notifyOrderChanges();
          } else if (payload.type === 'ORDER_UPDATED') {
            const order: Order = payload.data;
            this.notifyOrderStatusUpdated(order.id, order.status);
            this.notifyOrderChanges();
          } else if (payload.type === 'SERVICE_REQUEST_CREATED') {
            const req: ServiceRequest = payload.data;
            this.notifyServiceRequestCreated(req);
          }
        } catch {
          // Ignore heartbeat or non-JSON comments
        }
      };

      eventSource.onerror = () => {
        // Browser EventSource automatically handles reconnection
      };
    } catch (err) {
      console.warn('[Realtime EventSource] Server stream connection warning:', err);
    }
  }

  // -------------------------------------------------------------------------
  // SESSION
  // -------------------------------------------------------------------------
  subscribeToTableSession(sessionId: string, callback: Listener<TableSession>): () => void {
    if (!this.sessionListeners.has(sessionId)) {
      this.sessionListeners.set(sessionId, new Set());
    }
    this.sessionListeners.get(sessionId)!.add(callback);
    return () => {
      this.sessionListeners.get(sessionId)?.delete(callback);
    };
  }

  notifySessionUpdate(session: TableSession): void {
    const listeners = this.sessionListeners.get(session.id);
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb(session); } catch (e) { console.error('Session listener error', e); }
      });
    }
  }

  // -------------------------------------------------------------------------
  // ORDERS & KITCHEN
  // -------------------------------------------------------------------------
  subscribeToOrders(sessionId: string, callback: Listener<Order[]>): () => void {
    if (!this.ordersListeners.has(sessionId)) {
      this.ordersListeners.set(sessionId, new Set());
    }
    this.ordersListeners.get(sessionId)!.add(callback);
    return () => {
      this.ordersListeners.get(sessionId)?.delete(callback);
    };
  }

  notifyOrdersUpdate(sessionId: string, orders: Order[]): void {
    const listeners = this.ordersListeners.get(sessionId);
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb(orders); } catch (e) { console.error('Orders listener error', e); }
      });
    }
    this.kitchenListeners.forEach((cb) => {
      try { cb(orders); } catch (e) { console.error('Kitchen listener error', e); }
    });
  }

  notifyOrderCreated(order: Order): void {
    this.kitchenListeners.forEach((cb) => {
      try { cb([order]); } catch (e) { console.error('Kitchen notify error', e); }
    });
  }

  notifyOrderStatusUpdated(orderId: string, status: OrderStatus): void {
    const listeners = this.orderStatusListeners.get(orderId);
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb(status); } catch (e) { console.error('Order status listener error', e); }
      });
    }
  }

  subscribeToOrderStatus(orderId: string, callback: Listener<OrderStatus>): () => void {
    if (!this.orderStatusListeners.has(orderId)) {
      this.orderStatusListeners.set(orderId, new Set());
    }
    this.orderStatusListeners.get(orderId)!.add(callback);
    return () => {
      this.orderStatusListeners.get(orderId)?.delete(callback);
    };
  }

  subscribeToKitchenTickets(callback: Listener<Order[]>): () => void {
    this.kitchenListeners.add(callback);
    return () => {
      this.kitchenListeners.delete(callback);
    };
  }

  emitKitchenTicketUpdate(orderId: string, status: OrderStatus): void {
    this.notifyOrderStatusUpdated(orderId, status);
  }

  subscribeToOrderChanges(callback: () => void): () => void {
    this.orderChangeListeners.add(callback);
    return () => {
      this.orderChangeListeners.delete(callback);
    };
  }

  notifyOrderChanges(): void {
    this.orderChangeListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Order change listener error', e);
      }
    });
  }

  // -------------------------------------------------------------------------
  // SERVICE REQUESTS
  // -------------------------------------------------------------------------
  subscribeToServiceRequests(callback: Listener<ServiceRequest[]>): () => void {
    this.serviceListeners.add(callback);
    return () => {
      this.serviceListeners.delete(callback);
    };
  }

  notifyServiceRequestsUpdate(requests: ServiceRequest[]): void {
    this.serviceListeners.forEach((cb) => {
      try { cb(requests); } catch (e) { console.error('Service request listener error', e); }
    });
  }

  notifyServiceRequestCreated(req: ServiceRequest): void {
    this.serviceListeners.forEach((cb) => {
      try { cb([req]); } catch (e) { console.error('Service request created listener error', e); }
    });
  }

  notifyServiceRequestUpdated(req: ServiceRequest): void {
    this.serviceListeners.forEach((cb) => {
      try { cb([req]); } catch (e) { console.error('Service request updated listener error', e); }
    });
  }

  // -------------------------------------------------------------------------
  // BILLING
  // -------------------------------------------------------------------------
  subscribeToBill(billId: string, callback: Listener<Bill>): () => void {
    if (!this.billListeners.has(billId)) {
      this.billListeners.set(billId, new Set());
    }
    this.billListeners.get(billId)!.add(callback);
    return () => {
      this.billListeners.get(billId)?.delete(callback);
    };
  }

  notifyBillUpdated(bill: Bill): void {
    const listeners = this.billListeners.get(bill.id);
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb(bill); } catch (e) { console.error('Bill listener error', e); }
      });
    }
  }

  // -------------------------------------------------------------------------
  // TABLES
  // -------------------------------------------------------------------------
  subscribeToFloorTables(callback: Listener<RestaurantTable[]>): () => void {
    this.tableListeners.add(callback);
    return () => {
      this.tableListeners.delete(callback);
    };
  }

  notifyFloorTablesUpdated(tables: RestaurantTable[]): void {
    this.tableListeners.forEach((cb) => {
      try { cb(tables); } catch (e) { console.error('Tables listener error', e); }
    });
  }

  // -------------------------------------------------------------------------
  // TABLE EVENTS BROADCAST
  // -------------------------------------------------------------------------
  subscribeToEvents(sessionId: string, callback: Listener<TableSessionEvent>): () => void {
    if (!this.eventListeners.has(sessionId)) {
      this.eventListeners.set(sessionId, new Set());
    }
    this.eventListeners.get(sessionId)!.add(callback);
    return () => {
      this.eventListeners.get(sessionId)?.delete(callback);
    };
  }

  emitTableEvent(event: TableSessionEvent): void {
    const listeners = this.eventListeners.get(event.sessionId);
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb(event); } catch (e) { console.error('Table event listener error', e); }
      });
    }
  }

  disconnect(): void {
    this.sessionListeners.clear();
    this.ordersListeners.clear();
    this.orderStatusListeners.clear();
    this.kitchenListeners.clear();
    this.serviceListeners.clear();
    this.billListeners.clear();
    this.eventListeners.clear();
    this.tableListeners.clear();
  }
}

export const realtimeService = new RealtimeEventBus();
