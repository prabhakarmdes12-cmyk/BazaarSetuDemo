// Environment validation — fail fast in production, mirroring the chiti-console pattern.
// JWT secret is env-only with NO hardcoded fallback in production.

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production. Set it to a long random string.');
    }
    // Development-only convenience value — never used in production.
    return 'dev-only-insecure-secret';
  }
  return secret;
}

export function validateEnv() {
  if (process.env.NODE_ENV === 'development') return;

  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.\n` +
        'Check backend/.env.example for the full list of required variables.',
    );
  }
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (raw) return raw.split(',').map((o) => o.trim()).filter(Boolean);
  // Development default — the Next.js dev server.
  return ['http://localhost:3000', 'http://localhost:3001'];
}
