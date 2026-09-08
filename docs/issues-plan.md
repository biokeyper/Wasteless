# Open Issues — Exploration, Scope & Fix Plan

Branch: `feat/issues`
Source issues: [biokeyper/Wasteless](https://github.com/biokeyper/Wasteless/issues) #5, #6, #8, #17 (all opened 2025-06-27, no body text — titles only).

This document records what the codebase actually does today for each issue (verified by reading the code, not assumed from the title), what's genuinely missing, and the plan to close the gap. Each issue got its own investigation pass; findings below cite `file:line`.

---

## #17 — 🤝 Item Requests

### Status: partially built, broken in two places, incomplete on both clients

The core "request an item" flow was built over several merged PRs, but the **owner-facing half of the loop was never finished**, and one backend method has a persistence bug.

**Backend** (`backend/src/main/java/.../items/`)
| Capability | Status | Evidence |
|---|---|---|
| Create request (dup-prevented) | ✅ done | `RequestController.java:25-29` → `ItemRequestServiceImpl.java:30-47`, throws `ConflictException` on duplicate |
| List incoming/outgoing/by-id | ✅ done | `RequestController.java:30-49`; incoming query filters `status = 0` (PENDING) — `ItemRequestRepo.java:14-21` |
| Owner accept/reject | 🐛 **buggy** | `ItemRequestServiceImpl.java:89-111` — auto-rejects sibling pending requests and saves *them*, but never calls `save()` on the request actually being accepted/rejected. No `@Transactional` on the class (unlike `ItemServiceImplementation`). The accept/reject status change likely doesn't persist reliably. |
| Mark request fulfilled | ❌ missing | `RequestStatus` enum has `FULFILLED` (`RequestStatus.java:3-8`) but it's never set anywhere in the codebase |
| Item becomes unavailable once given away | ❌ missing | `Item` entity has no `available`/status field; accepting a request never touches the `Item`, so it stays listed forever |
| Requester cancel/withdraw | ⚠️ partial | Only a hard `DELETE /requests/{id}` exists (`RequestController.java:62-65`) — no soft "cancelled" state, no ownership check on who may delete |
| Requester identity on a request | ❌ missing | `ItemRequest` stores only a `userId` UUID — no join/DTO field exposing a display name |

**Frontend (mobile)** (`frontend/app/(home)/`, `frontend/components/items/`)
| Capability | Status | Evidence |
|---|---|---|
| Outgoing requests list → details | ✅ done | `my-requests.tsx:107-109` → `OutgoingItemRequest.tsx:22-27` |
| Incoming requests list | 🐛 **broken** | `my-requests.tsx:108` renders `OutgoingRequestItemCard` for *both* tabs; `IncomingItemRequest.tsx` is dead code (unused) — incoming cards have no `onPress` at all |
| Accept / reject UI | ❌ missing entirely | Zero references to the accept/reject endpoints anywhere in `frontend/` |
| Cancel request button | 🐛 **non-functional stub** | `handleCancelRequest = () => {}` at `request-details.tsx:27`, wired to a visible, enabled button |
| Create request flow | ✅ done | `request_item.tsx:79-107`, handles the 409 duplicate case explicitly |
| Requester name in UI | will show "Unknown" | reads `request.requested_by?.display_name` (`my-requests.tsx:55`), a field the backend never populates |

**Web client**: item requesting is **not exposed at all** — `item-card.tsx:72-73` has a "Request Item" button with no `onClick`; no `/requests` calls anywhere under `web/src`.

**No notification** of any kind fires when a request is received.

### Scope decision
Treat this issue as "the request loop doesn't actually close" — fix the parts that make a request go from *pending → resolved* correctly on the client that already supports it (mobile). Web request support and notifications are real gaps but a separate scope increase; call them out as explicit follow-ups rather than folding them in silently.

### Fix plan
1. **Backend — fix the persistence bug**: add `@Transactional` to `ItemRequestServiceImpl` (or the accept/reject methods), and save the target request itself, not just its rejected siblings.
2. **Backend — item availability**: add an `available` (boolean) or `status` field to `Item`; on accept, set the item unavailable and reject-and-save all other pending requests for it (already partially done, just needs the fix from step 1); exclude unavailable items from the public listing query in `ItemRepository`.
3. **Backend — fulfillment**: decide whether `FULFILLED` is set by the owner ("marked as given") or the requester ("confirms received"); add the corresponding endpoint (`PATCH /requests/{id}/fulfill`) — keep it minimal, one explicit action, no auto-transition guessing.
4. **Backend — cancel**: add `PATCH /requests/{id}/cancel` (or reuse DELETE) restricted to the requester and only while `PENDING`; today's unrestricted `DELETE` should at minimum gain an ownership check (ties into #8 below — right now there's no way to check ownership at all).
5. **Backend — requester identity**: extend the response DTO to include the requester's display name (join or a second lookup) so the frontend stops rendering "Unknown".
6. **Frontend — fix the incoming tab**: render `IncomingItemRequest` (not the outgoing card) in the incoming tab of `my-requests.tsx`, with real navigation.
7. **Frontend — accept/reject UI**: add owner-facing actions on the request-details screen (or a distinct incoming-detail view) wired to the accept/reject endpoints, with optimistic UI + error handling matching the existing patterns in `request_item.tsx`.
8. **Frontend — wire the cancel button**: replace the empty `handleCancelRequest` with a real call to the cancel/delete endpoint and refresh local state.
9. **Follow-up (not in this pass)**: expose item requesting on the web client; add a request-received notification (push or email) — flag both as separate future issues rather than scope-creeping this fix.

---

## #8 — Backend JWT verification middleware

### Status: zero auth infrastructure exists — every endpoint trusts a client-supplied user id

- No Spring Security, no filter, no JWT parsing, no mention of Supabase anywhere in `backend/src` (grep for `Security|Filter|JWT|Bearer|Authorization|@PreAuthorize|supabase` returns nothing relevant).
- `pom.xml` has no `spring-boot-starter-security` and no JWT library (`jjwt`, `nimbus-jose-jwt`, `auth0/java-jwt`).
- Every mutation trusts an unverified `userId`:
  - `ItemCreationDTO.userId` (`ItemCreationDTO.java:33`) — set by the client, copied straight onto the entity.
  - `ItemController.updateItem`/`deleteItemById` (lines 60, 78) — **no user context checked at all**; anyone can edit/delete anyone's item.
  - `RequestController` accept/reject/delete (lines 50-65) — no check the caller owns the item or the request.
  - `UserController.updateUser`/`deleteUserById` — no check the caller *is* that user; `getAllUsers` (line 55) returns the raw `User` entity **including the password field**, unauthenticated.
- No auth config in `application.yaml`/`application.properties`/`.env.example` — no JWT secret, no JWKS URL, no issuer. **Open question**: whether the target Supabase project signs with the legacy shared HS256 secret or newer RS256/JWKS keys — this determines the implementation shape and must be confirmed against the live Supabase project settings before writing code.
- `GlobalExceptionHandler` currently only wires `ResourceNotFoundException`; no 401/403 handling exists.

### Scope decision
This is a real security gap (currently: full IDOR — any authenticated *or unauthenticated* client can act as any user), not just a nice-to-have. Scope it as: verify the token, derive the user id server-side, and use it everywhere an endpoint currently trusts a client-supplied id. Do not attempt to also redesign roles/permissions beyond ownership checks.

### Fix plan
1. **Confirm signing scheme** against the actual Supabase project (check the frontend's `.env` / Supabase dashboard → Project Settings → API) — determines HS256-shared-secret vs RS256-JWKS.
2. Add `spring-boot-starter-security`. If RS256/JWKS: use `spring-boot-starter-oauth2-resource-server` with `jwk-set-uri` pointing at Supabase's `/auth/v1/.well-known/jwks.json` — no custom filter needed. If legacy HS256: write a `OncePerRequestFilter` validating the `Authorization: Bearer` header with `jjwt` against `SUPABASE_JWT_SECRET`.
3. Add a minimal `SecurityConfig`: stateless sessions, permit Swagger/health endpoints, require a valid bearer token for everything else.
4. Extract the token's `sub` claim (Supabase's `auth.users.id`) into the security context; add a small helper to read "current user id" from it in controllers/services.
5. Replace every client-supplied `userId` used for a *write* (create item, create request, accept/reject, update/delete user) with the authenticated user id; add ownership checks (403) on update/delete/accept/reject where the acting user must match the resource owner.
6. Add `SUPABASE_JWT_SECRET` (or `SUPABASE_JWKS_URL`/`SUPABASE_ISSUER`) to `.env.example` and `application.yaml`.
7. Add a 401/403 JSON error shape consistent with `GlobalExceptionHandler`'s existing format.
8. **Coordinate with both clients**: verify `frontend/` and `web/` API calls actually attach `Authorization: Bearer <supabase-access-token>` today — this wasn't confirmed in this pass and must be checked before deploying the backend change, or every write request will start failing.
9. Update `ItemCreationDTO`/`RequestCreationDTO` to drop the now-server-derived `userId` field — a breaking API change, sequence it with the client updates from step 8.

---

## #6 — Supabase setup: Google login   /   #5 — Supabase setup: Google signup

### Status: fully working on web, stubbed and disabled on mobile

Supabase's `signInWithOAuth({ provider: 'google' })` doesn't distinguish "login" vs "signup" — it's the same call on both screens — so #5 and #6 are effectively one implementation task surfaced on two screens.

**Web** (`web/src/pages/auth/`) — ✅ already implemented and not disabled:
- `Login.tsx:79-94` `handleGoogleLogin` → `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: import.meta.env.VITE_GOOGLE_REDIRECT_URI } })`, wired to a live button (line 143).
- `Signup.tsx:103-112` same pattern.
- `OAuthCallback .tsx` (note: filename literally has a trailing space) handles the redirect, routed at `/auth/callback`.
- Gap: `VITE_GOOGLE_REDIRECT_URI` is referenced but **no `web/.env.example` exists** to document it.

**Mobile** (`frontend/app/(auth)/`) — stubbed, then explicitly disabled:
- `login.tsx:82-89` and `register.tsx:150-156` — Google buttons are **commented out**. Even active, their `onPress` was `() => {}` / a `console.log` — never real logic.
- Disabling commit: `dd18630` "Fix: Disable Google signin/up button for prod" — right after mobile build config was added, consistent with "hide a visibly non-functional button before shipping," not a regression of working code.
- No `expo-auth-session`, `expo-google-app-auth`, or `@react-native-google-signin/google-signin` installed.
- `app.json` has `"scheme": "wasteless"` (usable as an OAuth redirect deep link) but no Google client ID/redirect config anywhere.
- `frontend/.env.example` has only the Supabase URL/anon key.

### Scope decision
Web needs only a small doc fix. Mobile needs the actual OAuth implementation — that's the substantive work behind both issues.

### Fix plan
1. **Prerequisite (external, can't verify from the repo)**: confirm the Google provider is enabled and configured with OAuth client credentials in the Supabase dashboard, and that `wasteless://` (or a chosen path) is registered as an allowed redirect URL.
2. **Mobile implementation**: use Supabase's documented Expo pattern — `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <scheme-deep-link>, skipBrowserRedirect: true } })` combined with `expo-web-browser`'s `openAuthSessionAsync` to drive the hosted OAuth flow, then complete the session via `exchangeCodeForSession` on the returned redirect URL.
3. Add deep-link handling in `frontend/app/_layout.tsx` / `AuthContext.tsx` to catch the redirect back into the app.
4. Verify `expo-web-browser` is present (it's a standard Expo SDK module); no native Google SDK needed with this approach.
5. Re-enable the two buttons in `login.tsx`/`register.tsx`, replacing the commented-out stubs with the real handler, matching the loading/error UX already used for email/password auth.
6. **Testing constraint to flag**: custom-scheme OAuth redirects are unreliable in Expo Go — this will likely need a dev build to test properly.
7. **Web (minor)**: add `web/.env.example` documenting `VITE_GOOGLE_REDIRECT_URI`.

---

## Suggested sequencing

1. **#8 first.** It's a standalone security fix that #17's ownership checks (accept/reject/cancel, item update/delete) depend on — building request permissions on top of an unauthenticated backend would mean redoing them once auth lands.
2. **#17 next**, now that "who is the current user" is a solved problem.
3. **#5/#6 (mobile Google OAuth)** — independent of the other two, can be done in parallel by a second track if needed.
4. Web-side item requesting and request notifications: file as new follow-up issues rather than folding into #17.
