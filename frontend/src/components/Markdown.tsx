"use client";

import ReactMarkdown from "react-markdown";

/** Renders the AI's markdown safely: no raw HTML, no images, links open in a new tab. */
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      disallowedElements={["img", "h1", "h2", "h3", "h4", "h5", "h6", "table"]}
      unwrapDisallowed
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
