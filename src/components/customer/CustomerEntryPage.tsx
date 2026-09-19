/**
 * CustomerEntryPage — /e/:token
 *
 * The universal customer entry experience.
 * This is what a QR code or NFC tap opens.
 *
 * Sequence:
 *   1. Extract token from URL path /e/<token>
 *   2. Call entryService.resolveEntryToken(token)
 *   3. Show loading → restaurant/table info → Continue
 *   4. On error → friendly error screen
 *   5. On success → store context → advance to CustomerAuthView
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, QrCode, AlertCircle, Wifi, MapPin, Users, ChevronRight, RefreshCw } from 'lucide-react';
import {
  resolveEntryToken,
  storeEntryContext,
  EntryResolution,
  EntryResolutionSuccess,
  EntryErrorCode,
} from '../../services/entryService';

interface CustomerEntryPageProps {
  token: string;
  onResolved: (resolution: EntryResolutionSuccess) => void;
}

type EntryState = 'LOADING' | 'VALID' | 'ERROR';

const ERROR_MESSAGES: Record<EntryErrorCode, { title: string; body: string }> = {
  INVALID_TOKEN: {
    title: 'Table link unavailable',
    body: 'This QR code does not match any table. Please scan the table QR code again or ask staff for assistance.',
  },
  EXPIRED: {
    title: 'QR code has expired',
    body: 'This table link is no longer active. Please ask your server to refresh the table QR code.',
  },
  REVOKED: {
    title: 'Table link deactivated',
    body: 'This QR code has been deactivated by the restaurant. Please ask staff for the new table QR code.',
  },
  DISABLED: {
    title: 'Table not available',
    body: 'This table is currently not accepting orders. Please ask staff for assistance.',
  },
  NETWORK_ERROR: {
    title: 'Connection error',
    body: 'Unable to verify this table link. Please check your internet connection and try again.',
  },
  SERVER_ERROR: {
    title: 'Something went wrong',
    body: 'We could not verify this table link. Please try again or ask staff for assistance.',
  },
};

export function CustomerEntryPage({ token, onResolved }: CustomerEntryPageProps) {
  const [state, setState] = useState<EntryState>('LOADING');
  const [resolution, setResolution] = useState<EntryResolution | null>(null);

  const resolve = async () => {
    setState('LOADING');
    const result = await resolveEntryToken(token);
    setResolution(result);
    setState(result.isValid ? 'VALID' : 'ERROR');
  };

  useEffect(() => {
    resolve();
  }, [token]);

  const handleContinue = () => {
    if (!resolution?.isValid) return;
    storeEntryContext(resolution as EntryResolutionSuccess);
    onResolved(resolution as EntryResolutionSuccess);
  };

  const validData = resolution?.isValid ? (resolution as EntryResolutionSuccess) : null;
  const errorData = !resolution?.isValid && resolution
    ? ERROR_MESSAGES[(resolution as any).errorCode as EntryErrorCode] || ERROR_MESSAGES.SERVER_ERROR
    : null;

  const brandColor = validData?.restaurant?.branding?.primaryColor || '#ff5708';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0b 0%, #141218 50%, #1a1016 100%)',
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${brandColor}18 0%, transparent 70%)`,
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 60px)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <AnimatePresence mode="wait">

          {/* LOADING STATE */}
          {state === 'LOADING' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Animated QR icon */}
              <div className="mx-auto w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative">
                <QrCode className="w-9 h-9 text-white/40" />
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-transparent animate-spin"
                  style={{
                    borderTopColor: brandColor,
                    animationDuration: '1.2s',
                  }}
                />
              </div>
              <h2 className="text-xl font-bold text-white/90 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                Checking your table…
              </h2>
              <p className="text-sm text-white/40">Verifying table link securely</p>

              {/* Skeleton rows */}
              <div className="mt-8 space-y-3">
                {[80, 60, 72].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full bg-white/5 animate-pulse mx-auto"
                    style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* VALID STATE */}
          {state === 'VALID' && validData && (
            <motion.div
              key="valid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center text-center"
            >
              {/* Restaurant logo / placeholder */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="w-24 h-24 rounded-2xl mb-6 flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                {validData.restaurant.logoUrl ? (
                  <img
                    src={validData.restaurant.logoUrl}
                    alt={validData.restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-4xl">🍽️</span>
                )}
              </motion.div>

              {/* Verified indicator */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{
                  backgroundColor: `${brandColor}25`,
                  color: brandColor,
                  border: `1px solid ${brandColor}40`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: brandColor }}
                />
                Table detected
              </motion.div>

              {/* Restaurant name */}
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-3xl font-black text-white tracking-tight mb-1 font-['Syne',sans-serif]"
              >
                {validData.restaurant.name}
              </motion.h1>

              {/* Table number — prominent */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 mb-6"
              >
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor}30 0%, ${brandColor}15 100%)`,
                    border: `1.5px solid ${brandColor}50`,
                  }}
                >
                  <span className="text-2xl font-black text-white font-['Syne',sans-serif]">
                    TABLE {validData.table.tableNumber}
                  </span>
                </div>
                {validData.table.zone && (
                  <p className="text-xs text-white/40 mt-2">{validData.table.zone}</p>
                )}
              </motion.div>

              {/* Info pills */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-2 mb-8 flex-wrap justify-center"
              >
                {validData.table.capacity && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <Users className="w-3 h-3 text-white/50" />
                    <span className="text-xs text-white/60">Up to {validData.table.capacity} guests</span>
                  </div>
                )}
                {validData.restaurant.address && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <MapPin className="w-3 h-3 text-white/50" />
                    <span className="text-xs text-white/60 truncate max-w-[140px]">
                      {validData.restaurant.address.split(',')[0]}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-lg active:opacity-90 transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                }}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              {/* Secure indicator */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-xs text-white/25 flex items-center gap-1 justify-center"
              >
                <Wifi className="w-3 h-3" />
                Secure table link
              </motion.p>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {state === 'ERROR' && errorData && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-9 h-9 text-red-400" />
              </div>

              <h2 className="text-2xl font-black text-white mb-3 font-['Syne',sans-serif]">
                {errorData.title}
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-8 px-2">
                {errorData.body}
              </p>

              <button
                onClick={resolve}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-white/10 border border-white/15 flex items-center justify-center gap-2 hover:bg-white/15 transition-colors active:opacity-80"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <p className="mt-6 text-xs text-white/25">
                Ask restaurant staff for assistance if the issue persists.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
