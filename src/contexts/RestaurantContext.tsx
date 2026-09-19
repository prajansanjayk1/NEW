/**
 * RestaurantContext
 *
 * Single authoritative context for restaurant data in the customer flow.
 * Loads restaurant data from Supabase (or DEMO_MODE fallback) once per entry context.
 * All customer components use this instead of importing restaurantDataService directly.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Restaurant, MenuCategory, MenuItem, MenuItemOption } from '../types';
import { restaurantDataService } from '../services/restaurantDataService';
import { getStoredEntryContext } from '../services/entryService';
import { DEFAULT_RESTAURANT_ID } from '../services/restaurantDataService';

interface MenuData {
  items: MenuItem[];
  categories: MenuCategory[];
  options: MenuItemOption[];
}

interface RestaurantContextValue {
  restaurant: Restaurant | null;
  menu: MenuData | null;
  isRestaurantLoading: boolean;
  isMenuLoading: boolean;
  restaurantError: string | null;
  menuError: string | null;
  restaurantId: string;
  refreshMenu: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({
  children,
  restaurantId: propRestaurantId,
}: {
  children: ReactNode;
  restaurantId?: string;
}) {
  // Determine restaurant ID: prop > stored entry context > default env var
  const resolvedId = (() => {
    if (propRestaurantId) return propRestaurantId;
    const ctx = getStoredEntryContext();
    if (ctx?.restaurantId && !ctx.restaurantId.startsWith('demo-')) return ctx.restaurantId;
    return DEFAULT_RESTAURANT_ID;
  })();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [isRestaurantLoading, setIsRestaurantLoading] = useState(true);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsRestaurantLoading(true);
    setRestaurantError(null);

    restaurantDataService
      .getRestaurant(resolvedId)
      .then((data) => {
        if (!cancelled) {
          setRestaurant(data);
          setIsRestaurantLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurantError('Unable to load restaurant information.');
          setIsRestaurantLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedId]);

  const loadMenu = useCallback(async () => {
    setIsMenuLoading(true);
    setMenuError(null);
    try {
      const data = await restaurantDataService.getMenu(resolvedId);
      setMenu(data);
    } catch {
      setMenuError('Unable to load the menu. Please try again.');
    } finally {
      setIsMenuLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        menu,
        isRestaurantLoading,
        isMenuLoading,
        restaurantError,
        menuError,
        restaurantId: resolvedId,
        refreshMenu: loadMenu,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return ctx;
}
