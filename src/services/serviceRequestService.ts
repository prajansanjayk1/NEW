import { ServiceRequest, ServiceRequestType, ServiceRequestStatus, SessionParticipant, TableSessionEvent } from '../types';
import { realtimeService } from './realtimeService';

export interface ServiceTypeConfig {
  type: ServiceRequestType;
  title: string;
  description: string;
  icon: string;
  quickActionLabel: string;
}

export const SERVICE_TYPE_CONFIGS: Record<ServiceRequestType, ServiceTypeConfig> = {
  WAITER: {
    type: 'WAITER',
    title: 'Call Table Server',
    description: 'Floor server requested at table',
    icon: 'bell',
    quickActionLabel: 'Call Staff',
  },
  WATER: {
    type: 'WATER',
    title: 'Fresh Cold Water',
    description: 'Pitcher of chilled water & glasses',
    icon: 'droplets',
    quickActionLabel: 'Fresh Water',
  },
  CUTLERY: {
    type: 'CUTLERY',
    title: 'Extra Cutlery & Plates',
    description: 'Bone plates, forks, wet wipes',
    icon: 'utensils',
    quickActionLabel: 'Cutlery',
  },
  NAPKINS: {
    type: 'NAPKINS',
    title: 'Extra Napkins & Wipes',
    description: 'Heavy duty napkins for wing feast',
    icon: 'file-text',
    quickActionLabel: 'Napkins',
  },
  EXTRA_SAUCE: {
    type: 'EXTRA_SAUCE',
    title: 'Extra Dip & Wing Sauce',
    description: 'Pit sauce refill requested',
    icon: 'flame',
    quickActionLabel: 'Extra Sauce',
  },
  BILL: {
    type: 'BILL',
    title: 'Request Table Bill',
    description: 'Ready to settle check & invoice',
    icon: 'receipt',
    quickActionLabel: 'Request Bill',
  },
  ASSISTANCE: {
    type: 'ASSISTANCE',
    title: 'Table Assistance',
    description: 'Special dietary or seating help',
    icon: 'help-circle',
    quickActionLabel: 'Assistance',
  },
  TISSUES: {
    type: 'TISSUES',
    title: 'Extra Tissues & Wet Wipes',
    description: 'Fresh tissues requested for table',
    icon: 'file-text',
    quickActionLabel: 'Tissues',
  },
  CLEAN_TABLE: {
    type: 'CLEAN_TABLE',
    title: 'Clean Table / Bone Basket',
    description: 'Clear bones, empty baskets and wipe table',
    icon: 'utensils',
    quickActionLabel: 'Clean Table',
  },
};

export const createServiceRequest = (
  type: ServiceRequestType,
  tableNumber: string = '18',
  participant?: SessionParticipant | null,
  customNote?: string
): ServiceRequest => {
  const config = SERVICE_TYPE_CONFIGS[type];
  const newReq: ServiceRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    tableNumber,
    title: config.title,
    description: customNote || config.description,
    type,
    icon: config.icon,
    status: 'REQUESTED',
    requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    requestedByParticipantId: participant?.id,
    requestedByParticipantName: participant?.displayName,
  };

  const event: TableSessionEvent = {
    id: `evt-req-${Date.now()}`,
    sessionId: `sess-t${tableNumber}-active`,
    type: 'SERVICE_REQUEST_CREATED',
    actorId: participant?.id || 'diner',
    actorName: participant?.displayName || 'Table Diner',
    timestamp: newReq.requestedAt,
    payload: { request: newReq },
  };

  realtimeService.emitTableEvent(event);
  realtimeService.notifyServiceRequestCreated(newReq);

  return newReq;
};
