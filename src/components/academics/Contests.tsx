import Image from "next/image";
import { Rich } from "@/components/site/Rich";
import type { academicsPage } from "@/content/academics";
import type { PageContent } from "@/lib/content";
import { Container, num, unoptimized } from "./ui";

type Content = PageContent<typeof academicsPage>["contests"];
type Item = Content["items"][number];

/** Contests with the same category, in the order categories first appear. */
function byGroup(items: Item[]) {
  const groups: { title: string; items: Item[] }[] = [];
  for (const it of items) {
    const g = groups.find((x) => x.title === it.group);
    if (g) g.items.push(it);
    else groups.push({ title: it.group, items: [it] });
  }
  return groups;
}

/**
 * "Where Our Students Compete": phones show one white card per category with a
 * row per contest (small logo left, name right); from lg each contest is its own
 * card in a 3/4-column grid (logo above, name centred).
 */
export default function Contests({ content: c }: { content: Content }) {
  const groups = byGroup(c.items);
  return (
    <section aria-labelledby="contests-title" className="bg-[#f8f8f8] py-[56px] lg:pb-[130px] lg:pt-[120px]">
      <Container>
        <h2
          id="contests-title"
          className="text-center text-[30px] leading-[37px] text-navy lg:text-left lg:text-[clamp(44px,2.92vw,56px)] lg:leading-[1.143]"
        >
          <Rich text={c.heading} hl="text-crimson" />
        </h2>
        {c.intro && (
          <p className="mt-[14px] text-center text-[16px] leading-[25px] text-[#5c5c5c] lg:mt-[20px] lg:max-w-[640px] lg:text-left lg:text-[16.2px] lg:leading-[26px]">
            {c.intro}
          </p>
        )}

        {groups.length > 0 && (
          <div className="mt-[36px] flex flex-col gap-[36px] lg:mt-[64px] lg:gap-[64px]">
            {groups.map((g, gi) => (
              <div key={gi} className="flex flex-col gap-[14px] lg:gap-[24px]">
                <div className="flex flex-col items-center gap-[8px] lg:flex-row lg:gap-[16px]">
                  <h3 className="text-center text-[13px] font-semibold uppercase leading-[16px] tracking-[1.8px] text-crimson lg:whitespace-nowrap lg:text-left lg:text-[14px] lg:leading-[17px] lg:tracking-[2px]">
                    {g.title}
                  </h3>
                  <span aria-hidden className="hidden h-px min-w-px flex-1 bg-[#d6d6d6] lg:block" />
                  <span className="order-first bg-navy px-[8px] py-[3px] text-[11px] font-semibold leading-[13px] tracking-[0.5px] text-white lg:order-none lg:bg-transparent lg:p-0 lg:text-[14px] lg:leading-[17px] lg:tracking-[1px] lg:text-navy">
                    <span className="sr-only">Contests: </span>
                    {num(g.items.length - 1)}
                  </span>
                </div>

                <ul className="flex flex-col border border-[#d6d6d6] bg-white px-[16px] lg:grid lg:grid-cols-3 lg:gap-[24px] lg:border-0 lg:bg-transparent lg:p-0 xl:grid-cols-4">
                  {g.items.map((it, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-[14px] border-b border-[#d6d6d6] py-[14px] last:border-b-0 lg:min-h-[256px] lg:flex-col lg:justify-center lg:gap-[20px] lg:border lg:bg-white lg:p-[28px] lg:last:border-b"
                    >
                      <div className="relative h-[48px] w-[72px] shrink-0 border border-[#d6d6d6] bg-white lg:h-[64px] lg:w-[112px]">
                        {it.logo.src && (
                          <div className="absolute inset-[3px] lg:inset-[4px]">
                            <Image
                              src={it.logo.src}
                              alt={it.logo.alt}
                              unoptimized={unoptimized(it.logo.src)}
                              fill
                              quality={85}
                              sizes="(min-width: 1024px) 102px, 64px"
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px] lg:flex-none lg:gap-[6px] lg:text-center">
                        <p className="text-[15px] font-medium leading-[21px] text-navy lg:text-[19px] lg:font-normal lg:leading-[26px]">
                          {it.name}
                        </p>
                        {it.result ? (
                          <p className="text-[13px] font-semibold leading-[20px] text-crimson">{it.result}</p>
                        ) : (
                          <span aria-hidden className="h-[20px] lg:hidden" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
