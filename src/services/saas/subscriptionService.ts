/**
 * SaaS Subscription & Usage Limits Service (Phase 9)
 * 
 * Manages restaurant SaaS subscriptions, plan entitlements, usage tracking,
 * and billing provider abstraction (distinct from dining customer checkout).
 */

import {
  SubscriptionPlan,
  Subscription,
  SubscriptionTier,
  FeatureEntitlement,
  UsageRecord,
} from '../../types/saas';
import { permissionService } from './permissionService';
import { DEFAULT_RESTAURANT_ID } from '../restaurantDataService';
import { auditService } from '../auditService';

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    code: 'FREE',
    name: 'Community Starter',
    description: 'Single-table or trial cloud POS with basic QR menu',
    priceMonthlyMinor: 0,
    priceAnnualMinor: 0,
    currency: 'INR',
    features: ['BASIC_MENU', 'QR_ORDERING'],
    limits: {
      activeTables: 4,
      monthlyOrders: 150,
      staffAccounts: 2,
      aiRequests: 20,
      locations: 1,
    },
  },
  {
    id: 'plan-starter',
    code: 'STARTER',
    name: 'Express Pitmaster',
    description: 'Perfect for food trucks, single-concept diners & quick-service cafes',
    priceMonthlyMinor: 299900,
    priceAnnualMinor: 2999000,
    currency: 'INR',
    features: ['BASIC_MENU', 'QR_ORDERING', 'KDS', 'INVENTORY', 'CUSTOM_BRANDING'],
    limits: {
      activeTables: 12,
      monthlyOrders: 1000,
      staffAccounts: 6,
      aiRequests: 100,
      locations: 1,
    },
  },
  {
    id: 'plan-pro',
    code: 'PRO',
    name: 'Culinary Flagship',
    description: 'Comprehensive operations with AI Concierge, Recipes & Predictive Forecasting',
    priceMonthlyMinor: 799900,
    priceAnnualMinor: 7999000,
    currency: 'INR',
    features: [
      'BASIC_MENU',
      'QR_ORDERING',
      'KDS',
      'INVENTORY',
      'PROCUREMENT',
      'RECIPES',
      'AI_CONCIERGE',
      'AI_COPILOT',
      'ADVANCED_ANALYTICS',
      'FORECASTING',
      'CUSTOM_BRANDING',
      'EXPORTS',
    ],
    limits: {
      activeTables: 35,
      monthlyOrders: 5000,
      staffAccounts: 20,
      aiRequests: 500,
      locations: 3,
    },
  },
  {
    id: 'plan-enterprise',
    code: 'ENTERPRISE',
    name: 'Hospitality Empire',
    description: 'Multi-location enterprise groups with corporate analytics & dedicated SLAs',
    priceMonthlyMinor: 1999900,
    priceAnnualMinor: 19999000,
    currency: 'INR',
    features: [
      'BASIC_MENU',
      'QR_ORDERING',
      'KDS',
      'INVENTORY',
      'PROCUREMENT',
      'RECIPES',
      'AI_CONCIERGE',
      'AI_COPILOT',
      'ADVANCED_ANALYTICS',
      'FORECASTING',
      'MULTI_LOCATION',
      'ORGANIZATION_ANALYTICS',
      'CUSTOM_BRANDING',
      'EXPORTS',
      'API_ACCESS',
      'PRIORITY_SUPPORT',
    ],
    limits: {
      activeTables: 999,
      monthlyOrders: 999999,
      staffAccounts: 999,
      aiRequests: 5000,
      locations: 50,
    },
  },
];

export interface SaaSBillingProvider {
  createSubscription(restaurantId: string, planCode: SubscriptionTier): Promise<{ success: boolean; subscriptionId: string }>;
  cancelSubscription(subscriptionId: string): Promise<{ success: boolean }>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  handleWebhook(eventPayload: any, signature: string): Promise<{ received: boolean }>;
}

class SubscriptionService {
  private subscriptions: Map<string, Subscription> = new Map();
  private usageRecords: Map<string, UsageRecord> = new Map();

  constructor() {
    // Seed default subscriptions
    this.subscriptions.set(DEFAULT_RESTAURANT_ID, {
      id: 'sub-flagship',
      restaurantId: DEFAULT_RESTAURANT_ID,
      organizationId: '88888888-8888-4888-a888-888888888888',
      planCode: 'ENTERPRISE',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 14 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 16 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
    });

    this.subscriptions.set('b1234567-8fd0-46c2-ac57-1b30838d1461', {
      id: 'sub-tambaram',
      restaurantId: 'b1234567-8fd0-46c2-ac57-1b30838d1461',
      organizationId: '88888888-8888-4888-a888-888888888888',
      planCode: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 8 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 22 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
    });

    this.subscriptions.set('c2345678-8fd0-46c2-ac57-1b30838d1462', {
      id: 'sub-blr',
      restaurantId: 'c2345678-8fd0-46c2-ac57-1b30838d1462',
      organizationId: '88888888-8888-4888-a888-888888888888',
      planCode: 'STARTER',
      status: 'TRIALING',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
    });

    // Seed usage for flagship
    this.usageRecords.set(DEFAULT_RESTAURANT_ID, {
      restaurantId: DEFAULT_RESTAURANT_ID,
      monthlyOrders: 412,
      aiRequests: 184,
      activeTables: 14,
      staffAccounts: 8,
      storageMb: 48.6,
      periodStart: new Date(Date.now() - 14 * 86400000).toISOString(),
      periodEnd: new Date(Date.now() + 16 * 86400000).toISOString(),
    });
  }

  public getPlans(): SubscriptionPlan[] {
    return DEFAULT_PLANS;
  }

  public getPlanByCode(code: SubscriptionTier): SubscriptionPlan {
    return DEFAULT_PLANS.find((p) => p.code === code) || DEFAULT_PLANS[0];
  }

  public getRestaurantSubscription(restaurantId: string): Subscription {
    const sub = this.subscriptions.get(restaurantId);
    if (sub) return sub;

    // Fallback to PRO tier for unconfigured tenants
    const fallback: Subscription = {
      id: `sub-${restaurantId}`,
      restaurantId,
      planCode: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
    };
    this.subscriptions.set(restaurantId, fallback);
    return fallback;
  }

  public getRestaurantUsage(restaurantId: string): {
    usage: UsageRecord;
    plan: SubscriptionPlan;
    percentages: {
      orders: number;
      aiRequests: number;
      tables: number;
      staff: number;
    };
  } {
    const sub = this.getRestaurantSubscription(restaurantId);
    const plan = this.getPlanByCode(sub.planCode);
    const usage = this.usageRecords.get(restaurantId) || {
      restaurantId,
      monthlyOrders: 68,
      aiRequests: 24,
      activeTables: 6,
      staffAccounts: 3,
      storageMb: 12.4,
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    const pctOrders = Math.min(100, Math.round((usage.monthlyOrders / plan.limits.monthlyOrders) * 100));
    const pctAi = Math.min(100, Math.round((usage.aiRequests / plan.limits.aiRequests) * 100));
    const pctTables = Math.min(100, Math.round((usage.activeTables / plan.limits.activeTables) * 100));
    const pctStaff = Math.min(100, Math.round((usage.staffAccounts / plan.limits.staffAccounts) * 100));

    return {
      usage,
      plan,
      percentages: {
        orders: pctOrders,
        aiRequests: pctAi,
        tables: pctTables,
        staff: pctStaff,
      },
    };
  }

  public hasFeature(restaurantId: string, feature: FeatureEntitlement): boolean {
    const sub = this.getRestaurantSubscription(restaurantId);
    return permissionService.hasFeature(sub.planCode, feature);
  }

  public checkLimit(
    restaurantId: string,
    metric: 'activeTables' | 'monthlyOrders' | 'staffAccounts' | 'aiRequests'
  ): { allowed: boolean; current: number; limit: number; message?: string } {
    const sub = this.getRestaurantSubscription(restaurantId);
    const plan = this.getPlanByCode(sub.planCode);
    const usage = this.usageRecords.get(restaurantId);
    const current = usage ? usage[metric === 'activeTables' ? 'activeTables' : metric === 'monthlyOrders' ? 'monthlyOrders' : metric === 'staffAccounts' ? 'staffAccounts' : 'aiRequests'] : 0;
    const limit = plan.limits[metric];

    if (current >= limit) {
      return {
        allowed: false,
        current,
        limit,
        message: `Your current ${plan.name} plan limit of ${limit} ${metric} has been reached. Please upgrade to continue.`,
      };
    }

    return { allowed: true, current, limit };
  }

  public async upgradeSubscription(
    restaurantId: string,
    newPlanCode: SubscriptionTier
  ): Promise<{ success: boolean; subscription: Subscription }> {
    const existing = this.getRestaurantSubscription(restaurantId);
    const updated: Subscription = {
      ...existing,
      planCode: newPlanCode,
      status: 'ACTIVE',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    this.subscriptions.set(restaurantId, updated);

    await auditService.logEvent({
      restaurantId,
      actorId: 'admin',
      actorRole: 'ADMIN',
      action: 'SUBSCRIPTION_UPGRADED',
      entityType: 'RESTAURANT',
      entityId: restaurantId,
      metadata: { previousPlan: existing.planCode, newPlan: newPlanCode },
    });

    return { success: true, subscription: updated };
  }
}

export const subscriptionService = new SubscriptionService();
