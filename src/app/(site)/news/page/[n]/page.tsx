import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import NewsHero from "@/components/site/news/NewsHero";
import NewsListing from "@/components/site/news/NewsListing";
import { newsPage } from "@/content/news";
import { getPageContent } from "@/lib/content-server";
import { getNewsCategories, getPosts } from "@/lib/public/news";

export const revalidate = 300;

type Props = { params: Promise<{ n: string }> };
const pageNo = (n: string) => (/^[1-9]\d{0,4}$/.test(n) ? Number(n) : 0);

export async function generateStaticParams() {
  const { pages } = await getPosts(1);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = pageNo((await params).n);
  return { title: `News & Blog: page ${n}`, alternates: { canonical: `/news/page/${n}` } };
}

export default async function NewsPageN({ params }: Props) {
  const n = pageNo((await params).n);
  if (n === 1) redirect("/news");
  if (!n) notFound();
  const [c, categories, { posts, pages }] = await Promise.all([getPageContent(newsPage), getNewsCategories(), getPosts(n)]);
  if (n > pages) notFound();
  return (
    <>
      <NewsHero eyebrow={c.hero.eyebrow} heading={c.hero.heading} intro={`Page ${n} of ${pages}`} />
      <NewsListing text={c.listing} categories={categories} posts={posts} page={n} pages={pages} base="/news" />
    </>
  );
}
