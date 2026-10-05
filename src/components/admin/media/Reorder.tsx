"use client";

import { useState, type ReactNode } from "react";
import { Button } from "../ui";

export type ReorderItem = { id: number; title: string; sub?: string; thumb?: ReactNode };

/** Moves an item in an array (immutable). */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const out = list.slice();
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

/** A list you can reorder by dragging the handle, or with the up / down buttons (keyboard and touch). */
export function ReorderList({ items, onChange }: { items: ReorderItem[]; onChange: (items: ReorderItem[]) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <ol className="flex flex-col gap-1.5" aria-label="Order">
      {items.map((it, i) => (
        <li
          key={it.id}
          draggable
          onDragStart={(e) => {
            setDrag(i);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (drag === null) return;
            e.preventDefault();
            if (drag !== i) {
              onChange(move(items, drag, i));
              setDrag(i);
            }
          }}
          onDragEnd={() => setDrag(null)}
          data-reorder-id={it.id}
          className={`flex items-center gap-3 rounded-lg border bg-white px-2 py-2 ${drag === i ? "border-[#1a2d59] opacity-70" : "border-[#eaecf0]"}`}
        >
          <span className="cursor-grab px-1 text-[#98a2b3] active:cursor-grabbing" aria-hidden title="Drag to move">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
          </span>
          <span className="w-6 text-right text-[12px] tabular-nums text-[#98a2b3]">{i + 1}</span>
          {it.thumb}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-[#101828]">{it.title}</span>
            {it.sub && <span className="block truncate text-[12px] text-[#667085]">{it.sub}</span>}
          </span>
          <span className="flex shrink-0 gap-1">
            <Button type="button" tone="ghost" size="sm" disabled={i === 0} onClick={() => onChange(move(items, i, i - 1))} aria-label={`Move ${it.title} up`}>↑</Button>
            <Button type="button" tone="ghost" size="sm" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, i + 1))} aria-label={`Move ${it.title} down`}>↓</Button>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Small square thumbnail (or initials) for lists. */
export function Thumb({ src, label, round }: { src?: string | null; label: string; round?: boolean }) {
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center overflow-hidden bg-[#f2f4f7] text-[12px] font-semibold text-[#667085] ${round ? "rounded-full" : "rounded-md"}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}
