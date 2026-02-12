import { describe, it, expect } from 'vitest';
import { validateDateOfBirth, validatePassword, isValidCardNumber, MIN_PASSWORD_LENGTH } from './validation';

describe('validateDateOfBirth', () => {
  it('should return valid for a correct date', () => {
    const result = validateDateOfBirth('2000-01-01');
    expect(result.valid).toBe(true);
  });
// ... existing tests ...
  it('should return invalid for non-existent date', () => {
    expect(validateDateOfBirth('2000-02-30').valid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should return valid for a strong password', () => {
    const result = validatePassword('StrongP@ssw0rd!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return invalid for short password', () => {
    const shortPass = 'A1!a';
    const result = validatePassword(shortPass);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  });

  it('should return invalid for common password', () => {
    const commonPass = 'password123'; // Assuming this is length >= 12, but 'password' is only 8. Wait.
    // 'password' is in the common list. But 'password' is too short (8 chars).
    // Let's use a common password that is long enough if possible, or just check the common check.
    // 'password' fails length check too.
    // '123456789' is 9 chars.
    // Let's use 'password' and check for "Password is too common" error specifically.
    const result = validatePassword('password');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is too common');
  });

  it('should return invalid for missing lowercase', () => {
    const result = validatePassword('STRONGP@SSW0RD!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a lowercase letter');
  });

  it('should return invalid for missing uppercase', () => {
    const result = validatePassword('strongp@ssw0rd!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain an uppercase letter');
  });

  it('should return invalid for missing number', () => {
    const result = validatePassword('StrongP@ssword!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a number');
  });

  it('should return invalid for missing symbol', () => {
    const result = validatePassword('StrongP0ssword1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a symbol');
  });
});

describe('isValidCardNumber', () => {
  it('should return true for a valid test card', () => {
    // A valid Visa test number
    expect(isValidCardNumber('4532015112830366')).toBe(true);
  });

  it('should return false for an invalid card (Luhn check failure)', () => {
    // Same as above but last digit changed to break checksum
    expect(isValidCardNumber('4532015112830367')).toBe(false);
  });

  it('should handle spaces and dashes', () => {
    expect(isValidCardNumber('4532-0151-1283-0366')).toBe(true);
    expect(isValidCardNumber('4532 0151 1283 0366')).toBe(true);
  });

  it('should return false for too short number', () => {
    expect(isValidCardNumber('123')).toBe(false);
  });

  it('should return false for non-numeric characters', () => {
    expect(isValidCardNumber('4532a015112830366')).toBe(false);
  });
});

