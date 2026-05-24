const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_HEX = process.env.ENCRYPTION_KEY;

// Derive a 32-byte key from env (must be 64 hex chars = 32 bytes)
const getKey = () => {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32');
  }
  return Buffer.from(KEY_HEX, 'hex');
};

/**
 * Encrypt a plaintext string.
 * Returns a string in the format "iv_hex:encrypted_hex"
 */
const encryptToken = (plaintext) => {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt a string previously encrypted with encryptToken.
 * Expects "iv_hex:encrypted_hex" format.
 */
const decryptToken = (stored) => {
  if (!stored) return null;
  const [ivHex, encryptedHex] = stored.split(':');
  if (!ivHex || !encryptedHex) return null;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = { encryptToken, decryptToken };
