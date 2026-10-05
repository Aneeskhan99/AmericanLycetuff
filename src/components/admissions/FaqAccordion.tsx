"use client";

import { useId, useState } from "react";

export type FaqItem = { q: string; a: string };

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <ul className="flex flex-col gap-3 lg:gap-0 lg:border-t lg:border-solid lg:border-[#d6d6d6]">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <li
            key={i}
            className="bg-[#f8f8f8] px-5 py-[18px] lg:border-b lg:border-solid lg:border-[#d6d6d6] lg:bg-transparent lg:px-0 lg:py-0"
          >
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className={`group flex w-full items-center gap-4 text-left transition-[padding] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson lg:pt-6 ${
                  isOpen ? "lg:pb-[9px]" : "lg:pb-[25px]"
                }`}
              >
                <span className="min-w-0 flex-1 text-[20px] leading-[31px] text-navy lg:max-w-[720px] lg:text-[24px] lg:leading-[34px]">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={`ml-auto flex size-11 shrink-0 items-center justify-center rounded-[22px] border-[1.5px] border-solid pb-[3px] text-[26px] font-light leading-none transition-colors duration-200 ${
                    isOpen ? "border-crimson bg-crimson text-white" : "border-[#d6d6d6] text-crimson group-hover:border-crimson"
                  }`}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="pt-[10px] text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:max-w-[720px] lg:pb-[34px] lg:pt-0 lg:leading-[30px]">
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
