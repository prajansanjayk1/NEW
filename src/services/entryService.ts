/**
 * Entry Service
 *
 * Handles the universal customer entry flow:
 *   /e/:token → resolveEntryToken → { restaurant, table, isValid }
 *
 * The token is an opaque UUID stored in table_entry_tokens.
 * Never trusts client-provided restaurant_id or table_id.
 */

import { getSupabaseClient } from './supabaseClient';

export type EntryErrorCode =
  | 'INVALID_TOKEN'
  | 'EXPIRED'
  | 'REVOKED'
  | 'DISABLED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface ResolvedRestaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  currency: string;
  currencySymbol: string;
  timezone: string;
  gstPercent: number;
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    tagline?: string;
    themeMode?: string;
  } | null;
}

export interface ResolvedTable {
  id: string;
  tableNumber: string;
  capacity: number;
  zone: string | null;
  status: string;
}

export interface EntryResolutionSuccess {
  isValid: true;
  tokenId: string;
  restaurantId: string;
  tableId: string;
  restaurant: ResolvedRestaurant;
  table: ResolvedTable;
}

export interface EntryResolutionFailure {
  isValid: false;
  errorCode: EntryErrorCode;
  message: string;
}

export type EntryResolution = EntryResolutionSuccess | EntryResolutionFailure;

/**
 * Resolves a QR/NFC entry token to restaurant + table information.
 * Calls the `resolve_entry_token` Supabase RPC.
 *
 * In DEMO_MODE (no Supabase configured), returns a synthetic demo resolution
 * so the entry flow still works for development.
 */
export async function resolveEntryToken(token: string): Promise<EntryResolution> {
  // Validate token format before calling backend
  const trimmed = token.trim();
  if (!trimmed) {
    return {
      isValid: false,
      errorCode: 'INVALID_TOKEN',
      message: 'Table link is missing. Please scan the QR code again.',
    };
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    // DEMO_MODE: return synthetic resolution so the UI flow works
    return buildDemoResolution(trimmed);
  }

  try {
    // Attempt to parse as UUID — if it fails, still pass to RPC (server will reject)
    const { data, error } = await supabase.rpc('resolve_entry_token', {
      p_token: trimmed,
    });

    if (error) {
      console.error('[entryService] resolve_entry_token RPC error:', error);
      return {
        isValid: false,
        errorCode: 'SERVER_ERROR',
        message: 'Unable to verify this table link. Please try again.',
      };
    }

    if (!data || !data.is_valid) {
      const code = (data?.error_code as EntryErrorCode) || 'INVALID_TOKEN';
      const msg = data?.message || 'This table link is not valid. Please scan the QR code again.';
      return { isValid: false, errorCode: code, message: msg };
    }

    const r = data.restaurant || {};
    const t = data.table || {};

    return {
      isValid: true,
      tokenId: data.token_id,
      restaurantId: data.restaurant_id,
      tableId: data.table_id,
      restaurant: {
        id: data.restaurant_id,
        name: r.name || 'Restaurant',
        slug: r.slug || '',
        logoUrl: r.logo_url || null,
        address: r.address || null,
        currency: r.currency || 'INR',
        currencySymbol: r.currency_symbol || '₹',
        timezone: r.timezone || 'Asia/Kolkata',
        gstPercent: r.gst_percent || 5,
        branding: r.branding || null,
      },
      table: {
        id: data.table_id,
        tableNumber: t.table_number || '?',
        capacity: t.capacity || 4,
        zone: t.zone || null,
        status: t.status || 'AVAILABLE',
      },
    };
  } catch (err) {
    console.error('[entryService] Network error resolving token:', err);
    return {
      isValid: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Connection error. Please check your internet and try again.',
    };
  }
}

/**
 * Builds a synthetic demo resolution for DEMO_MODE.
 * Used when Supabase is not configured.
 */
function buildDemoResolution(token: string): EntryResolution {
  // Simulate invalid/expired tokens for testing
  const upper = token.toUpperCase();
  if (upper.includes('INVALID')) {
    return {
      isValid: false,
      errorCode: 'INVALID_TOKEN',
      message: 'This table link is not valid. Please scan the QR code again.',
    };
  }
  if (upper.includes('EXPIRED')) {
    return {
      isValid: false,
      errorCode: 'EXPIRED',
      message: 'This QR code has expired. Please ask staff for a new one.',
    };
  }

  // Parse table number from demo token format: "demo-table-18" or any string
  const tableMatch = token.match(/(\d+)/);
  const tableNumber = tableMatch ? tableMatch[1].padStart(2, '0') : '18';

  return {
    isValid: true,
    tokenId: `demo-token-${token}`,
    restaurantId: 'demo-restaurant-01',
    tableId: `demo-table-${tableNumber}`,
    restaurant: {
      id: 'demo-restaurant-01',
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      logoUrl: null,
      address: null,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      gstPercent: 5,
      branding: {
        primaryColor: '#ff5708',
        secondaryColor: '#ffb86d',
        tagline: 'Demo Mode — Configure Supabase to go live',
        themeMode: 'DARK',
      },
    },
    table: {
      id: `demo-table-${tableNumber}`,
      tableNumber,
      capacity: 4,
      zone: 'Main Floor',
      status: 'AVAILABLE',
    },
  };
}

/**
 * Stores the resolved entry context in sessionStorage.
 * Used for session recovery on page refresh.
 */
export function storeEntryContext(resolution: EntryResolutionSuccess): void {
  try {
    sessionStorage.setItem(
      '__entry_ctx__',
      JSON.stringify({
        restaurantId: resolution.restaurantId,
        tableId: resolution.tableId,
        restaurant: resolution.restaurant,
        table: resolution.table,
        storedAt: Date.now(),
      })
    );
  } catch {
    // sessionStorage unavailable — ok
  }
}

export interface StoredEntryContext {
  restaurantId: string;
  tableId: string;
  restaurant: ResolvedRestaurant;
  table: ResolvedTable;
  storedAt: number;
}

/**
 * Retrieves the stored entry context (for page refresh recovery).
 * Returns null if not found or too old (> 8 hours).
 */
export function getStoredEntryContext(): StoredEntryContext | null {
  try {
    const raw = sessionStorage.getItem('__entry_ctx__');
    if (!raw) return null;
    const ctx = JSON.parse(raw) as StoredEntryContext;
    const eightHours = 8 * 60 * 60 * 1000;
    if (Date.now() - ctx.storedAt > eightHours) {
      sessionStorage.removeItem('__entry_ctx__');
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}

export function clearEntryContext(): void {
  try {
    sessionStorage.removeItem('__entry_ctx__');
  } catch {
    // ok
  }
}
