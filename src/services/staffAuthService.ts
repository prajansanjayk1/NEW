import { StaffProfile, UserRole, ExtendedUserRole, RestaurantMembership } from '../types';
import { getSupabaseClient } from './supabaseClient';
import { auditService } from './auditService';
import { tenantService } from './saas/tenantService';

export const DEFAULT_STAFF_MEMBERS: StaffProfile[] = [
  {
    id: 'staff-marco',
    restaurantId: '7bd24e21-8fd0-46c2-ac57-1b30838d1460',
    displayName: 'Marco Rossi (Head Pitmaster)',
    email: 'marco@kingsofwings.menu',
    role: 'KITCHEN',
    isActive: true,
    lastActive: 'Just now',
  },
  {
    id: 'staff-david',
    restaurantId: '7bd24e21-8fd0-46c2-ac57-1b30838d1460',
    displayName: 'David Lee (Floor Captain)',
    email: 'david@kingsofwings.menu',
    role: 'STAFF',
    isActive: true,
    lastActive: '5m ago',
  },
  {
    id: 'staff-priya',
    restaurantId: '7bd24e21-8fd0-46c2-ac57-1b30838d1460',
    displayName: 'Priya Sharma (General Manager)',
    email: 'priya@kingsofwings.menu',
    role: 'MANAGER',
    isActive: true,
    lastActive: 'Active now',
  },
  {
    id: 'staff-admin',
    restaurantId: '7bd24e21-8fd0-46c2-ac57-1b30838d1460',
    displayName: 'System Admin',
    email: 'admin@kingsofwings.menu',
    role: 'ADMIN',
    isActive: true,
    lastActive: 'Active now',
  },
  {
    id: 'staff-platform-admin',
    restaurantId: '7bd24e21-8fd0-46c2-ac57-1b30838d1460',
    displayName: 'Atherion Platform Operator',
    email: 'platform@atherionfoods.com',
    role: 'PLATFORM_ADMIN' as UserRole,
    isActive: true,
    lastActive: 'Active now',
  },
];

const STAFF_PIN_MAP: Record<string, { profile: StaffProfile; pin: string }> = {
  KITCHEN: { profile: DEFAULT_STAFF_MEMBERS[0], pin: '1111' },
  STAFF: { profile: DEFAULT_STAFF_MEMBERS[1], pin: '2222' },
  MANAGER: { profile: DEFAULT_STAFF_MEMBERS[2], pin: '3333' },
  ADMIN: { profile: DEFAULT_STAFF_MEMBERS[3], pin: '4444' },
  PLATFORM_ADMIN: { profile: DEFAULT_STAFF_MEMBERS[4], pin: '5555' },
};

export const staffAuthService = {
  /**
   * Authenticate staff via email and password (Supabase Auth first, then demo fallback)
   */
  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; staff?: StaffProfile; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (authData?.user && !authError) {
          // Fetch profile associated with this user
          const { data: profileData } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (profileData) {
            const profile: StaffProfile = {
              id: profileData.id,
              restaurantId: profileData.restaurant_id,
              userId: profileData.user_id,
              displayName: profileData.display_name,
              email: trimmedEmail,
              role: profileData.role,
              isActive: profileData.is_active,
              lastActive: 'Active now',
            };

            localStorage.setItem('kow_staff_profile', JSON.stringify(profile));

            await auditService.logEvent({
              restaurantId: profile.restaurantId,
              actorId: profile.id,
              actorRole: profile.role,
              action: 'STAFF_LOGIN_SUPABASE_AUTH',
              entityType: 'STAFF',
              entityId: profile.id,
            });

            return { success: true, staff: profile };
          }
        }
      } catch (err: any) {
        console.warn('[StaffAuth] Supabase auth attempt produced error, trying fallback:', err?.message || err);
      }
    }

    // Match demo staff emails with standard password or PIN
    const matched = DEFAULT_STAFF_MEMBERS.find(
      (s) => s.email?.toLowerCase() === trimmedEmail
    );

    if (matched) {
      const pinEntry = STAFF_PIN_MAP[matched.role];
      const validPasswords = [pinEntry?.pin, 'password123', 'kow2026', 'admin'];
      if (!password || validPasswords.includes(password)) {
        localStorage.setItem('kow_staff_profile', JSON.stringify(matched));

        await auditService.logEvent({
          restaurantId: matched.restaurantId,
          actorId: matched.id,
          actorRole: matched.role,
          action: 'STAFF_LOGIN_DEMO',
          entityType: 'STAFF',
          entityId: matched.id,
        });

        return { success: true, staff: matched };
      }
      return { success: false, error: 'Incorrect password for this staff account.' };
    }

    // Fallback: If user enters an arbitrary email/password in development, allow role selection or prompt
    return {
      success: false,
      error: 'Invalid credentials. Please use one of the registered staff emails (e.g. priya@kingsofwings.menu, marco@kingsofwings.menu, david@kingsofwings.menu, admin@kingsofwings.menu) or sign in with quick role PIN.',
    };
  },

  /**
   * Fast PIN or role selection for speed in kitchen/floor environments
   */
  async authenticateStaffWithPin(
    role: UserRole,
    pin: string
  ): Promise<{ success: boolean; staff?: StaffProfile; error?: string }> {
    const entry = STAFF_PIN_MAP[role];
    if (!entry) {
      return { success: false, error: 'Invalid role profile.' };
    }

    if (pin && pin !== entry.pin) {
      return { success: false, error: 'Invalid staff security PIN.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('role', role)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (data) {
          const profile: StaffProfile = {
            id: data.id,
            restaurantId: data.restaurant_id,
            userId: data.user_id,
            displayName: data.display_name,
            email: entry.profile.email,
            role: data.role,
            isActive: data.is_active,
            lastActive: 'Active now',
          };
          localStorage.setItem('kow_staff_profile', JSON.stringify(profile));
          return { success: true, staff: profile };
        }
      } catch {
        // Fallback to local profile
      }
    }

    localStorage.setItem('kow_staff_profile', JSON.stringify(entry.profile));

    await auditService.logEvent({
      restaurantId: entry.profile.restaurantId,
      actorId: entry.profile.id,
      actorRole: entry.profile.role,
      action: 'STAFF_LOGIN_PIN',
      entityType: 'STAFF',
      entityId: entry.profile.id,
    });

    return { success: true, staff: entry.profile };
  },

  /**
   * Request password reset link via Supabase Auth
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (!error) {
          return { success: true, message: `Password reset instructions sent to ${email}.` };
        }
      } catch (err: any) {
        return { success: false, message: err?.message || 'Failed to send password reset request.' };
      }
    }
    return {
      success: true,
      message: `Password reset request received for ${email}. (In demo mode, use PIN 1111/2222/3333/4444 to sign in).`,
    };
  },

  getCurrentStaff(): StaffProfile | null {
    const raw = localStorage.getItem('kow_staff_profile');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async logoutStaff(): Promise<void> {
    const current = this.getCurrentStaff();
    if (current) {
      await auditService.logEvent({
        restaurantId: current.restaurantId,
        actorId: current.id,
        actorRole: current.role,
        action: 'STAFF_LOGOUT',
        entityType: 'STAFF',
        entityId: current.id,
      });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[StaffAuth] Sign out error:', err);
      }
    }

    localStorage.removeItem('kow_staff_profile');
  },

  /**
   * Get all staff team members for a restaurant
   */
  async getStaffMembers(restaurantId: string): Promise<StaffProfile[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: true });

        if (data && !error && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            restaurantId: d.restaurant_id,
            userId: d.user_id,
            displayName: d.display_name,
            email: d.email || `${d.display_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@kingsofwings.menu`,
            role: d.role as UserRole,
            isActive: d.is_active !== false,
            lastActive: 'Recent',
          }));
        }
      } catch (err) {
        console.warn('[StaffAuth] getStaffMembers supabase error:', err);
      }
    }

    return [...DEFAULT_STAFF_MEMBERS];
  },

  /**
   * Update staff role (protected: manager/admin only, prevents self-elevation)
   */
  async updateStaffRole(
    currentActor: StaffProfile,
    targetStaffId: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    if (currentActor.role !== 'MANAGER' && currentActor.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only Manager or Admin can change staff roles.' };
    }

    if (currentActor.id === targetStaffId && newRole !== currentActor.role) {
      return { success: false, error: 'Forbidden: You cannot change your own role to elevate privileges.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('staff_profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', targetStaffId);

        if (error) throw error;
      } catch (err: any) {
        console.warn('[StaffAuth] updateStaffRole supabase error:', err);
      }
    }

    await auditService.logEvent({
      restaurantId: currentActor.restaurantId,
      actorId: currentActor.id,
      actorRole: currentActor.role,
      action: 'STAFF_ROLE_CHANGE',
      entityType: 'STAFF',
      entityId: targetStaffId,
      metadata: { newRole },
    });

    return { success: true };
  },

  /**
   * Toggle staff active status
   */
  async toggleStaffActive(
    currentActor: StaffProfile,
    targetStaffId: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (currentActor.role !== 'MANAGER' && currentActor.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only Manager or Admin can deactivate staff.' };
    }

    if (currentActor.id === targetStaffId && !isActive) {
      return { success: false, error: 'Forbidden: You cannot deactivate your own active account.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('staff_profiles')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', targetStaffId);
      } catch (err: any) {
        console.warn('[StaffAuth] toggleStaffActive supabase error:', err);
      }
    }

    await auditService.logEvent({
      restaurantId: currentActor.restaurantId,
      actorId: currentActor.id,
      actorRole: currentActor.role,
      action: isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
      entityType: 'STAFF',
      entityId: targetStaffId,
    });

    return { success: true };
  },

  /**
   * Invite new staff member
   */
  async inviteStaff(
    currentActor: StaffProfile,
    restaurantId: string,
    email: string,
    displayName: string,
    role: UserRole
  ): Promise<{ success: boolean; staff?: StaffProfile; error?: string; message?: string }> {
    if (currentActor.role !== 'MANAGER' && currentActor.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only Managers and Admins can invite staff.' };
    }

    const newProfile: StaffProfile = {
      id: `staff-${Date.now()}`,
      restaurantId,
      displayName,
      email: email.trim().toLowerCase(),
      role,
      isActive: true,
      lastActive: 'Invitation Pending',
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_profiles')
          .insert({
            restaurant_id: restaurantId,
            display_name: displayName,
            role,
            is_active: true,
          })
          .select()
          .single();

        if (data && !error) {
          newProfile.id = data.id;
        }
      } catch (err: any) {
        console.warn('[StaffAuth] inviteStaff supabase insertion:', err);
      }
    }

    await auditService.logEvent({
      restaurantId,
      actorId: currentActor.id,
      actorRole: currentActor.role,
      action: 'STAFF_INVITED',
      entityType: 'STAFF',
      entityId: newProfile.id,
      metadata: { email, role, displayName },
    });

    return {
      success: true,
      staff: newProfile,
      message: `Staff profile for ${displayName} (${role}) registered. (SMTP email delivery pending production email configuration).`,
    };
  },

  /**
   * Get all authorized restaurant memberships for current authenticated user
   */
  async getAuthorizedMemberships(
    userId: string = 'staff-current',
    role: ExtendedUserRole = 'STAFF'
  ): Promise<RestaurantMembership[]> {
    return tenantService.getUserMemberships(userId, role);
  },

  /**
   * Switch the active operational restaurant with tenant authorization verification
   */
  async switchRestaurantContext(
    targetRestaurantId: string,
    currentRole: ExtendedUserRole
  ): Promise<{ success: boolean; error?: string }> {
    const res = await tenantService.switchActiveRestaurant(targetRestaurantId, currentRole);
    if (res.success && res.restaurant) {
      const current = this.getCurrentStaff();
      if (current) {
        current.restaurantId = targetRestaurantId;
        localStorage.setItem('kow_staff_profile', JSON.stringify(current));
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to switch restaurant.' };
  },
};
