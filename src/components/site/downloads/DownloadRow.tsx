import type { DownloadItem } from "@/lib/public/downloads";

const sizeOf = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
const TYPE: Record<string, string> = { pdf: "PDF", doc: "Word", docx: "Word", xls: "Excel", xlsx: "Excel", ppt: "PowerPoint", pptx: "PowerPoint" };
export const extOf = (url: string) => (url.split("?")[0].split(".").pop() ?? "").toLowerCase();

/** "Fee structure 2026-27.pdf" from the title + the file's extension. */
const downloadName = (title: string, ext: string) =>
  `${title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "document"}.${ext}`;

export default function DownloadRow({ item, button }: { item: DownloadItem; button: string }) {
  const ext = extOf(item.file.url);
  const type = TYPE[ext] ?? ext.toUpperCase();
  return (
    <li className="flex flex-col gap-[16px] border-b border-[#d6d6d6] py-[20px] last:border-b-0 sm:flex-row sm:items-center sm:gap-[24px] lg:py-[24px]">
      <div className="flex min-w-0 flex-1 items-center gap-[16px] lg:gap-[24px]">
        <span
          aria-hidden
          className="flex size-[52px] shrink-0 items-center justify-center bg-navy text-[12px] font-semibold uppercase tracking-[1px] text-white lg:size-[60px] lg:text-[13px]"
        >
          {ext.slice(0, 4)}
        </span>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold leading-[24px] text-black lg:text-[20px] lg:leading-[28px]">{item.title}</p>
          <p className="mt-[4px] text-[14px] leading-[20px] text-[#5c5c5c] lg:text-[15px]">
            {type} · {sizeOf(item.file.size)}
          </p>
        </div>
      </div>
      <a
        href={item.file.url}
        download={downloadName(item.title, ext)}
        aria-label={`${button}: ${item.title} (${type}, ${sizeOf(item.file.size)})`}
        className="inline-flex w-full shrink-0 items-center justify-center gap-[10px] bg-crimson px-[26px] py-[14px] text-[15px] font-medium uppercase leading-normal tracking-[1.9px] text-white transition-colors hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M7 10l5 5 5-5M4 19h16" />
        </svg>
        {button}
      </a>
    </li>
  );
}
