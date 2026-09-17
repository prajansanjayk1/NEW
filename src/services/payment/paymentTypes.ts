import { PaymentMethod, PaymentStatus } from '../../types';

export interface CreatePaymentOrderParams {
  restaurantId: string;
  billId: string;
  tableNumber: string;
  ticketNumber: string;
  participantId?: string;
  participantName?: string;
  amount_minor: number; // in paise
  currency?: string; // 'INR'
  paymentMethod: PaymentMethod;
  notes?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PaymentOrderResult {
  success: boolean;
  orderId: string; // Gateway Order ID (e.g. order_xxx or demo_ord_xxx)
  amount_minor: number;
  currency: string;
  providerKeyId?: string;
  provider: string;
  isDemo: boolean;
  errorMessage?: string;
}

export interface VerifyPaymentParams {
  restaurantId: string;
  billId: string;
  participantId?: string;
  paymentMethod: PaymentMethod;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
  amount_minor: number;
  currency?: string;
  idempotencyKey?: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  paymentId: string;
  providerPaymentId: string;
  transactionReference: string;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  verifiedAt: string;
  isDemo: boolean;
  errorMessage?: string;
}

export interface PaymentStatusResult {
  providerPaymentId: string;
  status: PaymentStatus;
  amount_minor: number;
  currency: string;
  method?: PaymentMethod;
  captured: boolean;
}

export interface RefundPaymentParams {
  restaurantId: string;
  billId: string;
  paymentId: string;
  providerPaymentId?: string;
  amount_minor: number;
  reason: string;
  requestedBy: string;
  processedBy: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId: string;
  providerRefundId?: string;
  amount_minor: number;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly mode: 'LIVE' | 'DEMO';
  isConfigured(): boolean;
  createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult>;
  refundPayment(params: RefundPaymentParams): Promise<PaymentRefundResult>;
}
