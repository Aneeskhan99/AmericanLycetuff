"use client";

import { useState, type FormEvent } from "react";
import { ROLE_LABEL, useAdmin } from "./AdminProvider";
import { Badge, Button, Card, Field, Input, PageHeader } from "./ui";

export default function AccountScreen() {
  const { user, api, toast } = useAdmin();
  const forced = user.must_change_password;

  const [details, setDetails] = useState({ name: user.name, email: user.email });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [pw, setPw] = useState({ current: "", next: "", repeat: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  const saveDetails = async (e: FormEvent) => {
    e.preventDefault();
    setDetailsError("");
    setSavingDetails(true);
    try {
      await api("/api/admin/account", { method: "PATCH", body: details });
      toast("Your details are saved");
    } catch (err) {
      setDetailsError((err as Error).message);
    } finally {
      setSavingDetails(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pw.next.length < 10) return setPwError("New password must be at least 10 characters.");
    if (pw.next !== pw.repeat) return setPwError("The new passwords do not match.");
    setSavingPw(true);
    try {
      await api("/api/admin/account/password", { body: { current: pw.current, next: pw.next } });
      setPw({ current: "", next: "", repeat: "" });
      if (forced) {
        window.location.href = "/admin";
        return;
      }
      toast("Password changed. Your other devices have been signed out.");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="My account" description={<>Signed in as <strong>{user.username}</strong> · <Badge tone="blue">{ROLE_LABEL[user.role]}</Badge></>} />

      {forced && (
        <div role="alert" className="mb-6 rounded-xl border border-[#fedf89] bg-[#fffaeb] p-4 text-[14px] text-[#93370d]">
          <strong>Choose your own password to continue.</strong> You signed in with a temporary password set by an administrator.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold">Change password</h2>
          <form onSubmit={savePassword} className="flex flex-col gap-4" noValidate>
            <Field label={forced ? "Temporary password" : "Current password"} htmlFor="pw-current" required>
              <Input id="pw-current" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="New password" htmlFor="pw-next" required hint="At least 10 characters. A short phrase is easier to remember.">
              <Input id="pw-next" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field label="Repeat new password" htmlFor="pw-repeat" required>
              <Input id="pw-repeat" type="password" autoComplete="new-password" value={pw.repeat} onChange={(e) => setPw({ ...pw, repeat: e.target.value })} />
            </Field>
            {pwError && <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">{pwError}</p>}
            <div><Button type="submit" busy={savingPw}>Change password</Button></div>
          </form>
        </Card>

        {!forced && (
          <Card className="p-5">
            <h2 className="mb-4 text-[15px] font-semibold">Your details</h2>
            <form onSubmit={saveDetails} className="flex flex-col gap-4" noValidate>
              <Field label="Full name" htmlFor="me-name" required>
                <Input id="me-name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="me-email" hint="Enquiries assigned to you are emailed here.">
                <Input id="me-email" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
              </Field>
              {detailsError && <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">{detailsError}</p>}
              <div><Button type="submit" busy={savingDetails}>Save details</Button></div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
