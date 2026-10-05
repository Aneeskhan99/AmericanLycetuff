import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { HomeContent } from "@/content/home";
import { body, btnCrimson, CmsLink, eyebrow, heading, num, unoptimized } from "./ui";

/* Map artwork frame in Figma is 1113 × 880; everything inside is positioned as a % of it. */
const W = 1113;
const H = 880;
const box = (x: number, y: number, w: number, h: number) => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
  width: `${(w / W) * 100}%`,
  height: `${(h / H) * 100}%`,
});

function SwabiMap({ label, alt }: { label: string; alt: string }) {
  /** Desktop callout puts each " · " part on its own line, keeping the dot at the end of the line. */
  const parts = label.split(/\s+·\s+/).filter(Boolean);
  return (
    <div className="relative aspect-[1113/880] w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/map-dot.svg" alt="" aria-hidden className="absolute" style={{ left: "88.42%", top: "21.77%", width: "0.33%", height: "0.92%" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/swabi-map.svg"
        alt={alt}
        className="absolute"
        style={{ left: "4.25%", top: "0.63%", width: "95.26%", height: "98.87%" }}
      />
      {/* Pin */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/map-pin-pulse.svg" alt="" aria-hidden className="absolute animate-pulse" style={box(810.5, 239, 84, 84)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/map-pin-pulse-inner.svg" alt="" aria-hidden className="absolute" style={box(825.5, 254, 54, 54)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/map-pin-marker.svg" alt="" aria-hidden className="absolute" style={box(837.5 - 12, 266 - 8, 54, 54)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/map-pin-core.svg" alt="" aria-hidden className="absolute" style={box(847.5, 276, 10, 10)} />

      {/* Desktop callout */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/map-pin-tail.svg"
        alt=""
        aria-hidden
        className="absolute hidden rotate-180 lg:block"
        style={box(838.5 + 1.876, 230.5 + 4, 24.249, 12)}
      />
      {label && (
        <p
          className="absolute hidden flex-col gap-[2px] whitespace-nowrap rounded-[10px] bg-crimson px-[clamp(12px,0.94vw,18px)] py-[clamp(9px,0.73vw,14px)] font-inter text-[clamp(11px,0.78vw,15px)] font-medium uppercase leading-[1.3] tracking-[0.04em] text-white shadow-[0px_10px_24px_0px_rgba(0,38,77,0.28)] lg:flex"
          // Bottom edge sits on the pin tail; the box grows upward so the text is never clipped.
          style={{ left: "69.09%", bottom: "73.3%" }}
        >
          {parts.map((part, i) => (
            <span key={i}>{i < parts.length - 1 ? `${part} ·` : part}</span>
          ))}
        </p>
      )}

      {/* Mobile callout */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/map-pin-tail-mobile.svg"
        alt=""
        aria-hidden
        className="absolute lg:hidden"
        style={{ left: "74.32%", top: "38.96%", width: "4.56%", height: "2.77%" }}
      />
      {label && (
        <p
          className="absolute w-[138px] bg-crimson px-[11.5px] py-[9.857px] font-inter text-[12.5px] font-medium leading-[17px] text-white shadow-[0px_4.929px_13.143px_0px_rgba(0,38,77,0.28)] lg:hidden"
          style={{ left: "30.41%", top: "6.89%" }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

/** "Easy to Reach, Easy to Love" location section (Figma Background 56:3743). */
export default function Location({ content: c }: { content: HomeContent["location"] }) {
  return (
    <section className="relative overflow-hidden bg-[#f1f1f1] px-[24px] py-[64px] lg:px-[6vw] lg:pb-[clamp(90px,7.34vw,141px)] lg:pt-[clamp(64px,4.74vw,91px)]">
      {c.background.src && (
        <Image
          src={c.background.src}
          alt={c.background.alt}
          aria-hidden
          unoptimized={unoptimized(c.background.src)}
          fill
          sizes="100vw"
          className="object-cover opacity-8"
        />
      )}
      <div className="relative mx-auto max-w-[1498px]">
        <div className="flex flex-col items-center text-center text-black">
          {c.eyebrow && <p className={eyebrow}>{c.eyebrow}</p>}
          <h2 className={`${heading} mt-[14px] lg:mt-[10.4px] lg:max-w-[922px]`}>
            <Rich text={c.heading} />
          </h2>
          {c.body && <p className={`${body} mt-[16px] lg:mt-[18px] lg:max-w-[1200px]`}>{c.body}</p>}
        </div>

        <div className="mt-[24px] flex flex-col lg:mt-[47px] lg:flex-row lg:items-start lg:justify-between lg:gap-[60px]">
          <div className="w-full lg:max-w-[1113px] lg:flex-1">
            <SwabiMap label={c.mapLabel} alt={c.mapAlt} />
          </div>

          <div className="mt-[32px] flex flex-col items-center text-center lg:mt-[40px] lg:w-[325px] lg:shrink-0 lg:items-start lg:text-left">
            {c.points.length > 0 && (
              <ol className="flex w-full flex-col gap-[32px] lg:gap-0">
                {c.points.map((p, i) => (
                  <li key={i} className="flex flex-col lg:min-h-[222px] lg:last:min-h-0">
                    <span aria-hidden className={`hidden h-[2px] w-full lg:block ${i === 0 ? "bg-crimson" : "bg-[#d6d6d6]"}`} />
                    <span className="font-inter text-[13px] font-semibold leading-[20px] tracking-[1.9847px] text-crimson lg:mt-[26px] lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px]">
                      {num(i)}
                    </span>
                    <h3 className="mt-[14px] font-inter text-[24px] font-medium leading-[29px] text-navy lg:mt-[14px] lg:text-[30px] lg:leading-[38px]">
                      {p.title}
                    </h3>
                    <p className="mt-[16px] font-inter text-[16px] leading-[25px] tracking-[0.3px] text-[#5c5c5c] lg:mt-[12px] lg:leading-[26px]">
                      {p.text}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {c.button.label && c.button.href && (
              <CmsLink href={c.button.href} className={`${btnCrimson} mt-[24px] w-full lg:mt-[38px] lg:w-auto`}>
                {c.button.label}
              </CmsLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
