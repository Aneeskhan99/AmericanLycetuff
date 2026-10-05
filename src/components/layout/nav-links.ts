export type NavLink = { label: string; href: string };

/** Main navigation (header) — order matches the Figma nav bar. */
export const mainNav: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "STEM & Robotics", href: "/stem-robotics" },
  { label: "Admissions", href: "/admissions" },
  { label: "Gallery", href: "/gallery" },
];

export const enquireLink: NavLink = { label: "Enquire Now", href: "/enquire" };

/** Footer quick links — order matches the Figma footer. */
export const footerNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Stem & Robotics", href: "/stem-robotics" },
  { label: "Admissions", href: "/admissions" },
  { label: "Gallery", href: "/gallery" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Faculty", href: "/faculty" },
  { label: "Downloads", href: "/downloads" },
  { label: "Contact us", href: "/contact" },
  { label: "Enquire Us", href: "/enquire" },
];

export const contact = {
  name: "American Lycetuff",
  phone: "0938-320011",
  phoneHref: "tel:+92938320011",
  email: "info@alsswabi.edu.pk",
  address: "Sector-E, Shahmansoor Township Swabi, Khyber Pakhtunkhwa",
};
