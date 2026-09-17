import { PaymentProvider } from './paymentTypes';
import { demoPaymentProvider } from './DemoPaymentProvider';
import { razorpayPaymentProvider } from './RazorpayPaymentProvider';

class PaymentManager {
  private activeProvider: PaymentProvider;
  private forceDemoMode: boolean = false;

  constructor() {
    const configuredMode = import.meta.env.VITE_PAYMENT_PROVIDER_MODE;
    if (configuredMode === 'LIVE' && razorpayPaymentProvider.isConfigured()) {
      this.activeProvider = razorpayPaymentProvider;
    } else {
      this.activeProvider = demoPaymentProvider;
    }
  }

  getProvider(): PaymentProvider {
    if (this.forceDemoMode) {
      return demoPaymentProvider;
    }
    return this.activeProvider;
  }

  isDemoMode(): boolean {
    return this.getProvider().mode === 'DEMO';
  }

  setDemoMode(enabled: boolean): void {
    this.forceDemoMode = enabled;
  }

  getProviderName(): string {
    return this.getProvider().name;
  }
}

export const paymentManager = new PaymentManager();
