// backend/src/middleware/auth.ts
// requireApiAuth — Google ID token verification using google-auth-library.
// Google OAuth ID token verification. Attaches verified user to req.verifiedUser.
import { OAuth2Client } from 'google-auth-library';
import type { Request, Response, NextFunction } from 'express';

const googleClient = new OAuth2Client();

// Extend Express Request to carry verified user identity
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
