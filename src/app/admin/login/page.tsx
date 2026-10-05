import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import SetupNeeded from "@/components/admin/SetupNeeded";
import { currentSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  try {
    if (await currentSession()) redirect("/admin");
  } catch (err) {
    unstable_rethrow(err);
    return <SetupNeeded message={(err as Error).message} />;
  }
  return <LoginForm />;
}
