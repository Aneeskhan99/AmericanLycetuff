# American Lycetuff — Swabi Campus Website

Next.js 16 (App Router) + Tailwind CSS v4 + TypeScript, built from the Figma file
`American-Lycetuff` (desktop 1920px frames, mobile 390px frames).

## Pages

| Route | Page |
| --- | --- |
| `/` | Home (hero slider + video, stats, about, stages, map, youth skills, admissions dates, STEM labs, numbers, discover tabs) |
| `/about` | About us |
| `/academics` | Academics |
| `/stem-robotics` | STEM & Robotics |
| `/admissions` | Admissions (process, grades, documents, fees, key dates, FAQ) |
| `/gallery` | Gallery (filters + lightbox) |
| `/contact` | Contact us (contact form + Google Map) |
| `/enquire` | Enquire now (enquiry form) |
| `POST /api/enquiry` | Receives both forms |

## Run locally

```bash
npm install
npm run dev        # http://localhost:3002
```

## Deploy on our server

Requires Node.js 20.9+ (Node 22 LTS recommended).

```bash
npm ci
npm run build
npm run start      # serves on port 3002
```

Keep it running with PM2 and put Nginx in front:

```bash
npm i -g pm2
pm2 start npm --name als-website -- start   # port 3002
pm2 save && pm2 startup
```

```nginx
server {
    server_name alsswabi.edu.pk www.alsswabi.edu.pk;
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`next.config.ts` also sets `output: "standalone"`, so instead of `npm run start` you can copy
`.next/standalone`, `.next/static` (to `.next/standalone/.next/static`) and `public`
(to `.next/standalone/public`) to the server and run `node server.js`.

## Admin panel (/admin)

The admin lives at **http://localhost:3002/admin**. It needs PostgreSQL; the public pages do not
(they stay prerendered static and build even when the database is off).

1. Create the database in pgAdmin (ours is `AmericanLyetuff` on PostgreSQL 18).
2. `.env.local` (git-ignored, never commit it):
   ```
   DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/AmericanLyetuff
   ```
3. Run:
   ```bash
   npm install
   npm run db:setup     # applies db/*.sql, generates ADMIN_SESSION_SECRET, asks for the first administrator
   npm run dev
   ```
   `db:setup` finds the right port if more than one PostgreSQL is installed, and is safe to re-run.

Roles: **Administrator** (everything, users, settings) · **Editor** (all content) · **Author** (own posts, cannot publish).

| What | Where |
| --- | --- |
| Migrations (numbered) | `db/NNN_name.sql` |
| Setup script | `scripts/db-setup.mjs` |
| DB connection / audit log | `src/lib/db.ts` |
| Passwords, sessions, CSRF, login rate limit | `src/lib/auth.ts` |
| Guard for every admin API (session + role + CSRF) | `src/lib/admin-route.ts` |
| Admin screens | `src/app/admin/**`, `src/components/admin/**` |
| Admin API | `src/app/api/admin/**` |

Locked out? Another administrator can reset your password from **Users**. If you are the only one,
run `npm run db:setup -- --username newadmin --name "Name" --password "a long password"` after
disabling the old account in pgAdmin (setup only creates an administrator when none is active).

## What the admin manages

| Sidebar | What it does | Public pages it updates |
| --- | --- | --- |
| Dashboard | New admission enquiries, unread contact messages, upcoming events, latest news, recently edited pages | — |
| Enquiries | Every form (admission enquiry, campus visit, contact) is saved here and emailed to the school. Filters, status New → Contacted → Visit booked → Enrolled / Closed, assign to staff (emails them), notes, CSV export. Records page, referrer and UTM tags. | — |
| Pages | Edit the text, photos, buttons and cards of every page. Draft → Preview → Publish, reset to default, history and restore. | the page edited |
| News & Blog | Posts with rich text, featured image, categories, tags, author, schedule; autosave. Authors write drafts, editors publish. | /news, /news/… |
| Events / Academic calendar | Events with date, time, venue, image; term dates, holidays and exams | /events, /events/… |
| Notices | Short notices with dates and optional PDF; "pin" puts one in the bar at the top of every page | every page, /notices |
| Faculty & staff | Profiles with photo, designation, department, qualifications, order | /faculty |
| Gallery | Albums with many photos, captions, cover | /gallery, /gallery/… |
| Downloads | Prospectus, fee structure, forms, results… public or hidden | /downloads |
| Media library | All uploads; images are resized and optimised; delete only when unused | — |
| Subscribers | Newsletter sign-ups from the footer, CSV export | — |
| Users / Settings | Accounts and roles; school details, phones, email, address, campuses, social links, office hours, announcement bar, Google Analytics / GTM IDs, notification emails per form | every page |

Public pages stay prerendered static. Saving in the admin re-renders only the pages affected.
News refreshes every 5 minutes (so scheduled posts go live on time) and events/notices hourly.

### Uploads (MEDIA_DIR)
Uploaded files are stored OUTSIDE the project, in `MEDIA_DIR` (default: a folder
`AmericanLycetuff-media` next to the project) and served at `/media/...`. Back this folder up
together with the database. On the live server Nginx can serve it directly:

```nginx
location /media/ { alias /var/www/AmericanLycetuff-media/; expires 1y; add_header Cache-Control "public, immutable"; }
```

### Email (SMTP)
Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and `SITE_URL` in
`.env.local` (or the server environment) and restart. They are never stored in code or the database.
Who receives each form is set in Admin → Settings → Notification emails. Without SMTP, submissions
are still saved and visible under Enquiries. Settings has a "Send test email" button.

## Content still to supply

- **Hero video:** added at `public/videos/hero.mp4` (1080p H.264, compressed from the 173 MB original to 67 MB, faststart so it streams). It only loads on desktop widths; phones show the photo.
- **Gallery campus tour video:** `public/videos/gallery-campus-tour.mp4`.
- Placeholder copy kept from Figma: full street address, WhatsApp number, admissions email,
  landmarks line on Contact; "[Caption to be added]" in Gallery; "Photo to be added" cards on STEM.
- Copy written to fill gaps (please review): Admissions FAQ answers 2–6, Home "STEM & Robotics"
  and "Campus Life" tab text, Enquire dropdown options, Gallery photo categories.
- Social links, phone, WhatsApp, admissions email and address: set them in Admin → Settings.
- Placeholder texts above can now be replaced in Admin → Pages without code.

## Project structure

```
src/app/<route>/page.tsx        one file per page
src/app/api/enquiry/route.ts    form endpoint
src/components/layout/          Header, Footer, nav links + contact details
src/components/<page>/          page sections
public/images/<page>/           images exported from Figma
docs/PAGE_BUILD_GUIDE.md        conventions used to build each page
```
