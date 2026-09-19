/**
 * TableSessionContext
 *
 * Single authoritative context for the active table session in the customer flow.
 * Handles: session creation/join, participant management, Supabase Realtime subscriptions.
 *
 * Session phases:
 *   LOADING → checking if session exists
 *   AUTH    → needs Supabase Auth (redirected from CustomerEntryPage)
 *   JOIN    → presenting the "join table" choice to user
 *   ACTIVE  → session live, customer is participating
 *   CLOSED  → session ended
 *   ERROR   → unrecoverable failure
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  TableSession,
  SessionParticipant,
  SessionStatus,
  RestaurantTable,
} from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import { restaurantDataService } from '../services/restaurantDataService';
import { realtimeService } from '../services/realtimeService';
import { sessionStorageService } from '../services/sessionStorageService';
import { getStoredEntryContext } from '../services/entryService';

export type SessionPhase =
  | 'LOADING'
  | 'AUTH_REQUIRED'
  | 'JOIN'
  | 'ACTIVE'
  | 'CLOSED'
  | 'ERROR';

interface TableSessionContextValue {
  session: TableSession | null;
  participants: SessionParticipant[];
  currentParticipant: SessionParticipant | null;
  table: RestaurantTable | null;
  sessionPhase: SessionPhase;
  phaseError: string | null;
  participantCount: number;
  isLoadingJoin: boolean;

  /** Join or re-join the current session */
  joinSession: (displayName: string, avatarEmoji?: string) => Promise<void>;
  /** Refresh session from backend */
  refreshSession: () => Promise<void>;
  /** Update session status (for staff/internal use) */
  updateStatus: (status: SessionStatus) => Promise<void>;
  /** Reset — used after session close or on error */
  resetSession: () => void;
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null);

interface TableSessionProviderProps {
  children: ReactNode;
  restaurantId?: string;
  tableId?: string;
  /** Pass in the pre-resolved table info from the entry flow */
  initialTable?: RestaurantTable | null;
}

export function TableSessionProvider({
  children,
  restaurantId: propRestaurantId,
  tableId: propTableId,
  initialTable,
}: TableSessionProviderProps) {
  // Resolve IDs from props → stored entry context
  const { restaurantId, tableId } = (() => {
    if (propRestaurantId && propTableId) {
      return { restaurantId: propRestaurantId, tableId: propTableId };
    }
    const ctx = getStoredEntryContext();
    return {
      restaurantId: ctx?.restaurantId || propRestaurantId || '',
      tableId: ctx?.tableId || propTableId || '',
    };
  })();

  const [session, setSession] = useState<TableSession | null>(() =>
    sessionStorageService.loadSession()
  );
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<SessionParticipant | null>(() =>
    sessionStorageService.loadParticipant()
  );
  const [table, setTable] = useState<RestaurantTable | null>(initialTable || null);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('LOADING');
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const initialized = useRef(false);

  /**
   * Load/check existing session from Supabase or sessionStorage.
   */
  const initializeSession = useCallback(async () => {
    if (!restaurantId || !tableId) {
      setSessionPhase('ERROR');
      setPhaseError('Missing restaurant or table context. Please scan the QR code again.');
      return;
    }

    // First check if we have a valid stored session
    const stored = sessionStorageService.loadSession();
    const storedParticipant = sessionStorageService.loadParticipant();

    if (stored && stored.restaurantId === restaurantId && stored.tableId === tableId) {
      // Check session is still active
      if (['ACTIVE', 'ORDERING', 'KITCHEN_PROCESSING', 'BILLING'].includes(stored.status)) {
        setSession(stored);
        if (storedParticipant) {
          setCurrentParticipant(storedParticipant);
          setParticipants(stored.participants || []);
          setSessionPhase('ACTIVE');
          return;
        }
      }
      if (stored.status === 'CLOSED' || stored.status === 'EXPIRED') {
        setSession(stored);
        setSessionPhase('CLOSED');
        return;
      }
    }

    // No valid stored session — need to check auth then create/join
    const supabase = getSupabaseClient();
    if (!supabase) {
      // DEMO_MODE: skip auth requirement, go directly to JOIN phase
      setSessionPhase('JOIN');
      return;
    }

    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) {
      setSessionPhase('AUTH_REQUIRED');
      return;
    }

    // Auth exists — check for active session
    try {
      const { data, error } = await supabase.rpc('get_or_create_active_table_session', {
        p_restaurant_id: restaurantId,
        p_table_id: tableId,
        p_user_id: authSession.user.id,
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to get session');
      }

      const newSession: TableSession = {
        id: data.session_id,
        restaurantId: data.restaurant_id,
        tableId: data.table_id,
        tableNumber: data.table_number || '?',
        sessionToken: data.session_id,
        status: data.status as SessionStatus,
        createdAt: data.created_at,
        expiresAt: '',
        participants: [],
        currentOrderIds: [],
      };

      setSession(newSession);
      sessionStorageService.saveSession(newSession);

      // If participant count > 0, show JOIN prompt; else auto-proceed with join
      if (data.participant_count > 0) {
        setSessionPhase('JOIN');
      } else {
        // First person: auto-join with display name from auth
        const userName = authSession.user.user_metadata?.full_name ||
          authSession.user.email?.split('@')[0] ||
          'Guest';
        await performJoin(newSession.id, authSession.user.id, userName, '🍽️');
      }
    } catch (err) {
      console.error('[TableSessionContext] initializeSession error:', err);
      setSessionPhase('JOIN'); // Fallback to DEMO_MODE join
    }
  }, [restaurantId, tableId]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializeSession();
    }
  }, [initializeSession]);

  /**
   * Internal join implementation
   */
  const performJoin = async (
    sessionId: string,
    userId: string,
    displayName: string,
    avatarEmoji: string = '🍽️'
  ) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // DEMO_MODE join
      const demoParticipant: SessionParticipant = {
        id: `demo-p-${Date.now()}`,
        sessionId,
        displayName,
        avatarEmoji,
        initials: displayName.slice(0, 2).toUpperCase(),
        color: 'bg-[#ff5708] text-[#511500]',
        role: 'HOST',
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isActive: true,
        isCurrentDevice: true,
        itemCount: 0,
      };
      setCurrentParticipant(demoParticipant);
      setParticipants([demoParticipant]);
      sessionStorageService.saveParticipant(demoParticipant);
      setSessionPhase('ACTIVE');
      return;
    }

    const { data, error } = await supabase.rpc('join_table_session', {
      p_session_id: sessionId,
      p_user_id: userId,
      p_display_name: displayName,
      p_avatar: avatarEmoji,
    });

    if (error || !data) {
      throw new Error(error?.message || 'Failed to join session');
    }

    const participant: SessionParticipant = {
      id: data.participant_id,
      sessionId,
      displayName: data.display_name,
      avatarEmoji: data.avatar_emoji || avatarEmoji,
      initials: data.display_name.slice(0, 2).toUpperCase(),
      color: 'bg-[#ff5708] text-[#511500]',
      role: data.role || 'GUEST',
      joinedAt: data.joined_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isActive: true,
      isCurrentDevice: true,
      itemCount: 0,
    };

    setCurrentParticipant(participant);
    sessionStorageService.saveParticipant(participant);
    setSessionPhase('ACTIVE');

    // Fetch full participant list
    fetchParticipants(sessionId);
  };

  /**
   * Public joinSession — called from TableSessionJoinView
   */
  const joinSession = useCallback(
    async (displayName: string, avatarEmoji: string = '🍽️') => {
      setIsLoadingJoin(true);
      setPhaseError(null);

      try {
        if (!session) {
          setPhaseError('No active session found. Please scan the QR code again.');
          return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
          await performJoin(session.id, 'demo-user', displayName, avatarEmoji);
          return;
        }

        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) {
          setSessionPhase('AUTH_REQUIRED');
          return;
        }

        await performJoin(session.id, authSession.user.id, displayName, avatarEmoji);
      } catch (err) {
        console.error('[TableSessionContext] joinSession error:', err);
        setPhaseError('Something went wrong while joining this table. Please try again.');
      } finally {
        setIsLoadingJoin(false);
      }
    },
    [session]
  );

  /**
   * Fetch participants from Supabase for this session
   */
  const fetchParticipants = useCallback(async (sessionId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { data } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true);

      if (data) {
        const mapped: SessionParticipant[] = data.map((p: any) => ({
          id: p.id,
          sessionId: p.session_id,
          displayName: p.display_name || 'Guest',
          avatarEmoji: p.avatar_emoji || '🍽️',
          initials: (p.display_name || 'G').slice(0, 2).toUpperCase(),
          color: 'bg-[#ff5708] text-[#511500]',
          role: p.role || 'GUEST',
          joinedAt: p.joined_at || '',
          isActive: p.is_active,
          isCurrentDevice: currentParticipant ? p.id === currentParticipant.id : false,
          itemCount: 0,
        }));
        setParticipants(mapped);

        // Sync into session
        setSession((prev) => prev ? { ...prev, participants: mapped } : prev);
      }
    } catch (err) {
      console.warn('[TableSessionContext] fetchParticipants error:', err);
    }
  }, [currentParticipant]);

  /**
   * Subscribe to realtime session + participant updates
   */
  useEffect(() => {
    if (!session?.id || sessionPhase !== 'ACTIVE') return;

    const unsubSession = realtimeService.subscribeToTableSession(session.id, (updated) => {
      setSession(updated);
      sessionStorageService.saveSession(updated);
      if (updated.status === 'CLOSED' || updated.status === 'EXPIRED') {
        setSessionPhase('CLOSED');
      }
    });

    // Subscribe to participant changes
    const supabase = getSupabaseClient();
    let participantChannel: any = null;
    if (supabase && isSupabaseConfigured()) {
      participantChannel = supabase
        .channel(`participants-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${session.id}`,
          },
          () => {
            fetchParticipants(session.id);
          }
        )
        .subscribe();
    }

    return () => {
      unsubSession();
      if (participantChannel) {
        supabase?.removeChannel(participantChannel);
      }
    };
  }, [session?.id, sessionPhase, fetchParticipants]);

  const refreshSession = useCallback(async () => {
    if (!session?.id) return;
    fetchParticipants(session.id);
  }, [session?.id, fetchParticipants]);

  const updateStatus = useCallback(
    async (status: SessionStatus) => {
      if (!session) return;
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase
          .from('table_sessions')
          .update({ status })
          .eq('id', session.id);
      }
      const updated = { ...session, status };
      setSession(updated);
      sessionStorageService.saveSession(updated);
      if (status === 'CLOSED' || status === 'EXPIRED') {
        setSessionPhase('CLOSED');
      }
    },
    [session]
  );

  const resetSession = useCallback(() => {
    sessionStorageService.clearAll();
    setSession(null);
    setCurrentParticipant(null);
    setParticipants([]);
    setSessionPhase('LOADING');
    setPhaseError(null);
    initialized.current = false;
  }, []);

  return (
    <TableSessionContext.Provider
      value={{
        session,
        participants,
        currentParticipant,
        table,
        sessionPhase,
        phaseError,
        participantCount: participants.length,
        isLoadingJoin,
        joinSession,
        refreshSession,
        updateStatus,
        resetSession,
      }}
    >
      {children}
    </TableSessionContext.Provider>
  );
}

export function useTableSessionCtx(): TableSessionContextValue {
  const ctx = useContext(TableSessionContext);
  if (!ctx) {
    throw new Error('useTableSessionCtx must be used within a TableSessionProvider');
  }
  return ctx;
}
