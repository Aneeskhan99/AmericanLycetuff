import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsHero from "@/components/site/news/NewsHero";
import NewsListing from "@/components/site/news/NewsListing";
import { newsPage } from "@/content/news";
import { getPageContent } from "@/lib/content-server";
import { getCategory, getNewsCategories, getPosts } from "@/lib/public/news";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getNewsCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategory((await params).slug);
  if (!cat) return { title: "News & Blog" };
  return {
    title: `${cat.name}: News & Blog`,
    description: `News and stories about ${cat.name.toLowerCase()} from American Lycetuff Swabi.`,
    alternates: { canonical: `/news/category/${cat.slug}` },
  };
}

export default async function NewsCategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const [c, categories, { posts, pages, total }] = await Promise.all([getPageContent(newsPage), getNewsCategories(), getPosts(1, cat.slug)]);
  return (
    <>
      <NewsHero eyebrow={c.hero.eyebrow} heading={`*${cat.name}*`} intro={`${total} ${total === 1 ? "story" : "stories"}, newest first.`} />
      <NewsListing text={c.listing} categories={categories} activeCategory={cat.slug} posts={posts} page={1} pages={pages} base={`/news/category/${cat.slug}`} />
    </>
  );
}
