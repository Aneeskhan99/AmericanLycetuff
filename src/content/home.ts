import { definePage, f, type PageContent } from "@/lib/content";

const HEADING_HINT = "Put *stars* around the words to show in crimson.";
const BUTTON_HINT = "Leave the label empty to hide the button.";
const PAGE_LINK_HINT = "A page on this site (e.g. /academics) or a full web address.";

/** Editable content for /. Values here are the code defaults (see src/lib/content.ts). */
export const homePage = definePage({
  key: "home",
  title: "Home",
  path: "/",
  sections: {
    hero: {
      label: "Hero slides (top of page)",
      description:
        "The large rotating slides at the top. The first slide's title is the page's main heading. Slides change every 6 seconds.",
      fields: {
        slides: f.list(
          "Hero slides",
          {
            title: f.text("Title", "", { max: 70 }),
            text: f.textarea("Text under the title", "", { rows: 3, max: 220 }),
            button: f.link("Button", { label: "", href: "" }, { hint: BUTTON_HINT }),
            photo: f.image("Photo", { src: "", alt: "" }, { hint: "A wide landscape photo works best; the text sits over the middle." }),
          },
          [
            {
              title: "Learn, Grow, & Shine with ASL",
              text: "A blend of modern education and local values where generations enter to learn and leave to lead with confidence.",
              button: { label: "Book a campus visit", href: "/enquire?type=visit" },
              photo: {
                src: "/images/home/hero-campus-assembly.jpg",
                alt: "Students and staff at a morning assembly in front of the American Lycetuff Swabi campus",
              },
            },
            {
              title: "A Strong FBISE Foundation",
              text: "Expert teaching and structured exam preparation, so every student reaches SSC ready, not just hopeful.",
              button: { label: "Explore the SSC pathway", href: "/academics" },
              photo: { src: "/images/home/hero-fbise.jpg", alt: "A smiling student at an American Lycetuff school event" },
            },
            {
              title: "Cambridge Education, Right in Swabi",
              text: "Cambridge IGCSE and O Level, an internationally recognised qualification, available in your hometown, Swabi.",
              button: { label: "Explore Cambridge", href: "/academics" },
              photo: { src: "/images/home/hero-cambridge.jpg", alt: "Students in yellow caps at the American Lycetuff Swabi campus" },
            },
          ],
          { itemTitle: "title", min: 1, max: 6, hint: "Three slides fit the design best." },
        ),
        video: f.text("Video file URL", "/videos/hero.mp4", {
          hint: "Plays silently behind the first slide on computers, and opens with sound from the round play button. Leave empty to show only the photo.",
        }),
      },
    },
    stats: {
      label: "Crimson stat cards",
      description: "The four crimson cards just under the hero slides.",
      fields: {
        cards: f.list(
          "Stat cards",
          {
            value: f.text("Big text", "", { max: 14 }),
            label: f.text("Caption", "", { max: 40 }),
          },
          [
            { value: "70+", label: "Campuses Nationwide" },
            { value: "27 Years", label: "Of Academic Tradition" },
            { value: "2 Labs", label: "STEM & Robotics On Site" },
            { value: "100%", label: "Cambridge-Aligned Pathway" },
          ],
          { itemTitle: "value", max: 4, hint: "Four cards fit the design best. Remove all to hide the cards." },
        ),
      },
    },
    about: {
      label: "Welcome / about the campus",
      description: "Intro text with the ticked list and the photo with the crimson shadow.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Welcome to Swabi Campus", { max: 60 }),
        heading: f.text("Heading", "A *National School* with a Local Heart.", { max: 100, hint: HEADING_HINT }),
        body: f.textarea(
          "Paragraph",
          "Lycetuff began in 1999 as a single institution and has grown into a network of 70+ campuses across Pakistan. Our Swabi campus brings that same proven standard to the families of Shahmansoor Township and the wider district, with the same mentoring programme and the same accountability for results.",
          { rows: 5, max: 700 },
        ),
        points: f.list(
          "Ticked points",
          { text: f.text("Point", "", { max: 90 }) },
          [
            { text: "Play Group through to SSC and Cambridge IGCSE" },
            { text: "STEM, robotics, and computer laboratories on site" },
            { text: "Braintech mental maths and Tarbiya character programme" },
            { text: "Transparent fee structure with no hidden costs" },
          ],
          { itemTitle: "text", max: 8 },
        ),
        button: f.link("Button", { label: "More about the campus", href: "/about" }, { hint: BUTTON_HINT }),
        photo: f.image("Photo", {
          src: "/images/home/about-campus-gate.jpg",
          alt: "Students in costume lined up for a school event at the American Lycetuff Swabi campus gate",
        }),
      },
    },
    stages: {
      label: "Every stage cards",
      description: "\"Every Stage, under One Roof\": one card per school stage.",
      fields: {
        heading: f.text("Heading", "Every Stage, under *One Roof*", { max: 100, hint: HEADING_HINT }),
        intro: f.textarea(
          "Intro text",
          "From a child's first morning in Play Group to the exam hall at sixteen, one continuous pathway with no change of school in between.",
          { rows: 3, max: 300 },
        ),
        cards: f.list(
          "Stage cards",
          {
            ages: f.text("Ages", "", { max: 20, hint: "e.g. Ages 3–5" }),
            title: f.text("Stage name", "", { max: 40 }),
            text: f.textarea("Text", "", { rows: 3, max: 220 }),
            photo: f.image("Photo", { src: "", alt: "" }, { hint: "Shown as a square on computers." }),
            href: f.text("Card links to", "/academics", { hint: PAGE_LINK_HINT }),
          },
          [
            {
              ages: "Ages 3–5",
              title: "Early Years",
              text: "A warm, play-led start where children learn to speak, listen, and wonder out loud before they ever learn to sit still.",
              photo: { src: "/images/home/stage-early-years.jpg", alt: "Early years pupils in blue caps at a school celebration" },
              href: "/academics",
            },
            {
              ages: "Ages 6–10",
              title: "Primary School",
              text: "The years where habits are set. Strong literacy and numeracy foundations, paired with the first real taste of hands-on science.",
              photo: { src: "/images/home/stage-primary.jpg", alt: "Primary school girls in red caps smiling at a school event" },
              href: "/academics",
            },
            {
              ages: "Ages 11–13",
              title: "Middle School",
              text: "Subject specialists take over. Students begin lab work, coding, and structured research, and start discovering where their strengths lie.",
              photo: { src: "/images/home/stage-middle.jpg", alt: "Middle school students with a house banner on sports day" },
              href: "/academics",
            },
            {
              ages: "Ages 14–16",
              title: "Senior School",
              text: "Students choose the FBISE SSC track or Cambridge IGCSE / O Level, guided by teachers who know exactly what each exam demands.",
              photo: { src: "/images/home/stage-senior.jpg", alt: "Senior students celebrating with a trophy" },
              href: "/academics",
            },
          ],
          { itemTitle: "title", max: 8, hint: "Four cards fit one row on computers." },
        ),
        button: f.link("Button", { label: "View Programmes", href: "/academics" }, { hint: BUTTON_HINT }),
      },
    },
    location: {
      label: "Location",
      description: "\"Easy to Reach, Easy to Love\" with the Swabi map and the numbered points (numbers are added automatically).",
      fields: {
        eyebrow: f.text("Small label above the heading", "Our location", { max: 60 }),
        heading: f.text("Heading", "Easy to Reach, *Easy to Love*", { max: 100, hint: HEADING_HINT }),
        body: f.textarea(
          "Paragraph",
          "Our campus sits in Shahmansoor Township, one of Swabi's most accessible and fast-growing neighbourhoods. It is 5 minutes from Swabi city and well connected to the motorway, so the daily school run stays short, safe, and simple for families across the district.",
          { rows: 5, max: 600 },
        ),
        mapLabel: f.text("Label on the map pin", "Swabi Campus · Swabi City · Motorway Interchange", {
          max: 80,
          hint: "Separate parts with \" · \"; on computers each part goes on its own line.",
        }),
        mapAlt: f.text(
          "Map description (for screen readers)",
          "Map of Swabi district showing the American Lycetuff campus in Shahmansoor Township",
          { max: 160 },
        ),
        points: f.list(
          "Numbered points",
          {
            title: f.text("Title", "", { max: 40 }),
            text: f.textarea("Text", "", { rows: 2, max: 160 }),
          },
          [
            { title: "Connected", text: "Quick access to Swabi city and the Swabi interchange / M-1 motorway" },
            { title: "Convenient", text: "Pick-up and drop-off arrangements / transport facility" },
            { title: "Close to Home", text: "Serving families from Swabi, Topi, Mardan, and nearby areas" },
          ],
          { itemTitle: "title", max: 5, hint: "Three points fit the design best." },
        ),
        button: f.link(
          "Button",
          {
            label: "Get directions",
            href: "https://www.google.com/maps/search/?api=1&query=American+Lycetuff+Swabi+Shahmansoor+Township",
          },
          { hint: `${BUTTON_HINT} Web addresses open in a new tab.` },
        ),
        background: f.image(
          "Background photo (very faint)",
          { src: "/images/home/location-bg.jpg", alt: "" },
          { hint: "Shown at 8% strength behind the section. Decorative, so the description can stay empty." },
        ),
      },
    },
    cambridge: {
      label: "Cambridge panel",
      description: "Navy band about Cambridge IGCSE and O Level, with the ticked highlights, two buttons and the photo of students.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Cambridge International", { max: 70 }),
        heading: f.text("Heading", "Cambridge IGCSE and O Level,\n*Right Here in Swabi*", {
          max: 100,
          hint: `${HEADING_HINT} Press Enter for a line break (used on computers only).`,
        }),
        body: f.textarea(
          "Paragraph",
          "In Grades 9 and 10, students can choose the Cambridge route alongside FBISE SSC. It is an internationally recognised qualification with a strong focus on English, science and mathematics, and a natural step to A Levels, without leaving Swabi.",
          { rows: 5, max: 600 },
        ),
        points: f.list(
          "Ticked highlights",
          { text: f.text("Highlight", "", { max: 90 }) },
          [
            { text: "IGCSE and O Level in Grades 9 and 10" },
            { text: "Teachers who know what each paper demands" },
            { text: "Regular mock exams and past paper practice" },
            { text: "A direct route to A Levels" },
          ],
          { itemTitle: "text", max: 6 },
        ),
        button: f.link("First button (white)", { label: "Explore Cambridge", href: "/academics" }, { hint: BUTTON_HINT }),
        button2: f.link("Second button (outlined)", { label: "Book a campus visit", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
        photo: f.image("Photo", {
          src: "/images/home/cambridge-students.jpg",
          alt: "Smiling students in blue caps making victory signs",
        }),
      },
    },
    admissions: {
      label: "Admissions dates",
      description: "\"Admissions Open\" with the key date cards. Phones show the first four dates; computers show four and add arrows when there are more.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Admissions", { max: 60 }),
        heading: f.text("Heading", "Admissions Open for *2027–28*", { max: 100, hint: HEADING_HINT }),
        body: f.textarea(
          "Paragraph",
          "Call ahead, walk in, or book a campus visit. The campus is open Monday to Friday, 7:45 AM to 2:00 PM, with Saturday mornings for enquiries.",
          { rows: 4, max: 400 },
        ),
        dates: f.list(
          "Key dates",
          {
            day: f.text("Day", "", { max: 3, hint: "e.g. 10" }),
            month: f.text("Month", "", { max: 5, hint: "e.g. Oct" }),
            label: f.text("Event", "", { max: 40 }),
          },
          [
            { day: "01", month: "Mar", label: "Admissions Open" },
            { day: "15", month: "Mar", label: "Entry Test" },
            { day: "21", month: "Mar", label: "Orientation" },
            { day: "25", month: "Mar", label: "Classes Begin" },
          ],
          { itemTitle: "label", max: 12, hint: "Computers show four at a time (arrows appear when there are more); phones show the first four." },
        ),
        button: f.link("Button", { label: "Apply for 2027-28", href: "/admissions" }, { hint: BUTTON_HINT }),
      },
    },
    stemLabs: {
      label: "STEM labs",
      description: "\"Discover our STEM Labs\" with the two lab cards (extra cards start a new row).",
      fields: {
        heading: f.text("Heading", "Discover our\nSTEM Labs", {
          max: 80,
          hint: "Press Enter for a line break (used on computers only).",
        }),
        body: f.textarea(
          "Paragraph",
          "Our students build line-followers, toll booths, and rovers in labs on site, learning by making, testing, and improving.",
          { rows: 3, max: 300 },
        ),
        button: f.link("Button", { label: "Book a Visit to See our labs", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
        buttonShort: f.text("Button text on phones", "Book a Visit", {
          max: 30,
          hint: "A shorter label for small screens. Leave empty to use the button label.",
        }),
        cards: f.list(
          "Lab cards",
          {
            kind: f.text("Small label", "", { max: 20, hint: "e.g. Build" }),
            title: f.text("Lab name", "", { max: 40 }),
            photo: f.image("Photo", { src: "", alt: "" }),
            href: f.text("Card links to", "/stem-robotics", { hint: PAGE_LINK_HINT }),
          },
          [
            {
              kind: "Build",
              title: "Robotics Laboratory",
              photo: { src: "/images/home/lab-robotics-students.jpg", alt: "Students building a line-following robot together in the robotics lab" },
              href: "/stem-robotics",
            },
            {
              kind: "Code",
              title: "Computer & ICT Laboratory",
              photo: { src: "/images/home/lab-computer-ict.jpg", alt: "Students at their computers listening to the teacher in the computer lab" },
              href: "/stem-robotics",
            },
          ],
          { itemTitle: "title", max: 12, hint: "Two cards fit the design best." },
        ),
      },
    },
    contests: {
      label: "Where our students compete",
      description: "\"Where Our Students Compete\": the row of contest logos (phones show the first six).",
      fields: {
        heading: f.text("Heading", "Where Our Students *Compete*", { max: 80, hint: HEADING_HINT }),
        body: f.textarea(
          "Paragraph",
          "Our students test themselves against the best in Pakistan and beyond, in science, maths, English, art and innovation.",
          { rows: 3, max: 300 },
        ),
        link: f.link("Link", { label: "See all contests and programmes", href: "/academics#contests-title" }, { hint: BUTTON_HINT }),
        linkShort: f.text("Link text on phones", "See all contests", {
          max: 30,
          hint: "A shorter label for small screens. Leave empty to use the link label.",
        }),
        items: f.list(
          "Contests",
          {
            name: f.text("Contest name", "", { max: 60 }),
            logo: f.image("Logo", { src: "", alt: "" }, { hint: "A logo on a white background works best." }),
          },
          [
            { name: "International Kangaroo Science Contest", logo: { src: "/images/home/contest-kangaroo.png", alt: "Kangaroo International logo" } },
            { name: "National Science Contest", logo: { src: "/images/home/contest-national-science.png", alt: "National Science Contest logo" } },
            { name: "HEC National Science Talent Contest", logo: { src: "/images/home/contest-hec-nstc.png", alt: "HEC National Science Talent Contest logo" } },
            { name: "Pakistan Math Contest", logo: { src: "/images/home/contest-pakistan-math.png", alt: "Pakistan Mathematics Contest logo" } },
            { name: "Cheezious MATHmania Season 2", logo: { src: "/images/home/contest-cheezious-mathmania.png", alt: "Cheezious MATHmania logo" } },
            { name: "IAC International Art Contest", logo: { src: "/images/home/contest-iac-art.png", alt: "IAC International Art Contest logo" } },
            { name: "ALS Spelling Bee", logo: { src: "/images/home/contest-als-spelling-bee.png", alt: "ALS Spelling Bee logo" } },
          ],
          { itemTitle: "name", max: 14, hint: "Seven logos fill one row on computers; phones show the first six." },
        ),
      },
    },
    numbers: {
      label: "Numbers",
      description: "\"Our People, Our Strength.\" navy panel with the crest and the figures (two per row on computers).",
      fields: {
        crest: f.image("Crest / logo", { src: "/images/shared/logo-crest.png", alt: "American Lycetuff crest" }, { hint: "Shown on computers only." }),
        eyebrow: f.text("Small label above the heading", "Swabi Campus by the Numbers", { max: 60 }),
        heading: f.text("Heading", "Our People, Our Strength.", { max: 80 }),
        body: f.textarea(
          "Paragraph",
          "Behind every figure is a child, a teacher, or a family from Swabi. These are the numbers we are proud of.",
          { rows: 3, max: 300 },
        ),
        figures: f.list(
          "Figures",
          {
            value: f.text("Number", "", { max: 10, hint: "e.g. 500+" }),
            label: f.text("Caption", "", { max: 80 }),
          },
          [
            { value: "500+", label: "students learning on the Swabi campus" },
            { value: "40+", label: "qualified, mentored teachers and staff" },
            { value: "1:15", label: "teacher-to-student ratio in the classroom" },
            { value: "100%", label: "pass rate in our latest SSC batch" },
            { value: "50+", label: "student projects built in our labs" },
          ],
          { itemTitle: "value", max: 8, hint: "Five or six figures (three rows of two) fit the design best." },
        ),
      },
    },
    discover: {
      label: "Discover tabs",
      description: "The tabbed slider at the bottom (Discover Swabi / STEM & Robotics / Campus Life).",
      fields: {
        tabs: f.list(
          "Tabs",
          {
            tab: f.text("Tab name", "", { max: 24 }),
            title: f.text("Heading", "", { max: 60 }),
            text: f.textarea("Text", "", { rows: 3, max: 300 }),
            photo: f.image("Photo", { src: "", alt: "" }, { hint: "A landscape photo works best." }),
          },
          [
            {
              tab: "Discover Swabi",
              title: "Discover Swabi",
              text: "See what a school day really looks like here, from morning assembly and science practicals to sports afternoons and robotics build sessions.",
              photo: { src: "/images/home/discover-green-day.jpg", alt: "Two students in green caps giving a thumbs up on Green Day" },
            },
            {
              tab: "STEM & Robotics",
              title: "STEM & Robotics",
              text: "From line-following robots to coding clubs, students learn by building, testing, and improving in labs right here on campus.",
              photo: { src: "/images/home/discover-stem.jpg", alt: "Staff and students with a trophy at a school event" },
            },
            {
              tab: "Campus Life",
              title: "Campus Life",
              text: "Cultural days, sports fixtures, house events, and celebrations that make the Swabi campus feel like a second home.",
              photo: { src: "/images/home/discover-cultural-day.jpg", alt: "Young students in traditional dress dancing on cultural day" },
            },
          ],
          { itemTitle: "tab", max: 5, hint: "Three tabs fit the design best." },
        ),
        button: f.link("First button", { label: "Book a Campus Visit", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
        button2: f.link("Second button", { label: "View Programs", href: "/academics" }, { hint: BUTTON_HINT }),
      },
    },
  },
});

/** Resolved home page content, one entry per section (props for src/components/home/*). */
export type HomeContent = PageContent<typeof homePage>;
