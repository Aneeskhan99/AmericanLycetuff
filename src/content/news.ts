import { definePage, f } from "@/lib/content";

/**
 * Editable content for /news (and the text around posts on /news/<slug>).
 * Values here are the code defaults (see src/lib/content.ts). The posts themselves
 * are managed in Admin → News & Blog.
 * Headings: *word* = crimson highlight, a new line = line break.
 */
export const newsPage = definePage({
  key: "news",
  title: "News & Blog (page text)",
  path: "/news",
  revalidate: ["/news", "/news/[slug]", "/news/category/[slug]"],
  sections: {
    hero: {
      label: "Hero",
      description: "Top of the News page and the category pages.",
      fields: {
        eyebrow: f.text("Small label above the heading", "News & Blog"),
        heading: f.textarea("Heading", "Life on *Campus*", { rows: 2, hint: "*word* = crimson highlight" }),
        intro: f.textarea(
          "Intro text",
          "Achievements, events and everyday moments from American Lycetuff Swabi, shared by our teachers and students.",
          { rows: 3 },
        ),
        image: f.image("Photo", {
          src: "/images/gallery/hero-students-yellow-caps.jpg",
          alt: "American Lycetuff students in yellow caps gathered on campus",
        }),
      },
    },
    listing: {
      label: "List of posts",
      fields: {
        topicsLabel: f.text("Label before the category links", "Browse by topic"),
        allLabel: f.text("First category link (all posts)", "All news"),
        latestLabel: f.text("Label on the newest post", "Latest story"),
        moreEyebrow: f.text("Small label above the grid", "From the school"),
        moreHeading: f.textarea("Heading above the grid", "More *Stories*", { rows: 2, hint: "*word* = crimson highlight" }),
        readMore: f.text("Read more link", "Read story"),
        emptyTitle: f.text("Message when there are no posts", "No news yet"),
        emptyText: f.textarea("Text under that message", "Stories from campus will appear here soon. Please check back.", { rows: 2 }),
      },
    },
    post: {
      label: "Single post page",
      fields: {
        backLabel: f.text("Back link", "All news"),
        byPrefix: f.text("Text before the author's name", "By"),
        tagsLabel: f.text("Label before the tags", "Tags"),
        relatedEyebrow: f.text("Small label above related posts", "Keep reading"),
        relatedHeading: f.textarea("Heading above related posts", "More from *Campus*", { rows: 2, hint: "*word* = crimson highlight" }),
      },
    },
  },
});
