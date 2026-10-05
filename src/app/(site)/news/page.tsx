import type { Metadata } from "next";
import NewsHero from "@/components/site/news/NewsHero";
import NewsListing from "@/components/site/news/NewsListing";
import { plain } from "@/components/site/Rich";
import { newsPage } from "@/content/news";
import { getPageContent } from "@/lib/content-server";
import { getNewsCategories, getPosts } from "@/lib/public/news";

// Re-render at most every 5 minutes so scheduled posts appear on time.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getPageContent(newsPage);
  return {
    title: "News & Blog",
    description: c.hero.intro,
    alternates: { canonical: "/news" },
    openGraph: { title: `${plain(c.hero.heading)} | American Lycetuff Swabi`, description: c.hero.intro, images: [{ url: c.hero.image.src, alt: c.hero.image.alt }] },
  };
}

export default async function NewsPage() {
  const [c, categories, { posts, pages }] = await Promise.all([getPageContent(newsPage), getNewsCategories(), getPosts(1)]);
  return (
    <>
      <NewsHero eyebrow={c.hero.eyebrow} heading={c.hero.heading} intro={c.hero.intro} image={c.hero.image} />
      <NewsListing text={c.listing} categories={categories} posts={posts} page={1} pages={pages} base="/news" feature />
    </>
  );
}
