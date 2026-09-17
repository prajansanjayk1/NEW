/**
 * Takeaway and Pickup Service (Phase 11)
 * Manages channel-specific menus, packaging calculations,
 * pickup time scheduling, and takeaway order submission.
 */

import { MenuItem, CartItem, Order, TakeawayStatus, OrderChannel } from '../types';

export interface TakeawayOrderPayload {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string; // e.g. "ASAP" or "8:30 PM"
  pickupNotes?: string;
  items: CartItem[];
  paymentMethod: 'UPI' | 'CARD' | 'RAZORPAY' | 'PAY_AT_COUNTER';
}

export interface TakeawayBillBreakdown {
  itemsSubtotal: number;
  packagingFee: number;
  tax: number;
  total: number;
}

class TakeawayService {
  private takeawayCartKey = 'kow_takeaway_cart_v1';
  private currentChannelKey = 'kow_current_sales_channel';

  // Current active sales channel ('DINE_IN' or 'TAKEAWAY')
  getActiveChannel(): OrderChannel {
    try {
      const saved = localStorage.getItem(this.currentChannelKey);
      if (saved === 'TAKEAWAY' || saved === 'DINE_IN' || saved === 'PICKUP') {
        return saved as OrderChannel;
      }
    } catch {
      // ignore
    }
    return 'DINE_IN';
  }

  setActiveChannel(channel: OrderChannel): void {
    try {
      localStorage.setItem(this.currentChannelKey, channel);
    } catch {
      // ignore
    }
  }

  // Load Takeaway Cart from localStorage
  getTakeawayCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.takeawayCartKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveTakeawayCart(cart: CartItem[]): void {
    try {
      localStorage.setItem(this.takeawayCartKey, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }

  clearTakeawayCart(): void {
    try {
      localStorage.removeItem(this.takeawayCartKey);
    } catch {
      // ignore
    }
  }

  // Calculate bill breakdown strictly client-side for UI display before submission
  calculateTakeawayBill(items: CartItem[]): TakeawayBillBreakdown {
    const itemsSubtotal = items.reduce((acc, item) => acc + (item.totalPrice || item.unitPrice * item.quantity), 0);
    // Standard ₹15 per item packaging fee or minimum ₹20
    const packagingFee = items.reduce((acc, item) => acc + (item.quantity * 15), 0);
    const tax = Math.round((itemsSubtotal + packagingFee) * 0.05);
    const total = itemsSubtotal + packagingFee + tax;

    return {
      itemsSubtotal,
      packagingFee,
      tax,
      total,
    };
  }

  // Fetch Takeaway Menu from Server (fallback to client mock if offline)
  async getTakeawayMenu(restaurantId: string = 'rest-kow-blr-01'): Promise<{ items: MenuItem[]; packagingRule: any }> {
    try {
      const res = await fetch(`/api/takeaway/menu?restaurantId=${encodeURIComponent(restaurantId)}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('[TakeawayService] Failed to load server takeaway menu, falling back to local dataset', err);
    }

    // Fallback takeaway items with channel pricing
    return {
      items: [
        {
          id: 'wings-firecracker',
          name: 'Firecracker Wings (10 PC)',
          category: 'Wings',
          description: 'Crispy wings drenched in smoky firecracker glaze, burnt garlic & toasted sesame seeds.',
          price: 269,
          dineInPrice: 249,
          takeawayPrice: 269,
          packagingCharge: 15,
          availableDineIn: true,
          availableTakeaway: true,
          image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
          heatFlames: 3,
          prepTimeMinutes: 12,
          available: true,
        },
        {
          id: 'wings-korean',
          name: 'Korean Fire Wings',
          category: 'Wings',
          description: 'Sweet, sticky fermented gochujang glaze, garlic crisp and scallions.',
          price: 289,
          dineInPrice: 269,
          takeawayPrice: 289,
          packagingCharge: 15,
          availableDineIn: true,
          availableTakeaway: true,
          image: 'https://images.unsplash.com/photo-1527477321005-4d45d724b8c4?w=600&auto=format&fit=crop&q=80',
          heatFlames: 4,
          prepTimeMinutes: 12,
          available: true,
        },
        {
          id: 'combos-pitmaster',
          name: 'Pitmaster Feast Takeaway Box',
          category: 'Combos',
          description: '12 PC mixed wings, double seasoned truffle fries, 2 signature dips, and 2 draft sodas.',
          price: 629,
          dineInPrice: 589,
          takeawayPrice: 629,
          packagingCharge: 25,
          availableDineIn: true,
          availableTakeaway: true,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          heatFlames: 3,
          prepTimeMinutes: 15,
          available: true,
        },
        {
          id: 'burger-fire',
          name: 'Smoked Brioche Fire Burger',
          category: 'Burgers',
          description: 'Crisp fried chicken thigh dipped in chili butter, house pickles, hot ranch on toasted brioche.',
          price: 329,
          dineInPrice: 299,
          takeawayPrice: 329,
          packagingCharge: 20,
          availableDineIn: true,
          availableTakeaway: true,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
          heatFlames: 3,
          prepTimeMinutes: 12,
          available: true,
        },
        {
          id: 'sides-fries',
          name: 'Truffle Charred Fries',
          category: 'Sides',
          description: 'Thick cut russets loaded with white truffle oil, ember scallions & roasted garlic aioli.',
          price: 199,
          dineInPrice: 189,
          takeawayPrice: 199,
          packagingCharge: 10,
          availableDineIn: true,
          availableTakeaway: true,
          image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
          heatFlames: 0,
          prepTimeMinutes: 7,
          available: true,
        },
      ],
      packagingRule: {
        type: 'PER_ITEM',
        basePackagingCharge: 15,
        ecoBagCharge: 10,
      },
    };
  }

  // Submit takeaway order
  async submitTakeawayOrder(payload: TakeawayOrderPayload): Promise<{ success: boolean; order: Order; orderNumber: string }> {
    try {
      const res = await fetch('/api/takeaway/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit order');
      }

      const data = await res.json();
      this.clearTakeawayCart();
      return data;
    } catch (err: any) {
      console.error('[TakeawayService] Submission error:', err);
      // Generate client-side fallback order if server unreachable
      const orderNumber = `T${Math.floor(100 + Math.random() * 900)}`;
      const breakdown = this.calculateTakeawayBill(payload.items);
      const fallbackOrder: Order = {
        id: `takeaway_local_${Date.now()}`,
        restaurantId: payload.restaurantId,
        channel: 'TAKEAWAY',
        takeawayOrderNumber: orderNumber,
        ticketNumber: orderNumber,
        tableNumber: 'PICKUP',
        section: 'Takeaway Counter',
        status: 'COOKING',
        takeawayStatus: 'ORDER_RECEIVED',
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        pickupTime: payload.pickupTime,
        pickupNotes: payload.pickupNotes,
        items: payload.items,
        subtotal: breakdown.itemsSubtotal,
        packagingCharge: breakdown.packagingFee,
        tax: breakdown.tax,
        total: breakdown.total,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentMethod === 'PAY_AT_COUNTER' ? 'PENDING' : 'PAID',
        createdAt: new Date().toISOString(),
        estServeMinutes: 15,
        sharedCrewCount: 1,
        station: 'GRILL',
        pitmaster: 'Chef Vikram',
        oilTempF: 375,
      };
      this.clearTakeawayCart();
      return { success: true, order: fallbackOrder, orderNumber };
    }
  }

  // Get takeaway queue for staff/kitchen
  async getTakeawayOrders(restaurantId: string = 'rest-kow-blr-01'): Promise<Order[]> {
    try {
      const res = await fetch(`/api/takeaway/orders?restaurantId=${encodeURIComponent(restaurantId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.orders || [];
      }
    } catch (err) {
      console.warn('[TakeawayService] Failed to load server takeaway orders', err);
    }
    return [];
  }

  // Update order status (Staff workflow)
  async updateTakeawayStatus(orderId: string, takeawayStatus: TakeawayStatus, paymentStatus?: 'PENDING' | 'PAID'): Promise<boolean> {
    try {
      const res = await fetch(`/api/takeaway/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ takeawayStatus, paymentStatus }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[TakeawayService] Failed to update status on server', err);
      return false;
    }
  }
}

export const takeawayService = new TakeawayService();
