import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import CmsLink, { unoptimized } from "./CmsLink";
import { lcFirst, type ContactInfo } from "./info";
import { btnWhite, eyebrow } from "./ui";

const phrase =
  "text-[34px] font-bold leading-[38px] tracking-[-0.7083px] text-white lg:min-h-[190px] lg:text-[clamp(52px,3.75vw,72px)] lg:leading-[1.0833] lg:tracking-[-1.5px]";
const rule = "hidden lg:block h-[3px] w-[60px] bg-crimson";
const detail =
  "text-[20px] font-medium leading-[31px] tracking-[0.2727px] text-[#fd0] lg:mt-[29px] lg:text-[22px] lg:leading-[32px] lg:tracking-[0.3px]";

function Divider() {
  return <div aria-hidden className="hidden w-px self-stretch bg-white/25 lg:block" />;
}

type Props = { content: PageContent<typeof contactPage>["reachUs"]; info: ContactInfo };

/** "Three ways to reach us" band: Call ahead / Walk in / Send us a message. */
export default function ReachUs({ content: c, info }: Props) {
  const { weekdays, saturday } = info.hours;
  return (
    <section aria-labelledby="reach-us-heading" className="relative isolate overflow-hidden bg-navy-ink">
      <Image
        src={c.image.src}
        alt={c.image.alt}
        unoptimized={unoptimized(c.image.src)}
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[rgba(8,30,63,0.86)]" />

      <div className="frame gutter py-[64px] lg:pb-[170px] lg:pt-[130px]">
        <div className="mx-auto max-w-[1498px] text-center lg:text-left">
          <h2 id="reach-us-heading" className={`${eyebrow} text-[#fd0]`}>
            {c.eyebrow}
          </h2>

          <div className="mt-[14px] flex flex-col gap-[32px] lg:mt-[84px] lg:grid lg:min-h-[420px] lg:grid-cols-[1fr_1px_1fr_1px_1fr] lg:gap-x-[40px]">
            <div className="flex flex-col">
              <h3 className={phrase}>{c.callHeading}</h3>
              <div className={rule} />
              <a
                href={info.phoneHref}
                className="mt-[8px] text-[27px] font-semibold leading-[32px] tracking-[0.75px] text-[#fd0] underline-offset-4 hover:underline lg:mt-[29px] lg:text-[36px] lg:leading-[44px] lg:tracking-[1px]"
              >
                {info.phone}
              </a>
            </div>

            <Divider />

            <div className="flex flex-col">
              <h3 className={phrase}>{c.walkInHeading}</h3>
              <div className={rule} />
              {weekdays && <p className={`${detail} mt-[16px]`}>{[c.walkInWeekdays, weekdays].filter(Boolean).join(", ")}</p>}
              {saturday && (
                <p className="mt-[14px] text-[16px] leading-[25px] tracking-[0.2824px] text-white lg:mt-[26px] lg:text-[17px] lg:leading-[28px] lg:tracking-[0.3px]">
                  {c.walkInSaturday ? `${c.walkInSaturday} ${lcFirst(saturday)}` : saturday}
                  {/[.!?]$/.test(saturday) ? "" : "."}
                </p>
              )}
            </div>

            <Divider />

            <div className="flex flex-col">
              <h3 className={phrase}>{c.messageHeading}</h3>
              <div className={rule} />
              <p className={`${detail} mt-[16px]`}>{c.messageText}</p>
              <CmsLink href={c.messageButton.href} className={`${btnWhite} mt-[24px] w-full lg:mt-[56px] lg:w-auto lg:self-start`}>
                {c.messageButton.label}
              </CmsLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
