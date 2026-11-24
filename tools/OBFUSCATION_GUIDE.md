# Backend obfuscation — guide, toolchain & revert procedure

Goal: keep a readable copy of the server code on your normal branch, and deploy an **unreadable but
identical** copy from a separate `obfuscate` branch, so that someone who reaches the server files
cannot simply read the logic. Switching branches flips between the two.

> **Teach this honestly: obfuscation is obscurity, not security.** It raises the effort to read the
> code; it does **not** stop a determined attacker (the code still runs, so it can be traced and
> partly recovered). It is worth doing as defence‑in‑depth and as a training topic, but the real
> protections are authentication, patching, a firewall, least‑privilege DB users, HTTPS, and
> backups. Never rely on obfuscation to hide secrets — secrets belong in `.env` (already gitignored),
> never in code.

---

## 1. What the tool does

`tools/obfuscate.js` rewrites the project's **own** server `.js` files **in place**:

- **Touched:** `app.js`, `bin/www`, and every `.js` under
  `routes/ controllers/ models/ utility/ database/ weather2/ axis/`.
- **Left alone:** `node_modules/`, `build/`, `dist/`, `public/`, the SSL folders, `.env`,
  and all `.sql` / `.json` / certificate files (third‑party, static, secret, or read as data by
  path — obfuscating them would break the app).

It renames all local variables and hides string literals (including SQL and `require` paths — they
still evaluate to the same text at run time), while **keeping** property names, global names and
`console` logging, so `pg` rows, `req`/`res`, Socket.IO and your logs keep working. Control‑flow
flattening and dead‑code injection are **off** on purpose, so the real‑time socket/MQTT path is not
slowed down.

**Built‑in safety:** each file is obfuscated and then `node --check`ed *before anything is written*.
If any file fails, nothing is written and the run aborts — you can never ship a half‑obfuscated tree.

This was validated on all 122 server files: every file passed `node --check`, and model SQL strings
and function outputs were byte‑for‑byte identical before and after.

---

## 2. One-time prerequisite

Install the dev tool (not needed on the production server, only where you run the obfuscation):

```powershell
npm install --save-dev javascript-obfuscator
```

Preview what would change, without writing (optional):

```powershell
npm run obfuscate:dry
```

---

## 3. Create the `obfuscate` branch and build it

Do this on your **development machine**, branching from the branch you currently deploy
(here that is `fix-pages-deploy` — use whatever your live branch is):

```powershell
# 1. make sure the readable branch is committed and clean first
git status

# 2. create the obfuscate branch FROM your current working branch
git checkout -b obfuscate

# 3. obfuscate the server files in place
npm run obfuscate

# 4. sanity-check it still boots locally (Ctrl+C after it starts cleanly)
npm start

# 5. commit the obfuscated tree on this branch only
git add -A
git commit -m "Obfuscated build (do not edit by hand; regenerate from the readable branch)"

# 6. push the branch
git push -u origin obfuscate
```

> **Rule:** never edit code on the `obfuscate` branch by hand. Make all real changes on the readable
> branch, then rebuild the obfuscate branch (Section 6).

---

## 4. Deploy the obfuscated branch on the server (pm2)

On the server:

```powershell
# from the backend folder, with a clean working tree
git fetch origin
git checkout obfuscate
git pull

# if migrations changed since the last deploy, run them (see DB_MAINTENANCE.md), then:
pm2 restart tcnnas
pm2 save
```

Nothing else changes: the entry point is still `bin/www`, the paths, `.env`, `build/`, and the SSL
files are untouched, so pm2 runs it exactly as before.

Confirm it is healthy:

```powershell
pm2 status
pm2 logs tcnnas --lines 50
```

---

## 5. Revert procedure (fast rollback)

If anything looks wrong after deploying the obfuscated branch, switch straight back to the readable
branch that last worked and restart — a few seconds:

```powershell
git checkout fix-pages-deploy      # your last-known-good branch
pm2 restart tcnnas
pm2 save
```

Because the readable branch is a separate branch, nothing was lost — you are just pointing the server
at the other copy. Keep this command on a sticky note during the training.

If `git checkout` complains about local changes on the server (it should not, the server only pulls),
discard them first: `git reset --hard && git checkout fix-pages-deploy`.

---

## 6. When the code changes later (keeping the two branches in sync)

1. Make and test the change on the readable branch (e.g. `fix-pages-deploy`); commit it.
2. Rebuild the obfuscate branch from it:

```powershell
git checkout obfuscate
git merge fix-pages-deploy          # bring in the readable changes
npm run obfuscate                   # re-obfuscate the updated files
git add -A
git commit -m "Rebuild obfuscated bundle from fix-pages-deploy"
git push
```

If `git merge` reports conflicts (because the obfuscated files differ from the readable ones), the
simplest clean rebuild is:

```powershell
git checkout obfuscate
git checkout fix-pages-deploy -- .  # take the readable files as-is
npm run obfuscate                   # obfuscate them again
git add -A && git commit -m "Rebuild obfuscated bundle" && git push
```

---

## 7. Toolchain summary (what to show students)

| Step | Command | Where |
|------|---------|-------|
| Install tool | `npm install --save-dev javascript-obfuscator` | dev machine |
| Preview | `npm run obfuscate:dry` | dev machine |
| Branch | `git checkout -b obfuscate` | dev machine |
| Build | `npm run obfuscate` | dev machine (on `obfuscate`) |
| Verify | `npm start` then Ctrl+C | dev machine |
| Commit/push | `git add -A && git commit && git push -u origin obfuscate` | dev machine |
| Deploy | `git checkout obfuscate && git pull && pm2 restart tcnnas` | server |
| **Revert** | `git checkout fix-pages-deploy && pm2 restart tcnnas` | server |

### Alternatives worth mentioning in class
- **Bytecode (`bytenode`)** compiles each file to V8 bytecode — harder to read than text obfuscation,
  but tied to the exact Node version and makes crash stacks unreadable. Heavier to operate.
- **A real review** would spend the effort on auth, patching, firewalling and backups first, because
  those stop attacks; obfuscation only slows down reading.
