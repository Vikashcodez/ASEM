# Airport Emergency Incident & Bed Allocation Management System

Enterprise-grade architecture and development blueprint for building a complete airport emergency medical operations platform using React, Node.js/Express, PostgreSQL, JWT, and RBAC.

## 1. System Vision

Build a centralized platform to manage airport incidents and emergency medical workflows end-to-end:

- Incident intake from security/emergency staff
- Patient registration and triage
- Smart ward/room/bed allocation based on medical severity and bed capabilities
- Continuous care operations, transfers, discharge, and audit tracking
- Airport-wide visibility for operations leadership

Core hierarchy:

Airport -> Terminal -> Building/Medical Block -> Floor -> Ward -> Room -> Bed

## 2. Full System Architecture

### High-level architecture

- Frontend (React + Vite): role-based SPA
- API Layer (Node.js + Express): auth, domain services, orchestration
- Database (PostgreSQL): transactional system of record
- Realtime Layer (Socket.IO): occupancy/incident status updates
- Background Jobs (BullMQ + Redis optional): notifications, escalations, reporting
- Observability: structured logs + audit logs + metrics

### Logical layers (backend)

- Presentation layer: routes, request parsing, response formatting
- Security layer: JWT verification, RBAC policy checks, rate limiting
- Application layer: use-cases (incident lifecycle, triage, allocation)
- Domain layer: entities, allocation rules, policy engine
- Data access layer: repositories and Sequelize models
- Infrastructure layer: DB client, queues, sockets, logging, config

## 3. Recommended Folder Structure

## Backend (Node + Express)

```txt
backend/
  server.js
  package.json
  .env
  .env.example
  src/
    app.js
    config/
      env.js
      database.js
      logger.js
      socket.js
    constants/
      roles.js
      incidentTypes.js
      triage.js
      bedTypes.js
    modules/
      auth/
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.validation.js
        auth.routes.js
      users/
      airports/
      incidents/
      patients/
      assessments/
      wards/
      rooms/
      beds/
      allocation/
      dashboards/
      notifications/
      audit/
    middleware/
      authJwt.js
      requireRole.js
      validateRequest.js
      errorHandler.js
      notFound.js
      requestId.js
    policies/
      rbac.policy.js
    repositories/
      base.repository.js
    services/
      allocation.engine.js
      notification.service.js
      audit.service.js
    db/
      migrations/
      seeders/
      models/
      index.js
    utils/
      apiError.js
      apiResponse.js
      dateTime.js
```

## Frontend (React)

```txt
frontend/
  src/
    app/
      store.js
      router.jsx
    api/
      client.js
      auth.api.js
      incidents.api.js
      patients.api.js
      beds.api.js
      dashboard.api.js
    features/
      auth/
      users/
      incidents/
      triage/
      allocation/
      wards/
      rooms/
      beds/
      dashboard/
      notifications/
      audit/
    components/
      layout/
      tables/
      forms/
      charts/
      guards/
    pages/
      LoginPage.jsx
      UnauthorizedPage.jsx
      DashboardPage.jsx
      IncidentCreatePage.jsx
      IncidentDetailsPage.jsx
      PatientRegistrationPage.jsx
      TriageAssessmentPage.jsx
      BedAllocationPage.jsx
      WardsPage.jsx
      RoomsPage.jsx
      BedsPage.jsx
      UsersPage.jsx
      AuditLogsPage.jsx
    hooks/
      useAuth.js
      usePermissions.js
      useRealtime.js
    styles/
      tokens.css
      globals.css
```

## 4. PostgreSQL Database Design

### Core tables

- roles (id, name, description)
- users (id, role_id, name, email, password_hash, status, last_login_at)
- airports (id, code, name)
- terminals (id, airport_id, code, name)
- medical_blocks (id, terminal_id, code, name)
- floors (id, medical_block_id, floor_number, name)
- wards (id, floor_id, ward_type, specialty, status)
- rooms (id, ward_id, room_no, room_type, status)
- beds (id, room_id, bed_no, bed_type, status, has_ventilator)
- incidents (id, incident_no, type, location, occurred_at, severity, status, reported_by)
- patients (id, incident_id, patient_type, full_name, age, gender, national_id, contact)
- triage_assessments (id, patient_id, doctor_id, triage_level, condition_code, vitals_json, notes)
- bed_allocations (id, patient_id, bed_id, ward_id, room_id, allocation_status, allocated_at, released_at)
- transfers (id, patient_id, from_bed_id, to_bed_id, reason, transferred_at)
- medical_events (id, patient_id, event_type, payload_json, created_by)
- notifications (id, user_id, channel, message, status, sent_at)
- audit_logs (id, actor_user_id, action, entity_type, entity_id, old_values_json, new_values_json, ip, user_agent, created_at)

### Important constraints

- users.email unique
- incident_no unique
- beds unique(room_id, bed_no)
- rooms unique(ward_id, room_no)
- active bed allocation uniqueness:
  unique(patient_id) where allocation_status = 'active'
  unique(bed_id) where allocation_status = 'active'
- foreign keys with ON UPDATE CASCADE
- CHECK constraints for status and triage enum values

## 5. ER Diagram Explanation (textual)

- One airport has many terminals.
- One terminal has many medical blocks.
- One block has many floors.
- One floor has many wards.
- One ward has many rooms.
- One room has many beds.
- One incident can have multiple patients.
- One patient has one or many triage assessments over time.
- One patient can have many bed allocations historically, but only one active allocation.
- One bed can have many historical allocations, but only one active patient.
- Every critical mutation writes an audit log record.

## 6. Sequelize Model Design

Recommended model files:

- Role, User
- Airport, Terminal, MedicalBlock, Floor, Ward, Room, Bed
- Incident, Patient, TriageAssessment
- BedAllocation, Transfer
- Notification, AuditLog

Association examples:

- Airport.hasMany(Terminal)
- Terminal.belongsTo(Airport)
- Ward.hasMany(Room)
- Room.hasMany(Bed)
- Incident.hasMany(Patient)
- Patient.hasMany(TriageAssessment)
- Patient.hasMany(BedAllocation)
- Bed.hasMany(BedAllocation)
- User.belongsTo(Role)

Use model scopes:

- Bed.scope('available') => status='available'
- User.scope('active')
- Incident.scope('open')

## 7. Migration Structure

Create migrations in dependency order:

1. roles, users
2. airport hierarchy (airports -> terminals -> blocks -> floors)
3. clinical hierarchy (wards -> rooms -> beds)
4. incidents, patients, triage_assessments
5. bed_allocations, transfers
6. notifications, audit_logs
7. indexes, partial indexes, views, materialized views (analytics)

Seeder order:

1. roles
2. super admin user
3. ward/bed type master data
4. sample airport structure

## 8. API Design (v1)

Base URL: `/api/v1`

### Auth

- POST `/auth/login`
- POST `/auth/refresh`
- POST `/auth/logout`
- GET `/auth/me`

### Users & Roles

- GET `/users`
- POST `/users`
- PATCH `/users/:id`
- GET `/roles`

### Airport structure

- GET `/airports`
- POST `/airports`
- GET `/terminals?airportId=`
- POST `/terminals`
- GET `/medical-blocks?terminalId=`
- POST `/medical-blocks`
- GET `/floors?blockId=`
- POST `/floors`

### Ward/Room/Bed

- GET `/wards`
- POST `/wards`
- GET `/rooms?wardId=`
- POST `/rooms`
- GET `/beds?roomId=&status=&bedType=`
- POST `/beds`
- PATCH `/beds/:id/status`

### Incident + patient + triage

- POST `/incidents`
- GET `/incidents`
- GET `/incidents/:id`
- POST `/patients`
- POST `/triage-assessments`

### Allocation

- POST `/allocations/auto`
- POST `/allocations/manual`
- POST `/allocations/:id/transfer`
- POST `/allocations/:id/release`
- GET `/allocations/active`

### Analytics + audit

- GET `/dashboard/overview`
- GET `/dashboard/occupancy`
- GET `/audit-logs?entityType=&actor=&from=&to=`

## 9. JWT Authentication Flow

1. User submits email/password to `/auth/login`.
2. Backend validates credentials and role status.
3. Access token (short-lived) + refresh token (long-lived) issued.
4. Frontend stores access token in memory and refresh token in httpOnly cookie (recommended).
5. Protected APIs require `Authorization: Bearer <token>`.
6. On access token expiry, frontend calls `/auth/refresh`.
7. Logout invalidates refresh token server-side.

JWT claims:

- sub (user id)
- role
- permissions (optional compact list)
- iat, exp, jti

## 10. RBAC Middleware Structure

Use two middlewares:

- `authJwt`: verify token and attach user context
- `requireRole(...roles)` or `requirePermission(permission)`

Example:

```js
router.post(
  '/beds',
  authJwt,
  requireRole('Super Admin', 'Airport Admin', 'Medical Admin'),
  validate(createBedSchema),
  bedController.create
);
```

## 11. Backend Layered Architecture Rules

- Controllers do: parse request, call service, return standardized response.
- Services do: business logic and transaction orchestration.
- Repositories do: DB interaction only.
- Policies do: RBAC + allocation constraints.
- Middleware do: cross-cutting concerns only.

Use transactions for multi-entity writes:

- incident creation + patient creation + initial triage
- auto allocation decision + allocation row + bed status update + audit log

## 12. React Frontend Architecture

- Route groups by role and module.
- Shared API client with interceptors for auth/refresh.
- Guard components:
  - `ProtectedRoute`
  - `RoleRoute`
- Feature-first slices for scalability.
- Reusable table/filter/form components.

## 13. Page-wise React Flow

1. Login
2. Role-routed dashboard
3. Incident registration
4. Patient registration
5. Triage assessment
6. Auto allocation suggestion
7. Confirm allocation
8. Live bed board and transfers
9. Discharge/release bed
10. Audit and reports

## 14. Redux State Structure (Redux Toolkit)

```txt
state/
  auth: { user, accessToken, isAuthenticated, permissions }
  incidents: { list, selected, filters, loading }
  patients: { listByIncident, selectedPatient }
  triage: { byPatientId, draftAssessment }
  infrastructure: { airports, terminals, blocks, floors, wards, rooms, beds }
  allocation: { active, suggestions, history }
  dashboard: { kpis, occupancy, trends }
  notifications: { items, unreadCount }
  ui: { sidebarOpen, theme, globalLoading }
```

## 15. Smart Bed Allocation Algorithm

Input:

- triage level
- condition code
- required bed capabilities
- ward specialty mapping
- current availability

Decision sequence:

1. Map condition -> required specialty + preferred ward type.
2. Filter active beds by status=available.
3. Filter by bed type and capability (ICU, ventilator, etc.).
4. Restrict by matching ward specialty.
5. Rank by severity priority and nearest location.
6. Pick top bed with row lock (`FOR UPDATE SKIP LOCKED`) to prevent race conditions.
7. Create allocation + mark bed occupied atomically.

Condition mapping examples:

- Heart Attack -> Cardiology + ICU/Ventilator
- Fracture -> Orthopedic + General/Emergency bed
- Burns -> Burns Unit + monitored bed
- Polytrauma -> Trauma Ward/ICU depending on triage

## 16. Dashboard Design

Widgets:

- Active incidents
- Patients awaiting triage
- Bed occupancy by ward
- ICU and ventilator utilization
- Average allocation time
- Critical alerts and escalation queue

Views:

- Operations dashboard (airport admin)
- Medical command dashboard (doctor/medical admin)
- Executive summary (super admin)

## 17. Suggested UI Flow

- Left navigation filtered by role.
- Top bar with alert bell + user context.
- Incident workflow wizard:
  - Step 1 Incident
  - Step 2 Patient
  - Step 3 Triage
  - Step 4 Allocation recommendation
  - Step 5 Confirm and notify
- Bed board with color-coded states:
  - Green available
  - Red occupied
  - Yellow reserved/cleaning

## 18. Development Phases

1. Foundation
   - Project standards, env config, logging, auth skeleton, DB baseline
2. Core identity
   - JWT auth, role management, protected routes
3. Infrastructure module
   - Airport hierarchy + ward/room/bed CRUD
4. Incident pipeline
   - Incident + patient + triage
5. Allocation engine
   - Auto allocation + transfer/release + conflict-safe transactions
6. Dashboards + notifications
   - KPIs, realtime occupancy updates, alert rules
7. Audit + compliance
   - full actor tracing, immutable logs, exports
8. Hardening
   - performance, security, load tests, monitoring, DR checks

## 19. Recommended npm Packages

Backend:

- express
- sequelize + pg + pg-hstore
- jsonwebtoken
- bcryptjs
- express-validator or zod
- helmet
- cors
- express-rate-limit
- pino + pino-http
- socket.io
- bullmq (optional)
- uuid

Frontend:

- react-router-dom
- @reduxjs/toolkit + react-redux
- axios
- react-hook-form + zod + @hookform/resolvers
- dayjs
- socket.io-client
- recharts or chart.js
- notistack (or equivalent toast library)

## 20. Validation Structure

- Route-level schema validation using zod or express-validator.
- Service-level invariant checks (business rules).
- DB-level constraints as final safety.

Validation examples:

- Incident type must be from controlled enum.
- Triage level must be P1/P2/P3/P4.
- Bed type must match required medical condition constraints.

## 21. Error Handling Architecture

- Standard response envelope:
  - success: boolean
  - message: string
  - data: object|null
  - error: { code, details, requestId }|null
- Centralized error middleware maps domain errors to HTTP codes.
- Include requestId in logs and responses.

## 22. Audit Logging Approach

For every critical action, log:

- who (`actor_user_id`)
- what (`action`, `entity_type`, `entity_id`)
- before/after state (`old_values_json`, `new_values_json`)
- when (`created_at`)
- where (`ip`, `user_agent`)

Mandatory audit events:

- login/logout
- incident create/update/close
- triage create/update
- allocation/transfer/release
- role/permission updates

## 23. Realtime Updates Approach

- Use Socket.IO namespaces:
  - `/ops` dashboards
  - `/wards` bed board
- Emit events:
  - `incident.created`
  - `triage.completed`
  - `bed.allocated`
  - `bed.released`
  - `alert.raised`
- Persist events to DB for replay if clients reconnect.

## 24. Security Best Practices

- Hash passwords with bcrypt (minimum 12 salt rounds in production).
- Short-lived access token + refresh token rotation.
- httpOnly + secure cookies for refresh token.
- Use Helmet, CORS allowlist, rate limiting.
- Parameterized queries via ORM/query builder.
- Input sanitization and strict validation.
- Principle of least privilege for DB and APIs.
- Encrypt sensitive fields where required.
- Periodic secret rotation and audit review.

## 25. Scalability Recommendations

- Use modular monolith first, evolve to services by bounded context if needed.
- Read/write split for analytics workloads.
- Add Redis for caching and queue-driven async jobs.
- Partition large audit and event tables by date.
- Use connection pooling and proper DB indexing.
- Add API versioning from day one (`/api/v1`).

## 26. API Request/Response Examples

### Create incident

Request:

```http
POST /api/v1/incidents
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "HEART_ATTACK",
  "severity": "CRITICAL",
  "terminalId": 2,
  "location": "Terminal 2 - Gate A5",
  "description": "Passenger collapsed"
}
```

Response:

```json
{
  "success": true,
  "message": "Incident created",
  "data": {
    "id": 1102,
    "incidentNo": "INC-2026-0001102",
    "status": "OPEN"
  },
  "error": null
}
```

### Auto allocation

Request:

```http
POST /api/v1/allocations/auto
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": 9001,
  "triageAssessmentId": 33001
}
```

Response:

```json
{
  "success": true,
  "message": "Bed allocated",
  "data": {
    "allocationId": 78009,
    "ward": "Cardiology ICU",
    "room": "ICU-2A",
    "bed": "ICU-2A-03"
  },
  "error": null
}
```

## 27. Environment Setup

Backend `.env` should include:

- `NODE_ENV`
- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `CORS_ORIGIN`

Frontend `.env` should include:

- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_APP_NAME`

## 28. Local Setup Steps

1. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
2. Configure environment files from `.env.example`.
3. Create PostgreSQL database.
4. Run backend: `cd backend && npm run dev`
5. Run frontend: `cd frontend && npm run dev`
6. Open Vite URL and test login + health API.

---

This document is the implementation blueprint. Next execution step is to convert this plan into actual modules, migrations, and APIs incrementally by phase.
