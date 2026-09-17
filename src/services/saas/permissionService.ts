/**
 * Centralized Permission & Feature Entitlement Service (Phase 9)
 * 
 * Maps operational roles to permissions and subscription tiers to feature entitlements.
 * Guarantees that neither UI nor backend relies on ad-hoc scattered role checks.
 */

import { ExtendedUserRole, Permission, FeatureEntitlement, SubscriptionTier } from '../../types/saas';

// Role to Permissions Matrix
const ROLE_PERMISSIONS_MAP: Record<ExtendedUserRole, Permission[]> = {
  CUSTOMER: ['VIEW_MENU'],
  
  KITCHEN: [
    'VIEW_MENU',
    'VIEW_ORDERS',
    'ACCESS_KDS',
    'MANAGE_INVENTORY',
    'MANAGE_RECIPES',
  ],

  STAFF: [
    'VIEW_MENU',
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'MANAGE_TABLES',
    'ACCESS_KDS',
    'MANAGE_INVENTORY',
  ],

  MANAGER: [
    'VIEW_MENU',
    'EDIT_MENU',
    'MANAGE_TABLES',
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'ACCESS_KDS',
    'MANAGE_INVENTORY',
    'MANAGE_SUPPLIERS',
    'APPROVE_PURCHASE_ORDER',
    'MANAGE_RECIPES',
    'VIEW_ANALYTICS',
    'VIEW_FORECASTS',
    'VIEW_BILLING',
    'PROCESS_REFUND',
    'MANAGE_STAFF',
    'MANAGE_RESTAURANT',
    'MANAGE_BRANDING',
    'MANAGE_SUBSCRIPTION',
  ],

  ADMIN: [
    'VIEW_MENU',
    'EDIT_MENU',
    'MANAGE_TABLES',
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'ACCESS_KDS',
    'MANAGE_INVENTORY',
    'MANAGE_SUPPLIERS',
    'APPROVE_PURCHASE_ORDER',
    'MANAGE_RECIPES',
    'VIEW_ANALYTICS',
    'VIEW_FORECASTS',
    'VIEW_BILLING',
    'PROCESS_REFUND',
    'MANAGE_STAFF',
    'MANAGE_RESTAURANT',
    'MANAGE_BRANDING',
    'MANAGE_SUBSCRIPTION',
  ],

  PLATFORM_ADMIN: [
    'VIEW_MENU',
    'EDIT_MENU',
    'MANAGE_TABLES',
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'ACCESS_KDS',
    'MANAGE_INVENTORY',
    'MANAGE_SUPPLIERS',
    'APPROVE_PURCHASE_ORDER',
    'MANAGE_RECIPES',
    'VIEW_ANALYTICS',
    'VIEW_FORECASTS',
    'VIEW_BILLING',
    'PROCESS_REFUND',
    'MANAGE_STAFF',
    'MANAGE_RESTAURANT',
    'MANAGE_BRANDING',
    'MANAGE_SUBSCRIPTION',
    'PLATFORM_MANAGE',
  ],
};

// Subscription Tier to Feature Entitlements Matrix
const PLAN_FEATURES_MAP: Record<SubscriptionTier, FeatureEntitlement[]> = {
  FREE: [
    'BASIC_MENU',
    'QR_ORDERING',
  ],
  STARTER: [
    'BASIC_MENU',
    'QR_ORDERING',
    'KDS',
    'INVENTORY',
    'CUSTOM_BRANDING',
  ],
  PRO: [
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
  ENTERPRISE: [
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
};

export const permissionService = {
  /**
   * Check if a role possesses a specific permission
   */
  hasPermission(role: ExtendedUserRole, permission: Permission): boolean {
    if (role === 'PLATFORM_ADMIN') return true;
    const permissions = ROLE_PERMISSIONS_MAP[role] || [];
    return permissions.includes(permission);
  },

  /**
   * Return all permissions granted to a role
   */
  getPermissionsForRole(role: ExtendedUserRole): Permission[] {
    return ROLE_PERMISSIONS_MAP[role] || [];
  },

  /**
   * Check if a subscription plan code includes an entitlement
   */
  hasFeature(planCode: SubscriptionTier, feature: FeatureEntitlement): boolean {
    const features = PLAN_FEATURES_MAP[planCode] || [];
    return features.includes(feature);
  },

  /**
   * Verify cross-tenant isolation and role authorization simultaneously
   */
  authorizeTenantAction(params: {
    actorRole: ExtendedUserRole;
    actorTenantId: string;
    targetTenantId: string;
    permission: Permission;
  }): { allowed: boolean; errorCode?: string; reason?: string } {
    // 1. Platform admin bypasses tenant boundary only for platform-level management
    if (params.actorRole === 'PLATFORM_ADMIN') {
      return { allowed: true };
    }

    // 2. Strict Tenant Isolation Rule: Cross-tenant operations are strictly rejected
    if (params.actorTenantId !== params.targetTenantId) {
      return {
        allowed: false,
        errorCode: 'CROSS_TENANT_VIOLATION',
        reason: `Actor belonging to restaurant [${params.actorTenantId}] cannot access or mutate target tenant [${params.targetTenantId}].`,
      };
    }

    // 3. Check Role Permission
    if (!this.hasPermission(params.actorRole, params.permission)) {
      return {
        allowed: false,
        errorCode: 'INSUFFICIENT_PERMISSION',
        reason: `Role ${params.actorRole} lacks required permission: ${params.permission}`,
      };
    }

    return { allowed: true };
  },
};
