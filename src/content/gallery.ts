import { definePage, f } from "@/lib/content";

/**
 * Editable content for /gallery. Values here are the code defaults (see src/lib/content.ts).
 *
 * The "All" view is the designed story layout (hero, stories, portraits, strip);
 * each of its photos is an image field below. The filter tabs (Campus Tour,
 * Classrooms, …) show the "Photos by category" list plus the photos of every
 * published album in that category (Admin → Gallery).
 */
const img = (file: string, alt: string) => ({ src: `/images/gallery/${file}`, alt });

const CATEGORY_HINT =
  "One or more tabs, separated by commas: Campus Tour, Classrooms, STEM & Robotics, Sports & Events, Cultural Days, Youth Skills Programme.";

export const galleryPage = definePage({
  key: "gallery",
  title: "Gallery",
  path: "/gallery",
  revalidate: ["/gallery", "/gallery/[slug]"],
  sections: {
    hero: {
      label: "Hero",
      fields: {
        eyebrow: f.text("Eyebrow", "Gallery", { max: 60 }),
        title: f.text("Heading", "Life at Campus", { max: 80, hint: "Wrap a word in *stars* to highlight it." }),
        intro: f.textarea("Intro", "Assemblies, experiments, celebrations and everyday moments from our Swabi school.", { max: 240, rows: 2 }),
        background: f.image("Background photo", img("hero-science-lab-tour.jpg", "A guide showing students around a science exhibition")),
        front: f.image("Framed photo (front)", img("hero-students-yellow-caps.jpg", "A student in a yellow cap and green blazer standing with classmates")),
        back: f.image("Framed photo (back)", img("hero-school-building-group.jpg", "Students and staff gathered in front of the American Lycetuff school building")),
      },
    },
    intro: {
      label: "Category tabs",
      description: "The line above the filter tabs. The tab names are fixed.",
      fields: {
        text: f.textarea("Intro line", "Photos and videos from our campus. For the full picture, come and visit.", { max: 200, rows: 2 }),
      },
    },
    story1: {
      label: "Story 01 (Campus life)",
      fields: {
        feature: f.image("Large photo", img("campus-cultural-dance.jpg", "Young students in traditional dress dancing with coloured scarves at a cultural day")),
        sideTop: f.image("Side photo (top)", img("campus-students-blue-caps.jpg", "Students in blue caps and green blazers cheering together on campus")),
        sideBottom: f.image("Side photo (bottom)", img("campus-students-green-day.jpg", "Two students in green caps and blazers at a green day celebration")),
        number: f.text("Number", "01", { max: 4 }),
        label: f.text("Label", "Campus life", { max: 60 }),
        caption: f.text("Caption", "[Caption to be added]", { max: 160 }),
      },
    },
    moment: {
      label: "Full-width moment",
      fields: {
        background: f.image("Background photo", img("moment-graduation-gowns.jpg", "Young graduates in red gowns and caps holding their scrolls at the graduation ceremony")),
        line1: f.text("Line 1", "Assemblies.", { max: 30 }),
        line2: f.text("Line 2 (outlined)", "Experiments.", { max: 30 }),
        line3: f.text("Line 3", "Celebrations.", { max: 30 }),
      },
    },
    story2: {
      label: "Story 02 (STEM & Robotics)",
      fields: {
        sideTop: f.image("Side photo (top)", img("stem-microscope-lab.png", "A microscope and glassware on the bench of the science laboratory")),
        sideBottom: f.image("Side photo (bottom)", img("stem-computer-lab.png", "Rows of desktop computers in the school computer lab")),
        feature: f.image("Large photo", img("stem-chemistry-lab.png", "Chemistry lab bench with flasks, test tubes and a microscope in front of chalkboards")),
        number: f.text("Number", "02", { max: 4 }),
        label: f.text("Label", "STEM & Robotics", { max: 60 }),
        caption: f.text("Caption", "[Caption to be added]", { max: 160 }),
      },
    },
    portraits: {
      label: "Portraits (03 to 05)",
      fields: {
        items: f.list(
          "Portraits",
          {
            image: f.image("Photo", { src: "", alt: "" }),
            number: f.text("Number", "", { max: 4 }),
            label: f.text("Label", "", { max: 60 }),
            caption: f.text("Caption", "", { max: 160 }),
          },
          [
            { image: img("campus-cultural-dance.jpg", "Young students in traditional dress dancing with coloured scarves at a cultural day"), number: "03", label: "Cultural Days", caption: "[Caption to be added]" },
            { image: img("sports-trophy.jpg", "A student holding the championship trophy on stage"), number: "04", label: "Sports & Events", caption: "[Caption to be added]" },
            { image: img("campus-students-blue-caps.jpg", "Students in blue caps and green blazers cheering together on campus"), number: "05", label: "Youth Skills Programme", caption: "[Caption to be added]" },
          ],
          { itemTitle: "label", min: 1, max: 6 },
        ),
      },
    },
    strip: {
      label: "Everyday moments (scrolling strip)",
      fields: {
        heading: f.text("Heading", "Everyday moments", { max: 60 }),
        photos: f.list(
          "Photos",
          { image: f.image("Photo", { src: "", alt: "" }) },
          [
            { image: img("strip-fusion-day.jpg", "Students in blue caps with bunting and pom-poms at the Fusion day celebration") },
            { image: img("strip-makerspace.png", "The makerspace with wooden workbenches, stools and storage bins") },
            { image: img("strip-students-red-caps.jpg", "Smiling students in red caps and green blazers at a school event") },
            { image: img("strip-science-lab.png", "Science classroom with lab equipment, a periodic table and chalkboards") },
            { image: img("strip-storm-chasers.jpg", "The Storm Chasers house team with red balloons at sports day") },
            { image: img("strip-trophy-celebration.jpg", "Students in red caps celebrating with the trophy in front of the American Lycetuff sign") },
          ],
          { min: 1, max: 18 },
        ),
      },
    },
    photos: {
      label: "Photos by category (filter tabs)",
      description: "What each filter tab shows, before the photos of published albums in that category.",
      fields: {
        items: f.list(
          "Photos",
          {
            image: f.image("Photo", { src: "", alt: "" }),
            caption: f.text("Caption", "", { max: 200, hint: "Shown in the photo viewer. Leave empty to use the alt text." }),
            categories: f.text("Tabs", "", { max: 160, hint: CATEGORY_HINT }),
          },
          [
            { image: img("hero-school-building-group.jpg", "Students and staff gathered in front of the American Lycetuff school building"), caption: "", categories: "Campus Tour" },
            { image: img("hero-students-yellow-caps.jpg", "A student in a yellow cap and green blazer standing with classmates"), caption: "", categories: "Youth Skills Programme, Cultural Days" },
            { image: img("campus-cultural-dance.jpg", "Young students in traditional dress dancing with coloured scarves at a cultural day"), caption: "", categories: "Cultural Days" },
            { image: img("campus-students-blue-caps.jpg", "Students in blue caps and green blazers cheering together on campus"), caption: "", categories: "Youth Skills Programme, Campus Tour" },
            { image: img("campus-students-green-day.jpg", "Two students in green caps and blazers at a green day celebration"), caption: "", categories: "Cultural Days" },
            { image: img("stem-microscope-lab.png", "A microscope and glassware on the bench of the science laboratory"), caption: "", categories: "STEM & Robotics, Classrooms" },
            { image: img("stem-computer-lab.png", "Rows of desktop computers in the school computer lab"), caption: "", categories: "STEM & Robotics, Classrooms, Campus Tour" },
            { image: img("stem-chemistry-lab.png", "Chemistry lab bench with flasks, test tubes and a microscope in front of chalkboards"), caption: "", categories: "STEM & Robotics, Classrooms" },
            { image: img("sports-trophy.jpg", "A student holding the championship trophy on stage"), caption: "", categories: "Sports & Events" },
            { image: img("strip-fusion-day.jpg", "Students in blue caps with bunting and pom-poms at the Fusion day celebration"), caption: "", categories: "Cultural Days, Sports & Events" },
            { image: img("strip-makerspace.png", "The makerspace with wooden workbenches, stools and storage bins"), caption: "", categories: "STEM & Robotics, Classrooms, Campus Tour" },
            { image: img("strip-students-red-caps.jpg", "Smiling students in red caps and green blazers at a school event"), caption: "", categories: "Sports & Events, Youth Skills Programme" },
            { image: img("strip-science-lab.png", "Science classroom with lab equipment, a periodic table and chalkboards"), caption: "", categories: "Classrooms, STEM & Robotics, Campus Tour" },
            { image: img("strip-storm-chasers.jpg", "The Storm Chasers house team with red balloons at sports day"), caption: "", categories: "Sports & Events" },
            { image: img("strip-trophy-celebration.jpg", "Students in red caps celebrating with the trophy in front of the American Lycetuff sign"), caption: "", categories: "Sports & Events" },
            { image: img("hero-science-lab-tour.jpg", "A guide showing students around a science exhibition"), caption: "", categories: "STEM & Robotics, Campus Tour" },
            { image: img("moment-graduation-gowns.jpg", "Young graduates in red gowns and caps holding their scrolls at the graduation ceremony"), caption: "", categories: "Sports & Events" },
          ],
          { max: 200 },
        ),
      },
    },
    albums: {
      label: "Albums section",
      description: "Shown near the end of the page when at least one album is published (Admin → Gallery).",
      fields: {
        eyebrow: f.text("Eyebrow", "Albums", { max: 60 }),
        heading: f.text("Heading", "Photo *Albums*", { max: 80, hint: "Wrap a word in *stars* to highlight it." }),
        intro: f.textarea("Intro", "Every event, day out and celebration, collected in one place.", { max: 240, rows: 2 }),
      },
    },
    tour: {
      label: "Campus tour",
      fields: {
        eyebrow: f.text("Eyebrow", "Campus tour", { max: 60 }),
        heading: f.text("Heading", "Take the *Campus Tour*", { max: 80, hint: "Wrap a word in *stars* to highlight it." }),
        text: f.textarea("Text", "A walk through our classrooms, laboratories and playgrounds.", { max: 240, rows: 2 }),
        button: f.link("Button", { label: "Book a campus visit", href: "/enquire" }),
        poster: f.image("Video cover photo", img("hero-school-building-group.jpg", "")),
        video: f.text("Video file URL", "/videos/gallery-campus-tour.mp4", { max: 300, hint: "An MP4 link (for example from the media library or /videos/…)." }),
        note: f.text("Label on the cover", "Video to be added", { max: 60, hint: "Leave empty to hide it." }),
      },
    },
  },
});
