# Emergency lockdown (kill switch) — runbook & training notes

A single switch that, when turned on, makes the whole dashboard go dark for **every** user on
**every** page: live data stops, downloads stop, the Socket.IO connection is cut, and all anyone
sees is a message you choose. Use it if you suspect the server is under attack and you want to
"pull the plug" on what users can see and pull, without stopping the Node process.

> **Security note (teach this).** This is *containment*, not a fix. It stops data leaving through
> the app, but the real defences are: strong admin accounts, patching, a firewall, least‑privilege
> database users, and good backups. The kill switch buys you time; it is not a cure.

---

## 1. How it works (for the class)

```
          Admin page toggle                 curl with secret key
          PUT /api2/admin/services/lockdown  POST /api2/kill (X-Kill-Key)
                        \                      /
                         v                    v
                 utility/serviceSettings.js  (saves lockdown = {active,message,since,by})
                         |            \
         row in nas_service_settings   emits "lockdown" event
                         |                      \
   every request -> lockdownGuard (app.js)      database/sockets.js
     blocks data/downloads with 503              drops all live sockets,
     (keeps sign-in, status, unlock open)        refuses new ones
                         |
          every page polls /api2/service-status (every 20s) and also
          gets an instant "nas_lockdown" push on the socket, then shows
          the full-screen lock message (serviceStatus.js LockdownOverlay)
```

**What stays reachable on purpose, so you can recover:** the sign-in session API (`/auth2/*`), the
public status (`/api2/service-status`), the Admin page itself, and the unlock routes
(`/api2/admin/services/lockdown`, `/api2/kill`). Everything else answers `503 service_locked`.

**What is blocked:** all data endpoints, all report/Excel downloads, the old login APIs, and the
live Socket.IO feed.

---

## 2. One-time setup

Add a strong secret to the server `.env` (used only by the emergency `curl` route, **not** by the
Admin page):

```
ADMIN_KILL_TOKEN=<paste a long random string, 32+ characters>
```

Generate one:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Then restart: `pm2 restart tcnnas`.

- Keep this token out of git, chat and screenshots. Treat it like a password.
- If you can, firewall `POST /api2/kill` so it is reachable only from your admin machine.
- Without the token set, the Admin‑page toggle still works; only the `curl` route is disabled.

The storage table `nas_service_settings` is created automatically (shared with the weather switch,
migration `006_service_settings.sql`).

---

## 3. Triggering a lockdown

### A) From the Admin page (normal way)
1. Sign in as an administrator → **Admin** in the menu.
2. Under **Emergency lockdown**, type the message users should see.
3. Tick **"I understand this blocks every user immediately."**
4. Click **Lock the dashboard now** and confirm.

The page you are on keeps a slim red bar (not the full cover) so you can still unlock.

### B) From a trusted machine with the key (if you cannot reach the page)
```powershell
curl -X POST https://nisonas.org/api2/kill `
  -H "X-Kill-Key: <ADMIN_KILL_TOKEN>" `
  -H "Content-Type: application/json" `
  --data '{"active":true,"message":"Service temporarily suspended."}'
```
(Keep the key in the header as shown — never in the URL.)

---

## 4. Clearing the lockdown (recovery)

**From the Admin page:** open **Admin** → **Unlock the dashboard**.

**From a trusted machine:**
```powershell
curl -X POST https://nisonas.org/api2/kill `
  -H "X-Kill-Key: <ADMIN_KILL_TOKEN>" `
  -H "Content-Type: application/json" `
  --data '{"active":false}'
```

**Last resort (direct database):**
```sql
UPDATE nas_service_settings SET value = '{"active": false}' WHERE key = 'lockdown';
```
The server notices within ~5 seconds; open pages clear within ~20 seconds (or instantly when the
socket reconnects).

> A lockdown **survives a restart** (it lives in the database). If the app boots while locked, it
> stays locked and drops sockets until you clear it.

---

## 5. What gets recorded

Every change and every rejected key attempt is written to the audit trail (visible at `/audit`):
`lockdown_activated`, `lockdown_cleared`, `lockdown_key_rejected` (shown in red). Use these in the
exercise to show students the incident timeline.

---

## 6. Suggested training exercise

1. Two students open `/home` and `/charts`; watch live data flow.
2. Instructor locks from Admin with a message.
3. Class observes: both pages go dark within a second (socket push); a direct `GET /power/latest`
   now returns `503 service_locked`; a report download fails.
4. Show the audit entry.
5. Recover with the `curl` key route (simulating "the UI is unreachable").
6. Discuss: this contained the incident, but the next steps are patch, rotate credentials, review
   logs, restore from backup — obfuscation and a kill switch do not replace those.
