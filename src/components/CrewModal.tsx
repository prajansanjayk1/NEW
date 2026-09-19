import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Share2, 
  Check, 
  Copy, 
  ShieldCheck,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';
import { CrewMember, SessionParticipant, TableSession } from '../types';
import { DEMO_INITIAL_TABLE_INFO } from '../data/mockData';

interface CrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  crew: CrewMember[];
  participants?: SessionParticipant[];
  session?: TableSession;
  onInviteFriend: (name: string) => void;
}

export const CrewModal: React.FC<CrewModalProps> = ({
  isOpen,
  onClose,
  crew,
  participants = [],
  session,
  onInviteFriend,
}) => {
  const [newFriendName, setNewFriendName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    onInviteFriend(newFriendName.trim());
    setNewFriendName('');
  };

  const token = session?.sessionToken || DEMO_INITIAL_TABLE_INFO.sessionToken;
  const tableNum = session?.tableNumber || DEMO_INITIAL_TABLE_INFO.tableNumber;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://kingsofwings.menu/table${tableNum}?token=${token}`).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Determine list
  const displayMembers = participants.length > 0
    ? participants.map(p => ({
        id: p.id,
        name: p.displayName,
        initials: p.initials,
        color: p.color,
        isHost: p.role === 'HOST',
        itemCount: p.itemCount,
        avatarEmoji: p.avatarEmoji,
      }))
    : crew;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[#1c1b1c] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff5708]/20 flex items-center justify-center text-[#ff5708]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-syne text-base font-black uppercase text-[#e5e2e3]">
                Table {tableNum} Diners
              </h3>
              <span className="font-sans text-[11px] text-[#ac897e]">
                {displayMembers.length} active diners sharing session
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close crew modal"
            className="w-8 h-8 rounded-full bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] flex items-center justify-center text-[#e5e2e3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verified Session Info */}
        <div className="bg-[#201f20] border border-white/[0.05] p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#ffb86d]" />
            <div>
              <span className="font-syne text-xs font-bold text-white uppercase">
                Encrypted Session
              </span>
              <p className="font-sans text-[11px] text-[#ac897e]">
                NFC Tap Verified · Table {tableNum}
              </p>
            </div>
          </div>
          <span className="font-syne text-[11px] font-black text-[#ffdcbd] bg-[#2a2a2b] px-2.5 py-1 rounded-full border border-white/[0.08]">
            {token}
          </span>
        </div>

        {/* Crew List */}
        <div className="space-y-2.5">
          <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider">
            Connected Table Diners
          </label>
          {displayMembers.map((member) => (
            <div
              key={member.id}
              className="p-3 bg-[#201f20] border border-white/[0.05] rounded-2xl flex items-center justify-between hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${member.color} flex items-center justify-center font-syne font-black text-xs shadow-md`}
                >
                  {member.avatarEmoji || member.initials}
                </div>
                <div>
                  <div className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{member.name}</span>
                    {member.isHost && (
                      <span className="px-1.5 py-0.2 rounded bg-[#ff5708]/20 text-[#ff5708] font-syne text-[9px] font-black uppercase flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" />
                        <span>HOST</span>
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-[11px] text-[#ac897e]">
                    {member.itemCount} items ordered in this session
                  </span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
          ))}
        </div>

        {/* Add / Invite Friend Form */}
        <form onSubmit={handleAddFriend} className="pt-1">
          <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider block mb-1">
            Invite Diner to Table {tableNum}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              placeholder="Enter friend's name (e.g. Priya)..."
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#201f20] border border-white/[0.08] text-xs text-white placeholder:text-[#ac897e] focus:outline-none focus:border-[#ff5708]"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-4 rounded-xl bg-[#ff5708] text-[#511500] font-syne text-xs font-black uppercase tracking-wider hover:bg-[#df8600] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </motion.button>
          </div>
        </form>

        {/* One Tap Invite Link */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Share2 className="w-4 h-4 text-[#ffb86d] flex-shrink-0" />
            <span className="font-sans text-xs text-[#ac897e] truncate">
              Share table session link
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 rounded-full bg-[#2a2a2b] hover:bg-[#353436] text-[#e5e2e3] font-syne text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border border-white/[0.08]"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-[#ffb86d]" />
                <span className="text-[#ffb86d]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[#ff5708]" />
                <span>Copy Link</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
