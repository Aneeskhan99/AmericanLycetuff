import "server-only";
import { dbConfigured, q } from "@/lib/db";
import { toRef, type MediaRef, type MediaRow } from "@/lib/media";

/** Published faculty & staff for /faculty, grouped by department (never throws). */
export type FacultyMember = {
  id: number;
  name: string;
  designation: string;
  department: string;
  qualifications: string;
  bio: string;
  photo: MediaRef | null;
};
export type FacultyGroup = { department: string; members: FacultyMember[] };

export async function getFaculty(): Promise<FacultyMember[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = await q<{ id: string; name: string; designation: string; department: string; qualifications: string; bio: string; photo: MediaRow | null }>(
      `SELECT f.id, f.name, f.designation, f.department, f.qualifications, f.bio,
              (SELECT row_to_json(m) FROM media m WHERE m.id = f.media_id AND m.kind = 'image') AS photo
         FROM faculty f WHERE f.published ORDER BY f.sort, f.name, f.id`,
    );
    return rows.map((r) => ({
      id: Number(r.id), name: r.name, designation: r.designation, department: r.department.trim(),
      qualifications: r.qualifications, bio: r.bio,
      photo: r.photo ? toRef({ ...r.photo, id: Number(r.photo.id), size: Number(r.photo.size) }) : null,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn(`[faculty] ${(err as Error).message}`);
    return [];
  }
}

/** Groups in the order their first member appears (so the admin's order decides). */
export function groupByDepartment(members: FacultyMember[], fallback: string): FacultyGroup[] {
  const groups = new Map<string, FacultyGroup>();
  for (const m of members) {
    const key = (m.department || fallback).toLowerCase();
    if (!groups.has(key)) groups.set(key, { department: m.department || fallback, members: [] });
    groups.get(key)!.members.push(m);
  }
  return [...groups.values()];
}
