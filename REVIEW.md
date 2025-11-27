# Hono Starter Project Review

This document provides a comprehensive review of the starter project with identified improvements organized by priority and category.

---

## Executive Summary

This is a well-architected modern full-stack TypeScript monorepo with strong type safety. The foundation is solid, but there are several areas that need attention before this can be considered production-ready.

**Strengths:**
- End-to-end TypeScript with type-safe APIs (tRPC)
- Clean monorepo structure with pnpm workspaces
- Modern tech stack (Hono, React 19, TanStack Router, Drizzle)
- Environment validation with Zod
- Singleton database pattern with graceful shutdown

**Areas Needing Work:**
- Security issues (credentials in example files)
- Missing tests
- Incomplete integrations (metrics, feature flags)
- Error handling gaps
- No CI/CD pipeline

---

## Critical Issues (Must Fix)

### 1. Security: GitHub Credentials Exposed in `.env.example`

**Location:** `services/api/.env.example:18-19`

```env
GITHUB_CLIENT_ID="Ov23liZBJK4VnfhROM3H"
GITHUB_CLIENT_SECRET="b472f0a85877ac3a20171bea764009b5cd3bb058"
```

**Problem:** These appear to be real OAuth credentials committed to the repository. Even in an example file, this is a security risk.

**Fix:** Replace with placeholder values:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**Action Required:** Revoke these GitHub OAuth credentials immediately if they are real.

---

### 2. Missing Error Handling

**Location:** `services/api/src/app.ts`

**Problem:** No global error handler for the Hono app. Unhandled errors will crash the server or leak stack traces.

**Recommended Fix:**
```typescript
import { HTTPException } from 'hono/http-exception';

app.onError((err, c) => {
  logger.error({ err }, 'Unhandled error');

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

---

### 3. tRPC Missing Context and Error Types

**Location:** `services/api/src/trpc/routers/app.ts`

**Problems:**
1. No context created (auth, db access not available in procedures)
2. No error handling/formatting
3. Unused `ctx` parameter in subscription

**Recommended Structure:**
```typescript
// services/api/src/trpc/context.ts
import type { Context } from 'hono';
import { getDb } from '~/db/index.js';
import { auth } from '~/lib/auth.js';

export async function createContext(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return {
    db: getDb(),
    session,
    user: session?.user ?? null,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
```

```typescript
// services/api/src/trpc/routers/app.ts
const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Protected procedure example
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

---

## High Priority Improvements

### 4. QueryClientProvider Placement Issue

**Location:** `apps/web/src/routes/__root.tsx:46-68`

**Problem:** Auth buttons are rendered OUTSIDE the QueryClientProvider, but `authClient.useSession()` may rely on React Query context depending on the implementation.

**Recommended Fix:**
```tsx
function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedLayout />
      <Outlet />
      <TickerComponent />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

function AuthenticatedLayout() {
  const { data } = authClient.useSession();
  // ... auth buttons
}
```

---

### 5. No Tests Written

**Location:** `services/api/vitest.config.ts`

**Problem:** Vitest is configured but there are no test files. The README marks "Unit Testing" as complete, but no tests exist.

**Recommended:**

Create basic test structure:
```
services/api/src/
├── __tests__/
│   ├── routes/
│   │   └── health.test.ts
│   ├── trpc/
│   │   └── app.test.ts
│   └── setup.ts
```

Example health check test:
```typescript
// services/api/src/__tests__/routes/health.test.ts
import { describe, it, expect } from 'vitest';
import app from '../../app';

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
  });
});
```

---

### 6. Inconsistent Logging

**Location:** Multiple files

**Problem:** Mix of `console.log`, `console.error`, and the Pino logger. The Pino logger is set up but underutilized.

**Locations using console instead of logger:**
- `services/api/src/db/index.ts:27-30` - Uses `console.error` and `console.log`
- `services/api/src/app.ts:34` - Uses `console.log` for startup message

**Fix:** Replace all console calls with the Pino logger:
```typescript
import logger from '~/lib/logger.js';

logger.info('PostgreSQL connection pool initialized');
logger.error({ err }, 'Unexpected error on idle client');
```

---

### 7. Missing CORS Configuration

**Location:** `services/api/src/app.ts`

**Problem:** No CORS middleware configured. The frontend runs on port 5003, API on 5001. While Vite proxies in dev, production will need CORS.

**Recommended Fix:**
```typescript
import { cors } from 'hono/cors';

app.use('/api/*', cors({
  origin: env.WEB_URL,
  credentials: true,
}));
```

---

## Medium Priority Improvements

### 8. Database Pool Error Handling

**Location:** `services/api/src/db/index.ts:26-28`

**Problem:** Pool errors are logged to console but not handled properly. Should use the Pino logger and potentially implement reconnection logic.

```typescript
poolInstance.on('error', err => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
  // Consider: reconnection logic or alerting
});
```

---

### 9. Prometheus Metrics Not Integrated

**Location:** `services/api/package.json`

**Problem:** `@hono/prometheus` and `prom-client` are installed but not used anywhere in the codebase.

**Recommended Integration:**
```typescript
// services/api/src/app.ts
import { prometheus } from '@hono/prometheus';

const { printMetrics, registerMetrics } = prometheus();

app.use('*', registerMetrics);
app.get('/metrics', printMetrics);
```

---

### 10. Feature Flags (Unleash) Not Integrated

**Location:** `docker-compose.yml`

**Problem:** Unleash is deployed via Docker Compose but there's no client integration in the codebase.

**Recommended:**
```typescript
// services/api/src/lib/unleash.ts
import { initialize } from 'unleash-client';

export const unleash = initialize({
  url: 'http://localhost:4242/api',
  appName: env.APP_NAME,
  customHeaders: { Authorization: env.UNLEASH_API_TOKEN },
});

// Usage
if (unleash.isEnabled('new-feature')) {
  // feature code
}
```

---

### 11. Missing Rate Limiting

**Location:** `services/api/src/app.ts`

**Problem:** No rate limiting on API endpoints. This is important for auth endpoints to prevent brute force attacks.

**Recommended:**
```typescript
import { rateLimiter } from 'hono-rate-limiter';

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.req.header('x-forwarded-for') ?? '',
});

app.use('/api/auth/*', limiter);
```

---

### 12. Missing Request ID / Correlation ID

**Location:** `services/api/src/app.ts`

**Problem:** No request ID tracking for debugging distributed requests.

**Recommended:**
```typescript
import { requestId } from 'hono/request-id';

app.use('*', requestId());

// Then in logger middleware, include c.get('requestId')
```

---

### 13. Subscription Cleanup

**Location:** `services/api/src/trpc/routers/app.ts:13-18`

**Problem:** The ticker subscription runs forever with no cleanup or abort handling.

**Recommended:**
```typescript
ticker: publicProcedure.subscription(async function* ({ signal }) {
  while (!signal?.aborted) {
    yield { data: 'tick' };
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}),
```

---

## Low Priority / Nice-to-Have

### 14. Add `.gitignore` Entries

Ensure these are in `.gitignore`:
```
# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/

# Coverage
coverage/

# Drizzle
drizzle/meta/
```

---

### 15. Add Health Check Database Connectivity

**Location:** `services/api/src/routes/health.ts`

**Problem:** Health check likely doesn't verify database connectivity.

**Recommended:**
```typescript
import { getDb } from '~/db/index.js';
import { sql } from 'drizzle-orm';

health.get('/', async (c) => {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return c.json({ status: 'healthy', db: 'connected' });
  } catch (error) {
    return c.json({ status: 'unhealthy', db: 'disconnected' }, 503);
  }
});
```

---

### 16. Add TypeScript Path Aliases to Frontend

**Location:** `apps/web/tsconfig.app.json`

**Problem:** Frontend doesn't have path aliases like the API does (`~/`).

**Recommended:** Add to `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

And update `vite.config.ts`:
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  // ...
});
```

---

### 17. Add Pre-commit Hooks

**Problem:** No commit hooks to enforce code quality.

**Recommended:** Add Husky + lint-staged:
```bash
pnpm add -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
pnpm biome:check
pnpm lint-staged
```

---

### 18. Add CI/CD Pipeline

**Problem:** No automated testing or deployment pipeline.

**Recommended:** Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm biome:check
      - run: pnpm test
```

---

### 19. Dev Tools Should Be Conditional

**Location:** `apps/web/src/routes/__root.tsx:64-65`

**Problem:** Dev tools are always rendered, even in production.

**Recommended:**
```tsx
{import.meta.env.DEV && <TanStackRouterDevtools />}
{import.meta.env.DEV && <ReactQueryDevtools />}
```

---

### 20. User Alert on Sign Out

**Location:** `apps/web/src/routes/__root.tsx:39`

**Problem:** Using `alert()` for sign-out notification is poor UX.

**Recommended:** Use a toast notification library or simply reload/redirect.

---

## Architecture Suggestions

### 21. Extract Shared Types Package

Create `packages/shared` for types used by both frontend and backend:
```
packages/
└── shared/
    ├── src/
    │   └── types/
    │       ├── user.ts
    │       └── index.ts
    └── package.json
```

---

### 22. Add API Versioning

Consider versioning the API for future breaking changes:
```typescript
app.route('/api/v1/health', health);
app.use('/api/v1/trpc/*', trpc);
```

---

## Summary Checklist

| Priority | Item | Status |
|----------|------|--------|
| Critical | Remove GitHub credentials from .env.example | Pending |
| Critical | Add global error handler | Pending |
| Critical | Add tRPC context with auth | Pending |
| High | Fix QueryClientProvider placement | Pending |
| High | Write basic tests | Pending |
| High | Use Pino logger consistently | Pending |
| High | Add CORS middleware | Pending |
| Medium | Integrate Prometheus metrics | Pending |
| Medium | Integrate Unleash feature flags | Pending |
| Medium | Add rate limiting | Pending |
| Medium | Add request ID middleware | Pending |
| Medium | Fix subscription cleanup | Pending |
| Low | Conditional dev tools | Pending |
| Low | Add pre-commit hooks | Pending |
| Low | Set up CI/CD | Pending |

---

*Review generated on: 2025-11-27*
