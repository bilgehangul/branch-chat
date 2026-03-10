# Phase 7: Auth Migration + Persistent Storage - Research

**Researched:** 2026-03-09
**Domain:** Google OAuth (google-auth-library + @react-oauth/google), MongoDB Atlas + Mongoose, Clerk removal
**Confidence:** HIGH (core patterns verified against official sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Remove Clerk entirely from frontend and backend (no Clerk SDK, no Clerk middleware, no Clerk environment variables)
- Use Google OAuth for sign-in — frontend shows a "Sign in with Google" button using @react-oauth/google
- Backend verifies Google ID tokens using google-auth-library (official Google npm package) — no Passport.js
- After Google login, store the Google ID token in localStorage
- Send as `Authorization: Bearer <token>` header on every API call
- Backend middleware verifies token on every request and extracts user identity (sub, email, name)
- MongoDB Atlas (cloud-hosted) for all persistent storage
- Use mongoose as the ODM
- Collections: users, sessions, threads, messages
- User sessions reference the Google sub (user ID) from the verified token
- Every thread and message is saved to MongoDB as it is created/streamed
- On load, the app fetches the user's session list from the backend and hydrates the Zustand store
- Branch relationships (parentThreadId, depth) are stored on thread documents
- A sidebar or list shows the user's previous chat sessions (root threads) sorted by last activity
- Clicking a session loads all its threads and messages from the backend into the Zustand store
- The existing Zustand store shape (flat Record<id, Thread> and Record<id, Message>) must be preserved

### Claude's Discretion
- MongoDB schema design details (indexes, TTL for sessions)
- Error handling for expired/invalid Google tokens (return 401, frontend redirects to sign-in)
- Loading states for history fetch
- Pagination strategy for history list (start with most recent 20)

### Deferred Ideas (OUT OF SCOPE)
- Multi-device real-time sync (out of scope — load on login is sufficient)
- Social login providers beyond Google (out of scope for now)
- Database backups / export (out of scope)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up and sign in (now: with Google OAuth, replacing Clerk email/password) | @react-oauth/google GoogleLogin component + GoogleOAuthProvider setup |
| AUTH-02 | User can sign in with Google OAuth | @react-oauth/google credential flow → backend verifyIdToken → upsert user |
| AUTH-03 | Login is optional — unauthenticated users can access and use the full chat interface | Guest path preserved: no token sent, backend returns 401 only on protected routes; DemoChat/guest flow stays intact |
| AUTH-04 | Every backend API call validates the JWT before processing | google-auth-library OAuth2Client.verifyIdToken() middleware replacing Clerk getAuth() |
| AUTH-05 | Logout clears all in-memory session state | localStorage.removeItem(token key) + Zustand clearSession() |
</phase_requirements>

---

## Summary

Phase 7 replaces Clerk with Google OAuth and adds MongoDB Atlas persistence. The migration has three independent workstreams that must be done in order: (1) swap auth — remove Clerk, add google-auth-library on backend and @react-oauth/google on frontend; (2) add MongoDB — wire Mongoose connection and define four schemas; (3) add persistence APIs — endpoints for session CRUD and history loading, plus frontend hydration of Zustand on login.

The existing `api/client.ts` already sends `Authorization: Bearer <token>` headers and dispatches `auth-expired` on 401, so the API layer is auth-provider-agnostic. The main surgery is replacing `getAuth(req)` (Clerk) with `verifyIdToken()` (Google) in the backend middleware, and replacing `useAuth()` / `ClerkProvider` with a custom auth context backed by localStorage on the frontend.

The Zustand store shape (flat `Record<string, Thread>` and `Record<string, Message>`) does not change. MongoDB becomes the source of truth on session load; the in-memory store is hydrated from the backend response after login.

**Primary recommendation:** Implement in three sequential waves — Wave 1: auth swap (Clerk out, Google in, no persistence yet), Wave 2: Mongoose connection + schema definitions + session/thread/message save-on-write, Wave 3: history API + frontend history view.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| google-auth-library | ^10.6.1 | Backend Google ID token verification | Official Google npm package; OAuth2Client.verifyIdToken() handles signature, aud, exp, iss validation automatically |
| @react-oauth/google | ^0.13.4 | Frontend Google sign-in button and token flow | Wraps Google Identity Services SDK; only maintained React wrapper for GIS |
| mongoose | ^8.x (latest 8.x line) | MongoDB ODM with TypeScript schema definitions | Project uses ts-jest/CommonJS on backend; Mongoose 8 has stable TypeScript generics |
| mongodb (transitive) | via mongoose | Atlas connection driver | Included by mongoose; no direct install needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/mongoose | N/A (bundled) | TypeScript types | Included in mongoose >= 5.11; no separate install |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| google-auth-library | Passport.js + passport-google-oauth20 | Locked out by CONTEXT.md decision; google-auth-library is lighter and more direct |
| mongoose | native MongoDB driver | Mongoose gives schema validation, middleware hooks, and TypeScript models at the cost of slight overhead — worth it for this project |

**Installation (backend):**
```bash
npm install google-auth-library mongoose
```

**Installation (frontend):**
```bash
npm install @react-oauth/google
```

**Uninstall (backend):**
```bash
npm uninstall @clerk/express
```

**Uninstall (frontend):**
```bash
npm uninstall @clerk/clerk-react
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
backend/src/
├── db/
│   ├── connection.ts        # mongoose.connect(), event listeners
│   └── models/
│       ├── User.ts          # googleSub, email, name
│       ├── Session.ts       # userId ref, TTL index on createdAt
│       ├── Thread.ts        # sessionId, parentThreadId, depth, messages array ref
│       └── Message.ts       # threadId, role, content, timestamp
├── middleware/
│   └── auth.ts              # REPLACED: verifyGoogleToken() using OAuth2Client
└── routes/
    ├── sessions.ts          # GET /api/sessions, GET /api/sessions/:id, POST /api/sessions
    └── index.ts             # add sessionsRouter

frontend/src/
├── contexts/
│   └── AuthContext.tsx      # REPLACES Clerk: GoogleOAuthProvider wrapper + token storage
├── components/
│   └── history/
│       └── SessionHistory.tsx  # list of past sessions, click to load
└── api/
    └── sessions.ts          # fetch /api/sessions, /api/sessions/:id
```

### Pattern 1: Backend Token Verification Middleware

**What:** Replace `clerkMiddleware()` + `getAuth(req)` with a custom Express middleware that extracts the Bearer token, calls `OAuth2Client.verifyIdToken()`, and attaches the verified user to `req`.

**When to use:** Every authenticated route (same placement as current `requireApiAuth`).

**Source:** [Google backend auth guide](https://developers.google.com/identity/sign-in/web/backend-auth)

```typescript
// backend/src/middleware/auth.ts
import { OAuth2Client } from 'google-auth-library';
import type { Request, Response, NextFunction } from 'express';

const googleClient = new OAuth2Client();

// Extend Express Request to carry verified user
declare global {
  namespace Express {
    interface Request {
      verifiedUser?: { sub: string; email: string; name: string };
    }
  }
}

export async function requireApiAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Google ID token required.' },
    });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new Error('No sub in token payload');

    req.verifiedUser = {
      sub: payload.sub,
      email: payload.email ?? '',
      name: payload.name ?? '',
    };
    next();
  } catch {
    res.status(401).json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired Google token.' },
    });
  }
}
```

**Key points:**
- `new OAuth2Client()` with no arguments — the `audience` goes in `verifyIdToken()` options, not the constructor (constructor arg is for different flows).
- `payload.sub` is the stable Google account identifier — use as primary key across all models.
- The middleware is async; Express 5 (which this project uses) handles async errors automatically.
- No `clerkMiddleware()` global call in `index.ts` needed — this middleware runs per-router via `apiRouter.use(requireApiAuth)`.

### Pattern 2: Rate Limiter Key Generator (Clerk removal)

The existing `rateLimiter.ts` imports `getAuth` from `@clerk/express`. This must be replaced:

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (req: Request) => {
    // req.verifiedUser is set by requireApiAuth — may not exist on unauthenticated paths
    const userId = req.verifiedUser?.sub;
    const ip = req.ip ?? 'anonymous';
    return userId ?? (ip === 'anonymous' ? 'anonymous' : ipKeyGenerator(ip));
  },
  // ... rest unchanged
});
```

Note: `requireApiAuth` runs after the rate limiter in the current middleware order (rate limiter is at `/api`, auth guard is inside `apiRouter`). `req.verifiedUser` will be undefined here. Options: (a) move rate limiter inside `apiRouter` after auth, or (b) do a lightweight inline token parse (without full verification) just for key generation. Simplest: use IP for all rate limiting in Phase 7 (userId rate limiting is a v2 concern).

### Pattern 3: Frontend Auth Context (replaces Clerk)

**What:** A React context that wraps `GoogleOAuthProvider`, stores the credential (Google ID token) in localStorage, and exposes `isSignedIn`, `user`, `token`, `signOut` to the app.

**When to use:** Wrap `App` in `main.tsx`; consume `useAuth()` hook anywhere `useAuth()` from Clerk was used.

```typescript
// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const TOKEN_KEY = 'google_id_token';

interface AuthUser { sub: string; email: string; name: string; picture?: string }
interface AuthContextValue {
  isSignedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  getToken: () => Promise<string | null>;
  signIn: (credential: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? decodeGoogleToken(stored) : null;
  });

  const signIn = useCallback((credential: string) => {
    localStorage.setItem(TOKEN_KEY, credential);
    setToken(credential);
    setUser(decodeGoogleToken(credential));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // getToken matches the same signature as Clerk's getToken — no api/ changes needed
  const getToken = useCallback(async () => token, [token]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ isSignedIn: !!token, user, token, getToken, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Decode the JWT payload without verification (verification is done on backend)
function decodeGoogleToken(credential: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]!));
    return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
  } catch {
    return null;
  }
}
```

**Key points:**
- `GoogleOAuthProvider` must wrap the entire tree that uses `GoogleLogin` or `useGoogleLogin`.
- The `credential` from `GoogleLogin.onSuccess` is the raw Google ID token (a JWT string). This is exactly what the backend `verifyIdToken()` expects.
- `getToken` is kept as `() => Promise<string | null>` — the existing `api/chat.ts`, `api/search.ts`, `api/simplify.ts`, and `api/client.ts` all accept this signature without changes.
- `decodeGoogleToken` uses `atob` + `JSON.parse` for client-side name/email display only — never trust this for authorization, only the backend verifies.

### Pattern 4: Google Sign-In Button

**What:** The `GoogleLogin` component renders a styled Google-branded button. Its `onSuccess` callback receives a `credentialResponse` with the `credential` string (the ID token).

```typescript
// frontend/src/components/auth/SignInButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

export function SignInButton() {
  const { signIn } = useAuth();

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          signIn(credentialResponse.credential);
        }
      }}
      onError={() => console.error('Google sign-in failed')}
      theme="filled_black"
      shape="rectangular"
      text="signin_with"
    />
  );
}
```

**Alternative — useGoogleLogin hook (if custom button needed):**
```typescript
import { useGoogleLogin } from '@react-oauth/google';
// NOTE: useGoogleLogin with default flow='implicit' returns an ACCESS TOKEN, not an ID token.
// To get an ID token for backend verification, use flow='auth-code' OR use the GoogleLogin component.
// For this project: use GoogleLogin component — it directly returns the credential (ID token).
```

**Critical distinction:** `GoogleLogin` (component) → `credentialResponse.credential` is the **ID token** (what `verifyIdToken()` expects). `useGoogleLogin()` with `flow='implicit'` returns an **access token** (wrong type for `verifyIdToken()`). Use `GoogleLogin` component.

### Pattern 5: Mongoose Connection in Express

```typescript
// backend/src/db/connection.ts
import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  mongoose.connection.on('connected', () =>
    console.log('MongoDB connected')
  );
  mongoose.connection.on('error', (err) =>
    console.error('MongoDB error:', err)
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('MongoDB disconnected — retrying automatically')
  );

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}
```

```typescript
// backend/src/index.ts — startup sequence
import { connectDB } from './db/connection.js';

async function start() {
  await connectDB(); // fail fast if DB unreachable
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
```

Note: The current `index.ts` exports `app` and `server` at module scope (used by `auth.test.ts` via supertest). The refactored version should still export `app` for tests but move `listen()` into an async `start()` wrapper. Tests that import `app` directly do not call `listen()`.

### Pattern 6: Mongoose Schema Definitions

**Source:** [Mongoose TypeScript docs](https://mongoosejs.com/docs/typescript/schemas.html)

```typescript
// backend/src/db/models/User.ts
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  googleSub: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const User = model('User', userSchema);
```

```typescript
// backend/src/db/models/Session.ts
import { Schema, model } from 'mongoose';

const sessionSchema = new Schema({
  userId: { type: String, required: true, index: true }, // googleSub
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

// TTL: auto-delete sessions inactive for 90 days
sessionSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Session = model('Session', sessionSchema);
```

```typescript
// backend/src/db/models/Thread.ts
import { Schema, model } from 'mongoose';

const threadSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  parentThreadId: { type: String, default: null },
  depth: { type: Number, required: true, min: 0, max: 4 },
  anchorText: { type: String, default: null },
  parentMessageId: { type: String, default: null },
  title: { type: String, required: true },
  accentColor: { type: String, required: true },
  childThreadIds: [String],
  scrollPosition: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const Thread = model('Thread', threadSchema);
```

```typescript
// backend/src/db/models/Message.ts
import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
  threadId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const Message = model('Message', messageSchema);
```

**Design notes:**
- All IDs stored as `String` (not `ObjectId`) — the frontend generates `crypto.randomUUID()` IDs; MongoDB `_id` is a secondary concern. The `id` field from the frontend is stored as a separate field, OR MongoDB `_id` is used and the frontend is updated to use MongoDB `_id` strings. Simpler: store frontend UUIDs as `_id` (type String) to avoid an extra field.
- `messageIds` array is NOT stored on Thread in Mongo — it's derived from querying `Message.find({ threadId })`. The frontend's `messageIds` array is reconstructed on load by ordering messages by `createdAt`.
- Annotations, childLeads, and simplifications are complex frontend-only structures. For Phase 7, store them as JSON blobs inside the Message document to avoid schema explosion. Use `annotations: Schema.Types.Mixed` and `childLeads: Schema.Types.Mixed`.

### Pattern 7: API Endpoints

```
GET  /api/sessions              — list user's sessions (root threads), most recent 20
GET  /api/sessions/:sessionId   — load all threads + messages for a session
POST /api/sessions              — create new session (called on first message of a new session)
POST /api/sessions/:sessionId/threads    — create a thread
POST /api/threads/:threadId/messages    — save a message to a thread
PATCH /api/messages/:messageId  — update message content (streaming complete)
```

**Session list response shape:**
```typescript
{ data: Array<{ id: string; createdAt: number; lastActivityAt: number; title: string }> }
// title = title of the root thread
```

**Session load response shape:**
```typescript
{
  data: {
    session: { id: string; createdAt: number },
    threads: Thread[],   // frontend Thread shape (matching Zustand store)
    messages: Message[], // frontend Message shape
  }
}
```

### Pattern 8: Frontend Hydration of Zustand Store

On successful login, after fetching session history:

```typescript
// After signIn + fetch /api/sessions/:id
function hydrateStore(data: { session, threads, messages }) {
  const threadsRecord: Record<string, Thread> = {};
  for (const t of data.threads) threadsRecord[t.id] = t;

  const messagesRecord: Record<string, Message> = {};
  for (const m of data.messages) messagesRecord[m.id] = m;

  // Add messageIds back to threads (sorted by createdAt)
  for (const m of data.messages) {
    const thread = threadsRecord[m.threadId];
    if (thread) thread.messageIds.push(m.id);
  }

  useSessionStore.getState().hydrateSession({
    session: data.session,
    threads: threadsRecord,
    messages: messagesRecord,
    activeThreadId: data.threads.find(t => t.depth === 0)?.id ?? null,
  });
}
```

This requires a new `hydrateSession` action on the Zustand store that sets all four fields at once (equivalent to `clearSession` + `createSession` but with pre-populated data).

### Anti-Patterns to Avoid

- **Verifying Google tokens client-side for authorization:** `atob(token.split('.')[1])` decoding is for display only. All authorization decisions use `verifyIdToken()` on the backend.
- **Storing tokens in sessionStorage instead of localStorage:** sessionStorage is cleared on tab close; localStorage persists across browser sessions as required by the session restore requirement.
- **Calling `verifyIdToken()` on every SSE chunk:** Verify once per request only. The SSE route (`/api/chat`) is already protected by `requireApiAuth` middleware, which runs before the route handler. Do not call it again inside the stream.
- **Mongoose model re-registration:** In test environments with module resets, model re-registration causes "Cannot overwrite model once compiled" errors. Guard with `mongoose.models.ModelName ?? model('ModelName', schema)`.
- **Not awaiting `connectDB()` before `app.listen()`:** If the server starts accepting requests before MongoDB connects, early requests will throw. Always await the connection.
- **Using `ObjectId` as frontend IDs:** The frontend generates `crypto.randomUUID()` strings. Use `String` type for `_id` in schemas to store them directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Google token signature verification | Custom JWT parser | `OAuth2Client.verifyIdToken()` | Verifies signature, exp, aud, iss automatically; handles Google cert rotation |
| Google sign-in button | Custom Google button | `GoogleLogin` component from @react-oauth/google | GIS SDK has specific CSP + popup requirements; custom buttons often fail popup blockers |
| Session TTL cleanup | Cron job to delete old sessions | Mongoose TTL index (`expireAfterSeconds`) | MongoDB handles deletion automatically in background |
| MongoDB connection retry | Manual reconnect loop | Mongoose built-in reconnect | Mongoose reconnects automatically on disconnect; manual loops cause duplicate connections |

---

## Common Pitfalls

### Pitfall 1: Google Token Expiry (1 hour)
**What goes wrong:** Google ID tokens expire after 1 hour. A user who keeps the tab open will start getting 401s after the token expires, with no user-visible prompt.
**Why it happens:** Google ID tokens are short-lived; unlike access tokens there is no refresh flow for ID tokens in the GIS SDK popup flow.
**How to avoid:** On every 401 from the backend, dispatch `auth-expired` custom event (already done in `api/client.ts`). The `AuthExpiredBanner` (already exists from Phase 6) catches this and prompts re-sign-in. The user must click "Sign in with Google" again — this is acceptable for the app's use pattern.
**Warning signs:** 401 responses on requests that were working; `auth-expired` event firing frequently.

### Pitfall 2: `clerkMiddleware()` Removal Order in index.ts
**What goes wrong:** `index.ts` currently calls `app.use(clerkMiddleware())` as the first middleware. The rate limiter then calls `getAuth(req)` from `@clerk/express`. Both must be removed together, and the rate limiter key generator updated simultaneously.
**Why it happens:** `getAuth()` throws if `clerkMiddleware()` hasn't run.
**How to avoid:** Remove `clerkMiddleware()` from `index.ts`, uninstall `@clerk/express`, update `rateLimiter.ts` key generator — all in the same commit.

### Pitfall 3: GOOGLE_CLIENT_ID Mismatch Between Frontend and Backend
**What goes wrong:** `verifyIdToken()` checks the `aud` claim against `process.env.GOOGLE_CLIENT_ID`. If the frontend uses a different Client ID than the backend expects, every token will fail verification.
**Why it happens:** Google OAuth credentials have separate Web Client and Server Client IDs; confusion is common.
**How to avoid:** Use one OAuth 2.0 Web Client ID for both `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend). Do not create separate server/client credentials for this use case.

### Pitfall 4: Mongoose Model Registration in Tests
**What goes wrong:** Jest/ts-jest runs multiple test files in the same process. `model('Thread', schema)` throws "Cannot overwrite `Thread` model once compiled" on second import.
**Why it happens:** Mongoose caches models globally in `mongoose.models`.
**How to avoid:** Use the guard pattern:
```typescript
export const Thread = mongoose.models.Thread ?? model('Thread', threadSchema);
```

### Pitfall 5: `req.verifiedUser` TypeScript Augmentation
**What goes wrong:** TypeScript doesn't know about `req.verifiedUser` added by the auth middleware, causing type errors in route handlers.
**Why it happens:** Express's `Request` type doesn't have `verifiedUser`.
**How to avoid:** Add a module augmentation in `auth.ts` (shown in Pattern 1 above) or in a `backend/src/types/express.d.ts` file. This is needed for routes that read `req.verifiedUser.sub` to associate data with the correct user.

### Pitfall 6: messageIds Array Not Stored in Mongo
**What goes wrong:** The Zustand `Thread.messageIds` is a derived ordered array. If stored in Mongo, it becomes a consistency problem (must update thread on every message save).
**Why it happens:** The in-memory store tracks insertion order but Mongo has its own ordering.
**How to avoid:** Do not store `messageIds` in Mongo. On session load, sort messages by `createdAt` and reconstruct `messageIds` in the hydration step.

### Pitfall 7: DemoChat Guest Path Broken
**What goes wrong:** The current `App.tsx` uses `<SignedIn>` / `<SignedOut>` from Clerk which conditionally renders `AppShell` or `DemoChat`. Removing Clerk without replacing this gate will break both paths.
**Why it happens:** `SignedIn`/`SignedOut` are Clerk components — after removal, the `isSignedIn` check must come from the new `useAuth()` context.
**How to avoid:** Replace `<SignedIn>` / `<SignedOut>` with `{isSignedIn ? <AppShell /> : <DemoChat />}` using the new `useAuth()` hook. This is a one-file change to `App.tsx`.

---

## Code Examples

Verified patterns from official sources:

### Clerk Code That Must Be Removed (complete inventory)

**backend/src/index.ts:**
```typescript
// REMOVE:
import { clerkMiddleware } from '@clerk/express';
app.use(clerkMiddleware());
```

**backend/src/middleware/auth.ts:**
```typescript
// REMOVE entire file content:
import { getAuth } from '@clerk/express';
// replace with google-auth-library pattern shown in Pattern 1
```

**backend/src/middleware/rateLimiter.ts:**
```typescript
// REMOVE:
import { getAuth } from '@clerk/express';
const { userId } = getAuth(req);
// replace with req.verifiedUser?.sub (or IP-only fallback)
```

**frontend/src/main.tsx:**
```typescript
// REMOVE:
import { ClerkProvider } from '@clerk/clerk-react';
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
// <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
// ADD: <AuthProvider> (custom) wrapping the app
```

**frontend/src/App.tsx:**
```typescript
// REMOVE:
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
// SignedIn, SignedOut components
// SignIn routing="hash" component
// REPLACE useAuth() with import { useAuth } from './contexts/AuthContext'
// isSignedIn and userId come from new auth context
```

**frontend/src/components/layout/AppShell.tsx:**
```typescript
// REMOVE:
import { UserButton } from '@clerk/clerk-react';
// <UserButton /> in header
// REPLACE: custom user display with signOut button
```

**frontend/src/components/thread/ThreadView.tsx:**
```typescript
// REMOVE:
import { useAuth } from '@clerk/clerk-react';
const { getToken } = useAuth();
// REPLACE: import { useAuth } from '../../contexts/AuthContext'
// const { getToken } = useAuth(); — same signature, no other changes needed
```

**frontend/src/tests/setup.ts:**
```typescript
// REMOVE entire Clerk mock block:
vi.mock('@clerk/clerk-react', () => ({ ... }));
// REPLACE: mock the new AuthContext or AuthProvider
```

### New Environment Variables

```bash
# backend/.env
GOOGLE_CLIENT_ID=<your-google-web-client-id>
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# frontend/.env (Vite prefix required)
VITE_GOOGLE_CLIENT_ID=<same-google-web-client-id>

# REMOVE from both .env and .env.example:
# CLERK_SECRET_KEY
# VITE_CLERK_PUBLISHABLE_KEY
```

### Session History API Response (GET /api/sessions)

```typescript
// backend/src/routes/sessions.ts
sessionsRouter.get('/', async (req, res) => {
  const userId = req.verifiedUser!.sub;
  const sessions = await Session.find({ userId })
    .sort({ lastActivityAt: -1 })
    .limit(20)
    .lean();

  const result = await Promise.all(sessions.map(async (s) => {
    const rootThread = await Thread.findOne({ sessionId: s._id.toString(), depth: 0 }).lean();
    return {
      id: s._id.toString(),
      createdAt: s.createdAt.getTime(),
      lastActivityAt: s.lastActivityAt.getTime(),
      title: rootThread?.title ?? 'Untitled',
    };
  }));

  res.json({ data: result, error: null });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Clerk JWT (RS256, Clerk-hosted) | Google ID Token (RS256, Google-hosted) | Phase 7 | Backend switches from `getAuth(req)` to `verifyIdToken()`; frontend switches from `ClerkProvider` to `GoogleOAuthProvider` |
| In-memory session only (Zustand) | MongoDB Atlas + Zustand hydration | Phase 7 | Sessions survive page refresh; history view enabled |
| `@google/generative-ai` | `@google/genai` v1.x | Phase 1 | Already done; no change in Phase 7 |

**Deprecated/outdated:**
- `@clerk/express` and `@clerk/clerk-react`: removed in Phase 7; all JWT handling moves to Google.
- `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY`: removed from all env files.

---

## Open Questions

1. **Where to save messages during streaming vs after streaming completes**
   - What we know: Messages are currently added to Zustand with `isStreaming: true` then updated with `isStreaming: false` after the stream completes. Saving the streaming message to Mongo immediately creates a half-written record.
   - What's unclear: Whether to save the skeleton on stream start and PATCH when done, or save only after stream completion.
   - Recommendation: Save only after `onDone` callback fires (in `useStreamingChat`), using the full final content. This avoids incomplete records and simplifies the API. Acceptable because the app is single-user and in-memory state is authoritative during the session.

2. **Annotation and childLead persistence format**
   - What we know: Frontend `Message` shape has `annotations: Annotation[]` and `childLeads: ChildLead[]` — rich nested objects.
   - What's unclear: Whether to normalize into separate MongoDB collections or embed as JSON blobs.
   - Recommendation: Embed as `Schema.Types.Mixed` (JSON blob) in the Message document for Phase 7. Normalization is a v2 concern. This avoids schema explosion while ensuring full fidelity on load.

3. **Token expiry and silent re-authentication**
   - What we know: Google ID tokens expire in 1 hour. The GIS SDK does support auto-refresh for One Tap, but not for the button flow.
   - What's unclear: Whether the current `AuthExpiredBanner` UX (from Phase 6) is sufficient or if silent re-auth is needed.
   - Recommendation: The existing `auth-expired` event dispatch in `api/client.ts` + `AuthExpiredBanner` is sufficient for Phase 7. The user sees a banner and clicks "Sign in again" — acceptable for a research-reading app where sessions are typically short.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Backend framework | Jest 30 + ts-jest (CommonJS transform) |
| Backend config file | `backend/jest.config.ts` |
| Backend quick run | `cd backend && npm test` |
| Frontend framework | Vitest 4 + jsdom + @testing-library/react |
| Frontend config file | `frontend/vitest.config.ts` |
| Frontend quick run | `cd frontend && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Google sign-in button renders and triggers login | unit | `cd frontend && npx vitest run src/tests/authContext.test.tsx` | Wave 0 |
| AUTH-02 | Google credential triggers signIn(), stores token in localStorage | unit | `cd frontend && npx vitest run src/tests/authContext.test.tsx` | Wave 0 |
| AUTH-03 | DemoChat renders when no token in localStorage | unit | `cd frontend && npx vitest run src/tests/app.test.tsx` | Wave 0 |
| AUTH-04 | Backend returns 401 when no Bearer token | integration | `cd backend && npm test -- --testPathPattern=auth` | ✅ `backend/tests/auth.test.ts` (needs update for Google mock) |
| AUTH-04 | Backend returns 401 when token fails verifyIdToken | integration | `cd backend && npm test -- --testPathPattern=auth` | Wave 0 (update existing) |
| AUTH-05 | signOut() removes token from localStorage and clears Zustand | unit | `cd frontend && npx vitest run src/tests/authContext.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npm test && cd ../frontend && npx vitest run`
- **Per wave merge:** Same (both suites are fast)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/tests/authContext.test.tsx` — covers AUTH-01, AUTH-02, AUTH-05; tests AuthProvider signIn/signOut + localStorage
- [ ] `frontend/src/tests/app.test.tsx` — covers AUTH-03; tests guest path vs signed-in path rendering
- [ ] `backend/tests/auth.test.ts` — UPDATE: replace Clerk mock with google-auth-library mock; cover invalid token → 401 and valid token → next()
- [ ] `backend/tests/sessions.test.ts` — covers session list + load endpoints with mocked Mongoose models
- [ ] Update `frontend/src/tests/setup.ts` — remove Clerk mock, add AuthProvider mock or real AuthContext with test token

---

## Sources

### Primary (HIGH confidence)
- [Google backend auth guide](https://developers.google.com/identity/sign-in/web/backend-auth) — verifyIdToken() middleware pattern, payload fields (sub, email, name)
- [Mongoose TypeScript schemas docs](https://mongoosejs.com/docs/typescript/schemas.html) — Schema definition pattern, TypeScript generics, automatic inference recommendation
- [Mongoose connections docs](https://mongoosejs.com/docs/connections.html) — connect(), connection events, serverSelectionTimeoutMS, Express startup pattern
- [google-auth-library npm](https://www.npmjs.com/package/google-auth-library) — current version 10.6.1, OAuth2Client API

### Secondary (MEDIUM confidence)
- [@react-oauth/google GitHub README](https://github.com/MomenSherif/react-oauth) — GoogleOAuthProvider + GoogleLogin component pattern; credential vs access token distinction verified against GitHub Issues #12
- [MongoDB TTL indexes docs](https://www.mongodb.com/docs/manual/tutorial/expire-data/) — expireAfterSeconds index for session cleanup

### Tertiary (LOW confidence)
- WebSearch results on Mongoose 9.0.0 release (November 2025) — note: project should use Mongoose 8.x (LTS) as Mongoose 9.0.0 may have breaking changes not yet verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — google-auth-library 10.6.1 and @react-oauth/google 0.13.4 verified current; Mongoose version pinned to 8.x pending verification
- Architecture: HIGH — verifyIdToken() middleware pattern from official Google docs; Mongoose connection pattern from official docs
- Clerk removal inventory: HIGH — directly read all 6 affected files in the codebase; complete list of changes documented
- Pitfalls: MEDIUM — most from direct codebase analysis; token expiry from known Google OAuth behavior

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — google-auth-library and @react-oauth/google are stable; MongoDB Atlas connection patterns are stable)
