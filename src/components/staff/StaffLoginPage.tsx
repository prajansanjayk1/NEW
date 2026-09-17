import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Lock, Mail, KeyRound, ArrowRight, Shield, AlertCircle, CheckCircle2, ChevronRight, Utensils } from 'lucide-react';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { UserRole } from '../../types';
import { staffAuthService, DEFAULT_STAFF_MEMBERS } from '../../services/staffAuthService';

interface StaffLoginPageProps {
  onExitToCustomer?: () => void;
  onSuccess?: () => void;
}

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ onExitToCustomer, onSuccess }) => {
  const { loginWithEmail, loginWithPin, isLoading } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both staff email and password.');
      return;
    }

    const res = await loginWithEmail(email, password);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Invalid credentials.');
    }
  };

  const handleQuickRoleLogin = async (role: UserRole, pin: string) => {
    setErrorMessage(null);
    const res = await loginWithPin(role, pin);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Failed to sign in.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsSubmittingReset(true);
    setResetFeedback(null);
    try {
      const res = await staffAuthService.requestPasswordReset(forgotEmail);
      setResetFeedback(res.message);
    } catch {
      setResetFeedback('Failed to request password reset. Please contact admin.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0a0b] text-[#f4efe6] flex flex-col justify-center items-center p-4 selection:bg-[#ff5708] selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient fire glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ff5708]/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#df8600]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#161415] border border-white/10 rounded-2xl p-6 sm:p-8 relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.8)]"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#b83200] shadow-[0_0_28px_rgba(255,87,8,0.4)] mb-4">
            <Flame className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="font-['Syne',sans-serif] text-2xl font-black uppercase tracking-wider text-white">
            KINGS OF WINGS
          </h1>
          <div className="inline-flex items-center gap-2 mt-1.5 px-3 py-0.5 rounded-full bg-white/[0.05] border border-white/10">
            <Shield className="w-3.5 h-3.5 text-[#ff5708]" />
            <span className="text-[11px] font-bold tracking-widest text-[#e5b399] uppercase font-['Syne',sans-serif]">
              Staff Operations Portal
            </span>
          </div>
        </div>

        {/* Error / Success Feedback */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Email/Password Sign-In Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a89d97] mb-1.5 font-['Syne',sans-serif]">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya@kingsofwings.menu"
                className="w-full bg-[#201d1e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708] focus:ring-1 focus:ring-[#ff5708] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a89d97] font-['Syne',sans-serif]">
                Password / PIN
              </label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs text-[#ff9359] hover:text-[#ffb86d] underline transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#201d1e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708] focus:ring-1 focus:ring-[#ff5708] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#ff7a29] text-white font-['Syne',sans-serif] font-black uppercase text-xs tracking-wider shadow-[0_4px_20px_rgba(255,87,8,0.3)] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>AUTHENTICATING...</span>
            ) : (
              <>
                <span>SIGN IN TO OPERATIONS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Role Access for Kitchen Terminals & Rapid Testing */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b8079] font-['Syne',sans-serif]">
              Terminal Quick Access
            </span>
            <span className="text-[10px] text-[#6b625d]">One-tap demo role</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_STAFF_MEMBERS.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setEmail(member.email || '');
                  setPassword(
                    member.role === 'KITCHEN' ? '1111' :
                    member.role === 'STAFF' ? '2222' :
                    member.role === 'MANAGER' ? '3333' : '4444'
                  );
                  handleQuickRoleLogin(
                    member.role,
                    member.role === 'KITCHEN' ? '1111' :
                    member.role === 'STAFF' ? '2222' :
                    member.role === 'MANAGER' ? '3333' : '4444'
                  );
                }}
                className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/[0.08] hover:border-[#ff5708]/40 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                    member.role === 'KITCHEN' ? 'bg-[#ff5708]/20 text-[#ff7a29]' :
                    member.role === 'STAFF' ? 'bg-sky-500/20 text-sky-400' :
                    member.role === 'MANAGER' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {member.role}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5e5550] group-hover:text-white transition-colors" />
                </div>
                <div className="text-xs font-semibold text-white/90 truncate">
                  {member.displayName.split(' ')[0]}
                </div>
                <div className="text-[10px] text-[#7c726c] font-mono mt-0.5">
                  PIN: {member.role === 'KITCHEN' ? '1111' : member.role === 'STAFF' ? '2222' : member.role === 'MANAGER' ? '3333' : '4444'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Return to Customer App */}
        {onExitToCustomer && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onExitToCustomer}
              className="inline-flex items-center gap-2 text-xs text-[#a0958f] hover:text-white transition-colors cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-[#ff5708]" />
              <span>Return to Customer Dining Experience</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1a1718] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            >
              <h3 className="font-['Syne',sans-serif] text-base font-bold uppercase text-white mb-2">
                Staff Password Reset
              </h3>
              <p className="text-xs text-[#a39791] mb-4">
                Enter your staff email address to receive password recovery instructions via Supabase Auth.
              </p>

              {resetFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  {resetFeedback}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@kingsofwings.menu"
                  className="w-full bg-[#242022] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setResetFeedback(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#b5a9a3] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-xs font-bold text-white transition-colors"
                  >
                    {isSubmittingReset ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
