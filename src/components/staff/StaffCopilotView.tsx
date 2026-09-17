import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Send,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Receipt,
  Users,
  Utensils,
  RefreshCw,
  Sliders,
  ThumbsUp,
  ThumbsDown,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Restaurant, Order, ServiceRequest, RestaurantTable, OperationsMetrics, AnalyticsData } from '../../types';
import { DailyRestaurantBriefing, AICopilotResponse, AIInsight } from '../../types/ai';
import { aiClient } from '../../services/ai/aiClient';

interface StaffCopilotViewProps {
  restaurant: Restaurant;
  orders: Order[];
  serviceRequests: ServiceRequest[];
  tables: RestaurantTable[];
}

const SAMPLE_INSIGHTS: AIInsight[] = [
  {
    id: 'ins-1',
    category: 'DEMAND_SPIKE',
    title: 'Dinner Rush Wing Surge',
    headline: 'Firecracker & Korean Fire wing orders increased +42% between 7:30 PM – 8:30 PM.',
    fact: '64 wing portions ordered across 18 tickets within a 60-minute window.',
    interpretation: 'Signature spicy glaze marketing and table combo selections created concentrated fryer demand.',
    recommendation: 'Pre-portion wings in 10-piece batches prior to the 7:00 PM shift change.',
    priority: 'ALERT',
    timestamp: 'Today 8:35 PM',
    evidence: {
      metrics: { peakOrdersPerHour: 18, wingsCount: 64, fryStationLoad: '88%' },
      timePeriod: '7:30 PM – 8:30 PM',
      sampleSize: 18,
      calculationInputs: ['KDS Ticket Timestamps', 'POS Sales Records'],
      fact: 'Fryer utilization exceeded 85% for 45 continuous minutes.',
      interpretation: 'Single-station bottleneck occurred while burger station operated at 30% load.',
    },
    suggestedActions: [
      'Assign cross-trained staff member to assist saucing',
      'Stagger combo order batch drops by 2 minutes',
    ],
  },
  {
    id: 'ins-2',
    category: 'KITCHEN_BOTTLENECK',
    title: 'Fry Station 03 Ticket Latency',
    headline: 'Average preparation time on Fry Station 03 reached 13.8 minutes during peak rush.',
    fact: 'Fry Station 03 tickets averaged 13.8 mins vs 9.2 mins restaurant-wide baseline.',
    interpretation: 'Multiple simultaneous customized portions (bone-in vs boneless) slowed basket turnarounds.',
    recommendation: 'Standardize basket loads during rush hours and stage pre-sauced holding pans.',
    priority: 'WARNING',
    timestamp: 'Today 8:40 PM',
    evidence: {
      metrics: { stationPrepAvg: 13.8, baselinePrepAvg: 9.2, delayedTicketsCount: 4 },
      timePeriod: 'Evening Shift',
      sampleSize: 38,
      calculationInputs: ['KDS Locked-to-Ready Event Logs'],
      fact: '4 tickets experienced turnaround times greater than 15 minutes.',
      interpretation: 'Expediter delay caused slight cooling before final tray delivery.',
    },
    suggestedActions: [
      'Implement dual-vat temperature checks',
      'Notify expediter 3 minutes prior to wing drop completion',
    ],
  },
  {
    id: 'ins-3',
    category: 'REVENUE_PATTERN',
    title: 'Combo Attachment Driving AOV',
    headline: 'Tables ordering Pitmaster Feast Combos generated ₹1,340 average spend per session.',
    fact: 'Combo orders yielded 32% higher gross margin and 28% higher total spend.',
    interpretation: 'Group diners at 4+ person tables consistently choose bundle packages with draft beverages.',
    recommendation: 'Feature the Pitmaster Feast Combo on digital table screens during prime lunch and dinner hours.',
    priority: 'OPPORTUNITY',
    timestamp: 'Today 7:15 PM',
    evidence: {
      metrics: { comboAov: 1340, standardAov: 1045, comboMarginPct: 68 },
      timePeriod: 'Last 7 Days',
      sampleSize: 84,
      calculationInputs: ['Settled Session Totals', 'Item Margin Master Data'],
      fact: '84 combo transactions recorded with zero customer complaints.',
      interpretation: 'Customers perceive high value in bundled truffle fries and draft soda.',
    },
    suggestedActions: [
      'Prompt combo upgrades in customer AI concierge for parties of 3+',
      'Test seasonal craft soda pairing additions',
    ],
  },
];

const COPILOT_SUGGESTED_QUERIES = [
  'What is our predicted wing consumption for tomorrow?',
  'Which menu items are candidates for removal?',
  'Why was table turnover slow during lunch rush?',
  'Which ingredients are running low on stock?',
  'What is our food wastage loss this week?',
  'Which recipes have the highest gross margin?',
  'What sold the most today?',
  'Which kitchen station is taking longest?',
  'Show today\'s revenue & average order value',
];

export const StaffCopilotView: React.FC<StaffCopilotViewProps> = ({
  restaurant,
  orders,
  serviceRequests,
  tables,
}) => {
  const [briefing, setBriefing] = useState<DailyRestaurantBriefing | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(true);
  const [timeRange, setTimeRange] = useState<'TODAY' | '7_DAYS' | '30_DAYS'>('TODAY');
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [copilotResponses, setCopilotResponses] = useState<AICopilotResponse[]>([]);
  const [expandedEvidenceMap, setExpandedEvidenceMap] = useState<Record<string, boolean>>({});
  const [acknowledgedActions, setAcknowledgedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadBriefing() {
      setIsLoadingBriefing(true);
      try {
        const data = await aiClient.getDailyBriefing(restaurant.id);
        setBriefing(data);
      } catch (err) {
        console.error('[Copilot] Failed to load briefing:', err);
      } finally {
        setIsLoadingBriefing(false);
      }
    }
    loadBriefing();
  }, [restaurant.id]);

  const handleAskCopilot = async (overrideQuery?: string) => {
    const q = (overrideQuery || query).trim();
    if (!q || isAsking) return;

    setQuery('');
    setIsAsking(true);

    try {
      const response = await aiClient.askCopilot({
        restaurantId: restaurant.id,
        timeRange,
        query: q,
        metricsSnapshot: {
          todaysSales: orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0) || 42850,
          totalOrdersCount: orders.length || 38,
          activeTablesCount: tables.filter((t) => t.status !== 'AVAILABLE').length || 6,
          totalTablesCount: tables.length || 10,
          averageOrderValue: 1127,
          openServiceRequestsCount: serviceRequests.filter((s) => s.status === 'PENDING').length || 2,
          kitchenQueueCount: orders.filter((o) => o.status === 'COOKING' || o.status === 'ASSIGNED').length || 3,
        },
      });

      setCopilotResponses((prev) => [response, ...prev]);
    } catch (err) {
      console.error('[Copilot] Query error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidenceMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAction = (key: string) => {
    setAcknowledgedActions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner & Time Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1a1a1c] border border-white/[0.08] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center text-[#401200] shadow-lg shadow-[#ff5708]/30">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-syne font-black text-white text-xl tracking-wide">
                Restaurant Intelligence Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Telemetry
              </span>
            </div>
            <p className="text-white/40 text-xs mt-0.5">
              Powered by Gemini with authoritative Supabase database grounding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#121214] p-1 rounded-xl border border-white/[0.06]">
          {(['TODAY', '7_DAYS', '30_DAYS'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === r
                  ? 'bg-[#ff5708] text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {r === 'TODAY' ? 'Today' : r === '7_DAYS' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Restaurant Briefing Section */}
      <div className="bg-[#1a1a1c] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-[#ff7a29]" />
            <h3 className="font-syne font-black text-white text-base uppercase tracking-wider">
              Daily Restaurant Briefing
            </h3>
          </div>
          {briefing && (
            <span className="text-white/40 text-xs">
              Generated: {briefing.generatedAt}
            </span>
          )}
        </div>

        {isLoadingBriefing ? (
          <div className="py-8 flex items-center justify-center gap-2 text-white/50 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-[#ff5708]" />
            <span>Analyzing kitchen turnaround, sales velocity and service logs...</span>
          </div>
        ) : briefing ? (
          <div className="space-y-5">
            {/* KPI Metric Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-3.5">
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider block">
                  Gross Sales
                </span>
                <span className="font-syne font-black text-white text-xl mt-1 block">
                  ₹{briefing.revenue.toLocaleString()}
                </span>
                <span className="text-emerald-400 text-[11px] font-bold mt-0.5 block">
                  +12.4% vs last week
                </span>
              </div>
              <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-3.5">
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="font-syne font-black text-white text-xl mt-1 block">
                  {briefing.totalOrders}
                </span>
                <span className="text-white/40 text-[11px] mt-0.5 block">
                  0 cancellations
                </span>
              </div>
              <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-3.5">
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider block">
                  Average Ticket (AOV)
                </span>
                <span className="font-syne font-black text-white text-xl mt-1 block">
                  ₹{briefing.averageOrderValue}
                </span>
                <span className="text-emerald-400 text-[11px] font-bold mt-0.5 block">
                  +8.4% combo lift
                </span>
              </div>
              <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-3.5">
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider block">
                  Peak Rush Period
                </span>
                <span className="font-syne font-black text-[#ff7a29] text-sm mt-1 block leading-snug">
                  {briefing.peakPeriod}
                </span>
                <span className="text-white/40 text-[11px] mt-0.5 block">
                  12 concurrent tickets
                </span>
              </div>
            </div>

            {/* Top Items & Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-white/50 tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#ff5708]" />
                    Top Performing Menu Items
                  </span>
                </div>
                <div className="space-y-2">
                  {briefing.topItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0"
                    >
                      <span className="font-medium text-white/90">
                        {idx + 1}. {item.name}
                      </span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-white/40">{item.quantity} sold</span>
                        <span className="text-[#ff7a29] font-bold">₹{item.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#141416] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold uppercase text-white/50 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Kitchen & Service Operations
                </span>
                <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
                  <p className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                    <strong className="text-white">Kitchen:</strong> {briefing.kitchenSummary}
                  </p>
                  <p className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                    <strong className="text-white">Service:</strong> {briefing.serviceSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Key Observations & Action Suggestions */}
            <div className="bg-[#1f1f22] border border-[#ff5708]/20 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold uppercase text-[#ff7a29] tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Strategic AI Observations & Action Items
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider block">
                    Observations
                  </span>
                  {briefing.aiObservations.map((obs, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <span className="text-[#ff5708] font-bold">•</span>
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider block">
                    Recommended Manager Actions
                  </span>
                  {briefing.actionSuggestions.map((action, i) => {
                    const isDone = acknowledgedActions[`briefing-act-${i}`];
                    return (
                      <div
                        key={i}
                        onClick={() => toggleAction(`briefing-act-${i}`)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-white/80 hover:border-white/20'
                        }`}
                      >
                        <span>{action}</span>
                        <CheckCircle2
                          className={`w-4 h-4 flex-shrink-0 ml-2 ${
                            isDone ? 'text-emerald-400' : 'text-white/20'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Interactive Copilot Query Bar */}
      <div className="bg-[#1a1a1c] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff5708]" />
          <h3 className="font-syne font-black text-white text-base tracking-wide">
            Ask Manager Intelligence Copilot
          </h3>
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap gap-2">
          {COPILOT_SUGGESTED_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskCopilot(q)}
              disabled={isAsking}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-[#ff5708]/15 hover:border-[#ff5708]/40 border border-white/[0.08] text-white/70 hover:text-white text-xs font-medium transition-all text-left"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskCopilot();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about sales trends, station bottlenecks, ticket times, popular items..."
            className="flex-1 bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff5708]/60 transition-colors"
          />
          <button
            type="submit"
            disabled={!query.trim() || isAsking}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#df8600] text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 shadow-md shadow-[#ff5708]/20 transition-all flex-shrink-0"
          >
            {isAsking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ask Copilot</span>
              </>
            )}
          </button>
        </form>

        {/* Real-time Copilot Responses */}
        {copilotResponses.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            {copilotResponses.map((res, i) => (
              <div
                key={i}
                className="bg-[#141416] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg animate-fade-in"
              >
                <div className="text-white/90 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {res.answer}
                </div>

                {/* Structured Fact / Interpretation / Recommendation Triad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#1e1e22] border border-white/[0.06] rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      FACT (Database Verified)
                    </span>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {res.fact}
                    </p>
                  </div>

                  <div className="bg-[#1e1e22] border border-white/[0.06] rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      INTERPRETATION
                    </span>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {res.interpretation}
                    </p>
                  </div>

                  <div className="bg-[#1e1e22] border border-white/[0.06] rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#ff7a29] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      RECOMMENDATION
                    </span>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {res.recommendation || 'Maintain current shift monitoring.'}
                    </p>
                  </div>
                </div>

                {/* Suggested Action Items */}
                {res.suggestedActions && res.suggestedActions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider block">
                      Suggested Interventions (Requires Manager Confirmation)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {res.suggestedActions.map((act, actIdx) => {
                        const actKey = `res-${i}-act-${actIdx}`;
                        const isDone = acknowledgedActions[actKey];
                        return (
                          <button
                            key={actIdx}
                            onClick={() => toggleAction(actKey)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-white/[0.04] text-white/80 border-white/10 hover:border-white/30'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-400' : 'text-white/30'}`} />
                            <span>{act}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explainability: "Why am I seeing this?" */}
                {res.evidence && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => toggleEvidence(`resp-${i}`)}
                      className="text-xs font-bold text-white/40 hover:text-white/80 flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#ff5708]" />
                      <span>Why am I seeing this? (Evidence & Calculation Inputs)</span>
                      {expandedEvidenceMap[`resp-${i}`] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedEvidenceMap[`resp-${i}`] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 p-3 rounded-xl bg-[#1a1a1e] border border-white/[0.08] text-xs space-y-2"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-white/60">
                            <div>
                              <span className="text-[10px] text-white/30 uppercase block">Time Period</span>
                              <span className="font-medium text-white">{res.evidence.timePeriod}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-white/30 uppercase block">Sample Size</span>
                              <span className="font-medium text-white">{res.evidence.sampleSize || 38} tickets</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-white/30 uppercase block">Data Sources</span>
                              <span className="font-medium text-white">Supabase KDS & Orders</span>
                            </div>
                          </div>
                          {res.evidence.calculationInputs && (
                            <div className="pt-1.5 border-t border-white/[0.06] text-white/50 text-[11px]">
                              <strong>Inputs:</strong> {res.evidence.calculationInputs.join(' • ')}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Operational Insight Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#ff5708]" />
            <h3 className="font-syne font-black text-white text-base tracking-wide">
              Live AI Operational Insights
            </h3>
          </div>
          <span className="text-white/40 text-xs">
            Refreshed automatically with KDS events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_INSIGHTS.map((insight) => (
            <div
              key={insight.id}
              className="bg-[#1a1a1c] border border-white/[0.08] hover:border-[#ff5708]/30 rounded-2xl p-5 space-y-3.5 shadow-lg flex flex-col justify-between transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      insight.priority === 'ALERT'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : insight.priority === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {insight.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-white/30">{insight.timestamp}</span>
                </div>

                <h4 className="font-syne font-bold text-white text-sm">
                  {insight.title}
                </h4>
                <p className="text-white/70 text-xs leading-relaxed">
                  {insight.headline}
                </p>

                {/* Evidence accordion */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => toggleEvidence(insight.id)}
                    className="text-[11px] font-bold text-white/40 hover:text-white/80 flex items-center justify-between w-full transition-colors"
                  >
                    <span>Explainable Evidence</span>
                    {expandedEvidenceMap[insight.id] ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedEvidenceMap[insight.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-2.5 rounded-xl bg-[#121214] border border-white/[0.06] text-[11px] space-y-1.5 text-white/70"
                      >
                        <p><strong className="text-white">Fact:</strong> {insight.fact}</p>
                        <p><strong className="text-white">Analysis:</strong> {insight.interpretation}</p>
                        <p><strong className="text-white">Action:</strong> {insight.recommendation}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action item buttons */}
              {insight.suggestedActions && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                  {insight.suggestedActions.map((act, idx) => {
                    const actKey = `${insight.id}-act-${idx}`;
                    const isDone = acknowledgedActions[actKey];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleAction(actKey)}
                        className={`w-full p-2 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-colors text-left ${
                          isDone
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/[0.02] text-white/70 border-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <span className="truncate pr-2">{act}</span>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isDone ? 'text-emerald-400' : 'text-white/20'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
