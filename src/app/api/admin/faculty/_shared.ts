/** Shared helpers for the faculty admin API (not a route). */
import "server-only";
import { HttpError } from "@/lib/admin-route";
import { one, q } from "@/lib/db";
import { setMediaUsage, toRef, type MediaRow } from "@/lib/media";
import { revalidatePaths } from "@/lib/revalidate";
import { bool, str } from "@/lib/validate";

export const STAFF = ["administrator", "editor"] as const;
export type Row = {
  id: string; name: string; designation: string; department: string; qualifications: string; bio: string;
  media_id: string | null; sort: number; published: boolean; updated_at: string; photo: MediaRow | null;
};

/** Validates a faculty body: the fields, plus the photo (must be an image in the library). */
export async function readFaculty(b: Record<string, unknown>) {
  const f = {
    name: str(b.name, { required: true, max: 120, label: "Name" }),
    designation: str(b.designation, { max: 120, label: "Designation" }),
    department: str(b.department, { max: 80, label: "Department" }),
    qualifications: str(b.qualifications, { max: 300, label: "Qualifications" }),
    bio: str(b.bio, { max: 600, label: "Short bio" }),
    published: b.published === undefined ? true : bool(b.published),
    mediaId: null as number | null,
    photoAlt: b.photoAlt === undefined ? null : str(b.photoAlt, { max: 300, label: "Photo alt text" }),
  };
  // Reuse the existing spelling of a department ("science" → "Science") so it groups as one.
  if (f.department) {
    const hit = await one<{ department: string }>(
      `SELECT department FROM faculty WHERE lower(trim(department)) = lower($1) GROUP BY department ORDER BY count(*) DESC, department LIMIT 1`,
      [f.department],
    );
    if (hit) f.department = hit.department.trim();
  }
  if (b.mediaId !== null && b.mediaId !== undefined && b.mediaId !== "") {
    const mid = Number(b.mediaId);
    const m = Number.isInteger(mid) && mid > 0 ? await one<{ kind: string }>(`SELECT kind FROM media WHERE id = $1`, [mid]) : null;
    if (!m || m.kind !== "image") throw new HttpError(422, "The chosen photo was not found in the media library.");
    f.mediaId = mid;
  }
  return f;
}

/** Saves media usage + the photo's alt text (alt lives on the media item). */
export async function afterSave(id: number, f: Awaited<ReturnType<typeof readFaculty>>) {
  await setMediaUsage("faculty", id, "photo", [f.mediaId]);
  if (f.mediaId && f.photoAlt !== null) await q(`UPDATE media SET alt = $1 WHERE id = $2 AND alt <> $1`, [f.photoAlt, f.mediaId]);
  revalidatePaths(["/faculty"]);
}

export const toClient = (r: Row) => ({
  id: Number(r.id), name: r.name, designation: r.designation, department: r.department, qualifications: r.qualifications,
  bio: r.bio, published: r.published, sort: r.sort, updated_at: r.updated_at,
  photo: r.photo ? (({ id, url, alt, srcSet }) => ({ id, url, alt, srcSet }))(toRef({ ...r.photo, id: Number(r.photo.id), size: Number(r.photo.size) })) : null,
});

export const SELECT = `SELECT f.*, (SELECT row_to_json(m) FROM media m WHERE m.id = f.media_id) AS photo FROM faculty f`;

