"use client";

import { useEffect } from "react";

/**
 * Click-to-edit bridge for Admin → Pages → Visual editor.
 *
 * It only runs when ALL of these hold: the page is in draft mode (it is rendered
 * by PreviewBar, which exists only then), the URL has ?als-edit=1, and the page is
 * framed by a same-origin parent (the admin). Messages are accepted only from that
 * parent window and origin. Visitors never get this code path.
 *
 * The admin sends the page's editable values; the bridge finds the elements that
 * show them (text, images, buttons), outlines them on hover and reports clicks back
 * to the admin, which opens the matching field. Header/footer parts are marked in
 * code with data-als-site="<settings group>".
 */

type Kind = "text" | "image" | "link";
export type BridgeField = { path: string; item?: number; sub?: string; kind: Kind; value: string; label: string };
export type BridgeTarget = { kind: "field"; key: string; path: string; item?: number; sub?: string; label: string } | { kind: "site"; group: string; label: string };

const SITE_LABELS: Record<string, string> = {
  branding: "Logo",
  announcement: "Announcement bar",
  contact: "Contact details",
  social: "Social links",
  footer: "Footer texts",
};

export const fieldKey = (f: { path: string; item?: number; sub?: string }) => (f.item === undefined ? f.path : `${f.path}#${f.item}.${f.sub}`);

const norm = (s: string) => s.replace(/\*([^*]+)\*/g, "$1").replace(/\s+/g, "").toLowerCase();

function srcKey(raw: string | null): string {
  if (!raw) return "";
  try {
    const u = new URL(raw, location.href);
    if (u.pathname.startsWith("/_next/image")) return decodeURIComponent(u.searchParams.get("url") ?? "");
    return u.origin === location.origin ? decodeURIComponent(u.pathname) : u.href;
  } catch {
    return raw;
  }
}

function richHtml(v: string): string {
  const esc = v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*([^*]+)\*/g, '<span class="text-crimson">$1</span>').replace(/\r?\n/g, "<br>");
}

export default function EditBridge() {
  useEffect(() => {
    if (new URLSearchParams(location.search).get("als-edit") !== "1" || window.parent === window) return;
    let parentOrigin = "";
    try {
      parentOrigin = window.parent.location.origin; // throws when the parent is another site
    } catch {
      return;
    }
    if (parentOrigin !== location.origin) return;

    const post = (msg: Record<string, unknown>) => window.parent.postMessage({ als: 1, ...msg }, location.origin);
    const labels = new Map<string, string>();

    // ------------------------------------------------------------ chrome
    const style = document.createElement("style");
    style.textContent = `
      [data-als-preview-bar]{display:none!important}
      [data-als-key],[data-als-site]{cursor:pointer}
      .als-box{position:fixed;pointer-events:none;z-index:2147483646;border-radius:3px;transition:all .08s ease-out}
      .als-box span{position:absolute;left:-2px;white-space:nowrap;font:600 calc(12px*var(--als-s,1))/1 Inter,system-ui,sans-serif;color:#fff;padding:calc(5px*var(--als-s,1)) calc(7px*var(--als-s,1));border-radius:4px 4px 4px 0}
      .als-hover{border:calc(2px*var(--als-s,1)) dashed #d31245;background:rgba(211,18,69,.06)}
      .als-hover span{background:#d31245}
      .als-sel{border:calc(2px*var(--als-s,1)) solid #1a2d59;box-shadow:0 0 0 calc(4px*var(--als-s,1)) rgba(26,45,89,.15)}
      .als-sel span{background:#1a2d59}
      .als-toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;background:#101828;color:#fff;font:500 13px Inter,system-ui,sans-serif;padding:9px 14px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
    `;
    document.head.appendChild(style);
    const box = (cls: string) => {
      const b = document.createElement("div");
      b.className = `als-box ${cls}`;
      b.style.display = "none";
      b.appendChild(document.createElement("span"));
      document.body.appendChild(b);
      return b;
    };
    const hoverBox = box("als-hover");
    const selBox = box("als-sel");
    let hovered: Element | null = null;
    /** The admin shows this page scaled down; labels are enlarged by 1/scale so they stay readable. */
    let labelScale = 1;
    let selected: Element | null = null;

    const place = (b: HTMLDivElement, el: Element | null, text: string) => {
      if (!el || !el.isConnected) {
        b.style.display = "none";
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        b.style.display = "none";
        return;
      }
      Object.assign(b.style, { display: "block", left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px` });
      (b.firstChild as HTMLSpanElement).textContent = text;
      const lh = 24 * labelScale;
      (b.firstChild as HTMLSpanElement).style.top = r.top < lh + 6 ? `${r.height + 8}px` : `${-lh}px`;
    };
    const labelFor = (el: Element) => {
      const site = el.getAttribute("data-als-site");
      if (site) return `${SITE_LABELS[site] ?? site} · site setting`;
      return labels.get(el.getAttribute("data-als-key") ?? "") ?? "Edit";
    };
    const refresh = () => {
      place(hoverBox, hovered && hovered !== selected ? hovered : null, hovered ? `✎ ${labelFor(hovered)}` : "");
      place(selBox, selected, selected ? labelFor(selected) : "");
    };

    let toastTimer: ReturnType<typeof setTimeout> | undefined;
    const toast = (text: string) => {
      let t = document.querySelector<HTMLDivElement>(".als-toast");
      if (!t) {
        t = document.createElement("div");
        t.className = "als-toast";
        document.body.appendChild(t);
      }
      t.textContent = text;
      t.style.display = "block";
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t && (t.style.display = "none"), 2200);
    };

    // ------------------------------------------------------------ tagging
    const tag = (fields: BridgeField[]) => {
      document.querySelectorAll("[data-als-key]").forEach((el) => el.removeAttribute("data-als-key"));
      labels.clear();
      const root = document.querySelector("main") ?? document.body;
      const assign = (els: Element[], descs: BridgeField[]) => {
        els.forEach((el, i) => {
          if (el.hasAttribute("data-als-key")) return;
          const d = descs[i % descs.length];
          el.setAttribute("data-als-key", fieldKey(d));
          labels.set(fieldKey(d), d.label);
        });
      };

      // Text: deepest elements whose whole text equals a value.
      const textDescs = new Map<string, BridgeField[]>();
      const linkDescs = new Map<string, BridgeField[]>();
      const imgDescs = new Map<string, BridgeField[]>();
      for (const f of fields) {
        if (f.kind === "image") {
          if (!f.value) continue;
          (imgDescs.get(f.value) ?? imgDescs.set(f.value, []).get(f.value)!).push(f);
          continue;
        }
        const k = norm(f.value);
        if (k.length < 2) continue;
        const m = f.kind === "link" ? linkDescs : textDescs;
        (m.get(k) ?? m.set(k, []).get(k)!).push(f);
      }

      const byText = new Map<string, Element[]>();
      const anchors = new Map<string, Element[]>();
      root.querySelectorAll("*").forEach((el) => {
        if (el.closest("script,style,svg,noscript,.als-box")) return;
        const raw = el.textContent ?? "";
        if (!raw.trim() || raw.length > 4000) return;
        const k = norm(raw);
        if (el.matches("a[href],button") && linkDescs.has(k)) (anchors.get(k) ?? anchors.set(k, []).get(k)!).push(el);
        if (textDescs.has(k)) (byText.get(k) ?? byText.set(k, []).get(k)!).push(el);
      });
      for (const [k, els] of anchors) assign(els, linkDescs.get(k)!);
      for (const [k, els] of byText) {
        const deepest = els.filter((el) => !els.some((o) => o !== el && el.contains(o)));
        assign(deepest, textDescs.get(k)!);
      }

      const imgs = new Map<string, Element[]>();
      root.querySelectorAll("img").forEach((img) => {
        const k = srcKey(img.getAttribute("src"));
        if (imgDescs.has(k)) (imgs.get(k) ?? imgs.set(k, []).get(k)!).push(img);
      });
      for (const [k, els] of imgs) assign(els, imgDescs.get(k)!);

      document.querySelectorAll("[data-als-site]").forEach((el) => labels.set(`site:${el.getAttribute("data-als-site")}`, SITE_LABELS[el.getAttribute("data-als-site") ?? ""] ?? ""));
      const found = [...new Set([...document.querySelectorAll("[data-als-key]")].map((el) => el.getAttribute("data-als-key")!))];
      post({ type: "tagged", found });
    };

    // ------------------------------------------------------------ picking
    const pick = (x: number, y: number): Element | null => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (el.classList.contains("als-box")) continue;
        const t = el.closest("[data-als-key],[data-als-site]");
        if (t) return t;
      }
      // Images under overlays (or with pointer-events:none): smallest tagged image under the pointer.
      let best: Element | null = null;
      let area = Infinity;
      document.querySelectorAll("img[data-als-key]").forEach((img) => {
        const r = img.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && r.width * r.height < area) {
          best = img;
          area = r.width * r.height;
        }
      });
      return best;
    };

    const select = (el: Element, notify = true) => {
      selected = el;
      refresh();
      if (!notify) return;
      const site = el.getAttribute("data-als-site");
      if (site) {
        post({ type: "select", target: { kind: "site", group: site, label: SITE_LABELS[site] ?? site } satisfies BridgeTarget });
        return;
      }
      const key = el.getAttribute("data-als-key")!;
      const [path, rest] = key.split("#");
      const [item, sub] = rest ? rest.split(".") : [];
      post({ type: "select", target: { kind: "field", key, path, item: item === undefined ? undefined : Number(item), sub, label: labels.get(key) ?? "" } satisfies BridgeTarget });
    };

    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hovered = pick(e.clientX, e.clientY);
        refresh();
      });
    };
    const onLeave = () => {
      hovered = null;
      refresh();
    };
    const onClick = (e: MouseEvent) => {
      const t = pick(e.clientX, e.clientY);
      if (t) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        select(t);
        return;
      }
      if ((e.target as Element | null)?.closest?.("a[href]")) {
        e.preventDefault();
        toast("Links are turned off while editing. Use the page list to edit another page.");
      }
    };
    const onSubmit = (e: Event) => {
      e.preventDefault();
      toast("Forms are turned off while editing.");
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    };

    // ------------------------------------------------------------ messages
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      const m = e.data as { als?: number; type?: string } & Record<string, unknown>;
      if (!m || m.als !== 1) return;
      if (m.type === "fields") {
        tag(m.fields as BridgeField[]);
        if (typeof m.selected === "string" && m.selected) {
          const el = m.selected.startsWith("site:")
            ? document.querySelector(`[data-als-site="${CSS.escape(m.selected.slice(5))}"]`)
            : document.querySelector(`[data-als-key="${CSS.escape(m.selected)}"]`);
          if (el) select(el, false);
        }
      } else if (m.type === "scale") {
        const sc = Number(m.scale);
        labelScale = sc > 0.2 && sc <= 1 ? 1 / sc : 1;
        document.documentElement.style.setProperty("--als-s", String(labelScale));
        refresh();
      } else if (m.type === "value") {
        const f = m.field as BridgeField;
        const key = fieldKey(f);
        document.querySelectorAll(`[data-als-key="${CSS.escape(key)}"]`).forEach((el) => {
          if (f.kind === "image" && el instanceof HTMLImageElement) {
            el.removeAttribute("srcset");
            el.src = f.value || el.src;
          } else if (f.kind === "link") {
            const leaf = [...el.querySelectorAll("*")].reverse().find((c) => c.children.length === 0 && (c.textContent ?? "").trim()) ?? el;
            leaf.textContent = f.value;
          } else {
            el.innerHTML = richHtml(f.value);
          }
        });
        refresh();
      } else if (m.type === "focus") {
        const key = String(m.key ?? "");
        const el = key.startsWith("site:")
          ? document.querySelector(`[data-als-site="${CSS.escape(key.slice(5))}"]`)
          : document.querySelector(`[data-als-key="${CSS.escape(key)}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          select(el, false);
        } else toast("That part is not shown on this screen size, or is not visible right now.");
      }
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    post({ type: "hello" });

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      style.remove();
      hoverBox.remove();
      selBox.remove();
    };
  }, []);
  return null;
}
