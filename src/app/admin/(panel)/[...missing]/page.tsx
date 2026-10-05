import { notFound } from "next/navigation";

/** Unknown /admin/* addresses get the admin's own "not available" screen (inside the sidebar layout). */
export default function Missing() {
  notFound();
}
