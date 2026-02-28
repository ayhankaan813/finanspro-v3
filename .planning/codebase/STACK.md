# Technology Stack

**Analysis Date:** 2026-02-28

## Languages

**Primary:**
- TypeScript 5.4.0 - Used across all backend and frontend code with strict mode enabled

**Secondary:**
- JavaScript (configuration files only)

## Runtime

**Environment:**
- Node.js 20.0.0 (minimum) - Specified in `package.json` engines field
- tsx 4.7.1 - TypeScript execution runtime for development and database operations

**Package Manager:**
- pnpm 9.0.0 (minimum) - Monorepo package manager
- Lockfile: Yes, present as `package-lock.json` (npm format used in git)

## Frameworks

**Core:**
- Fastify 4.26.2 - Backend REST API framework
- Next.js 15.0.8 - Frontend React meta-framework with App Router
- React 19.0.0 - Frontend UI library
- Prisma 5.12.0 - ORM for database access and type generation

**Testing:**
- Vitest 1.4.0 - Unit test runner with coverage support
- No E2E test framework currently configured

**Build/Dev:**
- Turbo 2.0.0 - Monorepo build orchestration
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- PostCSS 8.4.38 - CSS transformation tool
- Autoprefixer 10.4.19 - CSS vendor prefix tool

## Key Dependencies

**Critical:**
- Decimal.js 10.4.3 - Financial arithmetic with arbitrary precision (REQUIRED for double-entry accounting)
- @prisma/client 5.12.0 - TypeScript-safe database client generated from schema
- zod 3.22.4 - TypeScript-first schema validation (backend and frontend)

**Infrastructure:**
- @fastify/helmet 11.1.1 - Security headers middleware
- @fastify/cors 9.0.1 - CORS handling
- @fastify/jwt 8.0.0 - JWT token signing/verification
- @fastify/rate-limit 9.1.0 - API rate limiting (100 requests/minute default)
- @fastify/compress 7.0.3 - Response compression (gzip)
- @fastify/swagger 8.14.0 - OpenAPI documentation generation (dev only)
- @fastify/swagger-ui 3.0.0 - Interactive API docs at `/docs` (dev only)

**Authentication:**
- bcryptjs 2.4.3 - Password hashing with bcrypt algorithm

**Logging:**
- pino 8.19.0 - High-performance JSON logger
- pino-pretty 11.0.0 - Pretty-print formatter for development logs

**Frontend State:**
- @tanstack/react-query 5.28.0 - Server state management with caching
- zustand 4.5.2 - Lightweight client state management (auth store)
- react-hook-form 7.51.0 - Performant form handling
- @hookform/resolvers 3.3.4 - Form validation resolver integration

**Frontend UI:**
- @radix-ui/* (14 packages) - Unstyled, accessible component primitives
- shadcn/ui - Copy-paste component library built on Radix UI
- lucide-react 0.359.0 - SVG icon library
- recharts 2.12.3 - React charting library for financial data visualization
- framer-motion 12.33.0 - Animation library
- class-variance-authority 0.7.1 - Type-safe CSS class variants
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 2.6.1 - Merge Tailwind classes with specificity handling

**Frontend Utilities:**
- date-fns 3.6.0 - Date manipulation (Turkish locale support available)
- react-day-picker 9.13.2 - Date picker component
- cmdk 1.1.1 - Command menu/search UI
- @dnd-kit (4 packages) - Drag-and-drop with keyboard support

**Environment:**
- dotenv 16.4.5 - Environment variable loading from `.env` files

**Development:**
- ESLint 8.57.0 - JavaScript/TypeScript linter (shared config)
- eslint-config-next 15.0.8 - Next.js ESLint preset
- Prettier 3.2.5 - Code formatter
- TypeScript Compiler - tsc for backend builds

## Configuration

**Environment:**
- `.env` files for local development (git-ignored)
- `.env.example` template for required variables
- Zod schema validation in `apps/backend/src/config/env.ts` - all env vars validated at startup
- Key configurations required:
  - `DATABASE_URL`: PostgreSQL connection string
  - `JWT_SECRET`: Minimum 32 characters
  - `PORT` (default 3001): Backend server port
  - `NODE_ENV`: development, production, or test
  - `CORS_ORIGIN`: Comma-separated allowed origins
  - `LOG_LEVEL`: fatal, error, warn, info, debug, trace

**Build:**
- `apps/backend/tsconfig.json` - ES2022 target, strict mode, path aliases (`@/*`, `@shared/*`)
- `apps/frontend/tsconfig.json` - ES2017 target, Next.js plugin integration
- `next.config.js` - Next.js configuration with API rewrites (localhost:3001) and package optimizations
- `tailwind.config.ts` - Custom color palette (Deep Space Blue theme), animation definitions
- `.prettierrc` - Code formatting rules (2-space indent, semicolons, trailing commas)
- No ESLint config file detected (uses Next.js default)

**Formatting:**
- Prettier 3.2.5 - Auto-formatting on save
- Tab width: 2 spaces
- Print width: 100 characters
- Trailing commas: ES5 compatible
- Single quotes for strings
- Semicolons enabled

## Platform Requirements

**Development:**
- PostgreSQL 17 (local or Docker)
- Node.js 20.0.0 or higher
- pnpm 9.0.0 or higher
- Git for version control

**Production:**
- Node.js 20+ runtime environment
- PostgreSQL 17+ database
- Environment variables configured (see .env.example)
- Reverse proxy (nginx) recommended for CORS, compression, security headers

**Database Requirements:**
- PostgreSQL with UUID generation support
- Decimal type support for financial calculations
- Minimum schema setup: `apps/backend/prisma/schema.prisma`

---

*Stack analysis: 2026-02-28*
