import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    knowledgeVideo: {
      setKnowledgeVideo: (src: string) => ReturnType;
    };
  }
}

export const KnowledgeVideoExtension = Node.create({
  name: "knowledgeVideo",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="knowledge-video"] video',
        getAttrs: (element) => {
          const video = element as HTMLVideoElement;
          return {
            src: video.getAttribute("src"),
            title: video.getAttribute("title")
          };
        }
      },
      {
        tag: "video[src]",
        getAttrs: (element) => {
          const video = element as HTMLVideoElement;
          return {
            src: video.getAttribute("src"),
            title: video.getAttribute("title")
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "knowledge-video", class: "my-6" }),
      [
        "video",
        mergeAttributes(HTMLAttributes, {
          controls: "true",
          playsinline: "true",
          class: "w-full rounded-2xl border border-zinc-200 bg-black"
        })
      ]
    ];
  },

  addCommands() {
    return {
      setKnowledgeVideo:
        (src: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src }
          })
    };
  }
});
