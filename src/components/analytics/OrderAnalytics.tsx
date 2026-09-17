// ==============================================================================
// KINGS OF WINGS — ORDER ANALYTICS COMPONENT
// Ticket Volume, Velocity, Cancellation Rates, and Basket Depth
// ==============================================================================

import React from 'react';
import { OrderAnalyticsData } from '../../services/analytics/analyticsTypes';
import { ShoppingBag, CheckCircle2, XCircle, Clock, Flame, Users, ArrowUpRight } from 'lucide-react';

interface OrderAnalyticsProps {
  data: OrderAnalyticsData;
}

export const OrderAnalytics: React.FC<OrderAnalyticsProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Total Tickets
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {data.totalOrders}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            {data.completedOrders} delivered ({data.cancellationRate}% cancellations)
          </span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Basket Depth
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {data.averageItemsPerOrder} Items
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Average items ordered per ticket</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Peak Order Velocity
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {data.peakHour}
          </div>
          <span className="text-[10px] text-[#ff7a29] mt-1 block">
            {data.peakHourOrderCount} tickets during peak rush
          </span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Customer Retention
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {data.repeatSessionPercentage}%
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Repeat diner QR sessions in 30d</span>
        </div>
      </div>

      {/* Operational Order Flow Banner */}
      <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Average Operating Velocity: {data.ordersPerHourAvg} orders / hr</h4>
            <p className="text-xs text-[#8b807a]">
              Healthy service rhythm. KDS ticket queues maintain sub-12 minute delivery benchmarks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>0 Stalled Tickets</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#8b807a]">
            <XCircle className="w-4 h-4" />
            <span>0 Abandoned Carts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
