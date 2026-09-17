import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Check, 
  X, 
  Printer, 
  User,
  ShieldCheck,
  QrCode,
  RotateCcw,
  AlertTriangle,
  FileText,
  Banknote,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Bill, UserRole, PaymentMethod, PaymentRecord, RefundRecord, DailyPaymentSummary, PaymentReconciliation } from '../../types';
import { formatCurrencyMajor, formatCurrencyMinor, minorToMajor, majorToMinor } from '../../utils/currency';
import { backendService } from '../../services/backendService';
import { paymentService } from '../../services/paymentService';
import { paymentManager } from '../../services/payment/paymentManager';
import { DigitalReceiptModal } from '../DigitalReceiptModal';

interface StaffBillingViewProps {
  userRole: UserRole;
}

export const StaffBillingView: React.FC<StaffBillingViewProps> = ({ userRole }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  
  // Refund form state
  const [refundPaymentId, setRefundPaymentId] = useState<string>('');
  const [refundAmountMajor, setRefundAmountMajor] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const isManagerOrAdmin = userRole === 'MANAGER' || userRole === 'SUPER_ADMIN';

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    const list = await backendService.getBills();
    setBills(list);
  };

  const handleMarkAsPaid = async (billId: string) => {
    await backendService.updateBillStatus(billId, 'PAID');
    setFeedback('Bill marked as settled & fully PAID.');
    loadBills();
    if (selectedBill && selectedBill.id === billId) {
      setSelectedBill({ ...selectedBill, paymentStatus: 'PAID' });
    }
  };

  // Payment Summary Metrics (Section 27)
  const summary: DailyPaymentSummary = useMemo(() => {
    return paymentService.getDailyPaymentSummary();
  }, [bills]);

  // Reconciliation Report (Section 26)
  const reconciliations: PaymentReconciliation[] = useMemo(() => {
    return paymentService.getReconciliation(bills);
  }, [bills]);

  // All Refunds
  const allRefunds: RefundRecord[] = useMemo(() => {
    return paymentService.getAllRefunds();
  }, [bills]);

  // Payments for selected bill
  const selectedBillPayments: PaymentRecord[] = useMemo(() => {
    if (!selectedBill) return [];
    return paymentService.getPaymentsForBill(selectedBill.id);
  }, [selectedBill]);

  const filteredBills = bills.filter((b) => {
    if (activeTab !== 'ALL' && activeTab !== 'REFUNDS' && activeTab !== 'RECONCILIATION') {
      if (b.paymentStatus !== activeTab) return false;
    }
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      b.tableNumber.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query) ||
      b.ticketNumber.toLowerCase().includes(query)
    );
  });

  const handleOpenRefund = (payment: PaymentRecord) => {
    setRefundPaymentId(payment.id);
    setRefundAmountMajor(minorToMajor(payment.amount_minor - (payment.refundedAmount_minor || 0)).toString());
    setRefundReason('Customer dispute / Table adjustment');
    setRefundError(null);
    setIsRefundModalOpen(true);
  };

  const handleExecuteRefund = async () => {
    if (!selectedBill || !refundPaymentId) return;
    const amountNum = parseFloat(refundAmountMajor);
    if (isNaN(amountNum) || amountNum <= 0) {
      setRefundError('Please enter a valid refund amount.');
      return;
    }

    setIsRefunding(true);
    setRefundError(null);

    const result = await paymentService.refundPayment({
      restaurantId: selectedBill.restaurantId || 'rest-kow-blr-01',
      billId: selectedBill.id,
      paymentId: refundPaymentId,
      amount_minor: majorToMinor(amountNum),
      reason: refundReason,
      requestedBy: 'Floor Manager',
      processedBy: `Manager (${userRole})`,
    });

    setIsRefunding(false);
    if (!result.success) {
      setRefundError(result.error || 'Refund failed');
      return;
    }

    setIsRefundModalOpen(false);
    setFeedback(`Refund of ₹${amountNum} successfully processed.`);
    loadBills();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Syne',sans-serif] text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#ff5708]" />
              <span>Dining Room Billing &amp; Settlements</span>
            </h2>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
              paymentManager.isDemoMode() ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {paymentManager.isDemoMode() ? 'DEMO GATEWAY' : 'LIVE GATEWAY'}
            </span>
          </div>
          <p className="text-xs text-[#8f827d]">
            {bills.length} Table Bills • UPI, Cards, Partial Splits, Refunds &amp; Reconciliation
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8f827d] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Table or Bill #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-2 rounded-xl bg-[#181516] border border-white/[0.08] text-xs text-white placeholder-[#736761] focus:border-[#ff5708] outline-none"
          />
        </div>
      </div>

      {/* Daily Payment Summary Metrics (Section 27) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#181516] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-bold text-[#8f827d] block font-['Syne',sans-serif]">
            Total Gross Sales
          </span>
          <div className="font-['Syne',sans-serif] text-lg font-black text-white mt-1">
            {formatCurrencyMinor(summary.totalSales_minor)}
          </div>
          <span className="text-[10px] text-[#736761] mt-0.5 block">
            {summary.successfulPaymentsCount} Settled Orders
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181516] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-bold text-[#8f827d] block font-['Syne',sans-serif]">
            Net Collections
          </span>
          <div className="font-['Syne',sans-serif] text-lg font-black text-emerald-400 mt-1">
            {formatCurrencyMinor(summary.netCollected_minor)}
          </div>
          <span className="text-[10px] text-[#736761] mt-0.5 block">
            After Refunds
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181516] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-bold text-[#8f827d] block font-['Syne',sans-serif]">
            Pending Due
          </span>
          <div className="font-['Syne',sans-serif] text-lg font-black text-amber-400 mt-1">
            {formatCurrencyMinor(summary.pendingAmount_minor)}
          </div>
          <span className="text-[10px] text-[#736761] mt-0.5 block">
            Active Tables
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181516] border border-white/[0.06]">
          <span className="text-[10px] uppercase font-bold text-[#8f827d] block font-['Syne',sans-serif]">
            Refunds Issued
          </span>
          <div className="font-['Syne',sans-serif] text-lg font-black text-rose-400 mt-1">
            {formatCurrencyMinor(summary.refundsAmount_minor)}
          </div>
          <span className="text-[10px] text-[#736761] mt-0.5 block">
            {summary.refundsCount} Transactions
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/[0.06]">
        {[
          { id: 'ALL', label: 'All Bills' },
          { id: 'OPEN', label: 'Open' },
          { id: 'PAYMENT_PENDING', label: 'Pending' },
          { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
          { id: 'PAID', label: 'Settled' },
          { id: 'RECONCILIATION', label: 'Reconciliation' },
          { id: 'REFUNDS', label: 'Refunds Log' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#ff5708] text-white'
                : 'bg-[#181516] hover:bg-[#221f20] text-[#a0948e] border border-white/[0.06]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW: RECONCILIATION TAB */}
      {activeTab === 'RECONCILIATION' && (
        <div className="bg-[#181516] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
            <div>
              <h3 className="font-['Syne',sans-serif] text-sm font-black text-white uppercase">
                Payment Reconciliation &amp; Audit Log
              </h3>
              <p className="text-xs text-[#8f827d]">
                Comparison of Expected Bill Totals vs. Gateway Collections
              </p>
            </div>
            <button
              onClick={loadBills}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121112] text-[#8f827d] uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Table / Ticket</th>
                  <th className="p-3">Expected Total</th>
                  <th className="p-3">Collected</th>
                  <th className="p-3">Refunded</th>
                  <th className="p-3">Due Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {reconciliations.map((rec) => (
                  <tr key={rec.billId} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <span className="font-bold text-white block">Table {rec.tableNumber}</span>
                      <span className="font-mono text-[10px] text-[#736761]">{rec.ticketNumber}</span>
                    </td>
                    <td className="p-3 font-mono text-white">
                      {formatCurrencyMinor(rec.expectedTotal_minor)}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">
                      {formatCurrencyMinor(rec.collectedAmount_minor)}
                    </td>
                    <td className="p-3 font-mono text-rose-400">
                      {rec.refundedAmount_minor > 0 ? `-${formatCurrencyMinor(rec.refundedAmount_minor)}` : '₹0'}
                    </td>
                    <td className="p-3 font-mono text-amber-400">
                      {formatCurrencyMinor(rec.dueAmount_minor)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'RECONCILED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          const target = bills.find((b) => b.id === rec.billId);
                          if (target) setSelectedBill(target);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: REFUNDS TAB */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-[#181516] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-['Syne',sans-serif] text-sm font-black text-white uppercase">
              Authorized Refund Ledger
            </h3>
            <p className="text-xs text-[#8f827d]">
              Audited reversals, customer adjustments, and manager overrides
            </p>
          </div>

          {allRefunds.length === 0 ? (
            <div className="p-12 text-center">
              <RotateCcw className="w-8 h-8 text-[#685c56] mx-auto mb-2" />
              <p className="text-xs text-[#8f827d]">No refunds issued today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121112] text-[#8f827d] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Refund Ref</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Authorized By</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allRefunds.map((rfnd) => (
                    <tr key={rfnd.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-white">
                        {rfnd.id}
                      </td>
                      <td className="p-3 font-mono text-rose-400 font-bold">
                        -{formatCurrencyMinor(rfnd.amount_minor)}
                      </td>
                      <td className="p-3 text-[#d3c5c0]">
                        {rfnd.reason}
                      </td>
                      <td className="p-3 text-[#a0948e]">
                        {rfnd.processedBy}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                          {rfnd.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#736761] font-mono text-[11px]">
                        {new Date(rfnd.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW: BILLS GRID (Standard Tabs) */}
      {activeTab !== 'REFUNDS' && activeTab !== 'RECONCILIATION' && (
        <>
          {filteredBills.length === 0 ? (
            <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-12 text-center">
              <Receipt className="w-10 h-10 text-[#685c56] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne',sans-serif]">
                No Bills Found
              </h3>
              <p className="text-xs text-[#8f827d] mt-1">
                No bills match the selected status filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBills.map((bill) => {
                const isPaid = bill.paymentStatus === 'PAID';
                const isPartial = bill.paymentStatus === 'PARTIALLY_PAID';

                return (
                  <div
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className={`bg-[#181516] border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:border-white/20 ${
                      isPaid 
                        ? 'border-white/[0.06]' 
                        : isPartial 
                        ? 'border-sky-500/40 bg-[#161a1f]'
                        : 'border-amber-500/30 bg-[#1c1816]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-['Syne',sans-serif] font-black text-sm text-white">
                              Table {bill.tableNumber}
                            </span>
                            <span className="text-[10px] font-mono text-[#8f827d]">
                              {bill.ticketNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#7d716c]">
                            Split Mode: {bill.splitMode.replace('_', ' ')}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          isPaid 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : isPartial
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {bill.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/20 border border-white/[0.04] my-3">
                        <div className="flex items-center justify-between text-xs text-[#8f827d] mb-1">
                          <span>Net Bill</span>
                          <span className="font-mono text-base font-black text-white">
                            {formatCurrencyMajor(bill.total)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-emerald-400">
                            Paid: {formatCurrencyMajor(bill.amountPaid || (isPaid ? bill.total : 0))}
                          </span>
                          <span className="text-amber-400 font-bold">
                            Due: {formatCurrencyMajor(bill.amountDue !== undefined ? bill.amountDue : (isPaid ? 0 : bill.total))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-[#a0948e] flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{bill.shares.length} Diner Share{bill.shares.length > 1 ? 's' : ''}</span>
                      </span>

                      {!isPaid && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(bill.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider transition-colors font-['Syne',sans-serif]"
                        >
                          Settle Cash
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bill Detail Slide-Over Modal */}
      <AnimatePresence>
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-lg h-full bg-[#161415] border-l border-white/10 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <h3 className="font-['Syne',sans-serif] text-lg font-black text-white">
                      Table {selectedBill.tableNumber} Master Bill
                    </h3>
                    <span className="text-xs text-[#8f827d] font-mono">
                      Ref: {selectedBill.id} · Ticket: {selectedBill.ticketNumber}
                    </span>
                  </div>
                  <button onClick={() => setSelectedBill(null)} className="p-1 text-[#8f827d] hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Ribbon */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  selectedBill.paymentStatus === 'PAID'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : selectedBill.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <span className="text-xs font-bold uppercase">
                    Status: {selectedBill.paymentStatus.replace('_', ' ')}
                  </span>
                  {selectedBill.paymentStatus === 'PAID' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                {/* Diners Shares Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8f827d] block font-['Syne',sans-serif]">
                    Diner Shares &amp; Portions
                  </span>
                  {selectedBill.shares.map((share, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#1d1a1b] border border-white/[0.04] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{share.avatarEmoji || '🍗'}</span>
                          <span>{share.participantName}</span>
                        </div>
                        <span className="text-[10px] text-[#7d716c]">
                          {share.itemCount} items allocated
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">
                          {formatCurrencyMajor(share.totalShare)}
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${
                          share.isPaid ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {share.isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gateway Transactions for this bill */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8f827d] block font-['Syne',sans-serif]">
                    Gateway Payment History ({selectedBillPayments.length})
                  </span>
                  {selectedBillPayments.length === 0 ? (
                    <div className="p-3 rounded-xl bg-black/20 text-center text-xs text-[#736761]">
                      No digital transactions registered yet.
                    </div>
                  ) : (
                    selectedBillPayments.map((pay) => (
                      <div key={pay.id} className="p-3 rounded-xl bg-black/30 border border-white/[0.04] flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-bold text-white">{pay.transactionReference}</div>
                          <span className="text-[10px] text-[#736761]">
                            {pay.paymentMethod} · {pay.provider} · {new Date(pay.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-mono font-bold text-emerald-400">
                            {formatCurrencyMajor(pay.amount)}
                          </div>
                          {isManagerOrAdmin && pay.status === 'SUCCESS' && (
                            <button
                              onClick={() => handleOpenRefund(pay)}
                              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold uppercase"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bill Totals Summary */}
                <div className="p-4 rounded-xl bg-[#1a1718] border border-white/10 space-y-1.5 text-xs text-[#8f827d]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">{formatCurrencyMajor(selectedBill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="font-mono text-white">{formatCurrencyMajor(selectedBill.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 font-black text-sm text-white">
                    <span>Total Amount</span>
                    <span className="font-mono text-[#ff5708]">{formatCurrencyMajor(selectedBill.total)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-white/10 mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#ff5708]" />
                  <span>Tax Invoice</span>
                </button>

                {selectedBill.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsPaid(selectedBill.id)}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Confirm Settle
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Tax Receipt Modal */}
      {selectedBill && (
        <DigitalReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          bill={selectedBill}
          payment={selectedBillPayments[0] || null}
        />
      )}

      {/* Refund Modal (Manager/Admin Only) */}
      <AnimatePresence>
        {isRefundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1a1b] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-400" />
                  <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase">
                    Authorize Refund
                  </h3>
                </div>
                <button onClick={() => setIsRefundModalOpen(false)} className="text-[#8f827d] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[#8f827d] font-bold block mb-1">
                    Refund Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={refundAmountMajor}
                    onChange={(e) => setRefundAmountMajor(e.target.value)}
                    className="w-full bg-[#121112] border border-white/10 rounded-xl p-2.5 font-mono text-white focus:border-rose-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#8f827d] font-bold block mb-1">
                    Audit Reason
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="E.g. Dish remade / Accidental charge"
                    className="w-full bg-[#121112] border border-white/10 rounded-xl p-2.5 text-white focus:border-rose-400 outline-none"
                  />
                </div>

                {refundError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {refundError}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRefund}
                  disabled={isRefunding}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  {isRefunding ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Process Reversal</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
