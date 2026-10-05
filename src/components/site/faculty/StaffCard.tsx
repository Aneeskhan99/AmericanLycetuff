import type { FacultyMember } from "@/lib/public/faculty";

const initials = (name: string) =>
  name
    .replace(/^(mr|mrs|ms|miss|dr|prof|sir|madam)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** One person: photo (or initials), name, designation, qualifications and a short bio. */
export default function StaffCard({ m }: { m: FacultyMember }) {
  return (
    <article className="flex h-full flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-navy-ink">
        {m.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.photo.url}
            srcSet={m.photo.srcSet || undefined}
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 33vw, 50vw"
            alt={m.photo.alt || m.name}
            width={m.photo.width ?? undefined}
            height={m.photo.height ?? undefined}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[44px] font-light tracking-[-1px] text-white/90 lg:text-[64px]">
            {initials(m.name)}
          </span>
        )}
        <span aria-hidden className="absolute bottom-0 left-0 h-[6px] w-[64px] bg-crimson lg:w-[88px]" />
      </div>
      <h3 className="mt-[16px] text-[17px] font-semibold leading-[23px] text-black lg:mt-[20px] lg:text-[22px] lg:leading-[28px]">{m.name}</h3>
      {m.designation && (
        <p className="mt-[6px] text-[11.5px] font-semibold uppercase leading-[17px] tracking-[1.6px] text-crimson lg:mt-[8px] lg:text-[13px] lg:leading-[18px] lg:tracking-[2px]">
          {m.designation}
        </p>
      )}
      {m.qualifications && <p className="mt-[8px] text-[14px] leading-[21px] text-[#5c5c5c] lg:text-[15px] lg:leading-[23px]">{m.qualifications}</p>}
      {m.bio && <p className="mt-[8px] text-[14px] leading-[21px] text-[#5c5c5c] lg:text-[15px] lg:leading-[23px]">{m.bio}</p>}
    </article>
  );
}
