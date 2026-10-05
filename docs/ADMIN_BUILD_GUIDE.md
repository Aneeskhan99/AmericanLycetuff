# Admin build guide (read fully before writing code)

We are adding a school admin panel to the American Lycetuff website **without changing the public site's design**. Several builders work in parallel; follow the ownership rules exactly.

## Project & environment
- `/home/claude/als-website` — Next.js 16 App Router, React 19, TypeScript, Tailwind v4, PostgreSQL via `pg`. Next 16 differs from older versions: if unsure, read `node_modules/next/dist/docs/`. `next/image` uses `preload` not `priority`; image qualities allowed: 75, 85.
- Dev server ALREADY running at **http://localhost:3002** (shared). Never kill/restart it, never run `next build`. If it's down: `cd /home/claude/als-website && (setsid npx next dev -p 3002 > /tmp/dev5.log 2>&1 < /dev/null &)`.
- PostgreSQL test DB (credentials in `.env.local`; never print them). If PG is down: `su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /home/claude/pg/data -l /home/claude/pg/log -o '-p 5432 -k /tmp' start"`. Query: `PGPASSWORD=testpass psql -h localhost -U postgres -d AmericanLyetuff -c "..."`.
- Test admin login: username `asim`, password `testpassword123` (test DB only). Playwright helper: `import { login } from "/home/claude/tools/admin-login.mjs"` (playwright is installed in `/home/claude/tools`, put your test scripts there and run them from that folder). Screenshots: `BASE=http://localhost:3002 node /home/claude/tools/shot.mjs /path 1366 /home/claude/tools/shots/x.png`.
- Do NOT run git. Do NOT `npm install` (all packages are installed: pg, sharp, nodemailer, @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-image, @tiptap/extension-placeholder, @tiptap/static-renderer). Ask in your report if something is truly missing.
- All tables already exist (see `db/001`–`007`). If you need a schema change, add a NEW migration in your number range (given in your task) and run `cd /home/claude/als-website && npm run db:setup`.

## Shared code you use but must NOT edit
`src/lib/{db,auth,admin-route,validate,media,mail,settings,content,content-server,revalidate,format}.ts`, `src/components/admin/{AdminProvider,Shell,ui,MediaPicker,LoginForm,SetupNeeded,UsersScreen,AccountScreen}.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/(panel)/layout.tsx`, `src/app/layout.tsx`, `src/app/(site)/layout.tsx`, `src/components/layout/*`, `src/content/index.ts`, `src/app/globals.css`, `package.json`. If you need a change there, describe it in your report.

Key APIs:
- `q(sql, params)`, `one(sql, params)`, `tx(fn)`, `audit(userId, entity, entityId, action, detail)` — **always $1 placeholders**, never string-built SQL with user input.
- `guard(handler, { roles })` wraps every `/api/admin/*` handler: checks session, role, CSRF (non-GET), forced password change. Handler gets `{ session, req, params }`; throw `new HttpError(status, message)` for errors; return `json(data, status)`. `body(req)` parses JSON.
- Validators: `str`, `email`, `oneOf`, `bool`, `int`, `id` from `@/lib/validate` (throw 422 with a readable message).
- `requireSession(roles?)` in server admin pages (`src/app/admin/(panel)/<module>/page.tsx`): redirects to login / shows "not available". Then render your client screen component.
- Roles: `administrator`, `editor`, `author`. STAFF = `["administrator","editor"]`. Authors only get News & Blog (own posts, cannot publish) and Media.
- Media: `saveUpload`, `getMediaRefs(ids)` → Map of `MediaRef {id,url,alt,width,height,srcSet,mime,kind,name,size}`, `toRef(row)`, `setMediaUsage(entity, entityId, field, ids)` (call on every save), `clearMediaUsage(entity, id)` (on delete), `mediaUrl(path)`. Upload endpoint already exists: `POST /api/admin/media` (multipart `files`), list `GET /api/admin/media`.
- Client: `useAdmin()` → `{ user, api(path,{method,body}), upload(path, formData), toast(text, 'ok'|'error') }`. `api` adds the CSRF header and handles 401.
- UI kit (`@/components/admin/ui`): `Button, Field, Input, Select, Textarea, Checkbox, SearchBox, PageHeader, Card, Badge, Empty, Table, Pagination, Toolbar, Dialog, ConfirmDialog, ErrorNote, fmtDate, slugify`. `MediaPicker` (default export, props `open,onClose,onPick,kind,multiple`) and `ImageInput` from `@/components/admin/MediaPicker`.
- `sendMail({to, subject, text, html, replyTo})` → `"sent" | "skipped (no SMTP)" | "failed: …"`; `esc()` for HTML; `siteUrl()`.
- `getSettings()` → school, contact, social, hours, analytics, notifications (emails per form: enquire/visit/contact/newsletter), announcement.
- `revalidatePaths(["/news", "/news/[slug]", "layout:/"])` after any change that affects public pages (only the affected paths).
- Page content: `definePage`, `f.text/textarea/link/image/list` (`@/lib/content`), `getPageContent(page)` (`@/lib/content-server`). Read `src/lib/content.ts`.

## Admin screens — conventions
- Server page `src/app/admin/(panel)/<module>/page.tsx`: `export const metadata = { title: "…" }`, `await requireSession(ROLES)`, render `<XScreen />` from `src/components/admin/<module>/`.
- API under `src/app/api/admin/<module>/…` using `guard`. Validate everything server-side. Paginate lists (20 per page) with search; return `{ rows, total, page, pageSize }`.
- UI: same look as `UsersScreen.tsx` (read it): `PageHeader` + `Card` + `Toolbar` (search + filters) + `Table` + `Pagination`; add/edit in `Dialog` or a full edit view; **`ConfirmDialog` before every delete**; toasts on success; inline `ErrorNote` on validation errors; empty states; mobile-friendly (tables scroll horizontally, forms stack).
- Don't call `setState` synchronously inside `useEffect` (lint rule) — mount dialogs only while open (`{open && <X key=… />}`) and initialise state from props.
- Record changes with `audit()`. Record image use with `setMediaUsage`.
- CSV exports: a GET route returning `text/csv; charset=utf-8` with `Content-Disposition: attachment`, values quoted/escaped (also guard against formula injection: prefix cells starting with `= + - @` with `'`).

## Public pages — conventions
- Live in `src/app/(site)/<route>/page.tsx` (the group adds the site header/footer). They MUST stay static: no `cookies()`/`headers()`/`searchParams` in public pages. Use `generateStaticParams` for `[slug]` routes, and `export const revalidate = 300` where date-based visibility matters (scheduled posts, upcoming events). Use separate static routes instead of query strings for filters (e.g. `/news/category/[slug]`).
- Read the DB through `src/lib/public/<module>.ts` (`import "server-only"`), functions that **catch errors and return empty results** so `next build` works without a database.
- New public pages (news, events, faculty, downloads, notices, album pages) have no Figma design: build them **in the exact style of the existing site** — reuse its look: study `src/components/academics/*`, `src/components/admissions/*`, `src/components/contact/*` (eyebrow label 12–13px uppercase tracking, headings Inter with a crimson highlight word, navy `#1a2d59`/crimson `#d31245` buttons, yellow `#f0d400`-style photo frames where used, `frame`/`gutter` containers, 24px mobile gutters). Each needs a hero/intro section similar to the other inner pages, responsive to 390px, with empty states ("No events scheduled yet").
- Page heading/intro text on new pages should be editable: fill the stub `src/content/<key>.ts` (`news`, `events`, `faculty`, `downloads` exist) with `definePage` fields and read them with `getPageContent`.
- Render media with `<img src={ref.url} srcSet={ref.srcSet || undefined} sizes="…" alt={ref.alt} width height loading="lazy">` (plain img is fine for uploaded media; add `// eslint-disable-next-line @next/next/no-img-element`).
- Rich text from the post editor is stored as Tiptap JSON and rendered on the server (never `dangerouslySetInnerHTML` of browser-supplied HTML).

## Done means
- `cd /home/claude/als-website && npx tsc --noEmit -p .` passes and `npx eslint <your files>` has no errors.
- You tested the API (including a forbidden role and a missing CSRF header returning 403) and the screens in a browser (Playwright), desktop 1366 and mobile 390, plus the public pages.
- Final report (short): files created, migrations added, public routes added, what each role can do, anything not done, and any change you need in a shared file (described precisely, not made).
