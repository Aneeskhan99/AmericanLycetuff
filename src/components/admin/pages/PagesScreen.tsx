"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdmin } from "../AdminProvider";
import { Badge, Card, Empty, fmtDate, PageHeader, Table } from "../ui";

type Row = {
  key: string; title: string; path: string; sections: number; fields: number; customised: number; hasDraft: boolean;
  publishedAt: string | null; publishedBy: string | null; draftUpdatedAt: string | null; draftUpdatedBy: string | null;
};

function Status({ r }: { r: Row }) {
  if (!r.fields) return <Badge tone="gray">Not editable yet</Badge>;
  if (r.hasDraft) return <Badge tone="amber">Unpublished changes</Badge>;
  return <Badge tone="green">Published</Badge>;
}

function LastEdit({ r }: { r: Row }) {
  const edited = r.hasDraft && r.draftUpdatedAt;
  return (
    <div className="text-[13px] leading-snug">
      {edited ? (
        <>
          <span className="block text-[#344054]">Draft saved {fmtDate(r.draftUpdatedAt)}</span>
          <span className="block text-[#98a2b3]">{r.draftUpdatedBy ?? "Unknown"}</span>
        </>
      ) : r.publishedAt ? (
        <>
          <span className="block text-[#344054]">Published {fmtDate(r.publishedAt)}</span>
          <span className="block text-[#98a2b3]">{r.publishedBy ?? "Unknown"}</span>
        </>
      ) : (
        <span className="text-[#98a2b3]">Never edited (website text)</span>
      )}
    </div>
  );
}

export default function PagesScreen() {
  const { api, toast } = useAdmin();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    api<{ rows: Row[] }>("/api/admin/pages")
      .then((d) => setRows(d.rows))
      .catch((e: Error) => toast(e.message, "error"));
  }, [api, toast]);

  const pending = rows?.filter((r) => r.hasDraft).length ?? 0;

  return (
    <>
      <PageHeader
        title="Pages"
        description={
          <>
            Change the text, pictures, buttons and lists on the website&apos;s pages. Edits are saved as a draft you can preview;
            visitors see them only after you publish.
            {pending > 0 && <> <strong className="font-medium text-[#b54708]">{pending} page{pending === 1 ? " has" : "s have"} unpublished changes.</strong></>}
          </>
        }
      />
      <Card>
        {!rows ? (
          <p className="px-6 py-14 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty title="No editable pages">Pages appear here once they are set up in the website code.</Empty>
        ) : (
          <>
            {/* Phones: cards */}
            <ul className="divide-y divide-[#f2f4f7] md:hidden">
              {rows.map((r) => (
                <li key={r.key}>
                  {r.fields ? (
                    <Link href={`/admin/pages/${r.key}`} className="flex flex-col gap-2 px-4 py-4 hover:bg-[#f9fafb]">
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          <span className="block text-[15px] font-medium text-[#101828]">{r.title}</span>
                          <span className="block font-mono text-[12px] text-[#667085]">{r.path}</span>
                        </span>
                        <Status r={r} />
                      </span>
                      <span className="text-[12px] text-[#667085]">
                        {r.sections} section{r.sections === 1 ? "" : "s"} · {r.fields} field{r.fields === 1 ? "" : "s"}
                        {r.customised > 0 && ` · ${r.customised} changed from default`}
                      </span>
                      <LastEdit r={r} />
                    </Link>
                  ) : (
                    <div className="flex items-start justify-between gap-3 px-4 py-4 text-[#98a2b3]">
                      <span>
                        <span className="block text-[15px] font-medium">{r.title}</span>
                        <span className="block font-mono text-[12px]">{r.path}</span>
                      </span>
                      <Status r={r} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {/* Tablet / desktop: table */}
            <div className="hidden md:block">
              <Table
                head={
                  <>
                    <th>Page</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Last change</th>
                    <th className="text-right">Actions</th>
                  </>
                }
              >
                {rows.map((r) => (
                  <tr key={r.key} className={r.fields ? "" : "text-[#98a2b3]"}>
                    <td>
                      {r.fields ? (
                        <Link href={`/admin/pages/${r.key}`} className="font-medium text-[#101828] hover:underline">{r.title}</Link>
                      ) : (
                        <span className="font-medium">{r.title}</span>
                      )}
                      <a href={r.path} target="_blank" rel="noreferrer" className="block font-mono text-[12px] text-[#667085] hover:underline">{r.path}</a>
                    </td>
                    <td className="text-[13px]">
                      {r.fields ? (
                        <>
                          {r.sections} section{r.sections === 1 ? "" : "s"}, {r.fields} field{r.fields === 1 ? "" : "s"}
                          {r.customised > 0 && <span className="block text-[12px] text-[#667085]">{r.customised} changed from default</span>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td><Status r={r} /></td>
                    <td className="whitespace-nowrap"><LastEdit r={r} /></td>
                    <td className="text-right">
                      {r.fields ? (
                        <Link href={`/admin/pages/${r.key}`} className="inline-flex h-8 items-center rounded-md border border-[#d0d5dd] bg-white px-3 text-[13px] font-medium text-[#1d2939] hover:bg-[#f2f4f7]">
                          Edit
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
