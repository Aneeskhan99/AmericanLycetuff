/**
 * Gallery photo model. The photos themselves are editable (src/content/gallery.ts,
 * Admin → Pages → Gallery) and albums come from Admin → Gallery; this file holds
 * the fixed filter tabs and the helpers that turn content into lightbox photos.
 * Shared by the server page and the client components (no server-only imports).
 */
import type { ImageValue } from "@/lib/content";

export type CategoryId =
  | "campus-tour"
  | "classrooms"
  | "stem-robotics"
  | "sports-events"
  | "cultural-days"
  | "youth-skills";

export type FilterId = "all" | CategoryId;

/** `hidden` tabs stay valid categories (albums, tab lists) but are not shown as filter tabs. */
export const filters: { id: FilterId; label: string; hidden?: boolean }[] = [
  { id: "all", label: "All" },
  { id: "campus-tour", label: "Campus Tour" },
  { id: "classrooms", label: "Classrooms" },
  { id: "stem-robotics", label: "STEM & Robotics" },
  { id: "sports-events", label: "Sports & Events" },
  { id: "cultural-days", label: "Cultural Days" },
  { id: "youth-skills", label: "Youth Skills Programme", hidden: true },
];

export const CATEGORY_IDS = filters.filter((f) => f.id !== "all").map((f) => f.id as CategoryId);
export const isCategoryId = (v: unknown): v is CategoryId => CATEGORY_IDS.includes(v as CategoryId);

export type GalleryPhoto = {
  id: string;
  src: string;
  /** Set for media-library images (rendered with a plain <img srcset>). */
  srcSet?: string;
  alt: string;
  width: number;
  height: number;
  categories: CategoryId[];
  /** Shown under the photo in the lightbox (falls back to alt). */
  caption?: string;
  /** Overrides the category label in the lightbox (e.g. the album title). */
  label?: string;
};

/** Size + srcset of an image, keyed by its src. */
export type ImageMeta = Record<string, { width: number; height: number; srcSet?: string }>;

/** Intrinsic sizes of the designed photos shipped in /public/images/gallery. */
export const STATIC_META: ImageMeta = {
  "/images/gallery/hero-students-red-caps-cheering.jpg": { width: 2344, height: 1552 },
  "/images/gallery/hero-girl-green-dress.jpg": { width: 1560, height: 2344 },
  "/images/gallery/hero-boy-red-ribbons.jpg": { width: 1552, height: 2344 },
  "/images/gallery/campus-kindergarten-playhouse.jpg": { width: 2400, height: 1350 },
  "/images/gallery/campus-kindergarten-lawn-play.jpg": { width: 2400, height: 1350 },
  "/images/gallery/campus-play-learn-classroom.jpg": { width: 2400, height: 1800 },
  "/images/gallery/moment-morning-assembly.jpg": { width: 2400, height: 1800 },
  "/images/gallery/stem-coding-computer-lab.jpg": { width: 2400, height: 1800 },
  "/images/gallery/stem-circuit-breadboard.jpg": { width: 2400, height: 1350 },
  "/images/gallery/stem-group-study.jpg": { width: 2400, height: 1350 },
  "/images/gallery/strip-blue-team-parade.jpg": { width: 2344, height: 1552 },
  "/images/gallery/strip-cultural-dress-children.jpg": { width: 2344, height: 1552 },
  "/images/gallery/strip-assessment-certificates.jpg": { width: 2400, height: 1800 },
  "/images/gallery/strip-helicopter-visit.jpg": { width: 2400, height: 1688 },
  "/images/gallery/strip-field-trip-monument.jpg": { width: 2400, height: 1350 },
  "/images/gallery/strip-junior-classroom.jpg": { width: 2400, height: 1800 },
  "/images/gallery/tour-campus-aerial.jpg": { width: 1440, height: 1080 },
  "/images/gallery/campus-cultural-dance.jpg": { width: 4024, height: 2696 },
  "/images/gallery/campus-students-blue-caps.jpg": { width: 4024, height: 2696 },
  "/images/gallery/campus-students-green-day.jpg": { width: 4024, height: 2696 },
  "/images/gallery/stem-microscope-lab.png": { width: 626, height: 417 },
  "/images/gallery/stem-computer-lab.png": { width: 1199, height: 798 },
  "/images/gallery/stem-chemistry-lab.png": { width: 1199, height: 839 },
  "/images/gallery/sports-trophy.jpg": { width: 4024, height: 2696 },
  "/images/gallery/strip-fusion-day.jpg": { width: 4024, height: 2696 },
  "/images/gallery/strip-makerspace.png": { width: 1200, height: 900 },
  "/images/gallery/strip-students-red-caps.jpg": { width: 4024, height: 2696 },
  "/images/gallery/strip-science-lab.png": { width: 736, height: 515 },
  "/images/gallery/strip-storm-chasers.jpg": { width: 4024, height: 2696 },
  "/images/gallery/strip-trophy-celebration.jpg": { width: 4024, height: 2696 },
  "/images/gallery/hero-school-building-group.jpg": { width: 4024, height: 2696 },
  "/images/gallery/hero-students-yellow-caps.jpg": { width: 4024, height: 2696 },
  "/images/gallery/hero-science-lab-tour.jpg": { width: 1600, height: 1064 },
  "/images/gallery/moment-graduation-gowns.jpg": { width: 4096, height: 2731 },
};

/** "STEM & Robotics, classrooms" → ["stem-robotics", "classrooms"] (labels or ids, any case). */
export function parseCategories(text: string): CategoryId[] {
  const out: CategoryId[] = [];
  for (const raw of text.split(/[,;\n]/)) {
    const t = raw.trim().toLowerCase();
    if (!t) continue;
    const hit = filters.find((f) => f.id !== "all" && (f.id === t || f.label.toLowerCase() === t));
    if (hit && !out.includes(hit.id as CategoryId)) out.push(hit.id as CategoryId);
  }
  return out;
}

export function labelFor(id: CategoryId | undefined): string {
  return filters.find((f) => f.id === id)?.label ?? "";
}

/** A content image as a lightbox photo. */
export function toPhoto(image: ImageValue, meta: ImageMeta, extra: Partial<GalleryPhoto> = {}): GalleryPhoto {
  const m = meta[image.src] ?? STATIC_META[image.src] ?? { width: 1600, height: 1067 };
  return {
    id: image.src,
    src: image.src,
    ...(m.srcSet ? { srcSet: m.srcSet } : {}),
    alt: image.alt,
    width: m.width,
    height: m.height,
    categories: [],
    ...extra,
  };
}

/** What the client gallery needs: the "All" sequence and the photos behind the filter tabs. */
export type GalleryLibrary = { allView: GalleryPhoto[]; library: GalleryPhoto[] };

export function photosFor(filter: FilterId, lib: GalleryLibrary): GalleryPhoto[] {
  if (filter === "all") return lib.allView;
  return lib.library.filter((photo) => photo.categories.includes(filter));
}
