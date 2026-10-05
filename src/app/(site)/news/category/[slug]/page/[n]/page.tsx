import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import NewsHero from "@/components/site/news/NewsHero";
import NewsListing from "@/components/site/news/NewsListing";
import { newsPage } from "@/content/news";
import { getPageContent } from "@/lib/content-server";
import { getCategory, getNewsCategories, getPosts } from "@/lib/public/news";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string; n: string }> };
const pageNo = (n: string) => (/^[1-9]\d{0,4}$/.test(n) ? Number(n) : 0);

export async function generateStaticParams() {
  const out: { slug: string; n: string }[] = [];
  for (const c of await getNewsCategories()) {
    const pages = Math.ceil(c.posts / 12);
    for (let n = 2; n <= pages; n++) out.push({ slug: c.slug, n: String(n) });
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const cat = await getCategory(slug);
  return { title: cat ? `${cat.name}: page ${pageNo(n)}` : "News & Blog", alternates: { canonical: `/news/category/${slug}/page/${pageNo(n)}` } };
}

export default async function NewsCategoryPageN({ params }: Props) {
  const { slug, n: raw } = await params;
  const n = pageNo(raw);
  const cat = await getCategory(slug);
  if (!cat || !n) notFound();
  if (n === 1) redirect(`/news/category/${cat.slug}`);
  const [c, categories, { posts, pages }] = await Promise.all([getPageContent(newsPage), getNewsCategories(), getPosts(n, cat.slug)]);
  if (n > pages) notFound();
  return (
    <>
      <NewsHero eyebrow={c.hero.eyebrow} heading={`*${cat.name}*`} intro={`Page ${n} of ${pages}`} />
      <NewsListing text={c.listing} categories={categories} activeCategory={cat.slug} posts={posts} page={n} pages={pages} base={`/news/category/${cat.slug}`} />
    </>
  );
}
