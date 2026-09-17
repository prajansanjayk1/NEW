import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Package, 
  Phone, 
  CreditCard, 
  RefreshCw, 
  Flame, 
  AlertCircle 
} from 'lucide-react';
import { Order, TakeawayStatus } from '../../types';
import { takeawayService } from '../../services/takeawayService';

export const StaffTakeawayQueueView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'READY' | 'COMPLETED'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const list = await takeawayService.getTakeawayOrders();
      setOrders(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 10000); // 10s auto-refresh
    return () => clearInterval(timer);
  }, []);

  const handleStatusUpdate = async (orderId: string, nextStatus: TakeawayStatus) => {
    await takeawayService.updateTakeawayStatus(orderId, nextStatus);
    fetchOrders();
  };

  const handleMarkPaid = async (orderId: string) => {
    if (window.confirm('Confirm customer has paid cash/card at counter?')) {
      await takeawayService.updateTakeawayStatus(orderId, 'PREPARING', 'PAID');
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return o.takeawayStatus === 'ORDER_RECEIVED' || o.takeawayStatus === 'CONFIRMED' || o.takeawayStatus === 'PREPARING';
    if (activeTab === 'READY') return o.takeawayStatus === 'READY_FOR_PICKUP';
    if (activeTab === 'COMPLETED') return o.takeawayStatus === 'PICKED_UP' || o.takeawayStatus === 'CANCELLED';
    return true;
  });

  return (
    <div id="staff-takeaway-queue-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Pickup Station
            </span>
            <span className="text-zinc-500 text-xs">·</span>
            <span className="text-zinc-400 text-xs">Front Desk Express Counter</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            Takeaway & Pickup Queue
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: 'ACTIVE', label: 'In Preparation' },
          { id: 'READY', label: 'Ready for Pickup' },
          { id: 'COMPLETED', label: 'Picked Up / Handed Over' },
          { id: 'ALL', label: 'All Orders' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300">No takeaway orders in this queue</h3>
          <p className="text-xs text-zinc-500 mt-1">Incoming orders from the web and mobile app will appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isReady = order.takeawayStatus === 'READY_FOR_PICKUP';
            const isCompleted = order.takeawayStatus === 'PICKED_UP';
            const isPendingPayment = order.paymentStatus === 'PENDING';

            return (
              <div
                key={order.id}
                className={`bg-[#18181b] rounded-2xl border transition-all flex flex-col justify-between ${
                  isReady
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                    : isPendingPayment
                    ? 'border-amber-500/40'
                    : 'border-zinc-800'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold font-mono text-white">
                          #{order.takeawayOrderNumber || order.ticketNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-amber-400 uppercase">
                          {order.channel || 'TAKEAWAY'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-300 mt-0.5">{order.customerName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold font-mono text-white">₹{order.total}</span>
                      <span
                        className={`block text-[10px] font-bold uppercase ${
                          order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'PAID ONLINE' : 'PAY AT COUNTER'}
                      </span>
                    </div>
                  </div>

                  {/* Pickup & Phone Details */}
                  <div className="bg-zinc-900/80 rounded-xl p-2.5 space-y-1 text-xs text-zinc-300">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Target Pickup:
                      </span>
                      <span className="font-semibold text-white">{order.pickupTime}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" /> Contact:
                        </span>
                        <span className="font-mono text-zinc-300">{order.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Items to Pack</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Package className="w-3 h-3" /> Sealed Pack
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-800/60 font-mono text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="py-1 flex justify-between">
                          <span className="text-zinc-200">
                            {it.quantity}x {it.name}
                          </span>
                          <span className="text-zinc-400">₹{it.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.pickupNotes && (
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{order.pickupNotes}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/80 rounded-b-2xl flex flex-col gap-2">
                  {isPendingPayment && !isCompleted && (
                    <button
                      onClick={() => handleMarkPaid(order.id)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Collect ₹{order.total} & Mark Paid
                    </button>
                  )}

                  <div className="flex gap-2">
                    {order.takeawayStatus === 'ORDER_RECEIVED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Confirm Order
                      </button>
                    )}

                    {order.takeawayStatus === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                        className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                      >
                        Start Preparing
                      </button>
                    )}

                    {order.takeawayStatus === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'READY_FOR_PICKUP')}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Ready for Pickup
                      </button>
                    )}

                    {order.takeawayStatus === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PICKED_UP')}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20"
                      >
                        Hand Over to Customer
                      </button>
                    )}

                    {isCompleted && (
                      <div className="w-full py-2 text-center text-xs font-bold text-zinc-500 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Completed & Handed Over
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
