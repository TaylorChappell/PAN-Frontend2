import { Fragment } from "react";

/**
 * Renders the small, safe Markdown subset PAN uses in chat.
 * React escapes all text, so model output cannot inject HTML.
 */
export function InlineMarkdown({ children }) {
  const text = String(children ?? "");
  const parts = text.split(/(\*\*(?:[^*]|\*(?!\*))+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
