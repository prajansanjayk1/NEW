import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { StaffProfile, UserRole, Restaurant, RestaurantMembership, ExtendedUserRole } from '../types';
import { staffAuthService } from '../services/staffAuthService';
import { tenantService } from '../services/saas/tenantService';
import { getSupabaseClient } from '../services/supabaseClient';

interface StaffAuthContextType {
  currentStaff: StaffProfile | null;
  restaurant: Restaurant | null;
  activeRestaurantId: string;
  role: ExtendedUserRole;
  userRole: ExtendedUserRole;
  memberships: RestaurantMembership[];
  isPlatformAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPin: (role: UserRole | ExtendedUserRole, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithQrBadge: (badgeToken: string) => Promise<{ success: boolean; error?: string }>;
  loginWithNfcTag: (tagId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole | ExtendedUserRole) => Promise<void>;
  switchRestaurant: (restaurantId: string) => Promise<{ success: boolean; error?: string }>;
  refreshMemberships: () => Promise<void>;
}

export const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(tenantService.getActiveRestaurant());
  const [memberships, setMemberships] = useState<RestaurantMembership[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeRestaurantId = restaurant?.id || tenantService.getActiveRestaurantId();

  // Synchronize with tenantService changes
  useEffect(() => {
    const unsub = tenantService.onTenantSwitch((_newId, newRest) => {
      setRestaurant(newRest);
    });
    return () => unsub();
  }, []);

  const refreshMemberships = useCallback(async () => {
    const role = (currentStaff?.role || 'STAFF') as ExtendedUserRole;
    const userId = currentStaff?.id || 'staff-current';
    const list = await tenantService.getUserMemberships(userId, role);
    setMemberships(list);
  }, [currentStaff]);

  // Initialize staff profile and restaurant info
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // 1. Fetch active restaurant from tenantService
        const activeRest = tenantService.getActiveRestaurant();
        if (isMounted) setRestaurant(activeRest);

        // 2. Check local stored staff profile
        const saved = staffAuthService.getCurrentStaff();
        if (saved && isMounted) {
          setCurrentStaff(saved);
        }

        // 3. Populate memberships
        const initialRole = (saved?.role || 'STAFF') as ExtendedUserRole;
        const initialUserId = saved?.id || 'staff-current';
        const memberList = await tenantService.getUserMemberships(initialUserId, initialRole);
        if (isMounted) setMemberships(memberList);

        // 4. Listen to Supabase auth events if configured
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
              if (isMounted) setCurrentStaff(null);
            } else if (session?.user) {
              const { data: profile } = await supabase
                .from('staff_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (profile && isMounted) {
                const staff: StaffProfile = {
                  id: profile.id,
                  restaurantId: profile.restaurant_id,
                  userId: profile.user_id,
                  displayName: profile.display_name,
                  email: session.user.email,
                  role: profile.role,
                  isActive: profile.is_active,
                  lastActive: 'Active now',
                };
                setCurrentStaff(staff);
                localStorage.setItem('kow_staff_profile', JSON.stringify(staff));
              }
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.warn('[StaffAuthContext] Init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await staffAuthService.signInWithEmail(email, password);
      if (res.success && res.staff) {
        setCurrentStaff(res.staff);
        const list = await tenantService.getUserMemberships(res.staff.id, res.staff.role as ExtendedUserRole);
        setMemberships(list);
        return { success: true };
      }
      return { success: false, error: res.error || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPin = useCallback(async (targetRole: UserRole | ExtendedUserRole, pin: string) => {
    setIsLoading(true);
    try {
      const res = await staffAuthService.authenticateStaffWithPin(targetRole as UserRole, pin);
      if (res.success && res.staff) {
        setCurrentStaff(res.staff);
        const list = await tenantService.getUserMemberships(res.staff.id, res.staff.role as ExtendedUserRole);
        setMemberships(list);
        return { success: true };
      }
      return { success: false, error: res.error || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithQrBadge = useCallback(async (badgeToken: string) => {
    setIsLoading(true);
    try {
      const res = await staffAuthService.authenticateStaffWithQrBadge(badgeToken);
      if (res.success && res.staff) {
        setCurrentStaff(res.staff);
        const list = await tenantService.getUserMemberships(res.staff.id, res.staff.role as ExtendedUserRole);
        setMemberships(list);
        return { success: true };
      }
      return { success: false, error: res.error || 'QR authentication failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithNfcTag = useCallback(async (tagId: string) => {
    setIsLoading(true);
    try {
      const res = await staffAuthService.authenticateStaffWithNfcTag(tagId);
      if (res.success && res.staff) {
        setCurrentStaff(res.staff);
        const list = await tenantService.getUserMemberships(res.staff.id, res.staff.role as ExtendedUserRole);
        setMemberships(list);
        return { success: true };
      }
      return { success: false, error: res.error || 'NFC authentication failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await staffAuthService.logoutStaff();
      setCurrentStaff(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback(async (newRole: UserRole | ExtendedUserRole) => {
    const res = await staffAuthService.authenticateStaffWithPin(newRole as UserRole, '');
    if (res.success && res.staff) {
      setCurrentStaff(res.staff);
      const list = await tenantService.getUserMemberships(res.staff.id, newRole as ExtendedUserRole);
      setMemberships(list);
    }
  }, []);

  const switchRestaurant = useCallback(async (restaurantId: string) => {
    const currentRole = (currentStaff?.role || 'STAFF') as ExtendedUserRole;
    const res = await tenantService.switchActiveRestaurant(restaurantId, currentRole);
    if (res.success && res.restaurant) {
      setRestaurant(res.restaurant);
      if (currentStaff) {
        const updatedStaff = { ...currentStaff, restaurantId };
        setCurrentStaff(updatedStaff);
        localStorage.setItem('kow_staff_profile', JSON.stringify(updatedStaff));
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to switch restaurant' };
  }, [currentStaff]);

  const role = (currentStaff?.role || 'STAFF') as ExtendedUserRole;
  const isPlatformAdmin = role === 'PLATFORM_ADMIN';
  const isAuthenticated = Boolean(currentStaff && currentStaff.isActive);

  return (
    <StaffAuthContext.Provider
      value={{
        currentStaff,
        restaurant,
        activeRestaurantId,
        role,
        userRole: role,
        memberships,
        isPlatformAdmin,
        isAuthenticated,
        isLoading,
        loginWithEmail,
        loginWithPin,
        loginWithQrBadge,
        loginWithNfcTag,
        logout,
        switchRole,
        switchRestaurant,
        refreshMemberships,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

const defaultStaffAuthContext: StaffAuthContextType = {
  currentStaff: null,
  restaurant: null,
  activeRestaurantId: 'rest-kow-blr-01',
  role: 'STAFF',
  userRole: 'STAFF',
  memberships: [],
  isPlatformAdmin: false,
  isAuthenticated: false,
  isLoading: false,
  loginWithEmail: async () => ({ success: false, error: 'Auth provider not initialized' }),
  loginWithPin: async () => ({ success: false, error: 'Auth provider not initialized' }),
  loginWithQrBadge: async () => ({ success: false, error: 'Auth provider not initialized' }),
  loginWithNfcTag: async () => ({ success: false, error: 'Auth provider not initialized' }),
  logout: async () => {},
  switchRole: async () => {},
  switchRestaurant: async () => ({ success: false }),
  refreshMemberships: async () => {},
};

export const useStaffAuth = (): StaffAuthContextType => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    console.warn('useStaffAuth was used outside of a StaffAuthProvider, falling back to default values.');
    return defaultStaffAuthContext;
  }
  return context;
};
