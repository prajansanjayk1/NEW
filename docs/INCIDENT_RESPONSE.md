# Production Incident Response Plan & Severity Runbooks

## 1. Severity Definitions

| Severity | Definition | Target Response Time | Target Resolution Time |
|---|---|---|---|
| **SEV-1 (Critical)** | Core ordering, KDS, or payment gateway completely down across all tenants. Cross-tenant data breach detected. | 15 minutes | < 2 hours |
| **SEV-2 (High)** | Degradation in a major subsystem (e.g. AI Concierge offline, Realtime sync delayed, one branch degraded). | 30 minutes | < 4 hours |
| **SEV-3 (Medium)** | Minor feature malfunction, reporting discrepancies, non-blocking UI anomaly. | 2 hours | < 24 hours |
| **SEV-4 (Low)** | Cosmestic or documentation bug with existing safe workaround. | Next business day | Next sprint |

---

## 2. Specific Subsystem Incident Runbooks

### 2.1 Payment Incident (Payment gateway error, unauthorized charge, duplicate callback)
1. **Detection**: Alert triggered by `/api/system/status` or surge in client `PAYMENT_FAILED` events via `observabilityService`.
2. **Containment**:
   - Verify if issue is isolated to Razorpay gateway or internal HMAC validation.
   - If gateway is degraded, notify dining guests to settle bill at counter via cash or physical EDC terminal.
   - Do NOT mark bills as unpaid or force double charges.
3. **Investigation**:
   - Inspect server logs for `[Signature Verification Mismatch]` or `[Razorpay Order Failure]`.
   - Validate `PAYMENT_KEY_SECRET` integrity.
4. **Resolution**:
   - Correct secret mismatch or replay missed webhook events via Razorpay dashboard.

### 2.2 Tenant Isolation Incident (Data leak or unauthorized ticket access across branches)
1. **Detection**: Alert from Platform Admin security battery (`SEC-01` through `SEC-09`).
2. **Containment**:
   - Immediately revoke affected session tokens or suspend compromised branch via `/platform` console.
   - Lock RLS policies in PostgreSQL to restrict queries to strict `auth.uid() = user_id AND restaurant_id = current_tenant`.
3. **Investigation**:
   - Audit `public.audit_logs` for any cross-restaurant queries.
4. **Post-Incident Action**:
   - Run automated security test suite to confirm 100% pass rate before re-enabling affected branch.

### 2.3 Gemini Generative AI Outage
1. **Detection**: Elevated error rate on `/api/ai/concierge` or `/api/ai/copilot`.
2. **Automatic Mitigation**:
   - System automatically detects upstream API latency or missing key and engages **Deterministic Safe Rule Fallback**.
   - Customer UI continues serving spice heat recommendations and order pairings without disruption.
3. **Verification**:
   - Check Google AI Studio quota and billing status.
   - Restore API key when restored.

### 2.4 Realtime WebSocket Disconnection
1. **Detection**: Client logs `REALTIME_DISCONNECT`.
2. **Automatic Mitigation**:
   - Clients automatically switch to periodic polling (5-second intervals) to fetch active orders and tickets.
   - Reconnect backoff runs automatically in the background.

---

## 3. Incident Lifecycle Protocol
1. **Detection & Triage**: Log incident in issue tracker; assign Incident Commander.
2. **Containment**: Isolate blast radius without corrupting financial records.
3. **Communication**: Display in-app banner for staff and managers via toast alerts.
4. **Resolution**: Deploy hotfix through CI/CD pipeline after full lint and build pass.
5. **Post-Mortem**: Publish Blameless Post-Mortem within 48 hours documenting root cause, impact duration, and preventative action items.
