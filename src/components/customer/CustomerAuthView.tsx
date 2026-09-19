/**
 * CustomerAuthView
 *
 * Shown after entry token is resolved, when customer is not authenticated.
 * Methods: Google OAuth | Phone OTP
 *
 * Uses Supabase Auth. In DEMO_MODE, provides a one-click guest bypass.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, ChevronRight, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';
import { ResolvedRestaurant, ResolvedTable } from '../../services/entryService';

interface CustomerAuthViewProps {
  restaurant: ResolvedRestaurant;
  table: ResolvedTable;
  onAuthenticated: () => void;
  onBack?: () => void;
}

type AuthMethod = 'CHOOSE' | 'PHONE_ENTER' | 'PHONE_OTP' | 'LOADING' | 'ERROR';

const brandColor = (r: ResolvedRestaurant) => r.branding?.primaryColor || '#ff5708';

export function CustomerAuthView({
  restaurant,
  table,
  onAuthenticated,
  onBack,
}: CustomerAuthViewProps) {
  const [method, setMethod] = useState<AuthMethod>('CHOOSE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const supabase = getSupabaseClient();
  const isDemoMode = !supabase;
  const color = brandColor(restaurant);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      // DEMO_MODE: bypass auth
      onAuthenticated();
      return;
    }
    setMethod('LOADING');
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      if (authError) throw authError;
      // Page will redirect to Google — loading state is correct
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try another method.');
      setMethod('CHOOSE');
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }
    setIsSendingOtp(true);
    setError(null);

    if (!supabase) {
      // DEMO_MODE: simulate OTP sent
      setIsSendingOtp(false);
      setMethod('PHONE_OTP');
      return;
    }

    try {
      // Normalize phone: ensure +91 or international format
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });
      if (otpError) throw otpError;
      setMethod('PHONE_OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your number and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 4) {
      setError('Please enter the OTP you received.');
      return;
    }
    setMethod('LOADING');
    setError(null);

    if (!supabase) {
      // DEMO_MODE: any OTP works
      onAuthenticated();
      return;
    }

    try {
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otp,
        type: 'sms',
      });
      if (verifyError) throw verifyError;
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please check the code and try again.');
      setMethod('PHONE_OTP');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0b 0%, #141218 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 35% at 50% 20%, ${color}14 0%, transparent 70%)`,
        }}
      />

      <div className="w-full max-w-sm relative z-10">

        {/* Back button */}
        {onBack && method === 'CHOOSE' && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">

          {/* CHOOSE METHOD */}
          {method === 'CHOOSE' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                    border: `1px solid ${color}35`,
                  }}
                >
                  Table {table.tableNumber} · {restaurant.name}
                </div>
                <h1 className="text-3xl font-black text-white font-['Syne',sans-serif] mb-2">
                  Welcome
                </h1>
                <p className="text-sm text-white/50">
                  Sign in to join your table and start ordering
                </p>
              </div>

              {/* Auth methods */}
              <div className="space-y-3">

                {/* Google */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-50 transition-colors active:opacity-90 shadow-sm"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/30">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Phone */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMethod('PHONE_ENTER'); setError(null); }}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/8 border border-white/12 text-white font-semibold text-sm hover:bg-white/12 transition-colors active:opacity-80"
                >
                  <Phone className="w-5 h-5 text-white/60 flex-shrink-0" />
                  Continue with Phone
                  <ChevronRight className="w-4 h-4 ml-auto text-white/40" />
                </motion.button>
              </div>

              {isDemoMode && (
                <div className="mt-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400 text-center">
                    Demo Mode — any method works without real credentials
                  </p>
                </div>
              )}

              <p className="text-center text-xs text-white/25 mt-6">
                By continuing, you agree to our Terms of Service
              </p>
            </motion.div>
          )}

          {/* PHONE ENTER */}
          {method === 'PHONE_ENTER' && (
            <motion.div
              key="phone-enter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => { setMethod('CHOOSE'); setError(null); }}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-white/60" />
                </div>
                <h2 className="text-2xl font-black text-white font-['Syne',sans-serif] mb-2">
                  Enter your number
                </h2>
                <p className="text-sm text-white/50">
                  We'll send you a verification code
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-2 block font-medium">
                    Phone Number
                  </label>
                  <div className="flex items-center rounded-xl overflow-hidden border border-white/15 focus-within:border-white/30 transition-colors bg-white/5">
                    <span className="px-3 py-3.5 text-sm text-white/50 bg-white/5 border-r border-white/10 flex-shrink-0">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="flex-1 px-3 py-3.5 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || phone.length < 10}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* PHONE OTP VERIFY */}
          {method === 'PHONE_OTP' && (
            <motion.div
              key="phone-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => { setMethod('PHONE_ENTER'); setError(null); }}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change number
              </button>

              <div className="text-center mb-8">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${color}20`, border: `1px solid ${color}35` }}
                >
                  <Mail className="w-6 h-6" style={{ color }} />
                </div>
                <h2 className="text-2xl font-black text-white font-['Syne',sans-serif] mb-2">
                  Enter OTP
                </h2>
                <p className="text-sm text-white/50">
                  Sent to +91 {phone}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-4 text-center text-2xl font-bold tracking-widest bg-white/5 border border-white/15 rounded-xl text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 4}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
                >
                  <Check className="w-4 h-4" />
                  Verify & Join Table
                </motion.button>

                <button
                  onClick={handleSendOtp}
                  className="w-full text-xs text-white/40 hover:text-white/60 transition-colors py-2"
                >
                  Didn't receive it? Resend OTP
                </button>
              </div>
            </motion.div>
          )}

          {/* LOADING */}
          {method === 'LOADING' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Loader2
                className="w-10 h-10 animate-spin mx-auto mb-4"
                style={{ color }}
              />
              <p className="text-white/60 text-sm">Signing you in…</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
