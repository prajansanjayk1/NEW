/**
 * Centralized Authorization Service
 * 
 * SECURITY BOUNDARY NOTE:
 * In this client application, these role utilities control UI presentation,
 * navigation guards, and action gating.
 * In a production deployment with a remote backend, these checks MUST ALSO be
 * enforced server-side (e.g. via API route middleware, JWT claim verification,
 * or Firestore security rules based on request.auth.token.role).
 * Client-side checks alone are never treated as the absolute security boundary.
 */

import { UserRole } from '../types';

export const canViewKitchen = (role: UserRole): boolean => {
  return role === 'KITCHEN' || role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
};

export const canManageOrders = (role: UserRole): boolean => {
  return role === 'KITCHEN' || role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
};

export const canResolveServiceRequest = (role: UserRole): boolean => {
  return role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
};

export const canCloseTable = (role: UserRole): boolean => {
  return role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
};

export const canManageRestaurant = (role: UserRole): boolean => {
  return role === 'MANAGER' || role === 'ADMIN';
};

export const canViewOperationsDashboard = (role: UserRole): boolean => {
  return role !== 'CUSTOMER';
};

export const ROLE_LABELS: Record<UserRole, { label: string; badge: string; color: string }> = {
  CUSTOMER: {
    label: 'Table Diner (Customer)',
    badge: 'DINER',
    color: 'bg-white/10 text-white',
  },
  STAFF: {
    label: 'Floor Staff / Captain',
    badge: 'STAFF',
    color: 'bg-[#ffb86d]/20 text-[#ffb86d]',
  },
  KITCHEN: {
    label: 'Pitmaster Station 03',
    badge: 'KITCHEN',
    color: 'bg-[#ff5708]/20 text-[#ff5708]',
  },
  MANAGER: {
    label: 'Restaurant Manager',
    badge: 'MANAGER',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  ADMIN: {
    label: 'Flagship Administrator',
    badge: 'ADMIN',
    color: 'bg-purple-500/20 text-purple-300',
  },
};
