// ==============================================================================
// KINGS OF WINGS — KITCHEN & KDS ANALYTICS COMPONENT
// Stage Durations, Station Metrics, and Measurable Bottleneck Hypotheses
// ==============================================================================

import React from 'react';
import { KitchenAnalyticsData } from '../../services/analytics/analyticsTypes';
import { Clock, AlertTriangle, CheckCircle2, Flame, Layers, ChefHat, Activity } from 'lucide-react';

interface KitchenAnalyticsProps {
  data: KitchenAnalyticsData;
}

export const KitchenAnalytics: React.FC<KitchenAnalyticsProps> = ({ data }) => {
  const { 
    averagePrepTimeMinutes, 
    medianPrepTimeMinutes, 
    totalTicketsCompleted, 
    currentQueueLength, 
    stageDurations, 
    stations, 
    delayedTicketsCount, 
    delayedTicketsPercentage,
    peakKitchenPeriod, 
    bottlenecks 
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Average Prep Time
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averagePrepTimeMinutes} min
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Benchmark: &lt; 15.0 min</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Median Prep Time
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {medianPrepTimeMinutes} min
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">50% of orders ready faster</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Delayed Tickets
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-['Syne',sans-serif] mt-1">
            {delayedTicketsCount} <span className="text-xs text-[#8b807a]">({delayedTicketsPercentage}%)</span>
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Tickets exceeding station targets</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Active KDS Queue
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {currentQueueLength} tickets
          </div>
          <span className="text-[10px] text-[#ff7a29] mt-1 block">Peak: {peakKitchenPeriod}</span>
        </div>
      </div>

      {/* KDS Stage Durations Breakdown */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
        <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ff5708]" />
          <span>KDS Stage Pipeline Breakdown (Target vs Observed)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageDurations.map((step) => {
            const isExceeded = step.averageDurationSeconds > step.targetDurationSeconds;
            const variance = step.averageDurationSeconds - step.targetDurationSeconds;

            return (
              <div 
                key={step.stage}
                className={`p-4 rounded-xl border ${
                  isExceeded 
                    ? 'bg-amber-500/5 border-amber-500/20' 
                    : 'bg-[#181516] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-white">{step.label}</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isExceeded ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isExceeded ? `+${variance}s variance` : 'On Target'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <span className="text-2xl font-black text-white font-['Syne',sans-serif]">
                      {Math.floor(step.averageDurationSeconds / 60)}m {step.averageDurationSeconds % 60}s
                    </span>
                    <span className="text-[10px] text-[#7d716c] block">
                      Target: {Math.floor(step.targetDurationSeconds / 60)}m {step.targetDurationSeconds % 60}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Station Readiness & Equipment Utilization */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
        <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-sky-400" />
          <span>Station Performance & Equipment Utilization</span>
        </h3>

        <div className="divide-y divide-white/[0.06]">
          {stations.map((st) => (
            <div key={st.station} className="py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="max-w-xs">
                <div className="font-bold text-white text-sm">{st.station}</div>
                <div className="text-[11px] text-[#8b807a]">
                  {st.ticketsCount} tickets completed • {st.delayedTicketsCount} delayed ({st.delayedPercentage}%)
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <span className="text-[10px] text-[#7d716c] block uppercase">Avg Prep</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {Math.round((st.averagePrepSeconds / 60) * 10) / 10} min
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#7d716c] block uppercase">Median</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {Math.round((st.medianPrepSeconds / 60) * 10) / 10} min
                  </span>
                </div>

                <div className="w-28">
                  <div className="flex justify-between text-[10px] text-[#8b807a] mb-1">
                    <span>Load</span>
                    <span className="font-mono text-white font-bold">{st.utilizationPercentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        st.utilizationPercentage > 80 ? 'bg-[#ff5708]' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${st.utilizationPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Measurable Bottleneck Hypotheses Card (PART 7) */}
      {bottlenecks.length > 0 && (
        <div className="bg-[#1c1616] border border-amber-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase tracking-wider">
              Measurable Bottleneck Detected & Hypotheses Analysis
            </h3>
          </div>

          {bottlenecks.map((bn, idx) => (
            <div key={idx} className="space-y-3">
              <p className="text-xs text-white">
                Observed prep time on <strong className="text-[#ff7a29]">{bn.station}</strong> increased by <strong>+{bn.observedDifferenceMinutes} minutes</strong> (from {bn.previousAverageMinutes}m to {bn.currentAverageMinutes}m). Supported hypotheses based on operational data:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {bn.supportedHypotheses.map((hyp, hIdx) => (
                  <div key={hIdx} className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs">
                    <div className="font-bold text-amber-300 text-[11px] uppercase tracking-wider mb-1">
                      {hyp.cause.replace(/_/g, ' ')}
                    </div>
                    <p className="text-[#a0948e] text-[11px] mb-2 leading-relaxed">
                      {hyp.description}
                    </p>
                    <div className="text-[10px] font-mono text-white bg-white/5 px-2 py-1 rounded">
                      Metric: {hyp.supportingMetric}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-[#ff5708]/10 border border-[#ff5708]/20 flex items-start gap-2.5 text-xs text-white">
                <CheckCircle2 className="w-4 h-4 text-[#ff5708] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#ff7a29]">Manager Operational Recommendation: </strong>
                  <span>{bn.actionRecommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
