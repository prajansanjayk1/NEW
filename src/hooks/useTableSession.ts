import { useState, useEffect, useCallback } from 'react';
import { 
  TableSession, 
  SessionParticipant, 
  UserRole, 
  SessionStatus, 
  Restaurant, 
  RestaurantTable,
  TableStatus,
  TableSessionEvent
} from '../types';
import { 
  tableSessionService, 
  INITIAL_TABLE_SESSION, 
  FLAGSHIP_RESTAURANT, 
  RESTAURANT_TABLES 
} from '../services/tableSessionService';
import { sessionStorageService } from '../services/sessionStorageService';
import { realtimeService } from '../services/realtimeService';
import { backendService } from '../services/backendService';

export const useTableSession = () => {
  const [restaurant] = useState<Restaurant>(tableSessionService.getRestaurant());
  const [tables, setTables] = useState<RestaurantTable[]>(tableSessionService.getAllTables());

  // Load from persistent cache or default
  const [session, setSession] = useState<TableSession>(() => {
    return sessionStorageService.loadSession() || INITIAL_TABLE_SESSION;
  });

  const [currentParticipant, setCurrentParticipant] = useState<SessionParticipant | null>(() => {
    return sessionStorageService.loadParticipant() || INITIAL_TABLE_SESSION.participants[0];
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    return sessionStorageService.loadRole();
  });

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<TableSessionEvent[]>([]);

  // Update floor table status
  const updateTableFloorStatus = useCallback(async (tableId: string, status: TableStatus) => {
    const updatedTables = await backendService.updateTableFloorStatus(tableId, status);
    setTables(updatedTables);
  }, []);

  // Subscribe to realtime session updates and events
  useEffect(() => {
    const unsubSession = realtimeService.subscribeToTableSession(session.id, (updated) => {
      setSession(updated);
      sessionStorageService.saveSession(updated);
    });

    const unsubEvents = realtimeService.subscribeToEvents(session.id, (event) => {
      setRecentEvents((prev) => [event, ...prev.slice(0, 15)]);
    });

    return () => {
      unsubSession();
      unsubEvents();
    };
  }, [session.id]);

  // Synchronize table session from URL query parameters (e.g. ?table=04 or ?nfc=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam && tableParam !== session.tableNumber) {
      const foundTable = tables.find((t) => t.tableNumber === tableParam);
      if (foundTable) {
        const newSession: TableSession = {
          ...session,
          id: `session-tbl${tableParam}-live`,
          tableId: foundTable.id,
          tableNumber: tableParam,
          sessionToken: `#KW-${tableParam}${Math.floor(100 + Math.random() * 900)}`,
          status: 'ORDERING',
        };
        setSession(newSession);
        sessionStorageService.saveSession(newSession);
      }
    }
  }, [tables, session.tableNumber]);

  // Join table action
  const joinSession = useCallback((displayName: string, avatarEmoji: string = '🍗') => {
    const { session: updatedSession, participant: newParticipant } = tableSessionService.joinTableSession(
      session,
      displayName,
      avatarEmoji
    );
    setSession(updatedSession);
    setCurrentParticipant(newParticipant);
    setSessionError(null);
  }, [session]);

  // Switch role for developer / testing
  const switchRole = useCallback((newRole: UserRole) => {
    setUserRole(newRole);
    sessionStorageService.saveRole(newRole);
  }, []);

  // Update session status (e.g. LOBBY, ACTIVE, BILLING, CLOSED, EXPIRED)
  const updateSessionStatus = useCallback((newStatus: SessionStatus) => {
    const updated = tableSessionService.updateSessionStatus(session, newStatus);
    setSession(updated);
  }, [session]);

  // Validate or simulate scanning a new QR code token
  const simulateSessionScan = useCallback((token: string) => {
    const result = tableSessionService.validateTableSession(restaurant.slug, token);
    if (!result.isValid) {
      setSessionError(result.errorMessage || 'Invalid session token');
      if (result.error === 'EXPIRED') {
        updateSessionStatus('EXPIRED');
      } else if (result.error === 'CLOSED') {
        updateSessionStatus('CLOSED');
      }
      return false;
    }
    if (result.session) {
      setSession(result.session);
      setSessionError(null);
      sessionStorageService.saveSession(result.session);
      return true;
    }
    return false;
  }, [restaurant.slug, updateSessionStatus]);

  // Reset demo session
  const resetDemoSession = useCallback(() => {
    sessionStorageService.clearAll();
    setSession(INITIAL_TABLE_SESSION);
    setCurrentParticipant(INITIAL_TABLE_SESSION.participants[0]);
    setUserRole('CUSTOMER');
    setSessionError(null);
  }, []);

  return {
    restaurant,
    tables,
    session,
    currentParticipant,
    userRole,
    sessionError,
    recentEvents,
    joinSession,
    switchRole,
    updateSessionStatus,
    simulateSessionScan,
    resetDemoSession,
    updateTableFloorStatus,
  };
};
