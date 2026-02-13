import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { isValidCardNumber } from "@/lib/utils/validation";
import { generateAccountNumber } from "../utils/account";

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has an account of this type
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber;
      let isUnique = false;

      // Generate unique account number
      while (!isUnique) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        isUnique = !existing;
      }

      const [account] = await db
        .insert(accounts)
        .values({
          userId: ctx.user.id,
          accountNumber: accountNumber!,
          accountType: input.accountType,
          balance: 0,
          status: "active",
        })
        .returning();

      if (!account) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account",
        });
      }

      return account;
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  fundAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        amount: z
          .number()
          .min(0.01)
          .refine((value) => Number.isFinite(value), { message: "Amount must be a valid number" })
          .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
            message: "Amount cannot have more than 2 decimal places",
          }),
        fundingSource: z
          .object({
            type: z.enum(["card", "bank"]),
            accountNumber: z.string(),
            routingNumber: z.string().optional(),
          })
          .superRefine((value, ctx) => {
            if (value.type === "card") {
              if (!isValidCardNumber(value.accountNumber)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Invalid card number",
                  path: ["accountNumber"],
                });
              }
            }

            if (value.type === "bank") {
              if (!/^\d{4,17}$/.test(value.accountNumber)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Invalid account number",
                  path: ["accountNumber"],
                });
              }

              if (!value.routingNumber) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Routing number is required",
                  path: ["routingNumber"],
                });
              } else if (!/^\d{9}$/.test(value.routingNumber)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Routing number must be 9 digits",
                  path: ["routingNumber"],
                });
              }
            }
          }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const amount = Math.round(input.amount * 100) / 100;

      return await db.transaction(async (tx) => {
        // Verify account belongs to user and lock it (if DB supports select for update, though SQLite is single-writer anyway)
        const account = await tx
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
          .get();

        if (!account) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found",
          });
        }

        if (account.status !== "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Account is not active",
          });
        }

        // Create transaction
        const [transaction] = await tx
          .insert(transactions)
          .values({
            accountId: input.accountId,
            type: "deposit",
            amount,
            description: `Funding from ${input.fundingSource.type}`,
            status: "completed",
            processedAt: new Date().toISOString(),
          })
          .returning();

        // Update account balance atomically
        // Using SQL to increment ensures we don't have race conditions with the read value
        const [updatedAccount] = await tx
          .update(accounts)
          .set({
            balance: sql`ROUND(${accounts.balance} + ${amount}, 2)`,
          })
          .where(eq(accounts.id, input.accountId))
          .returning();

        return {
          transaction,
          newBalance: updatedAccount.balance,
        };
      });
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().nullish(), // Use transaction ID as cursor for efficient pagination
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const limit = input.limit + 1; // Fetch 1 extra to check if there are more items
      
      // Build query conditions
      const conditions = [eq(transactions.accountId, input.accountId)];
      
      // Add cursor condition if present (fetch transactions older/smaller-ID than cursor)
      if (input.cursor) {
        conditions.push(lt(transactions.id, input.cursor));
      }

      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.id))
        .limit(limit);

      let nextCursor: number | null = null;
      
      if (accountTransactions.length > input.limit) {
        const nextItem = accountTransactions.pop();
        nextCursor = nextItem!.id;
      }

      const enrichedTransactions = accountTransactions.map((transaction) => ({
        ...transaction,
        accountType: account.accountType,
      }));

      return {
        items: enrichedTransactions,
        nextCursor,
      };
    }),
});
