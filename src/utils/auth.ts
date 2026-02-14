import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Password Security
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Token Management
export const generateTokens = (userId: string, role: string, organizationId: string) => {
  const accessToken = jwt.sign(
    { 
      userId, 
      role, 
      organizationId,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { 
      userId, 
      role, 
      organizationId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count };
};

// Input Sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 500); // Limit length
};

// Session Management
export class SessionManager {
  private static sessions = new Map<string, { userId: string; expires: number }>();

  static createSession(userId: string): string {
    const sessionId = crypto.randomUUID();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    this.sessions.set(sessionId, { userId, expires });
    return sessionId;
  }

  static validateSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expires) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session.userId;
  }

  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expires) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Auto cleanup every hour
setInterval(() => SessionManager.cleanup(), 60 * 60 * 1000);
