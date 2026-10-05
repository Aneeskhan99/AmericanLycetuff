import Image from "next/image";
import type { aboutPage } from "@/content/about";
import type { PageContent } from "@/lib/content";
import { unoptimized } from "./cms";
import { dancingScript } from "./fonts";

type Content = PageContent<typeof aboutPage>["statement"];

export default function Statement({ content: c }: { content: Content }) {
  const label = `${c.line1} ${c.line2}`.trim().replace(/[.!]+$/, "");
  return (
    <section aria-label={label || undefined} className="bg-navy-ink">
      <div className="frame gutter py-[56px] lg:py-[120px]">
        <div className="mx-auto flex max-w-[1611px] flex-col items-center gap-[32px] lg:flex-row lg:justify-between lg:gap-[48px]">
          <div className="w-full text-center lg:w-auto lg:pb-[20px] lg:text-left">
            <p className="text-[36px] font-bold leading-[40px] tracking-[-0.3273px] text-white lg:whitespace-nowrap lg:text-[clamp(64px,5.73vw,110px)] lg:leading-[1.0909] lg:tracking-[-1px]">
              {c.line1}
            </p>
            <p
              className={`${dancingScript.className} mt-[8px] text-[36px] font-bold leading-[40px] text-[#fd0] lg:mt-0 lg:whitespace-nowrap lg:text-[clamp(110px,9.9vw,190px)] lg:leading-[1.2]`}
            >
              {c.line2}
            </p>
            <span aria-hidden className="ml-[5px] mt-[38px] hidden h-[6px] w-[120px] bg-crimson lg:block" />
          </div>

          <div className="relative h-[364px] w-full overflow-hidden border-y-[3px] border-[#fd0] lg:aspect-[700/520] lg:h-auto lg:w-[min(700px,44vw)] lg:shrink-0 lg:border-0">
            <div className="absolute inset-0 lg:inset-x-[-2.43%] lg:inset-y-[-2.4%]">
              {c.image.src && (
                <Image
                  src={c.image.src}
                  alt={c.image.alt}
                  unoptimized={unoptimized(c.image.src)}
                  fill
                  sizes="(min-width: 1024px) min(734px, 46vw), calc(100vw - 48px)"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
