import { definePage, f } from "@/lib/content";

/**
 * Editable content for /contact. Values here are the code defaults (see src/lib/content.ts).
 *
 * Phone, WhatsApp, email, address, the map link and the opening hours are NOT here:
 * they are shared site-wide and come from Admin → Settings (getSettings()).
 * Headings: *word* = crimson highlight, a new line = line break.
 */
export const contactPage = definePage({
  key: "contact",
  title: "Contact Us",
  path: "/contact",
  sections: {
    hero: {
      label: "Hero",
      description: "Top of the page. The phone number on the call button comes from Settings.",
      fields: {
        eyebrow: f.text("Small label above the heading", "Contact us"),
        heading: f.textarea("Heading", "We’d love to hear from you", { rows: 2, hint: "*word* = crimson highlight" }),
        intro: f.textarea("Intro text", "Call ahead, walk in or send us a message. Our team will get back to you promptly.", { rows: 3 }),
        messageButton: f.link("Message button", { label: "Send message", href: "#contact-form" }),
        callPrefix: f.text("Call button text (shown before the phone number)", "Call"),
        image: f.image("Photo", {
          src: "/images/contact/hero-campus-entrance.jpg",
          alt: "Students in green uniforms lined up outside the American Lycetuff Swabi campus entrance",
        }),
      },
    },
    reachUs: {
      label: "Three ways to reach us",
      description: "Dark band with three columns. The phone number and hours come from Settings.",
      fields: {
        eyebrow: f.text("Small label", "Get in touch"),
        callHeading: f.text("Column 1 heading", "Call ahead."),
        walkInHeading: f.text("Column 2 heading", "Walk in."),
        walkInWeekdays: f.text("Column 2: weekday label", "Monday to Friday", { hint: "Followed by the weekday hours from Settings" }),
        walkInSaturday: f.text("Column 2: Saturday label", "Saturday", { hint: "Followed by the Saturday hours from Settings" }),
        messageHeading: f.text("Column 3 heading", "Send us a message."),
        messageText: f.text("Column 3 text", "Our team will get back to you promptly."),
        messageButton: f.link("Column 3 button", { label: "Send message", href: "#contact-form" }),
        image: f.image("Background photo", { src: "/images/contact/reach-us-band.jpg", alt: "" }, { hint: "Decorative: alt text can stay empty" }),
      },
    },
    details: {
      label: "Contact details",
      description: "Four coloured cards. The address, phone, WhatsApp and admissions email themselves come from Settings.",
      fields: {
        eyebrow: f.text("Small label", "Contact details"),
        heading: f.textarea("Heading", "Contact *Details*", { rows: 2, hint: "*word* = crimson highlight" }),
        campusLabel: f.text("Campus card: label", "Campus"),
        campusText: f.textarea("Campus card: text", "American Lycetuff School, Swabi Campus, Shahmansoor Township, Swabi, Khyber Pakhtunkhwa", {
          rows: 3,
          hint: "The street address under it comes from Settings",
        }),
        campusAction: f.text("Campus card: link text", "Get directions →", { hint: "Opens the map link from Settings" }),
        phoneLabel: f.text("Phone card: label", "Phone"),
        phoneAction: f.text("Phone card: link text", "Call now →"),
        whatsappLabel: f.text("WhatsApp card: label", "WhatsApp"),
        whatsappNote: f.text("WhatsApp card: small note", "If available.", { hint: "Leave empty to hide" }),
        whatsappAction: f.text("WhatsApp card: link text", "Message us →"),
        emailLabel: f.text("Email card: label", "Email"),
        emailAction: f.text("Email card: link text", "Write to us →"),
      },
    },
    hours: {
      label: "Opening hours",
      description: "The times and the note under them come from Settings → Opening hours.",
      fields: {
        eyebrow: f.text("Small label", "Opening hours"),
        heading: f.textarea("Heading", "Opening Hours", { rows: 2, hint: "*word* = highlight" }),
        weekdaysLabel: f.text("Weekdays row label", "Monday to Friday"),
        saturdayLabel: f.text("Saturday row label", "Saturday"),
        sundayLabel: f.text("Sunday row label", "Sunday"),
        button: f.link("Button", { label: "Book a campus visit", href: "/enquire?type=visit" }),
        image: f.image("Photo", {
          src: "/images/contact/hours-students-waving.jpg",
          alt: "Smiling students in blue caps and green blazers waving at the camera",
        }),
      },
    },
    gettingHere: {
      label: "Getting here",
      description: "Map section. The street address and the directions link come from Settings.",
      fields: {
        eyebrow: f.text("Small label", "Getting here"),
        heading: f.textarea("Heading", "Easy to reach, *easy to find*", { rows: 2, hint: "*word* = crimson highlight" }),
        intro: f.textarea("Text", "Our campus is in Shahmansoor Township, an accessible and fast-growing part of Swabi.", { rows: 3 }),
        landmarks: f.textarea("Landmarks (small crimson text)", "[Landmarks to be added — e.g. distance from Swabi city and the M-1 interchange]", {
          rows: 2,
          hint: "Leave empty to hide",
        }),
        cardEyebrow: f.text("Map card: small label", "Swabi Campus"),
        cardText: f.textarea("Map card: text", "American Lycetuff School, Swabi Campus, Shahmansoor Township, Swabi, Khyber Pakhtunkhwa", { rows: 3 }),
        directionsLabel: f.text("Map card: button text", "Get directions", { hint: "Opens the map link from Settings" }),
      },
    },
    form: {
      label: "Contact form",
      description: "Intro and photo next to the form. The form fields themselves are not edited here.",
      fields: {
        eyebrow: f.text("Small label", "Contact form"),
        heading: f.textarea("Heading", "Send us a *Message*", { rows: 2, hint: "*word* = crimson highlight" }),
        intro: f.textarea("Intro text", "Our team will get back to you promptly.", { rows: 2 }),
        image: f.image("Photo", {
          src: "/images/contact/form-students-thumbs-up.jpg",
          alt: "Two students in green school jackets giving a thumbs up",
        }),
      },
    },
    closing: {
      label: "Closing call to action",
      description: "Last band on the page. The directions button opens the map link from Settings.",
      fields: {
        heading: f.textarea("Heading", "Walk-ins are welcome.", { rows: 2, hint: "*word* = highlight, new line = line break" }),
        directionsLabel: f.text("Directions button text", "Get directions"),
        messageButton: f.link("Second button", { label: "Send message", href: "#contact-form" }),
        image: f.image("Background photo", { src: "/images/contact/cta-students-cultural-day.jpg", alt: "" }, { hint: "Decorative: alt text can stay empty" }),
      },
    },
  },
});
