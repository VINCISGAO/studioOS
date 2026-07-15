import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "mark",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "div",
  "span",
  "video",
  "source",
  "iframe",
  "label",
  "input"
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  video: ["src", "controls", "playsinline", "width", "height"],
  source: ["src", "type"],
  iframe: ["src", "allow", "allowfullscreen", "frameborder", "width", "height"],
  input: ["type", "checked", "disabled"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
  "*": [
    "class",
    "id",
    "data-type",
    "data-align",
    "data-width",
    "data-youtube-video"
  ]
};

/** Node-safe HTML sanitizer — no jsdom / isomorphic-dompurify. */
export function sanitizeKnowledgeHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"]
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer"
      })
    }
  });
}
