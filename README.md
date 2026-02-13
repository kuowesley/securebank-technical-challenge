# SecureBank - SDET Technical Interview

This repository contains a banking application for the Software Development Test Engineer (SDET) technical interview.

## 📋 Challenge Instructions

Please see [CHALLENGE.md](./CHALLENGE.md) for complete instructions and requirements.

## 📄 Technical Assessment Report

Please see [ASSESSMENT_REPORT.md](./ASSESSMENT_REPORT.md) for the full analysis and fixes.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the application
npm run dev

# Open http://localhost:3000
```

## ✅ Running Tests

```bash
# Run the test suite
npm test
```

## 🧪 Test Structure

- `lib/utils/validation.test.ts` - Input validation helpers
- `server/routers/account.test.ts` - Account router behavior
- `server/routers/auth.test.ts` - Auth router behavior
- `server/utils/account.test.ts` - Account utility logic

## 🔐 Environment Setup

The application uses encryption for sensitive data (SSNs).

### Development
For local development and testing, the application will automatically use built-in fallback keys if no environment variables are present. **These are for development only.**

### Production
For production deployment, you **must** provide the following environment variables, or the server will fail to start:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Generate secure random keys (e.g., using `openssl rand -hex 32`) and update `.env`:
   - `ENCRYPTION_KEY`: A 32-byte (64 char) hex string used for AES-256 encryption.
   - `SSN_INDEX_KEY`: A 32-byte (64 char) hex string used for HMAC-SHA256 hashing.

## 🛠 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:list-users` - List all users in database
- `npm run db:clear` - Clear all database data
- `npm test` - Run tests

Good luck with the challenge!
