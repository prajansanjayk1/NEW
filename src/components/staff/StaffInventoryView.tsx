import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Truck, 
  Boxes, 
  History, 
  DollarSign, 
  ClipboardCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  X, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ingredient, 
  InventoryBatch, 
  StockMovement, 
  PurchaseOrder, 
  WastageRecord, 
  Supplier, 
  UserRole, 
  InventoryUnit, 
  WastageReason,
  PurchaseOrderStatus
} from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrencyMajor } from '../../utils/currency';

interface StaffInventoryViewProps {
  userRole: UserRole;
  onNavigateToRecipes?: () => void;
  onOpenCopilotWithPrompt?: (prompt: string) => void;
}

type SubTab = 'DASHBOARD' | 'INGREDIENTS' | 'BATCHES' | 'PURCHASE_ORDERS' | 'SUPPLIERS' | 'WASTAGE' | 'STOCK_TAKE';

export const StaffInventoryView: React.FC<StaffInventoryViewProps> = ({ 
  userRole,
  onNavigateToRecipes,
  onOpenCopilotWithPrompt
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('DASHBOARD');
  const [refreshKey, setRefreshKey] = useState(0);

  // Core Data
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>([]);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isRecordWastageOpen, setIsRecordWastageOpen] = useState(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [selectedPOForReceiving, setSelectedPOForReceiving] = useState<PurchaseOrder | null>(null);
  const [isStockTakeOpen, setIsStockTakeOpen] = useState(false);

  // Subscribe to real-time inventory updates
  useEffect(() => {
    const loadData = () => {
      setIngredients(inventoryService.getIngredients());
      setBatches(inventoryService.getBatches());
      setMovements(inventoryService.getStockMovements());
      setPurchaseOrders(inventoryService.getPurchaseOrders());
      setSuppliers(inventoryService.getSuppliers());
      setWastageRecords(inventoryService.getWastageRecords());
    };

    loadData();
    const unsubscribe = inventoryService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [refreshKey]);

  const metrics = useMemo(() => inventoryService.getDashboardMetrics(), [ingredients, batches, purchaseOrders, wastageRecords]);
  const expiringBatches = useMemo(() => inventoryService.getExpiringBatches(), [batches]);
  const purchaseSuggestions = useMemo(() => inventoryService.getPurchaseSuggestions(), [ingredients]);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchStatus = stockStatusFilter === 'ALL' || item.stockStatus === stockStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [ingredients, searchTerm, categoryFilter, stockStatusFilter]);

  const categories = useMemo(() => {
    const set = new Set(ingredients.map((i) => i.category));
    return ['ALL', ...Array.from(set)];
  }, [ingredients]);

  const canManage = userRole === 'MANAGER' || userRole === 'ADMIN';

  return (
    <div className="space-y-6 pb-20">
      {/* SECTION HEADER & SUB-NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-['Syne',sans-serif] uppercase tracking-wider text-white">
              Inventory & Procurement
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff5708]/20 text-[#ff7a29] border border-[#ff5708]/30 font-bold uppercase">
              Phase 7 Live
            </span>
          </div>
          <p className="text-xs text-[#9e9089] mt-1">
            Real-time stock tracking, lot batching, supplier procurement orders & food wastage control.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#181516] rounded-xl border border-white/[0.06] text-xs font-['Syne',sans-serif]">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
            { id: 'INGREDIENTS', label: 'Ingredients', icon: Package, badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : undefined },
            { id: 'BATCHES', label: 'Batches & FEFO', icon: Clock, badge: metrics.expiringSoonCount > 0 ? metrics.expiringSoonCount : undefined },
            { id: 'PURCHASE_ORDERS', label: 'Purchase Orders', icon: Truck, badge: metrics.pendingPurchasesCount > 0 ? metrics.pendingPurchasesCount : undefined },
            { id: 'SUPPLIERS', label: 'Suppliers', icon: Boxes },
            { id: 'WASTAGE', label: 'Food Wastage', icon: Trash2 },
            { id: 'STOCK_TAKE', label: 'Stock Take', icon: ClipboardCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as SubTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#ff5708] text-white shadow-[0_2px_10px_rgba(255,87,8,0.3)]' 
                    : 'text-[#9c908a] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-[#ff5708] text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#181516] border border-white/[0.08] p-4 rounded-2xl">
              <div className="flex items-center justify-between text-[#8c807b] text-xs font-semibold">
                <span>Total Inventory Value</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-['Syne',sans-serif] text-white mt-2">
                ₹{metrics.totalInventoryValue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#8c807b] mt-1">
                {metrics.totalIngredients} managed items
              </div>
            </div>

            <div 
              onClick={() => { setActiveSubTab('INGREDIENTS'); setStockStatusFilter('LOW_STOCK'); }}
              className="bg-[#181516] border border-amber-500/20 hover:border-amber-500/40 p-4 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                <span>Low & Critical Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-['Syne',sans-serif] text-white mt-2 flex items-baseline gap-2">
                <span>{metrics.lowStockCount} items</span>
                {metrics.outOfStockCount > 0 && (
                  <span className="text-xs text-red-400 font-normal">({metrics.outOfStockCount} out)</span>
                )}
              </div>
              <div className="text-[11px] text-[#8c807b] mt-1 flex items-center gap-1 group-hover:text-amber-400">
                <span>View low stock alert list</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div 
              onClick={() => setActiveSubTab('BATCHES')}
              className="bg-[#181516] border border-orange-500/20 hover:border-orange-500/40 p-4 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-orange-400 text-xs font-semibold">
                <span>Expiring Batches (≤ 3 Days)</span>
                <Clock className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-['Syne',sans-serif] text-white mt-2">
                {metrics.expiringSoonCount} lots
              </div>
              <div className="text-[11px] text-[#8c807b] mt-1 flex items-center gap-1 group-hover:text-orange-400">
                <span>FEFO batch management</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div 
              onClick={() => setActiveSubTab('WASTAGE')}
              className="bg-[#181516] border border-red-500/20 hover:border-red-500/40 p-4 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-red-400 text-xs font-semibold">
                <span>Today's Food Wastage</span>
                <Trash2 className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-['Syne',sans-serif] text-white mt-2">
                ₹{metrics.todaysWastageValue.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#8c807b] mt-1 flex items-center gap-1 group-hover:text-red-400">
                <span>Weekly: ₹{metrics.weeklyWastageValue.toLocaleString('en-IN')}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canManage && (
              <button
                type="button"
                onClick={() => { setEditingIngredient(null); setIsAddIngredientOpen(true); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff6c26] text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider shadow-lg shadow-[#ff5708]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ingredient</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsReceiveStockOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-[#ff7a29]" />
              <span>Receive Delivery</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRecordWastageOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Log Food Wastage</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => setIsCreatePOOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Create Purchase Order</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsStockTakeOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-purple-400" />
              <span>Start Stock Count</span>
            </button>

            {onNavigateToRecipes && (
              <button
                type="button"
                onClick={onNavigateToRecipes}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#221f20] hover:bg-[#2c2829] text-[#e0d6ce] border border-white/10 text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-all cursor-pointer ml-auto"
              >
                <span>Recipe Costing</span>
                <ChevronRight className="w-4 h-4 text-[#ff7a29]" />
              </button>
            )}
          </div>

          {/* AI Procurement Suggestions & Low Stock Warning */}
          {purchaseSuggestions.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#1e1a1b] to-[#181516] border border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-amber-300">
                    AI Inventory Procurement Suggestions
                  </h3>
                </div>
                <span className="text-[10px] text-[#8c807b] italic">
                  AI suggestions require manager approval before generating POs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {purchaseSuggestions.map((sug) => (
                  <div key={sug.ingredientId} className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate">{sug.ingredientName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {sug.currentQuantity} / {sug.minimumQuantity} {sug.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9c908a] mt-1 leading-snug">
                        {sug.reason}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#8c807b] block">Suggested Order</span>
                        <span className="font-bold text-white font-mono">{sug.suggestedQuantity} {sug.unit} (≈ ₹{sug.estimatedCost})</span>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatePOOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Draft PO
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-Column: Critical Stock / Batches vs Live Movements Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Immediate Stock Alerts */}
            <div className="bg-[#181516] border border-white/[0.08] p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ff5708]" />
                  <span>Immediate Stock & Expiry Alerts</span>
                </h3>
                <span className="text-xs font-mono text-[#8c807b]">
                  {expiringBatches.expiringIn3Days.length + metrics.lowStockCount} items flagged
                </span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {/* Out of Stock */}
                {ingredients.filter((i) => i.stockStatus === 'OUT_OF_STOCK').map((ing) => (
                  <div key={ing.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs font-bold text-white">{ing.name}</span>
                      </div>
                      <span className="text-[10px] text-red-400 block mt-0.5">
                        OUT OF STOCK · Par: {ing.minimumQuantity} {ing.unit}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReceiveStockOpen(true)}
                      className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Restock
                    </button>
                  </div>
                ))}

                {/* Expiring Soon */}
                {expiringBatches.expiringIn3Days.map((batch) => (
                  <div key={batch.id} className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-xs font-bold text-white">{batch.ingredientName}</span>
                      </div>
                      <span className="text-[10px] text-orange-400 block mt-0.5">
                        Lot {batch.batchNumber} · {batch.remainingQuantity} {batch.unit} expires {batch.daysUntilExpiry === 0 ? 'TODAY' : `in ${batch.daysUntilExpiry} days`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRecordWastageOpen(true)}
                      className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                    >
                      Inspect / Log
                    </button>
                  </div>
                ))}

                {/* Low Stock */}
                {ingredients.filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'CRITICAL').map((ing) => (
                  <div key={ing.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-xs font-bold text-white">{ing.name}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 block mt-0.5">
                        {ing.currentQuantity} {ing.unit} left (Minimum: {ing.minimumQuantity} {ing.unit})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8c807b]">
                      Cost: ₹{ing.costPerUnit}/{ing.unit}
                    </span>
                  </div>
                ))}

                {metrics.lowStockCount === 0 && expiringBatches.expiringIn3Days.length === 0 && (
                  <div className="text-center py-8 text-[#8c807b] text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400/60 mb-2" />
                    All ingredient inventory levels and lot expiries are optimal.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Real-time Stock Movements Audit Trail */}
            <div className="bg-[#181516] border border-white/[0.08] p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-400" />
                  <span>Real-Time Movements Audit</span>
                </h3>
                <span className="text-xs font-mono text-[#8c807b]">
                  {movements.length} log records
                </span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {movements.slice(0, 12).map((mov) => {
                  const isPositive = mov.quantity > 0;
                  const typeColors: Record<string, { badge: string; text: string }> = {
                    PURCHASE: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-400' },
                    SALE_CONSUMPTION: { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', text: 'text-sky-400' },
                    WASTAGE: { badge: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'text-red-400' },
                    STOCK_ADJUSTMENT: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', text: 'text-purple-400' },
                    INITIAL_STOCK: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-400' },
                  };

                  const theme = typeColors[mov.movementType] || { badge: 'bg-white/10 text-white border-white/20', text: 'text-white' };

                  return (
                    <div key={mov.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${theme.badge}`}>
                            {mov.movementType.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-white">{mov.ingredientName || 'Item'}</span>
                        </div>
                        <div className="text-[10px] text-[#8c807b] mt-1 flex items-center gap-2">
                          <span>{mov.reason || mov.reference || 'Audit entry'}</span>
                          <span>·</span>
                          <span>{new Date(mov.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {mov.actorName && (
                            <>
                              <span>·</span>
                              <span className="text-[#a0948e]">{mov.actorName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={`font-mono font-bold text-right ${theme.text}`}>
                        {isPositive ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INGREDIENTS MASTER TABLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'INGREDIENTS' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-[#181516] border border-white/[0.08] px-3 py-2 rounded-xl">
              <Search className="w-4 h-4 text-[#8c807b]" />
              <input
                type="text"
                placeholder="Search ingredient or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-[#6d615c] focus:outline-none w-full"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-[#8c807b] hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#181516] border border-white/[0.08] text-xs text-[#d0c6bf] px-3 py-2 rounded-xl focus:outline-none focus:border-[#ff5708]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="bg-[#181516] border border-white/[0.08] text-xs text-[#d0c6bf] px-3 py-2 rounded-xl focus:outline-none focus:border-[#ff5708]"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="CRITICAL">Critical</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              {canManage && (
                <button
                  type="button"
                  onClick={() => { setEditingIngredient(null); setIsAddIngredientOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff6c26] text-white text-xs font-bold uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#181516] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8c807b] font-['Syne',sans-serif] uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 font-bold">Ingredient / SKU</th>
                    <th className="p-3.5 font-bold">Category</th>
                    <th className="p-3.5 font-bold text-right">Current Stock</th>
                    <th className="p-3.5 font-bold text-right">Min / Par</th>
                    <th className="p-3.5 font-bold text-right">Cost/Unit</th>
                    <th className="p-3.5 font-bold text-right">Total Value</th>
                    <th className="p-3.5 font-bold text-center">Status</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredIngredients.map((item) => {
                    const statusBadge: Record<string, string> = {
                      IN_STOCK: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                      LOW_STOCK: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                      CRITICAL: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                      OUT_OF_STOCK: 'bg-red-500/20 text-red-300 border-red-500/40',
                    };

                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{item.name}</div>
                          <span className="text-[10px] font-mono text-[#8c807b]">{item.sku} · {item.storageLocation}</span>
                        </td>
                        <td className="p-3.5 text-[#a89d97]">
                          {item.category}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">
                          {item.currentQuantity} <span className="text-[10px] text-[#8c807b] font-normal">{item.unit}</span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-[#a89d97]">
                          {item.minimumQuantity} {item.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono text-[#d0c6bf]">
                          ₹{item.costPerUnit}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">
                          ₹{item.totalValue.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusBadge[item.stockStatus]}`}>
                            {item.stockStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsRecordWastageOpen(true);
                              }}
                              title="Log Wastage"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-[#8c807b] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIngredient(item);
                                  setIsAddIngredientOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-[#ff5708] hover:text-white text-xs font-bold text-[#b5a8a1] transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredIngredients.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#8c807b] text-xs">
                        No ingredients found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BATCHES & FEFO EXPIRY VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'BATCHES' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#181516] border border-white/[0.08]">
            <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ff5708]" />
              <span>FEFO Lot & Expiry Control</span>
            </h3>
            <p className="text-xs text-[#8c807b] mt-1">
              Strict First-Expired, First-Out (FEFO) automated order deduction prioritizes lots closest to expiration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Expiring Today / Tomorrow ({expiringBatches.expiringToday.length})
              </div>
              <div className="mt-3 space-y-2">
                {expiringBatches.expiringToday.map((b) => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-black/40 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{b.ingredientName}</div>
                      <span className="text-[10px] text-red-400 font-mono">Lot {b.batchNumber}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{b.remainingQuantity} {b.unit}</span>
                  </div>
                ))}
                {expiringBatches.expiringToday.length === 0 && (
                  <div className="text-[11px] text-[#8c807b] py-2">No lots expiring today.</div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Expiring in 2-3 Days ({expiringBatches.expiringIn3Days.length})
              </div>
              <div className="mt-3 space-y-2">
                {expiringBatches.expiringIn3Days.map((b) => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-black/40 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{b.ingredientName}</div>
                      <span className="text-[10px] text-orange-400 font-mono">Lot {b.batchNumber}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{b.remainingQuantity} {b.unit}</span>
                  </div>
                ))}
                {expiringBatches.expiringIn3Days.length === 0 && (
                  <div className="text-[11px] text-[#8c807b] py-2">No lots in 3-day warning zone.</div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Healthy Shelf Life ({batches.filter((b) => b.daysUntilExpiry > 7 && b.remainingQuantity > 0).length})
              </div>
              <div className="mt-3 space-y-2">
                {batches.filter((b) => b.daysUntilExpiry > 7 && b.remainingQuantity > 0).slice(0, 4).map((b) => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-black/40 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white truncate max-w-[140px]">{b.ingredientName}</div>
                      <span className="text-[10px] text-emerald-400 font-mono">{b.daysUntilExpiry} days left</span>
                    </div>
                    <span className="font-mono font-bold text-white">{b.remainingQuantity} {b.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-[#181516] border border-white/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8c807b] font-['Syne',sans-serif] uppercase text-[10px]">
                  <th className="p-3.5">Batch / Lot #</th>
                  <th className="p-3.5">Ingredient</th>
                  <th className="p-3.5 text-right">Remaining Stock</th>
                  <th className="p-3.5">Received Date</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-center">Shelf Life Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-mono font-bold text-white">{b.batchNumber}</td>
                    <td className="p-3.5 text-white font-bold">{b.ingredientName}</td>
                    <td className="p-3.5 text-right font-mono text-white font-bold">
                      {b.remainingQuantity} / {b.initialQuantity} {b.unit}
                    </td>
                    <td className="p-3.5 text-[#a89d97] font-mono">{b.receivedDate}</td>
                    <td className="p-3.5 text-white font-mono">{b.expiryDate}</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        b.isExpired 
                          ? 'bg-red-500/20 text-red-300' 
                          : b.isExpiringSoon 
                          ? 'bg-orange-500/20 text-orange-300 animate-pulse' 
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {b.isExpired ? 'EXPIRED' : `${b.daysUntilExpiry} days left`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PURCHASE ORDERS & PROCUREMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'PURCHASE_ORDERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-['Syne',sans-serif]">
              {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPoStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-colors whitespace-nowrap ${
                    poStatusFilter === status ? 'bg-[#ff5708] text-white' : 'bg-[#181516] text-[#8c807b] hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setIsCreatePOOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff6c26] text-white text-xs font-bold uppercase tracking-wider self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseOrders
              .filter((po) => poStatusFilter === 'ALL' || po.status === poStatusFilter)
              .map((po) => {
                const poColors: Record<string, string> = {
                  DRAFT: 'bg-white/10 text-white border-white/20',
                  SUBMITTED: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                  APPROVED: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  ORDERED: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                  PARTIALLY_RECEIVED: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                  RECEIVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                };

                return (
                  <div key={po.id} className="p-4 rounded-2xl bg-[#181516] border border-white/[0.08] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-white">{po.poNumber}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${poColors[po.status] || 'bg-white/10 text-white'}`}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">{po.supplierName}</h4>
                      <p className="text-[11px] text-[#8c807b] mt-0.5">
                        {po.items.length} line items · Expected: {po.expectedDeliveryDate || 'ASAP'}
                      </p>

                      <div className="mt-3 space-y-1 bg-black/40 p-2.5 rounded-xl text-xs">
                        {po.items.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[#d0c6bf]">
                            <span className="truncate max-w-[150px]">{line.ingredientName}</span>
                            <span className="font-mono font-bold">
                              {line.orderedQuantity} {line.unit} (₹{line.totalCost})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#8c807b] block">Total Amount</span>
                        <span className="font-mono font-bold text-sm text-white">₹{po.total.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {canManage && po.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => {
                              inventoryService.updatePurchaseOrderStatus(po.id, 'SUBMITTED', 'Manager');
                              setRefreshKey((k) => k + 1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold uppercase"
                          >
                            Submit
                          </button>
                        )}

                        {canManage && po.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => {
                              inventoryService.updatePurchaseOrderStatus(po.id, 'APPROVED', 'Aditi Rao (Manager)');
                              setRefreshKey((k) => k + 1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold uppercase"
                          >
                            Approve PO
                          </button>
                        )}

                        {canManage && po.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              inventoryService.updatePurchaseOrderStatus(po.id, 'ORDERED', 'Aditi Rao (Manager)');
                              setRefreshKey((k) => k + 1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-bold uppercase"
                          >
                            Dispatch PO
                          </button>
                        )}

                        {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPOForReceiving(po);
                              setIsReceiveStockOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#ff5708] hover:bg-[#ff6c26] text-white text-xs font-bold uppercase shadow-md shadow-[#ff5708]/30 flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Receive</span>
                          </button>
                        )}

                        {po.status === 'RECEIVED' && (
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Fulfilled</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUPPLIERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-4 rounded-2xl bg-[#181516] border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                      Terms: {sup.paymentTerms}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Active Partner</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">{sup.name}</h4>
                  <p className="text-xs text-[#b5a8a1] mt-1">{sup.contactPerson} · {sup.phone}</p>
                  <p className="text-[11px] text-[#8c807b] mt-0.5">{sup.email}</p>
                  <div className="mt-3 text-[11px] text-[#7d716c] bg-black/30 p-2 rounded-xl">
                    GSTIN: {sup.gstNumber || 'Pending'} · Lead time: {sup.leadTimeDays || 2} days
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatePOOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#ff5708]/20 hover:bg-[#ff5708] hover:text-white text-[#ff7a29] text-xs font-bold uppercase transition-colors"
                    >
                      Create PO
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FOOD WASTAGE TRACKER & ANALYTICS */}
      {/* ========================================================================= */}
      {activeSubTab === 'WASTAGE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181516] p-4 rounded-2xl border border-white/[0.08]">
            <div>
              <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white">
                Wastage Log & Loss Control
              </h3>
              <p className="text-xs text-[#8c807b] mt-0.5">
                Every discarded gram affects gross margin. Log spoilage, dropped items, or prep errors.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRecordWastageOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider self-start sm:self-auto shadow-lg shadow-red-500/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Log Food Wastage</span>
            </button>
          </div>

          {/* Wastage Table */}
          <div className="bg-[#181516] border border-white/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8c807b] font-['Syne',sans-serif] uppercase text-[10px]">
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Ingredient & Lot</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5 text-right">Estimated Loss</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Logged By / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {wastageRecords.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 text-[#8c807b] font-mono">
                      {new Date(w.createdAt).toLocaleDateString()} {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{w.ingredientName}</div>
                      {w.batchNumber && <span className="text-[10px] text-[#8c807b] font-mono">Lot {w.batchNumber}</span>}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">
                      {w.quantity} {w.unit}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-red-400">
                      ₹{w.estimatedCost}
                    </td>
                    <td className="p-3.5">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                        {w.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#b5a8a1]">
                      <div className="font-bold text-white text-[11px]">{w.staffName}</div>
                      <span className="text-[10px] text-[#8c807b]">{w.notes || 'No notes provided'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. STOCK TAKE & VARIANCE AUDIT */}
      {/* ========================================================================= */}
      {activeSubTab === 'STOCK_TAKE' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#181516] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-purple-400" />
                <span>Physical Inventory Count & Discrepancy Reconciliation</span>
              </h3>
              <p className="text-xs text-[#8c807b] mt-1">
                Conduct physical counts against current system balances to audit food shrinkage, theft, or portioning variance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsStockTakeOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              Start New Count
            </button>
          </div>

          <div className="bg-[#181516] border border-white/[0.08] rounded-2xl p-6 text-center text-xs text-[#8c807b]">
            <ClipboardCheck className="w-10 h-10 mx-auto text-purple-400/40 mb-2" />
            <div className="text-white font-bold mb-1">Weekly Physical Audit Ready</div>
            Click "Start New Count" to enter floor counts and auto-reconcile variances with stock adjustment entries.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT INGREDIENT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddIngredientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c191a] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white">
                  {editingIngredient ? 'Edit Ingredient' : 'New Ingredient Master'}
                </h3>
                <button onClick={() => setIsAddIngredientOpen(false)} className="text-[#8c807b] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);

                  inventoryService.saveIngredient({
                    id: editingIngredient?.id,
                    name: String(data.get('name')),
                    sku: String(data.get('sku')),
                    category: String(data.get('category')),
                    unit: data.get('unit') as InventoryUnit,
                    currentQuantity: Number(data.get('currentQuantity')),
                    minimumQuantity: Number(data.get('minimumQuantity')),
                    reorderQuantity: Number(data.get('reorderQuantity')),
                    costPerUnit: Number(data.get('costPerUnit')),
                    storageLocation: String(data.get('storageLocation')),
                  });

                  setIsAddIngredientOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[#8c807b] mb-1">Ingredient Name</label>
                  <input
                    name="name"
                    defaultValue={editingIngredient?.name || ''}
                    required
                    placeholder="e.g. Fresh Chicken Wings"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8c807b] mb-1">SKU Code</label>
                    <input
                      name="sku"
                      defaultValue={editingIngredient?.sku || ''}
                      required
                      placeholder="e.g. CHKN-WING-RAW"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8c807b] mb-1">Category</label>
                    <select
                      name="category"
                      defaultValue={editingIngredient?.category || 'Poultry & Meats'}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                    >
                      {categories.filter((c) => c !== 'ALL').map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#8c807b] mb-1">Unit of Measure</label>
                    <select
                      name="unit"
                      defaultValue={editingIngredient?.unit || 'kg'}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="packet">packet</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8c807b] mb-1">Current Stock</label>
                    <input
                      type="number"
                      step="0.1"
                      name="currentQuantity"
                      defaultValue={editingIngredient?.currentQuantity ?? 10}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8c807b] mb-1">Min / Par Stock</label>
                    <input
                      type="number"
                      step="0.1"
                      name="minimumQuantity"
                      defaultValue={editingIngredient?.minimumQuantity ?? 5}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8c807b] mb-1">Cost Per Unit (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      name="costPerUnit"
                      defaultValue={editingIngredient?.costPerUnit ?? 100}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8c807b] mb-1">Storage Location</label>
                    <input
                      name="storageLocation"
                      defaultValue={editingIngredient?.storageLocation || 'Walk-in Cooler'}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddIngredientOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff6c26] text-white font-bold"
                  >
                    Save Ingredient
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: LOG FOOD WASTAGE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRecordWastageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c191a] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-red-400">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white">
                    Log Food Wastage
                  </h3>
                </div>
                <button onClick={() => setIsRecordWastageOpen(false)} className="text-[#8c807b] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);

                  inventoryService.recordWastage({
                    ingredientId: String(data.get('ingredientId')),
                    quantity: Number(data.get('quantity')),
                    reason: data.get('reason') as WastageReason,
                    staffId: 'staff-active',
                    staffName: String(data.get('staffName') || 'Kitchen Staff'),
                    notes: String(data.get('notes') || ''),
                  });

                  setIsRecordWastageOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[#8c807b] mb-1">Ingredient</label>
                  <select
                    name="ingredientId"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.currentQuantity} {ing.unit} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8c807b] mb-1">Wasted Quantity</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      name="quantity"
                      required
                      placeholder="e.g. 1.5"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8c807b] mb-1">Reason</label>
                    <select
                      name="reason"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="SPOILED">Spoiled / Wilted</option>
                      <option value="EXPIRED">Expired Past Date</option>
                      <option value="PREPARATION_ERROR">Preparation Error</option>
                      <option value="SPILLAGE">Spillage / Dropped</option>
                      <option value="DAMAGED">Damaged in Transit</option>
                      <option value="CUSTOMER_RETURN">Customer Return</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#8c807b] mb-1">Staff Member Logging</label>
                  <input
                    name="staffName"
                    defaultValue="Chef Marco"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[#8c807b] mb-1">Incident Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Explain what occurred..."
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordWastageOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
                  >
                    Deduct & Record Loss
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: RECEIVE DELIVERY / PURCHASE ORDER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isReceiveStockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c191a] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-[#ff7a29]">
                  <Truck className="w-4 h-4" />
                  <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white">
                    Receive Goods Delivery
                  </h3>
                </div>
                <button 
                  onClick={() => { setIsReceiveStockOpen(false); setSelectedPOForReceiving(null); }} 
                  className="text-[#8c807b] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedPOForReceiving ? (
                <div className="space-y-4">
                  <div className="bg-black/40 p-3 rounded-xl">
                    <span className="font-mono font-bold text-white text-xs block">{selectedPOForReceiving.poNumber}</span>
                    <span className="text-[11px] text-[#8c807b]">{selectedPOForReceiving.supplierName}</span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const data = new FormData(form);

                      const receivedItems = selectedPOForReceiving.items.map((line) => {
                        const qty = Number(data.get(`qty_${line.ingredientId}`) || line.orderedQuantity);
                        const batchNum = String(data.get(`batch_${line.ingredientId}`) || `LOT-${Date.now().toString(36).toUpperCase()}`);
                        const exp = String(data.get(`exp_${line.ingredientId}`) || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

                        return {
                          ingredientId: line.ingredientId,
                          receivedQuantity: qty,
                          batchNumber: batchNum,
                          expiryDate: exp,
                        };
                      });

                      inventoryService.receivePurchaseOrder({
                        poId: selectedPOForReceiving.id,
                        receivedItems,
                        staffName: 'Chef Marco / Lead Receiving',
                        notes: 'Inspected temperature & quality check OK',
                      });

                      setIsReceiveStockOpen(false);
                      setSelectedPOForReceiving(null);
                      setRefreshKey((k) => k + 1);
                    }}
                    className="space-y-3"
                  >
                    {selectedPOForReceiving.items.map((item) => (
                      <div key={item.ingredientId} className="p-3 bg-black/30 rounded-xl space-y-2 border border-white/5">
                        <div className="font-bold text-white">{item.ingredientName}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-[#8c807b] block">Qty Received ({item.unit})</label>
                            <input
                              type="number"
                              step="0.1"
                              name={`qty_${item.ingredientId}`}
                              defaultValue={item.orderedQuantity - item.receivedQuantity}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#8c807b] block">Batch / Lot #</label>
                            <input
                              name={`batch_${item.ingredientId}`}
                              defaultValue={`LOT-${Date.now().toString(36).slice(-4).toUpperCase()}`}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#8c807b] block">Expiry Date</label>
                            <input
                              type="date"
                              name={`exp_${item.ingredientId}`}
                              defaultValue={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setIsReceiveStockOpen(false); setSelectedPOForReceiving(null); }}
                        className="px-4 py-2 rounded-xl bg-white/5 text-white font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#ff5708] text-white font-bold"
                      >
                        Confirm Goods Receipt
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#8c807b]">Select an open purchase order to check in items:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {purchaseOrders.filter((p) => p.status === 'ORDERED' || p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED').map((po) => (
                      <div
                        key={po.id}
                        onClick={() => setSelectedPOForReceiving(po)}
                        className="p-3 rounded-xl bg-black/40 hover:bg-[#ff5708]/15 border border-white/5 hover:border-[#ff5708]/30 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-mono font-bold text-white">{po.poNumber}</div>
                          <span className="text-[11px] text-[#8c807b]">{po.supplierName}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-[#ff7a29]">
                          Receive →
                        </span>
                      </div>
                    ))}

                    {purchaseOrders.filter((p) => p.status === 'ORDERED' || p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED').length === 0 && (
                      <div className="text-center py-6 text-[#8c807b]">
                        No open purchase orders ready for delivery.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: PHYSICAL STOCK TAKE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isStockTakeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c191a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full space-y-4 text-xs shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-purple-400">
                  <ClipboardCheck className="w-4 h-4" />
                  <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white">
                    Physical Stock Audit & Count Reconciliation
                  </h3>
                </div>
                <button onClick={() => setIsStockTakeOpen(false)} className="text-[#8c807b] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);

                  const items = ingredients.map((ing) => {
                    const phys = Number(data.get(`phys_${ing.id}`) ?? ing.currentQuantity);
                    return {
                      ingredientId: ing.id,
                      physicalQuantity: phys,
                      reason: phys !== ing.currentQuantity ? 'Audit reconciliation' : undefined,
                    };
                  });

                  inventoryService.submitStockTake({
                    performedBy: 'Floor Auditor',
                    approvedBy: 'Aditi Rao (Manager)',
                    items,
                    notes: 'Periodic physical inventory verification',
                  });

                  setIsStockTakeOpen(false);
                  setRefreshKey((k) => k + 1);
                }}
                className="flex-1 flex flex-col justify-between space-y-4 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase text-[#8c807b]">
                        <th className="pb-2">Ingredient</th>
                        <th className="pb-2 text-right">System Balance</th>
                        <th className="pb-2 text-right">Physical Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ingredients.map((ing) => (
                        <tr key={ing.id}>
                          <td className="py-2">
                            <span className="font-bold text-white block">{ing.name}</span>
                            <span className="text-[10px] text-[#8c807b]">{ing.sku}</span>
                          </td>
                          <td className="py-2 text-right font-mono text-[#b5a8a1]">
                            {ing.currentQuantity} {ing.unit}
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              step="0.1"
                              name={`phys_${ing.id}`}
                              defaultValue={ing.currentQuantity}
                              className="w-24 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-right text-white font-mono font-bold"
                            />
                            <span className="ml-1 text-[10px] text-[#8c807b]">{ing.unit}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStockTakeOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold"
                  >
                    Submit Audit & Adjust Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: CREATE PURCHASE ORDER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreatePOOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1c191a] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-sky-400">
                  <FileText className="w-4 h-4" />
                  <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white">
                    Create Purchase Order
                  </h3>
                </div>
                <button onClick={() => setIsCreatePOOpen(false)} className="text-[#8c807b] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);

                  const supplierId = String(data.get('supplierId'));
                  const sup = suppliers.find((s) => s.id === supplierId);
                  const ingredientId = String(data.get('ingredientId'));
                  const ing = ingredients.find((i) => i.id === ingredientId);

                  if (sup && ing) {
                    const qty = Number(data.get('orderedQuantity'));
                    inventoryService.createPurchaseOrder({
                      supplierId: sup.id,
                      supplierName: sup.name,
                      expectedDeliveryDate: String(data.get('expectedDeliveryDate')),
                      notes: String(data.get('notes') || ''),
                      createdBy: 'Aditi Rao (Manager)',
                      items: [
                        {
                          ingredientId: ing.id,
                          ingredientName: ing.name,
                          orderedQuantity: qty,
                          unit: ing.unit,
                          unitCost: ing.costPerUnit,
                        }
                      ],
                    });

                    setIsCreatePOOpen(false);
                    setRefreshKey((k) => k + 1);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[#8c807b] mb-1">Supplier</label>
                  <select
                    name="supplierId"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.paymentTerms})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8c807b] mb-1">Primary Ingredient Line</label>
                  <select
                    name="ingredientId"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} (Stock: {i.currentQuantity} {i.unit} · ₹{i.costPerUnit}/{i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8c807b] mb-1">Order Quantity</label>
                    <input
                      type="number"
                      name="orderedQuantity"
                      defaultValue={30}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8c807b] mb-1">Expected Delivery Date</label>
                    <input
                      type="date"
                      name="expectedDeliveryDate"
                      defaultValue={new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8c807b] mb-1">PO Notes / Special Requirements</label>
                  <textarea
                    name="notes"
                    placeholder="Temperature specs, pallet instructions..."
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatePOOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff6c26] text-white font-bold"
                  >
                    Generate Purchase Order
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
