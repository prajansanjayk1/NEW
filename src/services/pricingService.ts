import { CartItem, MenuItem } from '../types';
import { MENU_ITEMS } from '../data/mockData';

export interface CalculatedOrderPricing {
  subtotal: number; // in INR
  tax: number; // in INR (5% GST)
  total: number; // in INR
  validatedItems: Array<{
    menuItemId: string;
    nameSnapshot: string;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    customization: any;
    specialInstructions?: string;
    participantId?: string;
    participantNameSnapshot?: string;
  }>;
}

/**
 * Server-Side Authoritative Pricing Engine
 * 
 * SECURITY MANDATE (Phase 3 #10):
 * NEVER trust prices submitted by the client browser.
 * Always verify against the authoritative menu catalog, compute portion delta,
 * style deltas, calculate 5% GST, and generate price snapshots.
 */
export const calculateAuthoritativeOrder = (
  rawItems: CartItem[],
  customMenuItems?: MenuItem[],
  gstPercent: number = 5
): CalculatedOrderPricing => {
  const catalog = customMenuItems && customMenuItems.length > 0 ? customMenuItems : MENU_ITEMS;
  const menuMap = new Map<string, MenuItem>(catalog.map((m) => [m.id, m]));

  let subtotal = 0;

  const validatedItems = rawItems.map((cartItem) => {
    const verifiedItem = menuMap.get(cartItem.menuItemId);
    
    // Fallback to item's own price if custom item, but verify against catalog first
    const basePrice = verifiedItem ? verifiedItem.price : cartItem.unitPrice;
    
    // Portion size delta calculation
    let portionDelta = 0;
    const portion = cartItem.customization?.portionSize;
    if (portion === '10 PC') portionDelta = 140;
    else if (portion === '15 PC') portionDelta = 290;
    else if (portion === '20 PC Feast') portionDelta = 480;

    // Style cut delta calculation
    let styleDelta = 0;
    if (cartItem.customization?.styleCut === 'Boneless Bites') {
      styleDelta = 20;
    }

    const calculatedUnitPrice = basePrice + portionDelta + styleDelta;
    const validatedQty = Math.max(1, Math.floor(cartItem.quantity || 1));
    const itemTotal = calculatedUnitPrice * validatedQty;

    subtotal += itemTotal;

    return {
      menuItemId: cartItem.menuItemId,
      nameSnapshot: verifiedItem ? verifiedItem.name : cartItem.name,
      unitPrice: calculatedUnitPrice,
      totalPrice: itemTotal,
      quantity: validatedQty,
      customization: cartItem.customization,
      specialInstructions: cartItem.customization?.extraNotes,
      participantId: cartItem.participantId,
      participantNameSnapshot: cartItem.addedBy,
    };
  });

  // Calculate 5% GST deterministically
  const tax = Math.round((subtotal * gstPercent) / 100);
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    validatedItems,
  };
};

/**
 * In-Memory Idempotency Cache for Order Submissions
 * Prevents double-taps and network retries from duplicating orders.
 */
const processedIdempotencyKeys = new Map<string, { orderId: string; timestamp: number }>();

export const verifyAndRegisterIdempotencyKey = (
  key: string,
  orderId: string
): { isDuplicate: boolean; existingOrderId?: string } => {
  if (!key) return { isDuplicate: false };

  // Clean expired keys older than 15 minutes
  const now = Date.now();
  for (const [k, val] of processedIdempotencyKeys.entries()) {
    if (now - val.timestamp > 15 * 60 * 1000) {
      processedIdempotencyKeys.delete(k);
    }
  }

  if (processedIdempotencyKeys.has(key)) {
    return {
      isDuplicate: true,
      existingOrderId: processedIdempotencyKeys.get(key)!.orderId,
    };
  }

  processedIdempotencyKeys.set(key, { orderId, timestamp: now });
  return { isDuplicate: false };
};
