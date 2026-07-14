import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

export type KnowledgeImageAlign = "left" | "center" | "right";

export const KnowledgeEnhancedImage = Image.extend({
  name: "image",
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      alt: { default: null },
      title: { default: null },
      align: {
        default: "center" as KnowledgeImageAlign,
        parseHTML: (element) => (element.getAttribute("data-align") as KnowledgeImageAlign) ?? "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align })
      },
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("data-width") ?? "100%",
        renderHTML: (attributes) => ({ "data-width": attributes.width })
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="knowledge-image"] img',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title")
          };
        }
      },
      {
        tag: "img[src]",
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title")
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const align = (HTMLAttributes["data-align"] as KnowledgeImageAlign) ?? "center";
    const width = HTMLAttributes["data-width"] ?? "100%";
    const figureClass =
      align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "mr-auto";
    const figureAttrs = mergeAttributes({
      class: `my-6 max-w-full ${figureClass}`,
      style: `width:${width}`,
      "data-type": "knowledge-image"
    });
    const imageNode: DOMOutputSpec = [
      "img",
      mergeAttributes(HTMLAttributes, {
        class: "w-full rounded-2xl border border-zinc-200 object-cover",
        loading: "lazy"
      })
    ];

    if (HTMLAttributes.title) {
      return [
        "figure",
        figureAttrs,
        imageNode,
        ["figcaption", { class: "mt-2 text-center text-sm text-zinc-500" }, HTMLAttributes.title]
      ];
    }

    return ["figure", figureAttrs, imageNode];
  }
});
