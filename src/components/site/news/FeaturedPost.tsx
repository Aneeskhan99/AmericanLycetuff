import Link from "next/link";
import type { PostCard } from "@/lib/public/news";
import { btnWhite, eyebrow, newsDate } from "./ui";

/** The newest post, large: photo with the yellow frame + a navy text panel. */
export default function FeaturedPost({ post, label, readMore }: { post: PostCard; label: string; readMore: string }) {
  return (
    <article aria-labelledby={`featured-${post.id}`} className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="relative aspect-[16/10] overflow-hidden border-[6px] border-[#fd0] bg-navy lg:aspect-auto lg:min-h-[480px]">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image.url}
            srcSet={post.image.srcSet || undefined}
            sizes="(min-width: 1024px) 55vw, 100vw"
            alt={post.imageAlt}
            width={post.image.width ?? undefined}
            height={post.image.height ?? undefined}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,#1a2d59_0%,#081e3f_100%)]" />
        )}
      </div>
      <div className="flex flex-col items-center bg-navy px-[24px] py-[40px] text-center text-white lg:items-start lg:px-[clamp(40px,3.4vw,64px)] lg:py-[56px] lg:text-left">
        <p className={`${eyebrow} text-[#fd0]`}>{label}</p>
        <span aria-hidden className="mt-[20px] hidden h-[3px] w-[40px] bg-[#fd0] lg:block" />
        <h2 id={`featured-${post.id}`} className="mt-[16px] text-[30px] font-normal leading-[36px] tracking-[-0.4px] lg:mt-[28px] lg:text-[clamp(34px,2.5vw,48px)] lg:leading-[1.17] lg:tracking-[-0.8px]">
          {post.title}
        </h2>
        <p className="mt-[14px] text-[15px] leading-[23px] tracking-[0.5px] text-white/80 lg:mt-[18px]">
          {post.categories[0] && <>{post.categories[0].name} · </>}
          <time dateTime={post.publishedAt}>{newsDate(post.publishedAt)}</time>
        </p>
        {post.excerpt && <p className="mt-[16px] text-[17px] leading-[28px] text-white/90 lg:mt-[20px] lg:line-clamp-4 lg:text-[18px] lg:leading-[30px]">{post.excerpt}</p>}
        <Link href={`/news/${post.slug}`} className={`${btnWhite} mt-[28px] w-full lg:mt-auto lg:w-auto`}>
          {readMore}
          <span className="sr-only">: {post.title}</span>
        </Link>
      </div>
    </article>
  );
}
