import type { Metadata } from "next";
import Albums from "@/components/gallery/Albums";
import CampusTour from "@/components/gallery/CampusTour";
import CategoryNav from "@/components/gallery/CategoryNav";
import FilterView from "@/components/gallery/FilterView";
import GalleryProvider from "@/components/gallery/GalleryProvider";
import Hero from "@/components/gallery/Hero";
import ImageStrip from "@/components/gallery/ImageStrip";
import { parseCategories, toPhoto, type GalleryPhoto } from "@/components/gallery/photos";
import { FullBleedMoment, StoryCampusLife, StoryPortraits, StoryStem } from "@/components/gallery/Stories";
import type { ImageValue } from "@/lib/content";
import { getAlbums, getAlbumTabPhotos, getGalleryContent } from "@/lib/public/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Life at American Lycetuff Swabi: assemblies, experiments, celebrations and everyday moments from our campus, plus a video tour of our classrooms, laboratories and playgrounds.",
};

export default async function GalleryPage() {
  const [{ content: c, meta }, albums, albumPhotos] = await Promise.all([getGalleryContent(), getAlbums(), getAlbumTabPhotos()]);

  // Filter-tab photos: the editable list, then the photos of published albums.
  const listed = c.photos.items
    .filter((p) => p.image.src)
    .map((p, i) => toPhoto(p.image, meta, { id: `photo-${i + 1}`, caption: p.caption, categories: parseCategories(p.categories) }));
  const library = [...listed, ...albumPhotos];

  // Photos of the designed "All" layout. Their id is the src, so a photo shown twice opens
  // at its first place in the sequence; the lightbox label comes from the category list.
  const photo = (img: ImageValue): GalleryPhoto => {
    const match = listed.find((p) => p.src === img.src);
    return toPhoto(img, meta, { categories: match?.categories ?? [], caption: match?.caption });
  };
  const withMeta = (img: ImageValue) => ({ ...img, srcSet: meta[img.src]?.srcSet });

  const hero = { front: photo(c.hero.front), back: photo(c.hero.back) };
  const s1 = { feature: photo(c.story1.feature), sideTop: photo(c.story1.sideTop), sideBottom: photo(c.story1.sideBottom) };
  const s2 = { feature: photo(c.story2.feature), sideTop: photo(c.story2.sideTop), sideBottom: photo(c.story2.sideBottom) };
  const portraits = c.portraits.items.filter((p) => p.image.src).map((p) => ({ photo: photo(p.image), number: p.number, label: p.label, caption: p.caption }));
  const strip = c.strip.photos.filter((p) => p.image.src).map((p) => photo(p.image));

  const sequence = [hero.back, hero.front, s1.feature, s1.sideTop, s1.sideBottom, s2.sideTop, s2.sideBottom, s2.feature, ...portraits.map((p) => p.photo), ...strip];
  const allView = sequence.filter((p, i) => p.src && sequence.findIndex((x) => x.id === p.id) === i);

  return (
    <GalleryProvider allView={allView} library={library}>
      <Hero eyebrow={c.hero.eyebrow} title={c.hero.title} intro={c.hero.intro} background={withMeta(c.hero.background)} {...hero} />
      <CategoryNav intro={c.intro.text} />
      <FilterView>
        <StoryCampusLife {...s1} text={{ number: c.story1.number, label: c.story1.label, caption: c.story1.caption }} />
        <FullBleedMoment background={withMeta(c.moment.background)} lines={[c.moment.line1, c.moment.line2, c.moment.line3]} />
        <StoryStem {...s2} text={{ number: c.story2.number, label: c.story2.label, caption: c.story2.caption }} />
        <StoryPortraits items={portraits} />
        <ImageStrip heading={c.strip.heading} photos={strip} />
      </FilterView>
      <Albums albums={albums} eyebrow={c.albums.eyebrow} heading={c.albums.heading} intro={c.albums.intro} />
      <CampusTour
        eyebrow={c.tour.eyebrow}
        heading={c.tour.heading}
        text={c.tour.text}
        button={c.tour.button}
        poster={withMeta(c.tour.poster)}
        video={c.tour.video}
        note={c.tour.note}
      />
    </GalleryProvider>
  );
}
