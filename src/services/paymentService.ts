import { 
  PaymentRecord, 
  PaymentMethod, 
  PaymentStatus, 
  Bill, 
  RefundRecord, 
  DailyPaymentSummary, 
  PaymentReconciliation 
} from '../types';
import { getSupabaseClient } from './supabaseClient';
import { auditService } from './auditService';
import { paymentManager } from './payment/paymentManager';
import { realtimeService } from './realtimeService';
import { billingService } from './billingService';
import { majorToMinor, minorToMajor } from '../utils/currency';

export interface ProcessPaymentParams {
  restaurantId: string;
  bill: Bill;
  participantId?: string;
  participantName?: string;
  amount_minor: number; // in paise
  paymentMethod: PaymentMethod;
  idempotencyKey?: string;
}

export interface PaymentExecutionResult {
  success: boolean;
  paymentRecord?: PaymentRecord;
  updatedBill?: Bill;
  isFullyPaid: boolean;
  transactionReference: string;
  isDemo: boolean;
  errorMessage?: string;
}

export class PaymentService {
  private payments: Map<string, PaymentRecord> = new Map();
  private refunds: Map<string, RefundRecord> = new Map();
  private inFlightTransactions: Set<string> = new Set();

  /**
   * Orchestrate full end-to-end payment:
   * 1. Check idempotency & in-flight locks
   * 2. Provider create order
   * 3. Provider verify payment
   * 4. Record payment (DB + memory)
   * 5. Apply payment to bill
   * 6. Realtime dispatch & audit trail
   */
  async processPayment(params: ProcessPaymentParams): Promise<PaymentExecutionResult> {
    const {
      restaurantId,
      bill,
      participantId,
      participantName,
      amount_minor,
      paymentMethod,
      idempotencyKey = `idemp-${bill.id}-${participantId || 'all'}-${Date.now()}`,
    } = params;

    // Guard against rapid duplicate double-clicks
    if (this.inFlightTransactions.has(idempotencyKey)) {
      return {
        success: false,
        isFullyPaid: false,
        transactionReference: '',
        isDemo: paymentManager.isDemoMode(),
        errorMessage: 'A payment for this share is already in flight. Please wait a moment.',
      };
    }

    this.inFlightTransactions.add(idempotencyKey);

    try {
      const provider = paymentManager.getProvider();
      const isDemo = provider.mode === 'DEMO';

      // 1. Create order on gateway
      const orderResult = await provider.createPaymentOrder({
        restaurantId,
        billId: bill.id,
        tableNumber: bill.tableNumber,
        ticketNumber: bill.ticketNumber,
        participantId,
        participantName,
        amount_minor,
        currency: 'INR',
        paymentMethod,
        idempotencyKey,
      });

      if (!orderResult.success) {
        throw new Error(orderResult.errorMessage || 'Gateway order creation failed');
      }

      // 2. Simulate or verify gateway payment completion
      const simPaymentId = `pay_${isDemo ? 'demo_' : ''}${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const simSignature = `sig_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

      const verifyResult = await provider.verifyPayment({
        restaurantId,
        billId: bill.id,
        participantId,
        paymentMethod,
        providerOrderId: orderResult.orderId,
        providerPaymentId: simPaymentId,
        providerSignature: simSignature,
        amount_minor,
        currency: 'INR',
        idempotencyKey,
      });

      if (!verifyResult.verified) {
        // Record failed payment attempt for compliance and auditing
        const failedRecord: PaymentRecord = {
          id: `pay-fail-${Date.now()}`,
          restaurantId,
          billId: bill.id,
          participantId,
          participantName,
          paymentMethod,
          amount_minor,
          amount: minorToMajor(amount_minor),
          currency: 'INR',
          transactionReference: `FAIL-${Date.now()}`,
          status: 'FAILED',
          provider: provider.name,
          failureReason: verifyResult.errorMessage || 'Verification failed',
          isDemo,
          createdAt: new Date().toISOString(),
        };
        this.payments.set(failedRecord.id, failedRecord);

        await auditService.logEvent({
          restaurantId,
          actorId: participantId || 'guest',
          actorRole: 'CUSTOMER',
          action: 'PAYMENT_FAILED',
          entityType: 'PAYMENT',
          entityId: failedRecord.id,
          metadata: { billId: bill.id, amount_minor, reason: verifyResult.errorMessage },
        });

        return {
          success: false,
          paymentRecord: failedRecord,
          isFullyPaid: false,
          transactionReference: failedRecord.transactionReference,
          isDemo,
          errorMessage: verifyResult.errorMessage || 'Payment could not be verified by gateway',
        };
      }

      // 3. Create successful payment record
      const paymentRecord: PaymentRecord = {
        id: verifyResult.paymentId || `pay-${Date.now()}`,
        restaurantId,
        billId: bill.id,
        participantId,
        participantName,
        paymentMethod,
        amount_minor,
        amount: minorToMajor(amount_minor),
        currency: 'INR',
        transactionReference: verifyResult.transactionReference,
        status: 'SUCCESS',
        provider: provider.name,
        providerOrderId: orderResult.orderId,
        providerPaymentId: verifyResult.providerPaymentId,
        providerSignature: simSignature,
        verifiedAt: verifyResult.verifiedAt,
        isDemo,
        createdAt: new Date().toISOString(),
      };

      this.payments.set(paymentRecord.id, paymentRecord);

      // Persist to Supabase if configured
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('payments').insert({
            id: paymentRecord.id,
            restaurant_id: paymentRecord.restaurantId,
            bill_id: paymentRecord.billId,
            participant_id: paymentRecord.participantId,
            payment_method: paymentRecord.paymentMethod,
            amount_cents: paymentRecord.amount_minor,
            currency: paymentRecord.currency,
            transaction_reference: paymentRecord.transactionReference,
            status: paymentRecord.status,
            created_at: paymentRecord.createdAt,
          });
        } catch (dbErr) {
          console.warn('Supabase payment insert fallback to local store:', dbErr);
        }
      }

      // 4. Update Bill balances deterministically
      const { updatedBill, isFullyPaid } = billingService.applyPayment(bill, amount_minor, participantId);

      // 5. Notify Realtime bus
      realtimeService.notifyBillUpdated(updatedBill);

      // 6. Audit Trail
      await auditService.logEvent({
        restaurantId,
        actorId: participantId || 'guest',
        actorRole: 'CUSTOMER',
        action: 'PAYMENT_SUCCEEDED',
        entityType: 'PAYMENT',
        entityId: paymentRecord.id,
        metadata: {
          billId: bill.id,
          amount_minor,
          amount_major: paymentRecord.amount,
          paymentMethod,
          isFullyPaid,
          txRef: paymentRecord.transactionReference,
          isDemo,
        },
      });

      return {
        success: true,
        paymentRecord,
        updatedBill,
        isFullyPaid,
        transactionReference: paymentRecord.transactionReference,
        isDemo,
      };
    } finally {
      this.inFlightTransactions.delete(idempotencyKey);
    }
  }

  /**
   * Directly record a payment that was verified by gateway modal callback (e.g. Razorpay Standard Checkout)
   */
  async recordVerifiedPayment(params: {
    restaurantId: string;
    bill: Bill;
    participantId?: string;
    participantName?: string;
    amount_minor: number;
    paymentMethod: PaymentMethod;
    providerOrderId: string;
    providerPaymentId: string;
    providerSignature?: string;
    transactionReference?: string;
    isDemo?: boolean;
  }): Promise<PaymentExecutionResult> {
    const {
      restaurantId,
      bill,
      participantId,
      participantName,
      amount_minor,
      paymentMethod,
      providerOrderId,
      providerPaymentId,
      providerSignature,
      transactionReference = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      isDemo = false,
    } = params;

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId,
      billId: bill.id,
      participantId,
      participantName,
      paymentMethod,
      amount_minor,
      amount: minorToMajor(amount_minor),
      currency: 'INR',
      transactionReference,
      status: 'SUCCESS',
      provider: isDemo ? 'DEMO' : 'RAZORPAY',
      providerOrderId,
      providerPaymentId,
      providerSignature,
      verifiedAt: new Date().toISOString(),
      isDemo,
      createdAt: new Date().toISOString(),
    };

    this.payments.set(paymentRecord.id, paymentRecord);

    // Persist to Supabase if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('payments').insert({
          id: paymentRecord.id,
          restaurant_id: paymentRecord.restaurantId,
          bill_id: paymentRecord.billId,
          participant_id: paymentRecord.participantId,
          payment_method: paymentRecord.paymentMethod,
          amount_cents: paymentRecord.amount_minor,
          currency: paymentRecord.currency,
          transaction_reference: paymentRecord.transactionReference,
          status: paymentRecord.status,
          created_at: paymentRecord.createdAt,
        });
      } catch (dbErr) {
        console.warn('Supabase payment insert fallback to local store:', dbErr);
      }
    }

    // Update Bill balances deterministically
    const { updatedBill, isFullyPaid } = billingService.applyPayment(bill, amount_minor, participantId);

    // Notify Realtime bus
    realtimeService.notifyBillUpdated(updatedBill);

    // Audit Trail
    await auditService.logEvent({
      restaurantId,
      actorId: participantId || 'guest',
      actorRole: 'CUSTOMER',
      action: 'PAYMENT_SUCCEEDED',
      entityType: 'PAYMENT',
      entityId: paymentRecord.id,
      metadata: {
        billId: bill.id,
        amount_minor,
        amount_major: paymentRecord.amount,
        paymentMethod,
        isFullyPaid,
        txRef: paymentRecord.transactionReference,
        providerOrderId,
        providerPaymentId,
        isDemo,
      },
    });

    return {
      success: true,
      paymentRecord,
      updatedBill,
      isFullyPaid,
      transactionReference: paymentRecord.transactionReference,
      isDemo,
    };
  }

  /**
   * Process Full or Partial Refund (Manager/Admin action)
   */
  async refundPayment(params: {
    restaurantId: string;
    billId: string;
    paymentId: string;
    amount_minor: number;
    reason: string;
    requestedBy: string;
    processedBy: string;
  }): Promise<{ success: boolean; refund?: RefundRecord; error?: string }> {
    const payment = this.payments.get(params.paymentId);
    if (!payment) {
      return { success: false, error: 'Original payment record not found.' };
    }

    if (payment.status !== 'SUCCESS') {
      return { success: false, error: 'Only successful payments can be refunded.' };
    }

    const previouslyRefunded_minor = payment.refundedAmount_minor || 0;
    const remainingRefundable_minor = payment.amount_minor - previouslyRefunded_minor;

    if (params.amount_minor > remainingRefundable_minor) {
      return {
        success: false,
        error: `Refund amount (${minorToMajor(params.amount_minor)}) exceeds available refundable balance (${minorToMajor(remainingRefundable_minor)})`,
      };
    }

    const provider = paymentManager.getProvider();
    const refundResult = await provider.refundPayment({
      restaurantId: params.restaurantId,
      billId: params.billId,
      paymentId: params.paymentId,
      providerPaymentId: payment.providerPaymentId,
      amount_minor: params.amount_minor,
      reason: params.reason,
      requestedBy: params.requestedBy,
      processedBy: params.processedBy,
    });

    if (!refundResult.success) {
      return { success: false, error: refundResult.errorMessage || 'Payment gateway rejected the refund.' };
    }

    const refundRecord: RefundRecord = {
      id: refundResult.refundId,
      restaurantId: params.restaurantId,
      billId: params.billId,
      paymentId: params.paymentId,
      amount_minor: params.amount_minor,
      amount: minorToMajor(params.amount_minor),
      currency: 'INR',
      reason: params.reason,
      requestedBy: params.requestedBy,
      processedBy: params.processedBy,
      providerRefundId: refundResult.providerRefundId,
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    };

    this.refunds.set(refundRecord.id, refundRecord);

    // Update payment record with refunded amount
    payment.refundedAmount_minor = previouslyRefunded_minor + params.amount_minor;
    if (payment.refundedAmount_minor >= payment.amount_minor) {
      payment.status = 'REFUNDED';
    }
    this.payments.set(payment.id, payment);

    await auditService.logEvent({
      restaurantId: params.restaurantId,
      actorId: params.processedBy,
      actorRole: 'MANAGER',
      action: 'REFUND_PROCESSED',
      entityType: 'PAYMENT_REFUND',
      entityId: refundRecord.id,
      metadata: {
        paymentId: payment.id,
        amount_minor: params.amount_minor,
        reason: params.reason,
      },
    });

    return { success: true, refund: refundRecord };
  }

  getPaymentsForBill(billId: string): PaymentRecord[] {
    return Array.from(this.payments.values()).filter((p) => p.billId === billId);
  }

  getAllPayments(): PaymentRecord[] {
    return Array.from(this.payments.values());
  }

  getAllRefunds(): RefundRecord[] {
    return Array.from(this.refunds.values());
  }

  /**
   * Daily Payment Financial Summary (Section 27)
   */
  getDailyPaymentSummary(): DailyPaymentSummary {
    const all = Array.from(this.payments.values());
    const successful = all.filter((p) => p.status === 'SUCCESS' || p.status === 'REFUNDED');
    const failed = all.filter((p) => p.status === 'FAILED');
    const pending = all.filter((p) => p.status === 'PENDING' || p.status === 'INITIATED');
    const allRefunds = Array.from(this.refunds.values()).filter((r) => r.status === 'PROCESSED');

    const successfulAmount_minor = successful.reduce((sum, p) => sum + p.amount_minor, 0);
    const pendingAmount_minor = pending.reduce((sum, p) => sum + p.amount_minor, 0);
    const refundsAmount_minor = allRefunds.reduce((sum, r) => sum + r.amount_minor, 0);
    const netCollected_minor = Math.max(0, successfulAmount_minor - refundsAmount_minor);

    const methodBreakdown: Record<PaymentMethod, number> = {
      UPI: 0,
      CARD: 0,
      CASH: 0,
      WALLET: 0,
    };

    successful.forEach((p) => {
      methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] || 0) + p.amount_minor;
    });

    return {
      totalSales_minor: successfulAmount_minor,
      successfulPaymentsCount: successful.length,
      successfulAmount_minor,
      pendingAmount_minor,
      failedPaymentsCount: failed.length,
      refundsCount: allRefunds.length,
      refundsAmount_minor,
      netCollected_minor,
      methodBreakdown,
    };
  }

  /**
   * Payment Reconciliation Report (Section 26)
   */
  getReconciliation(bills: Bill[]): PaymentReconciliation[] {
    return bills.map((bill) => {
      const billPayments = this.getPaymentsForBill(bill.id).filter((p) => p.status === 'SUCCESS' || p.status === 'REFUNDED');
      const billRefunds = Array.from(this.refunds.values()).filter((r) => r.billId === bill.id && r.status === 'PROCESSED');

      const collected_minor = billPayments.reduce((sum, p) => sum + p.amount_minor, 0);
      const refunded_minor = billRefunds.reduce((sum, r) => sum + r.amount_minor, 0);
      const netCollected_minor = collected_minor - refunded_minor;
      const expectedTotal_minor = bill.total_minor || Math.round(bill.total * 100);
      const due_minor = Math.max(0, expectedTotal_minor - netCollected_minor);

      const isReconciled = bill.paymentStatus === 'PAID' ? due_minor === 0 : true;
      const difference_minor = netCollected_minor - expectedTotal_minor;

      return {
        billId: bill.id,
        ticketNumber: bill.ticketNumber,
        tableNumber: bill.tableNumber,
        expectedTotal_minor,
        collectedAmount_minor: netCollected_minor,
        dueAmount_minor: due_minor,
        refundedAmount_minor: refunded_minor,
        status: (difference_minor === 0 || (bill.paymentStatus !== 'PAID' && due_minor >= 0)) ? 'RECONCILED' : 'PAYMENT_MISMATCH',
        difference_minor,
        paymentCount: billPayments.length,
        refundCount: billRefunds.length,
      };
    });
  }

  async getGatewayConfig(): Promise<{
    provider: string;
    mode: 'LIVE' | 'DEMO';
    currency: string;
    webhookConfigured: boolean;
  }> {
    try {
      const res = await fetch('/api/payments/config');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // offline / mock fallback
    }
    const provider = paymentManager.getProvider();
    return {
      provider: provider.name,
      mode: provider.mode,
      currency: 'INR',
      webhookConfigured: false,
    };
  }
}

export const paymentService = new PaymentService();
