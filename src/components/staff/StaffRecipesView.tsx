import React, { useState, useEffect, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Sliders, 
  Info, 
  Percent, 
  Layers, 
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe, Ingredient, UserRole } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { MENU_ITEMS } from '../../data/mockData';

interface StaffRecipesViewProps {
  userRole: UserRole;
  onNavigateToInventory?: () => void;
}

export const StaffRecipesView: React.FC<StaffRecipesViewProps> = ({ 
  userRole,
  onNavigateToInventory 
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [autoMenuAvailability, setAutoMenuAvailability] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit form state
  const [recipeName, setRecipeName] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(250);
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredientId: string; quantity: number; unit: string; costPerPortion: number }>>([]);

  useEffect(() => {
    const list = inventoryService.getRecipes();
    const ingList = inventoryService.getIngredients();
    setRecipes(list);
    setIngredients(ingList);
    setAutoMenuAvailability(inventoryService.getAutoMenuAvailability());
    if (list.length > 0 && !selectedRecipe) {
      setSelectedRecipe(list[0]);
    }
  }, [refreshKey]);

  // When selected recipe changes, prefill edit state
  useEffect(() => {
    if (selectedRecipe) {
      setRecipeName(selectedRecipe.name);
      setSellingPrice(selectedRecipe.sellingPrice || 250);
      setRecipeItems(
        selectedRecipe.items.map((it) => ({
          ingredientId: it.ingredientId,
          quantity: it.quantity,
          unit: it.unit,
          costPerPortion: it.costPerPortion,
        }))
      );
    }
  }, [selectedRecipe]);

  const profitabilityList = useMemo(() => {
    return inventoryService.getMenuProfitability();
  }, [recipes, refreshKey]);

  // Dynamic live calculation of food cost for the recipe being edited
  const calculatedLiveCost = useMemo(() => {
    let sum = 0;
    recipeItems.forEach((line) => {
      const ing = ingredients.find((i) => i.id === line.ingredientId);
      if (ing) {
        sum += ing.costPerUnit * line.quantity;
      }
    });
    return Number(sum.toFixed(2));
  }, [recipeItems, ingredients]);

  const calculatedFoodCostPct = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return Number(((calculatedLiveCost / sellingPrice) * 100).toFixed(1));
  }, [calculatedLiveCost, sellingPrice]);

  const calculatedMargin = useMemo(() => {
    return Number((sellingPrice - calculatedLiveCost).toFixed(2));
  }, [sellingPrice, calculatedLiveCost]);

  const canManage = userRole === 'MANAGER' || userRole === 'ADMIN';

  const handleSaveRecipe = () => {
    if (!selectedRecipe) return;

    inventoryService.saveRecipe({
      ...selectedRecipe,
      name: recipeName,
      sellingPrice: Number(sellingPrice),
      items: recipeItems.map((line) => {
        const ing = ingredients.find((i) => i.id === line.ingredientId);
        return {
          ingredientId: line.ingredientId,
          ingredientName: ing?.name || 'Ingredient',
          quantity: Number(line.quantity),
          unit: (ing?.unit || line.unit) as any,
          costPerPortion: ing ? Number((ing.costPerUnit * line.quantity).toFixed(2)) : line.costPerPortion,
        };
      }),
    });

    setIsEditing(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-['Syne',sans-serif] uppercase tracking-wider text-white">
              Recipe Master & Food Costing
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff5708]/20 text-[#ff7a29] border border-[#ff5708]/30 font-bold uppercase">
              Margin Optimization
            </span>
          </div>
          <p className="text-xs text-[#9e9089] mt-1">
            Ingredient bill of materials (BOM), portion costing, food cost % targets, and automated stock consumption.
          </p>
        </div>

        {/* Manager Toggle: Auto Menu Availability */}
        {canManage && (
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#181516] border border-white/[0.08]">
            <div className="text-right">
              <span className="text-xs font-bold text-white block">Auto 86 / Out of Stock</span>
              <span className="text-[10px] text-[#8c807b]">
                Hide item if core ingredient is 0
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !autoMenuAvailability;
                setAutoMenuAvailability(next);
                inventoryService.setAutoMenuAvailability(next);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoMenuAvailability ? 'bg-[#ff5708]' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  autoMenuAvailability ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* TWO COLUMN WORKSPACE: RECIPE LIST & DETAIL CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Items & Recipes (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8c807b] font-bold uppercase tracking-wider font-['Syne',sans-serif]">
            <span>Configured Recipes ({recipes.length})</span>
            {onNavigateToInventory && (
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="text-[#ff7a29] hover:underline flex items-center gap-1"
              >
                <span>Inventory Master</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {recipes.map((r) => {
              const isSelected = selectedRecipe?.id === r.id;
              const isHighCost = (r.foodCostPercentage || 0) > 38;

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRecipe(r);
                    setIsEditing(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#221f20] border-[#ff5708] shadow-[0_4px_20px_rgba(255,87,8,0.2)]'
                      : 'bg-[#181516] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">{r.name}</h3>
                    <span className="font-mono font-bold text-xs text-white">₹{r.sellingPrice}</span>
                  </div>

                  <p className="text-[11px] text-[#8c807b] line-clamp-1 mt-1">{r.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8c807b]">
                      Food Cost: <strong className="text-white">₹{r.totalFoodCost}</strong>
                    </span>

                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isHighCost ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {r.foodCostPercentage}% Cost
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recipe Detail & Portion Costing Calculator (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRecipe ? (
            <div className="bg-[#181516] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6">
              {/* Recipe Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-['Syne',sans-serif] font-black text-lg text-white uppercase">
                    {selectedRecipe.name}
                  </h2>
                  <p className="text-xs text-[#8c807b] mt-0.5">
                    Menu Mapping: <span className="font-mono text-[#ff7a29] font-bold">{selectedRecipe.menuItemId}</span> · Portions: 1
                  </p>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                      isEditing ? 'bg-white/10 text-white' : 'bg-[#ff5708] text-white shadow-md shadow-[#ff5708]/20'
                    }`}
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Recipe BOM'}
                  </button>
                )}
              </div>

              {/* Financial Performance KPI Ribbon */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div>
                  <span className="text-[10px] text-[#8c807b] font-bold uppercase block">Selling Price</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-24 bg-black/60 border border-white/20 rounded px-1.5 py-0.5 text-sm font-mono font-bold text-white mt-1"
                    />
                  ) : (
                    <span className="text-lg font-mono font-bold text-white mt-1 block">₹{selectedRecipe.sellingPrice}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-[#8c807b] font-bold uppercase block">Total Food Cost</span>
                  <span className="text-lg font-mono font-bold text-white mt-1 block">
                    ₹{isEditing ? calculatedLiveCost : selectedRecipe.totalFoodCost}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[#8c807b] font-bold uppercase block">Est. Gross Margin</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      ₹{isEditing ? calculatedMargin : selectedRecipe.estimatedGrossMargin}
                    </span>
                    <span className="text-xs font-mono text-[#8c807b]">
                      ({isEditing ? calculatedFoodCostPct : selectedRecipe.foodCostPercentage}% cost)
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Ingredients Bill of Materials (BOM) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-['Syne',sans-serif] font-bold text-xs uppercase text-white tracking-wider">
                    Ingredient Components ({recipeItems.length})
                  </h4>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const firstIng = ingredients[0];
                        if (firstIng) {
                          setRecipeItems([
                            ...recipeItems,
                            { ingredientId: firstIng.id, quantity: 0.1, unit: firstIng.unit, costPerPortion: firstIng.costPerUnit * 0.1 },
                          ]);
                        }
                      }}
                      className="text-xs text-[#ff7a29] font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Ingredient Line</span>
                    </button>
                  )}
                </div>

                <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-black/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8c807b] font-['Syne',sans-serif] uppercase text-[10px]">
                        <th className="p-3">Ingredient</th>
                        <th className="p-3 text-right">Quantity / Unit</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right">Portion Cost</th>
                        {isEditing && <th className="p-3 text-center">Remove</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {recipeItems.map((line, idx) => {
                        const ing = ingredients.find((i) => i.id === line.ingredientId);
                        const cost = ing ? Number((ing.costPerUnit * line.quantity).toFixed(2)) : line.costPerPortion;

                        return (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              {isEditing ? (
                                <select
                                  value={line.ingredientId}
                                  onChange={(e) => {
                                    const nextId = e.target.value;
                                    const newIng = ingredients.find((i) => i.id === nextId);
                                    const updated = [...recipeItems];
                                    updated[idx] = {
                                      ...updated[idx],
                                      ingredientId: nextId,
                                      unit: newIng?.unit || 'kg',
                                    };
                                    setRecipeItems(updated);
                                  }}
                                  className="bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-xs"
                                >
                                  {ingredients.map((i) => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-bold text-white">{ing?.name || 'Component'}</span>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.quantity}
                                  onChange={(e) => {
                                    const updated = [...recipeItems];
                                    updated[idx].quantity = Number(e.target.value);
                                    setRecipeItems(updated);
                                  }}
                                  className="w-20 bg-black/60 border border-white/10 rounded px-2 py-1 text-right text-white font-mono"
                                />
                              ) : (
                                <span className="font-mono text-white font-bold">{line.quantity} {line.unit}</span>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono text-[#8c807b]">
                              ₹{ing?.costPerUnit || 0}/{line.unit}
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-white">
                              ₹{cost}
                            </td>

                            {isEditing && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRecipeItems(recipeItems.filter((_, i) => i !== idx));
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Button during editing */}
              {isEditing && (
                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecipe}
                    className="px-4 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff6c26] text-white font-bold text-xs"
                  >
                    Save Recipe Changes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#181516] border border-white/[0.08] rounded-2xl p-12 text-center text-xs text-[#8c807b]">
              Select a recipe from the list to view portion costing and ingredients BOM.
            </div>
          )}
        </div>
      </div>

      {/* MENU PROFITABILITY TABLE */}
      <div className="space-y-3 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <h3 className="font-['Syne',sans-serif] font-bold text-sm uppercase text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Menu Profitability & Contribution Matrix</span>
          </h3>
          <span className="text-xs text-[#8c807b]">Live recipe cost vs selling price analytics</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8c807b] font-['Syne',sans-serif] uppercase text-[10px]">
                <th className="p-3.5 font-bold">Item Name</th>
                <th className="p-3.5 font-bold text-right">Selling Price</th>
                <th className="p-3.5 font-bold text-right">Food Cost</th>
                <th className="p-3.5 font-bold text-right">Food Cost %</th>
                <th className="p-3.5 font-bold text-right">Unit Margin</th>
                <th className="p-3.5 font-bold text-right">Units Sold</th>
                <th className="p-3.5 font-bold text-right">Total Est. Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {profitabilityList.map((item) => (
                <tr key={item.menuItemId} className="hover:bg-white/[0.02]">
                  <td className="p-3.5 font-bold text-white">{item.name}</td>
                  <td className="p-3.5 text-right font-mono text-white">₹{item.sellingPrice}</td>
                  <td className="p-3.5 text-right font-mono text-[#d0c6bf]">₹{item.foodCost}</td>
                  <td className="p-3.5 text-right font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.foodCostPercentage > 38 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.foodCostPercentage}%
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                    ₹{item.estimatedGrossMargin}
                  </td>
                  <td className="p-3.5 text-right font-mono text-white">
                    {item.ordersCount} orders
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                    ₹{item.totalEstimatedMargin.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
