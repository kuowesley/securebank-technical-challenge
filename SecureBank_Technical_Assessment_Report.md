# SecureBank Technical Assessment Report

## Prioritization Strategy
- **[CRITICAL]** – Security / Data integrity / Financial logic
- **[HIGH]** – Validation or auth issues
- **[MEDIUM]** – UX or minor logic
- **[LOW]** – UI polish

## UI Issues

### Ticket UI-101: Dark Mode Text Visibility [LOW]
- Reporter: Sarah Chen
- Priority: Medium
- Description: "When using dark mode, the text I type into forms appears white on a white background, making it impossible to see what I'm typing."
- Steps to Reproduce:
  1. Enable dark mode
  2. Navigate to any input form
  3. Start typing
- Expected: Text should be clearly visible against the background
- Actual: Text is white on white background
- status: [DONE]
- explanations:
  - Root cause: The global dark mode styles (`--foreground: #ededed`) caused input text to render as white, while the input backgrounds remained white by default.
  - Fix: Explicitly added `text-gray-900` to all form input fields in signup, login, and modal components.
  - Reason: Ensures high contrast and readability regardless of the system's dark mode preference, as the input backgrounds are white.

## Validation Issues

### Ticket VAL-201: Email Validation Problems [MEDIUM]
- Reporter: James Wilson
- Priority: High
- Description: "The system accepts invalid email formats and doesn't handle special cases properly."
- Examples:
  1. Accepts "TEST@example.com" but converts to lowercase without notifying user
  2. No validation for common typos like ".con" instead of ".com"
- status: [DONE]
- explanations:
  - Root cause: Loose regex pattern validation and lack of typo checking. Silent lowercasing caused login issues if user typed uppercase later.
  - Fix: Implemented strict regex validation and added typo detection (e.g., .con -> .com suggestions). Ensured consistent lowercasing on both signup and login.
  - Reason: Prevents invalid emails and ensures user can access their account regardless of input case.

### Ticket VAL-202: Date of Birth Validation [CRITICAL]
- Reporter: Maria Garcia
- Priority: Critical
- Description: "I accidentally entered my birth date as 2025 and the system accepted it."
- Impact: Potential compliance issues with accepting minors
- status: [DONE]
- explanations:
  - Root cause: `dateOfBirth` only validated as a required string on the client and server, so future dates (like 2025) were accepted and stored.
  - Fix: Added DOB validation on both client and server to require a real YYYY-MM-DD date, reject future dates, and enforce an age range of 18–120.
  - Reason: Ensures compliance with minimum-age requirements, prevents unrealistic ages, and blocks invalid data even if the client validation is bypassed.

### Ticket VAL-203: State Code Validation [MEDIUM]
- Reporter: Alex Thompson
- Priority: Medium
- Description: "The system accepted 'XX' as a valid state code."
- Impact: Address verification issues for banking communications
- status: [DONE]
- explanations:
  - Root cause: The validation only checked for a 2-letter uppercase string, allowing invalid state codes like "XX".
  - Fix: Implemented a validation check against a list of valid US state/territory codes (e.g., CA, NY).
  - Reason: Ensures that only real US state codes are accepted for address verification.

### Ticket VAL-204: Phone Number Format [MEDIUM]
- Reporter: John Smith
- Priority: Medium
- Description: "International phone numbers aren't properly validated. The system accepts any string of numbers."
- Impact: Unable to contact customers for important notifications
- status: [DONE]
- explanations:
  - Root cause: Frontend regex only allowed 10-digit US numbers, blocking valid international formats. Backend allowed a loose range (10-15 digits).
  - Fix: Implemented E.164 format validation (`^\+?[1-9]\d{7,14}$`) on both frontend and backend to support international numbers.
  - Reason: Ensures that phone numbers are valid and contactable globally.

### Ticket VAL-205: Zero Amount Funding [CRITICAL]
- Reporter: Lisa Johnson
- Priority: High
- Description: "I was able to submit a funding request for $0.00"
- Impact: Creates unnecessary transaction records
- status: [DONE]
- explanations:
  - Root cause: The client allowed a minimum amount of $0.00, and the server only enforced a generic positive check without guarding against non-finite values.
  - Fix: Enforced a minimum of $0.01 on both client and server, added a server-side finite number check, and normalized funding amounts to two decimal places.
  - Reason: Prevents zero-dollar transactions, blocks malformed numeric inputs, and reduces floating precision drift for more robust funding behavior.

### Ticket VAL-206: Card Number Validation [CRITICAL]
- Reporter: David Brown
- Priority: Critical
- Description: "System accepts invalid card numbers"
- Impact: Failed transactions and customer frustration
- status: [DONE]
- explanations:
  - Root cause: Client validation only checked Visa/Mastercard prefixes, and the server did not validate card numbers at all, allowing invalid or unsupported numbers through.
  - Fix: Implemented Luhn-based card validation with 13–19 digit support, allowed space/dash input normalization, and added server-side checks; also added bank account number and routing checks when funding by bank.
  - Reason: Accepts valid card formats while blocking invalid numbers, and enforces consistent validation server-side for robustness.

### Ticket VAL-207: Routing Number Optional [HIGH]
- Reporter: Support Team
- Priority: High
- Description: "Bank transfers are being submitted without routing numbers"
- Impact: Failed ACH transfers
- status: [DONE]
- explanations:
  - Root cause: The `routingNumber` field was marked as optional in the Zod schema and not validated conditionally for bank transfers.
  - Fix: Added a conditional check in `superRefine` to require `routingNumber` when `fundingType` is "bank" (implemented alongside VAL-206).
  - Reason: Ensures that all bank transfers include a valid routing number to prevent ACH failures.

### Ticket VAL-208: Weak Password Requirements [CRITICAL]
- Reporter: Security Team
- Priority: Critical
- Description: "Password validation only checks length, not complexity"
- Impact: Account security risks
- status: [DONE]
- explanations:
  - Root cause: Client checks only length and a simple number/common-password rule, while the server enforced only a minimum length, allowing weak passwords through.
  - Fix: Enforced a stronger policy on both client and server (min 12 chars, uppercase, lowercase, number, symbol, and block common passwords).
  - Reason: Improves account security and ensures the server rejects weak passwords even if client validation is bypassed.

### Ticket VAL-209: Amount Input Issues [MEDIUM]
- Reporter: Robert Lee
- Priority: Medium
- Description: "System accepts amounts with multiple leading zeros"
- Impact: Confusion in transaction records
- status: [DONE]
- explanations:
  - Root cause: The regex pattern allowed any number of digits before the decimal point, including multiple leading zeros (e.g., "005").
  - Fix: Updated the regex to `^(0|[1-9]\d*)(\.\d{0,2})?$`, which strictly enforces standard numeric formatting (no leading zeros unless "0.xx").
  - Reason: Improves UX and prevents ambiguous or sloppy input formats.

### Ticket VAL-210: Card Type Detection [HIGH]
- Reporter: Support Team
- Priority: High
- Description: "Card type validation only checks basic prefixes, missing many valid cards"
- Impact: Valid cards being rejected
- status: [DONE]
- explanations:
  - Root cause: The old validation relied on hardcoded prefixes (4/5) for Visa/Mastercard, rejecting Amex, Discover, etc.
  - Fix: Removed prefix checks and replaced them with Luhn algorithm validation (implemented in VAL-206).
  - Reason: Allows all valid major card networks to be accepted.

## Security Issues

### Ticket SEC-301: SSN Storage [CRITICAL]
- Reporter: Security Audit Team
- Priority: Critical
- Description: "SSNs are stored in plaintext in the database"
- Impact: Severe privacy and compliance risk
- status: [DONE]
- explanations:
  - Root cause: SSNs were stored directly in the database as plaintext, exposing sensitive user data.
  - Fix: Implemented encryption (using `encrypt`) for SSN storage and added a hashed column (`ssn_hash`) for secure uniqueness checks. Updated the database schema to support these columns natively.
  - Reason: Protects PII at rest with encryption while allowing the system to prevent duplicate registrations via hashing.

### Ticket SEC-302: Insecure Random Numbers [CRITICAL]
- Reporter: Security Team
- Priority: High
- Description: "Account numbers generated using Math.random()"
- Impact: Potentially predictable account numbers
- status: [DONE]
- explanations:
  - Root cause: Account numbers were generated using `Math.random()`, which is not cryptographically secure and can be predictable.
  - Fix: Replaced `Math.random()` with `crypto.randomInt()`, generating a secure random integer in the full 10-digit range (0 to 9,999,999,999).
  - Reason: Ensures account numbers are unpredictable and secure.

### Ticket SEC-303: XSS Vulnerability [CRITICAL]
- Reporter: Security Audit
- Priority: Critical
- Description: "Unescaped HTML rendering in transaction descriptions"
- Impact: Potential for cross-site scripting attacks
- status: [DONE]
- explanations:
  - Root cause: The application used `dangerouslySetInnerHTML` to render transaction descriptions, allowing malicious scripts stored in the database to execute.
  - Fix: Replaced `dangerouslySetInnerHTML` with standard React text rendering, which automatically escapes HTML content.
  - Reason: Eliminates the XSS vulnerability by treating all user content as plain text.

### Ticket SEC-304: Session Management [CRITICAL]
- Reporter: DevOps Team
- Priority: High
- Description: "Multiple valid sessions per user, no invalidation"
- Impact: Security risk from unauthorized access
- status: [DONE]
- explanations:
  - Root cause: The application allowed multiple concurrent sessions for the same user without invalidating old ones.
  - Fix: Implemented session invalidation on login, deleting all existing sessions for the user before creating a new one (single session policy).
  - Reason: Reduces the attack surface by ensuring only the most recent login session is valid.

## Logic and Performance Issues

### Ticket PERF-401: Account Creation Error [CRITICAL]
- Reporter: Support Team
- Priority: Critical
- Description: "New accounts show $100 balance when DB operations fail"
- Impact: Incorrect balance displays
- status: [DONE]
- explanations:
  - Root cause: The account creation logic included a fallback that returned a fake account object with a hardcoded $100 balance if the subsequent database fetch failed.
  - Fix: Refactored the insertion logic to use `db.insert(...).returning()`, ensuring the created account is returned atomically and immediately. Removed the misleading fallback data.
  - Reason: Ensures that the API returns the actual account state (balance $0) or fails with an error if the creation is unsuccessful, preventing financial data inconsistencies.

### Ticket PERF-402: Logout Issues [HIGH]
- Reporter: QA Team
- Priority: Medium
- Description: "Logout always reports success even when session remains active"
- Impact: Users think they're logged out when they're not
- status: [DONE]
- explanations:
  - Root cause: The logout mutation only attempted to delete the session from the database if `ctx.user` was present. If the context failed to resolve the user (e.g., edge cases or partial auth), the DB session remained active.
  - Fix: Updated the logout logic to extract the token from the cookie and delete it from the database unconditionally, regardless of whether `ctx.user` is set.
  - Reason: Ensures that the session is invalidated in the database whenever the logout endpoint is hit, guaranteeing a complete logout.

### Ticket PERF-403: Session Expiry [HIGH]
- Reporter: Security Team
- Priority: High
- Description: "Expiring sessions still considered valid until exact expiry time"
- Impact: Security risk near session expiration
- status: [DONE]
- explanations:
  - Root cause: Sessions had a long fixed duration (7 days) with no renewal logic, leaving them valid even if the user went inactive, or forcing abrupt logouts.
  - Fix: Reduced session duration to 1 hour and implemented sliding expiration. If a user makes a request with <30 mins remaining, the session is extended by another hour.
  - Reason: Balances security (short windows) with usability (active users stay logged in).

### Ticket PERF-404: Transaction Sorting [MEDIUM]
- Reporter: Jane Doe
- Priority: Medium
- Description: "Transaction order seems random sometimes"
- Impact: Confusion when reviewing transaction history
- status: [DONE]
- explanations:
  - Root cause: `getTransactions` returned records without an `ORDER BY` clause, so the database order was undefined (usually insertion order, but not guaranteed).
  - Fix: Added `.orderBy(desc(transactions.createdAt))` to the query.
  - Reason: Ensures transactions always appear in reverse chronological order (newest first).

### Ticket PERF-405: Missing Transactions [CRITICAL]
- Reporter: Multiple Users
- Priority: Critical
- Description: "Not all transactions appear in history after multiple funding events"
- Impact: Users cannot verify all their transactions
- status: [DONE]
- explanations:
  - Root cause: The `fundAccount` mutation returned the *oldest* transaction due to a missing sort on `limit(1)`, and the frontend did not re-fetch the transaction list after funding.
  - Fix: Updated `fundAccount` to return the newest transaction, and added `utils.account.getTransactions.invalidate()` to the funding success handler.
  - Reason: Ensures the immediate UI update is correct and the transaction list refreshes to show the new entry.

### Ticket PERF-406: Balance Calculation [CRITICAL]
- Reporter: Finance Team
- Priority: Critical
- Description: "Account balances become incorrect after many transactions"
- Impact: Critical financial discrepancies
- status: [DONE]
- explanations:
  - Root cause: The balance calculation logic contained a loop that added the transaction amount in 100 tiny increments, introducing significant floating-point precision errors.
  - Fix: Removed the loop and replaced it with a single, direct addition, rounded to two decimal places (`Math.round((balance + amount) * 100) / 100`).
  - Reason: Eliminates accumulated floating-point errors, ensuring accurate balance calculations and storage.

### Ticket PERF-407: Performance Degradation [HIGH]
- Reporter: DevOps
- Priority: High
- Description: "System slows down when processing multiple transactions"
- Impact: Poor user experience during peak usage
- status: [DONE]
- explanations:
  - Root cause: `getTransactions` contained an N+1 query problem, fetching the account details for *every* transaction in a loop. Additionally, the database lacked indexes on foreign keys (`account_id`, `user_id`) and sorting columns (`created_at`).
  - Fix: Refactored `getTransactions` to reuse the already-fetched account details, eliminating the loop query. Added database indexes on `transactions(account_id)`, `transactions(created_at)`, `accounts(user_id)`, and `sessions(user_id)`.
  - Reason: Reduces database load from O(N) to O(1) for transaction fetching and speeds up lookups and sorting significantly.

### Ticket PERF-408: Resource Leak [CRITICAL]
- Reporter: System Monitoring
- Priority: Critical
- Description: "Database connections remain open"
- Impact: System resource exhaustion
- status: [DONE]
- explanations:
  - Root cause: The database initialization logic in `lib/db/index.ts` created a secondary connection (`const conn = new Database(dbPath)`) on every startup/reload without using or closing it.
  - Fix: Removed the redundant connection creation and the unused `connections` array.
  - Reason: Prevents file descriptor exhaustion and database lock issues by ensuring only the primary Drizzle connection is used.
