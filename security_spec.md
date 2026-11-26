# Banglaar Haat (IIT Indore) — Security Specification

## 1. Data Invariants
1. **Trusted RBAC (`/admins/{uid}`)**: Only verified committee admins (or the bootstrapped admin `buddhodevghosh@gmail.com` with `email_verified == true`) can grant/revoke admin rights, manage events, curate gallery items, check in attendees, or inspect private membership sheets.
2. **Master Gate (`/events/{eventId}/registrations/{regId}`)**: An event registration cannot exist unless the parent `/events/{eventId}` document exists. Non-admin users may only register with `regId == request.auth.uid` and `userId == request.auth.uid` while the parent event status is `open`.
3. **Atomic Capacity Sync**: When a member creates a registration and increments `/events/{eventId}.registeredCount`, the event update strictly verifies `existsAfter(/databases/$(database)/documents/events/$(eventId)/registrations/$(request.auth.uid))` and restricts the delta to `+1` (or `-1` on cancellation).
4. **Split-Collection PII Isolation**: Public member profiles (`/memberProfiles/{memberId}`) contain zero PII (`email`, `phone`, `rollNumber`, `hostel` are strictly forbidden). Sensitive contact & chanda records live exclusively in `/memberPrivate/{memberId}`, readable only by the owner (`memberId == request.auth.uid`) or a verified admin.
5. **Anti-Self-Promotion**: Non-admin users creating `/memberProfiles/{uid}` must have `committeeTier == 'member'` and `membershipStatus == 'pending'`, and cannot alter `committeeTier`, `membershipStatus`, `roleTitleBn`, or `roleTitleEn` on update. Similarly, users cannot alter `chandaStatus` or `notes` on `/memberPrivate/{uid}`.
6. **Terminal State Locking**: Once an event reaches `status == 'completed'` or a registration reaches `attendanceStatus == 'cancelled'`, non-admin modifications are permanently blocked.
7. **Temporal Integrity**: `createdAt` must equal `request.time` on create and is immutable on update; `updatedAt` must equal `request.time` on create and update.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Self-Admin Promotion**: Authenticated non-admin writes `/admins/{theirUid}` with `{ role: "super_admin" }`.
2. **Unverified Admin Email Spoof**: User with `email: "buddhodevghosh@gmail.com"` and `email_verified: false` attempts to write `/events/durga-pujo-2026`.
3. **Shadow Field Injection on Event**: Authenticated user adds ghost field `isOfficialVerified: true` to `/events/durga-pujo-2026`.
4. **Orphaned Registration Write**: User creates `/events/nonexistent-event/registrations/{uid}` where parent event does not exist.
5. **Identity Spoofing on Registration**: User `uidA` creates `/events/kali-pujo/registrations/uidB` with `userId: "uidB"`.
6. **Self Check-In Privilege Escalation**: Regular user creates or updates their own registration with `attendanceStatus: "present"`.
7. **PII Blanket Scrape**: Authenticated non-admin user `uidA` calls `get` or `list` on `/memberPrivate/uidB`.
8. **Member Role Self-Escalation**: Regular user updates `/memberProfiles/{uid}` changing `committeeTier: "committee"` or `membershipStatus: "active"`.
9. **Chanda Dues Tampering**: Regular user updates `/memberPrivate/{uid}` changing `chandaStatus: "paid"`.
10. **Path ID Poisoning**: Attacker attempts to create `/events/invalid$id..with..spaces` or a 500-character document ID.
11. **Value Poisoning & Denial-of-Wallet**: User sends a 10,000-character `bioBn` string or `guestCount: 999` on registration.
12. **Client Timestamp Forgery**: User creates `/memberProfiles/{uid}` with backdated `createdAt: Timestamp(2020-01-01)` instead of `request.time`.
