import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import NewsletterForm from "@/components/site/NewsletterForm";
import type { Settings } from "@/lib/settings";
import { footerNav } from "./nav-links";

function SocialIcons({ social }: { social: Settings["social"] }) {
  const socials = [
    { label: "Facebook", href: social.facebook, icon: "/images/shared/facebook.svg" },
    { label: "Twitter", href: social.twitter, icon: "/images/shared/twitter.svg" },
    { label: "Instagram", href: social.instagram, icon: "/images/shared/instagram.svg" },
  ].filter((s) => s.href);
  return (
    <ul className="flex items-center gap-[10px] nav:gap-[17px]">
      {socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="block size-[32.25px] overflow-hidden rounded-full bg-white transition-transform hover:scale-110"
          >
            <img src={s.icon} alt="" width={32} height={32} className="size-full" />
          </a>
        </li>
      ))}
      {social.linkedin && <li>
        <a
          href={social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="relative block size-[32.25px] rounded-full bg-white transition-transform hover:scale-110"
        >
          {/* LinkedIn glyph is a crop of a sprite image in the design */}
          <span className="absolute left-1/2 top-1/2 h-[12.094px] w-[13.304px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
            <img
              src="/images/shared/linkedin-sprite.png"
              alt=""
              className="absolute left-[-1000%] top-0 h-[1110%] w-[1177.27%] max-w-none"
            />
          </span>
        </a>
      </li>}
    </ul>
  );
}

/** Exam boards & registrations — order/sizing per Figma (desktop 100px tiles, mobile 75px). */
function BoardLogos() {
  return (
    <>
      {/* Desktop row */}
      <div className="hidden items-center gap-[6.155px] nav:flex">
        <div className="relative size-[100px] overflow-hidden rounded-[10px] bg-white">
          <Image src="/images/shared/board-1.png" alt="Federal Board of Intermediate and Secondary Education" fill sizes="100px" className="object-cover" />
        </div>
        <div className="relative size-[100px] overflow-hidden rounded-[10px] bg-white">
          <Image src="/images/shared/board-2.png" alt="Board of Intermediate and Secondary Education" width={71} height={71} className="absolute left-[14.62px] top-[14.62px] size-[70.785px] object-cover" />
        </div>
        <div className="relative h-[100px] w-[249.29px] overflow-hidden rounded-[10px] bg-white">
          <span className="absolute left-[10px] top-[20px] h-[59.244px] w-[229.283px] overflow-hidden">
            <Image src="/images/shared/board-cambridge.png" alt="Cambridge Assessment International Education" width={900} height={500} sizes="230px" className="absolute left-0 top-[-57.5%] h-[215.01%] w-full max-w-none" />
          </span>
        </div>
        <div className="relative size-[100px] overflow-hidden rounded-[10px] bg-white">
          <Image src="/images/shared/board-4.png" alt="Registration partner" width={232} height={217} className="absolute left-1/2 top-[calc(50%+0.44px)] h-[74.739px] w-[79.905px] -translate-x-1/2 -translate-y-1/2 object-cover" />
        </div>
        <div className="relative size-[100px] overflow-hidden rounded-[10px] bg-white">
          <Image src="/images/shared/board-navttc.png" alt="NAVTTC" width={215} height={280} className="absolute left-[19.24px] top-[10.77px] h-[78.819px] w-[60.522px] object-cover" />
        </div>
      </div>

      {/* Mobile grid */}
      <div className="flex flex-wrap justify-center gap-[10px] nav:hidden">
        <div className="relative size-[75px] overflow-hidden rounded-[7.5px] bg-white">
          <Image src="/images/shared/board-1.png" alt="Federal Board of Intermediate and Secondary Education" fill sizes="75px" className="object-cover" />
        </div>
        <div className="relative size-[75px] overflow-hidden rounded-[7.5px] bg-white">
          <Image src="/images/shared/board-2.png" alt="Board of Intermediate and Secondary Education" width={53} height={53} className="absolute left-[10.96px] top-[10.96px] size-[53.089px] object-cover" />
        </div>
        <div className="relative size-[75px] overflow-hidden rounded-[7.5px] bg-white">
          <Image src="/images/shared/board-4.png" alt="Registration partner" width={232} height={217} className="absolute left-1/2 top-[calc(50%+0.33px)] h-[56.054px] w-[59.929px] -translate-x-1/2 -translate-y-1/2 object-cover" />
        </div>
        <div className="relative size-[75px] overflow-hidden rounded-[7.5px] bg-white">
          <Image src="/images/shared/board-navttc.png" alt="NAVTTC" width={215} height={280} className="absolute left-[14.43px] top-[8.08px] h-[59.115px] w-[45.392px] object-cover" />
        </div>
        <div className="relative h-[75px] w-full max-w-[329px] overflow-hidden rounded-[7.5px] bg-white">
          <span className="absolute left-[7.5px] top-[15px] h-[44.433px] w-[171.962px] overflow-hidden">
            <Image src="/images/shared/board-cambridge.png" alt="Cambridge Assessment International Education" width={900} height={500} sizes="172px" className="absolute left-0 top-[-57.5%] h-[215.01%] w-full max-w-none" />
          </span>
        </div>
      </div>
    </>
  );
}

/** Site footer. Contact details and social links come from Admin → Settings. */
export default function Footer({ settings }: { settings: Settings }) {
  const contact = { name: settings.school.name, ...settings.contact };
  return (
    <footer className="bg-navy-ink text-white nav:bg-navy-deep">
      {/* Newsletter band */}
      <section className="border border-maroon bg-white text-black nav:border-x-0 nav:border-b-0 nav:border-t-2">
        <div className="frame relative flex flex-col items-center px-[24px] py-[48px] text-center nav:h-[334px] nav:flex-row nav:items-stretch nav:p-0 nav:text-left">
          {/* Crest */}
          <div className="relative h-[90px] w-[72px] shrink-0 overflow-hidden nav:my-auto nav:ml-[clamp(60px,12.6vw,242px)] nav:mr-[clamp(40px,4.7vw,90px)] nav:h-[206px] nav:w-[164px]">
            <Image
              src="/images/shared/logo-crest.png"
              alt="American Lycetuff crest"
              width={2400}
              height={2400}
              sizes="200px"
              className="absolute left-[-12.9%] top-0 h-full w-[125.81%] max-w-none"
            />
          </div>
          {/* Vertical divider (desktop) */}
          <span className="hidden w-px shrink-0 bg-maroon/20 nav:block" aria-hidden />
          <div className="mt-[24px] flex flex-col items-center nav:mt-[67px] nav:items-start nav:pl-[clamp(40px,3.97vw,76px)] nav:pr-[clamp(40px,13.3vw,256px)]">
            <p className="font-inter text-[13px] font-semibold uppercase leading-[20px] tracking-[2.4px] text-navy nav:text-[12.195px] nav:font-normal nav:leading-[18.343px] nav:tracking-[1.1288px] nav:text-black">
              Newsletter
            </p>
            <h2 className="mt-[12px] font-inter text-[26px] leading-[33px] text-crimson nav:mt-[9px] nav:text-[clamp(28px,1.91vw,36.687px)] nav:leading-[43.087px]">
              Stay up to date with what&apos;s happening at our Swabi campus
            </h2>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="frame px-[24px] pb-[36px] pt-[48px] text-center nav:px-[clamp(40px,8.07vw,155px)] nav:pb-[56px] nav:pt-[55px] nav:text-left">
        {/* Quick links */}
        <p className="font-open-sans text-[16px] font-bold uppercase leading-[28px] tracking-[2px] nav:text-[18.142px] nav:leading-[40.315px] nav:tracking-[3.0236px]">
          Quick Links
        </p>
        <nav aria-label="Footer" className="mt-[16px] nav:mt-0">
          <ul className="grid grid-cols-2 gap-x-[12px] font-open-sans text-[15px] uppercase leading-[40px] nav:flex nav:max-w-[1174px] nav:items-center nav:justify-between nav:py-[11px] nav:text-[12.094px] nav:leading-[16.126px]">
            {footerNav.map((item, i) => (
              <Fragment key={item.href}>
                {i > 0 && <li aria-hidden className="hidden h-[14px] w-px bg-white nav:block" />}
                <li>
                  <Link href={item.href} className="transition-colors hover:text-crimson">
                    {item.label}
                  </Link>
                </li>
              </Fragment>
            ))}
          </ul>
        </nav>

        {/* Boards + follow */}
        <div className="mt-[40px] flex flex-col items-center gap-[40px] nav:mt-[42px] nav:flex-row nav:items-start nav:justify-between nav:gap-[24px]">
          <div className="w-full nav:w-auto">
            <p className="mb-[16px] font-open-sans text-[16px] font-bold leading-[28px] tracking-[2px] nav:mb-[8px] nav:text-[18.142px] nav:leading-[40.315px] nav:tracking-normal">
              Examinations &amp; Registrations
            </p>
            <BoardLogos />
          </div>
          <div className="flex flex-col items-center nav:items-end">
            <p className="mb-[16px] font-open-sans text-[16px] font-bold uppercase leading-[28px] tracking-[2px] nav:mb-[21px] nav:text-[18.142px] nav:leading-[40.315px] nav:tracking-[3.0236px]">
              Follow Us
            </p>
            <SocialIcons social={settings.social} />
          </div>
        </div>

        {/* Contact + legal */}
        <div className="mt-[40px] flex flex-col items-center nav:mt-[50px] nav:flex-row nav:items-end nav:justify-between">
          <address className="flex max-w-[430px] flex-col items-center gap-[12px] not-italic nav:items-start nav:gap-[7px]">
            <p className="font-inter text-[13px] font-semibold leading-[20px] tracking-[0.98px] nav:text-[13.405px] nav:leading-[20.964px] nav:tracking-[1.0079px]">
              {contact.name}
            </p>
            <p className="flex flex-col items-center gap-[6px] font-inter text-[13px] leading-[20px] nav:flex-row nav:gap-[10px] nav:leading-[20.964px]">
              <a href={contact.phoneHref} className="hover:underline">{contact.phone}</a>
              <a href={`mailto:${contact.email}`} className="hover:underline nav:text-[12.4px]">{contact.email}</a>
            </p>
            <p className="font-inter text-[13px] leading-[20px] nav:leading-[20.964px]">{contact.address}</p>
          </address>

          <div className="mt-[32px] h-px w-full bg-white/16 nav:hidden" aria-hidden />

          <div className="mt-[24px] flex flex-col items-center gap-[12px] font-inter text-[13px] leading-[20px] text-white/75 nav:mt-0 nav:items-end nav:gap-[7px] nav:leading-[20.964px]">
            <p>© 2026 American Lycetuff</p>
            <p>Privacy Policy | ABN: 11-22-3333</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
