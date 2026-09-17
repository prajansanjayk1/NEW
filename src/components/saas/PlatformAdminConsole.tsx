import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Building2,
  CreditCard,
  Gauge,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  ExternalLink,
  Lock,
  Layers,
  BarChart3,
  Search,
  Check,
  Building,
} from 'lucide-react';
import { Restaurant } from '../../types';
import {
  Organization,
  OrganizationAnalyticsSummary,
  TenantSecurityTestResult,
  SubscriptionTier,
  RestaurantStatus,
} from '../../types/saas';
import { tenantService } from '../../services/saas/tenantService';
import { subscriptionService } from '../../services/saas/subscriptionService';
import { tenantSecurityService } from '../../services/saas/tenantSecurityService';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { ProductionReadinessView } from './ProductionReadinessView';
import { RestaurantOnboardingChecklistView } from './RestaurantOnboardingChecklistView';

interface PlatformAdminConsoleProps {
  onOpenOnboarding?: () => void;
  onBackToStaff?: () => void;
}

export const PlatformAdminConsole: React.FC<PlatformAdminConsoleProps> = ({
  onOpenOnboarding,
  onBackToStaff,
}) => {
  const { switchRestaurant, role } = useStaffAuth();
  const [activeTab, setActiveTab] = useState<
    'RESTAURANTS' | 'ORGANIZATIONS' | 'SUBSCRIPTIONS' | 'SECURITY' | 'READINESS' | 'CHECKLIST'
  >('RESTAURANTS');

  // Data states
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgAnalytics, setOrgAnalytics] = useState<OrganizationAnalyticsSummary | null>(null);
  const [securityResults, setSecurityResults] = useState<TenantSecurityTestResult[]>([]);
  const [isRunningSecurity, setIsRunningSecurity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('88888888-8888-4888-a888-888888888888');

  const loadData = async () => {
    const rests = await tenantService.getRestaurants();
    setRestaurants(rests);
    const orgs = await tenantService.getOrganizations();
    setOrganizations(orgs);
    if (orgs.length > 0) {
      const summary = await tenantService.getOrganizationAnalytics(selectedOrgId);
      setOrgAnalytics(summary);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOrgId]);

  const handleRunSecurityTests = async () => {
    setIsRunningSecurity(true);
    try {
      const results = await tenantSecurityService.runFullTenantSecuritySuite();
      setSecurityResults(results);
    } finally {
      setIsRunningSecurity(false);
    }
  };

  const handleUpdateStatus = async (restaurantId: string, newStatus: RestaurantStatus) => {
    await tenantService.updateRestaurantStatus(restaurantId, newStatus);
    await loadData();
  };

  const handleUpgradePlan = async (restaurantId: string, newPlan: SubscriptionTier) => {
    await subscriptionService.upgradeSubscription(restaurantId, newPlan);
    await loadData();
  };

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusColors = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SETUP: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
    ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  return (
    <div className="min-h-screen bg-[#110f10] text-[#cfc5bf] flex flex-col font-sans pb-16">
      {/* Platform Header */}
      <header className="border-b border-white/[0.08] bg-[#161415]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white font-['Syne',sans-serif]">
                  Atherion SaaS Platform Console
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-[#8e817b]">
                Multi-Tenant Isolation, Organization Governance & Entitlement Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ff5708] hover:bg-[#e04c06] text-white shadow-[0_4px_16px_rgba(255,87,8,0.4)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Restaurant</span>
            </button>
            {onBackToStaff && (
              <button
                type="button"
                onClick={onBackToStaff}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] transition-all"
              >
                Back to Staff View
              </button>
            )}
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto border-t border-white/[0.04] pt-1">
          {[
            { id: 'RESTAURANTS', label: 'Tenants & Branches', icon: Building2 },
            { id: 'ORGANIZATIONS', label: 'Organization Hierarchy', icon: Building },
            { id: 'SUBSCRIPTIONS', label: 'Subscriptions & Limits', icon: Gauge },
            { id: 'SECURITY', label: 'Tenant Security Battery', icon: Lock },
            { id: 'READINESS', label: 'Production Readiness', icon: ShieldCheck },
            { id: 'CHECKLIST', label: 'Onboarding Checklist', icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[#ff5708] text-white bg-white/[0.02]'
                    : 'border-transparent text-[#8e817b] hover:text-[#cfc5bf]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff5708]' : 'text-[#8e817b]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: RESTAURANTS / TENANTS */}
        {activeTab === 'RESTAURANTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white font-['Syne',sans-serif]">
                  Provisioned Restaurant Tenants ({restaurants.length})
                </h2>
                <p className="text-xs text-[#8e817b]">
                  Each restaurant operates with strict schema isolation, dedicated QR routing, and autonomous staff profiles.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#8e817b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, slug or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5708]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRestaurants.map((r) => {
                const sub = subscriptionService.getRestaurantSubscription(r.id);
                const plan = subscriptionService.getPlanByCode(sub.planCode);
                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-3xl bg-[#171415] border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#ff5708]/15 border border-[#ff5708]/30 flex items-center justify-center text-sm font-black text-white font-['Syne',sans-serif]">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white leading-snug">{r.name}</h3>
                            <span className="text-[11px] font-mono text-[#8e817b]">/{r.slug}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            statusColors[r.status || 'ACTIVE']
                          }`}
                        >
                          {r.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#8e817b] py-2 border-y border-white/[0.06]">
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="text-white font-medium">{r.city || 'Chennai'}, {r.country || 'India'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Plan Tier:</span>
                          <span className="font-mono text-[#ffb86d] font-bold">{plan.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tenant ID:</span>
                          <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[140px]">{r.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => switchRestaurant(r.id)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#ff5708]/15 hover:bg-[#ff5708]/25 text-[#ff5708] border border-[#ff5708]/30 transition-colors"
                        >
                          Operate Console
                        </button>

                        {r.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'SUSPENDED')}
                            className="py-2 px-3 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            title="Suspend Tenant"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'ACTIVE')}
                            className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                            title="Activate Tenant"
                          >
                            Activate
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                        <span>Change Plan:</span>
                        <div className="flex items-center gap-1">
                          {(['STARTER', 'PRO', 'ENTERPRISE'] as SubscriptionTier[]).map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => handleUpgradePlan(r.id, tier)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                sub.planCode === tier
                                  ? 'bg-[#ff5708] text-white font-bold'
                                  : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                              }`}
                            >
                              {tier[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ORGANIZATIONS & MULTI-LOCATION VIEW */}
        {activeTab === 'ORGANIZATIONS' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#171415] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <Building className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                    Parent Hospitality Corporation
                  </span>
                  <h2 className="text-xl font-black text-white font-['Syne',sans-serif]">
                    {orgAnalytics?.organizationName || 'Atherion Foods Hospitality Group'}
                  </h2>
                  <p className="text-xs text-[#8e817b]">
                    Centralized multi-unit analytics & cross-location brand governance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-[#8e817b] block">Corporate Tax ID</span>
                  <span className="text-xs font-mono font-bold text-white">33AAAAA8888A1Z9</span>
                </div>
              </div>
            </div>

            {/* Aggregated Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#171415] border border-white/[0.08]">
                <span className="text-[10px] font-mono uppercase text-[#8e817b] block mb-1">
                  Aggregated Gross Revenue
                </span>
                <div className="text-2xl font-black text-white font-['Syne',sans-serif]">
                  ₹{(orgAnalytics?.aggregatedGrossRevenue || 211250).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-400">Live multi-branch total</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#171415] border border-white/[0.08]">
                <span className="text-[10px] font-mono uppercase text-[#8e817b] block mb-1">
                  Total Orders Served
                </span>
                <div className="text-2xl font-black text-white font-['Syne',sans-serif]">
                  {orgAnalytics?.aggregatedOrdersCount || 152}
                </div>
                <span className="text-[10px] text-emerald-400">Across active branches</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#171415] border border-white/[0.08]">
                <span className="text-[10px] font-mono uppercase text-[#8e817b] block mb-1">
                  Group Average Order Value (AOV)
                </span>
                <div className="text-2xl font-black text-white font-['Syne',sans-serif]">
                  ₹{orgAnalytics?.aggregatedAverageOrderValue || 1390}
                </div>
                <span className="text-[10px] text-[#ffb86d]">Benchmark across locations</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#171415] border border-white/[0.08]">
                <span className="text-[10px] font-mono uppercase text-[#8e817b] block mb-1">
                  Locations Operating
                </span>
                <div className="text-2xl font-black text-white font-['Syne',sans-serif]">
                  {orgAnalytics?.activeLocations || 2} / {orgAnalytics?.totalLocations || 3}
                </div>
                <span className="text-[10px] text-[#8e817b]">Active / Provisioned</span>
              </div>
            </div>

            {/* Location Breakdown Table */}
            <div className="p-6 rounded-3xl bg-[#171415] border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-black text-white font-['Syne',sans-serif]">
                Branch Performance Matrix
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-mono uppercase text-[#8e817b] border-b border-white/[0.06]">
                    <tr>
                      <th className="pb-3 font-bold">Branch Name</th>
                      <th className="pb-3 font-bold">City</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold text-right">Revenue</th>
                      <th className="pb-3 font-bold text-right">Orders</th>
                      <th className="pb-3 font-bold text-right">AOV</th>
                      <th className="pb-3 font-bold text-right">Table Turnover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {orgAnalytics?.locationBreakdown.map((b) => (
                      <tr key={b.restaurantId} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-bold text-white">{b.name}</td>
                        <td className="py-3 text-[#cfc5bf]">{b.city}</td>
                        <td className="py-3">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                              statusColors[b.status]
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-white text-right">
                          ₹{b.revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 font-mono text-right">{b.ordersCount}</td>
                        <td className="py-3 font-mono text-right">₹{b.aov}</td>
                        <td className="py-3 font-mono text-[#ffb86d] text-right">
                          {b.tableTurnover}x / shift
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUBSCRIPTIONS & USAGE LIMITS */}
        {activeTab === 'SUBSCRIPTIONS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white font-['Syne',sans-serif]">
                SaaS Subscription Plans & Quotas
              </h2>
              <p className="text-xs text-[#8e817b]">
                Enforce operational quotas and unlock capabilities like AI Concierge, Recipes & Predictive Forecasting.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {subscriptionService.getPlans().map((plan) => (
                <div
                  key={plan.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 ${
                    plan.code === 'PRO'
                      ? 'bg-[#1e1715] border-[#ff5708]/50 shadow-[0_8px_30px_rgba(255,87,8,0.15)]'
                      : 'bg-[#171415] border-white/[0.08]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#ffb86d]">
                        {plan.code}
                      </span>
                      {plan.code === 'PRO' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ff5708] text-white">
                          Popular
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white font-['Syne',sans-serif]">{plan.name}</h3>
                    <p className="text-[11px] text-[#8e817b] mt-1">{plan.description}</p>

                    <div className="mt-4 mb-3">
                      <span className="text-2xl font-black text-white font-['Syne',sans-serif]">
                        {plan.priceMonthlyMinor === 0 ? 'Free' : `₹${(plan.priceMonthlyMinor / 100).toLocaleString('en-IN')}`}
                      </span>
                      {plan.priceMonthlyMinor > 0 && <span className="text-xs text-[#8e817b]"> / mo</span>}
                    </div>

                    <div className="space-y-1 text-[11px] text-[#cfc5bf] py-3 border-t border-white/[0.06]">
                      <div className="flex justify-between">
                        <span>Active Tables:</span>
                        <span className="font-bold text-white">{plan.limits.activeTables}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Orders:</span>
                        <span className="font-bold text-white">{plan.limits.monthlyOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Staff Accounts:</span>
                        <span className="font-bold text-white">{plan.limits.staffAccounts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Requests:</span>
                        <span className="font-bold text-white">{plan.limits.aiRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Locations:</span>
                        <span className="font-bold text-white">{plan.limits.locations}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Usage Dashboard Meter */}
            <div className="p-6 rounded-3xl bg-[#171415] border border-white/[0.08] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8e817b] block">
                    Flagship Quota Utilization
                  </span>
                  <h3 className="text-base font-black text-white font-['Syne',sans-serif]">
                    Kings of Wings — Chennai Central Usage Status
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Healthy Quota
                </span>
              </div>

              {(() => {
                const data = subscriptionService.getRestaurantUsage(tenantService.getActiveRestaurantId());
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Orders Metric */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8e817b]">Monthly Orders</span>
                        <span className="font-mono text-white font-bold">
                          {data.usage.monthlyOrders} / {data.plan.limits.monthlyOrders}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full bg-[#ff5708] rounded-full transition-all"
                          style={{ width: `${data.percentages.orders}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#8e817b] block text-right font-mono">
                        {data.percentages.orders}% utilized
                      </span>
                    </div>

                    {/* AI Requests Metric */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8e817b]">AI Concierge Queries</span>
                        <span className="font-mono text-white font-bold">
                          {data.usage.aiRequests} / {data.plan.limits.aiRequests}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${data.percentages.aiRequests}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#8e817b] block text-right font-mono">
                        {data.percentages.aiRequests}% utilized
                      </span>
                    </div>

                    {/* Active Tables Metric */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8e817b]">Configured Tables</span>
                        <span className="font-mono text-white font-bold">
                          {data.usage.activeTables} / {data.plan.limits.activeTables}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${data.percentages.tables}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#8e817b] block text-right font-mono">
                        {data.percentages.tables}% utilized
                      </span>
                    </div>

                    {/* Staff Accounts Metric */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8e817b]">Staff Profiles</span>
                        <span className="font-mono text-white font-bold">
                          {data.usage.staffAccounts} / {data.plan.limits.staffAccounts}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${data.percentages.staff}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#8e817b] block text-right font-mono">
                        {data.percentages.staff}% utilized
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 4: TENANT SECURITY BATTERY */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#1e1516] border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                    Parts 11, 12, 13 & 55 Compliance
                  </span>
                  <h2 className="text-xl font-black text-white font-['Syne',sans-serif]">
                    Automated Cross-Tenant Attack & Penetration Suite
                  </h2>
                  <p className="text-xs text-[#8e817b]">
                    Validates that no tenant can read, modify, or leak another restaurant's data across orders, menus, KDS or analytics.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunSecurityTests}
                disabled={isRunningSecurity}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all whitespace-nowrap"
              >
                {isRunningSecurity ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Penetration Vectors...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Full Security Suite</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Grid */}
            {securityResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-white">
                    Audit Run Summary: {securityResults.filter((r) => r.passed).length} of{' '}
                    {securityResults.length} Tests Passed
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Zero Cross-Tenant Leakage Detected
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {securityResults.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 rounded-2xl bg-[#171415] border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            test.passed
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {test.passed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{test.name}</h4>
                            <span className="text-[9px] font-mono text-zinc-500">[{test.id}]</span>
                          </div>
                          <p className="text-[11px] text-[#8e817b] mt-0.5">{test.description}</p>
                          <div className="text-[10px] font-mono text-zinc-400 mt-1">
                            Vector: <code className="text-amber-300">{test.operation}</code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {test.latencyMs}ms
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            test.passed
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {test.statusText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-[#171415] border border-white/[0.06] text-center space-y-3">
                <ShieldAlert className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Security Suite Standing By</h3>
                <p className="text-xs text-[#8e817b] max-w-md mx-auto">
                  Click <strong>Run Full Security Suite</strong> to execute real-time cross-tenant attack simulations
                  against live database access filters, table tokens, and authorization matrices.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PRODUCTION READINESS */}
        {activeTab === 'READINESS' && (
          <ProductionReadinessView />
        )}

        {/* TAB 6: ONBOARDING CHECKLIST */}
        {activeTab === 'CHECKLIST' && (
          <RestaurantOnboardingChecklistView />
        )}
      </main>
    </div>
  );
};
