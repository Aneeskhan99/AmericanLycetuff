import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { CmsLink, unoptimized } from "@/components/home/ui";
import type { ImageValue, LinkValue, PageContent } from "@/lib/content";
import type { competitionsPage } from "@/content/competitions";

type C = PageContent<typeof competitionsPage>;

/* Figma "Competition — Desktop/Web" 518:3116 (1920 frame, 211px side padding → 1498px content)
   and "Competition — Mobile" 518:3229 (390 frame, 24px side padding). */
const wrap = "frame px-[24px] lg:px-[clamp(40px,10.99vw,211px)]";
const eyebrowCls = "font-inter text-[12px] font-semibold uppercase leading-normal tracking-[1.8px] lg:text-[13px] lg:tracking-[2px]";
const h2 = "font-inter text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-navy-ink lg:text-[clamp(34px,2.19vw,42px)]";
const titleCls = "font-inter text-[19px] font-medium leading-[1.3] tracking-[-0.01em] text-navy-ink lg:text-[clamp(21px,1.25vw,24px)] lg:leading-[1.25] lg:tracking-[-0.015em]";
const bodyL = "font-inter text-[16px] leading-[1.6] text-[#5c5c5c] lg:text-[17px]";
const bodyM = "font-inter text-[15px] leading-[1.6] text-[#5c5c5c] lg:text-[16px]";

/** "Button / Filled Crimson", "Button / Outline Navy", "Button / Outline White": sentence case, Inter Medium 17 (16 on phones). */
const btnBase =
  "inline-flex w-full items-center justify-center whitespace-nowrap px-[24px] py-[17px] font-inter text-[16px] font-medium leading-normal transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson sm:w-auto lg:px-[30px] lg:text-[17px]";
const btnStyles = {
  crimson: `${btnBase} bg-crimson text-white hover:bg-navy-ink`,
  navy: `${btnBase} border border-navy-ink text-navy-ink hover:bg-navy-ink hover:text-white`,
  white: `${btnBase} border border-white text-white hover:bg-white hover:text-navy-ink`,
};

function Button({ link, tone }: { link: LinkValue; tone: keyof typeof btnStyles }) {
  if (!link.label || !link.href) return null;
  return (
    <CmsLink href={link.href} className={btnStyles[tone]}>
      {link.label}
    </CmsLink>
  );
}

function Eyebrow({ children, className = "text-crimson" }: { children: ReactNode; className?: string }) {
  return children ? <p className={`${eyebrowCls} ${className}`}>{children}</p> : null;
}

/** Figma crops (Event Card 518:3557: image 511 × 339 at -14, -9.52 inside 483 × 320) for bundled photos; uploads simply cover the box. */
const CROPS: Record<string, CSSProperties> = {
  "/images/competitions/card-junior-awards.jpg": { left: "-2.9%", top: "-2.98%", width: "105.8%", height: "105.94%" },
};

function Photo({ image, sizes, className, priority = false }: { image: ImageValue; sizes: string; className: string; priority?: boolean }) {
  const crop = CROPS[image.src];
  return (
    <div className={`relative overflow-hidden bg-[#e1e3e7] ${className}`}>
      {image.src &&
        (crop ? (
          <span className="absolute" style={crop}>
            <Image src={image.src} alt={image.alt} fill sizes={sizes} preload={priority} className="object-cover" />
          </span>
        ) : (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            preload={priority}
            unoptimized={unoptimized(image.src)}
            className="object-cover"
          />
        ))}
    </div>
  );
}

export function Hero({ content: c }: { content: C["hero"] }) {
  return (
    <section aria-labelledby="competitions-title" className="bg-white">
      <div className={`${wrap} flex flex-col gap-[20px] pb-[64px] pt-[40px] xl:flex-row xl:items-center xl:gap-[clamp(48px,5vw,96px)] xl:py-[120px]`}>
        <div className="flex flex-col gap-[20px] xl:w-[46.73%] xl:shrink-0 xl:gap-[28px]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h1
            id="competitions-title"
            className="max-w-[700px] font-inter text-[38px] font-medium leading-[1.06] tracking-[-0.02em] text-navy-ink lg:text-[clamp(48px,3.44vw,66px)]"
          >
            {c.heading}
          </h1>
          {c.intro && <p className={`${bodyL} max-w-[560px]`}>{c.intro}</p>}
          {(c.button.label || c.button2.label) && (
            <div className="flex flex-col gap-[12px] sm:flex-row sm:flex-wrap lg:gap-[16px]">
              <Button link={c.button} tone="crimson" />
              <Button link={c.button2} tone="navy" />
            </div>
          )}
        </div>
        <Photo
          image={c.photo}
          priority
          sizes="(min-width: 1280px) 37vw, 100vw"
          className="mt-[12px] aspect-[342/422] w-full sm:aspect-[702/560] xl:mt-0 xl:min-w-0 xl:flex-1"
        />
      </div>
    </section>
  );
}

export function Categories({ content: c }: { content: C["categories"] }) {
  return (
    <section aria-labelledby="competitions-categories" className="bg-[#f3f4f6]">
      <div className={`${wrap} py-[64px] lg:py-[120px]`}>
        <div className="flex flex-col gap-[28px] lg:flex-row lg:items-end lg:justify-between lg:gap-[48px]">
          <div className="flex flex-col gap-[28px] lg:gap-[16px]">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2 id="competitions-categories" className={`${h2} max-w-[720px]`}>
              {c.heading}
            </h2>
          </div>
          {c.intro && <p className={`${bodyL} lg:max-w-[440px] lg:shrink-0`}>{c.intro}</p>}
        </div>
        {c.cards.length > 0 && (
          <ul className="mt-[28px] grid gap-[12px] sm:grid-cols-2 lg:mt-[56px] lg:gap-[24px] xl:grid-cols-4">
            {c.cards.map((card, i) => (
              <li key={i} className="flex flex-col gap-[14px] bg-white px-[24px] py-[28px] lg:gap-[20px] lg:px-[clamp(24px,1.67vw,32px)] lg:py-[40px]">
                <h3 className={titleCls}>{card.title}</h3>
                <p className={bodyM}>{card.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function Featured({ content: c }: { content: C["featured"] }) {
  const thumbs = [c.thumb1, c.thumb2].filter((t) => t.src);
  return (
    <section aria-labelledby="competitions-featured" className="bg-white">
      <div className={`${wrap} flex flex-col gap-[20px] py-[64px] xl:flex-row xl:items-center xl:gap-[clamp(48px,4.17vw,80px)] xl:py-[120px]`}>
        <Photo image={c.photo} sizes="(min-width: 1280px) 43vw, 100vw" className="aspect-[342/256] w-full xl:aspect-[820/640] xl:w-[54.74%] xl:shrink-0" />
        <div className="flex min-w-0 flex-col gap-[20px] xl:flex-1 xl:gap-[24px]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2 id="competitions-featured" className={h2}>
            {c.heading}
          </h2>
          {c.text && <p className={bodyL}>{c.text}</p>}
          {c.details.length > 0 && (
            <dl className="flex flex-col">
              {c.details.map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-[4px] border-t border-[#e1e3e7] py-[14px] sm:flex-row sm:items-start sm:justify-between sm:gap-[24px] lg:py-[18px]"
                >
                  <dt className="font-inter text-[14px] leading-[1.55] text-[#5c5c5c] sm:text-[16px] sm:leading-[1.6]">{d.label}</dt>
                  <dd className="font-inter text-[16px] font-medium leading-normal text-[#111] sm:text-right">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {thumbs.length > 0 && (
            <div className="grid grid-cols-2 gap-[12px] lg:gap-[20px]">
              {thumbs.map((t, i) => (
                <Photo key={i} image={t} sizes="(min-width: 1280px) 16vw, 50vw" className="aspect-[165/120] w-full lg:aspect-[289/190]" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Recent({ content: c }: { content: C["recent"] }) {
  const button = c.button.label && c.button.href ? c.button : null;
  return (
    <section id="recent-competitions" aria-labelledby="competitions-recent" className="scroll-mt-[120px] bg-navy-ink">
      <div className={`${wrap} flex flex-col gap-[24px] py-[64px] lg:gap-[56px] lg:py-[120px]`}>
        <div className="flex flex-col gap-[24px] lg:flex-row lg:items-end lg:justify-between lg:gap-[48px]">
          <div className="flex flex-col gap-[24px] lg:gap-[16px]">
            <Eyebrow className="text-[#fd0]">{c.eyebrow}</Eyebrow>
            <h2 id="competitions-recent" className={`${h2} max-w-[760px] text-white`}>
              {c.heading}
            </h2>
          </div>
          {button && (
            <div className="hidden shrink-0 lg:block">
              <Button link={button} tone="white" />
            </div>
          )}
        </div>
        {c.cards.length > 0 && (
          <ul className="grid gap-[24px] md:grid-cols-2 xl:grid-cols-3">
            {c.cards.map((card, i) => (
              <li key={i} className="flex flex-col bg-white">
                <Photo
                  image={card.photo}
                  sizes="(min-width: 1280px) 26vw, (min-width: 768px) 50vw, 100vw"
                  className="aspect-[342/228] w-full lg:aspect-[483/320]"
                />
                <div className="flex flex-col gap-[10px] px-[20px] pb-[24px] pt-[20px] lg:gap-[12px] lg:px-[28px] lg:pb-[32px] lg:pt-[28px]">
                  {card.label && (
                    <p className="font-inter text-[12px] font-semibold uppercase leading-normal tracking-[1.5px] text-crimson">{card.label}</p>
                  )}
                  <h3 className={titleCls}>{card.title}</h3>
                  {card.text && <p className={bodyM}>{card.text}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {button && (
          <div className="lg:hidden">
            <Button link={button} tone="white" />
          </div>
        )}
      </div>
    </section>
  );
}

export function Steps({ content: c }: { content: C["steps"] }) {
  return (
    <section aria-labelledby="competitions-steps" className="bg-white">
      <div className={`${wrap} py-[64px] lg:py-[120px]`}>
        <div className="flex flex-col gap-[28px] lg:gap-[16px]">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2 id="competitions-steps" className={`${h2} max-w-[720px]`}>
            {c.heading}
          </h2>
        </div>
        {c.items.length > 0 && (
          <ol className="mt-[28px] grid gap-[28px] md:grid-cols-3 md:gap-[24px] lg:mt-[56px]">
            {c.items.map((s, i) => (
              <li key={i} className="flex flex-col gap-[10px] border-t-[3px] border-navy-ink pt-[24px] lg:gap-[16px] lg:pt-[32px]">
                <p className="font-inter text-[14px] font-semibold leading-normal tracking-[1px] text-crimson lg:text-[15px]">{s.step}</p>
                <h3 className={`${titleCls} lg:max-w-[440px]`}>{s.title}</h3>
                <p className={`${bodyM} lg:max-w-[440px]`}>{s.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export function Cta({ content: c }: { content: C["cta"] }) {
  return (
    <section aria-labelledby="competitions-cta" className="bg-[#f3f4f6]">
      <div className={`${wrap} flex flex-col gap-[16px] py-[64px] lg:flex-row lg:items-center lg:justify-between lg:gap-[48px] lg:py-[96px]`}>
        <div className="flex flex-col gap-[16px]">
          <h2 id="competitions-cta" className={`${h2} max-w-[800px]`}>
            {c.heading}
          </h2>
          {c.text && <p className={`${bodyL} max-w-[600px]`}>{c.text}</p>}
        </div>
        {(c.button.label || c.button2.label) && (
          <div className="flex flex-col gap-[12px] pt-[8px] sm:flex-row lg:shrink-0 lg:gap-[16px] lg:pt-0">
            <Button link={c.button} tone="crimson" />
            <Button link={c.button2} tone="navy" />
          </div>
        )}
      </div>
    </section>
  );
}
