/**
 * CustomerHomeView
 *
 * The Home tab inside CustomerShell.
 * Shows real restaurant data and session state — no hardcoded business values.
 *
 * If data is missing → shows proper empty/loading states.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  ChevronRight,
  Wifi,
  Bell,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  Restaurant,
  TableSession,
  SessionParticipant,
} from '../../types';

interface CustomerHomeViewProps {
  restaurant: Restaurant | null;
  session: TableSession | null;
  participants: SessionParticipant[];
  currentParticipant: SessionParticipant | null;
  onGoToMenu: () => void;
  onOpenService: () => void;
  onOpenConcierge: () => void;
  brandColor: string;
}

export function CustomerHomeView({
  restaurant,
  session,
  participants,
  currentParticipant,
  onGoToMenu,
  onOpenService,
  onOpenConcierge,
  brandColor,
}: CustomerHomeViewProps) {
  const tableNumber = session?.tableNumber;
  const participantCount = participants.length;

  return (
    <div className="min-h-screen flex flex-col">

      {/* Restaurant header / hero */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${brandColor}25 0%, #0e0e0f 100%)`,
          minHeight: 220,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${brandColor}35 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-10 pt-12 pb-8 px-5 flex flex-col items-center text-center">

          {/* Restaurant logo */}
          {restaurant ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 rounded-2xl mb-4 overflow-hidden flex items-center justify-center border border-white/10"
              style={{ background: `${brandColor}20` }}
            >
              {restaurant.logo && restaurant.logo.startsWith('http') ? (
                <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{restaurant.logo || '🍽️'}</span>
              )}
            </motion.div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse mb-4" />
          )}

          {/* Restaurant name */}
          {restaurant ? (
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black text-white font-['Syne',sans-serif] mb-1"
            >
              {restaurant.name}
            </motion.h1>
          ) : (
            <div className="h-6 w-40 bg-white/5 animate-pulse rounded-full mb-1" />
          )}

          {/* Address */}
          {restaurant?.address && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-1.5 text-xs text-white/40 mb-3"
            >
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[220px]">{restaurant.address.split(',').slice(0, 2).join(',')}</span>
            </motion.div>
          )}

          {/* Table + session status */}
          {tableNumber ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 flex-wrap justify-center"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
                style={{
                  background: `${brandColor}25`,
                  border: `1.5px solid ${brandColor}40`,
                }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: brandColor }} />
                <span className="text-sm font-bold text-white">
                  Table {tableNumber}
                </span>
              </div>

              {participantCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                  <Users className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-xs text-white/60 font-medium">
                    {participantCount === 1 ? 'Just you' : `${participantCount} people`}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-9 w-32 bg-white/5 animate-pulse rounded-2xl mt-2" />
          )}
        </div>
      </div>

      {/* Participant avatars */}
      {participants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="px-5 py-3 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {participants.map((p, i) => (
              <div
                key={p.id}
                title={p.displayName}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-[#0e0e0f] transition-transform hover:scale-110"
                style={{
                  background: p.isCurrentDevice ? `${brandColor}40` : 'rgba(255,255,255,0.1)',
                  zIndex: participants.length - i,
                }}
              >
                {p.avatarEmoji || p.initials?.charAt(0) || '👤'}
              </div>
            ))}
          </div>
          <div className="text-xs text-white/40">
            {currentParticipant ? (
              <>You{participants.length > 1 ? ` + ${participants.length - 1} other${participants.length > 2 ? 's' : ''}` : ''}</>
            ) : (
              <>{participants.length} {participants.length === 1 ? 'guest' : 'guests'}</>
            )}
          </div>
        </motion.div>
      )}

      {/* Action cards */}
      <div className="px-5 py-4 space-y-3 flex-1">

        {/* Start Ordering — primary CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoToMenu}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-bold shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div className="text-left">
              <div className="text-base font-bold">View Menu</div>
              <div className="text-xs opacity-70 font-normal">Browse and add to table cart</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-80" />
        </motion.button>

        {/* Quick action grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Call service */}
          <button
            onClick={onOpenService}
            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/8 transition-colors active:opacity-80"
          >
            <Bell className="w-5 h-5 text-white/60" />
            <div>
              <div className="text-sm font-bold text-white">Call Service</div>
              <div className="text-xs text-white/40">Water, cutlery, assistance</div>
            </div>
          </button>

          {/* AI Concierge */}
          <button
            onClick={onOpenConcierge}
            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/8 transition-colors active:opacity-80"
          >
            <Sparkles className="w-5 h-5 text-[#ffb86d]" />
            <div>
              <div className="text-sm font-bold text-white">AI Concierge</div>
              <div className="text-xs text-white/40">Recommendations, queries</div>
            </div>
          </button>
        </motion.div>

        {/* WiFi info (if available) */}
        {restaurant?.wifiSsid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8"
          >
            <Wifi className="w-4 h-4 text-white/30 flex-shrink-0" />
            <div>
              <div className="text-xs text-white/50 font-medium">{restaurant.wifiSsid}</div>
              {restaurant.wifiPassword && (
                <div className="text-xs text-white/30">{restaurant.wifiPassword}</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Empty state if no restaurant data yet */}
        {!restaurant && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-sm text-white/30">Loading restaurant information…</p>
          </div>
        )}
      </div>
    </div>
  );
}
