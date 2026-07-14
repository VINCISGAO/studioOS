import { Node, mergeAttributes } from "@tiptap/core";

export type KnowledgeCalloutVariant = "note" | "tip" | "warning";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    knowledgeCallout: {
      setCallout: (variant?: KnowledgeCalloutVariant) => ReturnType;
      toggleCallout: (variant?: KnowledgeCalloutVariant) => ReturnType;
    };
  }
}

export const KnowledgeCalloutExtension = Node.create({
  name: "knowledgeCallout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "note" as KnowledgeCalloutVariant,
        parseHTML: (element) => (element.getAttribute("data-variant") as KnowledgeCalloutVariant) ?? "note",
        renderHTML: (attributes) => ({ "data-variant": attributes.variant })
      }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="knowledge-callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "knowledge-callout",
        class: "knowledge-callout rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-zinc-800"
      }),
      0
    ];
  },

  addCommands() {
    return {
      setCallout:
        (variant = "note") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      toggleCallout:
        (variant = "note") =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant })
    };
  }
});
