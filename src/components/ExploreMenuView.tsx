import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Layers, 
  Sandwich, 
  UtensilsCrossed, 
  Soup, 
  GlassWater, 
  Star, 
  Plus, 
  Check, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, CustomizationOption, HeatLevel, CartItem, SessionParticipant, MenuCategory, MenuItemOption } from '../types';
import { MENU_ITEMS, INITIAL_CREW } from '../data/mockData';
import { ItemCustomizerModal } from './ItemCustomizerModal';
import { restaurantDataService } from '../services/restaurantDataService';
import { formatCurrencyMajor } from '../utils/currency';

interface ExploreMenuViewProps {
  onAddToCart: (item: MenuItem, customization: CustomizationOption, qty?: number) => void;
  onOpenCart: () => void;
  onOpenSparkAI: () => void;
  onOpenSplitBill: () => void;
  cart: CartItem[];
  participants?: SessionParticipant[];
  tableNumber?: string;
}

export const ExploreMenuView: React.FC<ExploreMenuViewProps> = ({
  onAddToCart,
  onOpenCart,
  onOpenSparkAI,
  onOpenSplitBill,
  cart,
  participants = [],
  tableNumber = '18',
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Wings');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSpicyOnly, setFilterSpicyOnly] = useState(false);
  const [filterVegetarian, setFilterVegetarian] = useState(false);

  // Load menu from real backend (Supabase or Demo fallback)
  useEffect(() => {
    let isMounted = true;
    restaurantDataService
      .getMenu()
      .then((res) => {
        if (isMounted && res && res.items && res.items.length > 0) {
          setMenuItems(res.items);
          if (res.categories && res.categories.length > 0) {
            setCategories(res.categories);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load menu from backend service:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Customizer Engine state for featured item (Firecracker Wings)
  const [customPortion, setCustomPortion] = useState<'6 PC' | '10 PC' | '15 PC' | '20 PC Feast'>('6 PC');
  const [customHeat, setCustomHeat] = useState<HeatLevel>('HOT');
  const [customStyle, setCustomStyle] = useState<'Classic Bone-In' | 'Boneless Bites'>('Classic Bone-In');
  const [customDip, setCustomDip] = useState<'Cool Ranch' | 'Blue Cheese' | 'Truffle Mayo' | 'Extra Glaze' | 'Ghost Reaper Dip'>('Cool Ranch');
  const [customizerAddedAlert, setCustomizerAddedAlert] = useState(false);

  // Modal customizer for any item
  const [activeCustomizeItem, setActiveCustomizeItem] = useState<MenuItem | null>(null);

  // Dynamic price calculation for Firecracker
  const featuredItem = useMemo(() => {
    return (
      menuItems.find((m) => m?.name?.includes('Firecracker') || m?.id === 'wings-firecracker') ||
      menuItems[0] ||
      MENU_ITEMS[0]
    );
  }, [menuItems]);

  const baseFirecrackerPrice = featuredItem ? featuredItem.price : 249;
  const portionPriceDelta = 
    customPortion === '10 PC' ? 120 :
    customPortion === '15 PC' ? 220 :
    customPortion === '20 PC Feast' ? 320 : 0;
  const styleCutDelta = customStyle === 'Boneless Bites' ? 30 : 0;
  const calculatedFirecrackerPrice = baseFirecrackerPrice + portionPriceDelta + styleCutDelta;

  const handleAddFeaturedCustomizer = () => {
    if (!featuredItem) return;
    onAddToCart(
      featuredItem,
      {
        portionSize: customPortion,
        portionPriceDelta,
        heatLevel: customHeat,
        styleCut: customStyle,
        styleCutDelta,
        dip: customDip,
        extraNotes: `${customPortion} · ${customHeat} · ${customStyle} · ${customDip}`,
      },
      1
    );
    setCustomizerAddedAlert(true);
    setTimeout(() => setCustomizerAddedAlert(false), 2000);
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category check
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      // Filters
      if (filterSpicyOnly && item.heatFlames === 0) return false;
      if (filterVegetarian && item.category === 'Wings') return false;
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, filterSpicyOnly, filterVegetarian]);

  // Cart summary
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const latestCartItem = cart.length > 0 ? (cart[cart.length - 1]?.name || 'Item') : '';

  const activeParticipants = participants.length > 0 ? participants : INITIAL_CREW;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col w-full max-w-md mx-auto text-[#e5e2e3] pb-32"
    >
      {/* Craving Header & Search Hub */}
      <section className="px-4 pt-2 pb-2 flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[#ff5708]">
            <Flame className="w-4 h-4 fill-current animate-pulse" />
            <span className="font-syne text-[11px] uppercase tracking-widest text-[#ff5708] font-black">
              Pitmaster Fresh · Flame Kissed
            </span>
          </div>
          <h1 className="font-syne text-3xl font-black tracking-tight text-[#e5e2e3] uppercase">
            What's Your <span className="text-[#ff5708]">Craving?</span>
          </h1>
        </div>

        {/* Smart Search Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-[#ac897e] w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wings, burgers, dips, sodas..."
            className="w-full h-12 pl-11 pr-12 rounded-2xl bg-[#1c1b1c] border border-white/[0.08] text-[#e5e2e3] placeholder:text-[#ac897e] text-xs font-sans focus:outline-none focus:border-[#ff5708] shadow-md transition-all"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Open filter options"
            className={`absolute right-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              showFilters || filterSpicyOnly || filterVegetarian
                ? 'bg-[#ff5708] text-[#511500]'
                : 'bg-[#2a2a2b] text-[#e5e2e3] hover:text-[#ff5708]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#1c1b1c] border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs shadow-inner">
                <span className="font-syne uppercase font-bold text-[#ac897e] text-[10px]">
                  Quick Filters:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterSpicyOnly(!filterSpicyOnly)}
                    className={`px-3 py-1 rounded-full border transition-all text-xs font-medium cursor-pointer ${
                      filterSpicyOnly
                        ? 'bg-[#ff5708] border-[#ff5708] text-[#511500] font-bold'
                        : 'bg-[#201f20] border-white/10 text-[#e5beb2]'
                    }`}
                  >
                    🔥 Spicy Only
                  </button>
                  <button
                    onClick={() => setFilterVegetarian(!filterVegetarian)}
                    className={`px-3 py-1 rounded-full border transition-all text-xs font-medium cursor-pointer ${
                      filterVegetarian
                        ? 'bg-[#ffb86d] border-[#ffb86d] text-[#492900] font-bold'
                        : 'bg-[#201f20] border-white/10 text-[#e5beb2]'
                    }`}
                  >
                    🌱 Sides &amp; Veg
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concierge AI Quick Assist Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#1c1b1c] border border-white/[0.08] p-3.5 shadow-md flex items-center justify-between gap-3">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#ff5708]/15 blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#df8600] text-[#511500] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(255,87,8,0.35)]">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-syne text-xs uppercase font-bold tracking-wider text-[#ffdcbd]">
                  Wing Concierge AI
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#ff5708]/20 text-[#ff5708] font-syne text-[9px] tracking-wide font-black">
                  LIVE
                </span>
              </div>
              <p className="font-sans text-xs text-[#ac897e] truncate">
                Tell us your spice craving tonight...
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSparkAI}
            className="px-3.5 py-1.5 rounded-full bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] text-[#ffdbcf] font-syne text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 shadow-sm cursor-pointer border border-white/[0.08]"
          >
            Spark AI
          </motion.button>
        </div>
      </section>

      {/* Category Nav Chips */}
      <section className="py-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 px-4 w-max">
          {[
            { key: 'Wings', label: 'Wings', icon: Flame },
            { key: 'Combos', label: 'Combos', icon: Layers },
            { key: 'Burgers', label: 'Burgers', icon: Sandwich },
            { key: 'Sides', label: 'Sides', icon: UtensilsCrossed },
            { key: 'Dips', label: 'Dips', icon: Soup },
            { key: 'Drinks', label: 'Drinks', icon: GlassWater },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`h-9 px-4 rounded-full font-syne text-[11px] tracking-widest uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ff5708] text-[#511500] font-black shadow-[0_2px_14px_rgba(255,87,8,0.35)]'
                    : 'bg-[#1c1b1c] border border-white/[0.08] text-[#ac897e] hover:text-[#e5e2e3]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section Title */}
      <div className="px-4 pt-4 pb-2 flex items-end justify-between">
        <div>
          <h2 className="font-syne text-xl font-black uppercase tracking-tight text-[#e5e2e3] leading-tight">
            {selectedCategory === 'Wings' ? 'Signature Wings' : selectedCategory}
          </h2>
          <p className="font-sans text-xs text-[#ac897e]">
            {selectedCategory === 'Wings'
              ? 'Tossed fresh in cast iron. Sauced to dripping perfection.'
              : `Handcrafted ${selectedCategory.toLowerCase()} fresh off the pit.`}
          </p>
        </div>
        <span className="font-syne text-[10px] font-extrabold text-[#ffdcbd] uppercase tracking-wider bg-[#201f20] px-2.5 py-1 rounded-full border border-white/[0.08]">
          {filteredItems.length} Flavors
        </span>
      </div>

      {/* Hero Feature Card: Featured Wings (Only on Wings category without search filter) */}
      {selectedCategory === 'Wings' && !searchQuery && featuredItem && (
        <section className="px-4 py-1">
          <div className="rounded-3xl bg-[#1c1b1c] border border-white/[0.08] overflow-hidden shadow-xl flex flex-col">
            {/* Image with Vignette Scrim & Badges */}
            <div className="relative w-full aspect-[4/3] bg-[#2a2a2b] overflow-hidden">
              <img
                src={featuredItem.image}
                alt={featuredItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1c] via-[#1c1b1c]/20 to-transparent"></div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#ffb86d] font-syne text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 border border-white/[0.08]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  House Icon
                </span>
              </div>

              {/* Heat Scoville Rating Pill */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md flex items-center gap-1 shadow-sm border border-white/[0.08]">
                <span className="font-syne text-[10px] font-bold text-[#e5e2e3] uppercase tracking-wider">
                  Heat
                </span>
                <div className="flex items-center text-[#ff5708]">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <Flame className="w-3.5 h-3.5 text-[#353436]" />
                </div>
              </div>

              {/* Price Callout using centralized formatter */}
              <div className="absolute bottom-3 left-3">
                <span className="font-syne text-2xl font-black text-[#e5e2e3] drop-shadow-md">
                  {formatCurrencyMajor(baseFirecrackerPrice)}
                </span>
                <span className="font-sans text-xs text-[#e5beb2] drop-shadow-md ml-1 font-medium">
                  / 6 pc
                </span>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="p-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-syne text-lg font-black text-[#e5e2e3] uppercase tracking-tight">
                    {featuredItem.name}
                  </h3>
                  <span className="font-sans text-xs text-[#ffb86d] font-bold">
                    85,000 SHU
                  </span>
                </div>
                <p className="font-sans text-xs text-[#ac897e] mt-1 leading-relaxed">
                  {featuredItem.description}
                </p>
              </div>

              {/* Quick Size Configurator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider">
                    Select Portion
                  </span>
                  <span className="font-sans text-[10px] text-[#ffb86d]">
                    {customPortion}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['6 PC', '10 PC', '15 PC', '20 PC Feast'] as const).map((size) => {
                    const isSelected = customPortion === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setCustomPortion(size)}
                        className={`py-2 px-1 rounded-xl text-center font-syne text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff5708] text-[#511500] font-black shadow-sm'
                            : 'bg-[#201f20] text-[#ac897e] hover:text-white border border-white/[0.08]'
                        }`}
                      >
                        {size.split(' ')[0]} {size.split(' ')[1] || ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style selection */}
              <div className="grid grid-cols-2 gap-2">
                {(['Classic Bone-In', 'Boneless Bites'] as const).map((s) => {
                  const isStyleSelected = customStyle === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setCustomStyle(s)}
                      className={`p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isStyleSelected
                          ? 'bg-[#201f20] border-2 border-[#ff5708]'
                          : 'bg-[#201f20] border border-white/[0.08]'
                      }`}
                    >
                      <span className={`font-sans text-xs ${isStyleSelected ? 'text-white font-bold' : 'text-[#e5beb2]'}`}>
                        {s}
                      </span>
                      {isStyleSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#ff5708]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add to Table CTA in Customizer */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddFeaturedCustomizer}
                className="h-12 w-full rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,87,8,0.4)] transition-transform cursor-pointer"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Add Custom {featuredItem?.name ? featuredItem.name.split(' ')[0] : 'Wings'} · {formatCurrencyMajor(calculatedFirecrackerPrice)}</span>
              </motion.button>

              {customizerAddedAlert && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center font-syne text-xs text-[#ffb86d] font-bold"
                >
                  ✓ Added to Table {tableNumber} Round!
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* More Pit Signatures & Category Items */}
      <section className="px-4 pt-3 pb-2 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-syne text-base font-black text-[#e5e2e3] uppercase tracking-tight">
            {selectedCategory === 'Wings' ? 'More Pit Signatures' : `All ${selectedCategory}`}
          </h3>
          <span className="font-syne text-[10px] font-extrabold text-[#ff5708] uppercase tracking-wider">
            {filteredItems.length} Available
          </span>
        </div>

        {/* List of items */}
        <div className="space-y-3">
          {filteredItems
            .filter((i) => i.id !== featuredItem?.id || selectedCategory !== 'Wings' || !!searchQuery)
            .map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-3xl bg-[#1c1b1c] border border-white/[0.08] flex items-center gap-3.5 shadow-md hover:border-[#ff5708]/40 transition-all group"
              >
                {/* Item Thumbnail */}
                <div 
                  onClick={() => setActiveCustomizeItem(item)}
                  className="w-24 h-24 rounded-2xl bg-[#201f20] overflow-hidden relative flex-shrink-0 cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.badges && item.badges[0] && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[#ff5449] font-syne text-[9px] font-black border border-white/[0.08]">
                      {item.badges[0]}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between flex-1 min-w-0">
                  <div 
                    onClick={() => setActiveCustomizeItem(item)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-syne text-xs font-bold text-[#e5e2e3] truncate uppercase group-hover:text-[#ff5708] transition-colors">
                        {item.name}
                      </h4>
                      <span className="font-syne text-sm text-[#ffdcbd] flex-shrink-0 font-extrabold">
                        {formatCurrencyMajor(item.price)}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[#ac897e] line-clamp-2 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-syne text-[10px] text-[#e5beb2] uppercase tracking-wider">
                        {item.category === 'Wings' ? '6 PC · Bone-In' : 'Pit Fresh'}
                      </span>
                      {item.prepTimeMinutes ? (
                        <span className="font-sans text-[10px] text-[#ac897e] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#ffb86d]" />
                          {item.prepTimeMinutes}m
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveCustomizeItem(item)}
                        className="px-2.5 py-1 rounded-full bg-[#201f20] hover:bg-[#2a2a2b] text-[#e5beb2] hover:text-white font-syne text-[10px] font-bold uppercase transition-colors border border-white/[0.08] cursor-pointer"
                      >
                        Customize
                      </button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          onAddToCart(item, {
                            portionSize: '6 PC',
                            portionPriceDelta: 0,
                            heatLevel: item.heatFlames > 2 ? 'HOT' : 'MILD',
                            styleCut: 'Classic Bone-In',
                            styleCutDelta: 0,
                            dip: 'Cool Ranch',
                          });
                        }}
                        aria-label={`Add ${item.name}`}
                        className="w-8 h-8 rounded-full bg-[#ff5708] hover:bg-[#df8600] text-[#511500] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-[#1c1b1c] rounded-3xl border border-white/[0.05]">
            <UtensilsCrossed className="w-10 h-10 text-[#ac897e]" />
            <p className="font-syne text-sm font-bold text-white uppercase">No Flavors Found</p>
            <p className="font-sans text-xs text-[#ac897e]">
              Try searching for "wings", "fries", or clearing filters.
            </p>
          </div>
        )}
      </section>

      {/* Table Crew Live Activity Banner */}
      <section className="px-4 py-2 mt-2">
        <div className="p-4 rounded-3xl bg-[#1c1b1c] border border-white/[0.08] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {activeParticipants.slice(0, 4).map((member: any) => (
                <div
                  key={member.id}
                  className={`w-8 h-8 rounded-full ${member.color || 'bg-[#ff5708] text-[#511500]'} flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-[#131314] font-syne`}
                >
                  {member.avatarEmoji || member.initials}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="font-syne text-[11px] font-extrabold uppercase text-[#ffdcbd]">
                Table {tableNumber} Crew Active
              </span>
              <span className="font-sans text-xs text-[#ac897e]">
                {activeParticipants.length} diners adding to round
              </span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSplitBill}
            className="px-3 py-1.5 rounded-full bg-[#201f20] hover:bg-[#ff5708] hover:text-[#511500] text-[#e5e2e3] font-syne text-[11px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border border-white/[0.08]"
          >
            Split Bill
          </motion.button>
        </div>
      </section>

      {/* Persistent Floating Bottom Order Tray */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-md mx-auto rounded-full bg-[#1c1b1c]/95 backdrop-blur-xl border border-white/[0.14] p-2 pl-4 pr-2 flex items-center justify-between shadow-[0_12px_36px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-9 h-9 rounded-full bg-[#ff5708] text-[#511500] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(255,87,8,0.4)]">
                  <ShoppingBag className="w-5 h-5 fill-current" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-[#ff5708] font-syne text-[9px] font-black flex items-center justify-center border border-[#ff5708]">
                    {cartItemCount}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-syne text-sm font-extrabold uppercase tracking-tight text-[#e5e2e3] leading-tight truncate">
                    {formatCurrencyMajor(cartTotal)} · Table {tableNumber}
                  </span>
                  <span className="font-sans text-[11px] text-[#ac897e] truncate">
                    {latestCartItem} added
                  </span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenCart}
                className="h-10 px-5 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_16px_rgba(255,87,8,0.35)] transition-transform flex-shrink-0 cursor-pointer"
              >
                <span>Review Order</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Customizer Modal */}
      <AnimatePresence>
        {activeCustomizeItem && (
          <ItemCustomizerModal
            item={activeCustomizeItem}
            onClose={() => setActiveCustomizeItem(null)}
            onConfirm={(item, cust, qty) => onAddToCart(item, cust, qty)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
