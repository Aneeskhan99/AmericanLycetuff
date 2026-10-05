import type { Metadata } from "next";
import Link from "next/link";
import DownloadRow from "@/components/site/downloads/DownloadRow";
import { plain, Rich } from "@/components/site/Rich";
import { isInternal } from "@/lib/content";
import { getPageContent } from "@/lib/content-server";
import { getDownloadGroups } from "@/lib/public/downloads";
import { downloadsPage } from "@/content/downloads";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getPageContent(downloadsPage);
  return { title: "Downloads", description: plain(c.hero.intro).slice(0, 300), alternates: { canonical: "/downloads" } };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function DownloadsPage() {
  const [c, groups] = await Promise.all([getPageContent(downloadsPage), getDownloadGroups()]);

  return (
    <>
      <section aria-labelledby="downloads-hero-heading" className="relative overflow-hidden bg-navy-ink">
        <span aria-hidden className="absolute bottom-0 right-0 hidden size-[min(6.25vw,120px)] bg-crimson lg:block" />
        <div className="frame gutter relative">
          <div className="mx-auto flex w-full max-w-[1498px] flex-col items-center py-[64px] text-center text-white lg:items-start lg:pb-[100px] lg:pt-[110px] lg:text-left">
            <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-[#fd0] lg:text-[17.13px] lg:leading-[21px] lg:tracking-[1.9px]">
              {c.hero.eyebrow}
            </p>
            <h1
              id="downloads-hero-heading"
              className="mt-[28px] text-[38px] font-bold leading-[44px] tracking-[-1px] lg:mt-[24px] lg:max-w-[1100px] lg:text-[clamp(56px,4.69vw,90px)] lg:leading-[1.05] lg:tracking-[-0.02em]"
            >
              <Rich text={c.hero.title} hl="text-[#fd0]" />
            </h1>
            <p className="mt-[16px] max-w-[720px] text-[18px] leading-[28px] tracking-[0.4px] text-white/90 lg:mt-[28px] lg:text-[22px] lg:leading-[34px] lg:tracking-[0.5px]">
              {c.hero.intro}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Documents" className="frame gutter bg-white">
        <div className="mx-auto w-full max-w-[1100px] py-[56px] lg:pb-[110px] lg:pt-[90px]">
          {groups.length === 0 ? (
            <p className="text-center text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:text-left">{c.list.empty}</p>
          ) : (
            <div className="flex flex-col gap-[48px] lg:gap-[72px]">
              {groups.map((g, gi) => (
                <section key={g.category} aria-labelledby={`dl-${gi}`}>
                  <h2
                    id={`dl-${gi}`}
                    className="flex items-center justify-center gap-[16px] border-b-2 border-navy pb-[14px] text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:justify-start lg:text-[13.1px] lg:tracking-[2px]"
                  >
                    <span className="text-crimson">{pad(gi + 1)}</span>
                    <span className="text-navy">{g.category}</span>
                  </h2>
                  <ul>
                    {g.items.map((item) => (
                      <DownloadRow key={item.id} item={item} button={c.list.button || "Download"} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {c.list.help && (
            <p className="mt-[48px] text-center text-[16px] leading-[26px] text-[#5c5c5c] lg:mt-[72px] lg:text-left lg:text-[18px] lg:leading-[28px]">
              {c.list.help}{" "}
              {c.list.helpLink.label && c.list.helpLink.href && (
                isInternal(c.list.helpLink.href) ? (
                  <Link href={c.list.helpLink.href} className="font-medium text-crimson underline underline-offset-4 hover:text-navy">
                    {c.list.helpLink.label}
                  </Link>
                ) : (
                  <a href={c.list.helpLink.href} className="font-medium text-crimson underline underline-offset-4 hover:text-navy">
                    {c.list.helpLink.label}
                  </a>
                )
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
