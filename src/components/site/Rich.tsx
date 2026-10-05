import { Fragment, type ReactNode } from "react";

/**
 * Renders an editable text value with two tiny conventions school staff can type
 * in the admin:
 *   *words*  → highlighted (e.g. the crimson word in "Every Stage, under *One Roof*")
 *   new line → line break (brClassName lets a break show only on some screens, e.g. "hidden lg:block")
 */
export function Rich({ text, hl = "text-crimson", brClassName }: { text: string; hl?: string; brClassName?: string }): ReactNode {
  const lines = text.split(/\r?\n/);
  return lines.map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br className={brClassName} />}
      {line.split(/(\*[^*]+\*)/g).map((part, pi) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={pi} className={hl}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={pi}>{part}</Fragment>
        ),
      )}
    </Fragment>
  ));
}

/** Plain text of a Rich value (for alt/aria/meta): strips the * markers and line breaks. */
export const plain = (text: string) => text.replace(/\*([^*]+)\*/g, "$1").replace(/\s*\r?\n\s*/g, " ");
