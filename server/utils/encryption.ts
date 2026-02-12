import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// In a real app, this key should be in process.env.ENCRYPTION_KEY and properly managed.
// For this assessment, we use a fixed fallback if the env var is missing.
// The key must be 32 bytes (256 bits).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
  : crypto.createHash('sha256').update('secure-bank-fallback-key').digest();

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV:AuthTag:EncryptedContent
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (text: string) => {
  const parts = text.split(':');
  // Check if it's already encrypted format. If not (legacy plaintext), return as is or handle error.
  // For migration purposes, if it doesn't match format, we assume it's plaintext and return it?
  // No, decrypt should expect encrypted text. Migration logic should handle detection.
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const hash = (text: string) => {
  // Use SHA-256 for the blind index (hashing SSN for uniqueness checks)
  return crypto.createHash('sha256').update(text).digest('hex');
};
