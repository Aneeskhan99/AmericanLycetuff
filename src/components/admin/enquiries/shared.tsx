"use client";

import { FORM_LABEL, STATUS_LABEL, type EnquiryForm, type EnquiryStatus } from "@/lib/enquiry-options";

const STATUS_CLS: Record<EnquiryStatus, string> = {
  new: "bg-[#eff4ff] text-[#1a2d59]",
  contacted: "bg-[#fffaeb] text-[#b54708]",
  visit_booked: "bg-[#f4f3ff] text-[#5925dc]",
  enrolled: "bg-[#ecfdf3] text-[#027a48]",
  closed: "bg-[#f2f4f7] text-[#475467]",
};

const DOT: Record<EnquiryStatus, string> = {
  new: "bg-[#1a2d59]",
  contacted: "bg-[#f79009]",
  visit_booked: "bg-[#7a5af8]",
  enrolled: "bg-[#12b76a]",
  closed: "bg-[#98a2b3]",
};

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium ${STATUS_CLS[status] ?? STATUS_CLS.closed}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${DOT[status] ?? DOT.closed}`} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const FORM_CLS: Record<EnquiryForm, string> = {
  enquire: "text-[#1a2d59]",
  visit: "text-[#5925dc]",
  contact: "text-[#475467]",
};

export function FormLabel({ form }: { form: EnquiryForm }) {
  return <span className={`whitespace-nowrap text-[13px] font-medium ${FORM_CLS[form] ?? ""}`}>{FORM_LABEL[form] ?? form}</span>;
}

export const statusDot = DOT;

/** Styled like a secondary Button, for plain links (CSV download). */
export const linkButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-[14px] font-medium text-[#1d2939] transition-colors hover:bg-[#f2f4f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2d59]";
