# Enterprise Multi-Tenant Restaurant SaaS Architecture

## 1. System Topology Overview

```
                      [ Guest Browsers / QR Tables ]
                                   │
                                   ▼
                   [ Port 3000 / Nginx Ingress Proxy ]
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
        [ Vite SPA Client ]                  [ Express API Server ]
     - Customer Ordering UI               - /api/create-order
     - Interactive KDS                     - /api/verify-payment
     - Manager & Analytics Suite           - /api/payments/webhook
     - Platform Admin Console              - /api/ai/concierge & copilot
     - Local Cache & State Hydration       - /api/system/status & /api/health
                │                                     │
                ├──────────────────┬──────────────────┤
                ▼                  ▼                  ▼
     [ Supabase PostgreSQL ]   [ Google Gemini ]  [ Razorpay Gateway ]
     - RLS Tenant Isolation    - 2.5 Flash Model  - Web Checkout
     - Realtime Replication    - Prompt Defenses  - HMAC SHA-256 Signature
     - Automated Triggers      - Safe Fallbacks   - Idempotent Webhook
```

---

## 2. Multi-Tenant Hierarchy

1. **Platform Layer**:
   - Super-admin visibility across all registered organizations, subscription tiers, and system metrics.
2. **Organization Layer (`organizations`)**:
   - High-level enterprise franchise entity (e.g. *Kings of Wings Global Group*).
   - Manages billing agreements, aggregated analytics, and subscription limits.
3. **Branch / Restaurant Layer (`restaurants`)**:
   - Physical operational dining location (e.g. *Indiranagar Flagship, Bengaluru*).
   - Autonomous tables, QR tokens, KDS screens, local inventory stock, recipes, and shift rosters.
4. **Role-Based Access Control (RBAC)**:
   - `PLATFORM_ADMIN`: Global platform oversight, provisioning, and subscription management.
   - `ADMIN`: Full location authority, tax rates, billing configuration, and staff management.
   - `MANAGER`: Kitchen and floor oversight, inventory write-offs, purchasing, and analytics.
   - `STAFF`: Floor orders, service requests, and bill settlements.
   - `KITCHEN`: Line cook KDS ticket progression.
   - `CUSTOMER`: Single dining table session scope with cryptographically scoped access.

---

## 3. Financial Integrity & Security Principles

- **Zero Client Trust for Payments**: No transaction is marked as paid based on client assertions. All payments require server-side HMAC SHA-256 signature verification or authenticated webhook delivery.
- **Idempotency Enforcement**: Webhook events are deduplicated by `event_id` and cached in memory / persistent store to prevent double-crediting or duplicate invoice issuance.
- **Strict Money Representation**: Monies are stored and computed in integer minor currency units (paise in INR) to prevent floating-point inaccuracies.
- **Tenant Data Isolation**: Database queries strictly filter by `restaurant_id`. Cross-tenant querying is blocked by PostgreSQL Row Level Security (RLS).
