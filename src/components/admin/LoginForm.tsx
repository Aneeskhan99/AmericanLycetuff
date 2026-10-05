"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Input } from "./ui";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not sign in.");
        setBusy(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f5f6f8] p-4 font-inter">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/shared/logo-crest.png" alt="American Lycetuff" width={72} height={72} className="size-[72px] object-contain" />
          <h1 className="mt-3 text-[20px] font-semibold text-[#101828]">Website admin</h1>
          <p className="text-[14px] text-[#667085]">American Lycetuff · Swabi Campus</p>
        </div>
        <form onSubmit={submit} noValidate className="rounded-xl border border-[#eaecf0] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <Field label="Username" htmlFor="login-user">
              <Input
                id="login-user"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Password" htmlFor="login-pass">
              <div className="relative">
                <Input
                  id="login-pass"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12px] font-medium text-[#1a2d59] hover:bg-[#f2f4f7]"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </Field>
            {error && (
              <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">
                {error}
              </p>
            )}
            <Button type="submit" busy={busy} className="w-full">
              Sign in
            </Button>
          </div>
        </form>
        <p className="mt-4 text-center text-[12px] text-[#98a2b3]">
          Forgot your password? Ask an administrator to reset it.
        </p>
      </div>
    </div>
  );
}
