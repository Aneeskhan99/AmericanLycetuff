import { definePage, f } from "@/lib/content";

const HEADING_HINT = "Put *stars* around the words to show in crimson. Press Enter for a line break.";
const BUTTON_HINT = "Leave the label empty to hide the button.";
const CHIPS_HINT = "One per line. Each line becomes a small box.";

const CORE = "English\nUrdu\nMathematics\nScience\nSocial Studies\nIslamic Studies\nComputer Studies";

/** Editable content for /academics. Values here are the code defaults (see src/lib/content.ts). */
export const academicsPage = definePage({
  key: "academics",
  title: "Academics",
  path: "/academics",
  sections: {
    hero: {
      label: "Hero (top of page)",
      description: "Large photo with the page title, the button and the three crimson cards.",
      fields: {
        eyebrow: f.text("Small label above the title", "Academics", { max: 60 }),
        heading: f.text("Page title", "One Pathway, Every Stage", { max: 90 }),
        intro: f.textarea(
          "Intro text",
          "From a child’s first morning in Play Group to the exam hall at sixteen, with no change of school in between.",
          { rows: 3, max: 240 },
        ),
        button: f.link("Button", { label: "Book a campus visit", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
        image: f.image(
          "Background photo",
          {
            src: "/images/academics/hero-assembly-rows.jpg",
            alt: "Students lined up in rows at the American Lycetuff Swabi morning assembly, with younger pupils watching in front",
          },
          { hint: "A wide landscape photo works best; the left side sits behind the text." },
        ),
        stats: f.list(
          "Crimson cards",
          {
            value: f.text("Big text", "", { max: 12 }),
            label: f.text("Caption", "", { max: 60 }),
          },
          [
            { value: "Ages 3–16", label: "Play Group to SSC / IGCSE" },
            { value: "4 stages", label: "Early Years to Senior School" },
            { value: "2 routes", label: "FBISE SSC and Cambridge IGCSE" },
          ],
          { itemTitle: "value", max: 4, hint: "Three cards fit the design best." },
        ),
      },
    },
    approach: {
      label: "Our approach",
      description: "Intro text with the rising numbered steps (01, 02, …). Numbers are added automatically.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Our approach", { max: 60 }),
        heading: f.text("Heading", "Learning that builds *Step by Step*", { max: 100, hint: HEADING_HINT }),
        body: f.textarea(
          "Paragraph",
          "Strong results come from strong foundations. Each stage at American Lycetuff Swabi is designed to prepare children for the next: habits first, then understanding, then mastery. Teachers track progress closely and keep parents informed, so no child quietly falls behind.",
          { rows: 5, max: 800 },
        ),
        steps: f.list(
          "Steps",
          { label: f.text("Step", "", { max: 40 }) },
          [{ label: "Habits first" }, { label: "Then understanding" }, { label: "Then mastery" }],
          { itemTitle: "label", max: 5, hint: "The last step is shown in crimson. Three fits the design best." },
        ),
      },
    },
    stages: {
      label: "Stage by Stage",
      description: "One row per school stage. The last stage is shown on a navy band.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Academic journey", { max: 60 }),
        heading: f.text("Heading", "Stage by *Stage*", { max: 100, hint: HEADING_HINT }),
        items: f.list(
          "Stages",
          {
            stage: f.text("Small label", "", { max: 30, hint: "e.g. Stage 1" }),
            ages: f.text("Ages", "", { max: 12, hint: "e.g. 3–5" }),
            name: f.text("Stage name", "", { max: 40 }),
            description: f.textarea("Description", "", { rows: 4, max: 600 }),
            note: f.textarea("Highlighted note (optional)", "", {
              rows: 2,
              max: 200,
              hint: "Shown in a box with a crimson edge. Leave empty to hide.",
            }),
            group1Label: f.text("First list: label", "", { max: 100 }),
            group1: f.textarea("First list: items", "", { rows: 6, hint: CHIPS_HINT }),
            group2Label: f.text("Second list: label (optional)", "", { max: 100 }),
            group2: f.textarea("Second list: items (optional)", "", {
              rows: 4,
              hint: `${CHIPS_HINT} On the navy (last) stage these show as crimson boxes.`,
            }),
          },
          [
            {
              stage: "Stage 1",
              ages: "3–5",
              name: "Early Years",
              description:
                "Play Group, Nursery, and Prep. A warm, play-led start where children learn to speak, listen, and wonder out loud.",
              note: "",
              group1Label: "Focus areas",
              group1:
                "Early literacy and numeracy\nUrdu and English language\nIslamic studies\nCreative play\nMotor skills\nSocial confidence",
              group2Label: "",
              group2: "",
            },
            {
              stage: "Stage 2",
              ages: "6–10",
              name: "Primary School",
              description: "Strong literacy and numeracy foundations, with the first real taste of hands-on science.",
              note: "Braintech mental maths builds speed and confidence with numbers.",
              group1Label: "Subjects",
              group1: CORE,
              group2Label: "",
              group2: "",
            },
            {
              stage: "Stage 3",
              ages: "11–13",
              name: "Middle School",
              description:
                "Subject specialists take over. Students begin lab work, coding, and structured research, and start discovering where their strengths lie. This is also where students are introduced to the demands of the senior pathways.",
              note: "",
              group1Label: "Subjects — all the essential subjects, including but not limited to",
              group1: CORE,
              group2Label: "",
              group2: "",
            },
            {
              stage: "Stage 4",
              ages: "14–16",
              name: "Senior School",
              description:
                "Students prepare for the FBISE SSC examination or Cambridge IGCSE / O Level, taught by teachers who know exactly what each paper demands. Regular mock exams and past-paper practice build exam confidence.",
              note: "",
              group1Label: "Students can choose from",
              group1: "Science Group\nArts/Humanities Group",
              group2Label: "Compulsory subjects",
              group2: "Urdu\nEnglish\nIslamiyat\nPakistan Studies",
            },
          ],
          { itemTitle: "name", max: 8 },
        ),
      },
    },
    qualifications: {
      label: "Qualifications",
      description: "Large coloured cards (navy, crimson, …), one per qualification.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Qualifications", { max: 60 }),
        heading: f.text("Heading", "Two *Qualifications*", { max: 100, hint: HEADING_HINT }),
        leadsToLabel: f.text("Label above the “leads to” boxes", "Leads to", { max: 30 }),
        cards: f.list(
          "Qualification cards",
          {
            watermark: f.text("Large faded word", "", { max: 8, hint: "Short, e.g. SSC" }),
            title: f.text("Title", "", { max: 60 }),
            description: f.textarea("Description", "", { rows: 3, max: 400 }),
            leadsTo: f.textarea("Leads to", "", { rows: 3, hint: `${CHIPS_HINT} Leave empty to hide.` }),
          },
          [
            {
              watermark: "SSC",
              title: "Federal Board SSC (FBISE)",
              description:
                "Internationally recognised, aligned to the Pakistani curriculum, and the direct route to FSc, ICS, and other intermediate programmes.",
              leadsTo: "FSc\nICS\nOther intermediate programmes",
            },
            {
              watermark: "IGCSE",
              title: "Cambridge IGCSE / O Level",
              description:
                "Internationally recognised, with a strong emphasis on English, science, and mathematics, and a natural step to A Levels.",
              leadsTo: "A Levels",
            },
          ],
          { itemTitle: "title", max: 6 },
        ),
      },
    },
    beyond: {
      label: "Beyond the Textbook",
      description: "Numbered cards (01, 02, …) shown as a staircase on wide screens. Numbers are added automatically.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Beyond the classroom", { max: 60 }),
        heading: f.text("Heading", "Beyond the *Textbook*", { max: 100, hint: HEADING_HINT }),
        items: f.list(
          "Cards",
          {
            title: f.text("Title", "", { max: 60 }),
            description: f.textarea("Description", "", { rows: 3, max: 240 }),
          },
          [
            {
              title: "Braintech Mental Maths",
              description: "Faster calculation, sharper focus, and real confidence with numbers.",
            },
            {
              title: "Tarbiya Character Programme",
              description: "Honesty, respect, discipline, and service, taught and practised daily.",
            },
            { title: "STEM and Robotics", description: "Hands-on learning in dedicated laboratories on campus." },
            {
              title: "Co-curricular Life",
              description: "Sports, house events, cultural programmes, and competitions.",
            },
          ],
          { itemTitle: "title", max: 8 },
        ),
      },
    },
    cta: {
      label: "Closing banner",
      description: "Full-width photo banner at the bottom of the page.",
      fields: {
        heading: f.text("Heading", "See the Classrooms Yourself", { max: 100, hint: HEADING_HINT }),
        primary: f.link(
          "Main button (white)",
          { label: "Book a campus visit", href: "/enquire?type=visit" },
          { hint: BUTTON_HINT },
        ),
        secondary: f.link(
          "Second button (outline)",
          { label: "Apply for 2027-28", href: "/admissions" },
          { hint: BUTTON_HINT },
        ),
        image: f.image(
          "Background photo",
          { src: "/images/academics/cta-early-years-classroom.jpg", alt: "" },
          { hint: "Decorative: the description can stay empty." },
        ),
      },
    },
  },
});
