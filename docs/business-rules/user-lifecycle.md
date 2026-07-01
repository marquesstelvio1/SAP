# Business Rules: User Lifecycle

**Phase:** 3 — Business Rules Extraction
**Source:** Prisma schema, Auth module

---

## User Registration

1. User provides email + password + name
2. Email verification sent via Resend
3. User must verify email within token expiry
4. After verification, user can sign in
5. 2FA setup available post-registration

## User States

```
Registered → Email Sent → Verified → Active
                                    → 2FA Enabled (optional)
```

## User Deletion

- Users are NOT hard-deleted
- Sessions are revoked
- Memberships are marked `removed`

## User Session Rules

| Rule | Value |
|---|---|
| Max session age | 7 days |
| Sliding window | 24 hours |
| Max concurrent sessions | No explicit limit |
| Session on password reset | All revoked |

## TODO

- Account recovery flow — NOT CONFIRMED
- User data export (GDPR) — NOT IMPLEMENTED
- Account deletion flow — NOT IMPLEMENTED
- Session management UI — NOT CONFIRMED
