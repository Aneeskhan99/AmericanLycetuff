import { definePage, f } from "@/lib/content";

/** Editable content for /faculty. Values here are the code defaults (see src/lib/content.ts). */
export const facultyPage = definePage({
  key: "faculty",
  title: "Faculty & Staff (page text)",
  path: "/faculty",
  sections: {
    hero: {
      label: "Hero",
      fields: {
        eyebrow: f.text("Eyebrow", "Faculty & staff", { max: 60 }),
        title: f.text("Heading", "The people behind *every lesson*", { max: 90, hint: "Wrap a word in *stars* to highlight it." }),
        intro: f.textarea(
          "Intro",
          "Qualified, caring teachers and staff who know every child by name, from Play Group to the exam hall.",
          { max: 300, rows: 3 },
        ),
        image: f.image("Photo", { src: "/images/academics/cta-early-years-classroom.jpg", alt: "Young students in pink uniforms on the play structure of an early years classroom" }),
      },
    },
    list: {
      label: "Staff list",
      description: "The people themselves are managed in Admin → Faculty & staff.",
      fields: {
        eyebrow: f.text("Label above each department", "Department", { max: 60 }),
        noDepartment: f.text("Group name for staff without a department", "Our team", { max: 60 }),
        empty: f.text("Text when nobody is listed yet", "Our staff profiles are coming soon.", { max: 160 }),
      },
    },
  },
});
