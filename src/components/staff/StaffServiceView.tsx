import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  Check, 
  AlertCircle, 
  User, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { ServiceRequest, ServiceRequestStatus, UserRole } from '../../types';

interface StaffServiceViewProps {
  serviceRequests: ServiceRequest[];
  onAcknowledgeRequest?: (id: string) => void;
  onResolveRequest: (id: string) => void;
  userRole: UserRole;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Requests', value: 'ALL' },
  { label: 'Pending / Action Needed', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'COMPLETED' },
];

export const StaffServiceView: React.FC<StaffServiceViewProps> = ({
  serviceRequests,
  onAcknowledgeRequest,
  onResolveRequest,
  userRole,
}) => {
  const [filter, setFilter] = useState<string>('PENDING');

  const filtered = serviceRequests.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return r.status === 'REQUESTED' || r.status === 'IN_PROGRESS';
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#ff5708]" />
            <span>Service Request Center</span>
          </h2>
          <p className="text-xs text-[#8f827d]">
            Live table calls from dining room guests
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((f) => {
            const isActive = filter === f.value;
            const count = f.value === 'ALL' ? serviceRequests.length :
              f.value === 'PENDING' ? serviceRequests.filter((r) => r.status !== 'COMPLETED').length :
              serviceRequests.filter((r) => r.status === f.value).length;

            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#ff5708] text-white'
                    : 'bg-[#181516] hover:bg-[#221f20] text-[#a0948e] border border-white/[0.06]'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-[#857974]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Request Cards */}
      {filtered.length === 0 ? (
        <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne',sans-serif]">
            All Calls Handled
          </h3>
          <p className="text-xs text-[#8f827d] mt-1">
            No active service requests match the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((req) => {
            const isCompleted = req.status === 'COMPLETED';
            const isRequested = req.status === 'REQUESTED';
            const isInProgress = req.status === 'IN_PROGRESS';

            return (
              <div
                key={req.id}
                className={`bg-[#181516] border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  isRequested ? 'border-[#ff5708]/60 bg-[#211612]' :
                  isInProgress ? 'border-amber-500/40 bg-[#1e1a17]' :
                  'border-white/[0.06] opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{req.icon || '🛎️'}</span>
                      <div>
                        <div className="font-['Syne',sans-serif] font-black text-sm text-white">
                          Table {req.tableNumber} • {req.title}
                        </div>
                        <span className="text-[11px] text-[#8c807b]">
                          {req.requestedAt} • {req.requestedByParticipantName || 'Guest'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      isRequested ? 'bg-[#ff5708] text-white animate-pulse' :
                      isInProgress ? 'bg-amber-500 text-black' :
                      'bg-white/10 text-[#8e827d]'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-[#b8aba4] p-2.5 rounded-lg bg-black/20 border border-white/[0.04] my-2.5">
                      "{req.description}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  {isRequested && onAcknowledgeRequest && (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => onResolveRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 font-['Syne',sans-serif]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  {isCompleted && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed at {req.resolvedAt || 'Earlier'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
