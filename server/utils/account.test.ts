import { describe, it, expect } from 'vitest';
import { generateAccountNumber } from './account';

describe('generateAccountNumber', () => {
  it('should generate a 10-digit number string', () => {
    const accountNum = generateAccountNumber();
    expect(accountNum).toHaveLength(10);
    expect(accountNum).toMatch(/^\d{10}$/);
  });

  it('should generate distinct numbers', () => {
    const n1 = generateAccountNumber();
    const n2 = generateAccountNumber();
    expect(n1).not.toBe(n2);
  });

  it('should generate numbers within the expected range', () => {
    const accountNum = generateAccountNumber();
    const num = parseInt(accountNum, 10);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThan(10000000000);
  });
});
