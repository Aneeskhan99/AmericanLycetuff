"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, useSyncExternalStore } from "react";
import type { HomeContent } from "@/content/home";
import StriveMark from "./StriveMark";
import { CmsLink, unoptimized } from "./ui";

type Content = HomeContent["hero"];

/** Desktop crop of each bundled photo inside the slide box (from Figma). Any other photo simply covers the slide. */
const CROPS: Record<string, CSSProperties> = {
  "/images/home/hero-campus-assembly.jpg": { left: "-0.27%", top: "-9.55%", width: "100.46%", height: "138.2%" },
  "/images/home/hero-fbise.jpg": { left: "-1.34%", top: "-14.09%", width: "102.68%", height: "156.1%" },
  "/images/home/hero-cambridge.jpg": { left: "-1.34%", top: "-28.05%", width: "102.68%", height: "156.1%" },
};
const COVER: CSSProperties = { left: "0%", top: "0%", width: "100%", height: "100%" };

const INTERVAL = 6000;

/** True on desktop widths, so the background video is only downloaded where it is shown. */
const DESKTOP_QUERY = "(min-width: 1024px)";
function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useIsDesktop = () =>
  useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches, () => false);

/** Poster for the video: the first slide's photo, optimised like the slide itself. */
const posterOf = (src: string) =>
  src ? getImageProps({ src, alt: "", width: 1920, height: 1287, quality: 75, unoptimized: unoptimized(src) }).props.src : undefined;

/** Signed position of slide i relative to the active slide, wrapped to -1 | 0 | 1. */
function offsetOf(i: number, active: number, n: number) {
  // Two slides: the other one always peeks on the side it will slide in from.
  if (n === 2) return i === active ? 0 : i > active ? 1 : -1;
  let o = (i - active + n) % n;
  if (o > n / 2) o -= n;
  return o;
}

export default function HeroCarousel({ content: c }: { content: Content }) {
  const slides = c.slides;
  const n = slides.length;
  const videoSrc = c.video.trim();
  const posterSrc = posterOf(slides[0]?.photo.src ?? "");
  const [pos, setPos] = useState({ active: 0, prev: 0 });
  // If the slide count shrinks (admin edit) never point past the end.
  const active = n ? Math.min(pos.active, n - 1) : 0;
  const prev = n ? Math.min(pos.prev, n - 1) : 0;
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const showBgVideo = useIsDesktop();
  const [videoOpen, setVideoOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fromScroll = useRef(false);

  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

  const goTo = useCallback(
    (i: number) => setPos((p) => ({ active: ((i % n) + n) % n, prev: Math.min(p.active, n - 1) })),
    [n],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (paused || reduced || videoOpen || n < 2) return;
    const t = window.setTimeout(() => goTo(active + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [active, paused, reduced, videoOpen, goTo, n]);

  // Mobile: keep the swipe track in sync when the active slide changes from the timer / dots.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || isDesktop()) return;
    if (fromScroll.current) {
      fromScroll.current = false;
      return;
    }
    const slide = track.children[active] as HTMLElement | undefined;
    if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft - 24, behavior: reduced ? "auto" : "smooth" });
  }, [active, reduced]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || isDesktop()) return;
    const first = track.children[0] as HTMLElement | undefined;
    if (!first) return;
    const step = first.offsetWidth + 12;
    const i = Math.round(track.scrollLeft / step);
    if (i !== active && i >= 0 && i < n) {
      fromScroll.current = true;
      goTo(i);
    }
  };

  const offsets = slides.map((_, i) => offsetOf(i, active, n));
  // A slide that wraps from one side to the other jumps instead of sliding across the stage.
  const jumps = offsets.map((o, i) => Math.abs(o - offsetOf(i, prev, n)) > 1);

  const openVideo = () => {
    setVideoOpen(true);
    dialogRef.current?.showModal();
    const v = dialogRef.current?.querySelector("video");
    v?.play().catch(() => {});
  };
  const closeVideo = () => {
    const v = dialogRef.current?.querySelector("video");
    v?.pause();
    dialogRef.current?.close();
  };

  if (!n) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative bg-white pb-[8px] pt-[24px] lg:mt-[39px] lg:p-0 [--g:clamp(24px,2.6vw,50px)] [--h:clamp(560px,40.94vw,786px)] [--w:min(84vw,1612.6px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(active + 1);
        if (e.key === "ArrowLeft") goTo(active - 1);
      }}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-[12px] overflow-x-auto scroll-px-[24px] px-[24px] lg:relative lg:block lg:h-[var(--h)] lg:snap-none lg:overflow-hidden lg:px-0"
      >
        {slides.map((s, i) => {
          const o = offsets[i];
          const isActive = o === 0;
          const HeadingTag = i === 0 ? "h1" : "h2";
          const hasVideo = i === 0 && !!videoSrc;
          const photo = s.photo.src;
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              onFocus={() => {
                if (!isActive && isDesktop()) goTo(i);
              }}
              style={{ "--o": o, "--sh": isActive ? "var(--h)" : "calc(var(--h) * 0.9)" } as CSSProperties}
              className={`relative h-[560px] w-[calc(100vw-48px)] shrink-0 snap-start overflow-hidden bg-navy-ink lg:absolute lg:left-1/2 lg:top-1/2 lg:h-[var(--sh)] lg:w-[var(--w)] lg:[transform:translate(calc(-50%+var(--o)*(var(--w)+var(--g))),-50%)] ${
                jumps[i] || active === prev ? "lg:transition-none" : "lg:transition-[transform,height] lg:duration-700 lg:ease-[cubic-bezier(.45,.05,.25,1)]"
              } ${isActive ? "lg:z-10" : "lg:z-0"}`}
            >
              {photo && (
                <>
                  {/* Mobile photo (plain cover) */}
                  <Image
                    src={photo}
                    alt={s.photo.alt}
                    unoptimized={unoptimized(photo)}
                    fill
                    sizes="(min-width: 1024px) 1px, 100vw"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className="object-cover lg:hidden"
                  />
                  {/* Desktop photo with the Figma crop */}
                  <div className="absolute inset-0 hidden lg:block">
                    <Image
                      src={photo}
                      alt={s.photo.alt}
                      unoptimized={unoptimized(photo)}
                      width={1920}
                      height={1287}
                      sizes="(min-width: 1024px) 84vw, 1px"
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      className="absolute max-w-none object-cover"
                      style={CROPS[photo] ?? COVER}
                    />
                  </div>
                </>
              )}
              {hasVideo && showBgVideo && (
                <video
                  className={`absolute inset-0 hidden size-full object-cover transition-opacity duration-700 lg:block ${
                    videoReady ? "opacity-100" : "opacity-0"
                  }`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={posterSrc}
                  aria-hidden
                  onPlaying={() => setVideoReady(true)}
                >
                  <source src={videoSrc} type="video/mp4" />
                </video>
              )}
              {/* Overlays: navy on mobile, black fade on desktop */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[rgba(8,30,63,0.35)] via-[rgba(8,30,63,0.55)] via-45% to-[rgba(8,30,63,0.94)] lg:hidden" />
              <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-b from-transparent from-12% via-[rgba(0,0,0,0.82)] via-75% to-black to-94% lg:block" />

              <div
                className={`relative z-10 flex h-full flex-col items-center justify-end px-[24px] pb-[44px] pt-[32px] text-center text-white transition-opacity duration-500 lg:mx-auto lg:w-[72.9%] lg:-translate-y-[5%] lg:justify-center lg:px-0 lg:pb-0 lg:pt-0 ${
                  isActive ? "" : "lg:pointer-events-none lg:opacity-0"
                }`}
              >
                <StriveMark id={`strive-${i}`} className="mb-[30px] hidden w-[clamp(300px,25.2vw,483.78px)] lg:block" />
                <HeadingTag className="w-full font-inter text-[34px] font-bold leading-[38px] tracking-[-0.4px] lg:text-[clamp(44px,3.646vw,70px)] lg:capitalize lg:leading-[1.2958] lg:tracking-normal">
                  {s.title}
                </HeadingTag>
                {s.text && (
                  <p className="mt-[14px] font-inter text-[16px] leading-[25px] tracking-[0.2px] opacity-92 lg:mt-[20px] lg:max-w-[952px] lg:text-[clamp(14px,0.877vw,16.831px)] lg:uppercase lg:leading-[26.205px] lg:tracking-[1.6126px] lg:opacity-100">
                    {s.text}
                  </p>
                )}
                {((s.button.label && s.button.href) || hasVideo) && (
                  <div className="mt-[28px] flex w-full items-center justify-center gap-[30px] lg:mt-[30px] lg:w-auto">
                    {s.button.label && s.button.href && (
                      <CmsLink
                        href={s.button.href}
                        tabIndex={isActive ? 0 : -1}
                        className="flex h-[56px] w-full items-center justify-center whitespace-nowrap bg-white px-[12px] font-inter text-[15.5px] font-medium uppercase leading-[20.157px] tracking-[1.5px] text-crimson transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:h-auto lg:w-auto lg:px-[30px] lg:py-[17px] lg:text-[17.134px] lg:tracking-[1.8898px]"
                      >
                        {s.button.label}
                      </CmsLink>
                    )}
                    {hasVideo && (
                      <button
                        type="button"
                        onClick={openVideo}
                        tabIndex={isActive ? 0 : -1}
                        aria-label="Play the campus video"
                        className="hidden size-[77px] shrink-0 cursor-pointer rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/home/play-button.svg" alt="" width={77} height={77} className="size-[77px]" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Side peeks (desktop) are clickable */}
              {!isActive && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="absolute inset-0 z-20 hidden cursor-pointer lg:block"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop numbered tabs */}
      {n > 1 && (
        <div
          role="tablist"
          aria-label="Select a slide to show"
          className="absolute z-20 hidden gap-[10.07px] lg:flex"
          style={{ left: "calc(50% - var(--w) / 2 + clamp(40px, 6.65vw, 127.6px))", bottom: "calc(122.4px + var(--h) * 0.0621)" }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`flex size-[40.315px] cursor-pointer items-center justify-center rounded-full border-[2.016px] font-inter text-[17.638px] leading-[17.638px] text-white transition-colors duration-300 hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                i === active ? "border-white" : "border-white/20"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Mobile indicators */}
      {n > 1 && (
        <div className="flex h-[32px] items-center justify-center gap-[8px] pb-[12px] pt-[20px] lg:hidden">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className="flex h-[24px] items-center justify-center px-[2px]"
            >
              <span
                className={`block h-[8px] rounded-[4px] transition-all duration-300 ${
                  i === active ? "w-[28px] bg-crimson" : "w-[8px] bg-[#d6d6d6]"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {videoSrc && (
        <dialog
          ref={dialogRef}
          onClose={() => setVideoOpen(false)}
          onClick={(e) => {
            if (e.target === dialogRef.current) closeVideo();
          }}
          className="m-auto w-[min(92vw,1280px)] bg-transparent p-0 backdrop:bg-black/80"
          aria-label="Campus video"
        >
          <div className="relative">
            <button
              type="button"
              onClick={closeVideo}
              aria-label="Close video"
              className="absolute -top-[44px] right-0 cursor-pointer font-inter text-[32px] leading-none text-white"
            >
              ×
            </button>
            <video className="aspect-video w-full bg-black" controls playsInline preload="none" poster={posterSrc}>
              <source src={videoSrc} type="video/mp4" />
            </video>
          </div>
        </dialog>
      )}
    </section>
  );
}
