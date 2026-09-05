// Runs before every test file — points the app at the isolated test database
// and supplies a test JWT secret (never used in production).
const path = require('path');

const testDb = path.join(__dirname, '..', '..', 'prisma', 'test.db').replace(/\\/g, '/');

process.env.DATABASE_URL = `file:${testDb}`;
process.env.JWT_SECRET = 'test-only-insecure-secret';
process.env.NODE_ENV = 'test';
