import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Edit3, 
  Save, 
  Check, 
  X, 
  Plus, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { MenuItem } from '../../types';
import { takeawayService } from '../../services/takeawayService';

export const StaffTakeawayMenuView: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPackaging, setEditPackaging] = useState<number>(0);
  const [editTakeawayAvailable, setEditTakeawayAvailable] = useState<boolean>(true);
  const [editDineInAvailable, setEditDineInAvailable] = useState<boolean>(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    takeawayService.getTakeawayMenu().then((res) => {
      setItems(res.items || []);
    });
  }, []);

  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditPrice(item.takeawayPrice || item.price);
    setEditPackaging(item.packagingCharge || 15);
    setEditTakeawayAvailable(item.availableTakeaway !== false);
    setEditDineInAvailable(item.availableDineIn !== false);
  };

  const handleSaveEdit = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return {
            ...it,
            takeawayPrice: editPrice,
            packagingCharge: editPackaging,
            availableTakeaway: editTakeawayAvailable,
            availableDineIn: editDineInAvailable,
          };
        }
        return it;
      })
    );
    setEditingId(null);
    setSuccessToast('Channel pricing updated successfully!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div id="staff-takeaway-menu-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Channel Manager
            </span>
            <span className="text-zinc-500 text-xs">·</span>
            <span className="text-zinc-400 text-xs">Multi-Channel Pricing & Packaging</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            Takeaway Menu & Channel Pricing
          </h2>
        </div>

        {successToast && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {/* Info Callout */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-zinc-300">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold">Strict Independent Channel Pricing</strong>
          <span>
            Takeaway prices are maintained separately from Dine-In prices. Each item can have independent packaging charges and independent channel availability. The backend verifies all customer orders against these settings.
          </span>
        </div>
      </div>

      {/* Pricing Matrix Table */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 font-bold uppercase tracking-wider">
                <th className="p-4">Item & Category</th>
                <th className="p-4 text-center">Dine-In Price</th>
                <th className="p-4 text-center">Takeaway Price</th>
                <th className="p-4 text-center">Packaging Fee</th>
                <th className="p-4 text-center">Est. Gross Contribution</th>
                <th className="p-4 text-center">Channel Availability</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {items.map((item) => {
                const isEditing = editingId === item.id;
                const dineIn = item.dineInPrice || item.price;
                const takeaway = isEditing ? editPrice : (item.takeawayPrice || item.price);
                const pkg = isEditing ? editPackaging : (item.packagingCharge || 15);
                const estimatedFoodCost = Math.round(takeaway * 0.38); // 38% food cost
                const contribution = takeaway - estimatedFoodCost - pkg;

                return (
                  <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                    {/* Item */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-zinc-800" />
                        <div>
                          <span className="font-bold text-white text-sm block">{item.name}</span>
                          <span className="text-[11px] text-zinc-500">{item.category}</span>
                        </div>
                      </div>
                    </td>

                    {/* Dine-In Price */}
                    <td className="p-4 text-center font-mono text-zinc-300 font-bold">
                      ₹{dineIn}
                    </td>

                    {/* Takeaway Price */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-zinc-500">₹</span>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-center font-bold"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-amber-400 font-bold text-sm">₹{takeaway}</span>
                      )}
                    </td>

                    {/* Packaging Fee */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-zinc-500">₹</span>
                          <input
                            type="number"
                            value={editPackaging}
                            onChange={(e) => setEditPackaging(Number(e.target.value))}
                            className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-center"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-zinc-300">₹{pkg}</span>
                      )}
                    </td>

                    {/* Est Gross Contribution */}
                    <td className="p-4 text-center font-mono">
                      <span className="text-emerald-400 font-bold">₹{contribution}</span>
                      <span className="block text-[10px] text-zinc-500">({Math.round((contribution / takeaway) * 100)}% margin)</span>
                    </td>

                    {/* Channel Availability */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-3">
                          <label className="flex items-center gap-1 text-[11px] text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editDineInAvailable}
                              onChange={(e) => setEditDineInAvailable(e.target.checked)}
                              className="rounded border-zinc-700 bg-zinc-900"
                            />
                            Dine-In
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-amber-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editTakeawayAvailable}
                              onChange={(e) => setEditTakeawayAvailable(e.target.checked)}
                              className="rounded border-zinc-700 bg-zinc-900"
                            />
                            Takeaway
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Dine-In
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Takeaway
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            title="Save Changes"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
