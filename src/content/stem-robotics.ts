import { definePage, f } from "@/lib/content";

const HEADING_HINT = "Put *stars* around the words to show in crimson.";
const LINES_HINT = "One per line.";

/** Editable content for /stem-robotics. Values here are the code defaults (see src/lib/content.ts). */
export const stemRoboticsPage = definePage({
  key: "stem-robotics",
  title: "STEM & Robotics",
  path: "/stem-robotics",
  sections: {
    hero: {
      label: "Hero (top of page)",
      description: "Navy banner with the page title, the button and the three-photo collage.",
      fields: {
        eyebrow: f.text("Small label above the title", "STEM & Robotics", { max: 60 }),
        heading: f.text("Page title", "Learning by Building", { max: 80, hint: HEADING_HINT }),
        intro: f.textarea(
          "Intro text",
          "From first circuits to working rovers, our students solve real problems with their hands as well as their heads.",
          { rows: 3, max: 300 },
        ),
        button: f.link(
          "Button",
          { label: "Book a lab visit", href: "/enquire?type=visit" },
          { hint: "Leave the label empty to hide the button." },
        ),
        ribbon: f.textarea("Big words under the hero", "*Build.*\nInvestigate.\nCode.", {
          rows: 3,
          hint: "One word per line. Put *stars* around a word to show it in crimson.",
        }),
        photoMain: f.image("Large photo (left, crimson frame)", {
          src: "/images/stem/hero-building-students-circuit.jpg",
          alt: "Students wiring a breadboard circuit together on a lab desk",
        }),
        photoTop: f.image("Small photo (top right)", {
          src: "/images/stem/hero-programming-lab.jpg",
          alt: "Students working at computers in the robotics and programming lab",
        }),
        photoBottom: f.image("Tall photo (bottom right)", {
          src: "/images/stem/hero-robotics-lab-student.jpg",
          alt: "A student in a blue cap smiling outside the robotics laboratory",
        }),
      },
    },
    why: {
      label: "Why STEM matters",
      description: "Intro text with the S / T / E / M tiles.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Why STEM matters here", { max: 60 }),
        heading: f.text("Heading", "Skills for the world our students will *work in*", { max: 120, hint: HEADING_HINT }),
        body: f.textarea(
          "Paragraph",
          "Science, technology, engineering, and mathematics are no longer optional extras. They are the foundation of nearly every modern career. Our laboratories give students in Swabi a chance to learn these subjects the way they are meant to be learned: by making, testing, failing, and improving.",
          { rows: 5, max: 800 },
        ),
        tiles: f.list(
          "Letter tiles",
          {
            letter: f.text("Big letter", "S", { max: 3 }),
            label: f.text("Word", "Science", { max: 40 }),
          },
          [
            { letter: "S", label: "Science" },
            { letter: "E", label: "Engineering" },
            { letter: "T", label: "Technology" },
            { letter: "M", label: "Mathematics" },
          ],
          { itemTitle: "label", hint: "Shown in two columns on large screens: the first half on the left, the rest on the right.", max: 8 },
        ),
      },
    },
    making: {
      label: "Making, Testing, Failing, Improving",
      description: "The four big words with a photo and caption.",
      fields: {
        words: f.textarea("Big words", "Making.\nTesting.\nFailing.\nImproving.", {
          rows: 4,
          hint: "One per line. Colours follow the order: navy, crimson, outlined, navy.",
        }),
        photo: f.image("Photo", {
          src: "/images/stem/testing-breadboard.jpg",
          alt: "Students testing a breadboard circuit with wires and a battery pack",
        }),
        caption: f.textarea("Photo caption", "Learned the way these subjects are meant to be learned.", { rows: 2, max: 200 }),
      },
    },
    labs: {
      label: "Our three laboratories",
      description: "Section heading, then one full-width block per laboratory.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Inside the lab", { max: 60 }),
        heading: f.text("Heading", "Our *Three Laboratories*", { max: 120, hint: HEADING_HINT }),
        photoNoteLabel: f.text("Label on the photo note cards", "Photo to be added", {
          max: 60,
          hint: "Shown above each laboratory's photo note. Empty a laboratory's photo note to hide its card.",
        }),
        items: f.list(
          "Laboratories",
          {
            title: f.text("Laboratory name", "Robotics Laboratory", { max: 80 }),
            eyebrow: f.text("Small label above the name", "Laboratory 01 — Build", { max: 80 }),
            watermark: f.text("Big faint word", "Build", {
              max: 20,
              hint: "Shown very large behind the photo on desktop and as a heading on mobile.",
            }),
            body: f.textarea("Description", "", { rows: 5, max: 800 }),
            group1Label: f.text("First tag group: label", "", { max: 40 }),
            group1Chips: f.textarea("First tag group: tags", "", { rows: 4, hint: LINES_HINT }),
            group2Label: f.text("Second tag group: label", "", { max: 40 }),
            group2Chips: f.textarea("Second tag group: tags", "", { rows: 5, hint: LINES_HINT }),
            photo: f.image("Photo", { src: "", alt: "" }),
            photoNote: f.textarea("Photo note", "", { rows: 2, max: 160, hint: "Leave empty to hide the note card." }),
          },
          [
            {
              title: "Robotics Laboratory",
              eyebrow: "Laboratory 01 — Build",
              watermark: "Build",
              body: "Students design, assemble, and program working machines. Projects include line-followers, toll booths, and rovers. They learn mechanics, sensors, basic electronics, and logical thinking, and, just as important, teamwork.",
              group1Label: "Projects",
              group1Chips: "Line-followers\nToll booths\nRovers",
              group2Label: "They learn",
              group2Chips: "Mechanics\nSensors\nBasic electronics\nLogical thinking\nTeamwork",
              photo: {
                src: "/images/stem/lab-robotics.jpg",
                alt: "A teacher leading a robotics class while students build projects at their lab benches",
              },
              photoNote: "Students assembling a robot in the Robotics Laboratory",
            },
            {
              title: "Science Laboratory",
              eyebrow: "Laboratory 02 — Investigate",
              watermark: "Investigate",
              body: "Real experiments in Physics, Chemistry, and Biology that turn textbook ideas into understanding. Students learn to observe carefully, record accurately, and draw their own conclusions, which is also what Cambridge and FBISE practical papers require.",
              group1Label: "Experiments in",
              group1Chips: "Physics\nChemistry\nBiology",
              group2Label: "Students learn to",
              group2Chips: "Observe carefully\nRecord accurately\nDraw their own conclusions",
              photo: {
                src: "/images/stem/lab-science.jpg",
                alt: "Students reading an experiment worksheet together during a science practical",
              },
              photoNote: "Students running an experiment in the Science Laboratory",
            },
            {
              title: "Computer & ICT Laboratory",
              eyebrow: "Laboratory 03 — Code",
              watermark: "Code",
              body: "Coding, digital skills, and research for the modern classroom. From typing and presentations in the early grades to programming and problem-solving in the senior years.",
              group1Label: "Early grades",
              group1Chips: "Typing\nPresentations",
              group2Label: "Senior years",
              group2Chips: "Programming\nProblem-solving",
              photo: {
                src: "/images/stem/lab-ict-students-breadboard.jpg",
                alt: "Students gathered around a desk connecting wires on a breadboard kit",
              },
              photoNote: "Students coding in the Computer & ICT Laboratory",
            },
          ],
          { itemTitle: "title", hint: "Colours and photo sides alternate automatically (navy, crimson, blue).", max: 9 },
        ),
      },
    },
    progress: {
      label: "How students progress",
      description: "Timeline of stages, each with a photo and tags.",
      fields: {
        eyebrow: f.text("Small label above the heading", "How students progress", { max: 60 }),
        heading: f.text("Heading", "How Students *Progress*", { max: 120, hint: HEADING_HINT }),
        stages: f.list(
          "Stages",
          {
            title: f.text("Stage name", "Primary", { max: 60 }),
            label: f.text("Small label above the name", "Stage 01", { max: 60 }),
            chips: f.textarea("Tags", "", { rows: 3, hint: LINES_HINT }),
            body: f.textarea("Extra sentence (optional)", "", { rows: 2, max: 300 }),
            photo: f.image("Photo", { src: "", alt: "" }),
          },
          [
            {
              title: "Primary",
              label: "Curious beginnings",
              chips: "Simple experiments\nBasic computer skills\nBuilding with blocks and kits",
              body: "",
              photo: { src: "/images/stem/progress-primary.jpg", alt: "Young students connecting an LED circuit on a breadboard" },
            },
            {
              title: "Middle",
              label: "Stage 02",
              chips: "Structured lab work\nIntroductory coding\nFirst robotics projects",
              body: "",
              photo: { src: "/images/stem/progress-middle.jpg", alt: "A group of middle school students huddled over a robotics kit" },
            },
            {
              title: "Senior",
              label: "Stage 03",
              chips: "Practical exam preparation\nAdvanced projects",
              body: "The confidence to pursue science, engineering, or computing after SSC or IGCSE.",
              photo: {
                src: "/images/stem/progress-senior.jpg",
                alt: "Senior students wiring components for an advanced electronics project",
              },
            },
          ],
          { itemTitle: "title", hint: "Numbers (01, 02, 03…) are added automatically.", max: 8 },
        ),
      },
    },
    cta: {
      label: "Closing call to action",
      description: "Navy banner at the bottom of the page with two buttons.",
      fields: {
        heading: f.text("Heading", "Come and See the Labs", { max: 80, hint: HEADING_HINT }),
        body: f.textarea("Text", "The best way to understand our STEM programme is to watch students at work.", { rows: 2, max: 300 }),
        primary: f.link(
          "First button (white)",
          { label: "Book a campus visit", href: "/enquire?type=visit" },
          { hint: "Leave the label empty to hide the button." },
        ),
        secondary: f.link(
          "Second button (outlined)",
          { label: "View programmes", href: "/academics" },
          { hint: "Leave the label empty to hide the button." },
        ),
        background: f.image(
          "Background photo",
          { src: "/images/stem/cta-science-lab.png", alt: "" },
          { hint: "Decorative: covered by a navy shade." },
        ),
      },
    },
  },
});
