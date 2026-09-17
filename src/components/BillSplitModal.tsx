import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Banknote, 
  CheckCircle2, 
  Receipt, 
  Users, 
  Flame, 
  Download, 
  Check,
  Split,
  AlertCircle,
  Printer,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, CrewMember, SessionParticipant, BillSplitMode, Bill, PaymentRecord } from '../types';
import { INITIAL_TABLE_INFO } from '../data/mockData';
import { billingService } from '../services/billingService';
import { paymentService } from '../services/paymentService';
import { paymentManager } from '../services/payment/paymentManager';
import { formatCurrencyMajor, formatCurrencyMinor, majorToMinor, minorToMajor } from '../utils/currency';
import { DigitalReceiptModal } from './DigitalReceiptModal';

interface BillSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  crew?: CrewMember[];
  participants?: SessionParticipant[];
  currentParticipant?: SessionParticipant | null;
}

export const BillSplitModal: React.FC<BillSplitModalProps> = ({
  isOpen,
  onClose,
  order,
  crew = [],
  participants = [],
  currentParticipant,
}) => {
  const [splitMode, setSplitMode] = useState<BillSplitMode>('ITEM_SPLIT');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [receiptSaved, setReceiptSaved] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastPaymentRecord, setLastPaymentRecord] = useState<PaymentRecord | null>(null);

  // Custom split state (custom partial amount in INR)
  const [customAmountMajor, setCustomAmountMajor] = useState<string>('');

  // Map crew or participants into active session participants
  const sessionParticipants: SessionParticipant[] = useMemo(() => {
    if (participants.length > 0) return participants;
    return (crew || []).map((c) => ({
      id: c.id,
      sessionId: `sess-t${order?.tableNumber || '18'}-active`,
      displayName: c?.name || (c as any)?.displayName || 'Guest',
      avatarEmoji: c?.avatarEmoji || '🍗',
      initials: c?.initials || 'G',
      color: c?.color || 'bg-amber-600',
      role: c?.isHost ? ('HOST' as const) : ('GUEST' as const),
      joinedAt: '8:15 PM',
      isActive: true,
      itemCount: c?.itemCount || 0,
    }));
  }, [participants, crew, order?.tableNumber]);

  // Generate authoritative Bill representation with deterministic minor units
  const [currentBill, setCurrentBill] = useState<Bill>(() => {
    return billingService.generateBill({
      orders: order ? [order] : [],
      participants: sessionParticipants,
      splitMode: 'ITEM_SPLIT',
      tableNumber: order?.tableNumber || '18',
      sessionId: `sess-t${order?.tableNumber || '18'}-active`,
    });
  });

  // Re-generate bill whenever splitMode or order changes
  useEffect(() => {
    if (!order) return;
    const updated = billingService.generateBill({
      orders: [order],
      participants: sessionParticipants,
      splitMode,
      tableNumber: order.tableNumber || '18',
      sessionId: `sess-t${order.tableNumber || '18'}-active`,
    });

    // Retain previous payments if any
    const existingPayments = paymentService.getPaymentsForBill(updated.id);
    const totalPaid_minor = existingPayments.reduce((sum, p) => sum + (p.status === 'SUCCESS' ? p.amount_minor : 0), 0);
    const total_minor = updated.total_minor || Math.round(updated.total * 100);
    const due_minor = Math.max(0, total_minor - totalPaid_minor);

    updated.amount_paid_minor = totalPaid_minor;
    updated.amount_due_minor = due_minor;
    updated.amountPaid = minorToMajor(totalPaid_minor);
    updated.amountDue = minorToMajor(due_minor);
    if (due_minor === 0 && totalPaid_minor > 0) {
      updated.paymentStatus = 'PAID';
    } else if (totalPaid_minor > 0) {
      updated.paymentStatus = 'PARTIALLY_PAID';
    }

    setCurrentBill(updated);
  }, [splitMode, order, sessionParticipants]);

  if (!isOpen) return null;

  // Identify current participant's share
  const currentShare = currentBill.shares.find(
    (s) => s.participantId === currentParticipant?.id || s.participantName.includes('Jake')
  ) || currentBill.shares[0];

  // Calculate payable amount in minor units (paise)
  const calculatePayableMinor = (): number => {
    const remainingDue_minor = currentBill.amount_due_minor !== undefined 
      ? currentBill.amount_due_minor 
      : (currentBill.total_minor || Math.round(currentBill.total * 100));

    if (splitMode === 'FULL_BILL') {
      return remainingDue_minor;
    }

    if (splitMode === 'CUSTOM_SPLIT') {
      const parsedMajor = parseFloat(customAmountMajor);
      if (!isNaN(parsedMajor) && parsedMajor > 0) {
        return Math.min(remainingDue_minor, majorToMinor(parsedMajor));
      }
      return Math.min(remainingDue_minor, currentShare?.totalShare_minor || remainingDue_minor);
    }

    const shareAmount_minor = currentShare?.totalShare_minor || Math.round((currentShare?.totalShare || 0) * 100);
    return Math.min(remainingDue_minor, shareAmount_minor);
  };

  const payableAmountMinor = calculatePayableMinor();
  const isDemo = paymentManager.isDemoMode();

  const handlePay = async () => {
    if (payableAmountMinor <= 0) {
      setPaymentError('Payable amount must be greater than zero.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const hasRazorpayModal = typeof window !== 'undefined' && Boolean((window as any).Razorpay);
    const participantId = currentParticipant?.id || currentShare?.participantId || 'guest';
    const participantName = currentParticipant?.displayName || currentShare?.participantName || 'Guest';

    // If customer selected UPI or Card and Razorpay Checkout SDK is ready
    if ((paymentMethod === 'UPI' || paymentMethod === 'CARD') && hasRazorpayModal) {
      try {
        // STEP 1: BACKEND - Call /api/create-order
        const orderRes = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: payableAmountMinor,
            amount_minor: payableAmountMinor,
            currency: 'INR',
            receipt: `${order.ticketNumber || currentBill.id}`.substring(0, 40),
            billId: currentBill.id,
            tableNumber: order.tableNumber,
            restaurantId: 'rest-kow-blr-01',
            participantId,
            participantName,
            paymentMethod,
          }),
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to initialize payment gateway order');
        }

        const orderData = await orderRes.json();
        const razorpayKey = orderData.key_id || orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_PAYMENT_KEY_ID || 'rzp_test_SANDBOX_DEMO';

        // STEP 2: FRONTEND - Open Razorpay modal with order_id
        const options = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Kings of Wings',
          description: `Table ${order.tableNumber} · Bill ${currentBill.ticketNumber}`,
          image: '/icon.png',
          order_id: orderData.order_id || orderData.orderId,
          prefill: {
            name: participantName,
            email: 'guest@kingsofwings.com',
            contact: '9876543210',
          },
          notes: {
            tableNumber: String(order.tableNumber),
            billId: currentBill.id,
            method: paymentMethod,
          },
          theme: {
            color: '#ff5708',
          },
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            try {
              // STEP 3: BACKEND - Verify Payment Signature via /api/verify-payment
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  amount_minor: payableAmountMinor,
                  billId: currentBill.id,
                  restaurantId: 'rest-kow-blr-01',
                  participantId,
                  participantName,
                  paymentMethod,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.verified) {
                setPaymentError(verifyData.error || 'Payment signature verification failed.');
                setIsProcessing(false);
                return;
              }

              // Update billing system state
              const recordResult = await paymentService.recordVerifiedPayment({
                restaurantId: 'rest-kow-blr-01',
                bill: currentBill,
                participantId,
                participantName,
                amount_minor: payableAmountMinor,
                paymentMethod,
                providerOrderId: response.razorpay_order_id,
                providerPaymentId: response.razorpay_payment_id,
                providerSignature: response.razorpay_signature,
                transactionReference: verifyData.transactionReference,
                isDemo: Boolean(verifyData.isDemo),
              });

              if (recordResult.updatedBill) {
                setCurrentBill(recordResult.updatedBill);
              }
              if (recordResult.paymentRecord) {
                setLastPaymentRecord(recordResult.paymentRecord);
              }

              setIsProcessing(false);
              setIsPaid(true);
            } catch (vErr: any) {
              console.error('[Razorpay Verify Error]', vErr);
              setPaymentError(vErr.message || 'Payment verification failed');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          console.error('[Razorpay Payment Failed]', resp.error);
          setPaymentError(resp.error?.description || 'Payment was declined or failed.');
          setIsProcessing(false);
        });
        rzp.open();
        return;
      } catch (err: any) {
        console.error('Razorpay initialization failure:', err);
        setPaymentError(err.message || 'Could not open Razorpay checkout.');
        setIsProcessing(false);
        return;
      }
    }

    // Fallback: Cash payment or direct simulation
    try {
      const result = await paymentService.processPayment({
        restaurantId: 'rest-kow-blr-01',
        bill: currentBill,
        participantId,
        participantName,
        amount_minor: payableAmountMinor,
        paymentMethod,
      });

      if (!result.success) {
        setPaymentError(result.errorMessage || 'Payment could not be authorized. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (result.updatedBill) {
        setCurrentBill(result.updatedBill);
      }
      if (result.paymentRecord) {
        setLastPaymentRecord(result.paymentRecord);
      }

      setIsProcessing(false);
      setIsPaid(true);
    } catch (err: any) {
      console.error('Payment failure:', err);
      setPaymentError(err.message || 'Payment processing error');
      setIsProcessing(false);
    }
  };

  const handleSaveReceipt = () => {
    setReceiptSaved(true);
    setTimeout(() => setReceiptSaved(false), 2500);
  };

  return (
    <>
      <div 
        id="bill-split-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-[#1c1b1c] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#df8600]/20 flex items-center justify-center text-[#df8600]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-['Syne',sans-serif] text-base font-black uppercase text-[#e5e2e3]">
                    {isPaid ? 'Payment Confirmed' : `Table ${order.tableNumber} Bill`}
                  </h3>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    isDemo ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {isDemo ? 'DEMO' : 'LIVE'}
                  </span>
                </div>
                <span className="font-sans text-[11px] text-[#ac897e]">
                  Ticket {order.ticketNumber} · Flagship Lounge
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close bill modal"
              className="w-8 h-8 rounded-full bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] flex items-center justify-center text-[#e5e2e3] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Demo Sandbox Alert Ribbon */}
          {isDemo && !isPaid && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-[11px]">Demo Sandbox Mode: No real money will be debited.</span>
              </div>
            </div>
          )}

          {!isPaid ? (
            <>
              {/* Split Mode Selector (4 modes: Full, Equal, Item, Custom) */}
              <div className="space-y-1.5">
                <label className="font-['Syne',sans-serif] text-[10px] uppercase font-bold text-[#ac897e] tracking-wider">
                  Select Split Strategy
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'ITEM_SPLIT' as BillSplitMode, title: 'Item', subtitle: 'By Dish' },
                    { id: 'EQUAL_SPLIT' as BillSplitMode, title: 'Equal', subtitle: `÷ ${sessionParticipants.length}` },
                    { id: 'FULL_BILL' as BillSplitMode, title: 'Entire', subtitle: '1 Card' },
                    { id: 'CUSTOM_SPLIT' as BillSplitMode, title: 'Custom', subtitle: 'Partial' },
                  ].map((m) => {
                    const isActive = splitMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSplitMode(m.id)}
                        className={`p-2 rounded-2xl text-center border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#201f20] border-[#ff5708] shadow-md shadow-[#ff5708]/10'
                            : 'bg-[#201f20] border-white/[0.08] text-[#ac897e]'
                        }`}
                      >
                        <span className={`font-['Syne',sans-serif] text-[11px] font-bold block ${isActive ? 'text-white' : 'text-[#ac897e]'}`}>
                          {m.title}
                        </span>
                        <span className="font-sans text-[9px] text-[#ffb86d] block truncate">
                          {m.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Split input field if active */}
              {splitMode === 'CUSTOM_SPLIT' && (
                <div className="p-3 bg-[#201f20] border border-white/[0.08] rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#ac897e] font-['Syne',sans-serif] text-[10px] uppercase font-bold">
                      Enter Custom Amount (INR)
                    </span>
                    <span className="text-[#ffb86d] text-[10px] font-mono">
                      Max: {formatCurrencyMinor(currentBill.amount_due_minor || (currentBill.total_minor || 0))}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#ff5708] font-bold">₹</span>
                    <input
                      type="number"
                      placeholder={minorToMajor(payableAmountMinor).toString()}
                      value={customAmountMajor}
                      onChange={(e) => setCustomAmountMajor(e.target.value)}
                      min="1"
                      max={minorToMajor(currentBill.amount_due_minor || 0)}
                      className="w-full bg-[#131314] border border-white/10 rounded-xl py-2 pl-7 pr-3 text-sm text-white font-mono focus:border-[#ff5708] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Split Breakdown by Diners */}
              <div className="bg-[#201f20] border border-white/[0.08] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
                  <span className="font-['Syne',sans-serif] text-[10px] uppercase font-bold text-[#ac897e]">
                    Diner Breakdown
                  </span>
                  <span className="font-['Syne',sans-serif] text-[10px] uppercase font-bold text-[#ac897e]">
                    Amount
                  </span>
                </div>

                {currentBill.shares.map((share) => (
                  <div
                    key={share.participantId}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{share.avatarEmoji}</span>
                      <div className="min-w-0">
                        <span className="font-['Syne',sans-serif] font-bold text-white block truncate">
                          {share.participantName}
                        </span>
                        {splitMode === 'ITEM_SPLIT' && (
                          <span className="font-sans text-[10px] text-[#ac897e] block">
                            {share.itemCount} items ordered
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-['Syne',sans-serif] font-extrabold text-[#ffdcbd]">
                        {formatCurrencyMinor(share.totalShare_minor || Math.round(share.totalShare * 100))}
                      </span>
                      {share.isPaid ? (
                        <span className="font-sans text-[9px] text-emerald-400 block font-bold">PAID</span>
                      ) : (
                        <span className="font-sans text-[9px] text-[#ac897e] block">incl. 5% GST</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Totals & Partial Summary */}
                <div className="pt-2 border-t border-white/[0.08] space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[#ac897e]">
                    <span>Table 18 Bill Total</span>
                    <span className="font-mono text-white font-bold">{formatCurrencyMinor(currentBill.total_minor || 0)}</span>
                  </div>

                  {(currentBill.amount_paid_minor || 0) > 0 && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>Previously Paid</span>
                      <span className="font-mono font-bold">-{formatCurrencyMinor(currentBill.amount_paid_minor || 0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-['Syne',sans-serif] text-sm font-extrabold text-white pt-1 border-t border-white/[0.05]">
                    <span>Remaining Due</span>
                    <span className="text-[#ff5708]">
                      {formatCurrencyMinor(currentBill.amount_due_minor !== undefined ? currentBill.amount_due_minor : (currentBill.total_minor || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="font-['Syne',sans-serif] text-[10px] uppercase font-bold text-[#ac897e] tracking-wider">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI' as const, label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD' as const, label: 'Card Tap', icon: CreditCard },
                    { id: 'CASH' as const, label: 'Floor Cash', icon: Banknote },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isMethodActive = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isMethodActive
                            ? 'bg-[#ff5708] text-[#511500] font-black'
                            : 'bg-[#201f20] border border-white/[0.08] text-[#ac897e] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-['Syne',sans-serif] text-[10px] uppercase font-bold">
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI QR Display (if UPI chosen) */}
              {paymentMethod === 'UPI' && (
                <div className="p-3 bg-[#0e0e0f] border border-white/[0.08] rounded-2xl flex items-center justify-between shadow-inner">
                  <div className="space-y-0.5">
                    <div className="font-['Syne',sans-serif] text-xs font-bold text-white uppercase">
                      UPI Instant Pay
                    </div>
                    <div className="font-sans text-[11px] text-[#ac897e]">
                      GPay, PhonePe, Paytm, BHIM
                    </div>
                    <div className="font-mono text-[10px] text-[#7d716c]">
                      VPA: kow.table{order.tableNumber}@icici
                    </div>
                    <div className="font-['Syne',sans-serif] text-xs font-extrabold text-[#ffb86d] pt-1">
                      Paying: {formatCurrencyMinor(payableAmountMinor)}
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                </div>
              )}

              {/* Error feedback */}
              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Pay Button */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handlePay}
                disabled={isProcessing || payableAmountMinor <= 0}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] disabled:opacity-50 text-[#511500] font-['Syne',sans-serif] text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff5708]/30 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#511500]" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'CASH'
                        ? `Confirm Cash • ${formatCurrencyMinor(payableAmountMinor)}`
                        : `Pay ${formatCurrencyMinor(payableAmountMinor)} with Razorpay`}
                    </span>
                  </>
                )}
              </motion.button>
            </>
          ) : (
            /* Success & Receipt Overview */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#201f20] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="text-center space-y-1 pb-3 border-b border-white/[0.08]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-['Syne',sans-serif] text-base font-black uppercase text-white">
                    Payment Successful
                  </h4>
                  <p className="font-sans text-xs text-[#ac897e]">
                    Kings of Wings · {INITIAL_TABLE_INFO.branch}
                  </p>
                  <span className="font-['Syne',sans-serif] text-[10px] font-bold text-[#ffb86d] uppercase">
                    Ref: {lastPaymentRecord?.transactionReference || 'TXN-SETTLED-9840217'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#ac897e]">
                    <span>Table</span>
                    <span className="text-white font-bold">Table {order.tableNumber}</span>
                  </div>
                  <div className="flex justify-between text-[#ac897e]">
                    <span>Order Ticket</span>
                    <span className="text-white font-bold">{order.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between text-[#ac897e]">
                    <span>Method</span>
                    <span className="text-[#ffdcbd] font-bold">{paymentMethod} (Authorized)</span>
                  </div>
                  <div className="flex justify-between text-[#ac897e]">
                    <span>Amount Paid</span>
                    <span className="text-white font-['Syne',sans-serif] font-black text-sm">
                      {formatCurrencyMinor(payableAmountMinor)}
                    </span>
                  </div>
                  {currentBill.paymentStatus === 'PARTIALLY_PAID' && (
                    <div className="flex justify-between text-amber-400 pt-1 border-t border-white/[0.05]">
                      <span>Remaining Balance</span>
                      <span className="font-bold">{formatCurrencyMinor(currentBill.amount_due_minor || 0)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#0e0e0f] text-[10px] text-[#ac897e] text-center font-mono">
                  GSTIN: 29AABCK8920C1ZP · THANK YOU FOR FEASTING AT KINGS OF WINGS
                </div>
              </div>

              {/* Action Buttons: Full Printable Receipt or Done */}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="flex-1 py-3.5 rounded-xl bg-[#2a2a2b] hover:bg-[#353436] text-white font-['Syne',sans-serif] text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/[0.08]"
                >
                  <Printer className="w-3.5 h-3.5 text-[#ff5708]" />
                  <span>Tax Invoice</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl bg-[#ff5708] text-[#511500] font-['Syne',sans-serif] text-xs font-black uppercase flex items-center justify-center transition-colors cursor-pointer shadow-md"
                >
                  Done
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Official Tax Invoice & Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bill={currentBill}
        payment={lastPaymentRecord}
      />
    </>
  );
};
