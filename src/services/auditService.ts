import { AuditLog } from '../types';
import { getSupabaseClient } from './supabaseClient';

const inMemoryAuditLogs: AuditLog[] = [];

export const auditService = {
  async logEvent(params: {
    restaurantId: string;
    actorId: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const logEntry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: params.restaurantId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('audit_logs').insert({
          id: logEntry.id,
          restaurant_id: logEntry.restaurantId,
          actor_id: logEntry.actorId,
          actor_role: logEntry.actorRole,
          action: logEntry.action,
          entity_type: logEntry.entityType,
          entity_id: logEntry.entityId,
          metadata: logEntry.metadata,
          created_at: logEntry.createdAt,
        });
      } catch (err) {
        console.warn('Supabase audit log write error, falling back to local:', err);
      }
    }

    inMemoryAuditLogs.unshift(logEntry);
    // Keep max 500 audit events in memory
    if (inMemoryAuditLogs.length > 500) {
      inMemoryAuditLogs.pop();
    }

    return logEntry;
  },

  getAuditLogs(restaurantId?: string): AuditLog[] {
    if (!restaurantId) return inMemoryAuditLogs;
    return inMemoryAuditLogs.filter((log) => log.restaurantId === restaurantId);
  },
};
