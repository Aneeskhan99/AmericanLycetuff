"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { useAdmin } from "../AdminProvider";

/** Tags as chips with type-ahead from existing tags; typing a new name and pressing Enter (or comma) creates it on save. */
export default function TagInput({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const { api } = useAdmin();
  const [text, setText] = useState("");
  const [hits, setHits] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const listId = useId();

  useEffect(() => {
    const term = text.trim();
    if (!term) return;
    const t = setTimeout(() => {
      api<{ rows: { name: string }[] }>(`/api/admin/tags?${new URLSearchParams({ search: term, pageSize: "8" })}`)
        .then((d) => {
          setHits(d.rows.map((r) => r.name));
          setActive(-1);
        })
        .catch(() => setHits([]));
    }, 200);
    return () => clearTimeout(t);
  }, [text, api]);

  const has = (n: string) => value.some((v) => v.toLowerCase() === n.toLowerCase());
  const add = (raw: string) => {
    const n = raw.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
    if (n && !has(n) && value.length < 20) onChange([...value, n]);
    setText("");
    setHits([]);
    setActive(-1);
  };
  const suggestions = text.trim() ? hits.filter((h) => !has(h)) : [];

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(active >= 0 && suggestions[active] ? suggestions[active] : text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setHits([]);
    }
  };

  return (
    <div className="relative">
      <div className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-[#d0d5dd] bg-white px-2 py-1.5 focus-within:border-[#1a2d59] focus-within:ring-2 focus-within:ring-[#1a2d59]/15 ${disabled ? "bg-[#f9fafb]" : ""}`}>
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#eff4ff] py-0.5 pl-2.5 pr-1 text-[13px] text-[#1a2d59]">
            {t}
            {!disabled && (
              <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="rounded-full p-0.5 hover:bg-[#d6e0f5]" aria-label={`Remove tag ${t}`}>
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => setTimeout(() => setHits([]), 150)}
            placeholder={value.length ? "" : "Add a tag…"}
            aria-label="Add a tag"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            className="h-7 min-w-[120px] flex-1 border-0 bg-transparent px-1 text-[14px] outline-none placeholder:text-[#98a2b3]"
          />
        )}
      </div>
      {suggestions.length > 0 && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-[#eaecf0] bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(s)}
                className={`block w-full px-3 py-1.5 text-left text-[14px] hover:bg-[#f2f4f7] ${i === active ? "bg-[#f2f4f7]" : ""}`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!disabled && <p className="mt-1.5 text-[12px] text-[#667085]">Press Enter or comma to add. New tags are created when you save.</p>}
    </div>
  );
}
