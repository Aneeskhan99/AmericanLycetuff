import type { Metadata } from "next";
import FacultyHero from "@/components/site/faculty/FacultyHero";
import StaffCard from "@/components/site/faculty/StaffCard";
import { plain } from "@/components/site/Rich";
import { getPageContent } from "@/lib/content-server";
import { getFaculty, groupByDepartment } from "@/lib/public/faculty";
import { facultyPage } from "@/content/faculty";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getPageContent(facultyPage);
  return { title: "Faculty & Staff", description: plain(c.hero.intro).slice(0, 300), alternates: { canonical: "/faculty" } };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function FacultyPage() {
  const [c, people] = await Promise.all([getPageContent(facultyPage), getFaculty()]);
  const groups = groupByDepartment(people, c.list.noDepartment || "Our team");

  return (
    <>
      <FacultyHero eyebrow={c.hero.eyebrow} title={c.hero.title} intro={c.hero.intro} image={c.hero.image} />

      <section aria-label="Faculty and staff" className="frame gutter bg-[#f8f8f8]">
        <div className="mx-auto w-full max-w-[1498px] py-[56px] lg:pb-[120px] lg:pt-[100px]">
          {groups.length === 0 ? (
            <p className="text-center text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:text-left">{c.list.empty}</p>
          ) : (
            <div className="flex flex-col gap-[56px] lg:gap-[96px]">
              {groups.map((g, gi) => (
                <section key={g.department} aria-labelledby={`dept-${gi}`}>
                  <div className="flex flex-col items-center gap-[10px] border-b border-[#d6d6d6] pb-[20px] text-center lg:flex-row lg:items-end lg:justify-between lg:pb-[24px] lg:text-left">
                    <div>
                      <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:tracking-[2px]">
                        <span className="text-crimson">{pad(gi + 1)}</span>
                        <span className="ml-[16px] text-navy">{c.list.eyebrow}</span>
                      </p>
                      <h2
                        id={`dept-${gi}`}
                        className="mt-[12px] text-[30px] leading-[36px] tracking-[-0.4px] text-black lg:mt-[16px] lg:text-[clamp(40px,2.6vw,52px)] lg:leading-[1.15] lg:tracking-[-1px]"
                      >
                        {g.department}
                      </h2>
                    </div>
                    <p className="text-[15px] leading-[23px] text-[#5c5c5c]">
                      {g.members.length} {g.members.length === 1 ? "person" : "people"}
                    </p>
                  </div>
                  <ul className="mt-[28px] grid grid-cols-2 gap-x-[16px] gap-y-[32px] md:grid-cols-3 lg:mt-[48px] lg:grid-cols-4 lg:gap-x-[28px] lg:gap-y-[56px]">
                    {g.members.map((m) => (
                      <li key={m.id}>
                        <StaffCard m={m} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
