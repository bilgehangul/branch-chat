// backend/tests/auth.test.ts
// Wave 0 stub. Tests will pass once Plan 03 creates backend/src/index.ts.
// Intentionally failing until the app is wired up.

describe('Auth middleware — 401 on all routes without JWT', () => {
  // Populated in Plan 03 when src/index.ts exists.
  // Stubs here satisfy the Nyquist Wave 0 requirement.

  it.todo('POST /api/chat without JWT returns 401 with UNAUTHORIZED code');
  it.todo('POST /api/simplify without JWT returns 401 with UNAUTHORIZED code');
  it.todo('POST /api/find-sources without JWT returns 401 with UNAUTHORIZED code');
  it.todo('POST /api/chat with invalid JWT returns 401');
});
