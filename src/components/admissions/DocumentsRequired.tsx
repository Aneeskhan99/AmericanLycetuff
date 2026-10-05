import { Rich } from "@/components/site/Rich";
import type { PageContent } from "@/lib/content";
import type { admissionsPage } from "@/content/admissions";
import { Container, sectionX } from "./ui";

type Props = { content: PageContent<typeof admissionsPage>["documents"] };

function Check() {
  return (
    <span aria-hidden className="relative size-11 shrink-0 overflow-hidden bg-[#d9d9d9]">
      <span className="absolute left-[11px] top-[3px] text-[28px] font-bold leading-[normal] text-crimson">✓</span>
    </span>
  );
}

export default function DocumentsRequired({ content: c }: Props) {
  const documents = c.items.map((d) => ({ text: d.text, tag: d.tag.trim() }));
  // Mobile shows each tag once, as a crimson bar under the list.
  const tags = [...new Set(documents.map((d) => d.tag).filter(Boolean))];

  return (
    <section aria-labelledby="documents-title" className={`bg-white py-14 lg:pb-[129px] lg:pt-[130px] ${sectionX}`}>
      <Container className="lg:flex lg:items-start">
        {/* Crimson panel */}
        <div className="relative flex flex-col items-center overflow-hidden bg-crimson p-6 text-center text-white lg:block lg:h-[640px] lg:w-[clamp(420px,29.17vw,560px)] lg:shrink-0 lg:px-16 lg:pb-0 lg:pt-[70px] lg:text-left">
          <span
            aria-hidden
            className="pointer-events-none absolute right-[30px] top-[180px] hidden text-[420px] font-bold leading-[normal] text-white opacity-10 lg:block"
          >
            ✓
          </span>
          <p className="relative text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-[#fd0] lg:text-[13.1px] lg:leading-[normal] lg:tracking-[2px]">
            {c.eyebrow}
          </p>
          <h2
            id="documents-title"
            className="relative mt-[14px] text-[32px] font-normal leading-[36px] tracking-[-0.5px] lg:mt-5 lg:max-w-[420px] lg:text-[clamp(48px,3.34vw,64px)] lg:leading-[1.125] lg:tracking-[-1px]"
          >
            <Rich text={c.heading} />
          </h2>
          <span aria-hidden className="mt-2 text-[36px] font-bold leading-[40px] lg:hidden">
            ✓
          </span>
          <span aria-hidden className="relative mt-5 hidden h-[3px] w-[60px] bg-[#fd0] lg:block" />
        </div>

        {/* Checklist */}
        {documents.length > 0 && (
          <div className="mt-8 lg:ml-[clamp(40px,4.64vw,89px)] lg:mt-0 lg:min-w-0 lg:flex-1">
            <ul className="bg-[#f8f8f8] px-5 py-2 lg:border-t lg:border-solid lg:border-[#d6d6d6] lg:bg-transparent lg:p-0">
              {documents.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 border-b border-solid border-[#d6d6d6] py-[14px] last:border-b-0 lg:min-h-[128px] lg:gap-9 lg:py-[26px] lg:last:border-b"
                >
                  <Check />
                  <span className="min-w-0 flex-1 text-[20px] leading-[31px] text-navy lg:max-w-[640px] lg:text-[24px] lg:leading-[34px]">
                    {d.text}
                  </span>
                  {d.tag && (
                    <span className="ml-auto mr-4 hidden shrink-0 self-start bg-crimson px-4 py-[10px] text-[14px] font-medium leading-[normal] text-white lg:mt-4 lg:inline-flex">
                      {d.tag}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {tags.map((t) => (
              <p
                key={t}
                className="flex items-center justify-center bg-crimson px-4 py-[13px] text-center text-[14px] font-medium leading-[normal] text-white lg:hidden"
              >
                {t}
              </p>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
