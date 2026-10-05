import { redirect } from "next/navigation";
import { AdminProvider } from "@/components/admin/AdminProvider";
import Shell from "@/components/admin/Shell";
import SetupNeeded from "@/components/admin/SetupNeeded";
import { currentSession } from "@/lib/auth";

/** Every signed-in admin screen. Checks the session on the server before rendering anything. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await currentSession();
  } catch (err) {
    return <SetupNeeded message={(err as Error).message} />;
  }
  if (!session) redirect("/admin/login");
  return (
    <AdminProvider user={session.user} csrf={session.csrf}>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}
