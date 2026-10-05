import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { stemRoboticsPage } from "@/content/stem-robotics";
import { Rich } from "@/components/site/Rich";
import { CmsLink, btnFilled, btnStroked, unoptimized } from "./ui";

type Props = { content: PageContent<typeof stemRoboticsPage>["cta"] };

export default function ClosingCta({ content: c }: Props) {
  return (
    <section aria-labelledby="stem-cta-heading" className="relative overflow-hidden bg-navy-ink text-white">
      <div aria-hidden className="absolute inset-0">
        {c.background.src && (
          <Image
            src={c.background.src}
            alt={c.background.alt}
            unoptimized={unoptimized(c.background.src)}
            fill
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,30,63,0.95)_0%,rgba(8,30,63,0.8)_60%,rgba(8,30,63,0.45)_100%)]" />
      </div>
      <div className="frame gutter relative py-[64px] lg:pb-[145px] lg:pt-[130px]">
        <div className="mx-auto flex max-w-[1498px] flex-col items-center text-center lg:items-start lg:text-left">
          <h2
            id="stem-cta-heading"
            className="w-full text-[36px] font-bold leading-[40px] tracking-[-0.6545px] lg:-ml-[4px] lg:max-w-[1200px] lg:text-[clamp(56px,5.73vw,110px)] lg:leading-[1.0364] lg:tracking-[-2px]"
          >
            <Rich text={c.heading} />
          </h2>
          {c.body && (
            <p className="mt-[16px] w-full text-[20px] leading-[31px] tracking-[0.3636px] lg:mt-[30px] lg:max-w-[640px] lg:text-[22px] lg:leading-[34px] lg:tracking-[0.4px]">
              {c.body}
            </p>
          )}
          <div className="mt-[24px] flex w-full flex-col gap-[12px] lg:mt-[40px] lg:w-auto lg:flex-row lg:items-start lg:gap-[24px]">
            {c.primary.label && (
              <CmsLink href={c.primary.href} className={btnFilled}>
                {c.primary.label}
              </CmsLink>
            )}
            {c.secondary.label && (
              <CmsLink href={c.secondary.href} className={btnStroked}>
                {c.secondary.label}
              </CmsLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
