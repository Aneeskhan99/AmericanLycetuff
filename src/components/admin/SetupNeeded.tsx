/** Shown instead of the admin when the database or .env.local is not ready. */
export default function SetupNeeded({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f5f6f8] p-6 font-inter">
      <div className="w-full max-w-[520px] rounded-xl border border-[#eaecf0] bg-white p-6">
        <h1 className="text-[18px] font-semibold text-[#101828]">The admin is not set up yet</h1>
        <p className="mt-2 text-[14px] text-[#475467]">{message}</p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-[14px] text-[#344054]">
          <li>Make sure PostgreSQL is running.</li>
          <li>Check <code className="rounded bg-[#f2f4f7] px-1">DATABASE_URL</code> in <code className="rounded bg-[#f2f4f7] px-1">.env.local</code>.</li>
          <li>Run <code className="rounded bg-[#f2f4f7] px-1">npm run db:setup</code>, then reload this page.</li>
        </ol>
      </div>
    </div>
  );
}
