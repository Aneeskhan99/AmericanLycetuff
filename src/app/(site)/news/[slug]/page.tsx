import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostArticle from "@/components/site/news/PostArticle";
import { newsPage } from "@/content/news";
import { getPageContent } from "@/lib/content-server";
import { getPost, getPostSlugs, getRelated } from "@/lib/public/news";

// Re-render at most every 5 minutes (scheduled posts, edits); publishing from the admin refreshes it at once.
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "News & Blog" };
  const images = post.image ? [{ url: post.image.url, width: post.image.width ?? undefined, height: post.image.height ?? undefined, alt: post.imageAlt }] : undefined;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags.map((t) => t.name),
      images,
    },
    twitter: { card: post.image ? "summary_large_image" : "summary", title: post.title, description: post.excerpt, images: images?.map((i) => i.url) },
  };
}

export default async function NewsPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [c, related] = await Promise.all([getPageContent(newsPage), getRelated(post, 3)]);
  return <PostArticle post={post} related={related} text={c.post} />;
}
