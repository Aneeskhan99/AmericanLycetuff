/** Shared class strings + links for the Contact and Enquire pages (Figma button styles). */

const btnBase =
  "inline-flex items-center justify-center px-[30px] text-[17.13px] font-medium uppercase leading-normal tracking-[1.9px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

/** Button / Filled Crimson */
export const btnCrimson = `${btnBase} bg-crimson py-[17px] text-white hover:bg-[#b00e39] focus-visible:outline-navy`;
/** Button / Filled White (on dark backgrounds) */
export const btnWhite = `${btnBase} bg-white py-[17px] text-crimson hover:bg-crimson hover:text-white focus-visible:outline-[#fd0]`;
/** Button / Stroked navy (on light backgrounds) */
export const btnStrokedNavy = `${btnBase} border-2 border-navy py-[15px] text-navy hover:bg-navy hover:text-white focus-visible:outline-crimson`;
/** Button / Stroked white (on dark backgrounds) */
export const btnStrokedWhite = `${btnBase} border-2 border-white py-[15px] text-white hover:bg-white hover:text-navy focus-visible:outline-[#fd0]`;

/** Small uppercase eyebrow used across sections (13.1px desktop / 13px mobile). */
export const eyebrow =
  "text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]";

/** Section H2: 34/38 mobile, 72/80 desktop. */
export const h2 =
  "text-[34px] font-normal leading-[38px] tracking-[-0.4722px] lg:text-[clamp(52px,3.75vw,72px)] lg:leading-[1.111] lg:tracking-[-1px]";

const mapsQuery = encodeURIComponent("American Lycetuff Swabi Shahmansoor Township");
export const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
export const mapEmbedSrc = `https://www.google.com/maps?q=${mapsQuery}&z=15&output=embed`;
