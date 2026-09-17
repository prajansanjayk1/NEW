# Restaurant SaaS Operating System & Digital Dining Platform

Enterprise-grade, multi-tenant restaurant operating system designed for modern hospitality businesses. Combines contactless QR/NFC customer ordering, interactive Kitchen Display Systems (KDS), automated bill splitting with Razorpay payments, real-time inventory and recipe BOM costing, predictive AI demand forecasting, and franchise organization management.

---

## Key Capabilities

1. **Contactless Customer Experience**:
   - Zero-app QR code & NFC dining session initiation.
   - Real-time collaborative group ordering with split-cart visibility.
   - AI Dining Concierge powered by Google Gemini 2.5 Flash for spice calibration and pairing recommendations.
   - Instant 1-tap service requests (Water refill, Bill request, Cutlery, Server call).
   - Dynamic bill splitting (Equal, By-Item, Custom) with instant Razorpay checkout.

2. **Kitchen Display System (KDS)**:
   - Station-based ticket routing (Fryers, Char-Grill, Assembly, Expo).
   - Real-time ticket lifecycle tracking (`LOCKED` → `COOKING` → `SAUCING` → `READY` → `DELIVERED`).
   - Elapsed timer pacing and urgency indicators.

3. **Operations & Inventory Management**:
   - Walk-in cooler inventory tracking with minimum par level alerts.
   - Bill of Materials (BOM) recipe costing and automatic stock depletion per ticket.
   - Wastage logging and supplier purchase order workflows.

4. **Intelligence & Analytics**:
   - Hourly sales velocity, heat distribution, and ticket time metrics.
   - Predictive 7-day demand forecasting and pre-rush prep recommendations.
   - Staff Copilot for instant operational questions.

5. **Multi-Tenant Franchise Architecture**:
   - Organization → Restaurant branch hierarchy.
   - Strict Row Level Security (RLS) and cross-tenant data isolation.
   - 6-tier Role-Based Access Control (`PLATFORM_ADMIN`, `ADMIN`, `MANAGER`, `STAFF`, `KITCHEN`, `CUSTOMER`).
   - Interactive Production Readiness Audit (`/platform/production-readiness`) & 21-point Onboarding Checklist (`/platform/onboarding/checklist`).

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Backend & Server**: Express, Node.js, tsx, esbuild.
- **Database & Auth**: Supabase (PostgreSQL), Row Level Security (RLS), Realtime replication.
- **Payments**: Razorpay Standard Web Checkout, HMAC SHA-256 server signature verification, idempotent webhooks.
- **AI Engine**: Google Gemini 2.5 Flash with deterministic client-side fallbacks.

---

## Local Development Quickstart

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your `GEMINI_API_KEY`, Supabase credentials, and Razorpay API keys if available. If left unconfigured, the application runs seamlessly in offline-resilient **Demo Mode**.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Production Build & Deployment

1. **Static Typecheck & Lint**:
   ```bash
   npm run lint
   ```

2. **Production Bundle Compilation**:
   ```bash
   npm run build
   ```
   Compiles frontend static assets to `dist/` and bundles `server.ts` into a self-contained CommonJS server executable at `dist/server.cjs`.

3. **Production Start**:
   ```bash
   npm run start
   ```

---

## API Reference

### Health & Observability
- `GET /api/health` — Base container health check.
- `GET /api/health/deep` — Deep subsystem diagnostics (Server, Memory, AI, Payments).
- `GET /api/system/status` — Operational telemetry across Database, Realtime, Payments, and AI.

### Payments
- `GET /api/payments/config` — Public gateway configuration and provider mode.
- `POST /api/create-order` — Initiates Razorpay payment order (Rate-limited, integer amount_minor validation).
- `POST /api/verify-payment` — HMAC SHA-256 signature verification.
- `POST /api/payments/webhook` — Idempotent webhook handler with signature verification.
- `POST /api/payments/refund` — Manager/Admin authenticated refund processing.

### AI Intelligence
- `POST /api/ai/concierge` — Guest AI concierge conversation.
- `POST /api/ai/copilot` — Staff operational intelligence assistant.
- `GET /api/ai/usage` — Real-time telemetry on AI requests and latency.

---

## Security & Verification

- **Automated Tenant Isolation Suite**: Run the 9-part test battery from the Platform Admin Console to verify data isolation across branches.
- **Production Readiness Gate**: Audit all system components at `/platform/production-readiness`.
- **Branch Onboarding**: Track live progress for new locations at `/platform/onboarding/checklist`.
