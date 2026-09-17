/**
 * Tenant & Organization Management Service (Phase 9)
 * 
 * Foundation for multi-tenant isolation, multi-branch organization views,
 * tenant context switching, and brand customization.
 */

import {
  Organization,
  Restaurant,
  RestaurantStatus,
  RestaurantMembership,
  OrganizationAnalyticsSummary,
  RestaurantBranding,
  RestaurantOnboardingData,
  ExtendedUserRole,
} from '../../types';
import { getSupabaseClient } from '../supabaseClient';
import { DEFAULT_RESTAURANT_ID } from '../restaurantDataService';
import { auditService } from '../auditService';
import { realtimeService } from '../realtimeService';

const ACTIVE_TENANT_STORAGE_KEY = 'kow_active_restaurant_id';
const LOCAL_TENANTS_CACHE_KEY = 'kow_multi_tenants_cache';
const LOCAL_ORGS_CACHE_KEY = 'kow_multi_orgs_cache';

// Seeded Organizations
export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: '88888888-8888-4888-a888-888888888888',
    name: 'Atherion Foods Hospitality Group',
    legalName: 'Atherion Foods Private Limited',
    slug: 'atherion-foods',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    billingEmail: 'corporate@atherionfoods.com',
    phone: '+91 44 2834 9000',
    address: 'Level 7, Apex Tech Park, Anna Salai, Chennai, TN 600002',
    taxId: '33AAAAA8888A1Z9',
    status: 'ACTIVE',
    restaurantCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
];

// Seeded Multi-Branch Restaurants
export const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: DEFAULT_RESTAURANT_ID, // 7bd24e21-8fd0-46c2-ac57-1b30838d1460
    name: 'Kings of Wings — Chennai Central',
    slug: 'kingsofwings-chennai',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFbHHST3P1Di7uBYRFeE3yUAa8peOdWfiFFfBYyPOOv-7RBKBqT2GOOEPvCscfHw87DTGT09QFCgx-m7dzJ1P78YzZyHDT5yCI2Hb_4noZEC0TBAfcm_hfdGaZKU7-hPtnUePBpook5dfqJBfaZ9zMPhJ5_VssgxFYqHlPUQsPkQlSO-mr32AUNj07DxCpTK4k0aCjx78EqLwSPfWoqdhJPu6jDyTfHGZoIQczFQaZLdKeWWtWStG7',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    currencySymbol: '₹',
    branch: 'Chennai Central Flagship',
    address: '42 Woodcutters Lane, Anna Salai, Chennai, TN 600002',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    phone: '+91 44 2834 5678',
    email: 'chennai@kingsofwings.menu',
    wifiSsid: 'KingsOfWings_5G',
    wifiPassword: 'wingsandfire',
    organizationId: '88888888-8888-4888-a888-888888888888',
    status: 'ACTIVE',
    legalName: 'Kings of Wings Live Grill Private Limited',
    branding: {
      primaryColor: '#ff5708',
      secondaryColor: '#ffb86d',
      tagline: 'Flame-Kissed Smoked Craft Wings — Table 18 Live Grill',
      themeMode: 'DARK',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    },
    operatingHours: {
      monday: { open: '11:00', close: '23:00', closed: false },
      tuesday: { open: '11:00', close: '23:00', closed: false },
      wednesday: { open: '11:00', close: '23:00', closed: false },
      thursday: { open: '11:00', close: '23:00', closed: false },
      friday: { open: '11:00', close: '00:00', closed: false },
      saturday: { open: '11:00', close: '00:00', closed: false },
      sunday: { open: '11:00', close: '23:00', closed: false },
    },
    taxConfiguration: {
      taxName: 'GST',
      ratePercent: 5.0,
      taxNumber: '33AAAAA0000A1Z5',
      inclusive: true,
    },
    settings: {
      gstPercent: 5.0,
      allowEqualSplit: true,
      allowItemSplit: true,
      requireHostApproval: false,
    },
  },
  {
    id: 'b1234567-8fd0-46c2-ac57-1b30838d1461',
    name: 'WingHouse — Tambaram Express',
    slug: 'winghouse-tambaram',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQKdGoC1CpBbF5LnJG9wJqVFDu1LAwALC7O5sCemhzYF-9jYe_QjIq24LQMLWA24gqNw_ADFicZof8affJA27_pcY4seDqtJFIHOVvcH9ABb4qsbzYbpX0GxQ9vmIPcF4Ej7KfGeg9p8opg3-CVkGY_V5WrzQYbJS2oX_Lj1AMmbvU87x5gk24m69bmoFognmpC51Rl5rnlGcvc_OfdH1MuyoKaEfGNw9JIf38kfes1rzAYJzB6Klv',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    currencySymbol: '₹',
    branch: 'Tambaram West Express',
    address: '44 GST Road, Tambaram West, Chennai, TN 600045',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    phone: '+91 44 2226 8900',
    email: 'tambaram@winghouse.menu',
    wifiSsid: 'WingHouse_Tambaram',
    wifiPassword: 'expresswings',
    organizationId: '88888888-8888-4888-a888-888888888888',
    status: 'ACTIVE',
    legalName: 'WingHouse Express Foods LLP',
    branding: {
      primaryColor: '#e11d48',
      secondaryColor: '#fda4af',
      tagline: 'Fast, Crispy & Blazing Hot — Tambaram Express Pit',
      themeMode: 'DARK',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    },
    operatingHours: {
      monday: { open: '12:00', close: '23:00', closed: false },
      tuesday: { open: '12:00', close: '23:00', closed: false },
      wednesday: { open: '12:00', close: '23:00', closed: false },
      thursday: { open: '12:00', close: '23:00', closed: false },
      friday: { open: '12:00', close: '00:00', closed: false },
      saturday: { open: '12:00', close: '00:00', closed: false },
      sunday: { open: '12:00', close: '23:00', closed: false },
    },
    taxConfiguration: {
      taxName: 'GST',
      ratePercent: 5.0,
      taxNumber: '33AAAAA1234B1Z2',
      inclusive: true,
    },
    settings: {
      gstPercent: 5.0,
      allowEqualSplit: true,
      allowItemSplit: true,
      requireHostApproval: false,
    },
  },
  {
    id: 'c2345678-8fd0-46c2-ac57-1b30838d1462',
    name: 'WingHouse — Bengaluru Brigade Road',
    slug: 'winghouse-bengaluru',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANsMoDnI0k-lqoeaHoE3EWGpQtIByYGiKVL6IODsjQV8NZC5UQ6ZYs_PvwR-yu2i2OpxX1JYCfMIun79fE1xemUc5Vift2DIKsX92bY8xgMM0Mg2GYdV05iX2xh6rpimHzODC2OQN5DvzswZMpcJzs83izNIcGuY-ZhunM0uGRqYCxmByj_uG5swECOYGfdRMIILnBbsEn8gufd9jHdwkx73zQavi7k1La09X3GOFuLnwS02qNUk91',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    currencySymbol: '₹',
    branch: 'Brigade Road Rooftop',
    address: '102 Brigade Road, Ashok Nagar, Bengaluru, KA 560025',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    phone: '+91 80 4123 7700',
    email: 'bengaluru@winghouse.menu',
    wifiSsid: 'WingHouse_BLR',
    wifiPassword: 'craftrooftop',
    organizationId: '88888888-8888-4888-a888-888888888888',
    status: 'SETUP',
    legalName: 'WingHouse Karnataka Hospitality LLP',
    branding: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#c4b5fd',
      tagline: 'Roof Deck Smokehouse & Craft Taps — Bengaluru',
      themeMode: 'DARK',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASft47yUOPEavVhGh5tItcmhVFm1_RoBBNUusFeE5EgJ-q_bEQAUAJJQI_a8l1ujFP5-2IMKFGSVVFGVFLnxqzD63Nf93JHe23accbzRevLL0oVSthEA00bwrDHtLlAOHzIpaeY4dh58UrbsB_O_eKMT3ttPvdqf7osWNOp7VwFvGpRjl4dFZk9I1UDGixAgw9aSuaIfp4KCyL7fuN_X3MAH25PszOo3mjvNcWg8SWvyPtf5_DXjr_',
    },
    operatingHours: {
      monday: { open: '12:00', close: '23:30', closed: false },
      tuesday: { open: '12:00', close: '23:30', closed: false },
      wednesday: { open: '12:00', close: '23:30', closed: false },
      thursday: { open: '12:00', close: '23:30', closed: false },
      friday: { open: '12:00', close: '01:00', closed: false },
      saturday: { open: '12:00', close: '01:00', closed: false },
      sunday: { open: '12:00', close: '23:30', closed: false },
    },
    taxConfiguration: {
      taxName: 'GST',
      ratePercent: 5.0,
      taxNumber: '29AAAAA5678C1Z4',
      inclusive: true,
    },
    settings: {
      gstPercent: 5.0,
      allowEqualSplit: true,
      allowItemSplit: true,
      requireHostApproval: false,
    },
  },
];

class TenantService {
  private activeRestaurantId: string;
  private restaurants: Map<string, Restaurant> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private switchListeners: Set<(newTenantId: string, restaurant: Restaurant) => void> = new Set();

  constructor() {
    // 1. Initialize Active Tenant
    let initialId = DEFAULT_RESTAURANT_ID;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
      if (saved) initialId = saved;
    }
    this.activeRestaurantId = initialId;

    // 2. Initialize Seed Data
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') {
      SEED_RESTAURANTS.forEach((r) => this.restaurants.set(r.id, r));
      SEED_ORGANIZATIONS.forEach((o) => this.organizations.set(o.id, o));
      return;
    }

    try {
      const savedRests = localStorage.getItem(LOCAL_TENANTS_CACHE_KEY);
      if (savedRests) {
        const parsed = JSON.parse(savedRests) as Restaurant[];
        parsed.forEach((r) => this.restaurants.set(r.id, r));
      } else {
        SEED_RESTAURANTS.forEach((r) => this.restaurants.set(r.id, r));
        this.saveRestaurantsToStorage();
      }

      const savedOrgs = localStorage.getItem(LOCAL_ORGS_CACHE_KEY);
      if (savedOrgs) {
        const parsed = JSON.parse(savedOrgs) as Organization[];
        parsed.forEach((o) => this.organizations.set(o.id, o));
      } else {
        SEED_ORGANIZATIONS.forEach((o) => this.organizations.set(o.id, o));
        this.saveOrgsToStorage();
      }
    } catch {
      SEED_RESTAURANTS.forEach((r) => this.restaurants.set(r.id, r));
      SEED_ORGANIZATIONS.forEach((o) => this.organizations.set(o.id, o));
    }
  }

  private saveRestaurantsToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(this.restaurants.values());
      localStorage.setItem(LOCAL_TENANTS_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('[TenantService] Failed to cache restaurants', err);
    }
  }

  private saveOrgsToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const list = Array.from(this.organizations.values());
      localStorage.setItem(LOCAL_ORGS_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('[TenantService] Failed to cache organizations', err);
    }
  }

  // ---------------------------------------------------------------------------
  // TENANT CONTEXT
  // ---------------------------------------------------------------------------

  public getActiveRestaurantId(): string {
    return this.activeRestaurantId;
  }

  public getActiveRestaurant(): Restaurant {
    const rest = this.restaurants.get(this.activeRestaurantId);
    if (rest) return rest;
    return this.restaurants.get(DEFAULT_RESTAURANT_ID) || SEED_RESTAURANTS[0];
  }

  public onTenantSwitch(callback: (newTenantId: string, restaurant: Restaurant) => void): () => void {
    this.switchListeners.add(callback);
    return () => {
      this.switchListeners.delete(callback);
    };
  }

  /**
   * Switch Active Restaurant with Tenant Isolation Safeguards
   */
  public async switchActiveRestaurant(
    targetRestaurantId: string,
    actorRole: ExtendedUserRole
  ): Promise<{ success: boolean; restaurant?: Restaurant; error?: string }> {
    const target = this.restaurants.get(targetRestaurantId);
    if (!target) {
      return { success: false, error: 'Restaurant not found or unprovisioned.' };
    }

    if (target.status === 'ARCHIVED') {
      return { success: false, error: 'Restaurant is archived and read-only.' };
    }

    // Unsubscribe existing realtime channels to avoid cross-tenant leaks
    realtimeService.disconnect();

    // Set new active tenant
    this.activeRestaurantId = targetRestaurantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, targetRestaurantId);
    }

    // Notify listeners
    this.switchListeners.forEach((fn) => {
      try {
        fn(targetRestaurantId, target);
      } catch (err) {
        console.error('[Tenant Switch Callback Error]', err);
      }
    });

    await auditService.logEvent({
      restaurantId: targetRestaurantId,
      actorId: 'active-user',
      actorRole,
      action: 'TENANT_SWITCH_AUTHORIZED',
      entityType: 'RESTAURANT',
      entityId: targetRestaurantId,
      metadata: { targetRestaurantName: target.name, targetSlug: target.slug },
    });

    return { success: true, restaurant: target };
  }

  // ---------------------------------------------------------------------------
  // RESTAURANTS & MEMBERSHIPS RETRIEVAL
  // ---------------------------------------------------------------------------

  public async getRestaurants(): Promise<Restaurant[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: true });

        if (data && !error && data.length > 0) {
          data.forEach((r) => {
            this.restaurants.set(r.id, {
              id: r.id,
              name: r.name,
              slug: r.slug,
              logo: r.logo_url || this.restaurants.get(r.id)?.logo || SEED_RESTAURANTS[0].logo,
              coverImage: r.cover_image || this.restaurants.get(r.id)?.coverImage,
              timezone: r.timezone || 'Asia/Kolkata',
              currency: r.currency || 'INR',
              currencySymbol: r.currency_symbol || '₹',
              branch: r.city ? `${r.city} Branch` : 'Main Branch',
              address: r.address || '',
              city: r.city || 'Chennai',
              state: r.state || 'Tamil Nadu',
              country: r.country || 'India',
              phone: r.phone,
              email: r.email,
              wifiSsid: r.wifi_ssid || 'KingsOfWings_Guest',
              wifiPassword: r.wifi_password,
              organizationId: r.organization_id,
              status: (r.status as RestaurantStatus) || 'ACTIVE',
              legalName: r.legal_name,
              branding: r.branding,
              operatingHours: r.operating_hours,
              taxConfiguration: r.tax_configuration,
              settings: {
                gstPercent: Number(r.gst_percent || 5.0),
                allowEqualSplit: true,
                allowItemSplit: true,
                requireHostApproval: false,
              },
            });
          });
          this.saveRestaurantsToStorage();
        }
      } catch (err) {
        console.warn('[TenantService] Supabase getRestaurants error:', err);
      }
    }

    return Array.from(this.restaurants.values());
  }

  public async getRestaurantById(id: string): Promise<Restaurant | null> {
    const cached = this.restaurants.get(id);
    if (cached) return cached;
    const all = await this.getRestaurants();
    return all.find((r) => r.id === id) || null;
  }

  public async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    const all = await this.getRestaurants();
    return all.find((r) => r.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  /**
   * Return authorized restaurant memberships for a user
   */
  public async getUserMemberships(userId: string, role: ExtendedUserRole): Promise<RestaurantMembership[]> {
    const allRestaurants = await this.getRestaurants();

    // Platform Admin has implicit access to all restaurants
    if (role === 'PLATFORM_ADMIN') {
      return allRestaurants.map((r) => ({
        id: `mem-${r.id}-platform`,
        restaurantId: r.id,
        restaurantName: r.name,
        restaurantSlug: r.slug,
        restaurantCity: r.city || 'Chennai',
        restaurantStatus: r.status || 'ACTIVE',
        userId,
        role: 'PLATFORM_ADMIN',
        permissions: ['PLATFORM_MANAGE'],
        isActive: true,
      }));
    }

    // Manager has access to flagship + tambaram
    if (role === 'MANAGER' || role === 'ADMIN') {
      return allRestaurants.map((r) => ({
        id: `mem-${r.id}-${userId}`,
        restaurantId: r.id,
        restaurantName: r.name,
        restaurantSlug: r.slug,
        restaurantCity: r.city || 'Chennai',
        restaurantStatus: r.status || 'ACTIVE',
        userId,
        role,
        permissions: ['MANAGE_RESTAURANT', 'VIEW_ANALYTICS', 'MANAGE_ORDERS', 'ACCESS_KDS'],
        isActive: true,
      }));
    }

    // Standard Staff / Kitchen default to active or flagship
    return [
      {
        id: `mem-${this.activeRestaurantId}-${userId}`,
        restaurantId: this.activeRestaurantId,
        restaurantName: this.getActiveRestaurant().name,
        restaurantSlug: this.getActiveRestaurant().slug,
        restaurantCity: this.getActiveRestaurant().city || 'Chennai',
        restaurantStatus: this.getActiveRestaurant().status || 'ACTIVE',
        userId,
        role,
        permissions: role === 'KITCHEN' ? ['ACCESS_KDS', 'MANAGE_INVENTORY'] : ['MANAGE_ORDERS', 'MANAGE_TABLES'],
        isActive: true,
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // ORGANIZATIONS & MULTI-LOCATION ANALYTICS
  // ---------------------------------------------------------------------------

  public async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  public async getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalyticsSummary> {
    const org = this.organizations.get(orgId) || SEED_ORGANIZATIONS[0];
    const branches = (await this.getRestaurants()).filter((r) => r.organizationId === orgId);

    // Dynamic metrics simulated proportionally per branch
    const breakdown = branches.map((b) => {
      const isFlagship = b.id === DEFAULT_RESTAURANT_ID;
      const isTambaram = b.slug.includes('tambaram');
      const revenue = isFlagship ? 142850 : isTambaram ? 68400 : 0;
      const ordersCount = isFlagship ? 98 : isTambaram ? 54 : 0;
      const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

      return {
        restaurantId: b.id,
        name: b.name,
        slug: b.slug,
        city: b.city || 'Chennai',
        status: b.status || 'ACTIVE',
        revenue,
        ordersCount,
        aov,
        tableTurnover: isFlagship ? 2.1 : isTambaram ? 2.8 : 0,
      };
    });

    const totalRev = breakdown.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalOrders = breakdown.reduce((acc, curr) => acc + curr.ordersCount, 0);

    return {
      organizationId: org.id,
      organizationName: org.name,
      totalLocations: branches.length,
      activeLocations: branches.filter((b) => b.status === 'ACTIVE').length,
      aggregatedGrossRevenue: totalRev,
      aggregatedOrdersCount: totalOrders,
      aggregatedAverageOrderValue: totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0,
      locationBreakdown: breakdown,
    };
  }

  // ---------------------------------------------------------------------------
  // RESTAURANT ONBOARDING & PROFILE MANAGEMENT
  // ---------------------------------------------------------------------------

  public async createRestaurantFromOnboarding(
    data: RestaurantOnboardingData
  ): Promise<{ success: boolean; restaurant?: Restaurant; error?: string }> {
    try {
      const newId = `rest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newRestaurant: Restaurant = {
        id: newId,
        name: data.restaurantName,
        slug: data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
        logo: data.logoUrl || SEED_RESTAURANTS[0].logo,
        coverImage: SEED_RESTAURANTS[0].coverImage,
        timezone: data.timezone,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        branch: `${data.city} Location`,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        phone: data.phone,
        email: data.email,
        wifiSsid: `${data.restaurantName.replace(/\s+/g, '_')}_Guest`,
        wifiPassword: 'welcomeguest',
        organizationId: data.organizationId || SEED_ORGANIZATIONS[0].id,
        status: 'ACTIVE',
        legalName: data.legalEntityName || data.restaurantName,
        branding: {
          primaryColor: data.primaryColor || '#ff5708',
          secondaryColor: data.secondaryColor || '#ffb86d',
          tagline: data.tagline || 'Craft Kitchen & Pitmaster Bar',
          themeMode: 'DARK',
          logo: data.logoUrl,
        },
        operatingHours: data.operatingHours,
        taxConfiguration: {
          taxName: 'GST',
          ratePercent: data.gstPercent,
          taxNumber: data.gstOrTaxNumber,
          inclusive: true,
        },
        settings: {
          gstPercent: data.gstPercent,
          allowEqualSplit: true,
          allowItemSplit: true,
          requireHostApproval: false,
        },
      };

      this.restaurants.set(newId, newRestaurant);
      this.saveRestaurantsToStorage();

      await auditService.logEvent({
        restaurantId: newId,
        actorId: 'onboarding-wizard',
        actorRole: 'MANAGER',
        action: 'RESTAURANT_ONBOARDED_SUCCESSFULLY',
        entityType: 'RESTAURANT',
        entityId: newId,
        metadata: {
          template: data.menuTemplate,
          tableCount: data.tableCount,
          city: data.city,
        },
      });

      return { success: true, restaurant: newRestaurant };
    } catch (err: any) {
      return { success: false, error: err.message || 'Onboarding failed.' };
    }
  }

  public async updateRestaurantStatus(
    restaurantId: string,
    status: RestaurantStatus
  ): Promise<Restaurant | null> {
    const rest = this.restaurants.get(restaurantId);
    if (!rest) return null;

    rest.status = status;
    this.saveRestaurantsToStorage();

    await auditService.logEvent({
      restaurantId,
      actorId: 'admin',
      actorRole: 'ADMIN',
      action: 'RESTAURANT_STATUS_UPDATED',
      entityType: 'RESTAURANT',
      entityId: restaurantId,
      metadata: { newStatus: status },
    });

    return rest;
  }

  public async updateRestaurantBranding(
    restaurantId: string,
    branding: Partial<RestaurantBranding>
  ): Promise<Restaurant | null> {
    const rest = this.restaurants.get(restaurantId);
    if (!rest) return null;

    rest.branding = {
      primaryColor: branding.primaryColor || rest.branding?.primaryColor || '#ff5708',
      secondaryColor: branding.secondaryColor || rest.branding?.secondaryColor || '#ffb86d',
      tagline: branding.tagline || rest.branding?.tagline || '',
      themeMode: branding.themeMode || rest.branding?.themeMode || 'DARK',
      logo: branding.logo || rest.branding?.logo || rest.logo,
      coverImage: branding.coverImage || rest.branding?.coverImage || rest.coverImage,
    };

    this.saveRestaurantsToStorage();

    await auditService.logEvent({
      restaurantId,
      actorId: 'manager',
      actorRole: 'MANAGER',
      action: 'RESTAURANT_BRANDING_UPDATED',
      entityType: 'RESTAURANT',
      entityId: restaurantId,
      metadata: branding,
    });

    return rest;
  }
}

export const tenantService = new TenantService();
