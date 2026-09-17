import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock, 
  Bell, 
  ChefHat, 
  Flame, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { Order, ServiceRequest, RestaurantTable, TableStatus, StaffPortalTab, OperationsMetrics } from '../../types';
import { formatCurrencyMajor } from '../../utils/currency';
import { backendService } from '../../services/backendService';

interface OperationsOverviewViewProps {
  orders: Order[];
  serviceRequests: ServiceRequest[];
  tables: RestaurantTable[];
  onNavigateTab: (tab: StaffPortalTab) => void;
  onSelectTable?: (table: RestaurantTable) => void;
  onSelectOrder?: (order: Order) => void;
}

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; badge: string; dot: string }> = {
  AVAILABLE: { label: 'Available', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  OCCUPIED: { label: 'Occupied', badge: 'bg-[#ff5708]/15 text-[#ff5708] border-[#ff5708]/30', dot: 'bg-[#ff5708]' },
  ORDERING: { label: 'Ordering', badge: 'bg-[#df8600]/15 text-[#df8600] border-[#df8600]/30', dot: 'bg-[#df8600]' },
  DINING: { label: 'Feasting', badge: 'bg-[#ffb86d]/15 text-[#ffb86d] border-[#ffb86d]/30', dot: 'bg-[#ffb86d]' },
  BILL_REQUESTED: { label: 'Bill Requested', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  CLEANING: { label: 'Sanitizing', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400' },
  CLOSED: { label: 'Closed', badge: 'bg-white/10 text-[#ac897e] border-white/10', dot: 'bg-[#ac897e]' },
};

export const OperationsOverviewView: React.FC<OperationsOverviewViewProps> = ({
  orders,
  serviceRequests,
  tables,
  onNavigateTab,
  onSelectTable,
  onSelectOrder,
}) => {
  const [metrics, setMetrics] = useState<OperationsMetrics>({
    todaysSales: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrdersCount: orders.length,
    activeTablesCount: tables.filter((t) => t.status !== 'AVAILABLE' && t.status !== 'CLOSED').length,
    totalTablesCount: tables.length,
    averageOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0,
    openServiceRequestsCount: serviceRequests.filter((r) => r.status !== 'COMPLETED').length,
    kitchenQueueCount: orders.filter((o) => o.status !== 'DELIVERED').length,
  });

  useEffect(() => {
    backendService.getOperationsMetrics().then(setMetrics);
  }, [orders, tables, serviceRequests]);

  const urgentRequests = serviceRequests.filter((r) => r.status !== 'COMPLETED').slice(0, 4);
  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#ff5708]/40 transition-colors">
          <div className="flex items-center justify-between text-[#8e827c] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Syne',sans-serif]">Today's Sales</span>
            <DollarSign className="w-4 h-4 text-[#ff5708]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            {formatCurrencyMajor(metrics.todaysSales)}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Shift Active</span>
          </div>
        </div>

        {/* Total Orders */}
        <div 
          onClick={() => onNavigateTab('ORDERS')}
          className="bg-[#181516] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#ff5708]/40 transition-colors"
        >
          <div className="flex items-center justify-between text-[#8e827c] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Syne',sans-serif]">Orders</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            {metrics.totalOrdersCount}
          </div>
          <div className="text-[11px] text-[#938782] flex items-center justify-between mt-1">
            <span>Kitchen queue:</span>
            <span className="font-bold text-white">{metrics.kitchenQueueCount}</span>
          </div>
        </div>

        {/* Active Tables */}
        <div 
          onClick={() => onNavigateTab('TABLES')}
          className="bg-[#181516] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#ff5708]/40 transition-colors"
        >
          <div className="flex items-center justify-between text-[#8e827c] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Syne',sans-serif]">Active Tables</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            {metrics.activeTablesCount} <span className="text-sm font-normal text-[#8e827c]">/ {metrics.totalTablesCount}</span>
          </div>
          <div className="text-[11px] text-[#938782] mt-1">
            {Math.round((metrics.activeTablesCount / (metrics.totalTablesCount || 1)) * 100)}% occupancy
          </div>
        </div>

        {/* Average Order Value */}
        <div 
          onClick={() => onNavigateTab('ANALYTICS')}
          className="bg-[#181516] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#ff5708]/40 transition-colors"
        >
          <div className="flex items-center justify-between text-[#8e827c] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Syne',sans-serif]">Avg Order</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            {formatCurrencyMajor(metrics.averageOrderValue)}
          </div>
          <div className="text-[11px] text-[#938782] mt-1">Per table ticket</div>
        </div>

        {/* Open Service Requests */}
        <div 
          onClick={() => onNavigateTab('SERVICE')}
          className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-colors ${
            metrics.openServiceRequestsCount > 0 
              ? 'bg-[#231812] border-[#ff5708]/40 hover:border-[#ff5708]' 
              : 'bg-[#181516] border-white/[0.08] hover:border-[#ff5708]/40'
          }`}
        >
          <div className="flex items-center justify-between text-[#8e827c] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Syne',sans-serif]">Service Calls</span>
            <Bell className={`w-4 h-4 ${metrics.openServiceRequestsCount > 0 ? 'text-[#ff5708] animate-pulse' : 'text-[#8e827c]'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            {metrics.openServiceRequestsCount}
          </div>
          <div className={`text-[11px] font-bold ${metrics.openServiceRequestsCount > 0 ? 'text-[#ff7a29]' : 'text-emerald-400'} mt-1`}>
            {metrics.openServiceRequestsCount > 0 ? 'Action required' : 'All resolved'}
          </div>
        </div>

        {/* Kitchen Queue */}
        <div 
          onClick={() => onNavigateTab('KITCHEN')}
          className="bg-[#181516] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#ff5708]/40 transition-colors"
        >
          <div className="flex items-center justify-between text-[#8e827c] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-['Syne',sans-serif]">Kitchen Pit</span>
            <ChefHat className="w-4 h-4 text-[#ff5708]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            {metrics.kitchenQueueCount}
          </div>
          <div className="text-[11px] text-[#938782] mt-1">Orders in preparation</div>
        </div>
      </div>

      {/* Main Split: Live Floor Table Status & Live Ticket Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Table Map Summary (2 Columns on large) */}
        <div className="lg:col-span-2 bg-[#161415] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-['Syne',sans-serif] text-base font-black uppercase text-white tracking-wider">
                Live Restaurant Floor Status
              </h2>
              <p className="text-xs text-[#8f837d]">Real-time dining room tables and guest activity</p>
            </div>
            <button
              onClick={() => onNavigateTab('TABLES')}
              className="text-xs font-bold text-[#ff7a29] hover:text-[#ff9359] flex items-center gap-1 font-['Syne',sans-serif] uppercase tracking-wider"
            >
              <span>Manage Tables</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map((table) => {
              const cfg = TABLE_STATUS_CONFIG[table.status] || TABLE_STATUS_CONFIG.AVAILABLE;
              const matchingOrder = orders.find((o) => o.tableNumber === table.tableNumber);

              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable ? onSelectTable(table) : onNavigateTab('TABLES')}
                  className="p-3.5 rounded-xl bg-[#1c191a] border border-white/[0.06] hover:border-[#ff5708]/50 cursor-pointer transition-all flex flex-col justify-between min-h-[105px] group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-black text-white font-['Syne',sans-serif]">
                        Table {table.tableNumber}
                      </span>
                      <span className="block text-[10px] text-[#786e68]">{table.zone} • Cap {table.capacity}</span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {matchingOrder && (
                        <span className="text-xs font-mono font-bold text-white/90">
                          {formatCurrencyMajor(matchingOrder.total)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Service Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Urgent Service Calls */}
          <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#ff5708]" />
                <span>Service Requests</span>
              </h3>
              <span className="text-xs text-[#ff7a29] font-bold font-mono">
                {urgentRequests.length} Open
              </span>
            </div>

            {urgentRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7c716b]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <span>No pending service calls on the floor.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onNavigateTab('SERVICE')}
                    className="p-3 rounded-xl bg-[#201d1e] border border-white/[0.06] hover:border-[#ff5708]/30 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{req.icon || '🛎️'}</span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Table {req.tableNumber} • {req.title}
                        </div>
                        <div className="text-[10px] text-[#7d726c]">{req.requestedAt}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ff5708]/20 text-[#ff7a29]">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Kitchen Stream */}
          <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff5708]" />
                <span>Live Kitchen Stream</span>
              </h3>
              <button
                onClick={() => onNavigateTab('KITCHEN')}
                className="text-xs font-bold text-[#ff7a29] hover:underline"
              >
                KDS Board
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7c716b]">
                <span>Kitchen queue is clear.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => onSelectOrder ? onSelectOrder(ord) : onNavigateTab('ORDERS')}
                    className="p-2.5 rounded-xl bg-[#201d1e] border border-white/[0.06] hover:border-white/20 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white font-['Syne',sans-serif]">
                        {ord.ticketNumber} • Table {ord.tableNumber}
                      </div>
                      <div className="text-[10px] text-[#80756f]">
                        {ord.items.length} items • {ord.station || 'Fry Station'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-white/10 text-white">
                      {ord.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
