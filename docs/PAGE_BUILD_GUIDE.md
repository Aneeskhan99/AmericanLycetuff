# Page build guide (for everyone building a page)

Goal: build the American Lycetuff school website **exactly as designed in Figma**, as a production Next.js site.

## Project
- Path: `/home/claude/als-website` — Next.js 16 (App Router, `src/`), React 19, TypeScript, **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`, no tailwind.config).
- Next 16 has breaking changes vs older versions. If unsure about an API, read `node_modules/next/dist/docs/`. Notably: `next/image` uses `preload` (NOT `priority`); only qualities `75` and `85` are allowed.
- Dev server is ALREADY running at `http://localhost:3000` (shared by everyone, hot reloads). Do NOT kill it, restart it or run `next build`. If it is not responding, run `cd /home/claude/als-website && (npx next dev -p 3000 > /tmp/dev.log 2>&1 &)` once.
- Do NOT run git commands. Do NOT `npm install` anything (ask in your final report if you truly need a package).

## Figma
- File key: `pbpZcoVr2IirBWvcfM9Lpk`. Desktop frames are **1920px** wide, mobile frames **390px** wide.
- Load the `figma:figma-design-to-code` skill first (Skill tool), then call `get_design_context` (pass `skillNames: "figma-design-to-code"`, `clientFrameworks: "nextjs,react"`, `clientLanguages: "typescript,css"`).
- Large frames come back sparse: use `get_metadata` on the frame, then `get_design_context` on each section child (batch them in parallel).
- Download every image/SVG the design uses with: `/home/claude/als-website/scripts/fetch-asset.sh <figma-asset-url> public/images/<page>/<descriptive-name>.<ext>` (run from the project dir). Use real descriptive file names. Never leave figma.com asset URLs in code. Never substitute stock images or redraw icons — use the downloaded assets. Large raw photos are fine; `next/image` optimises them.
- If a design element is a video, try `download_assets` on that node; if no video file is available, render a `<video>` with the downloaded poster frame and `src="/videos/<name>.mp4"`, and note it in your report so the real video file can be dropped in.

## Shared pieces (read, do not edit)
- `src/app/layout.tsx` renders the site **Header** (announcement bar + nav, sticky) and **Footer** (newsletter band + dark footer) on every page. Do NOT include the nav menu or footer in your page — they are the `Nav Menu` / `Header` and `Footer` instances at the top/bottom of each Figma frame.
- `src/app/globals.css` tokens → Tailwind classes:
  - colors: `navy` #1a2d59, `navy-deep` #00274c, `navy-ink` #081e3f, `crimson` #d31245, `maroon` #773141, `line` #bdbdbd (use arbitrary values for any other colour from the design)
  - fonts: `font-inter` (default body font), `font-open-sans`. If the design uses another font, load it with `next/font/google` in a file inside YOUR page folder (e.g. `src/components/<page>/fonts.ts`) and apply its `.className`. Don't touch layout.tsx.
  - utilities: `frame` (w-full, max-w-1920, centered), `gutter` (24px mobile, clamp(40px,7.76vw,149px) desktop), `no-scrollbar`
  - breakpoints: Tailwind defaults plus `nav:` = 1280px (when the desktop header appears).
- `src/components/layout/nav-links.ts` exports `contact` (phone, email, address) and the route list.
- Forms post JSON to `POST /api/enquiry` (already built: `src/app/api/enquiry/route.ts`). Send `form: "contact" | "enquire"`, `name`, `phone` and/or `email`, plus any other fields. Include a hidden honeypot input named `website`. Response: `{ ok: true }` or `{ ok: false, error }`.

## Routes
`/` home · `/about` · `/academics` · `/stem-robotics` · `/admissions` · `/gallery` · `/contact` · `/enquire`
Link buttons in the design to the most sensible route (e.g. "Book a campus visit"/"Enquire" → `/enquire`, "Apply" → `/admissions`, "View programmes" → `/academics`, "Get directions" → Google Maps for "American Lycetuff Swabi Shahmansoor Township").

## Your files (only touch these)
- `src/app/<route>/page.tsx` (export `metadata` with a title + description)
- `src/components/<page>/*` for section components (Server Components by default; add `"use client"` only for interactive pieces like sliders, tabs, accordions, lightboxes, forms)
- `public/images/<page>/*` for assets (`<page>` = home, about, academics, stem, admissions, gallery, contact, enquire)

## How to translate the design
- The Figma code is absolutely positioned at 1920px. Rebuild it as real responsive layout (flex/grid), keeping the exact sizes, font sizes, weights, line heights, letter spacing, colours, spacing, radii, borders, shadows and image crops from the design.
- Desktop (≥1024px, refine at `nav:`/1280+) must match the 1920 desktop frame; it should look the same at 1920 and scale gracefully down to ~1280/1024. Turn fixed left offsets into centered `max-w-[...] mx-auto` containers (e.g. content starting at x=214 in a 1920 frame → `max-w-[1492px] mx-auto`) and use `clamp()` for very large type/padding so 1366px screens still look right.
- Mobile (<1024px) must match the 390px mobile frame (24px gutters). Between 390 and 1024 the mobile layout simply widens (use 2-column grids at `md:` where it obviously helps).
- Text must be real text (not images) with the exact copy from Figma. Use semantic HTML (one `h1` per page, sections, lists, buttons vs links), alt text on images, visible focus states.
- Interactions: implement the obvious ones — sliders/carousels with prev/next + dots + swipe (CSS scroll-snap is fine), hover states shown in the design ("Card Hover" etc.), tabs/accordions, gallery lightbox/filters, form validation + success/error states. No new animation libraries; CSS transitions/keyframes and small client components are fine.

## Verify before you finish
- Screenshot your page with: `node /home/claude/tools/shot.mjs /<route> 1920 /home/claude/tools/shots/<page>-1920.png` and `... 390 .../<page>-390.png` (also check 1366). Read the PNGs and compare against the Figma screenshots section by section. Fix differences. Repeat until it matches.
- `cd /home/claude/als-website && npx tsc --noEmit -p .` and `npx eslint src/app/<route> src/components/<page>` must pass for your files.
- Check `/tmp/dev.log` for errors from your route.

## Final report (keep it short)
Files created, asset list, anything you could not match exactly or could not download (e.g. video), any font you added, and any shared-file change you think is needed (describe it; don't make it).
