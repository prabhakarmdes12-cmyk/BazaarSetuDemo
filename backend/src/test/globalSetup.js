// Runs once before the suite — pushes the Prisma schema onto the test DB.
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const root = path.join(__dirname, '..', '..');
  const testDb = path.join(root, 'prisma', 'test.db').replace(/\\/g, '/');

  execSync('npx prisma db push --skip-generate --force-reset', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: `file:${testDb}` },
  });
};
