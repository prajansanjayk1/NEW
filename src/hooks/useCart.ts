import { useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, MenuItem, CustomizationOption, SessionParticipant } from '../types';
import { createCartItem, calculateCartTotals, groupCartByParticipant, ParticipantCartGroup } from '../services/cartService';
import { sessionStorageService } from '../services/sessionStorageService';

export const useCart = (currentParticipant?: SessionParticipant | null) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    return sessionStorageService.loadCart();
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync to storage on change
  useEffect(() => {
    sessionStorageService.saveCart(cart);
  }, [cart]);

  const addToCart = useCallback(
    (
      item: MenuItem,
      customization: CustomizationOption,
      qty: number = 1,
      overrideParticipant?: SessionParticipant | null
    ) => {
      const activeParticipant = overrideParticipant || currentParticipant;
      const newItem = createCartItem(
        item,
        customization,
        qty,
        activeParticipant,
        activeParticipant ? activeParticipant.displayName : 'Jake Davis (You)'
      );
      setCart((prev) => [...prev, newItem]);
    },
    [currentParticipant]
  );

  const updateQuantity = useCallback((itemId: string, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        return prev.filter((item) => item.id !== itemId);
      }
      return prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            }
          : item
      );
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Filter for items added by current participant
  const myItems = useMemo(() => {
    if (!currentParticipant) return cart;
    return cart.filter((item) => item.participantId === currentParticipant.id);
  }, [cart, currentParticipant]);

  // Group all items by participant for the shared table cart
  const participantGroups = useMemo<ParticipantCartGroup[]>(() => {
    return groupCartByParticipant(cart);
  }, [cart]);

  const totals = useMemo(() => calculateCartTotals(cart), [cart]);
  const myTotals = useMemo(() => calculateCartTotals(myItems), [myItems]);

  return {
    cart,
    myItems,
    participantGroups,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    itemCount: totals.itemCount,
    mySubtotal: myTotals.subtotal,
    myTax: myTotals.tax,
    myTotal: myTotals.total,
    myCount: myTotals.itemCount,
  };
};
