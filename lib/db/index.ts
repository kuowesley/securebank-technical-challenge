import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { encrypt, hash } from "@/server/utils/encryption";

const dbPath = "bank.db";

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export function initDb() {
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      ssn TEXT NOT NULL,
      ssn_hash TEXT UNIQUE,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT NOT NULL,
      balance REAL DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add ssn_hash column if it doesn't exist (for existing databases)
  try {
    const columns = sqlite.pragma("table_info(users)") as any[];
    const hasSsnHash = columns.some((col) => col.name === "ssn_hash");
    if (!hasSsnHash) {
      sqlite.exec("ALTER TABLE users ADD COLUMN ssn_hash TEXT UNIQUE");
    }
  } catch (e) {
    console.error("Failed to add ssn_hash column:", e);
  }

  // Migration: Encrypt plaintext SSNs
  try {
    const usersWithoutHash = sqlite.prepare("SELECT * FROM users WHERE ssn_hash IS NULL").all();
    if (usersWithoutHash.length > 0) {
      console.log(`Migrating ${usersWithoutHash.length} users to encrypted SSN storage...`);
      const updateStmt = sqlite.prepare("UPDATE users SET ssn = ?, ssn_hash = ? WHERE id = ?");

      for (const user of usersWithoutHash as any[]) {
        try {
          // Encrypt the plaintext SSN
          const encryptedSSN = encrypt(user.ssn);
          // Create the hash for lookup
          const ssnHash = hash(user.ssn);
          updateStmt.run(encryptedSSN, ssnHash, user.id);
        } catch (err) {
          console.error(`Failed to migrate user ${user.id}:`, err);
        }
      }
      console.log("SSN Migration complete.");
    }
  } catch (e) {
    console.error("SSN Migration failed:", e);
  }
}


// Initialize database on import
initDb();
