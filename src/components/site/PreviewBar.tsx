import Link from "next/link";
import { draftMode } from "next/headers";
import EditBridge from "./EditBridge";

/**
 * A small floating bar shown on public pages ONLY while Preview (Next.js draft
 * mode) is on, i.e. for staff who clicked "Preview" in Admin → Pages.
 * Visitors never see it, and reading draftMode() keeps pages static.
 *
 * Exiting is a plain GET form (not a <Link>, which would be prefetched and
 * clear the cookie early). /api/preview/exit sends the browser back to the
 * page it came from (Referer).
 */
export default async function PreviewBar() {
  let enabled = false;
  try {
    enabled = (await draftMode()).isEnabled;
  } catch {
    enabled = false;
  }
  if (!enabled) return null;
  return (
    <>
    {/* Click-to-edit support; does nothing unless the page is inside the admin's visual editor. */}
    <EditBridge />
    <aside
      data-als-preview-bar
      role="status"
      aria-label="Preview mode"
      className="fixed inset-x-4 bottom-4 z-[1000] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-[#1a2d59] px-4 py-3 text-[14px] text-white shadow-2xl sm:inset-x-auto sm:left-4 sm:max-w-[560px]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <span className="flex items-center gap-2.5">
        <span className="inline-block size-2.5 shrink-0 rounded-full bg-[#f0d400]" aria-hidden />
        <span>
          <strong className="font-semibold">Preview mode</strong>
          <span className="text-white/80"> · you are seeing unpublished changes</span>
        </span>
      </span>
      <form action="/api/preview/exit" method="GET" className="flex items-center gap-2">
        <Link href="/admin/pages" prefetch={false} className="rounded-md px-2.5 py-1.5 text-[13px] text-white/85 underline-offset-2 hover:underline">
          Back to editor
        </Link>
        <button type="submit" className="rounded-md bg-[#d31245] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#b00f3a]">
          Exit preview
        </button>
      </form>
    </aside>
    </>
  );
}
