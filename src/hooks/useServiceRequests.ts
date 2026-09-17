import { useState, useCallback, useEffect } from 'react';
import { ServiceRequest, ServiceRequestType, ServiceRequestStatus, SessionParticipant } from '../types';
import { createServiceRequest } from '../services/serviceRequestService';
import { sessionStorageService } from '../services/sessionStorageService';
import { realtimeService } from '../services/realtimeService';

export const useServiceRequests = (
  tableNumber: string = '18',
  currentParticipant?: SessionParticipant | null
) => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    return sessionStorageService.loadServiceRequests() || [];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to storage & realtime
  useEffect(() => {
    sessionStorageService.saveServiceRequests(serviceRequests);
    realtimeService.notifyServiceRequestsUpdate(serviceRequests);
  }, [serviceRequests]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsub = realtimeService.subscribeToServiceRequests((updated) => {
      setServiceRequests(updated);
    });
    return unsub;
  }, []);

  const requestService = useCallback(
    (typeOrTitle: ServiceRequestType | string, customNote?: string) => {
      const isKnownType = ['WAITER', 'WATER', 'CUTLERY', 'NAPKINS', 'EXTRA_SAUCE', 'BILL', 'ASSISTANCE'].includes(
        typeOrTitle
      );
      const reqType: ServiceRequestType = isKnownType
        ? (typeOrTitle as ServiceRequestType)
        : 'WAITER';

      const newRequest = createServiceRequest(
        reqType,
        tableNumber,
        currentParticipant,
        customNote || (isKnownType ? undefined : typeOrTitle)
      );

      setServiceRequests((prev) => [newRequest, ...prev]);
      setToastMessage(`${newRequest.title} requested · Floor staff notified`);

      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    },
    [tableNumber, currentParticipant]
  );

  const updateServiceRequestStatus = useCallback((requestId: string, status: ServiceRequestStatus) => {
    setServiceRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          ...req,
          status,
          acknowledgedAt: status === 'ACKNOWLEDGED' || status === 'IN_PROGRESS' ? now : req.acknowledgedAt,
          resolvedAt: status === 'COMPLETED' ? now : req.resolvedAt,
        };
      })
    );
  }, []);

  const resolveServiceRequest = useCallback((requestId: string) => {
    updateServiceRequestStatus(requestId, 'COMPLETED');
  }, [updateServiceRequestStatus]);

  const acknowledgeServiceRequest = useCallback((requestId: string) => {
    updateServiceRequestStatus(requestId, 'ACKNOWLEDGED');
  }, [updateServiceRequestStatus]);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    serviceRequests,
    toastMessage,
    clearToast,
    requestService,
    updateServiceRequestStatus,
    acknowledgeServiceRequest,
    resolveServiceRequest,
    pendingCount: serviceRequests.filter((r) => r.status !== 'COMPLETED').length,
  };
};
