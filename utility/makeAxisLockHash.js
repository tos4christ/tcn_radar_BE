/**
 * Makes a new hash for the /bilaterals_fix arrangement lock.
 *   node utility/makeAxisLockHash.js "<new password>"
 * Put the printed line in the backend .env as AXIS_LOCK_HASH=... and restart. The password itself is
 * never stored anywhere.
 */
const crypto = require('crypto');

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: node utility/makeAxisLockHash.js "<password of at least 8 characters>"');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
console.log(`AXIS_LOCK_HASH=scrypt$${salt.toString('hex')}$${hash.toString('hex')}`);
