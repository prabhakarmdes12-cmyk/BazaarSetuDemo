// Runs once after the suite — removes the test database file.
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const db = path.join(__dirname, '..', '..', 'prisma', 'test.db');
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      fs.unlinkSync(db + suffix);
    } catch {
      // ignore — file may already be gone or locked on Windows
    }
  }
};
