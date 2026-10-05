import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { albumDate } from "@/components/gallery/Albums";
import AlbumGrid from "@/components/gallery/AlbumGrid";
import GalleryImage from "@/components/gallery/GalleryImage";
import GalleryProvider from "@/components/gallery/GalleryProvider";
import { labelFor } from "@/components/gallery/photos";
import { getAlbum, getAlbumSlugs, mediaPhoto } from "@/lib/public/gallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAlbumSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = await getAlbum((await params).slug);
  if (!album) return { title: "Album not found" };
  const description = album.description || `${album.count} photos from ${album.title} at American Lycetuff Swabi.`;
  return {
    title: `${album.title} | Gallery`,
    description: description.slice(0, 300),
    alternates: { canonical: `/gallery/${album.slug}` },
    openGraph: album.cover ? { images: [{ url: album.cover.url, alt: album.cover.alt }] } : undefined,
  };
}

export default async function AlbumPage({ params }: Props) {
  const album = await getAlbum((await params).slug);
  if (!album || !album.photos.length) notFound();

  const photos = album.photos.map((p) => mediaPhoto(`p${p.id}`, p.media, { alt: p.media.alt || p.caption || album.title, caption: p.caption }));
  const category = album.category ? labelFor(album.category) : "";
  const date = albumDate(album.eventDate);

  return (
    <GalleryProvider allView={photos} library={photos} label={album.title}>
      <section aria-labelledby="album-title" className="relative overflow-hidden bg-navy-ink">
        {album.cover && (
          <div aria-hidden className="absolute inset-0">
            <GalleryImage src={album.cover.url} srcSet={album.cover.srcSet} alt="" fill preload sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,30,63,0.35)_0%,rgba(8,30,63,0.55)_40%,rgba(8,30,63,0.94)_100%)]" />
          </div>
        )}
        <div className="frame gutter relative">
          <div className="mx-auto flex w-full max-w-[1498px] flex-col items-center py-[64px] text-center text-white lg:min-h-[clamp(440px,31.25vw,600px)] lg:items-start lg:justify-end lg:pb-[80px] lg:pt-[120px] lg:text-left">
            <Link
              href="/gallery#albums"
              className="text-[13px] font-semibold uppercase leading-[20px] tracking-[2px] text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fd0]"
            >
              <span aria-hidden>←</span> Gallery
            </Link>
            <p className="mt-[28px] text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-[#fd0] lg:text-[17.13px] lg:leading-[21px] lg:tracking-[1.9px]">
              {category || "Photo album"}
            </p>
            <h1
              id="album-title"
              className="mt-[20px] text-[40px] font-bold leading-[46px] tracking-[-1px] lg:max-w-[1100px] lg:text-[clamp(56px,4.69vw,90px)] lg:leading-[1.05] lg:tracking-[-0.02em]"
            >
              {album.title}
            </h1>
            {album.description && (
              <p className="mt-[16px] max-w-[760px] text-[18px] leading-[28px] tracking-[0.4px] text-white/90 lg:mt-[24px] lg:text-[22px] lg:leading-[34px] lg:tracking-[0.5px]">
                {album.description}
              </p>
            )}
            <p className="mt-[20px] flex flex-wrap items-center justify-center gap-x-[20px] gap-y-[6px] text-[13px] font-semibold uppercase leading-[20px] tracking-[2px] lg:justify-start">
              {date && (
                <time dateTime={album.eventDate!} className="text-white">
                  {date}
                </time>
              )}
              <span className="text-[#fd0]">
                {album.count} {album.count === 1 ? "photo" : "photos"}
              </span>
            </p>
          </div>
        </div>
      </section>

      <AlbumGrid photos={photos} />

      <section className="frame gutter bg-white">
        <div className="mx-auto flex w-full max-w-[1498px] justify-center pb-[56px] lg:justify-start lg:pb-[110px]">
          <Link
            href="/gallery#albums"
            className="inline-flex w-full items-center justify-center border-2 border-navy px-[30px] py-[15px] text-[17.13px] font-medium uppercase leading-normal tracking-[1.9px] text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson lg:w-auto"
          >
            All albums
          </Link>
        </div>
      </section>
    </GalleryProvider>
  );
}
