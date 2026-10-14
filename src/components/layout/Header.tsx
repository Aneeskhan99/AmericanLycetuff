"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { BarNotice } from "@/lib/public/notices";
import type { Settings } from "@/lib/settings";
import { enquireLink, mainNav } from "./nav-links";

const DEFAULT_LOGO = "/images/shared/logo-crest.png";
const DEFAULT_WORDMARK = "/images/shared/wordmark-swabi.svg";
type Branding = Settings["branding"];

function Logos({ mobile = false, branding }: { mobile?: boolean; branding: Branding }) {
  const customLogo = branding.logo !== DEFAULT_LOGO;
  const customWordmark = branding.wordmark !== DEFAULT_WORDMARK;
  // Figma Nav Menu 144:11222: crest 62x78, 19px gap, "American Lycetuff / Swabi Stem School" 230x42.
  // Mobile Header 158:1716: crest 34x43, 10px gap, wordmark 148x27.
  return (
    <Link
      href="/"
      aria-label={`${branding.wordmarkAlt || "American Lycetuff"}: home`}
      data-als-site="branding"
      className={mobile ? "flex shrink-0 items-center gap-[10px]" : "flex shrink-0 items-center gap-[clamp(12px,0.99vw,19px)]"}
    >
      <span className={mobile ? "relative h-[43px] w-[34px] shrink-0 overflow-hidden" : "relative h-[clamp(64px,4.06vw,78px)] w-[clamp(51px,3.23vw,62px)] shrink-0 overflow-hidden"}>
        {customLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logo} alt="" className="absolute inset-0 size-full object-contain" />
        ) : (
          <Image
            src={DEFAULT_LOGO}
            alt=""
            width={2400}
            height={2400}
            preload
            sizes="100px"
            className="absolute left-[-12.9%] top-0 h-full w-[125.81%] max-w-none"
          />
        )}
      </span>
      {customWordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.wordmark}
          alt=""
          className={mobile ? "h-[27px] w-auto max-w-[180px] shrink-0 object-contain" : "h-[clamp(34px,2.19vw,42px)] w-auto max-w-[300px] shrink-0 object-contain"}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mobile ? "/images/shared/wordmark-swabi-mobile.svg" : DEFAULT_WORDMARK}
          alt=""
          width={mobile ? 148 : 230}
          height={mobile ? 27 : 42.0168}
          // Desktop scales down between 1280 and 1920 px so the menu keeps one line.
          className={mobile ? "h-[27px] w-[148px] max-w-none shrink-0" : "h-auto w-[clamp(176px,11.98vw,230px)] max-w-none shrink-0"}
        />
      )}
    </Link>
  );
}

/** Today's date in Pakistan (YYYY-MM-DD), read in the browser so a static page never shows an expired notice. */
const todayPk = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
const noop = () => () => {};

type Announcement = { show: boolean; text: string; href: string };

export default function Header({ announcement, notices = [], branding }: { announcement: Announcement; notices?: BarNotice[]; branding: Branding }) {
  const today = useSyncExternalStore(noop, todayPk, () => "");
  // A pinned notice that is live today wins; otherwise the default announcement from Settings.
  const notice = today ? notices.find((n) => n.start <= today && (!n.end || n.end >= today)) : undefined;
  const bar = notice ? { text: notice.title, href: notice.href } : announcement.show && announcement.text ? announcement : null;
  const pathname = usePathname();
  const [barOpen, setBarOpen] = useState(true);
  // The menu remembers which page it was opened on, so it closes itself after navigation.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const setMenuOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(menuOpen) : next;
    setMenuOpenOn(value ? pathname : null);
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* Announcement bar */}
      {barOpen && bar && (
        <div className="relative bg-navy text-white" data-als-site="announcement">
          <div className="frame flex h-[40px] items-center justify-center nav:h-[42.5px]">
            <Link
              href={bar.href || "/"}
              className="flex items-center gap-[11px] px-[44px] text-center font-open-sans text-[13px] leading-[18px] nav:text-[14.11px]"
            >
              <span className="line-clamp-2">{bar.text}</span>
              <img src="/images/shared/chevron-right.svg" alt="" width={8} height={14} className="hidden h-[14.11px] w-[8.06px] nav:block" />
            </Link>
            <button
              type="button"
              onClick={() => setBarOpen(false)}
              aria-label="Dismiss announcement"
              className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[20px] leading-none nav:right-[16px] nav:text-[22px]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Desktop bar */}
      <div className="hidden border-b border-line nav:block">
        <div className="frame gutter flex h-[111px] items-center justify-between">
          <Logos branding={branding} />
          <nav aria-label="Main" className="flex items-center gap-[clamp(14px,1.3vw,25px)]">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-center justify-center gap-[10px] whitespace-nowrap font-inter text-[clamp(14px,0.892vw,17.134px)] uppercase leading-[20.157px] tracking-[0.11em] text-black"
                >
                  <span
                    className={`size-[5px] rounded-full bg-crimson transition-opacity ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={enquireLink.href}
              className="flex items-center justify-center whitespace-nowrap bg-navy px-[clamp(20px,1.56vw,30px)] py-[17px] font-inter text-[clamp(14px,0.892vw,17.134px)] uppercase leading-[20.157px] tracking-[0.11em] text-white transition-colors hover:bg-crimson"
            >
              {enquireLink.label}
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile bar */}
      <div className="border-b border-[#e6e6e6] nav:hidden">
        <div className="flex h-[75px] items-center justify-between pl-[24px] pr-[16px]">
          <Logos mobile branding={branding} />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="relative size-[48px]"
          >
            <span
              className={`absolute left-[11px] h-[2.5px] w-[26px] bg-navy transition-all ${
                menuOpen ? "top-[23px] rotate-45" : "top-[14px]"
              }`}
            />
            <span
              className={`absolute left-[11px] top-[23px] h-[2.5px] w-[26px] bg-navy transition-opacity ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-[11px] h-[2.5px] w-[26px] bg-navy transition-all ${
                menuOpen ? "top-[23px] -rotate-45" : "top-[32px]"
              }`}
            />
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="absolute inset-x-0 top-full h-[calc(100dvh-100%)] overflow-y-auto border-t border-[#e6e6e6] bg-white px-[24px] pb-[40px] pt-[8px]"
          >
            <ul>
              {[{ label: "Home", href: "/" }, ...mainNav, { label: "Contact us", href: "/contact" }].map((item) => {
                const active = item.href === "/" ? pathname === "/" : isActive(item.href);
                return (
                  <li key={item.href} className="border-b border-[#e6e6e6]">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-[10px] py-[18px] font-inter text-[15px] uppercase tracking-[1.6px] ${
                        active ? "text-crimson" : "text-black"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href={enquireLink.href}
              className="mt-[28px] flex w-full items-center justify-center bg-navy px-[20px] py-[17px] font-inter text-[14px] font-medium uppercase tracking-[1px] text-white"
            >
              {enquireLink.label}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
