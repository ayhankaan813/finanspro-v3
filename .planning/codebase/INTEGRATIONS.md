# External Integrations

**Analysis Date:** 2026-02-28

## APIs & External Services

**Authentication:**
- Custom JWT-based authentication (no external provider)
  - Issued by Fastify JWT plugin at `apps/backend/src/modules/auth/auth.service.ts`
  - Token signing with HS256 algorithm
  - Access token expiry: configurable (default 4 hours)
  - Refresh token expiry: configurable (default 7 days)

**Third-Party Integrations:**
- None detected in current codebase
- No Stripe, Twilio, SendGrid, Mailgun, or other external services integrated

**Frontend-to-Backend API:**
- HTTP REST API only
- Base URL: `http://localhost:3001` (development) or configurable via `NEXT_PUBLIC_API_URL`
- Client: Custom `ApiClient` class in `apps/frontend/src/lib/api.ts`
- Authentication: Bearer token in Authorization header
- CORS enabled via @fastify/cors with configurable origins

## Data Storage

**Databases:**
- PostgreSQL 17 (required)
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma 5.12.0 ORM
  - Query logging in development mode
  - Connection pooling managed by Prisma

**File Storage:**
- Local filesystem only - No cloud storage (AWS S3, GCS, Azure Blob) configured
- No file upload endpoints currently implemented

**Caching:**
- In-memory React Query caching (frontend)
  - Managed by @tanstack/react-query 5.28.0
  - No external cache layer (Redis) configured
  - Server-side query results cached per request in Fastify

## Authentication & Identity

**Auth Provider:**
- Custom implementation (internal auth service)
  - Implementation: `apps/backend/src/modules/auth/auth.service.ts`
  - User table: `apps/backend/prisma/schema.prisma` (users model)
  - Password hashing: bcryptjs with standard salt rounds
  - User roles: ADMIN, USER (enum in schema)
  - Last login tracking: `last_login_at` field on User model
  - Soft delete support: `deleted_at` field for audit trail

**Frontend Auth Storage:**
- localStorage at key `finanspro-auth` (JSON format)
- Stores: accessToken, refreshToken, user profile
- Automatic token refresh via `refreshAccessToken()` in `apps/frontend/src/lib/api.ts`

**JWT Configuration:**
- Secret: `JWT_SECRET` env var (minimum 32 characters required)
- Signing algorithm: HS256 (HMAC with SHA-256)
- Payload includes: userId, email, role

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Rollbar, or error service configured)
- Server-side errors logged to console/files only

**Logs:**
- Pino JSON logger (development and production)
- Development: Pretty-printed output with colors and timestamps
- Production: Structured JSON format
- Log level configurable: LOG_LEVEL env var (default: info)
- Logs include: errors, warnings, info, debug, trace (when enabled)
- Database query logging in development mode

**Audit Trail:**
- Custom audit log implementation at `apps/backend/src/shared/audit-log.ts`
- Tracks: user_id, user_email, action, entity_type, entity_id, changes (JSON), timestamp
- Table: `audit_logs` in PostgreSQL

## CI/CD & Deployment

**Hosting:**
- Self-hosted deployment assumed
- No GitHub Actions workflow detected
- No Docker compose or containerization config provided

**CI Pipeline:**
- Not configured (no GitHub Actions, GitLab CI, Jenkins setup found)
- Manual build: `pnpm build` (turbo-orchestrated)
- Manual start: `npm start` in each workspace

**Deployment Scripts:**
- Database migration: `pnpm db:migrate:prod` - Runs pending Prisma migrations
- Database seed: `pnpm db:seed` - Loads test data via `apps/backend/prisma/seed.ts`
- Database studio: `pnpm db:studio` - Interactive schema browser (dev only)

## Environment Configuration

**Required env vars:**

Backend (`apps/backend/.env.example`):
```
DATABASE_URL          # PostgreSQL connection string (required)
PORT                  # Server port (default: 3001)
HOST                  # Listen address (default: 0.0.0.0)
NODE_ENV              # development | production | test
JWT_SECRET            # Minimum 32 characters (required)
JWT_ACCESS_EXPIRES_IN # Token TTL (default: 4h)
JWT_REFRESH_EXPIRES_IN# Token TTL (default: 7d)
LOG_LEVEL             # fatal|error|warn|info|debug|trace (default: info)
CORS_ORIGIN           # Comma-separated origins (default: http://localhost:3000)
```

Frontend (runtime via Next.js):
```
NEXT_PUBLIC_API_URL   # Backend API URL (default: http://localhost:3001)
```

**Secrets location:**
- `.env` file (git-ignored)
- Not committed to version control
- Production: Environment variables set in deployment platform
- Development: Local .env file with default values

**Development Defaults:**
- Database: `localhost:5432` (PostgreSQL)
- Backend: `localhost:3001`
- Frontend: `localhost:3000` (Next.js dev server)

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints for external services

**Outgoing:**
- None detected - No outgoing webhook calls to external systems

**Email Notifications:**
- No SMTP/email service integrated
- Notification system implemented at `apps/backend/src/modules/notification/` but stores locally only
- No email sending capability present

---

*Integration audit: 2026-02-28*
