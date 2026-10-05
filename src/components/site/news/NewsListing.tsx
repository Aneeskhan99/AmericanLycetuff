import type { PageContent } from "@/lib/content";
import type { newsPage } from "@/content/news";
import type { NewsCategory, PostCard as Card } from "@/lib/public/news";
import FeaturedPost from "./FeaturedPost";
import Pager from "./Pager";
import PostCard from "./PostCard";
import { Chip, Container, SectionHeading } from "./ui";

type Props = {
  text: PageContent<typeof newsPage>["listing"];
  categories: NewsCategory[];
  activeCategory?: string;
  posts: Card[];
  page: number;
  pages: number;
  /** Base path for pagination: "/news" or "/news/category/<slug>". */
  base: string;
  /** Show the newest post large (page 1 of /news). */
  feature?: boolean;
};

/** Category links, featured post, grid of cards, pagination and the empty state. */
export default function NewsListing({ text, categories, activeCategory, posts, page, pages, base, feature }: Props) {
  const [first, ...rest] = posts;
  const grid = feature && first ? rest : posts;
  return (
    <section aria-label="News posts" className="bg-white pb-[56px] lg:pb-[130px]">
      <Container>
        {categories.length > 0 && (
          <nav aria-label="News categories" className="border-t border-[#e5e5e5] pt-[24px] lg:flex lg:items-center lg:gap-[24px] lg:pt-[32px]">
            <p className="text-center text-[13px] font-semibold uppercase leading-[20px] tracking-[1.98px] text-black lg:shrink-0 lg:text-left lg:text-[13.1px] lg:tracking-[2px]">
              {text.topicsLabel}
            </p>
            <ul className="no-scrollbar -mx-[24px] mt-[14px] flex gap-[8px] overflow-x-auto px-[24px] lg:mx-0 lg:mt-0 lg:flex-wrap lg:gap-[10px] lg:overflow-visible lg:px-0">
              <li className="shrink-0"><Chip href="/news" active={!activeCategory}>{text.allLabel}</Chip></li>
              {categories.map((c) => (
                <li key={c.id} className="shrink-0">
                  <Chip href={`/news/category/${c.slug}`} active={activeCategory === c.slug}>{c.name}</Chip>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {posts.length === 0 ? (
          <div className="mt-[32px] flex flex-col items-center bg-[#f8f8f8] px-[24px] py-[56px] text-center lg:mt-[56px] lg:py-[96px]">
            <span aria-hidden className="h-[3px] w-[40px] bg-[#fd0]" />
            <h2 className="mt-[20px] text-[28px] leading-[34px] text-navy lg:text-[36px] lg:leading-[44px]">{text.emptyTitle}</h2>
            <p className="mt-[12px] max-w-[520px] text-[17px] leading-[28px] text-[#5c5c5c]">{text.emptyText}</p>
          </div>
        ) : (
          <>
            {feature && first && (
              <div className="mt-[32px] lg:mt-[56px]">
                <FeaturedPost post={first} label={text.latestLabel} readMore={text.readMore} />
              </div>
            )}
            {grid.length > 0 && (
              <>
                {feature && <SectionHeading id="news-more-title" label={text.moreEyebrow} heading={text.moreHeading} className="mt-[56px] lg:mt-[120px]" />}
                <ul className={`grid grid-cols-1 gap-[24px] md:grid-cols-2 xl:grid-cols-3 lg:gap-[33px] ${feature ? "mt-[24px] lg:mt-[56px]" : "mt-[32px] lg:mt-[56px]"}`}>
                  {grid.map((p) => (
                    <li key={p.id}>
                      <PostCard post={p} />
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Pager base={base} page={page} pages={pages} />
          </>
        )}
      </Container>
    </section>
  );
}
