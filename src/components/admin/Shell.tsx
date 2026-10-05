"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ROLE_LABEL, useAdmin, type Role } from "./AdminProvider";

type Item = { label: string; href: string; icon: string; roles?: Role[]; soon?: boolean };
type Group = { heading?: string; items: Item[] };

const ALL: Role[] = ["administrator", "editor", "author"];
const STAFF: Role[] = ["administrator", "editor"];

/**
 * The sidebar. `soon` items are shown greyed out so the team can see what is
 * coming; they become links as each stage ships.
 */
export const NAV: Group[] = [
  { items: [{ label: "Dashboard", href: "/admin", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10", roles: ALL }] },
  {
    items: [{ label: "Enquiries", href: "/admin/enquiries", icon: "M4 4h16v12H5.2L4 17.2V4zM8 9h8M8 12h5", roles: STAFF }],
  },
  {
    heading: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: "M6 2h9l5 5v15H6zM14 2v6h6", roles: STAFF },
      { label: "News & Blog", href: "/admin/news", icon: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5", roles: ALL },
      { label: "Events", href: "/admin/events", icon: "M4 6h16v14H4zM4 10h16M9 3v5M15 3v5", roles: STAFF },
      { label: "Academic calendar", href: "/admin/calendar", icon: "M4 6h16v14H4zM4 10h16M8 14h2M12 14h2M16 14h2", roles: STAFF },
      { label: "Notices", href: "/admin/notices", icon: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0", roles: STAFF },
    ],
  },
  {
    heading: "School",
    items: [
      { label: "Faculty & staff", href: "/admin/faculty", icon: "M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", roles: STAFF },
      { label: "Gallery", href: "/admin/gallery", icon: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9h.01", roles: STAFF },
      { label: "Downloads", href: "/admin/downloads", icon: "M12 3v12M7 10l5 5 5-5M4 19h16", roles: STAFF },
      { label: "Media library", href: "/admin/media", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", roles: ALL },
    ],
  },
  {
    heading: "Marketing",
    items: [
      { label: "Subscribers", href: "/admin/subscribers", icon: "M4 6h16v12H4zM4 7l8 6 8-6", roles: STAFF },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Users", href: "/admin/users", icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8", roles: ["administrator"] },
      { label: "Settings", href: "/admin/settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z", roles: ["administrator"] },
    ],
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { user, api } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // A temporary password must be replaced before anything else.
  useEffect(() => {
    if (user.must_change_password && pathname !== "/admin/account") router.replace("/admin/account");
  }, [user.must_change_password, pathname, router]);

  const signOut = async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } catch {
      /* fall through to the login screen either way */
    }
    window.location.href = "/admin/login";
  };

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV.map((g, gi) => {
        const items = g.items.filter((i) => !i.roles || i.roles.includes(user.role));
        if (!items.length) return null;
        return (
          <div key={gi}>
            {g.heading && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">{g.heading}</p>}
            <ul className="flex flex-col gap-0.5">
              {items.map((i) => (
                <li key={i.href}>
                  {i.soon ? (
                    <span className="flex items-center gap-3 rounded-md px-3 py-2 text-[14px] text-white/35" title="Coming in a later stage">
                      <Icon d={i.icon} />
                      <span className="flex-1">{i.label}</span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
                    </span>
                  ) : (
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      aria-current={active(i.href) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors ${
                        active(i.href) ? "bg-white/12 font-medium text-white" : "text-white/80 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon d={i.icon} />
                      {i.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 p-3">
      <Link
        href="/admin/account"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/8 ${pathname === "/admin/account" ? "bg-white/12" : ""}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d31245] text-[13px] font-semibold text-white">
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] text-white">{user.name}</span>
          <span className="block text-[12px] text-white/55">{ROLE_LABEL[user.role]} · My account</span>
        </span>
      </Link>
      <button type="button" onClick={signOut} className="mt-1 w-full rounded-md px-3 py-2 text-left text-[14px] text-white/70 hover:bg-white/8 hover:text-white">
        Sign out
      </button>
    </div>
  );

  const brand = (
    <div className="flex items-center gap-3 px-5 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/shared/logo-crest.png" alt="" width={34} height={34} className="size-[34px] rounded bg-white object-contain p-0.5" />
      <div className="leading-tight">
        <p className="text-[14px] font-semibold text-white">American Lycetuff</p>
        <p className="text-[12px] text-white/55">Website admin</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-[#f5f6f8] font-inter text-[#101828]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col bg-[#1a2d59] lg:flex">
        {brand}
        {nav}
        {account}
      </aside>

      {/* Mobile drawer */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#1a2d59] transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!open}
      >
        {brand}
        {nav}
        {account}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#eaecf0] bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded p-2 hover:bg-[#f2f4f7]" aria-label="Open menu">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-[15px] font-semibold">American Lycetuff admin</span>
          <a href="/" target="_blank" rel="noreferrer" className="text-[13px] text-[#1a2d59] underline">Site</a>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
