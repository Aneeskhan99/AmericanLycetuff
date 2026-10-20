import type { PageDef } from "@/lib/content";
import { aboutPage } from "./about";
import { competitionsPage } from "./competitions";
import { academicsPage } from "./academics";
import { admissionsPage } from "./admissions";
import { contactPage } from "./contact";
import { downloadsPage } from "./downloads";
import { enquirePage } from "./enquire";
import { eventsPage } from "./events";
import { facultyPage } from "./faculty";
import { galleryPage } from "./gallery";
import { homePage } from "./home";
import { newsPage } from "./news";
import { stemRoboticsPage } from "./stem-robotics";

/** Every editable page, in the order the admin lists them. */
export const PAGES: PageDef[] = [
  homePage,
  aboutPage,
  academicsPage,
  stemRoboticsPage,
  admissionsPage,
  galleryPage,
  competitionsPage,
  contactPage,
  enquirePage,
  newsPage,
  eventsPage,
  facultyPage,
  downloadsPage,
] as PageDef[];

export const pageByKey = (key: string) => PAGES.find((p) => p.key === key);
