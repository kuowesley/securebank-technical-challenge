import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const getKey = (envVarName: string, fallbackSecret: string): Buffer => {
  const envValue = process.env[envVarName];

  if (envValue) {
    // Expecting 32-byte hex string in env var
    const key = Buffer.from(envValue, 'hex');

    if (key.length !== 32) {
      throw new Error(`${envVarName} must be 32 bytes`);
    }

    return key;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`CRITICAL SECURITY ERROR: Missing ${envVarName} environment variable in production. Server cannot start securely.`);
  }

  // Fallback for Development/Test only
  // console.warn(`[SECURITY WARNING] Using insecure fallback for ${envVarName}. DO NOT deploy this to production.`);
  return crypto.createHash('sha256').update(fallbackSecret).digest();
};

// 32 bytes (256 bits) keys
const ENCRYPTION_KEY = getKey('ENCRYPTION_KEY', 'secure-bank-fallback-encryption-key-dev-only');
const SSN_INDEX_KEY = getKey('SSN_INDEX_KEY', 'secure-bank-fallback-ssn-index-key-dev-only');

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
  // Use HMAC-SHA256 for the blind index (hashing SSN for uniqueness checks)
  // HMAC prevents rainbow table attacks since the attacker needs the SSN_INDEX_KEY
  const hmac = crypto.createHmac('sha256', SSN_INDEX_KEY);
  hmac.update(text);
  return hmac.digest('hex');
};
