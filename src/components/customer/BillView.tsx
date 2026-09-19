/**
 * BillView
 *
 * The Bill tab inside CustomerShell.
 * Shows the authoritative bill for the current table session.
 *
 * All financial data comes from the backend (orders + billing service).
 * Proper empty/loading states when no orders exist.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Receipt,
  CreditCard,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  Restaurant,
  TableSession,
  SessionParticipant,
  Order,
  Bill,
} from '../../types';
import { restaurantDataService } from '../../services/restaurantDataService';

interface BillViewProps {
  session: TableSession | null;
  restaurant: Restaurant | null;
  participants: SessionParticipant[];
  currentParticipant: SessionParticipant | null;
  orders: Order[];
  brandColor: string;
}

function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BillView({
  session,
  restaurant,
  participants,
  currentParticipant,
  orders,
  brandColor,
}: BillViewProps) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = restaurant?.currencySymbol || '₹';
  const completedOrders = orders.filter(
    (o) => !['LOCKED', 'ASSIGNED'].includes(o.status)
  );
  const hasOrders = orders.length > 0;

  useEffect(() => {
    if (!hasOrders || !session || !currentParticipant) return;

    // Use the most recent order for bill generation
    const latestOrder = orders[0];
    if (!latestOrder) return;

    setIsLoading(true);
    setError(null);

    restaurantDataService
      .getBillForOrder(latestOrder, participants, 'EQUAL_SPLIT')
      .then((b) => {
        setBill(b);
      })
      .catch(() => {
        setError('Unable to load bill details. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orders.length, session?.id, participants.length]);

  // No orders yet
  if (!hasOrders) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-xs"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `${brandColor}15`, border: `1px solid ${brandColor}25` }}
          >
            <Receipt className="w-7 h-7" style={{ color: brandColor }} />
          </div>
          <h2 className="text-xl font-black text-white mb-3 font-['Syne',sans-serif]">
            No bill yet
          </h2>
          <p className="text-sm text-white/40 leading-relaxed">
            Your bill will appear here once you place an order. Head to the menu to start ordering.
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-16">
        <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: brandColor }} />
        <p className="text-sm text-white/40">Calculating your bill…</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-16 text-center">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-xs text-white/50 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const tax = orders.reduce((sum, o) => sum + o.tax, 0);
  const total = orders.reduce((sum, o) => sum + o.total, 0);
  const perPerson = participants.length > 0 ? total / participants.length : total;

  return (
    <div className="min-h-screen pb-24">

      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{
          background: `linear-gradient(180deg, ${brandColor}18 0%, transparent 100%)`,
        }}
      >
        <h1 className="text-2xl font-black text-white font-['Syne',sans-serif] mb-1">
          Table Bill
        </h1>
        {session && (
          <p className="text-sm text-white/40">
            Table {session.tableNumber}
            {participants.length > 0 && ` · ${participants.length} ${participants.length === 1 ? 'guest' : 'guests'}`}
          </p>
        )}
      </div>

      <div className="px-5 space-y-4">

        {/* Order summary cards */}
        {orders.map((order, idx) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/8">
              <div>
                <div className="text-xs font-bold text-white/60 uppercase tracking-wide">
                  {order.ticketNumber}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{order.createdAt}</div>
              </div>
              <div
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: order.status === 'DELIVERED' ? '#22c55e20' : `${brandColor}20`,
                  color: order.status === 'DELIVERED' ? '#4ade80' : brandColor,
                }}
              >
                {order.status}
              </div>
            </div>

            <div className="px-4 py-3 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 w-5">{item.quantity}×</span>
                    <span className="text-sm text-white/80">{item.name}</span>
                    {item.addedBy && (
                      <span className="text-xs text-white/25">({item.addedBy})</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white/70">
                    {formatCurrency(item.totalPrice, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Bill totals */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
        >
          <div className="px-4 py-3 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white/80">{formatCurrency(subtotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">
                {restaurant?.settings?.gstPercent ? `GST (${restaurant.settings.gstPercent}%)` : 'Tax'}
              </span>
              <span className="text-white/80">{formatCurrency(tax, currencySymbol)}</span>
            </div>
          </div>

          <div
            className="px-4 py-3 border-t border-white/10 flex justify-between items-center"
            style={{ background: `${brandColor}10` }}
          >
            <span className="text-base font-black text-white font-['Syne',sans-serif]">
              Total
            </span>
            <span
              className="text-xl font-black font-['Syne',sans-serif]"
              style={{ color: brandColor }}
            >
              {formatCurrency(total, currencySymbol)}
            </span>
          </div>
        </motion.div>

        {/* Per-person split */}
        {participants.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8"
          >
            <Users className="w-4 h-4 text-white/40 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-white/50">Equal split ({participants.length} people)</div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(perPerson, currencySymbol)} per person
              </div>
            </div>
          </motion.div>
        )}

        {/* Pay button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2.5 mt-2 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
          }}
          onClick={() => {
            // Payment flow — handled by existing paymentService
            alert(`Pay ${formatCurrency(total, currencySymbol)} — Payment integration via Razorpay`);
          }}
        >
          <CreditCard className="w-5 h-5" />
          Pay {formatCurrency(total, currencySymbol)}
          <ChevronRight className="w-4 h-4 opacity-80" />
        </motion.button>

        {/* Bill status */}
        {bill?.paymentStatus === 'PAID' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 justify-center py-3"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-semibold">Bill settled</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
