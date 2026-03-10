# Phase 7: Auth Migration + Persistent Storage - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace Clerk with Google OAuth sign-in throughout the entire codebase (frontend + backend). Add MongoDB Atlas as the persistent database for user sessions, chat threads, messages, and branch relationships. Implement a chat history view so users can load previous sessions.

</domain>

<decisions>
## Implementation Decisions

### Auth Provider
- Remove Clerk entirely from frontend and backend (no Clerk SDK, no Clerk middleware, no Clerk environment variables)
- Use Google OAuth for sign-in — frontend shows a "Sign in with Google" button using the Google Identity Services SDK (@react-oauth/google)
- Backend verifies Google ID tokens using google-auth-library (official Google npm package) — no Passport.js

### Session Storage
- After Google login, store the Google ID token in localStorage
- Send as `Authorization: Bearer <token>` header on every API call
- Backend middleware verifies token on every request and extracts user identity (sub, email, name)

### Database
- MongoDB Atlas (cloud-hosted) for all persistent storage
- Use mongoose as the ODM
- Collections: users, sessions, threads, messages
- User sessions reference the Google sub (user ID) from the verified token

### Chat Persistence
- Every thread and message is saved to MongoDB as it is created/streamed
- On load, the app fetches the user's session list from the backend and hydrates the Zustand store
- Branch relationships (parentThreadId, depth) are stored on thread documents

### Chat History View
- A sidebar or list shows the user's previous chat sessions (root threads) sorted by last activity
- Clicking a session loads all its threads and messages from the backend into the Zustand store

### Claude's Discretion
- MongoDB schema design details (indexes, TTL for sessions)
- Error handling for expired/invalid Google tokens (return 401, frontend redirects to sign-in)
- Loading states for history fetch
- Pagination strategy for history list (start with most recent 20)

</decisions>

<specifics>
## Specific Ideas

- Use `@react-oauth/google` (GoogleOAuthProvider + useGoogleLogin or GoogleLogin component) on the frontend
- Use `google-auth-library` OAuth2Client.verifyIdToken() on the backend
- MongoDB Atlas free tier (M0) is sufficient for this project
- Mongoose models: User, Session, Thread, Message
- The existing Zustand store shape (flat Record<id, Thread> and Record<id, Message>) should be preserved — MongoDB just becomes the source of truth on load

</specifics>

<deferred>
## Deferred Ideas

- Multi-device real-time sync (out of scope — load on login is sufficient)
- Social login providers beyond Google (out of scope for now)
- Database backups / export (out of scope)

</deferred>

---

*Phase: 07-auth-migration-persistent-storage*
*Context gathered: 2026-03-10 via user discussion*
