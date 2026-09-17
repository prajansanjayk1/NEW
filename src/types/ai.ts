import { MenuItem, CustomizationOption, HeatLevel, OrderStatus, ServiceRequestType, OperationsMetrics, AnalyticsData } from '../types';

export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIRecommendation {
  menuItemId: string;
  name?: string;
  price?: number;
  reason: string;
  confidence: number;
  tags?: string[];
  suggestedCustomization?: Partial<CustomizationOption>;
}

export type AIActionType =
  | 'RECOMMEND_ITEM'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'UPDATE_CART_ITEM'
  | 'VIEW_MENU_ITEM'
  | 'VIEW_CART'
  | 'VIEW_ORDER_STATUS'
  | 'CREATE_SERVICE_REQUEST';

export interface AIAction {
  type: AIActionType;
  menuItemId?: string;
  quantity?: number;
  customizations?: Record<string, any>;
  serviceType?: ServiceRequestType;
  serviceNote?: string;
  targetSection?: string;
  actionSummary?: string;
}

export interface AIInsightEvidence {
  metrics: Record<string, any>;
  timePeriod: string;
  sampleSize?: number;
  calculationInputs?: string[];
  fact: string;
  interpretation: string;
  recommendation?: string;
}

export type AIInsightCategory =
  | 'DEMAND_SPIKE'
  | 'KITCHEN_BOTTLENECK'
  | 'REVENUE_PATTERN'
  | 'SERVICE_PATTERN'
  | 'MENU_PERFORMANCE'
  | 'TABLE_UTILIZATION';

export interface AIInsight {
  id: string;
  category: AIInsightCategory;
  title: string;
  headline: string;
  fact: string;
  interpretation: string;
  recommendation?: string;
  priority: 'INFO' | 'WARNING' | 'ALERT' | 'OPPORTUNITY';
  timestamp: string;
  evidence: AIInsightEvidence;
  suggestedActions?: string[];
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  recommendations?: AIRecommendation[];
  actions?: AIAction[];
  evidence?: AIInsightEvidence;
  isError?: boolean;
  modelUsed?: string;
  isDemoFallback?: boolean;
  feedback?: 'HELPFUL' | 'NOT_HELPFUL' | null;
}

export interface AIConversationContext {
  preferredHeatLevel?: HeatLevel | 'NONE';
  dietaryPreference?: 'VEGETARIAN' | 'VEGAN' | 'ANY';
  budget?: number;
  preferredFoodType?: string;
  groupSize?: number;
  previouslyRecommendedIds?: string[];
}

export interface AIConciergeRequest {
  restaurantId: string;
  tableNumber: string;
  sessionId: string;
  participantId?: string;
  participantName?: string;
  message: string;
  history?: { role: AIMessageRole; content: string }[];
  context?: AIConversationContext;
  cartSummary?: {
    totalItems: number;
    totalAmount: number;
    items: { menuItemId: string; name: string; quantity: number; unitPrice: number }[];
  };
  activeOrderStatus?: {
    orderId?: string;
    ticketNumber?: string;
    status?: OrderStatus;
    itemCount?: number;
    createdAt?: string;
  };
  activeServiceRequests?: {
    type: ServiceRequestType;
    status: string;
  }[];
}

export interface AIConciergeResponse {
  message: string;
  recommendations: AIRecommendation[];
  actions: AIAction[];
  model: string;
  isDemoFallback: boolean;
  updatedContext?: AIConversationContext;
}

export interface AICopilotRequest {
  restaurantId: string;
  timeRange: 'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL_TIME';
  query: string;
  metricsSnapshot?: OperationsMetrics;
  analyticsSnapshot?: AnalyticsData;
  history?: { role: AIMessageRole; content: string }[];
}

export interface AICopilotResponse {
  answer: string;
  fact: string;
  interpretation: string;
  recommendation?: string;
  insights?: AIInsight[];
  evidence: AIInsightEvidence;
  suggestedActions?: string[];
  model: string;
  isDemoFallback: boolean;
}

export interface DailyRestaurantBriefing {
  date: string;
  generatedAt: string;
  revenue: number;
  totalOrders: number;
  averageOrderValue: number;
  peakPeriod: string;
  topItems: { name: string; quantity: number; revenue: number }[];
  kitchenSummary: string;
  serviceSummary: string;
  aiObservations: string[];
  facts: string[];
  interpretations: string[];
  actionSuggestions: string[];
  isDemoFallback?: boolean;
}

export interface AIFeedbackPayload {
  messageId: string;
  conversationType: 'CONCIERGE' | 'COPILOT';
  rating: 'HELPFUL' | 'NOT_HELPFUL';
  comment?: string;
  participantId?: string;
  staffId?: string;
  tableNumber?: string;
}

export interface AIUsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  demoFallbackRequests: number;
  averageLatencyMs: number;
  providerStatus: 'ONLINE_GEMINI' | 'DEMO_FALLBACK';
  configuredModel: string;
}
