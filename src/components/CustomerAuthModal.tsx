import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  Flame,
  KeyRound
} from 'lucide-react';
import { getSupabaseClient } from '../services/supabaseClient';
import { SessionParticipant } from '../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParticipant?: SessionParticipant | null;
  onParticipantUpdated?: (participant: SessionParticipant) => void;
}

type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'GUEST_PROFILE';

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentParticipant,
  onParticipantUpdated,
}) => {
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(currentParticipant?.displayName || '');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check Supabase session on open
  useEffect(() => {
    if (!isOpen) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser(data.user);
          setDisplayName(data.user.user_metadata?.display_name || currentParticipant?.displayName || 'Diner');
          setEmail(data.user.email || '');
          setMode('GUEST_PROFILE');
        }
      });
    } else {
      const saved = localStorage.getItem('kow_customer_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
          setDisplayName(parsed.displayName || currentParticipant?.displayName || 'Diner');
          setMode('GUEST_PROFILE');
        } catch {}
      }
    }
  }, [isOpen, currentParticipant]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          setCurrentUser(data.user);
          const name = data.user.user_metadata?.display_name || email.split('@')[0];
          setDisplayName(name);
          setSuccessMessage(`Welcome back, ${name}! Signed in via Supabase Auth.`);

          if (onParticipantUpdated && currentParticipant) {
            onParticipantUpdated({
              ...currentParticipant,
              displayName: name,
            });
          }

          setMode('GUEST_PROFILE');
          return;
        }
      } catch (err: any) {
        console.warn('Supabase auth sign in error, fallback:', err);
        setErrorMessage(err.message || 'Failed to sign in with Supabase.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Offline / Demo fallback
      const demoUser = {
        id: `usr_${Date.now()}`,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim() || email.split('@')[0],
      };
      localStorage.setItem('kow_customer_user', JSON.stringify(demoUser));
      setCurrentUser(demoUser);
      setSuccessMessage('Signed in successfully!');
      setMode('GUEST_PROFILE');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || 'Foodie',
              phone: phone.trim(),
              role: 'CUSTOMER',
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          setCurrentUser(data.user);
          setSuccessMessage('Account created with Supabase Auth! You are now logged in.');
          
          if (onParticipantUpdated && currentParticipant) {
            onParticipantUpdated({
              ...currentParticipant,
              displayName: displayName.trim() || 'Foodie',
            });
          }

          setMode('GUEST_PROFILE');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to create Supabase account.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const demoUser = {
        id: `usr_${Date.now()}`,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim() || 'Foodie',
        phone,
      };
      localStorage.setItem('kow_customer_user', JSON.stringify(demoUser));
      setCurrentUser(demoUser);
      setSuccessMessage('Account created successfully!');
      setMode('GUEST_PROFILE');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem('kow_customer_user');
    setCurrentUser(null);
    setSuccessMessage('Signed out successfully.');
    setMode('SIGN_IN');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[#181617] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,87,8,0.4)]">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-['Syne',sans-serif] text-base font-black uppercase text-white tracking-wider">
                {mode === 'GUEST_PROFILE' ? 'Diner Profile' : 'Customer Sign In'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                  Supabase Auth Active
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs (when not already signed in) */}
        {!currentUser && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#221f20] rounded-xl border border-white/10 mb-5 text-xs font-bold font-['Syne',sans-serif]">
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_IN');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg uppercase tracking-wider transition-all ${
                mode === 'SIGN_IN' ? 'bg-[#ff5708] text-white shadow-sm' : 'text-[#8f837e] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_UP');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg uppercase tracking-wider transition-all ${
                mode === 'SIGN_UP' ? 'bg-[#ff5708] text-white shadow-sm' : 'text-[#8f837e] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SIGN IN FORM */}
        {mode === 'SIGN_IN' && !currentUser && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="foodie@example.com"
                  className="w-full bg-[#221f20] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#221f20] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#ff7a29] text-white font-['Syne',sans-serif] font-black uppercase text-xs tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'SIGNING IN...' : 'SIGN IN WITH SUPABASE'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'SIGN_UP' && !currentUser && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jake Davis"
                  className="w-full bg-[#221f20] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jake@example.com"
                  className="w-full bg-[#221f20] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#221f20] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
                Phone Number (Optional for order SMS)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#221f20] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#ff7a29] text-white font-['Syne',sans-serif] font-black uppercase text-xs tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'REGISTERING...' : 'CREATE SUPABASE ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* LOGGED IN PROFILE VIEW */}
        {currentUser && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#221f20] border border-white/10 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center text-lg font-black text-white shadow-md">
                {displayName.charAt(0).toUpperCase() || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{displayName}</h4>
                <p className="text-xs text-[#8f827d] truncate">{currentUser.email || email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Supabase Verified
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ff5708]/10 text-[#ff7a29] border border-[#ff5708]/20 font-mono">
                    250 Ember Points
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-[#8f827d]">
                <span>Member Since</span>
                <span className="text-white font-mono">Today</span>
              </div>
              <div className="flex justify-between text-[#8f827d]">
                <span>Favorite Heat Level</span>
                <span className="text-[#ff7a29] font-bold">HOT (3 Flames)</span>
              </div>
              <div className="flex justify-between text-[#8f827d]">
                <span>Payment Preference</span>
                <span className="text-white">UPI / Razorpay Test</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};