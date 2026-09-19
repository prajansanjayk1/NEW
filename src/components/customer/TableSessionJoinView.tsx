/**
 * TableSessionJoinView
 *
 * Shown after authentication — presents the "join table" UI.
 * Checks if an active session exists and how many people are already ordering.
 *
 * States:
 * - Loading: checking session
 * - New session: "Starting your table session" (auto-proceed)
 * - Existing session: "X people already ordering — Join Table"
 * - Closed: "This session has ended"
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, ChevronRight, Loader2, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { useTableSessionCtx } from '../../contexts/TableSessionContext';
import { ResolvedRestaurant, ResolvedTable } from '../../services/entryService';

interface TableSessionJoinViewProps {
  restaurant: ResolvedRestaurant;
  table: ResolvedTable;
}

const AVATAR_EMOJIS = ['🍽️', '🥗', '🍜', '🍕', '🌮', '🍣', '🍛', '🥘'];

export function TableSessionJoinView({ restaurant, table }: TableSessionJoinViewProps) {
  const {
    session,
    participants,
    sessionPhase,
    phaseError,
    isLoadingJoin,
    joinSession,
  } = useTableSessionCtx();

  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [nameError, setNameError] = useState('');

  const color = restaurant.branding?.primaryColor || '#ff5708';
  const isExistingSession = participants.length > 0;

  const handleJoin = async () => {
    const name = displayName.trim();
    if (!name) {
      setNameError('Please enter your name to join the table.');
      return;
    }
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    setNameError('');
    await joinSession(name, selectedEmoji);
  };

  // CLOSED state
  if (sessionPhase === 'CLOSED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0a0a0b 0%, #141218 100%)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <UtensilsCrossed className="w-7 h-7 text-white/30" />
          </div>
          <h2 className="text-xl font-black text-white mb-3 font-['Syne',sans-serif]">
            This table session has ended
          </h2>
          <p className="text-sm text-white/50">
            The table has been settled. Scan the QR code to start a new session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0b 0%, #141218 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 35% at 50% 20%, ${color}12 0%, transparent 70%)`,
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{
                backgroundColor: `${color}20`,
                color,
                border: `1px solid ${color}35`,
              }}
            >
              {restaurant.name} · Table {table.tableNumber}
            </div>

            <h1 className="text-3xl font-black text-white font-['Syne',sans-serif] mb-2">
              {isExistingSession ? `You're joining Table ${table.tableNumber}` : `Table ${table.tableNumber}`}
            </h1>

            {isExistingSession ? (
              <p className="text-sm text-white/50">
                <span style={{ color }} className="font-bold">{participants.length} {participants.length === 1 ? 'person is' : 'people are'}</span> already ordering at this table
              </p>
            ) : (
              <p className="text-sm text-white/50">
                Start your table session to order
              </p>
            )}
          </div>

          {/* Existing participants preview */}
          {isExistingSession && participants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <div className="flex -space-x-2">
                {participants.slice(0, 4).map((p, i) => (
                  <div
                    key={p.id}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-[#141218]"
                    style={{
                      background: `${color}30`,
                      color,
                      zIndex: participants.length - i,
                    }}
                    title={p.displayName}
                  >
                    {p.avatarEmoji || p.initials?.charAt(0) || '👤'}
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 border-2 border-[#141218]">
                    +{participants.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-white/40 ml-1">at this table</span>
            </motion.div>
          )}

          {/* Name + emoji picker */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Name input */}
            <div>
              <label className="text-xs text-white/50 mb-2 block font-medium">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="What should we call you?"
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/25"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
              {nameError && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Emoji picker */}
            <div>
              <label className="text-xs text-white/50 mb-2 block font-medium">
                Your Avatar
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                    style={{
                      background: selectedEmoji === emoji ? `${color}30` : 'rgba(255,255,255,0.05)',
                      border: selectedEmoji === emoji ? `2px solid ${color}` : '2px solid transparent',
                      transform: selectedEmoji === emoji ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {phaseError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{phaseError}</p>
              </div>
            )}

            {/* Join CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={isLoadingJoin || !displayName.trim()}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all mt-2"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
              }}
            >
              {isLoadingJoin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isExistingSession ? 'Joining table…' : 'Starting session…'}
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  {isExistingSession ? 'Join Table' : 'Start Ordering'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
