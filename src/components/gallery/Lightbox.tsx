"use client";

import { useCallback, useEffect, useRef } from "react";
import GalleryImage from "./GalleryImage";
import { labelFor, type GalleryPhoto } from "./photos";

type Props = {
  items: GalleryPhoto[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Label shown above the caption; defaults to the photo's first category. */
  categoryLabel?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Full-screen photo viewer built on the native <dialog> (modal: traps focus,
 * Esc closes, background is inert). Arrow keys / buttons / swipe move between
 * photos; focus returns to the photo that opened it.
 */
export default function Lightbox({ items, index, onIndexChange, onClose, categoryLabel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isOpen = index !== null;
  const count = items.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const go = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return;
      onIndexChange((index + delta + count) % count);
    },
    [index, count, onIndexChange],
  );

  const handleClosed = () => {
    document.documentElement.style.overflow = "";
    onClose();
    returnFocusRef.current?.focus({ preventScroll: true });
  };

  const photo = index !== null ? items[index] : null;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Photo viewer"
      onClose={handleClosed}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
      onClick={(e) => {
        // Clicking the backdrop area (the dialog itself, not its content) closes it.
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        const dx = end - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-navy-ink p-0 text-white backdrop:bg-transparent open:flex open:flex-col"
    >
      {photo && (
        <>
          <div className="flex shrink-0 items-center justify-between px-[24px] pt-[20px] lg:px-[40px] lg:pt-[28px]">
            <p className="text-[13px] font-semibold tracking-[2px] text-[#fd0]" aria-live="polite">
              {pad(index! + 1)} <span className="text-white/60">/ {pad(count)}</span>
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              autoFocus
              aria-label="Close photo viewer"
              className="flex size-[44px] items-center justify-center rounded-full border-[1.5px] border-white/50 text-[24px] leading-none text-white transition-colors hover:border-white hover:bg-white hover:text-navy-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0]"
            >
              <span aria-hidden>×</span>
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-[24px] py-[16px] lg:px-[120px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) dialogRef.current?.close();
            }}
          >
            <GalleryImage
              key={photo.id}
              src={photo.src}
              srcSet={photo.srcSet}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 80vw, 100vw"
              className="h-auto max-h-full w-auto max-w-full object-contain"
            />

            {count > 1 && (
              <>
                <ArrowButton direction="prev" onClick={() => go(-1)} />
                <ArrowButton direction="next" onClick={() => go(1)} />
              </>
            )}
          </div>

          <div className="shrink-0 px-[24px] pb-[24px] pt-[4px] text-center lg:px-[40px] lg:pb-[32px]">
            <p className="text-[13px] font-semibold uppercase tracking-[2px] text-[#fd0]">
              {categoryLabel ?? photo.label ?? labelFor(photo.categories[0])}
            </p>
            <p className="mx-auto mt-[8px] max-w-[720px] text-[15px] leading-[23px] text-white/85">{photo.caption || photo.alt}</p>
          </div>
        </>
      )}
    </dialog>
  );
}

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const prev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={prev ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex size-[44px] -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white/50 bg-navy-ink/60 text-[20px] leading-none text-white transition-colors hover:border-white hover:bg-white hover:text-navy-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] ${
        prev ? "left-[8px] lg:left-[40px]" : "right-[8px] lg:right-[40px]"
      }`}
    >
      <span aria-hidden>{prev ? "←" : "→"}</span>
    </button>
  );
}
