import { useState, useCallback, useMemo, useEffect } from 'react';
import { Order, CartItem, OrderStatus, SessionParticipant } from '../types';
import { DEMO_INITIAL_ACTIVE_ORDER } from '../data/mockData';
import { createOrderFromCart } from '../services/orderService';
import { sessionStorageService } from '../services/sessionStorageService';
import { realtimeService } from '../services/realtimeService';
import { inventoryService } from '../services/inventoryService';

export const useOrders = (tableNumber: string = '18') => {
  const [orders, setOrders] = useState<Order[]>(() => {
    return sessionStorageService.loadOrders() || [DEMO_INITIAL_ACTIVE_ORDER];
  });

  // Reusable live orders refresher
  const refreshLiveOrders = useCallback(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setOrders(data.orders);
        }
      })
      .catch(() => {
        // Fallback to local session storage
      });
  }, []);

  // Fetch on mount and subscribe to realtime order stream events
  useEffect(() => {
    refreshLiveOrders();
    const unsub = realtimeService.subscribeToOrderChanges(() => {
      refreshLiveOrders();
    });
    return unsub;
  }, [refreshLiveOrders]);

  // Sync to local session persistence
  useEffect(() => {
    sessionStorageService.saveOrders(orders);
  }, [orders]);

  const placeOrder = useCallback(
    (
      cart: CartItem[],
      specialInstructions: string = '',
      crewCount: number = 3,
      participant?: SessionParticipant | null
    ): Order => {
      const newOrder = createOrderFromCart(
        cart,
        specialInstructions,
        crewCount,
        participant,
        tableNumber
      );
      setOrders((prev) => [...prev, newOrder]);

      // Sync with hosted backend API & Supabase
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch((err) => console.warn('[useOrders] Order sync error:', err));

      return newOrder;
    },
    [tableNumber]
  );

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updated = { ...order, status: newStatus };
          // Deduct inventory idempotently upon finalized delivery
          if (newStatus === 'DELIVERED') {
            inventoryService.consumeInventoryForOrder(updated, 'Kitchen Pitmaster');
          }
          return updated;
        }
        return order;
      })
    );

    // Sync status change with hosted backend & Supabase
    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch((err) => console.warn('[useOrders] Status sync error:', err));
  }, []);

  const activeOrder = useMemo(() => {
    return orders[orders.length - 1] || DEMO_INITIAL_ACTIVE_ORDER;
  }, [orders]);

  return {
    orders,
    activeOrder,
    placeOrder,
    updateOrderStatus,
    orderCount: orders.length,
  };
};
