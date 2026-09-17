/**
 * Enterprise Production Observability & Telemetry Service
 * 
 * Tracks system events, client errors, API failures, payment outcomes,
 * and realtime reconnects without leaking sensitive data or external dependencies.
 */

export type ErrorSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ObservabilityEvent {
  id: string;
  timestamp: string;
  category: 'API' | 'PAYMENT' | 'AUTH' | 'REALTIME' | 'AI' | 'KDS' | 'INVENTORY' | 'SECURITY';
  action: string;
  severity: ErrorSeverity;
  message: string;
  metadata?: Record<string, any>;
  tenantId?: string;
  sessionId?: string;
}

export type StandardErrorCode =
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'ORDER_FAILED'
  | 'INSUFFICIENT_PERMISSION'
  | 'RESTAURANT_UNAVAILABLE'
  | 'SERVICE_TEMPORARILY_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN_ERROR';

export interface StandardErrorResponse {
  code: StandardErrorCode;
  userMessage: string;
  suggestedAction: string;
  timestamp: string;
  eventId?: string;
}

const ERROR_CODE_MAPPINGS: Record<StandardErrorCode, { message: string; action: string }> = {
  NETWORK_ERROR: {
    message: 'Unable to reach the restaurant service. Please check your network connection.',
    action: 'We will automatically retry connecting. You can also pull down to refresh.',
  },
  SESSION_EXPIRED: {
    message: 'Your dining session has concluded or expired.',
    action: 'Please scan the table QR code to resume or request staff assistance.',
  },
  PAYMENT_FAILED: {
    message: 'Your payment could not be completed by the gateway.',
    action: 'Please try an alternative payment method or pay at the counter.',
  },
  ORDER_FAILED: {
    message: 'We were unable to transmit your order to the kitchen fire line.',
    action: 'Your order was not placed. Please tap submit again or notify your server.',
  },
  INSUFFICIENT_PERMISSION: {
    message: 'You do not have authorization to access this operational resource.',
    action: 'Please log in with appropriate role credentials.',
  },
  RESTAURANT_UNAVAILABLE: {
    message: 'The selected restaurant location is currently outside operating hours.',
    action: 'Please contact the restaurant directly for operating schedules.',
  },
  SERVICE_TEMPORARILY_UNAVAILABLE: {
    message: 'This feature is temporarily degraded or undergoing routine maintenance.',
    action: 'Core dining and kitchen operations remain active. Please try again shortly.',
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests were sent in a short period.',
    action: 'Please wait a moment before sending another request.',
  },
  VALIDATION_FAILED: {
    message: 'The submitted request contained invalid or incomplete parameters.',
    action: 'Please verify all item quantities and selections and retry.',
  },
  UNKNOWN_ERROR: {
    message: 'An unexpected problem occurred while processing your request.',
    action: 'Please notify a staff member if this issue persists.',
  },
};

class ObservabilityService {
  private events: ObservabilityEvent[] = [];
  private maxEvents = 200;
  private listeners: Set<(event: ObservabilityEvent) => void> = new Set();

  constructor() {
    // Listen to global unhandled promise rejections safely in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.record({
          category: 'API',
          action: 'UNHANDLED_PROMISE_REJECTION',
          severity: 'ERROR',
          message: event.reason?.message || 'Unhandled rejection in runtime',
          metadata: { reason: String(event.reason) },
        });
      });
    }
  }

  record(params: Omit<ObservabilityEvent, 'id' | 'timestamp'>): ObservabilityEvent {
    const event: ObservabilityEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...params,
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in observability listener', err);
      }
    });

    // Console logging with production format
    if (params.severity === 'CRITICAL' || params.severity === 'ERROR') {
      console.error(`[Observability ${params.severity}] [${params.category}] ${params.action}: ${params.message}`);
    }

    return event;
  }

  formatUserError(code: StandardErrorCode, technicalDetails?: any): StandardErrorResponse {
    const mapping = ERROR_CODE_MAPPINGS[code] || ERROR_CODE_MAPPINGS.UNKNOWN_ERROR;
    const recorded = this.record({
      category: 'API',
      action: 'USER_ERROR_TRIGGERED',
      severity: code === 'PAYMENT_FAILED' || code === 'ORDER_FAILED' ? 'ERROR' : 'WARNING',
      message: `${code}: ${mapping.message}`,
      metadata: { technicalDetails },
    });

    return {
      code,
      userMessage: mapping.message,
      suggestedAction: mapping.action,
      timestamp: recorded.timestamp,
      eventId: recorded.id,
    };
  }

  getRecentEvents(category?: ObservabilityEvent['category']): ObservabilityEvent[] {
    if (category) {
      return this.events.filter((e) => e.category === category);
    }
    return [...this.events];
  }

  getMetricsSummary() {
    const total = this.events.length;
    const errors = this.events.filter((e) => e.severity === 'ERROR' || e.severity === 'CRITICAL').length;
    const warnings = this.events.filter((e) => e.severity === 'WARNING').length;
    const payments = this.events.filter((e) => e.category === 'PAYMENT').length;
    const realtimeEvents = this.events.filter((e) => e.category === 'REALTIME').length;

    return {
      totalEvents: total,
      errorCount: errors,
      warningCount: warnings,
      paymentEventsCount: payments,
      realtimeEventsCount: realtimeEvents,
      healthScore: total > 0 ? Math.max(0, Math.round(((total - errors) / total) * 100)) : 100,
    };
  }

  subscribe(listener: (event: ObservabilityEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.events = [];
  }
}

export const observability = new ObservabilityService();
