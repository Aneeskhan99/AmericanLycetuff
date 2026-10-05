import Link from "next/link";

/** Shown inside the admin when a screen does not exist or the account cannot open it. */
export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-[480px] py-16 text-center">
      <h1 className="text-[20px] font-semibold text-[#101828]">This screen is not available</h1>
      <p className="mt-2 text-[14px] text-[#667085]">It does not exist, or your account does not have access to it. Ask an administrator if you need it.</p>
      <Link href="/admin" className="mt-6 inline-flex h-10 items-center rounded-md bg-[#1a2d59] px-4 text-[14px] font-medium text-white hover:bg-[#13224a]">
        Back to the dashboard
      </Link>
    </div>
  );
}
