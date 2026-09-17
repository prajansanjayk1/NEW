import { MenuItem, CustomizationOption, CartItem, SessionParticipant } from '../types';

export const calculateItemPrice = (
  basePrice: number,
  customization?: Partial<CustomizationOption>
): number => {
  const portionDelta = customization?.portionPriceDelta || 0;
  const styleDelta = customization?.styleCutDelta || 0;
  return basePrice + portionDelta + styleDelta;
};

export const createCartItem = (
  item: MenuItem,
  customization: CustomizationOption,
  quantity: number = 1,
  participant?: SessionParticipant | null,
  fallbackName: string = 'Jake Davis (You)'
): CartItem => {
  const unitPrice = calculateItemPrice(item.price, customization);
  return {
    id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    menuItemId: item.id,
    name: item.name,
    image: item.image,
    unitPrice,
    totalPrice: unitPrice * quantity,
    quantity,
    customization,
    addedBy: participant ? participant.displayName : fallbackName,
    participantId: participant ? participant.id : 'part-1',
    addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

export interface CartTotals {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export const calculateCartTotals = (cart: CartItem[]): CartTotals => {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    total,
    itemCount,
  };
};

/**
 * Groups cart items by participant for table transparency
 */
export interface ParticipantCartGroup {
  participantId: string;
  participantName: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export const groupCartByParticipant = (cart: CartItem[]): ParticipantCartGroup[] => {
  const map = new Map<string, ParticipantCartGroup>();

  cart.forEach((item) => {
    const pId = item.participantId || 'unknown';
    const pName = item.addedBy || 'Table Diner';

    if (!map.has(pId)) {
      map.set(pId, {
        participantId: pId,
        participantName: pName,
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const group = map.get(pId)!;
    group.items.push(item);
    group.subtotal += item.totalPrice;
    group.itemCount += item.quantity;
  });

  return Array.from(map.values());
};
