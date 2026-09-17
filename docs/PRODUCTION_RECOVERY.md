# Restaurant SaaS Platform — Production Recovery & Disaster Response Guide

## 1. Executive Overview
This document defines disaster recovery, point-in-time database restoration, migration rollback protocols, and data recovery procedures for the multi-tenant restaurant operating system.

---

## 2. Backup Architecture & Policies

### 2.1 Database (PostgreSQL / Supabase)
- **Continuous WAL Archiving**: Point-In-Time Recovery (PITR) with up to 7-day retention for production clusters.
- **Daily Automated Physical Backups**: Scheduled daily snapshot backups taken at 02:00 UTC (off-peak restaurant hours).
- **Logical Schema Dumps**: Automated `pg_dump` executed prior to any schema migration:
  ```bash
  pg_dump -h $SUPABASE_DB_HOST -U postgres -d postgres -F c -b -v -f "backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump"
  ```

### 2.2 Storage & Media Assets
- Menu photos, restaurant logos, and digital receipts stored in dedicated S3-compatible buckets with versioning enabled and cross-region replication.

---

## 3. Disaster Recovery Runbook

### Scenario A: Accidental Corrupt Migration or DDL Issue
1. **Freeze Traffic**: Immediately divert traffic to maintenance page or lock mutations via edge proxy.
2. **Identify Target Timestamp**: Check `supabase/migrations` history and identify last known stable transaction timestamp.
3. **Execute Rollback Migration**:
   ```sql
   -- Example: Revert Phase 10 constraints if needed
   BEGIN;
   -- Apply targeted down script
   COMMIT;
   ```
4. **Restore from Snapshot**: If data was altered, initiate PITR to `T - 5 minutes` from the Supabase management console.

### Scenario B: Payment Webhook Outage or Signature Desynchronization
1. **Verify Webhook Status**: Check `/api/system/status` and ensure `PAYMENT_WEBHOOK_SECRET` matches Razorpay dashboard webhook settings.
2. **Replay Unprocessed Events**:
   - Access Razorpay Dashboard → Webhooks → Failed Events.
   - Click "Resend".
   - Server idempotency cache (`processedWebhooks`) automatically suppresses duplicates and captures missed payments.

### Scenario C: Redis / In-Memory State Loss
- All critical dining sessions, orders, and table tokens are persisted in PostgreSQL.
- Dev server restarts or memory resets cause no loss of active orders or bills; client reconnects automatically via `realtimeService` and re-hydrates authoritative state.

---

## 4. Verification Checklist Post-Recovery
- [ ] Health endpoint `/api/health/deep` returns `status: HEALTHY`.
- [ ] Run full tenant security test battery (`/platform/production-readiness`).
- [ ] Confirm table QR code scan resolves to active dining session.
- [ ] Verify KDS ticket board receives live test ticket.
- [ ] Perform ₹1.00 test authorization and HMAC verification on Razorpay gateway.
