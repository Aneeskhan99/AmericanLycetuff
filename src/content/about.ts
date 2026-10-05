import { definePage, f } from "@/lib/content";

const HEADING_HINT = "Put *stars* around the words to show in crimson. Press Enter for a line break.";
const BUTTON_HINT = "Leave the label empty to hide the button.";

/** Editable content for /about. Values here are the code defaults (see src/lib/content.ts). */
export const aboutPage = definePage({
  key: "about",
  title: "About Us",
  path: "/about",
  sections: {
    hero: {
      label: "Hero (top of page)",
      description: "Large campus photo with the page title, the button and the three crimson number cards.",
      fields: {
        eyebrow: f.text("Small label above the title", "About us", { max: 60 }),
        heading: f.text("Page title", "A National School with a Local Heart", { max: 90 }),
        intro: f.textarea(
          "Intro text",
          "Twenty-seven years of academic tradition, now serving the families of Swabi.",
          {
            rows: 3,
            max: 240,
          },
        ),
        button: f.link("Button", { label: "Book a campus visit", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
        image: f.image(
          "Background photo",
          {
            src: "/images/about/hero-campus-assembly.jpg",
            alt: "Students and families gathered in front of the American Lycetuff Swabi campus building for a school event",
          },
          { hint: "A wide landscape photo works best; the left side sits behind the text." },
        ),
        stats: f.list(
          "Number cards",
          {
            value: f.text("Big number or word", "", {
              max: 12,
              hint: "Longer values (6+ characters) are shown slightly smaller.",
            }),
            label: f.text("Caption", "", { max: 60 }),
          },
          [
            { value: "1999", label: "American Lycetuff begins" },
            { value: "27 years", label: "Of academic tradition" },
            { value: "70+", label: "Campuses across Pakistan" },
          ],
          { itemTitle: "value", max: 4, hint: "Three cards fit the design best." },
        ),
      },
    },
    story: {
      label: "Our Story",
      description: "Story text with the photo, followed by the timeline.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Our Story", { max: 60 }),
        heading: f.text("Heading", "From One Institution to *70+ Campuses*", { max: 120, hint: HEADING_HINT }),
        body: f.textarea(
          "First paragraph",
          "American Lycetuff began in 1999 as a single institution with a simple belief: every child deserves a school that expects the best of them and gives them the tools to deliver it. That belief has since grown into a network of more than 70 campuses across Pakistan.",
          { rows: 5, max: 900 },
        ),
        body2: f.textarea(
          "Second paragraph",
          "Our Swabi campus in Shahmansoor Township carries the same standard to this district. It is owned and run by a local management team that understands the aspirations of Swabi's families, and it is supported by the experience, curriculum, and mentoring programme of the wider American Lycetuff system.",
          { rows: 5, max: 900, hint: "Leave empty to show only the first paragraph." },
        ),
        image: f.image("Photo (with crimson frame)", {
          src: "/images/about/story-students-bouquets.jpg",
          alt: "Young American Lycetuff Swabi students holding bouquets in front of the school banner",
        }),
        milestones: f.list(
          "Timeline",
          {
            year: f.text("Year or big word", "", { max: 14 }),
            label: f.text("Small crimson label", "", { max: 60 }),
            text: f.textarea("Description", "", { rows: 2, max: 200 }),
          },
          [
            {
              year: "1999",
              label: "One institution",
              text: "A single school built on one belief: every child deserves to be expected to do their best.",
            },
            {
              year: "70+",
              label: "Campuses across Pakistan",
              text: "A national network sharing curriculum, mentoring and standards.",
            },
            {
              year: "Swabi",
              label: "Shahmansoor Township",
              text: "A locally owned and run campus, supported by the wider American Lycetuff system.",
            },
          ],
          { itemTitle: "year", max: 8 },
        ),
      },
    },
    statement: {
      label: "“Strive for the highest” banner",
      description: "Navy band with the large two-line statement and a photo.",
      fields: {
        line1: f.text("First line (white)", "Strive for the", { max: 30 }),
        line2: f.text("Second line (yellow handwriting)", "highest.", { max: 20 }),
        image: f.image("Photo", {
          src: "/images/about/statement-students-frame.jpg",
          alt: "Three smiling American Lycetuff students in red caps posing behind a photo frame",
        }),
      },
    },
    visionMission: {
      label: "Vision & Mission",
      description: "Coloured cards (navy, crimson, navy, …).",
      fields: {
        cards: f.list(
          "Cards",
          {
            title: f.text("Card title", "", { max: 40 }),
            text: f.textarea("Statement", "", { rows: 4, max: 400 }),
          },
          [
            {
              title: "Our Vision",
              text: "To be the school Swabi’s families trust to take their children from their first day at Play Group to the confident, capable young adults they are meant to become.",
            },
            {
              title: "Our Mission",
              text: "To give every student a strong academic foundation, sound character, and practical skills, through excellent teaching, modern laboratories, and a caring school community.",
            },
          ],
          { itemTitle: "title", max: 4 },
        ),
      },
    },
    values: {
      label: "Our Values",
      description: "Numbered values (01, 02, …) shown as a staircase on desktop. Numbers are added automatically.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Our values", { max: 60 }),
        heading: f.text("Heading", "What We *Stand For*", { max: 100, hint: HEADING_HINT }),
        items: f.list(
          "Values",
          {
            title: f.text("Value", "", { max: 40 }),
            text: f.textarea("Description", "", { rows: 3, max: 240 }),
          },
          [
            { title: "Excellence", text: "High expectations, supported by teachers who help every child reach them." },
            {
              title: "Character",
              text: "Our Tarbiya programme builds honesty, respect, discipline, and responsibility alongside grades.",
            },
            {
              title: "Curiosity",
              text: "Hands-on science, robotics, and coding make students ask “why?” and “what if?”",
            },
            {
              title: "Community",
              text: "We are a school in Swabi, working with parents as partners in each child’s progress.",
            },
          ],
          { itemTitle: "title", max: 8 },
        ),
      },
    },
    why: {
      label: "Why choose us",
      description: "Navy panel with the heading and a grid of reasons with tick marks.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Why choose us", { max: 60 }),
        heading: f.text("Heading", "Why Families Choose Us", { max: 100, hint: HEADING_HINT }),
        reasons: f.list(
          "Reasons",
          { text: f.text("Reason", "", { max: 120 }) },
          [
            { text: "A proven national standard, delivered locally" },
            { text: "FBISE and Cambridge International routes under one roof" },
            { text: "Braintech mental maths and the Tarbiya character programme" },
            { text: "One continuous pathway from Play Group to SSC and Cambridge IGCSE" },
            { text: "STEM, robotics, and computer laboratories on site" },
            { text: "A transparent fee structure with no hidden costs" },
          ],
          {
            itemTitle: "text",
            max: 10,
            hint: "On desktop the reasons fill the left column first, then the right. Six fits the design best.",
          },
        ),
      },
    },
    cta: {
      label: "Closing banner",
      description: "Full-width photo banner at the bottom of the page.",
      fields: {
        eyebrow: f.text("Small yellow label", "Be a part of something larger", { max: 60 }),
        heading: f.text("Heading", "70+ Campuses,\nOne Standard", { max: 100, hint: HEADING_HINT }),
        text: f.textarea(
          "Text",
          "Being part of a national network means shared curriculum support, teacher mentoring, and quality standards, while each campus stays rooted in its own community.",
          { rows: 3, max: 400 },
        ),
        button: f.link("Button", { label: "View our programmes", href: "/academics" }, { hint: BUTTON_HINT }),
        image: f.image(
          "Background photo",
          { src: "/images/about/cta-students-caps.jpg", alt: "" },
          { hint: "Decorative: the description can stay empty." },
        ),
      },
    },
  },
});
