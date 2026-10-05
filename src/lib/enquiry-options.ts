/**
 * Choices offered by the public Contact and Enquire forms, and the labels the
 * admin uses for enquiry forms and statuses. Plain constants (no server or
 * browser code) so the forms, the /api/enquiry validator and the admin screens
 * all share one list.
 */

export const CONTACT_TOPICS = ["Admissions", "Campus visit", "Fee structure", "Youth Skills Programme", "Other"] as const;

export const CONTACT_TIMES = ["Morning", "Afternoon", "Anytime"] as const;

export const GRADES = [
  "Play Group",
  "Nursery",
  "Prep",
  ...Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`),
] as const;

export const PATHWAYS = ["Not sure yet", "FBISE SSC", "Cambridge IGCSE", "O Level"] as const;

export const ENQUIRY_FORMS = ["enquire", "visit", "contact"] as const;
export type EnquiryForm = (typeof ENQUIRY_FORMS)[number];

export const FORM_LABEL: Record<EnquiryForm, string> = {
  enquire: "Admission enquiry",
  visit: "Campus visit request",
  contact: "Contact message",
};

export const ENQUIRY_STATUSES = ["new", "contacted", "visit_booked", "enrolled", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  visit_booked: "Visit booked",
  enrolled: "Enrolled",
  closed: "Closed",
};

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
