import { definePage, f } from "@/lib/content";

/** Editable content for /downloads. Values here are the code defaults (see src/lib/content.ts). */
export const downloadsPage = definePage({
  key: "downloads",
  title: "Downloads (page text)",
  path: "/downloads",
  sections: {
    hero: {
      label: "Hero",
      fields: {
        eyebrow: f.text("Eyebrow", "Downloads", { max: 60 }),
        title: f.text("Heading", "Forms & *documents*", { max: 90, hint: "Wrap a word in *stars* to highlight it." }),
        intro: f.textarea(
          "Intro",
          "The prospectus, fee structure, admission form, uniform list and results, ready to download and print.",
          { max: 300, rows: 3 },
        ),
      },
    },
    list: {
      label: "File list",
      description: "The files themselves are managed in Admin → Downloads.",
      fields: {
        button: f.text("Button label", "Download", { max: 30 }),
        empty: f.text("Text when there are no files yet", "No documents to download yet. Please check back soon.", { max: 160 }),
        help: f.textarea("Help line under the list", "Can’t find what you need? Call the school office or send us a message and we’ll share it with you.", { max: 300, rows: 2 }),
        helpLink: f.link("Help link", { label: "Contact us", href: "/contact" }),
      },
    },
  },
});
