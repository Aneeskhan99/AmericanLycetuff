"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { NodeSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import MediaPicker, { type PickedMedia } from "../MediaPicker";
import { Button, Dialog, ErrorNote, Field, Input } from "../ui";
import { safeHref, type TiptapJSON } from "./types";

/**
 * The post body editor (Tiptap). Only what the public renderer supports is enabled:
 * paragraphs, H2/H3, bold, italic, lists, blockquote, links and media-library images.
 * The server cleans the JSON again on save (src/lib/posts.ts → sanitizeDoc).
 */
const CSS = `
.news-editor .ProseMirror{min-height:360px;padding:20px 22px;outline:none;font-size:16px;line-height:1.7;color:#1d2939}
.news-editor .ProseMirror>*+*{margin-top:.9em}
.news-editor .ProseMirror h2{font-size:24px;line-height:1.3;font-weight:600;color:#101828;margin-top:1.3em}
.news-editor .ProseMirror h3{font-size:19px;line-height:1.35;font-weight:600;color:#101828;margin-top:1.1em}
.news-editor .ProseMirror ul{list-style:disc;padding-left:1.4em}
.news-editor .ProseMirror ol{list-style:decimal;padding-left:1.4em}
.news-editor .ProseMirror li>p{margin:0}
.news-editor .ProseMirror li+li{margin-top:.3em}
.news-editor .ProseMirror blockquote{border-left:3px solid #d31245;padding-left:16px;color:#475467;font-style:italic}
.news-editor .ProseMirror a{color:#d31245;text-decoration:underline}
.news-editor .ProseMirror img{display:block;max-width:100%;height:auto;border-radius:6px}
.news-editor .ProseMirror img.ProseMirror-selectednode{outline:3px solid #1a2d59;outline-offset:2px}
.news-editor .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;height:0;color:#98a2b3;pointer-events:none}
`;

export default function RichEditor({ initial, onChange, editable = true }: { initial: TiptapJSON; onChange: (doc: TiptapJSON) => void; editable?: boolean }) {
  const changeRef = useRef(onChange);
  const openLinkRef = useRef<() => void>(() => {});
  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer", target: null },
        isAllowedUri: (url) => Boolean(safeHref(url)),
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Write the post… Use the toolbar for headings, lists, links and images." }),
    ],
    content: initial,
    editorProps: {
      attributes: { "aria-label": "Post body", "aria-multiline": "true", role: "textbox" },
      handleKeyDown: (_view, e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          openLinkRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => changeRef.current(editor.getJSON() as TiptapJSON),
  });

  return (
    <div className="news-editor overflow-hidden rounded-lg border border-[#d0d5dd] bg-white focus-within:border-[#1a2d59] focus-within:ring-2 focus-within:ring-[#1a2d59]/15">
      <style>{CSS}</style>
      {editor && editable && <Toolbar editor={editor} openLinkRef={openLinkRef} />}
      <EditorContent editor={editor} />
      {!editor && <div className="min-h-[360px] px-5 py-5 text-[14px] text-[#98a2b3]">Loading editor…</div>}
    </div>
  );
}

// ------------------------------------------------------------------ toolbar
function Toolbar({ editor, openLinkRef }: { editor: Editor; openLinkRef: RefObject<() => void> }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      p: e.isActive("paragraph"),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      ul: e.isActive("bulletList"),
      ol: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
      image: e.state.selection instanceof NodeSelection && e.state.selection.node.type.name === "image",
      imageAlt: (e.getAttributes("image").alt as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [altFor, setAltFor] = useState<{ media: PickedMedia | null; alt: string } | null>(null);
  useEffect(() => {
    openLinkRef.current = () => setLinkOpen(true);
  }, [openLinkRef]);

  const c = () => editor.chain().focus();
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-[#eaecf0] bg-[#f9fafb] px-2 py-1.5" role="toolbar" aria-label="Formatting">
      <Tb label="Paragraph" active={s.p && !s.h2 && !s.h3} onClick={() => c().setParagraph().run()}><span className="text-[13px] font-medium">P</span></Tb>
      <Tb label="Heading 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><span className="text-[13px] font-semibold">H2</span></Tb>
      <Tb label="Heading 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><span className="text-[13px] font-semibold">H3</span></Tb>
      <Sep />
      <Tb label="Bold" shortcut="Ctrl+B" active={s.bold} onClick={() => c().toggleBold().run()}><span className="text-[15px] font-bold">B</span></Tb>
      <Tb label="Italic" shortcut="Ctrl+I" active={s.italic} onClick={() => c().toggleItalic().run()}><span className="font-serif text-[15px] italic">I</span></Tb>
      <Sep />
      <Tb label="Bulleted list" active={s.ul} onClick={() => c().toggleBulletList().run()}>
        <Svg d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </Tb>
      <Tb label="Numbered list" active={s.ol} onClick={() => c().toggleOrderedList().run()}>
        <Svg d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.5 14.5a1.5 1.5 0 1 1 2.6 1L3.5 19h3" />
      </Tb>
      <Tb label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
        <Svg d="M7 7h4v5c0 3-2 5-4 5M15 7h4v5c0 3-2 5-4 5" />
      </Tb>
      <Sep />
      <Tb label={s.link ? "Edit link" : "Add link"} shortcut="Ctrl+K" active={s.link} onClick={() => setLinkOpen(true)}>
        <Svg d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </Tb>
      {s.link && (
        <Tb label="Remove link" onClick={() => c().extendMarkRange("link").unsetLink().run()}>
          <Svg d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1M4 4l16 16" />
        </Tb>
      )}
      <Tb label="Insert image" onClick={() => setPicker(true)}>
        <Svg d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9h.01" />
      </Tb>
      {s.image && (
        <button type="button" onClick={() => setAltFor({ media: null, alt: s.imageAlt })} className="h-8 rounded px-2 text-[12px] font-medium text-[#1a2d59] hover:bg-[#eaecf0]">
          Image description
        </button>
      )}
      <span className="ml-auto flex">
        <Tb label="Undo" shortcut="Ctrl+Z" disabled={!s.canUndo} onClick={() => c().undo().run()}><Svg d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" /></Tb>
        <Tb label="Redo" shortcut="Ctrl+Shift+Z" disabled={!s.canRedo} onClick={() => c().redo().run()}><Svg d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" /></Tb>
      </span>

      {linkOpen && <LinkDialog editor={editor} current={s.href} onClose={() => setLinkOpen(false)} />}
      <MediaPicker
        open={picker}
        kind="image"
        onClose={() => setPicker(false)}
        onPick={([m]) => {
          setPicker(false);
          if (m) setAltFor({ media: m, alt: m.alt });
        }}
      />
      {altFor && (
        <AltDialog
          initial={altFor.alt}
          inserting={Boolean(altFor.media)}
          onClose={() => setAltFor(null)}
          onSave={(alt) => {
            if (altFor.media) c().setImage({ src: altFor.media.url, alt }).run();
            else c().updateAttributes("image", { alt }).run();
            setAltFor(null);
          }}
        />
      )}
    </div>
  );
}

function Tb({ label, shortcut, active, disabled, onClick, children }: { label: string; shortcut?: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded text-[#344054] transition-colors hover:bg-[#eaecf0] disabled:opacity-35 disabled:hover:bg-transparent ${active ? "bg-[#e0e7f5] text-[#1a2d59]" : ""}`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span aria-hidden className="mx-1 h-5 w-px bg-[#d0d5dd]" />;
const Svg = ({ d }: { d: string }) => (
  <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

// ------------------------------------------------------------------ dialogs
function LinkDialog({ editor, current, onClose }: { editor: Editor; current: string; onClose: () => void }) {
  const [href, setHref] = useState(current);
  const [error, setError] = useState("");
  const empty = editor.state.selection.empty && !current;

  const apply = (e: FormEvent) => {
    e.preventDefault();
    const safe = safeHref(href);
    if (!safe) {
      setError("Use a full web address (https://…), an email link (mailto:…) or a page on this site (/admissions).");
      return;
    }
    const chain = editor.chain().focus();
    if (empty) chain.insertContent({ type: "text", text: href.trim(), marks: [{ type: "link", attrs: { href: safe } }] }).run();
    else chain.extendMarkRange("link").setLink({ href: safe }).run();
    onClose();
  };

  return (
    <Dialog
      open
      title={current ? "Edit link" : "Add link"}
      onClose={onClose}
      footer={
        <>
          {current && (
            <Button tone="ghost" className="mr-auto text-[#b42318]" onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); onClose(); }}>
              Remove link
            </Button>
          )}
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="link-form">{current ? "Update link" : "Add link"}</Button>
        </>
      }
    >
      <form id="link-form" onSubmit={apply} className="flex flex-col gap-3" noValidate>
        <Field label="Link address" htmlFor="link-href" hint={empty ? "No text is selected, so the address itself is inserted as the link text." : "Examples: https://example.com, /admissions, mailto:info@alsswabi.edu.pk"}>
          <Input id="link-href" value={href} autoFocus onChange={(e) => { setHref(e.target.value); setError(""); }} placeholder="https://" spellCheck={false} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}

function AltDialog({ initial, inserting, onClose, onSave }: { initial: string; inserting: boolean; onClose: () => void; onSave: (alt: string) => void }) {
  const [alt, setAlt] = useState(initial);
  return (
    <Dialog
      open
      title={inserting ? "Insert image" : "Image description"}
      onClose={onClose}
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="alt-form">{inserting ? "Insert image" : "Save"}</Button>
        </>
      }
    >
      <form id="alt-form" onSubmit={(e) => { e.preventDefault(); onSave(alt.trim().slice(0, 300)); }} className="flex flex-col gap-3">
        <Field label="Describe the image (alt text)" htmlFor="img-alt" hint="Read aloud by screen readers. Leave empty only if the image is purely decorative.">
          <Input id="img-alt" value={alt} autoFocus maxLength={300} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Grade 5 students presenting their robotics project" />
        </Field>
      </form>
    </Dialog>
  );
}
