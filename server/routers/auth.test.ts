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
    delete: vi.fn(() => ({
      where: vi.fn(),
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
  let mockValues: any;
  let mockGet: any;

  const baseInput = {
    email: 'test@example.com',
    password: 'StrongP@ssw0rd!',
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

    mockGet = vi.fn();
    const mockWhere = vi.fn(() => ({ get: mockGet }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    vi.mocked(db.select).mockImplementation(() => ({
      from: mockFrom,
    } as any));

    mockValues = vi.fn(() => ({ returning: vi.fn() }));
    vi.mocked(db.insert).mockImplementation(() => ({
      values: mockValues,
    } as any));

    // Mock for checking existing user (first select call)
    mockGet.mockResolvedValueOnce(undefined);
    // Mock for returning created user (second select call)
    mockGet.mockResolvedValueOnce({ 
      id: 1, 
      ...baseInput, 
      dateOfBirth: '2000-01-01',
      ssn: 'encrypted:tag:content', 
      ssnHash: 'hashedSSN' 
    });

    vi.mocked(bcrypt.hash).mockResolvedValue('hashedpassword' as any);
  });

  it('should encrypt SSN and store hash on signup', async () => {
    const input = { ...baseInput, dateOfBirth: '2000-01-01' };
    await caller.signup(input);

    expect(mockValues).toHaveBeenCalled();
    const insertArgs = mockValues.mock.calls[0][0];
    expect(insertArgs.ssn).not.toBe(input.ssn); // Should be encrypted
    expect(insertArgs.ssn).toContain(':'); // IV:Tag:Content format
    expect(insertArgs.ssnHash).toBeDefined();
    expect(insertArgs.ssnHash).not.toBe(input.ssn);
  });

  it('should not return SSN in response', async () => {
    const input = { ...baseInput, dateOfBirth: '2000-01-01' };
    const result = await caller.signup(input);
    
    // Explicitly check for absence of ssn and ssnHash
    expect((result.user as any).ssn).toBeUndefined();
    expect((result.user as any).ssnHash).toBeUndefined();
    expect(result.user.email).toBe(input.email);
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

describe('authRouter.login', () => {
  it('should invalidate existing sessions on successful login', async () => {
    // Setup mocks specific to login
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
    };

    // select().from().where().get() returns user
    const mockGet = vi.fn().mockResolvedValue(mockUser);
    const mockWhere = vi.fn(() => ({ get: mockGet }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

    // bcrypt compare success
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

    // delete mock
    const mockDeleteWhere = vi.fn();
    vi.mocked(db.delete).mockReturnValue({ where: mockDeleteWhere } as any);

    // insert mock
    const mockValues = vi.fn();
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

    await caller.login({ email: 'test@example.com', password: 'password' });

    expect(db.delete).toHaveBeenCalled();
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });
});

