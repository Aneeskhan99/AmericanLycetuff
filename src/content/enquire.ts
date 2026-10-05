import { definePage, f } from "@/lib/content";

/**
 * Editable content for /enquire. Values here are the code defaults (see src/lib/content.ts).
 *
 * The phone number and opening hours in the side panel come from Admin → Settings.
 * The enquiry form itself is not edited here.
 */
export const enquirePage = definePage({
  key: "enquire",
  title: "Enquire Now",
  path: "/enquire",
  sections: {
    hero: {
      label: "Hero",
      fields: {
        eyebrow: f.text("Small label above the heading", "Enquire Now"),
        heading: f.textarea("Heading", "Start Your Child's Journey", { rows: 2, hint: "*word* = crimson highlight" }),
        intro: f.textarea(
          "Intro text",
          "Tell us a little about your child, and we'll call you back with everything you need to know: programmes, fees, and a campus visit.",
          { rows: 3 },
        ),
        image: f.image("Background photo", { src: "/images/enquire/hero-campus-entrance.jpg", alt: "" }, { hint: "Decorative: alt text can stay empty" }),
      },
    },
    side: {
      label: "Side panel",
      description: "Next to the form. The phone number and hours come from Settings.",
      fields: {
        heading: f.textarea("Heading", "Prefer to talk?", { rows: 2, hint: "*word* = crimson highlight" }),
        phoneLabel: f.text("Phone label", "Phone"),
        hoursLabel: f.text("Hours label", "Hours"),
        assurances: f.list("Ticked points", { text: f.text("Text", "") }, [
          { text: "No obligation, just answers" },
          { text: "Transparent fees, no hidden costs" },
          { text: "Campus visits - welcome any time" },
        ], { itemTitle: "text", max: 6 }),
        image: f.image("Photo", {
          src: "/images/enquire/side-students-waving.jpg",
          alt: "Smiling students in blue caps and green blazers waving during a campus visit",
        }),
        caption: f.text("Text under the photo", "Campus visits are welcome any time.", { hint: "Leave empty to hide" }),
      },
    },
  },
});
