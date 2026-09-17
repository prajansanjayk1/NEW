import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Flame, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Filter, 
  AlertTriangle,
  RotateCw,
  Sparkles,
  Layers,
  Flag
} from 'lucide-react';
import { motion } from 'motion/react';
import { Order, OrderStatus, KitchenTicketPriority, UserRole } from '../../types';
import { formatCurrencyMajor } from '../../utils/currency';
import { backendService } from '../../services/backendService';

interface StaffKitchenViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  userRole: UserRole;
}

const STATIONS = ['ALL', 'FRY', 'GRILL', 'BURGER', 'DRINKS', 'DESSERT', 'EXPO'];

const COLUMNS: { status: OrderStatus; label: string; accent: string; badge: string }[] = [
  { status: 'LOCKED', label: '1. New Orders', accent: 'border-red-500/40', badge: 'bg-red-500/20 text-red-400' },
  { status: 'ASSIGNED', label: '2. Claimed / Prep', accent: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-400' },
  { status: 'COOKING', label: '3. Deep Fryer (375°F)', accent: 'border-[#ff5708]/50', badge: 'bg-[#ff5708]/20 text-[#ff7a29]' },
  { status: 'SAUCING', label: '4. Wok Toss & Glaze', accent: 'border-orange-500/40', badge: 'bg-orange-500/20 text-orange-400' },
  { status: 'READY', label: '5. Expeditor Ready', accent: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-400' },
  { status: 'DELIVERED', label: '6. Dispatched / Done', accent: 'border-white/10', badge: 'bg-white/10 text-[#a0948e]' },
];

export const StaffKitchenView: React.FC<StaffKitchenViewProps> = ({
  orders,
  onUpdateOrderStatus,
  userRole,
}) => {
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [now, setNow] = useState<Date>(new Date());
  const [ticketPriorities, setTicketPriorities] = useState<Record<string, KitchenTicketPriority>>({});

  // Auto-updating elapsed clock every 15s
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleTogglePriority = (orderId: string, current: KitchenTicketPriority = 'NORMAL') => {
    const nextPriority: KitchenTicketPriority = 
      current === 'NORMAL' ? 'RUSH' : current === 'RUSH' ? 'VIP' : 'NORMAL';
    
    setTicketPriorities((prev) => ({ ...prev, [orderId]: nextPriority }));
    backendService.updateKitchenTicketPriority(`tkt-${orderId}`, nextPriority);
  };

  const getFilteredOrdersForStatus = (status: OrderStatus) => {
    return orders
      .filter((o) => {
        const matchesStatus = o.status === status;
        if (!matchesStatus) return false;
        if (stationFilter === 'ALL') return true;
        return (o.station || 'FRY').toUpperCase().includes(stationFilter);
      })
      .sort((a, b) => {
        const pA = ticketPriorities[a.id] || 'NORMAL';
        const pB = ticketPriorities[b.id] || 'NORMAL';
        const weight: Record<KitchenTicketPriority, number> = { VIP: 3, RUSH: 2, NORMAL: 1, LOW: 0 };
        return (weight[pB] || 1) - (weight[pA] || 1);
      });
  };

  const getActionLabel = (status: OrderStatus) => {
    switch (status) {
      case 'LOCKED':
        return 'Claim Ticket';
      case 'ASSIGNED':
        return 'Drop in Fryer';
      case 'COOKING':
        return 'To Saucing Wok';
      case 'SAUCING':
        return 'Pass to Expo';
      case 'READY':
        return 'Dispatch to Table';
      case 'DELIVERED':
        return null;
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case 'LOCKED': return 'ASSIGNED';
      case 'ASSIGNED': return 'COOKING';
      case 'COOKING': return 'SAUCING';
      case 'SAUCING': return 'READY';
      case 'READY': return 'DELIVERED';
      case 'DELIVERED': return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Station Bar & Live Kitchen Metrics */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#161415] border border-white/[0.08] rounded-xl p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#ff5708]/20 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-[#ff5708]" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-white font-['Syne',sans-serif] tracking-wider">
              Kitchen Pit & Expeditor Display
            </h2>
            <span className="text-[10px] text-[#7d726c]">
              Real-time culinary workflow
            </span>
          </div>
        </div>

        {/* Station Selectors */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-bold text-[#6d625d] uppercase mr-1">Station:</span>
          {STATIONS.map((station) => (
            <button
              key={station}
              onClick={() => setStationFilter(station)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                stationFilter === station
                  ? 'bg-[#ff5708] text-white'
                  : 'bg-white/5 hover:bg-white/10 text-[#8f827d]'
              }`}
            >
              {station}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-start">
        {COLUMNS.map((col) => {
          const columnOrders = getFilteredOrdersForStatus(col.status);

          return (
            <div
              key={col.status}
              className="bg-[#141213] border border-white/[0.06] rounded-xl p-2.5 flex flex-col min-h-[520px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90 font-['Syne',sans-serif]">
                  {col.label}
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${col.badge}`}>
                  {columnOrders.length}
                </span>
              </div>

              {/* Tickets Stack */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
                {columnOrders.length === 0 ? (
                  <div className="py-12 text-center text-[11px] text-[#5e544f]">
                    Queue empty
                  </div>
                ) : (
                  columnOrders.map((order) => {
                    const nextSt = getNextStatus(order.status);
                    const actionLabel = getActionLabel(order.status);
                    const priority = ticketPriorities[order.id] || 'NORMAL';

                    return (
                      <div
                        key={order.id}
                        className={`bg-[#1c191a] border rounded-xl p-3 shadow-md transition-all flex flex-col justify-between ${
                          priority === 'VIP' ? 'border-purple-500/80 bg-purple-950/20' :
                          priority === 'HIGH' ? 'border-amber-500/80 bg-amber-950/20' :
                          col.accent
                        }`}
                      >
                        <div>
                          {/* Ticket Top bar */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-['Syne',sans-serif] font-black text-xs text-white">
                              {order.ticketNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 font-bold font-mono text-[10px] text-white">
                              TBL {order.tableNumber}
                            </span>
                          </div>

                          {/* Time & Priority Pill */}
                          <div className="flex items-center justify-between text-[10px] text-[#8c807a] mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#ff7a29]" />
                              <span>{order.createdAt}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleTogglePriority(order.id, priority)}
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase cursor-pointer flex items-center gap-1 ${
                                priority === 'VIP' ? 'bg-purple-500 text-white animate-pulse' :
                                priority === 'HIGH' ? 'bg-amber-500 text-black' :
                                'bg-white/10 text-[#7a6f69] hover:text-white'
                              }`}
                              title="Click to toggle priority (NORMAL -> HIGH -> VIP)"
                            >
                              <Flag className="w-2.5 h-2.5" />
                              <span>{priority}</span>
                            </button>
                          </div>

                          {/* Items List */}
                          <div className="space-y-1.5 py-1.5 border-t border-white/[0.06]">
                            {order.items.map((item, i) => {
                              const itemName = item.name || (item as any).menuItem?.name || 'Item';
                              const cust = item.customization as any;
                              const modifiers = cust
                                ? [
                                    cust.portionSize || cust.portion?.name || cust.portion,
                                    cust.styleCut || cust.style?.name || cust.style,
                                    cust.heatLevel || cust.sauce?.name || cust.sauce,
                                    typeof cust.dip === 'string' ? cust.dip : cust.dip?.name,
                                  ].filter(Boolean).join(' • ')
                                : '';

                              return (
                                <div key={i} className="text-[11px] leading-tight">
                                  <div className="flex items-baseline gap-1 font-bold text-white">
                                    <span className="font-mono text-[#ff7a29]">{item.quantity}×</span>
                                    <span className="truncate">{itemName}</span>
                                  </div>
                                  {modifiers && (
                                    <div className="text-[10px] text-[#877c77] pl-3">
                                      {modifiers}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Advance Action */}
                        {nextSt && actionLabel && (
                          <div className="pt-2 mt-2 border-t border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, nextSt)}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#ff5708] hover:bg-[#ff7a29] text-white text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 font-['Syne',sans-serif]"
                            >
                              <span>{actionLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
