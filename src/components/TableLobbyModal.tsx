import React, { useState } from 'react';
import { 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  AlertCircle,
  RotateCcw,
  Sparkles,
  Mail,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TableSession, SessionStatus } from '../types';
import { getSupabaseClient } from '../services/supabaseClient';

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
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isExpired = session.status === 'EXPIRED';
  const isClosed = session.status === 'CLOSED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (showEmailAuth && customerEmail.trim()) {
      setIsAuthLoading(true);
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.auth.signInWithOtp({
            email: customerEmail.trim().toLowerCase(),
            options: {
              data: {
                display_name: name.trim(),
                role: 'CUSTOMER',
              },
            },
          });
        } catch (err) {
          console.warn('[TableLobby] Supabase customer signin attempt:', err);
        }
      }
      setIsAuthLoading(false);
    }

    onJoin(name.trim(), selectedEmoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
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
            <span className="text-[11px] text-[#ac897e] font-mono">
              NFC Token: {session.sessionToken}
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
            <p className="text-xs text-[#e5beb2]">
              Please scan the table QR code again or tap the table NFC puck.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onResetSession}
              className="w-full py-2.5 rounded-xl bg-[#ff5708] text-white font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Simulate Fresh QR / NFC Scan</span>
            </motion.button>
          </div>
        ) : isClosed ? (
          <div className="p-4 rounded-2xl bg-[#2a2a2b] border border-white/10 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-[#ffb86d] mx-auto" />
            <h4 className="font-syne text-sm font-bold uppercase text-white">
              This Table Has Been Closed
            </h4>
            <p className="text-xs text-[#ac897e]">
              Table {session.tableNumber} bill was cleared and the session was closed by the floor captain.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onResetSession}
              className="w-full py-2.5 rounded-xl bg-[#ff5708] text-white font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Table {session.tableNumber} Session</span>
            </motion.button>
          </div>
        ) : (
          /* Frictionless Join Form with Supabase Auth Option */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-[#e5beb2] block">
                {session.participants.length > 0 ? (
                  <>
                    <span className="text-[#ffdcbd] font-bold">
                      {session.participants.length} diners
                    </span>{' '}
                    are currently connected to Table {session.tableNumber}.
                  </>
                ) : (
                  `You are the first diner at Table ${session.tableNumber}.`
                )}
              </span>
              <p className="text-[11px] text-[#ac897e]">
                Instant guest access or connect with Supabase Auth for reward points.
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

            {/* Optional Customer Supabase Sign-in */}
            <div>
              <button
                type="button"
                onClick={() => setShowEmailAuth(!showEmailAuth)}
                className="text-[11px] text-[#ff7a29] hover:text-[#ff9359] flex items-center gap-1 font-bold font-['Syne',sans-serif]"
              >
                <span>{showEmailAuth ? '▾ Use Guest Mode (Skip Email)' : '▸ Optional: Save Loyalty with Email (Supabase Auth)'}</span>
              </button>

              {showEmailAuth && (
                <div className="mt-2 space-y-1">
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full h-10 px-3 rounded-xl bg-[#201f20] border border-white/[0.08] text-xs text-white placeholder:text-[#6c615c] focus:outline-none focus:border-[#ff5708]"
                  />
                  <span className="text-[10px] text-[#7d716c] block">
                    Secured by Supabase Auth with magic-link verification.
                  </span>
                </div>
              )}
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
              disabled={isAuthLoading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-white font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff5708]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{isAuthLoading ? 'Connecting...' : `Join Table ${session.tableNumber} Feast`}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};