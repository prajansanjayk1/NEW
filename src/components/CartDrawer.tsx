import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Flame, 
  Users,
  User,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, SessionParticipant } from '../types';
import { ParticipantCartGroup } from '../services/cartService';
import { formatCurrencyMajor } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  myItems?: CartItem[];
  participantGroups?: ParticipantCartGroup[];
  currentParticipant?: SessionParticipant | null;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: (specialInstructions: string) => void;
  onOpenBillSplit?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  myItems,
  participantGroups,
  currentParticipant,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onOpenBillSplit,
}) => {
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewScope, setViewScope] = useState<'TABLE' | 'MY'>('TABLE');

  if (!isOpen) return null;

  const displayItems = viewScope === 'MY' && myItems ? myItems : cart;

  const subtotal = displayItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onPlaceOrder(instructions);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#1c1b1c] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#201f20]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff5708] flex items-center justify-center text-[#511500]">
              <ShoppingBag className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-syne text-base font-black uppercase text-[#e5e2e3]">
                Table 18 Shared Round
              </h2>
              <span className="font-sans text-[11px] text-[#ac897e]">
                {cart.length} item{cart.length !== 1 ? 's' : ''} ready for kitchen
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-8 h-8 rounded-full bg-[#353436] hover:bg-[#ff5708] hover:text-[#511500] flex items-center justify-center text-[#e5e2e3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Scope Toggle: Table Order vs My Additions */}
        <div className="px-4 pt-3 pb-1 flex gap-2 border-b border-white/[0.05]">
          <button
            onClick={() => setViewScope('TABLE')}
            className={`flex-1 py-2 px-3 rounded-xl font-syne text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewScope === 'TABLE'
                ? 'bg-[#ff5708] text-[#511500] font-black'
                : 'bg-[#201f20] text-[#ac897e] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Entire Table ({cart.length})</span>
          </button>

          <button
            onClick={() => setViewScope('MY')}
            className={`flex-1 py-2 px-3 rounded-xl font-syne text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewScope === 'MY'
                ? 'bg-[#ff5708] text-[#511500] font-black'
                : 'bg-[#201f20] text-[#ac897e] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Items ({myItems ? myItems.length : 0})</span>
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {displayItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#2a2a2b] flex items-center justify-center text-[#ac897e]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-syne text-base font-bold text-[#e5e2e3]">
                {viewScope === 'MY' ? 'You have not added items yet' : 'Table round is empty'}
              </p>
              <p className="font-sans text-xs text-[#ac897e] max-w-xs">
                Explore the menu to add flame-glazed wings, fries, and drinks to this round.
              </p>
            </div>
          ) : viewScope === 'TABLE' && participantGroups && participantGroups.length > 1 ? (
            /* Grouped View by Diners */
            <div className="space-y-4">
              {participantGroups.map((group) => (
                <div key={group.participantId} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-syne text-xs font-black uppercase text-[#ffb86d] flex items-center gap-1.5">
                      <span>👤 {group.participantName}</span>
                      <span className="text-[10px] text-[#ac897e] font-normal">
                        ({group.itemCount} items)
                      </span>
                    </span>
                    <span className="font-syne text-xs font-bold text-white">
                      ₹{group.subtotal}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemoveItem={onRemoveItem}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Flat item list */
            displayItems.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))
          )}

          {/* Kitchen Cooking Note */}
          {cart.length > 0 && (
            <div className="pt-2">
              <label className="font-syne text-[10px] uppercase tracking-wider text-[#ac897e] font-bold block mb-1">
                Special Kitchen Instructions
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Extra crispy skin, bone plate, ranch on side..."
                className="w-full h-10 px-3.5 rounded-xl bg-[#201f20] border border-white/[0.08] text-xs text-[#e5e2e3] placeholder:text-[#ac897e] focus:outline-none focus:border-[#ff5708]"
              />
            </div>
          )}
        </div>

        {/* Footer with Price Breakdown & Submit CTA */}
        {cart.length > 0 && (
          <div className="p-4 bg-[#201f20] border-t border-white/[0.08] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#ac897e]">
                <span>{viewScope === 'MY' ? 'My Subtotal' : 'Table Round Subtotal'}</span>
                <span>{formatCurrencyMajor(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#ac897e]">
                <span>GST / Taxes (5%)</span>
                <span>{formatCurrencyMajor(tax)}</span>
              </div>
              <div className="flex justify-between font-syne text-base font-extrabold text-white pt-1.5 border-t border-white/[0.08]">
                <span>{viewScope === 'MY' ? 'My Share Total' : 'Table Round Total'}</span>
                <span className="text-[#ffdcbd]">{formatCurrencyMajor(total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {onOpenBillSplit && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBillSplit();
                  }}
                  className="py-4 px-4 rounded-full bg-[#2a2a2b] hover:bg-[#353436] text-[#e5e2e3] font-syne text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer border border-white/[0.08]"
                >
                  Split
                </button>
              )}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,87,8,0.4)] transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Dispatching to Kitchen...</span>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Send Round To Pit · {formatCurrencyMajor(cart.reduce((s, i) => s + i.totalPrice, 0) + Math.round(cart.reduce((s, i) => s + i.totalPrice, 0) * 0.05))}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const CartItemRow: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
}> = ({ item, onUpdateQuantity, onRemoveItem }) => (
  <div className="p-3.5 bg-[#201f20] border border-white/[0.08] rounded-2xl flex items-start gap-3 shadow-sm hover:border-white/20 transition-all">
    <img
      src={item.image}
      alt={item.name}
      className="w-14 h-14 rounded-xl object-cover bg-[#353436] flex-shrink-0"
    />

    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-1">
        <h4 className="font-syne text-xs font-bold text-white uppercase truncate">
          {item.name}
        </h4>
        <span className="font-syne text-xs font-extrabold text-[#ffdcbd]">
          {formatCurrencyMajor(item.totalPrice)}
        </span>
      </div>

      <div className="font-sans text-[10px] text-[#ffb86d] mt-0.5">
        {item.customization.portionSize} · {item.customization.heatLevel}
      </div>
      <div className="font-sans text-[10px] text-[#ac897e]">
        {item.customization.styleCut} · Dip: {item.customization.dip}
      </div>
      <div className="font-sans text-[9px] text-[#ffb59c] mt-0.5">
        Added by {item.addedBy}
      </div>

      {/* Quantity Stepper & Remove */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 bg-[#2a2a2b] px-2 py-0.5 rounded-full border border-white/[0.05]">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
            className="w-4 h-4 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-white cursor-pointer"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          <span className="font-syne text-xs font-bold text-white px-1">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
            className="w-4 h-4 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-white cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>

        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-[#ac897e] hover:text-[#ff5449] p-1 transition-colors cursor-pointer"
          title="Remove item"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
);
