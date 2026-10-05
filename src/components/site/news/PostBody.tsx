import Link from "next/link";
import type { ReactNode } from "react";
import { renderJSONContentToReactElement, type MarkProps, type NodeProps } from "@tiptap/static-renderer/json/react";
import type { MediaRef } from "@/lib/media";
import type { DocNode } from "@/lib/posts";

/**
 * Renders a post body (Tiptap JSON, already cleaned on save) to React on the server
 * with @tiptap/static-renderer. Only the node types and marks below are rendered;
 * anything else is dropped. No raw HTML is ever injected.
 */
type N = NodeProps<DocNode, ReactNode>;
type M = MarkProps<{ type: string; attrs?: Record<string, unknown> }, ReactNode, DocNode>;

function safeHref(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (/[\u0000-\u001f\u007f\s\\]/.test(s)) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (s.startsWith("#") || /^mailto:/i.test(s) || /^https?:\/\//i.test(s)) return s;
  return null;
}

const linkCls = "text-crimson underline decoration-1 underline-offset-[3px] transition-colors hover:text-navy";

export default function PostBody({ content, media }: { content: DocNode; media: Record<number, MediaRef> }) {
  const render = renderJSONContentToReactElement<{ type: string; attrs?: Record<string, unknown> }, DocNode>({
    nodeMapping: {
      doc: ({ children }: N) => <>{children}</>,
      text: ({ node }: N) => <>{node.text ?? ""}</>,
      hardBreak: () => <br />,
      paragraph: ({ children, node }: N) => (node.content?.length ? <p>{children}</p> : null),
      heading: ({ node, children }: N) =>
        node.content?.length ? (Number(node.attrs?.level) === 2 ? <h2>{children}</h2> : <h3>{children}</h3>) : null,
      bulletList: ({ children }: N) => <ul>{children}</ul>,
      orderedList: ({ node, children }: N) => <ol start={Number(node.attrs?.start) > 1 ? Number(node.attrs?.start) : undefined}>{children}</ol>,
      listItem: ({ children }: N) => <li>{children}</li>,
      blockquote: ({ children }: N) => <blockquote>{children}</blockquote>,
      image: ({ node }: N) => {
        const id = Number(node.attrs?.mediaId);
        const ref = media[id];
        if (!ref) return null;
        const alt = typeof node.attrs?.alt === "string" && node.attrs.alt ? node.attrs.alt : ref.alt;
        return (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ref.url}
              srcSet={ref.srcSet || undefined}
              sizes="(min-width: 1024px) 860px, 100vw"
              alt={alt}
              width={ref.width ?? undefined}
              height={ref.height ?? undefined}
              loading="lazy"
            />
          </figure>
        );
      },
    },
    markMapping: {
      bold: ({ children }: M) => <strong>{children}</strong>,
      italic: ({ children }: M) => <em>{children}</em>,
      link: ({ mark, children }: M) => {
        const href = safeHref(mark.attrs?.href);
        if (!href) return <>{children}</>;
        if (href.startsWith("/")) return <Link href={href} className={linkCls}>{children}</Link>;
        if (/^https?:/i.test(href))
          return <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{children}</a>;
        return <a href={href} className={linkCls}>{children}</a>;
      },
    },
    unhandledNode: () => null,
    unhandledMark: ({ children }: M) => <>{children}</>,
  });

  return (
    <div
      className={[
        "text-[17px] leading-[29px] text-[#3f3f3f] lg:text-[19px] lg:leading-[33px]",
        "[&>*+*]:mt-[22px] lg:[&>*+*]:mt-[26px]",
        "[&_h2]:!mt-[44px] [&_h2]:text-[28px] [&_h2]:font-normal [&_h2]:leading-[34px] [&_h2]:tracking-[-0.4px] [&_h2]:text-black lg:[&_h2]:!mt-[56px] lg:[&_h2]:text-[38px] lg:[&_h2]:leading-[46px]",
        "[&_h3]:!mt-[36px] [&_h3]:text-[22px] [&_h3]:font-medium [&_h3]:leading-[30px] [&_h3]:text-navy lg:[&_h3]:text-[26px] lg:[&_h3]:leading-[34px]",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-[1.3em] [&_ol]:pl-[1.4em] [&_li]:pl-[4px] [&_li+li]:mt-[8px] [&_li]:marker:text-crimson [&_li>p+*]:mt-[8px]",
        "[&_blockquote]:border-l-[3px] [&_blockquote]:border-crimson [&_blockquote]:pl-[20px] [&_blockquote]:text-[19px] [&_blockquote]:italic [&_blockquote]:leading-[31px] [&_blockquote]:text-navy lg:[&_blockquote]:pl-[28px] lg:[&_blockquote]:text-[22px] lg:[&_blockquote]:leading-[36px] [&_blockquote>*+*]:mt-[14px]",
        "[&_figure]:!my-[32px] lg:[&_figure]:!my-[44px] [&_figure_img]:h-auto [&_figure_img]:w-full",
        "[&_strong]:font-semibold [&_strong]:text-black",
      ].join(" ")}
    >
      {render({ content })}
    </div>
  );
}
