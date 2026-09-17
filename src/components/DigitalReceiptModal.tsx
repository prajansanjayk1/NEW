import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard,
  QrCode,
  Share2
} from 'lucide-react';
import { Bill, PaymentRecord } from '../types';
import { formatCurrencyMajor, formatCurrencyMinor } from '../utils/currency';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
  payment?: PaymentRecord | null;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  payment,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const lines = [
      '========================================',
      '          KINGS OF WINGS               ',
      '   Fire-Kissed Craft Wings & Beer      ',
      '   Indiranagar 100ft Rd, Bengaluru     ',
      '   GSTIN: 29AABCK8920C1ZP              ',
      '========================================',
      `Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`,
      `Bill #: ${bill.id}`,
      `Order Ticket: ${bill.ticketNumber}`,
      `Table: Table ${bill.tableNumber}`,
      '----------------------------------------',
      'ITEMS:',
      ...(bill.itemsSnapshot || []).map(
        (i) => `${i.quantity}x ${i.name.padEnd(24)} ${formatCurrencyMinor(i.totalPrice_minor)}`
      ),
      '----------------------------------------',
      `Subtotal:        ${formatCurrencyMajor(bill.subtotal)}`,
      bill.discount ? `Discount:       -${formatCurrencyMajor(bill.discount)}` : '',
      `GST (5%):        ${formatCurrencyMajor(bill.tax)}`,
      bill.serviceCharge ? `Service Charge:  ${formatCurrencyMajor(bill.serviceCharge)}` : '',
      '----------------------------------------',
      `TOTAL PAID:      ${formatCurrencyMajor(bill.total)}`,
      '----------------------------------------',
      `Payment Method:  ${payment?.paymentMethod || 'UPI/Card'}`,
      `Txn Reference:   ${payment?.transactionReference || 'TXN-SETTLED'}`,
      payment?.isDemo ? '** DEMO SIMULATED PAYMENT **' : 'AUTHORIZED & VERIFIED',
      '========================================',
      '       THANK YOU FOR DINING WITH US!    ',
      '========================================',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${bill.ticketNumber}-${bill.tableNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div 
        id="digital-receipt-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md print:p-0 print:bg-white print:fixed print:inset-0"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#181617] border border-white/[0.12] rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:w-full print:max-w-none print:text-black print:bg-white"
        >
          {/* Header */}
          <div className="p-4 bg-[#201d1f] border-b border-white/[0.08] flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#ff5708]" />
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase tracking-wider text-white">
                Tax Invoice &amp; Receipt
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#ac897e] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Printable Receipt Body */}
          <div 
            ref={receiptRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs text-[#d3c5c0] print:text-black print:overflow-visible print:p-8"
          >
            {/* Restaurant Brand Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-white/20 print:border-black/30">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2 print:hidden">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-['Syne',sans-serif] text-lg font-black tracking-wider text-white uppercase print:text-black">
                Kings of Wings
              </h2>
              <p className="text-[11px] text-[#8f827d] print:text-gray-700">
                Craft Smoked Wings &amp; Draft Beer • Indiranagar, Bengaluru
              </p>
              <p className="text-[10px] text-[#736761] print:text-gray-600">
                GSTIN: 29AABCK8920C1ZP • FSSAI: 11223344009988
              </p>
              {payment?.isDemo && (
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-sans text-[10px] font-bold uppercase tracking-wider print:border-black print:text-black">
                  DEMO SIMULATED PAYMENT
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-dashed border-white/20 print:border-black/30">
              <div>
                <span className="text-[#8f827d] print:text-gray-600 block">Date &amp; Time</span>
                <span className="text-white font-bold print:text-black">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {bill.paidAt || '8:45 PM'}
                </span>
              </div>
              <div>
                <span className="text-[#8f827d] print:text-gray-600 block">Table &amp; Area</span>
                <span className="text-white font-bold print:text-black">
                  Table {bill.tableNumber} · Dining Room
                </span>
              </div>
              <div>
                <span className="text-[#8f827d] print:text-gray-600 block">Invoice / Bill #</span>
                <span className="text-white font-mono font-bold print:text-black">
                  {bill.id.substring(0, 18)}
                </span>
              </div>
              <div>
                <span className="text-[#8f827d] print:text-gray-600 block">Ticket #</span>
                <span className="text-[#ff5708] font-bold print:text-black">
                  {bill.ticketNumber}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-1.5 pb-3 border-b border-dashed border-white/20 print:border-black/30">
              <div className="flex justify-between font-bold text-[10px] uppercase text-[#8f827d] print:text-gray-700 pb-1">
                <span>Item</span>
                <span>Amount</span>
              </div>
              {bill.itemsSnapshot && bill.itemsSnapshot.length > 0 ? (
                bill.itemsSnapshot.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-white print:text-black truncate pr-2">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-[#ffdcbd] font-bold print:text-black flex-shrink-0">
                      {formatCurrencyMinor(item.totalPrice_minor)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-white print:text-black">Dine-in Order Items</span>
                  <span className="text-[#ffdcbd] font-bold print:text-black">{formatCurrencyMajor(bill.subtotal)}</span>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs pb-3 border-b border-dashed border-white/20 print:border-black/30">
              <div className="flex justify-between text-[#a0948e] print:text-gray-700">
                <span>Food &amp; Beverage Subtotal</span>
                <span className="text-white print:text-black">{formatCurrencyMajor(bill.subtotal)}</span>
              </div>
              {bill.discount ? (
                <div className="flex justify-between text-emerald-400 print:text-black">
                  <span>Special Discount Applied</span>
                  <span>-{formatCurrencyMajor(bill.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[#a0948e] print:text-gray-700">
                <span>CGST (2.5%) + SGST (2.5%)</span>
                <span className="text-white print:text-black">{formatCurrencyMajor(bill.tax)}</span>
              </div>
              {bill.serviceCharge ? (
                <div className="flex justify-between text-[#a0948e] print:text-gray-700">
                  <span>Discretionary Service Charge</span>
                  <span className="text-white print:text-black">{formatCurrencyMajor(bill.serviceCharge)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-bold text-white pt-1 font-['Syne',sans-serif] print:text-black">
                <span>Total Amount Paid</span>
                <span className="text-[#ff5708] print:text-black">{formatCurrencyMajor(bill.total)}</span>
              </div>
            </div>

            {/* Payment Verification Proof */}
            <div className="space-y-1 text-[11px] p-3 rounded-2xl bg-black/40 border border-white/[0.06] print:border-black/20 print:bg-gray-50">
              <div className="flex justify-between text-[#8f827d] print:text-gray-600">
                <span>Payment Mode</span>
                <span className="text-white font-bold print:text-black">
                  {payment?.paymentMethod || 'UPI QR Instant'}
                </span>
              </div>
              <div className="flex justify-between text-[#8f827d] print:text-gray-600">
                <span>Transaction Ref</span>
                <span className="text-white font-mono print:text-black">
                  {payment?.transactionReference || 'TXN-9840217'}
                </span>
              </div>
              <div className="flex justify-between text-[#8f827d] print:text-gray-600">
                <span>Settlement Status</span>
                <span className="text-emerald-400 font-bold uppercase print:text-black">
                  SUCCESSFUL / SETTLED
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#736761] pt-1 print:text-gray-600">
              Thank you for dining at Kings of Wings!
            </div>
          </div>

          {/* Action Bar (Hidden during printing) */}
          <div className="p-4 bg-[#201d1f] border-t border-white/[0.08] flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-['Syne',sans-serif] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#ff5708]" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="flex-1 py-3 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-['Syne',sans-serif] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#ffb86d]" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-[#ff5708] hover:bg-[#e04a04] text-black font-['Syne',sans-serif] text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
