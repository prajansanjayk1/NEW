import { GoogleGenAI } from '@google/genai';

// In-memory usage telemetry
export const aiUsageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  demoFallbackRequests: 0,
  totalLatencyMs: 0,
  feedbacks: [] as any[],
};

let aiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('[Server AI] Failed to initialize GoogleGenAI client:', err);
      aiClient = null;
    }
  }
  return aiClient;
}

// Compact Menu Items representation for AI prompt context
export const SERVER_MENU_CATALOG = [
  {
    id: 'wings-firecracker',
    name: 'Firecracker Wings',
    category: 'Wings',
    price: 249,
    dineInPrice: 249,
    takeawayPrice: 269,
    packagingCharge: 15,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 3,
    scovilleShu: 85000,
    description: 'Crispy wings drenched in smoky firecracker glaze, burnt garlic & toasted sesame seeds.',
    dietary: { vegetarian: false, allergens: ['Soy', 'Gluten'], verified: true },
    prepTime: 10,
  },
  {
    id: 'wings-korean',
    name: 'Korean Fire Wings',
    category: 'Wings',
    price: 269,
    dineInPrice: 269,
    takeawayPrice: 289,
    packagingCharge: 15,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 4,
    scovilleShu: 125000,
    description: 'Sweet, sticky fermented gochujang glaze, garlic crisp and scallions.',
    dietary: { vegetarian: false, allergens: ['Soy', 'Gluten'], verified: true },
    prepTime: 11,
  },
  {
    id: 'wings-bbq',
    name: 'Smoked Hickory BBQ',
    category: 'Wings',
    price: 239,
    dineInPrice: 239,
    takeawayPrice: 259,
    packagingCharge: 15,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 1,
    scovilleShu: 12000,
    description: 'Rich slow-simmered molasses, aged oak barrel smoke and dark honey.',
    dietary: { vegetarian: false, allergens: [], verified: true },
    prepTime: 9,
  },
  {
    id: 'wings-parmesan',
    name: 'Garlic Parmesan Gold',
    category: 'Wings',
    price: 259,
    dineInPrice: 259,
    takeawayPrice: 279,
    packagingCharge: 15,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 0,
    scovilleShu: 2500,
    description: '24-month aged Reggiano crust, roasted confit garlic butter, oregano.',
    dietary: { vegetarian: false, allergens: ['Dairy'], verified: true },
    prepTime: 10,
  },
  {
    id: 'combos-pitmaster',
    name: 'Pitmaster Feast Combo',
    category: 'Combos',
    price: 589,
    dineInPrice: 589,
    takeawayPrice: 629,
    packagingCharge: 25,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 3,
    description: '12 PC mixed wings, double seasoned truffle fries, 2 signature dips, and 2 draft sodas.',
    dietary: { vegetarian: false, allergens: ['Gluten', 'Dairy'], verified: true },
    prepTime: 14,
  },
  {
    id: 'burger-fire',
    name: 'Smoked Brioche Fire Burger',
    category: 'Burgers',
    price: 299,
    dineInPrice: 299,
    takeawayPrice: 329,
    packagingCharge: 20,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 3,
    description: 'Crisp fried chicken thigh dipped in chili butter, house pickles, hot ranch on toasted brioche.',
    dietary: { vegetarian: false, allergens: ['Gluten', 'Dairy', 'Egg'], verified: true },
    prepTime: 12,
  },
  {
    id: 'sides-fries',
    name: 'Truffle Charred Fries',
    category: 'Sides',
    price: 189,
    dineInPrice: 189,
    takeawayPrice: 199,
    packagingCharge: 10,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 0,
    description: 'Thick cut russets loaded with white truffle oil, ember scallions & roasted garlic aioli.',
    dietary: { vegetarian: true, vegan: true, allergens: [], verified: true },
    prepTime: 7,
  },
  {
    id: 'drinks-soda',
    name: 'Smoked Blood Orange Soda',
    category: 'Drinks',
    price: 149,
    dineInPrice: 149,
    takeawayPrice: 159,
    packagingCharge: 10,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 0,
    description: 'Craft draft carbonated in-house with charred citrus reduction and fresh mint sprig.',
    dietary: { vegetarian: true, vegan: true, allergens: [], verified: true },
    prepTime: 3,
  },
  {
    id: 'dips-ranch',
    name: 'Double Smoked Ranch Dip',
    category: 'Dips',
    price: 40,
    dineInPrice: 40,
    takeawayPrice: 49,
    packagingCharge: 5,
    availableDineIn: true,
    availableTakeaway: true,
    heatFlames: 0,
    description: 'Buttermilk, fresh dill, charred chives, cracked black pepper and cold-smoked sea salt.',
    dietary: { vegetarian: true, allergens: ['Dairy'], verified: true },
    prepTime: 1,
  },
];

export async function processConciergeMessage(payload: any) {
  const startTime = Date.now();
  aiUsageStats.totalRequests++;

  const ai = getGenAI();

  if (!ai) {
    aiUsageStats.demoFallbackRequests++;
    aiUsageStats.successfulRequests++;
    return null; // Will fallback cleanly
  }

  try {
    const isTakeaway = payload.channel === 'TAKEAWAY';
    const channelContext = isTakeaway
      ? 'Sales Channel: TAKEAWAY / PICKUP. Use ONLY takeawayPrice (NOT dineInPrice). Mention packaging fees where relevant.'
      : 'Sales Channel: DINE-IN (Table ordering). Use standard dine-in price.';

    const prompt = `You are the Kings of Wings Pitmaster AI Concierge for ${isTakeaway ? 'Takeaway & Pickup' : `Table ${payload.tableNumber || '18'}`}.
Customer query: "${payload.message}"

CURRENT RESTAURANT CONTEXT:
- ${channelContext}
- Session: ${isTakeaway ? 'Takeaway Customer' : `Table ${payload.tableNumber}`}, Guest: ${payload.participantName || 'Guest'}
- Cart items: ${JSON.stringify(payload.cartSummary || { totalItems: 0, items: [] })}
- Active Kitchen Order: ${JSON.stringify(payload.activeOrderStatus || null)}
- Active Service Requests: ${JSON.stringify(payload.activeServiceRequests || [])}

AVAILABLE MENU CATALOG:
${JSON.stringify(SERVER_MENU_CATALOG, null, 2)}

STRICT RULES:
1. ONLY recommend items present in the menu catalog above using their EXACT id and applicable channel price (${isTakeaway ? 'takeawayPrice' : 'dineInPrice'}).
2. NEVER invent menu items or prices. Never quote dine-in prices for takeaway orders.
3. NEVER promise that an order was placed or water was poured. Return structured actions for the frontend to validate.
4. For allergens / dietary: If verified is true, accurately state it. If asking about unverified items or severe allergies, say: "I don't have verified allergen information for that item. Please check with restaurant staff."
5. If customer asks "Where is my order?" or tracks food, reference their active order status and provide action { type: "VIEW_ORDER_STATUS" }.
6. If customer asks for water, cutlery, tissues, bill, or staff help, provide action { type: "CREATE_SERVICE_REQUEST", serviceType: "..." }. Valid serviceTypes: "WATER", "CUTLERY", "TISSUES", "CLEAN_TABLE", "ASSISTANCE", "BILL".
7. If customer asks to add something to cart, output action { type: "ADD_TO_CART", menuItemId: "...", quantity: 1, channel: "${isTakeaway ? 'TAKEAWAY' : 'DINE_IN'}" }.

Format response strictly as valid JSON matching this schema:
{
  "message": "Friendly, knowledgeable concise assistant response (Markdown supported)",
  "recommendations": [
    {
      "menuItemId": "exact-id",
      "reason": "Clear concise reason",
      "confidence": 0.95
    }
  ],
  "actions": [
    {
      "type": "RECOMMEND_ITEM" | "ADD_TO_CART" | "VIEW_CART" | "VIEW_ORDER_STATUS" | "CREATE_SERVICE_REQUEST",
      "menuItemId": "exact-id-if-applicable",
      "quantity": 1,
      "serviceType": "WATER"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const duration = Date.now() - startTime;
    aiUsageStats.totalLatencyMs += duration;
    aiUsageStats.successfulRequests++;

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      message: parsed.message || 'Here are our recommendations.',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      model: 'gemini-3.8-flash',
      isDemoFallback: false,
    };
  } catch (err) {
    console.error('[Server AI] Concierge Generation Error:', err);
    aiUsageStats.failedRequests++;
    aiUsageStats.demoFallbackRequests++;
    return null;
  }
}

export async function processCopilotMessage(payload: any) {
  const startTime = Date.now();
  aiUsageStats.totalRequests++;

  const ai = getGenAI();
  if (!ai) {
    aiUsageStats.demoFallbackRequests++;
    aiUsageStats.successfulRequests++;
    return null;
  }

  try {
    const prompt = `You are the Restaurant Intelligence Copilot for Kings of Wings.
Manager query: "${payload.query}"
Time Range: ${payload.timeRange || 'TODAY'}

OPERATIONAL DATA CONTEXT:
- Metrics Snapshot: ${JSON.stringify(payload.metricsSnapshot || {})}
- Analytics Snapshot: ${JSON.stringify(payload.analyticsSnapshot || {})}

STRICT REQUIREMENTS:
1. Clearly distinguish between:
   - FACT: Strictly measured facts, verifiable numbers, and exact counts.
   - INTERPRETATION: Data-grounded analysis of why this is happening.
   - RECOMMENDATION: Concrete operational decision for the manager.
2. Ground all answers in the provided operational snapshot.
3. For inventory, procurement, recipes, and purchasing queries:
   - AI only SUGGESTS. It must never automatically create or approve a purchase order.
   - All purchase order suggestions require manager authorization and manual approval before execution.
4. Provide an evidence object with the underlying calculation inputs, time period, and metrics.
5. Suggested actions must be clear and non-destructive.

Output strictly valid JSON matching this schema:
{
  "answer": "Comprehensive answer for the manager",
  "fact": "Key verifiable data point",
  "interpretation": "Analysis explaining the trend or pattern",
  "recommendation": "Concrete operational suggestion",
  "evidence": {
    "metrics": { "exampleKey": 123 },
    "timePeriod": "${payload.timeRange || 'Today'}",
    "sampleSize": 38,
    "calculationInputs": ["KDS Ticket Logs", "POS Receipts"]
  },
  "suggestedActions": [
    "Action 1",
    "Action 2"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const duration = Date.now() - startTime;
    aiUsageStats.totalLatencyMs += duration;
    aiUsageStats.successfulRequests++;

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      answer: parsed.answer,
      fact: parsed.fact,
      interpretation: parsed.interpretation,
      recommendation: parsed.recommendation,
      evidence: parsed.evidence || {
        metrics: {},
        timePeriod: payload.timeRange || 'Today',
        calculationInputs: ['Operational Metrics Snapshot'],
        fact: parsed.fact,
        interpretation: parsed.interpretation,
      },
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
      model: 'gemini-3.8-flash',
      isDemoFallback: false,
    };
  } catch (err) {
    console.error('[Server AI] Copilot Generation Error:', err);
    aiUsageStats.failedRequests++;
    aiUsageStats.demoFallbackRequests++;
    return null;
  }
}
