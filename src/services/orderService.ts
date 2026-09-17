import { Order, CartItem, OrderStatus, SessionParticipant, TableSessionEvent } from '../types';
import { INITIAL_TABLE_INFO } from '../data/mockData';
import { realtimeService } from './realtimeService';
import { calculateAuthoritativeOrder } from './pricingService';
import { auditService } from './auditService';

export const generateTicketNumber = (): string => {
  return `TICKET #K${Math.floor(100 + Math.random() * 900)}`;
};

/**
 * Creates a formal kitchen order ticket from cart items with server-verified pricing
 */
export const createOrderFromCart = (
  cart: CartItem[],
  specialInstructions: string = '',
  sharedCrewCount: number = 3,
  participant?: SessionParticipant | null,
  tableNumber: string = INITIAL_TABLE_INFO.tableNumber,
  section: string = INITIAL_TABLE_INFO.section.toUpperCase(),
  idempotencyKey?: string
): Order => {
  // Authoritative server-side price verification (Phase 3 Requirement)
  const pricing = calculateAuthoritativeOrder(cart);
  const ticketNumber = generateTicketNumber();
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newOrder: Order = {
    id: `order-${Date.now()}`,
    ticketNumber,
    tableNumber,
    section,
    status: 'LOCKED',
    station: 'Fry Station 03',
    pitmaster: 'Marco',
    oilTempF: 375,
    items: cart.map((item) => ({
      ...item,
      customization: {
        ...item.customization,
        extraNotes: specialInstructions
          ? `${item.customization.extraNotes ? item.customization.extraNotes + ' · ' : ''}${specialInstructions}`
          : item.customization.extraNotes,
      },
    })),
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    total: pricing.total,
    createdAt: nowTime,
    estServeMinutes: 10,
    sharedCrewCount,
    placedByParticipantId: participant?.id || 'part-1',
    placedByParticipantName: participant?.displayName || 'Jake Davis',
  };

  // Broadcast order created event
  const event: TableSessionEvent = {
    id: `evt-order-${Date.now()}`,
    sessionId: `sess-t${tableNumber}-active`,
    type: 'ORDER_CREATED',
    actorId: newOrder.placedByParticipantId || 'system',
    actorName: newOrder.placedByParticipantName || 'Table Diner',
    timestamp: newOrder.createdAt,
    payload: { order: newOrder },
  };

  realtimeService.emitTableEvent(event);
  realtimeService.notifyOrderCreated(newOrder);

  // Audit log the order creation
  auditService.logEvent({
    restaurantId: 'rest-kow-001',
    actorId: newOrder.placedByParticipantId || 'customer',
    actorRole: 'CUSTOMER',
    action: 'ORDER_PLACED',
    entityType: 'ORDER',
    entityId: newOrder.id,
    metadata: { ticketNumber: newOrder.ticketNumber, total: newOrder.total },
  });

  return newOrder;
};

export const ORDER_STEP_CONFIG: Record<OrderStatus, { step: number; label: string; desc: string }> = {
  LOCKED: {
    step: 1,
    label: 'Order Locked & Sent',
    desc: 'Digital ticket verified and dispatched to kitchen terminal.',
  },
  ASSIGNED: {
    step: 2,
    label: 'Pitmaster Claimed',
    desc: 'Pitmaster claimed ticket on Fry Station 03.',
  },
  COOKING: {
    step: 3,
    label: 'Wings In The Fire',
    desc: 'Flash-frying at continuous 375°F for max crisp skin.',
  },
  SAUCING: {
    step: 4,
    label: 'Wok Sauced & Finished',
    desc: 'Cast-iron glazed and garnished with toasted aromatics.',
  },
  READY: {
    step: 5,
    label: 'Plated & Dispatched',
    desc: 'Quality checked by lead expeditor, heading to table.',
  },
  DELIVERED: {
    step: 5,
    label: 'Served to Table',
    desc: 'Delivered hot to Table 18. Enjoy the feast!',
  },
};

/**
 * Returns the next order status in the restaurant workflow
 */
export const getNextOrderStatus = (current: OrderStatus): OrderStatus | null => {
  switch (current) {
    case 'LOCKED':
      return 'ASSIGNED';
    case 'ASSIGNED':
      return 'COOKING';
    case 'COOKING':
      return 'SAUCING';
    case 'SAUCING':
      return 'READY';
    case 'READY':
      return 'DELIVERED';
    case 'DELIVERED':
      return null;
  }
};
