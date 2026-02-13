import { describe, it, expect, vi, beforeEach } from "vitest";
import { accountRouter } from "./account";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn(),
            })),
            // For getTransactions (no limit)
            map: vi.fn(), // If chain ends here? No, returns promise.
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

// Mock context
const mockCtx = {
  user: { id: 1 },
  req: {} as any,
  res: {} as any,
};

const caller = accountRouter.createCaller(mockCtx as any);

describe("accountRouter", () => {
  let mockGet: any;
  let mockReturning: any;
  let mockUpdate: any;
  let mockOrderBy: any;
  let mockSelect: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup generic mock chain
    mockGet = vi.fn();
    mockReturning = vi.fn();
    mockUpdate = vi.fn();
    mockOrderBy = vi.fn();

    // Re-construct the chain for each test to ensure fresh mocks
    // This is a simplified mock structure matching the router's usage
    const mockWhere = vi.fn(() => ({
      get: mockGet,
      orderBy: mockOrderBy,
    }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    
    mockSelect = vi.fn(() => ({ from: mockFrom }));
    vi.mocked(db.select).mockImplementation(mockSelect);

    vi.mocked(db.insert).mockImplementation(() => ({
      values: vi.fn(() => ({ returning: mockReturning })),
    } as any));

    vi.mocked(db.update).mockImplementation(() => ({
      set: vi.fn(() => ({ where: mockUpdate })),
    } as any));
  });

  describe("createAccount", () => {
    it("should create an account with 0 balance (PERF-401)", async () => {
      // Mock existing account check (return null)
      mockGet.mockResolvedValueOnce(null);
      
      // Mock account number check (return null = unique)
      mockGet.mockResolvedValueOnce(null);

      // Mock successful insertion
      const newAccount = {
        id: 1,
        userId: 1,
        accountType: "checking",
        balance: 0,
        accountNumber: "1234567890",
        status: "active",
      };
      mockReturning.mockResolvedValueOnce([newAccount]);

      const result = await caller.createAccount({ accountType: "checking" });

      expect(result.balance).toBe(0);
      expect(mockReturning).toHaveBeenCalled();
    });
  });

  describe("fundAccount", () => {
    it("should calculate balance with correct rounding (PERF-406)", async () => {
      // Mock finding account
      const account = { id: 1, userId: 1, balance: 10.1, status: "active" };
      mockGet.mockResolvedValueOnce(account); // get account

      // Mock creating transaction
      // (insert logic doesn't use 'get' but 'insert')

      // Mock fetching created transaction
      // Chain: select -> from -> where -> orderBy -> limit -> get
      const mockLimitGet = vi.fn().mockResolvedValue({ id: 100, amount: 0.2 });
      const mockLimit = vi.fn(() => ({ get: mockLimitGet }));
      mockOrderBy.mockReturnValue({ limit: mockLimit });

      // Update calls
      mockUpdate.mockResolvedValue(undefined);

      // Call fundAccount with 0.2
      const result = await caller.fundAccount({
        accountId: 1,
        amount: 0.2,
        fundingSource: { type: "bank", accountNumber: "123456789", routingNumber: "123456789" },
      });

      // Verify rounding: 10.1 + 0.2 = 10.3 (not 10.299999999)
      expect(result.newBalance).toBe(10.3);
      
      // Verify DB update was called with rounded value
      const updateCall = vi.mocked(db.update).mock.results[0].value.set.mock.calls[0][0];
      expect(updateCall.balance).toBe(10.3);
    });

    it("should reject zero amount (VAL-205)", async () => {
        // This validates Zod schema, which runs before the handler.
        // TRPC callers usually bypass HTTP but run Zod.
        await expect(caller.fundAccount({
            accountId: 1,
            amount: 0,
            fundingSource: { type: "bank", accountNumber: "123456789", routingNumber: "123456789" },
        })).rejects.toThrow();
    });
  });

  describe("getTransactions", () => {
    it("should fetch transactions sorted by date (PERF-404)", async () => {
        // Mock finding account
        mockGet.mockResolvedValueOnce({ id: 1, userId: 1, accountType: "checking" });

        // Mock fetching transactions
        // Chain: select -> from -> where -> orderBy -> (return promise)
        const transactions = [
            { id: 2, createdAt: "2023-01-02", amount: 50 },
            { id: 1, createdAt: "2023-01-01", amount: 100 },
        ];
        mockOrderBy.mockResolvedValue(transactions);

        const result = await caller.getTransactions({ accountId: 1 });

        expect(result).toHaveLength(2);
        // Verify orderBy was called
        expect(mockOrderBy).toHaveBeenCalled();
        // Since we mocked the return of orderBy, we confirmed the chain was used.
    });
  });
});
