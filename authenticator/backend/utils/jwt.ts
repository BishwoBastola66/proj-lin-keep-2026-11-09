import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hqzrqmtxzhpwjlejxcfp.supabase.co';

// Remote JWKS for Supabase
const jwksUrl = new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(jwksUrl);

export const signToken = (userId: string, expiresIn: string = '7d') => {
  // We keep this for our custom registration, using the symmetric secret
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
};

/**
 * Verifies a token. Supports both custom signed tokens (symmetric) 
 * and Supabase issued tokens (asymmetric JWKS).
 */
export const verifyToken = async (token: string) => {
  try {
    // First, try verifying against the Supabase JWKS (for Supabase Auth tokens)
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'supabase',
    });
    return { userId: payload.sub as string };
  } catch (jwksError) {
    try {
      // If that fails, fallback to verifying against our custom symmetric secret
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return { userId: decoded.userId };
    } catch (symmetricError) {
      return null; // Both verifications failed
    }
  }
};
