import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Check, 
  X, 
  Lock, 
  Mail, 
  Clock, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StaffProfile, UserRole } from '../../types';
import { staffAuthService } from '../../services/staffAuthService';
import { useStaffAuth } from '../../contexts/StaffAuthContext';

interface StaffTeamViewProps {
  userRole: UserRole;
  currentUserId: string;
}

const ROLES: { role: UserRole; badge: string; desc: string }[] = [
  { role: 'KITCHEN', badge: 'bg-[#ff5708]/20 text-[#ff7a29]', desc: 'Kitchen tickets, station filters, culinary pipeline status.' },
  { role: 'STAFF', badge: 'bg-sky-500/20 text-sky-400', desc: 'Floor orders, table status, customer service requests.' },
  { role: 'MANAGER', badge: 'bg-amber-500/20 text-amber-400', desc: 'All staff operations + menu editing, team invites, analytics.' },
  { role: 'ADMIN', badge: 'bg-purple-500/20 text-purple-400', desc: 'Complete root control, settings, audit logs, billing overrides.' },
];

export const StaffTeamView: React.FC<StaffTeamViewProps> = ({ userRole, currentUserId }) => {
  const { currentStaff } = useStaffAuth();
  const [teamMembers, setTeamMembers] = useState<StaffProfile[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('STAFF');
  const [invitePin, setInvitePin] = useState('2222');
  const [isInviting, setIsInviting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canManageTeam = userRole === 'MANAGER' || userRole === 'ADMIN';

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    const list = await staffAuthService.getStaffMembers('rest-kow-001');
    setTeamMembers(list);
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!canManageTeam || !currentStaff) return;
    const res = await staffAuthService.updateStaffRole(currentStaff, memberId, newRole);
    if (res.success) {
      setFeedback(`Role updated to ${newRole}.`);
      loadTeam();
    } else {
      setFeedback(res.error || 'Failed to update role.');
    }
  };

  const handleToggleActive = async (memberId: string, currentActive: boolean) => {
    if (!canManageTeam || !currentStaff) return;
    if (memberId === currentUserId) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const res = await staffAuthService.toggleStaffActive(currentStaff, memberId, !currentActive);
    if (res.success) {
      loadTeam();
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim() || !currentStaff) return;
    setIsInviting(true);
    setFeedback(null);

    const res = await staffAuthService.inviteStaff(
      currentStaff,
      'rest-kow-001',
      inviteEmail.trim(),
      inviteName.trim(),
      inviteRole
    );

    if (res.success) {
      setFeedback(`Invited ${inviteName} (${inviteRole}). ${res.message || ''}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      loadTeam();
    } else {
      setFeedback(res.error || 'Failed to invite staff member.');
    }
    setIsInviting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ff5708]" />
            <span>Staff & Team Operations</span>
          </h2>
          <p className="text-xs text-[#8f827d]">
            {teamMembers.length} active team profiles • Role-based access control (RBAC)
          </p>
        </div>

        {canManageTeam && (
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors font-['Syne',sans-serif]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-amber-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Role Descriptions Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <div key={r.role} className="p-3 rounded-xl bg-[#161415] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${r.badge}`}>
                {r.role}
              </span>
            </div>
            <p className="text-[11px] text-[#8e827c] leading-relaxed">
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Team Members Table */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#80756f] uppercase text-[10px] font-bold tracking-wider font-['Syne',sans-serif] bg-black/20">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                {canManageTeam && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {teamMembers.map((member) => {
                const isSelf = member.id === currentUserId;
                const roleObj = ROLES.find((r) => r.role === member.role);

                return (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff5708]/30 to-[#b83200]/30 border border-[#ff5708]/40 flex items-center justify-center font-bold text-white font-['Syne',sans-serif]">
                          {member.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{member.displayName}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.2 rounded font-mono">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#786c66] font-mono">
                            ID: {member.id.substring(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#a0948e]">
                      {member.email || 'terminal@kingsofwings.menu'}
                    </td>

                    <td className="py-3.5 px-4">
                      {canManageTeam && !isSelf ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                          className="bg-[#221f20] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff5708]"
                        >
                          <option value="KITCHEN">KITCHEN</option>
                          <option value="STAFF">STAFF</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${roleObj?.badge}`}>
                          {member.role}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                        member.isActive !== false ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{member.isActive !== false ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#8a7f79] text-[11px]">
                      {member.lastActive ? new Date(member.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </td>

                    {canManageTeam && (
                      <td className="py-3.5 px-4 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(member.id, member.isActive !== false)}
                            className="p-1 text-[#8f827d] hover:text-white transition-colors"
                            title={member.isActive !== false ? 'Disable staff access' : 'Enable staff access'}
                          >
                            {member.isActive !== false ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-red-400" />
                            )}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#161415] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white">
                  Invite New Staff Member
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1 rounded-lg bg-white/5 text-[#a0948e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Vikram Singh"
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                    Staff Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="vikram@kingsofwings.menu"
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        setInviteRole(r);
                        setInvitePin(r === 'KITCHEN' ? '1111' : r === 'STAFF' ? '2222' : r === 'MANAGER' ? '3333' : '4444');
                      }}
                      className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
                    >
                      <option value="KITCHEN">KITCHEN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
                      Default PIN / Password
                    </label>
                    <input
                      type="text"
                      required
                      value={invitePin}
                      onChange={(e) => setInvitePin(e.target.value)}
                      className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ff5708]"
                    />
                  </div>
                </div>

                {/* SMTP Notice Card */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>Staff profile will be provisioned in the restaurant team database. If Supabase Custom SMTP is configured, an automated invite email is dispatched immediately; otherwise the default PIN will allow initial login.</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    {isInviting ? 'Inviting...' : 'Send Invitation'}
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
