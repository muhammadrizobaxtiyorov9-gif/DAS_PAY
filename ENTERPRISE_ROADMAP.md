# DasPay — Enterprise Roadmap & Feature Gap Analysis

Senior-architect review of **admin panel**, **client cabinet** and **Telegram bot**, prepared as a prioritized backlog. Each item has: *value*, *effort* (S/M/L), and a *why* so the team can sequence by ROI.

---

## 1. Admin panel — missing operational capability

Modern 3PL/forwarder operations need far more than CRUD. The following gaps stand out against the current schema (Shipment, Lead, Client, Task, Contract, User).

### 1.1 Shipment lifecycle

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 1 | **Structured event timeline editor** — admin can push a new event (status + location + timestamp + note) and it is appended to `Shipment.events`. Auto-updates `currentLat/Lng` from a geocoded location. | M | Today events are stored but there is no UI to add them. The whole tracking experience depends on this. |
| 2 | **Bulk shipment actions** (select N, set status, assign driver, export) | M | At 100+ shipments/day the current one-by-one UI breaks down. |
| 3 | **Live position ingest via GPS / driver app webhook** (`POST /api/shipments/:id/ping`) | L | Removes manual status updates. Drivers ping every 5 min → map animates in real time. |
| 4 | **ETA calculation & publishing** — compute from remaining route distance + mode-specific avg speed, expose in tracking. | M | Customer's single most-asked question. |
| 5 | **Document vault per shipment** — CMR, invoice, packing list, photos, POD. Stored in S3/Supabase, linked from Shipment. | L | Forwarders *are* document-management companies. |
| 6 | **Proof of delivery** — e-signature + photo capture on mobile, timestamp + geolocation. | M | Closes the loop; enables net-term invoicing. |
| 7 | **Sender / Receiver as first-class entities** (Company, contacts, addresses) instead of loose strings. | M | Enables analytics per counterparty and autocomplete. |

### 1.2 Financials & billing

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 8 | **Invoice generator** — shipment → PDF invoice using `Contract` banking details. | M | Removes a Word/Excel step that exists in every forwarder today. |
| 9 | **Cost vs. revenue per shipment** — record supplier/carrier cost, compute margin. Dashboard card "Avg margin this month". | M | Without this the business runs blind. |
| 10 | **Accounts receivable** — list overdue invoices, reminder emails automatic on day +7, +14. | M | Frees up a whole accountant-day per week. |
| 11 | **Currency & tariff catalog** — USD/UZS/RUB rates, base tariffs by lane and mode. Feeds the calculator (bot + web). | S | Calculator today uses `weight * 2.5`. Real quotes need a catalog. |

### 1.3 CRM & sales

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 12 | **Lead pipeline (Kanban)** — new → contacted → quoted → won/lost with SLA timers. | M | Existing `Lead.status` field exists; UI is table-only. A Kanban makes sales velocity visible. |
| 13 | **Lead → Shipment conversion** with one click, copying origin/destination/weight. | S | Removes a common re-entry error. |
| 14 | **Auto-assign rules** (round-robin or by language / geography). | S | Prevents "first-to-grab" chaos. |
| 15 | **Client profile 360°** — all past shipments, leads, contracts, open invoices on one page. | M | Every support call starts with "pull up the account"; today that means 3 tabs. |

### 1.4 Productivity & compliance

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 16 | **Audit log** on top of `UserAction` — who changed what field, from → to, when. Filterable. | S | Regulatory & internal trust; already half-built via `UserAction`. |
| 17 | **Saved filters / smart views** (e.g. "In transit, late >2 days") in shipments list. | S | Ops team lives in these lists. |
| 18 | **Bulk CSV / Excel export** (shipments, leads, invoices) with column chooser. | S | Every client eventually asks. |
| 19 | **Notification center** — real-time bell icon for new lead, stuck shipment, SLA breach. WebSocket or Pusher. | M | Keeps admins in the app instead of jumping to Telegram for every ping. |
| 20 | **Role-based permissions** — finer than `SUPERADMIN/ADMIN`: dispatcher, sales, accountant, readonly. Matrix UI. | M | Needed before the team grows past ~8 people. |
| 21 | **2FA for admins** (TOTP) | S | Basic hygiene given that admins can view client data. |

### 1.5 Analytics

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 22 | **Ops dashboard** — shipments by status, by lane, avg transit time, SLA hit-rate. | M | Turns raw rows into management insight. |
| 23 | **Sales dashboard** — won rate, avg deal size, pipeline $$, per-sales ranking. | M | Motivates and measures the sales team. |
| 24 | **Heatmap of tracking queries** (leverages `TrackingQuery`) — which routes are hot. | S | Data is already captured; visualisation costs little. |

---

## 2. Client cabinet — missing customer-facing value

Cabinet today = *login + shipments list + detail*. To retain clients, add:

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 25 | **Self-service order entry** — client creates shipment drafts (origin, destination, weight, photos), ops confirms. | M | The feature gap that separates hobby tools from real ERPs. |
| 26 | **Live map with real vehicle position** (already built — extend with ETA badge, speed, driver name/phone). | S | Use the new animated map we just shipped. |
| 27 | **Invoice & document download** — PDF invoices, CMR, POD attached to each shipment. | S | Zero friction on the customer side. |
| 28 | **Chat with manager** inside cabinet (WebSocket) — transcript persisted, file attachments. | L | Eliminates the endless Telegram scroll, gives admin a searchable record. |
| 29 | **Address book** — save frequently used senders/receivers. | S | Three clicks to create next shipment. |
| 30 | **Notifications** — email + Telegram push on status change, ETA change, docs uploaded. Per-user preferences. | M | The single feature that turns "another logistics portal" into "my logistics portal". |
| 31 | **Saved searches & filters** for shipments. | S | Corporate clients have 20+ active shipments. |
| 32 | **Ratings / feedback on delivery** (NPS prompt after status=delivered). | S | Measurable service quality signal. |
| 33 | **Mobile-optimised quick-track widget** on the dashboard ("paste code, see status, no login"). | S | Cuts support traffic. |
| 34 | **Multi-user accounts** — one company, multiple logins with roles (admin / viewer / finance). | M | Needed once the corporate pipeline gets beyond SMB. |

---

## 3. Telegram bot — after this release

The bot was rewritten this release with:
- /start welcome + phone capture onboarding
- Full tri-language menu (uz/ru/en) with inline language switcher
- Persistent main menu: Track · My Shipments · Calculator · Services · Support · Contact · Profile · Language · Cabinet (WebApp)
- Rich shipment cards with last 3 events + "Open on website/map" buttons
- `/shipments` lists the logged-in client's latest 5 shipments
- `/support` captures free-form messages as Leads
- `/contact` inline buttons: Call · Map · Website
- `/help`, `/track`, `/calc`, `/services`, `/lang`, `/contact`, `/shipments`, `/support` commands registered with Telegram menu button
- Auto-detection of tracking numbers anywhere in chat (`DP-12345`)

### Next increments

| # | Feature | Effort | Why it matters |
|---|---------|--------|----------------|
| 35 | **Push on status change** — bot sends a notification to the registered `Client.telegramId` when admin updates a shipment. | S | Use existing `Shipment.clientPhone → Client.telegramId`. Huge perceived-value jump. |
| 36 | **Subscribe/unsubscribe per shipment** via inline button. | S | Gives clients a "only this one" option. |
| 37 | **Bot inline mode** (`@daspaylogistics_bot DP-123`) — share tracking cards in any chat. | M | Lightweight viral growth. |
| 38 | **Payment via Click/Payme bot payments** for small invoices. | L | Removes an accountant's manual reconciliation. |
| 39 | **AI assistant** (GPT function-calling over the Prisma data) — "What's the status of my Guangzhou shipment?" answered in prose. | L | Where the market is going; bot already has context. |
| 40 | **Voice message transcription** into a support ticket. | S | Field drivers / warehouse staff prefer voice. |

---

## 4. Customer service — enterprise playbook

Beyond software features, three operational patterns raise perceived service quality immediately:

1. **SLA clock on every shipment.** Status "pending" older than 24h must surface red on the dashboard. Ops owner gets pinged. Public commitment: "reply within 1 business hour" — measurable because every Lead is timestamped.
2. **First-reply automation.** The moment a Lead is created (form, bot, call-back), send a templated email + Telegram message within 60 seconds ("We received your request, manager N. will call you within X min"). Free, huge trust gain.
3. **Post-delivery feedback loop.** 24h after `status=delivered`, bot/email sends a 1-tap NPS ("How was it? 👍/👎"). Feed answers into an internal dashboard. One person reads them weekly.

Supporting channels to stand up **in this order**:

1. Telegram bot (✅ done)
2. Email (Resend or Postmark) — transactional: ack lead, shipment status, invoice sent
3. Help-desk email inbox routed into the Leads table (IMAP ingest or forwarding rule)
4. Knowledge base (FAQ) on the public site — deflects 20–30 % of tickets
5. Web chat widget (Crisp/Tidio) connected to the same admin inbox
6. Optional: WhatsApp Business API for CIS-wide clients

---

## 5. Suggested sequencing (90-day plan)

**Weeks 1–2 — Foundations**
- #1 event timeline editor, #4 ETA, #16 audit log UI, #35 bot push notifications
- Outcome: tracking feels alive, admins are accountable, clients auto-informed.

**Weeks 3–5 — Financials**
- #8 invoice PDF, #10 AR reminders, #11 tariff catalog feeding calculator
- Outcome: billing moves off Word/Excel.

**Weeks 6–8 — Self-service**
- #25 client-created shipment drafts, #27 doc download, #29 address book
- Outcome: clients do 50 % of the data entry themselves.

**Weeks 9–12 — Growth**
- #12 Kanban, #22 ops dashboard, #30 notifications center, #38 bot payments
- Outcome: the business can scale to 10× without 10× the staff.

---

## 6. Technical foundations that should land alongside

- **Real-time layer** (Pusher, Ably or Supabase Realtime) — powers live map, chat, notifications with one infra decision.
- **Background jobs** (BullMQ on Redis, or Vercel Cron) — invoice reminders, NPS, bot push.
- **S3-compatible object storage** (Cloudflare R2) — documents, photos, POD.
- **Observability** — Sentry for errors + Axiom/Logtail for structured logs + uptime ping for the bot webhook.
- **CI quality gates** — `tsc --noEmit`, `next lint`, Playwright smoke on PR.
- **Prisma migrations discipline** — one migration per schema change, never `prisma db push` on prod.

---

## Appendix — What shipped in the current release

1. Contact page: interactive CartoCDN map with pulsing office marker, Google/Yandex nav buttons, real Tashkent coordinates.
2. Footer + contact page: real Telegram (`daspaylogistics`) and Instagram (`daspaylogistics`) links, centralised in `lib/contacts.ts`.
3. Cabinet shipment detail map: animated vehicle (truck/train SVG) moving along real OSRM road geometry, progress bar, play/pause, fullscreen, 3 tile layers, auto-fit bounds.
4. Admin shipment entry map: modern toolbar, OSRM route preview with loading indicator, Nominatim geocode search, layer switcher, undo/clear, live distance + waypoint counters, shared icons with the cabinet map.
5. Telegram bot: full tri-language, proper onboarding, structured menus, /shipments /support /profile /lang commands, Bot API `setMyCommands`, auto-recognition of `DP-` codes, deep links into WebApp.
