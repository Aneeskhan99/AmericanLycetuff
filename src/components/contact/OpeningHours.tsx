import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import { Rich } from "@/components/site/Rich";
import CmsLink, { unoptimized } from "./CmsLink";
import type { ContactInfo } from "./info";
import { btnWhite, eyebrow } from "./ui";

type Props = { content: PageContent<typeof contactPage>["hours"]; info: ContactInfo };

export default function OpeningHours({ content: c, info }: Props) {
  // Times come from Admin → Settings → Opening hours; an empty time hides its row.
  const hours = [
    { day: c.weekdaysLabel, time: info.hours.weekdays },
    { day: c.saturdayLabel, time: info.hours.saturday },
    { day: c.sundayLabel, time: info.hours.sunday },
  ]
    .filter((h) => h.time.trim())
    .map((h) => ({ ...h, closed: h.time.trim().toLowerCase() === "closed" }));

  return (
    <section aria-labelledby="opening-hours-heading" className="bg-navy-ink">
      <div className="frame lg:grid lg:min-h-[860px] lg:grid-cols-2">
        {/* Text column — aligns with the 1498px content edge on wide screens */}
        <div className="flex px-[24px] pb-[26px] pt-[56px] lg:justify-end lg:pb-[97px] lg:pl-[clamp(40px,7.76vw,149px)] lg:pr-0 lg:pt-[120px]">
          <div className="flex w-full flex-col items-center text-center lg:max-w-[749px] lg:items-start lg:pr-[clamp(32px,5.68vw,109px)] lg:text-left">
            <p className={`${eyebrow} text-[#fd0]`}>{c.eyebrow}</p>
            <h2
              id="opening-hours-heading"
              className="mt-[14px] text-[34px] leading-[38px] tracking-[-0.4722px] text-white lg:mt-[16px] lg:text-[clamp(52px,3.75vw,72px)] lg:leading-[1.111] lg:tracking-[-1px]"
            >
              <Rich text={c.heading} hl="text-[#fd0]" />
            </h2>

            {hours.length > 0 && (
              <dl className="mt-[24px] w-full border border-white/14 bg-white/6 px-[20px] py-[8px] lg:mt-[58px] lg:max-w-[640px] lg:border-x-0 lg:border-b-0 lg:border-t-white/25 lg:bg-transparent lg:p-0">
                {hours.map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-[4px] border-b border-white/14 py-[16px] last:border-b-0 lg:h-[88px] lg:flex-row lg:justify-between lg:gap-[24px] lg:border-white/25 lg:py-0 lg:last:border-b"
                  >
                    <dt className={`${eyebrow} text-[#fd0]`}>{h.day}</dt>
                    <dd
                      data-als-site="hours"
                      className={`text-[24px] leading-[29px] lg:text-[28px] lg:leading-normal ${h.closed ? "text-[#fd0]" : "text-white"}`}
                    >
                      {h.time}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {info.hours.note && (
              <p data-als-site="hours" className="mt-[32px] text-[18px] leading-[28px] tracking-[0.3px] text-white lg:mt-[56px] lg:max-w-[560px] lg:leading-[30px]">
                {info.hours.note}
              </p>
            )}
            <CmsLink href={c.button.href} className={`${btnWhite} mt-[24px] w-full lg:mt-[38px] lg:w-auto`}>
              {c.button.label}
            </CmsLink>
          </div>
        </div>

        {/* Photo */}
        <div className="px-[24px] pb-[56px] lg:p-0">
          <div className="relative h-[306px] w-full lg:h-full lg:min-h-[860px]">
            <Image
              src={c.image.src}
              alt={c.image.alt}
              unoptimized={unoptimized(c.image.src)}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
