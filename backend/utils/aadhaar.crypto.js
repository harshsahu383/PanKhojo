import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const getKey = () => {
  const value = process.env.AADHAAR_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error('AADHAAR_ENCRYPTION_KEY must be a 64-character hexadecimal (32-byte) key.');
  }
  return Buffer.from(value, 'hex');
};

export const encryptAadhaar = (aadhaar) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(aadhaar, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

export const decryptAadhaar = (payload) => {
  const [ivPart, tagPart, dataPart] = String(payload || '').split('.');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Invalid encrypted Aadhaar payload.');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final()
  ]).toString('utf8');
};
