import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Search, 
  Plus, 
  Flame, 
  Check, 
  X, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  SlidersHorizontal,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, MenuCategory, UserRole } from '../../types';
import { formatCurrencyMajor } from '../../utils/currency';
import { backendService } from '../../services/backendService';

interface StaffMenuViewProps {
  userRole: UserRole;
}

export const StaffMenuView: React.FC<StaffMenuViewProps> = ({ userRole }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['ALL', 'Wings', 'Burgers', 'Sides', 'Drinks', 'Dessert']);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canEditMenu = userRole === 'MANAGER' || userRole === 'ADMIN';

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const list = await backendService.getMenu();
    setItems(list);
    const cats = ['ALL', ...Array.from(new Set(list.map((i) => i.category)))];
    setCategories(cats);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!canEditMenu) return;
    const updatedAvailable = !item.available;
    const updated = await backendService.updateMenuItem({ id: item.id, available: updatedAvailable });
    setItems(updated);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || !editingItem.price) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      if (editingItem.id) {
        // Edit existing item
        const updatedList = await backendService.updateMenuItem(editingItem as any);
        setItems(updatedList);
        setFeedback(`Updated "${editingItem.name}".`);
      } else {
        // Create new item
        const created = await backendService.createMenuItem({
          name: editingItem.name,
          category: editingItem.category || 'Wings',
          price: Number(editingItem.price),
          description: editingItem.description || '',
          image: editingItem.image || 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
          available: editingItem.available !== false,
          heatFlames: (editingItem as any).heatFlames || (editingItem as any).flameRating || 1,
          prepTimeMinutes: (editingItem as any).prepTimeMinutes || 12,
          isHouseIcon: (editingItem as any).isFeatured || false,
        });
        setItems((prev) => [...prev, created]);
        setFeedback(`Created "${created.name}".`);
      }
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      setFeedback('Failed to save menu item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!canEditMenu) return;
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) return;
    await backendService.deleteMenuItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredItems = items.filter((i) => {
    const matchesCat = selectedCategory === 'ALL' || i.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCat;
    const matchesName = (i.name || '').toLowerCase().includes(query);
    const matchesDesc = (i.description || '').toLowerCase().includes(query);
    return matchesCat && (matchesName || matchesDesc);
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#ff5708]" />
            <span>Menu & Catalog Management</span>
          </h2>
          <p className="text-xs text-[#8f827d]">
            {items.length} Menu Items • Instant 1-tap live kitchen availability toggle
          </p>
        </div>

        {canEditMenu && (
          <button
            type="button"
            onClick={() => {
              setEditingItem({
                name: '',
                category: 'Wings',
                price: 390,
                description: '',
                available: true,
                flameRating: 1,
                heatLevel: 'Classic Mild',
                isFeatured: false,
              });
              setIsEditModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors font-['Syne',sans-serif]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#736862] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog items..."
            className="w-full bg-[#181516] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-[#6d625d] focus:outline-none focus:border-[#ff5708]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#ff5708] text-white'
                  : 'bg-[#181516] hover:bg-[#221f20] text-[#a0948e] border border-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-[#181516] border rounded-2xl p-4 flex flex-col justify-between transition-all group ${
              item.available ? 'border-white/[0.08] hover:border-white/20' : 'border-red-500/30 opacity-70 bg-[#1c1314]'
            }`}
          >
            <div>
              {/* Item Image with Flame Level */}
              <div className="relative h-32 w-full rounded-xl overflow-hidden bg-black/40 mb-3">
                <img
                  src={item.image}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono text-[#ff7a29]">
                  <Flame className="w-3 h-3 fill-[#ff5708] text-[#ff5708]" />
                  <span>{item.heatLevel || `${item.flameRating || 1} Flames`}</span>
                </div>

                {item.isFeatured && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider">
                    Featured
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-['Syne',sans-serif] font-black text-sm text-white">
                    {item.name}
                  </h3>
                  <span className="text-[10px] text-[#7d716c] uppercase tracking-wider block">
                    {item.category}
                  </span>
                </div>
                <span className="font-mono text-sm font-black text-[#ff7a29]">
                  {formatCurrencyMajor(item.price)}
                </span>
              </div>

              <p className="text-xs text-[#8f827d] line-clamp-2 my-2">
                {item.description}
              </p>
            </div>

            {/* Controls: Availability toggle & Edit */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                disabled={!canEditMenu}
                onClick={() => handleToggleAvailability(item)}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  item.available ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {item.available ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                    <span>In Stock</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-red-400" />
                    <span>86'd (Sold Out)</span>
                  </>
                )}
              </button>

              {canEditMenu && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem({ ...item });
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#a0948e] hover:text-red-400 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Item Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#161415] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 className="font-['Syne',sans-serif] text-base font-black uppercase text-white">
                  {editingItem.id ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="p-1 rounded-lg bg-white/5 text-[#a0948e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="e.g. Ghost Pepper Smoked Wings"
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                      Category
                    </label>
                    <select
                      value={editingItem.category || 'Wings'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
                    >
                      <option value="Wings">Wings</option>
                      <option value="Burgers">Burgers</option>
                      <option value="Sides">Sides</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                      Price (INR ₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingItem.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editingItem.image || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Flavor profile, smoke wood, and spice notes..."
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                      Heat Flame Rating (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={editingItem.flameRating || 1}
                      onChange={(e) => setEditingItem({ ...editingItem, flameRating: Number(e.target.value) })}
                      className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                      Spice Description
                    </label>
                    <input
                      type="text"
                      value={editingItem.heatLevel || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, heatLevel: e.target.value })}
                      placeholder="e.g. Blazing Ghost Pepper"
                      className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={editingItem.available !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                      className="rounded accent-[#ff5708]"
                    />
                    <span>Available in Kitchen</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={editingItem.isFeatured || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                      className="rounded accent-[#ff5708]"
                    />
                    <span>Feature on Guest Welcome Screen</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Item'}
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
