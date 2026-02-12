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

## Validation Issues

### Ticket VAL-201: Email Validation Problems [MEDIUM]
- Reporter: James Wilson
- Priority: High
- Description: "The system accepts invalid email formats and doesn't handle special cases properly."
- Examples:
  1. Accepts "TEST@example.com" but converts to lowercase without notifying user
  2. No validation for common typos like ".con" instead of ".com"

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

### Ticket VAL-204: Phone Number Format [MEDIUM]
- Reporter: John Smith
- Priority: Medium
- Description: "International phone numbers aren't properly validated. The system accepts any string of numbers."
- Impact: Unable to contact customers for important notifications

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

### Ticket VAL-210: Card Type Detection [HIGH]
- Reporter: Support Team
- Priority: High
- Description: "Card type validation only checks basic prefixes, missing many valid cards"
- Impact: Valid cards being rejected

## Security Issues

### Ticket SEC-301: SSN Storage [CRITICAL]
- Reporter: Security Audit Team
- Priority: Critical
- Description: "SSNs are stored in plaintext in the database"
- Impact: Severe privacy and compliance risk
- status: [DONE]
- explanations:
  - Root cause: The `ssn` field was defined as plaintext in the database schema and stored directly from user input without encryption.
  - Fix: Implemented AES-256-GCM encryption for storage and SHA-256 hashing for uniqueness checks. Updated the database schema to include `ssn_hash`. Added migration logic to encrypt existing plaintext SSNs on startup.
  - Reason: Ensures SSNs are never stored in plaintext, mitigating data breach risks while maintaining uniqueness constraints securely.

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

## Logic and Performance Issues

### Ticket PERF-401: Account Creation Error [CRITICAL]
- Reporter: Support Team
- Priority: Critical
- Description: "New accounts show $100 balance when DB operations fail"
- Impact: Incorrect balance displays

### Ticket PERF-402: Logout Issues [HIGH]
- Reporter: QA Team
- Priority: Medium
- Description: "Logout always reports success even when session remains active"
- Impact: Users think they're logged out when they're not

### Ticket PERF-403: Session Expiry [HIGH]
- Reporter: Security Team
- Priority: High
- Description: "Expiring sessions still considered valid until exact expiry time"
- Impact: Security risk near session expiration

### Ticket PERF-404: Transaction Sorting [MEDIUM]
- Reporter: Jane Doe
- Priority: Medium
- Description: "Transaction order seems random sometimes"
- Impact: Confusion when reviewing transaction history

### Ticket PERF-405: Missing Transactions [CRITICAL]
- Reporter: Multiple Users
- Priority: Critical
- Description: "Not all transactions appear in history after multiple funding events"
- Impact: Users cannot verify all their transactions

### Ticket PERF-406: Balance Calculation [CRITICAL]
- Reporter: Finance Team
- Priority: Critical
- Description: "Account balances become incorrect after many transactions"
- Impact: Critical financial discrepancies

### Ticket PERF-407: Performance Degradation [HIGH]
- Reporter: DevOps
- Priority: High
- Description: "System slows down when processing multiple transactions"
- Impact: Poor user experience during peak usage

### Ticket PERF-408: Resource Leak [CRITICAL]
- Reporter: System Monitoring
- Priority: Critical
- Description: "Database connections remain open"
- Impact: System resource exhaustion
