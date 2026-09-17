import { MenuItem, CartItem, Order, ServiceRequestType, CustomizationOption, HeatLevel } from '../../types';
import { AIRecommendation, AIAction, AIConversationContext } from '../../types/ai';

export interface RecommendationQuery {
  rawQuery: string;
  category?: string;
  maxPrice?: number;
  targetHeat?: HeatLevel | 'NONE';
  dietary?: 'VEGETARIAN' | 'VEGAN';
  groupSize?: number;
  currentCart?: CartItem[];
  recentOrder?: Order | null;
}

/**
 * Deterministic recommendation engine that pairs with and validates LLM generation
 */
export class RecommendationEngine {
  /**
   * Find matching menu items using deterministic criteria
   */
  static getRecommendations(
    menu: MenuItem[],
    query: RecommendationQuery
  ): AIRecommendation[] {
    const availableItems = menu.filter((item) => item.available !== false);
    const queryLower = query.rawQuery.toLowerCase();

    // 1. Dietary Filtering
    let filtered = availableItems;
    if (
      query.dietary === 'VEGETARIAN' ||
      queryLower.includes('vegetarian') ||
      queryLower.includes('veg') ||
      queryLower.includes("don't eat meat") ||
      queryLower.includes('no meat')
    ) {
      filtered = filtered.filter((item) => item.dietary?.vegetarian === true);
    } else if (
      query.dietary === 'VEGAN' ||
      queryLower.includes('vegan')
    ) {
      filtered = filtered.filter((item) => item.dietary?.vegan === true);
    }

    // 2. Heat Level Filtering
    if (
      queryLower.includes('spicy') ||
      queryLower.includes('hot') ||
      queryLower.includes('fire') ||
      queryLower.includes('hottest') ||
      query.targetHeat === 'HOT' ||
      query.targetHeat === 'INSANE'
    ) {
      // Prioritize high heat
      filtered = [...filtered].sort((a, b) => b.heatFlames - a.heatFlames);
    } else if (
      queryLower.includes('mild') ||
      queryLower.includes('not spicy') ||
      queryLower.includes('no spice') ||
      queryLower.includes('sweet') ||
      query.targetHeat === 'MILD' ||
      query.targetHeat === 'NONE'
    ) {
      // Prioritize low heat
      filtered = filtered.filter((item) => item.heatFlames <= 1);
    }

    // 3. Budget Filtering (e.g., "under 500", "under ₹300")
    const budgetMatch = queryLower.match(/(?:under|below|less than|within|budget of?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : query.maxPrice;
    if (maxBudget && maxBudget > 0) {
      filtered = filtered.filter((item) => item.price <= maxBudget);
    }

    // 4. Group Size / Combos (e.g., "3 people", "party", "group")
    const groupMatch = queryLower.match(/(\d+)\s*(?:people|persons|dined|friends|group)/i);
    const groupCount = groupMatch ? parseInt(groupMatch[1], 10) : (query.groupSize || 1);
    if (groupCount >= 2) {
      const combos = filtered.filter((i) => i.category === 'Combos');
      if (combos.length > 0) {
        // Boost combos to top for groups
        filtered = [...combos, ...filtered.filter((i) => i.category !== 'Combos')];
      }
    }

    // 5. Build AI Recommendations with rich deterministic reasoning
    return filtered.slice(0, 4).map((item, index) => {
      let reason = `Flagship favorite from our kitchen with balanced crunch and flavor.`;
      if (item.heatFlames >= 4) {
        reason = `Hottest on the pit at ${item.scovilleShu ? item.scovilleShu.toLocaleString() + ' SHU' : 'high heat'} for true spice enthusiasts.`;
      } else if (item.heatFlames === 0 && item.dietary?.vegetarian) {
        reason = `Crispy, plant-based favorite seasoned with gourmet white truffle oil.`;
      } else if (item.category === 'Combos') {
        reason = `Ideal meal combination designed to satisfy ${groupCount >= 2 ? `${groupCount} diners` : 'a hearty appetite'} with wings, sides, and drinks.`;
      } else if (item.price <= 250) {
        reason = `Great value signature dish priced comfortably at ₹${item.price}.`;
      }

      return {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        reason,
        confidence: Math.max(0.75, 0.95 - index * 0.05),
        tags: item.tags || [],
        suggestedCustomization: {
          portionSize: '10 PC',
          heatLevel: item.heatFlames >= 3 ? 'HOT' : item.heatFlames >= 2 ? 'MED' : 'MILD',
          styleCut: 'Classic Bone-In',
          dip: 'Cool Ranch',
        },
      };
    });
  }

  /**
   * Smart Cart Intelligence: analyze current cart items and identify missing pairings
   */
  static analyzeCartPairings(cart: CartItem[], menu: MenuItem[]): {
    suggestions: AIRecommendation[];
    insightNotes: string[];
  } {
    const suggestions: AIRecommendation[] = [];
    const insightNotes: string[] = [];

    const hasWings = cart.some((c) => {
      const item = menu.find((m) => m.id === c.menuItemId);
      return item?.category === 'Wings' || c.name.toLowerCase().includes('wings');
    });
    const hasSides = cart.some((c) => {
      const item = menu.find((m) => m.id === c.menuItemId);
      return item?.category === 'Sides' || c.name.toLowerCase().includes('fries');
    });
    const hasDrinks = cart.some((c) => {
      const item = menu.find((m) => m.id === c.menuItemId);
      return item?.category === 'Drinks' || c.name.toLowerCase().includes('soda') || c.name.toLowerCase().includes('cola');
    });
    const hasDips = cart.some((c) => {
      const item = menu.find((m) => m.id === c.menuItemId);
      return item?.category === 'Dips' || c.name.toLowerCase().includes('dip') || c.name.toLowerCase().includes('ranch');
    });

    if (hasWings && !hasDips) {
      const ranchDip = menu.find((m) => m.category === 'Dips' || m.id.includes('dip'));
      if (ranchDip && ranchDip.available) {
        suggestions.push({
          menuItemId: ranchDip.id,
          name: ranchDip.name,
          price: ranchDip.price,
          reason: 'Wings pair best with our house cold-smoked buttermilk ranch to cool down the glaze heat.',
          confidence: 0.92,
          tags: ['Essential Pairing', 'House Dip'],
        });
        insightNotes.push('No dip detected for your wings. Added recommendation for Double Smoked Ranch.');
      }
    }

    if (hasWings && !hasDrinks) {
      const draftSoda = menu.find((m) => m.category === 'Drinks' && m.available);
      if (draftSoda) {
        suggestions.push({
          menuItemId: draftSoda.id,
          name: draftSoda.name,
          price: draftSoda.price,
          reason: 'Quench the smoke & chili heat with our in-house charred citrus craft draft.',
          confidence: 0.88,
          tags: ['Refreshing', 'Pit Drink'],
        });
        insightNotes.push('Consider adding a draft beverage to accompany your spicy wings.');
      }
    }

    if (hasWings && !hasSides && cart.length <= 2) {
      const fries = menu.find((m) => m.category === 'Sides' && m.available);
      if (fries) {
        suggestions.push({
          menuItemId: fries.id,
          name: fries.name,
          price: fries.price,
          reason: 'Crispy truffle russet fries complete the classic wings experience.',
          confidence: 0.85,
          tags: ['Crispy Side'],
        });
      }
    }

    return { suggestions, insightNotes };
  }

  /**
   * Validate model-generated recommendations against authoritative database records
   */
  static validateRecommendations(
    untrustedRecs: any[],
    menu: MenuItem[]
  ): AIRecommendation[] {
    if (!Array.isArray(untrustedRecs)) return [];

    const validated: AIRecommendation[] = [];
    const menuMap = new Map<string, MenuItem>();
    menu.forEach((item) => {
      menuMap.set(item.id.toLowerCase(), item);
      menuMap.set(item.name.toLowerCase(), item);
    });

    for (const rec of untrustedRecs) {
      if (!rec) continue;
      const targetId = String(rec.menuItemId || '').toLowerCase();
      const targetName = String(rec.name || '').toLowerCase();

      const matchedItem = menuMap.get(targetId) || menuMap.get(targetName);
      if (matchedItem && matchedItem.available !== false) {
        validated.push({
          menuItemId: matchedItem.id, // Strictly use authoritative ID
          name: matchedItem.name, // Strictly use authoritative Name
          price: matchedItem.price, // Strictly use authoritative Price
          reason: typeof rec.reason === 'string' && rec.reason.trim()
            ? rec.reason.trim()
            : `${matchedItem.name} is one of our top recommended items.`,
          confidence: typeof rec.confidence === 'number' ? Math.min(1, Math.max(0.1, rec.confidence)) : 0.85,
          tags: matchedItem.tags || [],
          suggestedCustomization: rec.suggestedCustomization || {
            portionSize: '10 PC',
            heatLevel: matchedItem.heatFlames >= 3 ? 'HOT' : 'MILD',
            styleCut: 'Classic Bone-In',
            dip: 'Cool Ranch',
          },
        });
      }
    }

    return validated;
  }

  /**
   * Validate and sanitize AI Actions
   */
  static validateActions(
    untrustedActions: any[],
    menu: MenuItem[]
  ): AIAction[] {
    if (!Array.isArray(untrustedActions)) return [];

    const validated: AIAction[] = [];
    const menuMap = new Map<string, MenuItem>();
    menu.forEach((item) => {
      menuMap.set(item.id.toLowerCase(), item);
      menuMap.set(item.name.toLowerCase(), item);
    });

    for (const act of untrustedActions) {
      if (!act || typeof act.type !== 'string') continue;
      const type = act.type.toUpperCase() as AIAction['type'];

      switch (type) {
        case 'ADD_TO_CART': {
          const targetId = String(act.menuItemId || '').toLowerCase();
          const matchedItem = menuMap.get(targetId);
          if (matchedItem && matchedItem.available !== false) {
            const quantity = Math.max(1, Math.min(20, Number(act.quantity) || 1));
            validated.push({
              type: 'ADD_TO_CART',
              menuItemId: matchedItem.id,
              quantity,
              customizations: act.customizations || {},
              actionSummary: `Add ${quantity}x ${matchedItem.name} (₹${matchedItem.price}) to cart`,
            });
          }
          break;
        }

        case 'RECOMMEND_ITEM': {
          const targetId = String(act.menuItemId || '').toLowerCase();
          const matchedItem = menuMap.get(targetId);
          if (matchedItem) {
            validated.push({
              type: 'RECOMMEND_ITEM',
              menuItemId: matchedItem.id,
              actionSummary: `View ${matchedItem.name}`,
            });
          }
          break;
        }

        case 'VIEW_CART': {
          validated.push({
            type: 'VIEW_CART',
            actionSummary: 'Open and inspect your table cart',
          });
          break;
        }

        case 'VIEW_ORDER_STATUS': {
          validated.push({
            type: 'VIEW_ORDER_STATUS',
            actionSummary: 'Check live pit status of your order',
          });
          break;
        }

        case 'CREATE_SERVICE_REQUEST': {
          const validTypes: ServiceRequestType[] = ['WATER', 'CUTLERY', 'TISSUES', 'CLEAN_TABLE', 'ASSISTANCE', 'BILL'];
          const rawType = String(act.serviceType || 'ASSISTANCE').toUpperCase() as ServiceRequestType;
          const serviceType = validTypes.includes(rawType) ? rawType : 'ASSISTANCE';
          validated.push({
            type: 'CREATE_SERVICE_REQUEST',
            serviceType,
            serviceNote: typeof act.serviceNote === 'string' ? act.serviceNote.slice(0, 150) : undefined,
            actionSummary: `Request ${serviceType.toLowerCase().replace('_', ' ')} for table`,
          });
          break;
        }

        default:
          break;
      }
    }

    return validated;
  }
}
