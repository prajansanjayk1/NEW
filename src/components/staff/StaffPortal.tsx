import React from 'react';
import { StaffLoginPage } from './StaffLoginPage';
import { StaffShell } from './StaffShell';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { useTableSession } from '../../hooks/useTableSession';
import { useOrders } from '../../hooks/useOrders';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { Smartphone, Shield, Crown } from 'lucide-react';

interface StaffPortalProps {
  portalMode: 'staff' | 'admin';
  navigatePortal: (target: 'customer' | 'staff' | 'admin') => void;
}

export function StaffPortal({ portalMode, navigatePortal }: StaffPortalProps) {
  const { isAuthenticated } = useStaffAuth();
  const { restaurant, tables, session, updateTableFloorStatus } = useTableSession();
  const { orders, updateOrderStatus } = useOrders(session.tableNumber);
  const { serviceRequests, acknowledgeServiceRequest, resolveServiceRequest } = useServiceRequests(session.tableNumber, null);

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed top-3 right-4 z-50 flex items-center gap-1.5 bg-[#1c1a1b]/95 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-xl">
          <button
            onClick={() => navigatePortal('customer')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#9d918b] hover:text-white flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            onClick={() => navigatePortal('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              portalMode === 'staff' ? 'bg-[#ff5708] text-white' : 'text-[#9d918b] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Staff (/staff)</span>
          </button>
          <button
            onClick={() => navigatePortal('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              portalMode === 'admin' ? 'bg-purple-600 text-white' : 'text-[#9d918b] hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Admin (/admin)</span>
          </button>
        </div>

        <StaffLoginPage
          portalMode={portalMode}
          onExitToCustomer={() => navigatePortal('customer')}
          onSwitchPortal={(mode) => navigatePortal(mode)}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed top-3 right-20 z-50 hidden sm:flex items-center gap-1.5 bg-[#1c1a1b]/95 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-xl text-xs font-bold font-['Syne',sans-serif]">
        <button
          onClick={() => navigatePortal('customer')}
          className="px-2.5 py-1 rounded-lg text-[#9d918b] hover:text-white flex items-center gap-1"
        >
          <Smartphone className="w-3 h-3 text-[#ff5708]" />
          <span>Customer</span>
        </button>
        <button
          onClick={() => navigatePortal('staff')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
            portalMode === 'staff' ? 'bg-[#ff5708] text-white' : 'text-[#9d918b] hover:text-white'
          }`}
        >
          <span>Staff</span>
        </button>
        <button
          onClick={() => navigatePortal('admin')}
          className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
            portalMode === 'admin' ? 'bg-purple-600 text-white' : 'text-[#9d918b] hover:text-white'
          }`}
        >
          <span>Admin</span>
        </button>
      </div>

      <StaffShell
        restaurant={restaurant}
        orders={orders}
        serviceRequests={serviceRequests}
        tables={tables}
        onUpdateOrderStatus={updateOrderStatus}
        onUpdateTableStatus={updateTableFloorStatus}
        onResolveServiceRequest={resolveServiceRequest}
        onAcknowledgeServiceRequest={acknowledgeServiceRequest}
        onExitToCustomer={() => navigatePortal('customer')}
      />
    </div>
  );
}
