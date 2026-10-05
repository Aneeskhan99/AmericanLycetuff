import Image from "next/image";
import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import { Rich } from "@/components/site/Rich";
import { unoptimized } from "./CmsLink";
import ContactForm from "./ContactForm";
import { eyebrow, h2 } from "./ui";

type Props = { content: PageContent<typeof contactPage>["form"] };

export default function ContactFormSection({ content: c }: Props) {
  return (
    <section
      id="contact-form"
      aria-labelledby="contact-form-heading"
      className="scroll-mt-[116px] bg-white nav:scroll-mt-[154px]"
    >
      <div className="frame gutter py-[56px] lg:pb-[80px] lg:pt-[130px]">
        <div className="mx-auto flex max-w-[1498px] flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-[48px]">
          {/* Intro + photo */}
          <div className="flex flex-col items-center text-center lg:w-[516px] lg:shrink-0 lg:items-start lg:text-left">
            <p className={`${eyebrow} text-black`}>{c.eyebrow}</p>
            <h2 id="contact-form-heading" className={`${h2} mt-[14px] text-black lg:mt-[20px] lg:max-w-[560px]`}>
              <Rich text={c.heading} />
            </h2>
            <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:mt-[28px] lg:max-w-[460px] lg:leading-[30px]">
              {c.intro}
            </p>

            <div className="relative mt-[24px] w-full lg:mt-[clamp(80px,11.46vw,220px)] lg:aspect-[516/396]">
              <div aria-hidden className="absolute bottom-0 left-0 hidden h-[calc(100%-16px)] w-[calc(100%-16px)] bg-crimson lg:block" />
              <div className="relative h-[260px] w-full lg:absolute lg:right-0 lg:top-0 lg:h-[calc(100%-16px)] lg:w-[calc(100%-16px)]">
                <Image
                  src={c.image.src}
                  alt={c.image.alt}
                  unoptimized={unoptimized(c.image.src)}
                  fill
                  sizes="(min-width: 1024px) 500px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Form panel */}
          <div className="mt-[32px] w-full bg-[#f8f8f8] p-[24px] lg:mt-0 lg:max-w-[849px] lg:p-[60px] lg:pb-[75px]">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
