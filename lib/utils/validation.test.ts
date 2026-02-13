import { describe, it, expect } from "vitest";
import {
  validateDateOfBirth,
  validatePassword,
  isValidCardNumber,
  isValidBankAccountNumber,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateState,
  validatePhoneNumber,
} from "./validation";

describe("validateEmail", () => {
  it("should return valid for a correct email", () => {
    expect(validateEmail("test@example.com").valid).toBe(true);
  });

  it("should return invalid for incorrect format", () => {
    expect(validateEmail("invalid-email").valid).toBe(false);
    expect(validateEmail("test@").valid).toBe(false);
    expect(validateEmail("@example.com").valid).toBe(false);
  });

  it("should return invalid with suggestion for typos", () => {
    const result = validateEmail("test@example.con");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("Did you mean test@example.com?");
  });
});

describe("validateState", () => {
  it("should return valid for correct state code", () => {
    expect(validateState("CA").valid).toBe(true);
    expect(validateState("NY").valid).toBe(true);
  });

  it("should return invalid for incorrect state code", () => {
    expect(validateState("XX").valid).toBe(false);
    expect(validateState("Califorina").valid).toBe(false);
  });
});

describe("validatePhoneNumber", () => {
  it("should return valid for correct E.164 phone number", () => {
    expect(validatePhoneNumber("+14155552671").valid).toBe(true);
    expect(validatePhoneNumber("14155552671").valid).toBe(true);
  });

  it("should return invalid for incorrect phone number", () => {
    expect(validatePhoneNumber("123").valid).toBe(false);
    expect(validatePhoneNumber("abc").valid).toBe(false);
  });
});

describe("validateDateOfBirth", () => {
  it('should return valid for a correct date', () => {
    const result = validateDateOfBirth('2000-01-01');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateStr = futureDate.toISOString().split('T')[0];
    const result = validateDateOfBirth(dateStr);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Date of birth cannot be in the future');
  });

  it('should return invalid for under 18', () => {
    const today = new Date();
    const under18Year = today.getFullYear() - 17;
    const dateStr = `${under18Year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const result = validateDateOfBirth(dateStr);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('at least 18 years old');
  });

  it('should return invalid for over 120', () => {
    const today = new Date();
    const over120Year = today.getFullYear() - 121;
    const dateStr = `${over120Year}-01-01`;
    const result = validateDateOfBirth(dateStr);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('120 or younger');
  });

  it('should return invalid for invalid format', () => {
    expect(validateDateOfBirth('2000/01/01').valid).toBe(false);
    expect(validateDateOfBirth('invalid').valid).toBe(false);
  });

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

describe('isValidBankAccountNumber', () => {
  it('should return true for valid bank account number', () => {
    expect(isValidBankAccountNumber('123456789')).toBe(true);
    expect(isValidBankAccountNumber('1234')).toBe(true);
    expect(isValidBankAccountNumber('12345678901234567')).toBe(true);
  });

  it('should return false for invalid bank account number', () => {
    expect(isValidBankAccountNumber('123')).toBe(false); // Too short
    expect(isValidBankAccountNumber('123456789012345678')).toBe(false); // Too long
    expect(isValidBankAccountNumber('1234a6789')).toBe(false); // Non-numeric
  });
});
