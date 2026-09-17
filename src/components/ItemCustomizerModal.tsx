import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  CheckCircle2, 
  UtensilsCrossed, 
  Star, 
  Plus, 
  Minus,
  Sparkles 
} from 'lucide-react';
import { motion } from 'motion/react';
import { MenuItem, CustomizationOption, HeatLevel } from '../types';
import { formatCurrencyMajor } from '../utils/currency';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (item: MenuItem, customization: CustomizationOption, qty: number) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [portion, setPortion] = useState<'6 PC' | '10 PC' | '15 PC' | '20 PC Feast'>('6 PC');
  const [heat, setHeat] = useState<HeatLevel>('HOT');
  const [style, setStyle] = useState<'Classic Bone-In' | 'Boneless Bites'>('Classic Bone-In');
  const [dip, setDip] = useState<'Cool Ranch' | 'Blue Cheese' | 'Truffle Mayo' | 'Extra Glaze' | 'Ghost Reaper Dip'>('Cool Ranch');
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');

  useEffect(() => {
    if (item) {
      setPortion('6 PC');
      setHeat(item.heatFlames >= 3 ? 'HOT' : item.heatFlames === 0 ? 'MILD' : 'MED');
      setStyle('Classic Bone-In');
      setDip('Cool Ranch');
      setQuantity(1);
      setSpecialNotes('');
    }
  }, [item]);

  if (!item) return null;

  const isWings = item.category === 'Wings' || item.category === 'Combos';

  // Calculations
  const portionPriceDelta = 
    !isWings ? 0 :
    portion === '10 PC' ? 120 :
    portion === '15 PC' ? 220 :
    portion === '20 PC Feast' ? 320 : 0;

  const styleCutDelta = isWings && style === 'Boneless Bites' ? 30 : 0;
  const unitPrice = item.price + portionPriceDelta + styleCutDelta;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    onConfirm(
      item,
      {
        portionSize: portion,
        portionPriceDelta,
        heatLevel: heat,
        styleCut: style,
        styleCutDelta,
        dip,
        extraNotes: specialNotes || `${portion} · ${heat} · ${style} · ${dip}`,
      },
      quantity
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#1c1b1c] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header with image hero */}
        <div className="relative w-full h-44 bg-[#2a2a2b] overflow-hidden flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1c] via-[#1c1b1c]/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-[#e5e2e3] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title & Badge */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-[#ff5708]/30 border border-[#ff5708]/40 text-[#ffb59c] font-syne text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                {item.category}
              </span>
              {item.scovilleShu ? (
                <span className="font-syne text-[10px] text-[#ffb86d] font-bold">
                  {item.scovilleShu.toLocaleString()} SHU
                </span>
              ) : null}
            </div>
            <h3 className="font-syne text-xl font-black uppercase text-white tracking-tight leading-tight drop-shadow-md">
              {item.name}
            </h3>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          <p className="font-sans text-xs text-[#ac897e] leading-relaxed">
            {item.description}
          </p>

          {/* Wing Count / Portion */}
          {isWings && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-syne text-[11px] uppercase font-bold text-[#e5e2e3] tracking-wider">
                  1. Wing Count &amp; Portion
                </label>
                <span className="font-sans text-xs text-[#ff5708] font-bold">
                  {portion}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '6 PC' as const, delta: 0, text: 'Standard' },
                  { label: '10 PC' as const, delta: 120, text: `+${formatCurrencyMajor(120)}` },
                  { label: '15 PC' as const, delta: 220, text: `+${formatCurrencyMajor(220)}` },
                  { label: '20 PC Feast' as const, delta: 320, text: `+${formatCurrencyMajor(320)}` },
                ].map((p) => {
                  const isSelected = portion === p.label;
                  return (
                    <button
                      key={p.label}
                      onClick={() => setPortion(p.label)}
                      className={`p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#ff5708] text-[#511500] font-black shadow-md shadow-[#ff5708]/20'
                          : 'bg-[#201f20] border border-white/[0.08] text-[#e5e2e3] hover:bg-[#2a2a2b]'
                      }`}
                    >
                      <span className="font-syne text-xs font-bold">{p.label}</span>
                      <span className="font-sans text-[11px] opacity-90">{p.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Heat Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-syne text-[11px] uppercase font-bold text-[#e5e2e3] tracking-wider">
                2. Heat Profile
              </label>
              <span className="font-sans text-xs text-[#ff5449] font-bold">
                {heat}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#201f20] border border-white/[0.08]">
              {(['MILD', 'MED', 'HOT', 'INSANE'] as HeatLevel[]).map((lvl) => {
                const isSelected = heat === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setHeat(lvl)}
                    className={`py-2 rounded-xl text-center font-syne text-[11px] font-black uppercase transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ff5708] text-[#511500] shadow-sm'
                        : 'text-[#ac897e] hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Cut */}
          {isWings && (
            <div className="space-y-2">
              <label className="font-syne text-[11px] uppercase font-bold text-[#e5e2e3] tracking-wider">
                3. Style &amp; Cut
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { cut: 'Classic Bone-In' as const, sub: 'Flats & drums', extra: '' },
                  { cut: 'Boneless Bites' as const, sub: '100% Breast', extra: `+${formatCurrencyMajor(30)}` },
                ].map((s) => {
                  const isSelected = style === s.cut;
                  return (
                    <button
                      key={s.cut}
                      onClick={() => setStyle(s.cut)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#201f20] border-2 border-[#ff5708]'
                          : 'bg-[#201f20] border border-white/[0.08] hover:bg-[#2a2a2b]'
                      }`}
                    >
                      <div className="font-syne text-xs font-bold text-white">{s.cut}</div>
                      <div className="font-sans text-[11px] text-[#ac897e] flex justify-between items-center mt-0.5">
                        <span>{s.sub}</span>
                        {s.extra ? <span className="text-[#ff5708] font-bold">{s.extra}</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dip Choice */}
          <div className="space-y-2">
            <label className="font-syne text-[11px] uppercase font-bold text-[#e5e2e3] tracking-wider">
              4. Signature Dip
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Cool Ranch' as const,
                'Blue Cheese' as const,
                'Truffle Mayo' as const,
                'Extra Glaze' as const,
              ].map((d) => {
                const isSelected = dip === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDip(d)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#201f20] border-2 border-[#ff5708]'
                        : 'bg-[#201f20] border border-white/[0.08] hover:bg-[#2a2a2b]'
                    }`}
                  >
                    <span className="font-sans text-xs font-semibold text-white">{d}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-[#ff5708]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider">
              Special Prep Request
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Extra well-done skin, sauce on side..."
              className="w-full h-10 px-3.5 rounded-xl bg-[#201f20] border border-white/[0.08] text-xs text-white placeholder:text-[#ac897e] focus:outline-none focus:border-[#ff5708]"
            />
          </div>
        </div>

        {/* Footer with Quantity Stepper & Add Button */}
        <div className="p-4 bg-[#201f20] border-t border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#2a2a2b] px-3 py-1.5 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-white"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-syne text-sm font-bold text-white px-1">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 px-4 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff5708]/30 active:scale-95 transition-all cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Add to Table · {formatCurrencyMajor(totalPrice)}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
