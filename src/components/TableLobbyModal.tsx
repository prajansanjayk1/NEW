import React, { useState } from 'react';
import { 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TableSession, SessionStatus } from '../types';

interface TableLobbyModalProps {
  isOpen: boolean;
  session: TableSession;
  onJoin: (displayName: string, avatarEmoji: string) => void;
  onResetSession: () => void;
  sessionError?: string | null;
}

const AVATAR_OPTIONS = [
  { emoji: '👑', label: 'Pit Boss' },
  { emoji: '🔥', label: 'Fire Eater' },
  { emoji: '🍗', label: 'Wing Devourer' },
  { emoji: '🌶️', label: 'Reaper Chaser' },
  { emoji: '⚡', label: 'Flash Sizzler' },
  { emoji: '🍺', label: 'Cold Draft' },
];

export const TableLobbyModal: React.FC<TableLobbyModalProps> = ({
  isOpen,
  session,
  onJoin,
  onResetSession,
  sessionError,
}) => {
  const [name, setName] = useState('Jake Davis');
  const [selectedEmoji, setSelectedEmoji] = useState('👑');

  if (!isOpen) return null;

  const isExpired = session.status === 'EXPIRED';
  const isClosed = session.status === 'CLOSED';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(name.trim(), selectedEmoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-[#1c1b1c] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Banner */}
        <div className="text-center space-y-1 pb-3 border-b border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center text-[#511500] mx-auto shadow-lg shadow-[#ff5708]/30 mb-2">
            <Flame className="w-7 h-7 fill-current" />
          </div>
          <span className="font-syne text-[10px] font-extrabold text-[#ffb86d] uppercase tracking-widest">
            KINGS OF WINGS · FLAGSHIP
          </span>
          <h2 className="font-syne text-2xl font-black uppercase text-white tracking-tight">
            TABLE {session.tableNumber}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#201f20] border border-white/[0.08]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ffb86d]" />
            <span className="font-sans text-[11px] text-[#ac897e]">
              Encrypted NFC Session {session.sessionToken}
            </span>
          </div>
        </div>

        {/* State Notice for Expired or Closed Sessions */}
        {isExpired ? (
          <div className="p-4 rounded-2xl bg-[#ff5449]/15 border border-[#ff5449]/30 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-[#ff5449] mx-auto" />
            <h4 className="font-syne text-sm font-bold uppercase text-white">
              This Table Session Has Ended
            </h4>
            <p className="font-sans text-xs text-[#e5beb2]">
              Please scan the table QR code again or re-open the verified table session.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onResetSession}
              className="w-full py-2.5 rounded-xl bg-[#ff5708] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Simulate Fresh QR Scan</span>
            </motion.button>
          </div>
        ) : isClosed ? (
          <div className="p-4 rounded-2xl bg-[#2a2a2b] border border-white/10 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-[#ffb86d] mx-auto" />
            <h4 className="font-syne text-sm font-bold uppercase text-white">
              This Table Has Been Closed
            </h4>
            <p className="font-sans text-xs text-[#ac897e]">
              Table 18 bill was cleared and the session was closed by the floor captain.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onResetSession}
              className="w-full py-2.5 rounded-xl bg-[#ff5708] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Table 18 Session</span>
            </motion.button>
          </div>
        ) : (
          /* Frictionless Join Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="font-sans text-xs text-[#e5beb2] block">
                {session.participants.length > 0 ? (
                  <>
                    <span className="text-[#ffdcbd] font-bold">
                      {session.participants.length} diners
                    </span>{' '}
                    are currently connected to Table {session.tableNumber}.
                  </>
                ) : (
                  'You are the first diner at Table 18.'
                )}
              </span>
              <p className="font-sans text-[11px] text-[#ac897e]">
                No account or password needed. Everyone at the table can add items to the shared order.
              </p>
            </div>

            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider block">
                Your Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (e.g. Jake)"
                className="w-full h-11 px-3.5 rounded-xl bg-[#201f20] border border-white/[0.08] text-sm text-white placeholder:text-[#ac897e] focus:outline-none focus:border-[#ff5708]"
                required
                maxLength={24}
              />
            </div>

            {/* Avatar Emoji Selector */}
            <div className="space-y-1.5">
              <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider block">
                Pick Your Table Vibe
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(opt.emoji)}
                    title={opt.label}
                    className={`h-11 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      selectedEmoji === opt.emoji
                        ? 'bg-[#ff5708]/30 border-2 border-[#ff5708] scale-105'
                        : 'bg-[#201f20] border border-white/[0.06] hover:bg-[#2a2a2b]'
                    }`}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit CTA */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff5708]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Join Table {session.tableNumber} Feast</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
