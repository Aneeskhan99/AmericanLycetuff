import { contact } from "@/components/layout/nav-links";
import { definePage, f } from "@/lib/content";

const HEADING_HINT = "Put *stars* around the words to show in crimson.";
const BUTTON_HINT = "Leave the label empty to hide the button.";

/** Editable content for /admissions. Values here are the code defaults (see src/lib/content.ts). */
export const admissionsPage = definePage({
  key: "admissions",
  title: "Admissions",
  path: "/admissions",
  sections: {
    hero: {
      label: "Hero (top of page)",
      description: "Campus photo with the page title, two buttons and the crimson stat cards.",
      fields: {
        eyebrow: f.text("Small label above the title", "Admissions", { max: 60 }),
        heading: f.text("Page title", "Admissions open for 2027-28", { max: 80, hint: HEADING_HINT }),
        intro: f.textarea(
          "Intro text",
          "Join a school that supports your child in reaching their best version to be a productive & successful human.",
          { rows: 3, max: 300 },
        ),
        primary: f.link("First button (white)", { label: "Apply now", href: "/enquire" }, { hint: BUTTON_HINT }),
        secondary: f.link("Second button (outlined)", { label: "Book a campus visit", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
        image: f.image("Background photo", {
          src: "/images/admissions/hero-campus-entrance.jpg",
          alt: "American Lycetuff DNK STEM School Swabi campus entrance",
        }),
        stats: f.list(
          "Stat cards",
          {
            value: f.text("Big value", "2027–28", { max: 14, hint: "Keep it short: it is shown on one line." }),
            label: f.text("Caption", "Admissions open", { max: 60 }),
          },
          [
            { value: "2027–28", label: "Admissions open" },
            { value: "4 steps", label: "Simple steps, no confusion" },
            { value: "Ages 3–16", label: "Play Group to Senior School" },
          ],
          { itemTitle: "value", hint: "Three cards fit best on large screens.", max: 4 },
        ),
      },
    },
    process: {
      label: "Admission process",
      description: "Numbered steps with photos and tags.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Admission process", { max: 60 }),
        heading: f.text("Heading", "Simple Steps, *No Confusion*", { max: 120, hint: HEADING_HINT }),
        steps: f.list(
          "Steps",
          {
            title: f.text("Step name", "Enquire", { max: 60, hint: "Long names are set a little smaller automatically." }),
            body: f.textarea("Description", "", { rows: 3, max: 400 }),
            chips: f.textarea("Tags", "", { rows: 3, hint: "One per line." }),
            image: f.image("Photo", { src: "", alt: "" }),
          },
          [
            {
              title: "Enquire",
              body: "Call us, walk in, or send an enquiry online. We’ll answer your questions and share the prospectus.",
              chips: "Call us\nWalk in\nSend an enquiry online",
              image: { src: "/images/admissions/step-1-enquire.jpg", alt: "Young students in red caps gathered for a school event" },
            },
            {
              title: "Visit",
              body: "Tour the campus, see the classrooms and labs, and meet our team.",
              chips: "Tour the campus\nClassrooms and labs\nMeet our team",
              image: { src: "/images/admissions/step-2-visit.jpg", alt: "Student presenting a Sports Week display on campus" },
            },
            {
              title: "Apply",
              body: "Submit the admission form with the required documents.",
              chips: "Admission form\nRequired documents",
              image: { src: "/images/admissions/step-3-apply.jpg", alt: "Students cheering with blue pom-poms during a school parade" },
            },
            {
              title: "Assessment and Enrolment",
              body: "Your child attends a short, friendly assessment. Once accepted, you complete enrolment and receive your joining details.",
              chips: "Short, friendly assessment\nEnrolment\nJoining details",
              image: {
                src: "/images/admissions/step-4-assessment.jpg",
                alt: "Students holding a Thunder house banner in front of the school",
              },
            },
          ],
          { itemTitle: "title", hint: "Step numbers (01, 02…) are added automatically.", max: 8 },
        ),
      },
    },
    grades: {
      label: "Grades and age guide",
      description: "Table of school stages, typical ages and entry points.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Who can apply", { max: 60 }),
        heading: f.text("Heading", "Grades and *Age Guide*", { max: 120, hint: HEADING_HINT }),
        colStage: f.text("Column label: stage", "Stage", { max: 30 }),
        colAge: f.text("Column label: age", "Typical age", { max: 30 }),
        colEntry: f.text("Column label: entry points", "Entry points", { max: 30 }),
        rows: f.list(
          "Stages",
          {
            stage: f.text("Stage", "Early Years", { max: 60 }),
            age: f.text("Typical age", "3–5", { max: 20 }),
            entry: f.textarea("Entry points", "", { rows: 3, hint: "One per line." }),
          },
          [
            { stage: "Early Years", age: "3–5", entry: "Play Group\nNursery\nPrep" },
            { stage: "Primary School", age: "6–10", entry: "Grades 1-5" },
            { stage: "Middle School", age: "11–13", entry: "Grades 6-8" },
            { stage: "Senior School", age: "14–16", entry: "Grades 9-10 (FBISE SSC / Cambridge)" },
          ],
          { itemTitle: "stage", hint: "The last row gets a navy marker, the others crimson.", max: 10 },
        ),
      },
    },
    documents: {
      label: "Documents required",
      description: "Crimson panel with the checklist of documents.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Before you apply", { max: 60 }),
        heading: f.text("Heading", "Documents Required", { max: 80, hint: HEADING_HINT }),
        items: f.list(
          "Documents",
          {
            text: f.textarea("Document", "", { rows: 2, max: 200 }),
            tag: f.text("Tag (optional)", "", { max: 40, hint: "e.g. “For transfers”. Shown as a crimson label next to the document." }),
          },
          [
            { text: "Completed admission form", tag: "" },
            { text: "Copy of the child’s B-Form / birth certificate", tag: "" },
            { text: "Copies of the parents’ CNICs", tag: "" },
            { text: "Recent passport-size photographs", tag: "" },
            { text: "Previous school leaving certificate and last result card (for transfers)", tag: "For transfers" },
          ],
          { itemTitle: "text", max: 15 },
        ),
      },
    },
    fees: {
      label: "Fees",
      description: "Navy section about fees with a button and photo.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Fees, clearly explained", { max: 60 }),
        heading: f.text("Heading", "No Hidden Costs", { max: 80, hint: HEADING_HINT }),
        body: f.textarea(
          "Text",
          "We believe parents should know exactly what they are paying for. Our fee structure is transparent and explained in full before you enrol.",
          { rows: 3, max: 500 },
        ),
        button: f.link("Button", { label: "Request fee structure", href: "/enquire" }, { hint: BUTTON_HINT }),
        image: f.image("Photo", {
          src: "/images/admissions/fees-students.jpg",
          alt: "Young students in striped uniforms posing on a classroom play structure",
        }),
      },
    },
    dates: {
      label: "Key dates",
      description: "Coloured cards with the important admission dates.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Important dates", { max: 60 }),
        heading: f.text("Heading", "Key Dates for *2027-28*", { max: 120, hint: HEADING_HINT }),
        note: f.textarea("Text beside the heading", "Dates will be published here as they are confirmed.", { rows: 2, max: 300 }),
        items: f.list(
          "Dates",
          {
            label: f.text("Event", "Open Day", { max: 40 }),
            date: f.text("Date", "[Date]", { max: 20, hint: "Keep it short, e.g. 12 Mar." }),
            note: f.text("Small text under the date", "To be confirmed", { max: 60 }),
          },
          [
            { label: "Open Day", date: "[Date]", note: "To be confirmed" },
            { label: "Entry Test", date: "[Date]", note: "To be confirmed" },
            { label: "Orientation", date: "[Date]", note: "To be confirmed" },
            { label: "Classes Begin", date: "[Date]", note: "To be confirmed" },
          ],
          { itemTitle: "label", hint: "Four cards fill one row on large screens. Card colours repeat automatically.", max: 8 },
        ),
      },
    },
    faq: {
      label: "Frequently asked questions",
      description: "Questions and answers (the first one starts open).",
      fields: {
        eyebrow: f.text("Small label above the heading", "Frequently asked questions", { max: 60 }),
        heading: f.text("Heading", "Frequently *Asked Questions*", { max: 120, hint: HEADING_HINT }),
        items: f.list(
          "Questions",
          {
            q: f.text("Question", "", { max: 200 }),
            a: f.textarea("Answer", "", { rows: 4, max: 1200 }),
          },
          [
            {
              q: "Can I visit before applying?",
              a: "Yes, and we encourage it. Call ahead, walk in during school hours, or book a visit online.",
            },
            {
              q: "Which curriculum will my child follow?",
              a: "Children follow our programme from Play Group to Senior School. In Grades 9-10, students study towards FBISE SSC or Cambridge.",
            },
            {
              q: "My child is currently at another school. Can they transfer?",
              a: "Yes. Bring the previous school leaving certificate and last result card with the other required documents, and your child will attend a short, friendly assessment.",
            },
            {
              q: "Is there a transport facility?",
              a: `Please call us on ${contact.phone} or send an enquiry online and we will share the current transport routes and availability.`,
            },
            {
              q: "What are the school timings?",
              a: "Campus is open Monday to Friday, 7:45 AM to 2:00 PM, with Saturday mornings for enquiries.",
            },
            {
              q: "Are there any hidden charges?",
              a: "No. Our fee structure is transparent and explained in full before you enrol. Request the fee structure and we will share it with you.",
            },
          ],
          { itemTitle: "q", max: 30 },
        ),
      },
    },
    cta: {
      label: "Closing call to action",
      description: "Photo banner at the bottom of the page with two buttons.",
      fields: {
        heading: f.text("Heading", "Ready to take the next step?", { max: 80, hint: HEADING_HINT }),
        primary: f.link("First button (white)", { label: "Apply for 2027-28", href: "/enquire" }, { hint: BUTTON_HINT }),
        secondary: f.link("Second button (outlined)", { label: "Talk to an advisor", href: "/contact" }, { hint: BUTTON_HINT }),
        note: f.textarea(
          "Small text under the buttons",
          "Campus open Monday to Friday, 7:45 AM to 2:00 PM, with Saturday mornings for enquiries.",
          { rows: 2, max: 300 },
        ),
        background: f.image(
          "Background photo",
          { src: "/images/admissions/cta-campus-parade.jpg", alt: "" },
          { hint: "Decorative: covered by a navy shade." },
        ),
      },
    },
  },
});
