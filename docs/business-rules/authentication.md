# Business Rules: Authentication

**Phase:** 3 — Business Rules Extraction
**Source:** `packages/auth/src/server.ts`, `packages/auth/src/session.ts`, `packages/auth/src/session-governance.ts`, `packages/auth/src/api-key.ts`

---

## Session Rules

| Rule | Value |
|---|---|
| Session max age | 7 days (604,800 seconds) |
| Session sliding window | 24 hours (updateAge) |
| Cookie cache TTL | 60 seconds |
| Session revocation on password reset | Enabled |
| Email verification required | Yes (requireEmailVerification) |
| Auto sign-in after verification | Yes |

## Password Rules

| Rule | Value |
|---|---|
| Minimum length | 12 characters |
| Maximum length | 128 characters |
| Reset behavior | Revoke all existing sessions |

## Two-Factor Rules

| Rule | Value |
|---|---|
| TOTP digits | 6 |
| TOTP period | 30 seconds |
| Backup codes | 10 codes, 10 characters each |
| Backup code storage | Encrypted at rest |
| 2FA cookie max age | 10 minutes |
| Trusted device max age | 30 days |

## API Key Rules

| Rule | Value |
|---|---|
| Key storage | SHA-256 hashed |
| Prefix storage | Plaintext (visible identifier) |
| Key source | Generated server-side |
| Scope | Bound to service account permissions |

## Email Rules

| Rule | Value |
|---|---|
| Verification email | Sent on sign-up |
| Password reset email | Triggered by user request |
| Email provider | Resend |

## TODO

- Account lockout policy after failed attempts — NOT IMPLEMENTED
- Rate limit on login endpoint — NOT CONFIRMED
- OAuth token encryption at rest — NOT CONFIRMED
- Session revocation audit trail — NOT IMPLEMENTED
