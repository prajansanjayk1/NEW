/**
 * Phase 9 — Multi-Restaurant SaaS Platform, Tenant Isolation & Organization Management Types
 */

import { UserRole } from '../types';

export type ExtendedUserRole = UserRole | 'PLATFORM_ADMIN';

export type OrganizationRole = 'OWNER' | 'ORGANIZATION_ADMIN' | 'ORGANIZATION_MANAGER';

export type RestaurantStatus = 'SETUP' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface TaxConfiguration {
  taxName: string;
  ratePercent: number;
  taxNumber?: string;
  inclusive: boolean;
}

export interface DayOperatingHours {
  open: string; // "11:00"
  close: string; // "23:00"
  closed: boolean;
}

export interface OperatingHours {
  monday: DayOperatingHours;
  tuesday: DayOperatingHours;
  wednesday: DayOperatingHours;
  thursday: DayOperatingHours;
  friday: DayOperatingHours;
  saturday: DayOperatingHours;
  sunday: DayOperatingHours;
}

export interface RestaurantBranding {
  logo?: string;
  coverImage?: string;
  primaryColor: string; // e.g. "#ff5708"
  secondaryColor: string; // e.g. "#ffb86d"
  tagline: string;
  themeMode?: 'DARK' | 'LIGHT' | 'SYSTEM';
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  slug: string;
  logoUrl?: string;
  billingEmail?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  restaurantCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  displayName: string;
  email: string;
  role: OrganizationRole;
  isActive: boolean;
  createdAt: string;
}

export interface RestaurantMembership {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  restaurantCity: string;
  restaurantStatus: RestaurantStatus;
  userId: string;
  role: ExtendedUserRole;
  permissions: Permission[];
  isActive: boolean;
}

export type Permission =
  | 'VIEW_MENU'
  | 'EDIT_MENU'
  | 'MANAGE_TABLES'
  | 'VIEW_ORDERS'
  | 'MANAGE_ORDERS'
  | 'ACCESS_KDS'
  | 'MANAGE_INVENTORY'
  | 'MANAGE_SUPPLIERS'
  | 'APPROVE_PURCHASE_ORDER'
  | 'MANAGE_RECIPES'
  | 'VIEW_ANALYTICS'
  | 'VIEW_FORECASTS'
  | 'VIEW_BILLING'
  | 'PROCESS_REFUND'
  | 'MANAGE_STAFF'
  | 'MANAGE_RESTAURANT'
  | 'MANAGE_BRANDING'
  | 'MANAGE_SUBSCRIPTION'
  | 'PLATFORM_MANAGE';

export type SubscriptionTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export type FeatureEntitlement =
  | 'BASIC_MENU'
  | 'QR_ORDERING'
  | 'KDS'
  | 'INVENTORY'
  | 'PROCUREMENT'
  | 'RECIPES'
  | 'AI_CONCIERGE'
  | 'AI_COPILOT'
  | 'ADVANCED_ANALYTICS'
  | 'FORECASTING'
  | 'MULTI_LOCATION'
  | 'ORGANIZATION_ANALYTICS'
  | 'CUSTOM_BRANDING'
  | 'EXPORTS'
  | 'API_ACCESS'
  | 'PRIORITY_SUPPORT';

export interface SubscriptionPlan {
  id: string;
  code: SubscriptionTier;
  name: string;
  description: string;
  priceMonthlyMinor: number;
  priceAnnualMinor: number;
  currency: string;
  features: FeatureEntitlement[];
  limits: {
    activeTables: number;
    monthlyOrders: number;
    staffAccounts: number;
    aiRequests: number;
    locations: number;
  };
}

export interface Subscription {
  id: string;
  restaurantId: string;
  organizationId?: string;
  planCode: SubscriptionTier;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageRecord {
  restaurantId: string;
  monthlyOrders: number;
  aiRequests: number;
  activeTables: number;
  staffAccounts: number;
  storageMb: number;
  periodStart: string;
  periodEnd: string;
}

export interface OrganizationAnalyticsSummary {
  organizationId: string;
  organizationName: string;
  totalLocations: number;
  activeLocations: number;
  aggregatedGrossRevenue: number;
  aggregatedOrdersCount: number;
  aggregatedAverageOrderValue: number;
  locationBreakdown: Array<{
    restaurantId: string;
    name: string;
    slug: string;
    city: string;
    status: RestaurantStatus;
    revenue: number;
    ordersCount: number;
    aov: number;
    tableTurnover: number;
  }>;
}

export interface TenantSecurityTestResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  statusText: string;
  latencyMs: number;
  actor: {
    id: string;
    role: string;
    tenantId: string;
  };
  targetTenantId: string;
  operation: string;
  details?: string;
}

export interface RestaurantOnboardingData {
  // Step 1: Business Info
  businessName: string;
  legalEntityName: string;
  organizationId?: string;
  gstOrTaxNumber: string;
  
  // Step 2: Restaurant Profile
  restaurantName: string;
  slug: string;
  description: string;
  phone: string;
  email: string;

  // Step 3: Location
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;

  // Step 4: Operating Hours
  operatingHours: OperatingHours;

  // Step 5: Currency & Tax
  currency: string;
  currencySymbol: string;
  gstPercent: number;

  // Step 6: Initial Tables
  tableCount: number;
  zones: string[];

  // Step 7: Menu Setup
  menuTemplate: 'WINGS_GRILL' | 'BURGER_BAR' | 'CAFE_FAST_CASUAL' | 'BLANK';

  // Step 8: Staff
  managerName: string;
  managerEmail: string;

  // Step 9: Branding
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  logoUrl?: string;
}
