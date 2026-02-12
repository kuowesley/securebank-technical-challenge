import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authRouter } from './auth';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(), // Mock returning for insert operations if needed
      })),
    })),
    // Add other mocked methods if your tests use them
  },
}));
vi.mock('bcryptjs');

const caller = authRouter.createCaller({
  req: new Request('http://localhost'),
  res: {
    setHeader: vi.fn(),
    // Mock other properties of res if needed
  } as any,
  user: null,
} as any);

describe('authRouter.signup dateOfBirth validation', () => {
  const baseInput = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '1234567890',
    ssn: '123456789',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mockGet = vi.fn();
    const mockWhere = vi.fn(() => ({ get: mockGet }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    vi.mocked(db.select).mockImplementation(() => ({
      from: mockFrom,
    } as any));

    const mockValues = vi.fn(() => ({ returning: vi.fn() }));
    vi.mocked(db.insert).mockImplementation(() => ({
      values: mockValues,
    } as any));

    // Mock for checking existing user (first select call)
    mockGet.mockResolvedValueOnce(undefined);
    // Mock for returning created user (second select call)
    mockGet.mockResolvedValueOnce({ id: 1, ...baseInput });

    vi.mocked(bcrypt.hash).mockResolvedValue('hashedpassword' as any);
  });

  it('should reject a date of birth in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const input = { ...baseInput, dateOfBirth: futureDate.toISOString().split('T')[0] };

    await expect(caller.signup(input)).rejects.toThrow(TRPCError);
    await expect(caller.signup(input)).rejects.toThrow('Date of birth cannot be in the future');
  });

  it('should reject a date of birth for someone under 18', async () => {
    const today = new Date();
    const under18Year = today.getFullYear() - 17;
    const input = { ...baseInput, dateOfBirth: `${under18Year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` };
    
    await expect(caller.signup(input)).rejects.toThrow(TRPCError);
    await expect(caller.signup(input)).rejects.toThrow('You must be at least 18 years old');
  });

  it('should reject a date of birth for someone over 120', async () => {
    const today = new Date();
    const over120Year = today.getFullYear() - 121;
    const input = { ...baseInput, dateOfBirth: `${over120Year}-01-01` };

    await expect(caller.signup(input)).rejects.toThrow(TRPCError);
    await expect(caller.signup(input)).rejects.toThrow('Age must be 120 or younger');
  });

  it('should reject an invalid date format', async () => {
    const input = { ...baseInput, dateOfBirth: '2000/01/01' };

    await expect(caller.signup(input)).rejects.toThrow(TRPCError);
    await expect(caller.signup(input)).rejects.toThrow('Date of birth must be a valid date');
  });

  it('should reject an invalid date (e.g., Feb 30)', async () => {
    const input = { ...baseInput, dateOfBirth: '2000-02-30' };

    await expect(caller.signup(input)).rejects.toThrow(TRPCError);
    await expect(caller.signup(input)).rejects.toThrow('Date of birth must be a valid date');
  });

  it('should accept a valid date of birth', async () => {
    const input = { ...baseInput, dateOfBirth: '2000-01-01' };

    const result = await caller.signup(input);
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
