import { 
  PaymentProvider, 
  CreatePaymentOrderParams, 
  PaymentOrderResult, 
  VerifyPaymentParams, 
  PaymentVerificationResult, 
  PaymentStatusResult, 
  RefundPaymentParams, 
  PaymentRefundResult 
} from './paymentTypes';

export interface RazorpayStandardModalOptions {
  orderId: string;
  amount_minor: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

export class RazorpayPaymentProvider implements PaymentProvider {
  public readonly name = 'RAZORPAY';
  public readonly mode = 'LIVE' as const;

  private keyId: string | null = null;

  constructor() {
    // Only public key is loaded in client
    this.keyId = import.meta.env.VITE_PAYMENT_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID || null;
  }

  isConfigured(): boolean {
    return Boolean(this.getKeyId());
  }

  getKeyId(): string {
    return this.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_PAYMENT_KEY_ID || 'rzp_test_SANDBOX_DEMO';
  }

  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: params.amount_minor,
          amount_minor: params.amount_minor,
          currency: params.currency || 'INR',
          receipt: `${params.ticketNumber || params.billId || 'rcpt'}`.substring(0, 40),
          tableNumber: params.tableNumber,
          restaurantId: params.restaurantId,
          billId: params.billId,
          participantId: params.participantId,
          participantName: params.participantName,
          paymentMethod: params.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        orderId: data.order_id || data.orderId || data.id,
        amount_minor: data.amount || data.amount_minor || params.amount_minor,
        currency: data.currency || 'INR',
        providerKeyId: data.key_id || data.keyId || this.getKeyId(),
        provider: 'RAZORPAY',
        isDemo: false,
      };
    } catch (err: any) {
      return {
        success: false,
        orderId: '',
        amount_minor: params.amount_minor,
        currency: params.currency || 'INR',
        provider: 'RAZORPAY',
        isDemo: false,
        errorMessage: err.message || 'Failed to create payment order on gateway',
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: params.providerOrderId,
          payment_id: params.providerPaymentId,
          signature: params.providerSignature,
          razorpay_order_id: params.providerOrderId,
          razorpay_payment_id: params.providerPaymentId,
          razorpay_signature: params.providerSignature,
          amount_minor: params.amount_minor,
          amount: params.amount_minor / 100,
          currency: params.currency || 'INR',
          restaurantId: params.restaurantId,
          billId: params.billId,
          participantId: params.participantId,
          paymentMethod: params.paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Verification failed (${response.status})`);
      }

      const data = await response.json();
      return {
        verified: data.verified ?? true,
        paymentId: data.paymentId,
        providerPaymentId: data.providerPaymentId || data.razorpay_payment_id || params.providerPaymentId,
        transactionReference: data.transactionReference,
        amount_minor: data.amount_minor || params.amount_minor,
        currency: data.currency || 'INR',
        status: data.status || 'SUCCESS',
        verifiedAt: data.verifiedAt || new Date().toISOString(),
        isDemo: false,
      };
    } catch (err: any) {
      return {
        verified: false,
        paymentId: '',
        providerPaymentId: params.providerPaymentId,
        transactionReference: '',
        amount_minor: params.amount_minor,
        currency: params.currency || 'INR',
        status: 'FAILED',
        verifiedAt: new Date().toISOString(),
        isDemo: false,
        errorMessage: err.message || 'Payment signature verification failed',
      };
    }
  }

  /**
   * Launch the official Razorpay Standard Checkout modal popup
   */
  openCheckoutModal(options: RazorpayStandardModalOptions): void {
    if (typeof window === 'undefined') {
      options.onError?.(new Error('Window context unavailable'));
      return;
    }

    const RazorpayConstructor = (window as any).Razorpay;
    if (!RazorpayConstructor) {
      const errorMsg = 'Razorpay checkout script not yet loaded. Please try again.';
      console.error(errorMsg);
      options.onError?.(new Error(errorMsg));
      return;
    }

    const checkoutOptions = {
      key: this.getKeyId(),
      amount: options.amount_minor,
      currency: options.currency || 'INR',
      name: options.name || 'Kings of Wings',
      description: options.description || 'Table Dining & Bar Bill',
      image: '/icon.png',
      order_id: options.orderId,
      handler: function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        options.onSuccess(response);
      },
      prefill: {
        name: options.prefill?.name || 'Guest',
        email: options.prefill?.email || 'guest@kingsofwings.com',
        contact: options.prefill?.contact || '9876543210',
      },
      notes: options.notes || {
        source: 'restaurant_pos_kiosk',
      },
      theme: {
        color: '#ff5708',
      },
      modal: {
        ondismiss: function () {
          console.log('[Razorpay Modal Dismissed]');
          options.onDismiss?.();
        },
      },
    };

    try {
      const rzpInstance = new RazorpayConstructor(checkoutOptions);
      rzpInstance.on('payment.failed', function (failResp: any) {
        console.error('[Razorpay Payment Failed Callback]', failResp.error);
        options.onError?.(failResp.error || new Error('Payment processing failed'));
      });
      rzpInstance.open();
    } catch (err: any) {
      console.error('[Razorpay Modal Open Exception]', err);
      options.onError?.(err);
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const response = await fetch(`/api/payments/status/${providerPaymentId}`);
    if (!response.ok) {
      throw new Error(`Failed to check payment status (${response.status})`);
    }
    return response.json();
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentRefundResult> {
    const response = await fetch('/api/payments/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        refundId: '',
        amount_minor: params.amount_minor,
        status: 'FAILED',
        errorMessage: err.error || 'Refund request failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      refundId: data.refundId,
      providerRefundId: data.providerRefundId,
      amount_minor: data.amount_minor,
      status: data.status || 'PROCESSED',
    };
  }
}

export const razorpayPaymentProvider = new RazorpayPaymentProvider();

