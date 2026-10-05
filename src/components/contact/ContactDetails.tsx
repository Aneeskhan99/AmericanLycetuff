import type { PageContent } from "@/lib/content";
import type { contactPage } from "@/content/contact";
import { Rich } from "@/components/site/Rich";
import type { ContactInfo } from "./info";
import { eyebrow, h2 } from "./ui";

type Card = {
  label: string;
  value: string;
  valueClass: string;
  sub?: string;
  action: string;
  href: string;
  external?: boolean;
  bg: string;
  /** Desktop stagger: cards 2 and 4 sit 40px lower in the design */
  offset?: boolean;
  /** Extra space above this card on mobile (design gaps are 32 / 18 / 18) */
  mobileGap?: string;
};

type Props = { content: PageContent<typeof contactPage>["details"]; info: ContactInfo };

function cardsFor(c: Props["content"], info: ContactInfo): Card[] {
  return [
    {
      label: c.campusLabel,
      value: c.campusText,
      valueClass: "text-[20px] leading-[31px] lg:text-[clamp(18px,1.146vw,22px)] lg:leading-[1.4545]",
      sub: info.address,
      action: c.campusAction,
      href: info.directionsHref,
      external: true,
      bg: "bg-navy",
    },
    {
      label: c.phoneLabel,
      value: info.phone,
      valueClass:
        "mt-[2px] text-[27px] font-light leading-[32px] tracking-[-0.3553px] lg:mt-0 lg:text-[clamp(28px,1.98vw,38px)] lg:leading-[1.263] lg:tracking-[-0.5px]",
      action: c.phoneAction,
      href: info.phoneHref,
      bg: "bg-crimson",
      offset: true,
      mobileGap: "max-md:mt-[14px]",
    },
    {
      label: c.whatsappLabel,
      value: info.whatsapp,
      valueClass: "text-[20px] leading-[31px] lg:text-[clamp(20px,1.354vw,26px)] lg:leading-[1.3846]",
      sub: c.whatsappNote || undefined,
      action: c.whatsappAction,
      href: info.whatsappHref,
      external: info.whatsappExternal,
      bg: "bg-navy-ink",
    },
    {
      label: c.emailLabel,
      value: info.admissionsEmail,
      valueClass: "text-[20px] leading-[31px] lg:text-[clamp(18px,1.146vw,22px)] lg:leading-[1.4545]",
      action: c.emailAction,
      href: info.emailHref,
      bg: "bg-navy",
      offset: true,
    },
  ];
}

export default function ContactDetails({ content, info }: Props) {
  const cards = cardsFor(content, info);
  return (
    <section aria-labelledby="contact-details-heading" className="bg-[#f8f8f8]">
      <div className="frame gutter py-[56px] lg:pb-[129.5px] lg:pt-[129.5px]">
        <div className="mx-auto max-w-[1498px] text-center lg:text-left">
          <p className={`${eyebrow} text-black`}>{content.eyebrow}</p>
          <h2 id="contact-details-heading" className={`${h2} mt-[14px] text-black lg:mt-[20px]`}>
            <Rich text={content.heading} />
          </h2>

          <ul className="mt-[24px] grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:mt-[94px] lg:grid-cols-2 nav:grid-cols-4 lg:gap-[clamp(20px,1.72vw,33px)]">
            {cards.map((c, i) => (
              <li
                key={i}
                className={`${c.bg} ${c.offset ? "lg:mt-[40px]" : ""} ${c.mobileGap ?? ""} flex flex-col items-center p-[24px] text-center text-white lg:min-h-[440px] lg:self-start lg:items-start lg:px-[clamp(24px,1.875vw,36px)] lg:pb-[43px] lg:pt-[40px] lg:text-left`}
              >
                <h3 className={`${eyebrow} text-[#fd0]`}>{c.label}</h3>
                <div aria-hidden className="mt-[20px] hidden h-[3px] w-[40px] bg-[#fd0] lg:block" />
                <div className="mt-[12px] w-full lg:mt-[33px] lg:min-h-[188px] lg:max-w-[280px]">
                  <p className={c.valueClass}>{c.value}</p>
                </div>
                {c.sub && (
                  <p className="mt-[14px] text-[15px] leading-[23px] tracking-[0.3214px] lg:mt-0 lg:mb-[24px] lg:max-w-[280px] lg:text-[14px] lg:leading-[22px] lg:tracking-[0.3px] lg:opacity-80">
                    {c.sub}
                  </p>
                )}
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="mt-[14px] text-[15px] font-semibold uppercase leading-[23px] tracking-[2.1429px] text-[#fd0] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:mt-auto lg:text-[14px] lg:leading-normal lg:tracking-[2px]"
                >
                  {c.action}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
