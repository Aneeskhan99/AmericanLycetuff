import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import { Rich } from "@/components/site/Rich";
import type { ContactInfo } from "./info";
import { btnCrimson, eyebrow, h2, mapEmbedSrc } from "./ui";

type Props = { content: PageContent<typeof contactPage>["gettingHere"]; info: ContactInfo };

export default function GettingHere({ content: c, info }: Props) {
  return (
    <section aria-labelledby="getting-here-heading" className="bg-[#f8f8f8]">
      <div className="frame gutter py-[56px] lg:pb-[100px] lg:pt-[130px]">
        <div className="mx-auto max-w-[1498px]">
          <div className="flex flex-col text-center lg:flex-row lg:items-start lg:justify-between lg:gap-[48px] lg:text-left">
            <div className="lg:max-w-[900px]">
              <p className={`${eyebrow} text-black`}>{c.eyebrow}</p>
              <h2 id="getting-here-heading" className={`${h2} mt-[14px] text-black lg:mt-[20px]`}>
                <Rich text={c.heading} />
              </h2>
            </div>
            <div className="lg:mt-[46px] lg:w-[480px] lg:shrink-0">
              <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:mt-0 lg:leading-[30px]">
                {c.intro}
              </p>
              {c.landmarks && (
                <p className="mt-[14px] text-[15px] leading-[23px] text-crimson lg:mt-[26px] lg:text-[14px] lg:leading-[22px]">
                  {c.landmarks}
                </p>
              )}
            </div>
          </div>

          {/* Map: live Google Maps embed with the location card overlaid */}
          <div className="relative mt-[24px] overflow-hidden border-[1.5px] border-[rgba(92,92,92,0.5)] px-[24px] pb-[120px] pt-[64px] lg:mt-[74px] lg:h-[580px] lg:border-dashed lg:p-0">
            {/* Pulled up 170px so Google's own place card (top-left of the embed) sits out of view behind the overlay card */}
            <iframe
              title="Map showing American Lycetuff School, Swabi Campus, Shahmansoor Township"
              src={mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-x-0 bottom-0 top-[-170px] h-[calc(100%+170px)] w-full border-0"
              allowFullScreen
            />
            <div className="relative flex flex-col items-center bg-white p-[24px] text-center lg:absolute lg:left-[58.5px] lg:top-[78.5px] lg:h-[420px] lg:w-[440px] lg:items-start lg:p-[40px] lg:text-left">
              <p className={`${eyebrow} text-crimson`}>{c.cardEyebrow}</p>
              <p className="mt-[12px] text-[20px] leading-[31px] text-navy lg:mt-[20px] lg:w-[360px] lg:text-[22px] lg:leading-[32px]">
                {c.cardText}
              </p>
              <p data-als-site="contact" className="mt-[14px] text-[15px] leading-[23px] text-[#5c5c5c] lg:mt-[54px] lg:text-[14px] lg:leading-normal">
                {info.address}
              </p>
              <a
                href={info.directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnCrimson} mt-[24px] w-full lg:mt-auto lg:mb-[25px] lg:w-auto`}
              >
                {c.directionsLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
