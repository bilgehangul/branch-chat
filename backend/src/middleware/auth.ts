// backend/src/middleware/auth.ts
// requireApiAuth — custom API auth guard.
// Uses clerkMiddleware() + getAuth() pattern (NOT requireAuth() which redirects).
// Returns 401 JSON for unauthenticated requests so API clients receive structured errors.
import { getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

export function requireApiAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Valid authentication required. Provide a Clerk JWT in the Authorization header.',
      },
    });
    return;
  }
  next();
}
