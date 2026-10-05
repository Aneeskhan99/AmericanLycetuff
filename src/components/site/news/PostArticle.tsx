import Link from "next/link";
import type { PageContent } from "@/lib/content";
import type { newsPage } from "@/content/news";
import type { PostCard as Card, PostFull } from "@/lib/public/news";
import PostBody from "./PostBody";
import PostCard from "./PostCard";
import { Container, eyebrow, newsDate, SectionHeading } from "./ui";

type Props = { post: PostFull; related: Card[]; text: PageContent<typeof newsPage>["post"] };

/** A single news post: header, featured photo, body, tags and related posts. */
export default function PostArticle({ post, related, text }: Props) {
  return (
    <>
      <article aria-labelledby="post-title" className="bg-white pb-[56px] lg:pb-[120px]">
        <header className="frame gutter pb-[32px] pt-[40px] lg:pb-[56px] lg:pt-[80px]">
          <div className="mx-auto flex max-w-[960px] flex-col items-center text-center">
            <Link
              href="/news"
              className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.98px] text-crimson underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy lg:text-[13.1px] lg:tracking-[2px]"
            >
              <span aria-hidden>← </span>
              {text.backLabel}
            </Link>
            {post.categories.length > 0 && (
              <ul className="mt-[24px] flex flex-wrap justify-center gap-[8px]" aria-label="Categories">
                {post.categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/news/category/${c.slug}`}
                      className={`${eyebrow} inline-flex border border-[#d6d6d6] px-[12px] py-[6px] text-navy transition-colors hover:border-navy`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <h1
              id="post-title"
              className="mt-[20px] text-[34px] font-bold leading-[40px] tracking-[-0.3px] text-navy lg:mt-[28px] lg:text-[clamp(44px,3.2vw,62px)] lg:leading-[1.16] lg:tracking-[-0.8px]"
            >
              {post.title}
            </h1>
            <p className="mt-[18px] flex flex-wrap items-center justify-center gap-x-[12px] gap-y-[4px] text-[16px] leading-[24px] tracking-[0.3px] text-[#5c5c5c] lg:mt-[24px] lg:text-[17px]">
              <time dateTime={post.publishedAt}>{newsDate(post.publishedAt)}</time>
              {post.authorName && (
                <>
                  <span aria-hidden className="size-[4px] rounded-full bg-[#bdbdbd]" />
                  <span>
                    {text.byPrefix} {post.authorName}
                  </span>
                </>
              )}
            </p>
          </div>
        </header>

        {post.image && (
          <div className="frame gutter">
            <figure className="mx-auto max-w-[1200px] border-[6px] border-[#fd0] bg-[#f8f8f8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image.url}
                srcSet={post.image.srcSet || undefined}
                sizes="(min-width: 1280px) 1200px, 100vw"
                alt={post.imageAlt}
                width={post.image.width ?? undefined}
                height={post.image.height ?? undefined}
                fetchPriority="high"
                className="h-auto max-h-[720px] w-full object-cover"
              />
            </figure>
          </div>
        )}

        <div className="frame gutter">
          <div className="mx-auto mt-[36px] max-w-[760px] lg:mt-[64px]">
            <PostBody content={post.content} media={post.bodyMedia} />

            {post.tags.length > 0 && (
              <div className="mt-[40px] border-t border-[#e5e5e5] pt-[24px] lg:mt-[56px] lg:flex lg:items-center lg:gap-[16px]">
                <p className={`${eyebrow} text-black`}>{text.tagsLabel}</p>
                <ul className="mt-[12px] flex flex-wrap gap-[8px] lg:mt-0" aria-label={text.tagsLabel}>
                  {post.tags.map((t) => (
                    <li key={t.slug} className="bg-[#f2f2f2] px-[12px] py-[6px] text-[14px] leading-[18px] text-navy">
                      #{t.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="bg-[#f8f8f8] py-[56px] lg:pb-[130px] lg:pt-[120px]">
          <Container>
            <SectionHeading id="related-title" label={text.relatedEyebrow} heading={text.relatedHeading} />
            <ul className="mt-[24px] grid grid-cols-1 gap-[24px] md:grid-cols-2 xl:grid-cols-3 lg:mt-[56px] lg:gap-[33px]">
              {related.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} tone="white" />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
