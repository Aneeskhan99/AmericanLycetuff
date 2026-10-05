import Link from "next/link";
import type { PostCard as Card } from "@/lib/public/news";
import { eyebrow, newsDate } from "./ui";

/** Card in the news grid: photo, category, date, title, excerpt. The whole card is one link. */
export default function PostCard({ post, tone = "light", headingLevel = 3 }: { post: Card; tone?: "light" | "white"; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image.url}
            srcSet={post.image.srcSet || undefined}
            sizes="(min-width: 1280px) 480px, (min-width: 768px) 50vw, 100vw"
            alt={post.imageAlt}
            width={post.image.width ?? undefined}
            height={post.image.height ?? undefined}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden className="flex size-full flex-col items-start justify-end gap-[14px] p-[24px] lg:p-[32px]">
            <span className="h-[3px] w-[40px] bg-[#fd0]" />
            <span className="text-[13px] font-semibold uppercase tracking-[2px] text-white/70">American Lycetuff</span>
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col p-[24px] lg:p-[32px] ${tone === "white" ? "bg-white" : "bg-[#f8f8f8]"}`}>
        <p className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px] text-[14px] leading-[20px] text-[#5c5c5c]">
          {post.categories[0] && <span className={`${eyebrow} text-crimson`}>{post.categories[0].name}</span>}
          {post.categories[0] && <span aria-hidden className="size-[4px] rounded-full bg-[#bdbdbd]" />}
          <time dateTime={post.publishedAt}>{newsDate(post.publishedAt)}</time>
        </p>
        <H className="mt-[14px] text-[20px] leading-[31px] text-navy lg:text-[clamp(22px,1.3vw,25px)] lg:leading-[34px]">
          <Link
            href={`/news/${post.slug}`}
            className="decoration-crimson decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:underline focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-offset-2 [&:focus-visible]:after:outline-navy"
          >
            {post.title}
          </Link>
        </H>
        {post.excerpt && <p className="mt-[12px] line-clamp-3 text-[15.5px] leading-[25px] text-[#5c5c5c] lg:leading-[24px]">{post.excerpt}</p>}
      </div>
    </article>
  );
}
