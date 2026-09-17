import { useState, useCallback, useMemo, useEffect } from 'react';
import { Order, CartItem, OrderStatus, SessionParticipant } from '../types';
import { INITIAL_ACTIVE_ORDER } from '../data/mockData';
import { createOrderFromCart } from '../services/orderService';
import { sessionStorageService } from '../services/sessionStorageService';
import { realtimeService } from '../services/realtimeService';
import { inventoryService } from '../services/inventoryService';

export const useOrders = (tableNumber: string = '18') => {
  const [orders, setOrders] = useState<Order[]>(() => {
    return sessionStorageService.loadOrders() || [INITIAL_ACTIVE_ORDER];
  });

  // Sync to persistence
  useEffect(() => {
    sessionStorageService.saveOrders(orders);
    realtimeService.notifyOrdersUpdate(`sess-t${tableNumber}-active`, orders);
  }, [orders, tableNumber]);

  // Subscribe to real-time order updates
  useEffect(() => {
    const unsub = realtimeService.subscribeToOrders(`sess-t${tableNumber}-active`, (updated) => {
      setOrders(updated);
    });
    return unsub;
  }, [tableNumber]);

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
  }, []);

  const activeOrder = useMemo(() => {
    return orders[orders.length - 1] || INITIAL_ACTIVE_ORDER;
  }, [orders]);

  return {
    orders,
    activeOrder,
    placeOrder,
    updateOrderStatus,
    orderCount: orders.length,
  };
};
