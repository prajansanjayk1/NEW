import { 
  Bill, 
  BillSplitMode, 
  BillParticipantShare, 
  BillItemSnapshot, 
  BillStatus, 
  Order, 
  SessionParticipant,
  CartItem
} from '../types';
import { 
  calculateTax, 
  calculateDiscount, 
  calculateServiceCharge, 
  calculateBillTotal, 
  calculateEqualSplit,
  minorToMajor
} from '../utils/currency';

export interface GenerateBillOptions {
  orders: Order[];
  participants: SessionParticipant[];
  splitMode?: BillSplitMode;
  restaurantId?: string;
  tableNumber: string;
  sessionId: string;
  taxRatePercent?: number; // default 5.0 (GST)
  serviceChargePercent?: number; // default 0 or 5.0
  discount?: { type: 'PERCENT' | 'FIXED'; value: number };
  customAllocations?: Record<string, number>; // participantId -> amount_minor
}

export class BillingService {
  /**
   * Authoritative Bill Generator
   * Computes deterministic integer minor units (paise) for all financial snapshots.
   */
  generateBill(options: GenerateBillOptions): Bill {
    const {
      orders,
      participants,
      splitMode = 'ITEM_SPLIT',
      restaurantId = 'rest-kow-blr-01',
      tableNumber,
      sessionId,
      taxRatePercent = 5.0,
      serviceChargePercent = 0.0,
      discount = null,
      customAllocations = {},
    } = options;

    // Filter out cancelled orders
    const validOrders = orders.filter((o) => o.status !== 'DELIVERED' || true); // keep active table orders
    const allOrderItems: CartItem[] = validOrders.flatMap((o) => o.items);

    // Calculate subtotal in minor units (paise)
    // CartItem.totalPrice is in major units or minor units?
    // In our app, order.subtotal is in major INR (e.g. 199), let's ensure conversion to paise:
    let subtotal_minor = 0;
    const itemsSnapshot: BillItemSnapshot[] = [];

    allOrderItems.forEach((item, index) => {
      // If price is stored in major INR, convert to paise:
      const unitPrice_minor = Math.round(item.unitPrice * 100);
      const totalPrice_minor = Math.round(item.totalPrice * 100);
      subtotal_minor += totalPrice_minor;

      itemsSnapshot.push({
        id: `snap-${item.id}-${index}`,
        menuItemId: item.menuItemId,
        name: item.name,
        unitPrice_minor,
        quantity: item.quantity,
        totalPrice_minor,
        participantId: item.participantId,
        participantName: item.addedBy,
        customizations: item.customization,
      });
    });

    // Authoritative financial calculations
    const discount_minor = calculateDiscount(subtotal_minor, discount);
    const tax_minor = calculateTax(subtotal_minor - discount_minor, taxRatePercent);
    const service_charge_minor = calculateServiceCharge(subtotal_minor - discount_minor, serviceChargePercent);
    const total_minor = calculateBillTotal(subtotal_minor, tax_minor, discount_minor, service_charge_minor);

    // Active participants fallback
    const activeParticipants: SessionParticipant[] = participants.length > 0 ? participants : [
      {
        id: 'part-host',
        sessionId,
        displayName: 'Table Host',
        avatarEmoji: '👑',
        initials: 'TH',
        color: 'bg-[#ff5708]',
        role: 'HOST',
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isActive: true,
        itemCount: allOrderItems.length,
      },
    ];

    // Compute shares based on Split Mode
    const shares = this.computeShares({
      splitMode,
      activeParticipants,
      allOrderItems,
      subtotal_minor,
      tax_minor,
      service_charge_minor,
      discount_minor,
      total_minor,
      customAllocations,
    });

    const primaryTicket = validOrders.length > 0 ? validOrders[0].ticketNumber : `TKT-${tableNumber}-01`;
    const billId = `bill-sess-${sessionId || tableNumber}`;

    return {
      id: billId,
      restaurantId,
      sessionId,
      ticketNumber: primaryTicket,
      tableNumber,
      splitMode,

      // Authoritative integer minor units
      subtotal_minor,
      tax_minor,
      discount_minor,
      service_charge_minor,
      total_minor,
      amount_paid_minor: 0,
      amount_due_minor: total_minor,

      // Display major units
      subtotal: minorToMajor(subtotal_minor),
      tax: minorToMajor(tax_minor),
      discount: minorToMajor(discount_minor),
      serviceCharge: minorToMajor(service_charge_minor),
      total: minorToMajor(total_minor),
      amountPaid: 0,
      amountDue: minorToMajor(total_minor),

      shares,
      itemsSnapshot,
      paymentStatus: 'OPEN',
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compute shares for the selected split mode with zero rounding drift
   */
  private computeShares(params: {
    splitMode: BillSplitMode;
    activeParticipants: SessionParticipant[];
    allOrderItems: CartItem[];
    subtotal_minor: number;
    tax_minor: number;
    service_charge_minor: number;
    discount_minor: number;
    total_minor: number;
    customAllocations: Record<string, number>;
  }): BillParticipantShare[] {
    const {
      splitMode,
      activeParticipants,
      allOrderItems,
      subtotal_minor,
      tax_minor,
      service_charge_minor,
      discount_minor,
      total_minor,
      customAllocations,
    } = params;

    const count = activeParticipants.length;

    // 1. EQUAL SPLIT: Deterministic integer split across all diners
    if (splitMode === 'EQUAL_SPLIT') {
      const splitShares_minor = calculateEqualSplit(total_minor, count);
      const subtotalShares_minor = calculateEqualSplit(subtotal_minor, count);
      const taxShares_minor = calculateEqualSplit(tax_minor, count);

      return activeParticipants.map((p, idx) => {
        const shareTotal_minor = splitShares_minor[idx] || 0;
        const shareSubtotal_minor = subtotalShares_minor[idx] || 0;
        const shareTax_minor = taxShares_minor[idx] || 0;

        return {
          participantId: p.id,
          participantName: p.displayName,
          avatarEmoji: p.avatarEmoji || '🍗',
          itemCount: p.itemCount || 1,
          itemSubtotal: minorToMajor(shareSubtotal_minor),
          taxShare: minorToMajor(shareTax_minor),
          totalShare: minorToMajor(shareTotal_minor),
          itemSubtotal_minor: shareSubtotal_minor,
          taxShare_minor: shareTax_minor,
          totalShare_minor: shareTotal_minor,
          isPaid: false,
          orderedItems: allOrderItems.filter((i) => i.participantId === p.id),
        };
      });
    }

    // 2. ITEM SPLIT: Group by diner items + proportional taxes/charges
    if (splitMode === 'ITEM_SPLIT') {
      let allocatedTotal_minor = 0;
      const shares: BillParticipantShare[] = [];

      activeParticipants.forEach((p, idx) => {
        const pItems = allOrderItems.filter(
          (i) => i.participantId === p.id || (i.addedBy && i.addedBy.includes(p.displayName.split(' ')[0]))
        );

        const pSubtotal_minor = pItems.reduce((sum, item) => sum + Math.round(item.totalPrice * 100), 0);
        
        // Proportional tax & charges
        const propRatio = subtotal_minor > 0 ? pSubtotal_minor / subtotal_minor : 1 / count;
        const pTax_minor = Math.round(tax_minor * propRatio);
        const pService_minor = Math.round(service_charge_minor * propRatio);
        const pDiscount_minor = Math.round(discount_minor * propRatio);
        const pTotal_minor = Math.max(0, pSubtotal_minor - pDiscount_minor + pTax_minor + pService_minor);

        allocatedTotal_minor += pTotal_minor;

        shares.push({
          participantId: p.id,
          participantName: p.displayName,
          avatarEmoji: p.avatarEmoji || '🍗',
          itemCount: pItems.reduce((acc, i) => acc + i.quantity, 0),
          itemSubtotal: minorToMajor(pSubtotal_minor),
          taxShare: minorToMajor(pTax_minor),
          totalShare: minorToMajor(pTotal_minor),
          itemSubtotal_minor: pSubtotal_minor,
          taxShare_minor: pTax_minor,
          totalShare_minor: pTotal_minor,
          isPaid: false,
          orderedItems: pItems,
        });
      });

      // Zero-drift reconciliation: allocate remainder paise to first participant (host)
      const drift_minor = total_minor - allocatedTotal_minor;
      if (drift_minor !== 0 && shares.length > 0) {
        shares[0].totalShare_minor = (shares[0].totalShare_minor || 0) + drift_minor;
        shares[0].totalShare = minorToMajor(shares[0].totalShare_minor);
      }

      return shares;
    }

    // 3. CUSTOM SPLIT: Explicit amounts entered by customers
    if (splitMode === 'CUSTOM_SPLIT') {
      let allocatedTotal_minor = 0;
      const shares = activeParticipants.map((p) => {
        const customAmount_minor = customAllocations[p.id] !== undefined 
          ? customAllocations[p.id] 
          : Math.floor(total_minor / count);
        
        allocatedTotal_minor += customAmount_minor;

        return {
          participantId: p.id,
          participantName: p.displayName,
          avatarEmoji: p.avatarEmoji || '🍗',
          itemCount: 1,
          itemSubtotal: minorToMajor(customAmount_minor),
          taxShare: 0,
          totalShare: minorToMajor(customAmount_minor),
          itemSubtotal_minor: customAmount_minor,
          taxShare_minor: 0,
          totalShare_minor: customAmount_minor,
          isPaid: false,
          orderedItems: allOrderItems.filter((i) => i.participantId === p.id),
        };
      });

      return shares;
    }

    // 4. FULL_BILL: Single payer covers entire bill
    const primaryPayer = activeParticipants[0];
    return [
      {
        participantId: primaryPayer.id,
        participantName: primaryPayer.displayName,
        avatarEmoji: primaryPayer.avatarEmoji || '👑',
        itemCount: allOrderItems.reduce((acc, i) => acc + i.quantity, 0),
        itemSubtotal: minorToMajor(subtotal_minor),
        taxShare: minorToMajor(tax_minor),
        totalShare: minorToMajor(total_minor),
        itemSubtotal_minor: subtotal_minor,
        taxShare_minor: tax_minor,
        totalShare_minor: total_minor,
        isPaid: false,
        orderedItems: allOrderItems,
      },
    ];
  }

  /**
   * Update bill status and recalculate paid and due balances
   */
  applyPayment(bill: Bill, amount_minor: number, participantId?: string): {
    updatedBill: Bill;
    isFullyPaid: boolean;
  } {
    const newPaid_minor = (bill.amount_paid_minor || 0) + amount_minor;
    const total_minor = bill.total_minor || Math.round(bill.total * 100);
    const newDue_minor = Math.max(0, total_minor - newPaid_minor);

    const isFullyPaid = newDue_minor === 0;
    let nextStatus: BillStatus = bill.paymentStatus as BillStatus;

    if (isFullyPaid) {
      nextStatus = 'PAID';
    } else if (newPaid_minor > 0) {
      nextStatus = 'PARTIALLY_PAID';
    }

    // Mark specific share as paid if matching participant
    const updatedShares = bill.shares.map((share) => {
      if (participantId && share.participantId === participantId) {
        return { ...share, isPaid: true, paidAt: new Date().toISOString() };
      }
      if (isFullyPaid) {
        return { ...share, isPaid: true, paidAt: share.paidAt || new Date().toISOString() };
      }
      return share;
    });

    const updatedBill: Bill = {
      ...bill,
      amount_paid_minor: newPaid_minor,
      amount_due_minor: newDue_minor,
      amountPaid: minorToMajor(newPaid_minor),
      amountDue: minorToMajor(newDue_minor),
      paymentStatus: nextStatus,
      paidAt: isFullyPaid ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : bill.paidAt,
      shares: updatedShares,
      updatedAt: new Date().toISOString(),
    };

    return { updatedBill, isFullyPaid };
  }
}

export const billingService = new BillingService();

// Maintain backward compatibility with the existing functional export
export const generateBillFromOrder = (
  order: Order,
  participants: SessionParticipant[],
  mode: BillSplitMode = 'ITEM_SPLIT'
): Bill => {
  return billingService.generateBill({
    orders: [order],
    participants,
    splitMode: mode,
    tableNumber: order.tableNumber,
    sessionId: `sess-t${order.tableNumber}-active`,
  });
};
