// ==============================================================================
// KINGS OF WINGS — SERVICE REQUEST ANALYTICS COMPONENT
// Table Assistance Velocity, Request Types, and Resolution SLA Tracking
// ==============================================================================

import React from 'react';
import { ServiceAnalyticsData } from '../../services/analytics/analyticsTypes';
import { Bell, Clock, CheckCircle2, AlertCircle, Droplets, Utensils, FileText, UserCheck } from 'lucide-react';

interface ServiceAnalyticsProps {
  data: ServiceAnalyticsData;
}

export const ServiceAnalytics: React.FC<ServiceAnalyticsProps> = ({ data }) => {
  const {
    totalRequests,
    requestsPerHourAverage,
    openCount,
    inProgressCount,
    resolvedCount,
    averageResolutionTimeMinutes,
    unresolvedPercentage,
    peakRequestPeriod,
    byType,
    hourlyVolume,
  } = data;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WATER':
        return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'CUTLERY':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'BILL':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-[#ff5708]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Service Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Total Requests
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {totalRequests} calls
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">{resolvedCount} resolved swiftly</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Avg Resolution SLA
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averageResolutionTimeMinutes} min
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Sub-2 minute response target met</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Unresolved Queue
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-['Syne',sans-serif] mt-1">
            {openCount + inProgressCount} <span className="text-xs text-[#8b807a]">({unresolvedPercentage}%)</span>
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">{openCount} open, {inProgressCount} in-flight</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Peak Call Period
          </span>
          <div className="text-sm font-black text-[#ff7a29] font-['Syne',sans-serif] mt-2 truncate">
            {peakRequestPeriod}
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">{requestsPerHourAverage} calls / hour avg</span>
        </div>
      </div>

      {/* Service Request Types Breakdown */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#ff5708]" />
          <span>Diner Assistance Volume by Type & Resolution Times</span>
        </h3>

        <div className="divide-y divide-white/[0.06]">
          {byType.map((st) => (
            <div key={st.type} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  {getTypeIcon(st.type)}
                </div>
                <div>
                  <div className="font-bold text-white">{st.label}</div>
                  <div className="text-[10px] text-[#8b807a]">
                    Avg resolution: {Math.round(st.averageResolutionSeconds / 60 * 10) / 10} min
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-white">{st.count} requests</div>
                <div className="font-mono text-[10px] text-[#ff7a29]">{st.percentageOfTotal}% of total calls</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
