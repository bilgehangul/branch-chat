// backend/tests/sessions.test.ts
// Session API route tests — implementations added in Plan 07-04 after routes are created.
// Mocks Mongoose Session, Thread, Message models to avoid real DB connection in tests.

// Mock mongoose models — prevents real DB calls
jest.mock('../src/db/models/Session.js', () => ({
  Session: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock('../src/db/models/Thread.js', () => ({
  Thread: { find: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../src/db/models/Message.js', () => ({
  Message: { find: jest.fn(), create: jest.fn() },
}));
jest.mock('../src/db/connection.js', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

describe('GET /api/sessions', () => {
  test.todo('returns list of user sessions sorted by lastActivityAt desc');
  test.todo('returns 401 when no token provided');
  test.todo('returns empty array when user has no sessions');
});

describe('GET /api/sessions/:id', () => {
  test.todo('returns session with threads and messages');
  test.todo('returns 404 when session not found');
  test.todo('returns 403 when session belongs to different user');
});

describe('POST /api/sessions', () => {
  test.todo('creates new session and root thread, returns session id');
});
