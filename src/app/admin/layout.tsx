import type { Metadata } from "next";

/** Admin area: never indexed, never cached, never in the sitemap. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · American Lycetuff" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#f5f6f8]">{children}</div>;
}
