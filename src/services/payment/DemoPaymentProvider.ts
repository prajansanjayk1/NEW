import { PaymentProvider, CreatePaymentOrderParams, PaymentOrderResult, VerifyPaymentParams, PaymentVerificationResult, PaymentStatusResult, RefundPaymentParams, PaymentRefundResult } from './paymentTypes';

export class DemoPaymentProvider implements PaymentProvider {
  public readonly name = 'DEMO_SIMULATOR';
  public readonly mode = 'DEMO' as const;

  isConfigured(): boolean {
    return true;
  }

  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    // Generate deterministic demo order ID
    const demoOrderId = `order_demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    
    return {
      success: true,
      orderId: demoOrderId,
      amount_minor: params.amount_minor,
      currency: params.currency || 'INR',
      providerKeyId: 'rzp_test_DEMO_KEY_SANDBOX',
      provider: 'DEMO',
      isDemo: true,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    // Simulate server-side verification check
    if (!params.providerOrderId || !params.providerPaymentId) {
      return {
        verified: false,
        paymentId: '',
        providerPaymentId: '',
        transactionReference: '',
        amount_minor: params.amount_minor,
        currency: params.currency || 'INR',
        status: 'FAILED',
        verifiedAt: new Date().toISOString(),
        isDemo: true,
        errorMessage: 'Invalid provider verification payload: missing order or payment ID',
      };
    }

    const txRef = `TXN-DEMO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentId = `pay_demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      verified: true,
      paymentId,
      providerPaymentId: params.providerPaymentId,
      transactionReference: txRef,
      amount_minor: params.amount_minor,
      currency: params.currency || 'INR',
      status: 'SUCCESS',
      verifiedAt: new Date().toISOString(),
      isDemo: true,
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    return {
      providerPaymentId,
      status: 'SUCCESS',
      amount_minor: 0,
      currency: 'INR',
      captured: true,
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentRefundResult> {
    const refundId = `rfnd_demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      refundId,
      providerRefundId: `rpay_rfnd_demo_${Date.now()}`,
      amount_minor: params.amount_minor,
      status: 'PROCESSED',
    };
  }
}

export const demoPaymentProvider = new DemoPaymentProvider();
