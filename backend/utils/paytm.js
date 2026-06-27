/**
 * Paytm Checksum Utilities
 *
 * This module implements Paytm's official AES-128-CBC + SHA-256 checksum
 * algorithm exactly as documented at:
 *   https://developer.paytm.com/docs/checksum/
 *
 * The same logic is used by Paytm's official `paytmchecksum` npm package.
 * We reimplement it here so the project has zero non-essential dependencies
 * for payments and works offline.
 */
import crypto from 'node:crypto';

const IV = '@@@@&&&&####$$$$';

const randomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
};

const encrypt = (text, key) => {
  const cipher = crypto.createCipheriv('AES-128-CBC', key, IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

const decrypt = (text, key) => {
  const decipher = crypto.createDecipheriv('AES-128-CBC', key, IV);
  let decrypted = decipher.update(text, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generate the checksum hash for a payment params object.
 * @param {Object} params  Paytm request body (without CHECKSUMHASH)
 * @param {string} key     Paytm merchant key
 */
export const generateChecksum = async (params, key) => {
  const data = { ...params };
  const sortedKeys = Object.keys(data).sort();
  const values = sortedKeys
    .map((k) => (data[k] === undefined || data[k] === null ? '' : String(data[k])))
    .join('|');

  const salt = randomString(4);
  const finalString = `${values}|${salt}`;
  const hash = crypto.createHash('sha256').update(finalString).digest('hex');
  const hashWithSalt = `${hash}${salt}`;
  return encrypt(hashWithSalt, key);
};

/**
 * Verify the checksum hash returned by Paytm in the callback.
 * @param {Object} params       Paytm callback body (without CHECKSUMHASH)
 * @param {string} key          Paytm merchant key
 * @param {string} checksumHash The CHECKSUMHASH value Paytm returned
 */
export const verifyChecksum = (params, key, checksumHash) => {
  if (!checksumHash) return false;
  try {
    const decoded = decrypt(checksumHash, key);
    const salt = decoded.slice(-4);
    const hash = decoded.slice(0, -4);

    const data = { ...params };
    delete data.CHECKSUMHASH;
    delete data.checksumhash;

    const sortedKeys = Object.keys(data).sort();
    const values = sortedKeys
      .map((k) => (data[k] === undefined || data[k] === null ? '' : String(data[k])))
      .join('|');
    const finalString = `${values}|${salt}`;
    const recomputed = crypto.createHash('sha256').update(finalString).digest('hex');
    return recomputed === hash;
  } catch (err) {
    return false;
  }
};

export default { generateChecksum, verifyChecksum };
