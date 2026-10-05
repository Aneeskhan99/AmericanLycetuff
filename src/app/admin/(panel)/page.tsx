import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card } from "@/components/admin/ui";
import { pageByKey } from "@/content";
import { requireSession } from "@/lib/auth";
import { q } from "@/lib/db";
import { FORM_LABEL, STATUS_LABEL } from "@/lib/enquiry-options";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

type Count = { n: number };

function Tile({ label, value, note, href }: { label: string; value: number | string; note: string; href: string }) {
  return (
    <Link href={href} className="group block rounded-xl border border-[#eaecf0] bg-white p-5 transition-colors hover:border-[#1a2d59]/40">
      <p className="text-[13px] font-medium text-[#667085]">{label}</p>
      <p className="mt-2 text-[30px] font-semibold leading-none text-[#101828]">{value}</p>
      <p className="mt-2 text-[12px] text-[#1a2d59] group-hover:underline">{note}</p>
    </Link>
  );
}

function Panel({ title, href, linkLabel, children, empty }: { title: string; href: string; linkLabel: string; children: ReactNode[]; empty: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-[#eaecf0] px-5 py-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <Link href={href} className="text-[13px] text-[#1a2d59] hover:underline">{linkLabel}</Link>
      </div>
      {children.length ? <ul className="divide-y divide-[#f2f4f7]">{children}</ul> : <p className="px-5 py-8 text-center text-[14px] text-[#667085]">{empty}</p>}
    </Card>
  );
}

const statusTone = (s: string) => (s === "new" ? "blue" : s === "enrolled" ? "green" : s === "closed" ? "gray" : "amber") as "blue" | "green" | "gray" | "amber";
const postTone = (s: string) => (s === "published" ? "green" : s === "scheduled" ? "amber" : "gray") as "green" | "amber" | "gray";

export default async function Dashboard() {
  const { user } = await requireSession();
  const staff = user.role !== "author";

  const hour = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Karachi" }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Authors only see their own posts.
  const posts = await q<{ id: number; title: string; status: string; published_at: string | null; updated_at: string; author: string | null }>(
    `SELECT p.id, p.title, p.status, p.published_at, p.updated_at, u.name AS author
       FROM posts p LEFT JOIN users u ON u.id = p.author_id
      WHERE $1 OR p.author_id = $2
      ORDER BY p.updated_at DESC LIMIT 5`,
    [staff, user.id],
  );

  if (!staff) {
    const [drafts] = await q<Count>(`SELECT count(*)::int AS n FROM posts WHERE author_id = $1 AND status = 'draft'`, [user.id]);
    const [live] = await q<Count>(`SELECT count(*)::int AS n FROM posts WHERE author_id = $1 AND status <> 'draft'`, [user.id]);
    return (
      <>
        <Heading greeting={greeting} name={user.name} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Tile label="Your drafts" value={drafts.n} note="Continue writing" href="/admin/news" />
          <Tile label="Your published posts" value={live.n} note="See all your posts" href="/admin/news" />
          <Tile label="Write something new" value="+" note="Start a new post" href="/admin/news/new" />
        </div>
        <div className="mt-6">
          <Panel title="Your recent posts" href="/admin/news" linkLabel="All posts" empty="You have not written any posts yet.">
            {posts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
                <Link href={`/admin/news/${p.id}`} className="truncate font-medium hover:underline">{p.title || "Untitled"}</Link>
                <Badge tone={postTone(p.status)}>{p.status}</Badge>
              </li>
            ))}
          </Panel>
        </div>
      </>
    );
  }

  const [[newEnq], [unreadContact], [upcomingCount], [liveNews], enquiries, events, pages] = await Promise.all([
    q<Count>(`SELECT count(*)::int AS n FROM enquiries WHERE status = 'new' AND form IN ('enquire', 'visit')`),
    q<Count>(`SELECT count(*)::int AS n FROM enquiries WHERE form = 'contact' AND read_at IS NULL`),
    q<Count>(`SELECT count(*)::int AS n FROM events WHERE published AND coalesce(ends_at, starts_at) >= now()`),
    q<Count>(`SELECT count(*)::int AS n FROM posts WHERE status <> 'draft' AND published_at <= now()`),
    q<{ id: number; name: string; form: string; status: string; grade: string; created_at: string; read_at: string | null }>(
      `SELECT id, name, form, status, grade, created_at, read_at FROM enquiries ORDER BY created_at DESC LIMIT 6`,
    ),
    q<{ id: number; title: string; starts_at: string; venue: string }>(
      `SELECT id, title, starts_at, venue FROM events WHERE published AND coalesce(ends_at, starts_at) >= now() ORDER BY starts_at LIMIT 5`,
    ),
    q<{ key: string; draft: boolean; at: string; by_name: string | null }>(
      `SELECT pc.key, pc.draft IS NOT NULL AS draft,
              greatest(pc.draft_updated_at, pc.published_at) AS at,
              u.name AS by_name
         FROM page_content pc
         LEFT JOIN users u ON u.id = CASE WHEN pc.draft_updated_at >= coalesce(pc.published_at, '-infinity') THEN pc.draft_updated_by ELSE pc.published_by END
        WHERE greatest(pc.draft_updated_at, pc.published_at) IS NOT NULL
        ORDER BY at DESC LIMIT 5`,
    ),
  ]);

  return (
    <>
      <Heading greeting={greeting} name={user.name} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="New admission enquiries" value={newEnq.n} note="Open new enquiries" href="/admin/enquiries?status=new" />
        <Tile label="Unread contact messages" value={unreadContact.n} note="Read messages" href="/admin/enquiries?form=contact&unread=1" />
        <Tile label="Upcoming events" value={upcomingCount.n} note="Manage events" href="/admin/events" />
        <Tile label="Published news posts" value={liveNews.n} note="Write a post" href="/admin/news/new" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Latest enquiries" href="/admin/enquiries" linkLabel="All enquiries" empty="No enquiries yet. Website form submissions appear here.">
          {enquiries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
              <Link href={`/admin/enquiries/${e.id}`} className="min-w-0 hover:underline">
                <span className={`block truncate ${e.read_at ? "" : "font-semibold"}`}>{e.name}</span>
                <span className="block text-[12px] text-[#667085]">
                  {FORM_LABEL[e.form as keyof typeof FORM_LABEL] ?? e.form}
                  {e.grade ? ` · ${e.grade}` : ""} · {fmtDate(e.created_at)}
                </span>
              </Link>
              <Badge tone={statusTone(e.status)}>{STATUS_LABEL[e.status as keyof typeof STATUS_LABEL] ?? e.status}</Badge>
            </li>
          ))}
        </Panel>

        <Panel title="Upcoming events" href="/admin/events" linkLabel="All events" empty="No upcoming events. Add one so it shows on the website.">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
              <span className="min-w-0">
                <span className="block truncate font-medium">{ev.title}</span>
                {ev.venue && <span className="block text-[12px] text-[#667085]">{ev.venue}</span>}
              </span>
              <span className="shrink-0 text-[12px] text-[#667085]">{fmtDate(ev.starts_at)}</span>
            </li>
          ))}
        </Panel>

        <Panel title="Latest news" href="/admin/news" linkLabel="All posts" empty="No posts yet.">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
              <Link href={`/admin/news/${p.id}`} className="min-w-0 hover:underline">
                <span className="block truncate font-medium">{p.title || "Untitled"}</span>
                <span className="block text-[12px] text-[#667085]">{p.author ?? "—"} · updated {fmtDate(p.updated_at)}</span>
              </Link>
              <Badge tone={postTone(p.status)}>{p.status}</Badge>
            </li>
          ))}
        </Panel>

        <Panel title="Recently edited pages" href="/admin/pages" linkLabel="All pages" empty="No page edits yet. Use Pages to change the website's text and photos.">
          {pages.map((pg) => (
            <li key={pg.key} className="flex items-center justify-between gap-3 px-5 py-3 text-[14px]">
              <Link href={`/admin/pages/${pg.key}`} className="min-w-0 hover:underline">
                <span className="block truncate font-medium">{pageByKey(pg.key)?.title ?? pg.key}</span>
                <span className="block text-[12px] text-[#667085]">{pg.by_name ?? "Someone"} · {fmtDate(pg.at)}</span>
              </Link>
              {pg.draft ? <Badge tone="amber">Unpublished changes</Badge> : <Badge tone="green">Published</Badge>}
            </li>
          ))}
        </Panel>
      </div>
    </>
  );
}

function Heading({ greeting, name }: { greeting: string; name: string }) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold">
          {greeting}, {name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-[14px] text-[#667085]">Here is what is happening on the American Lycetuff website.</p>
      </div>
      <a href="/" target="_blank" rel="noreferrer" className="text-[13px] text-[#1a2d59] hover:underline">View website ↗</a>
    </div>
  );
}
