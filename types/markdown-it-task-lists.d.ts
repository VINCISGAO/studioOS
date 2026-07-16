declare module "markdown-it-task-lists" {
  import type MarkdownIt from "markdown-it";

  type TaskListOptions = {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  };

  function taskLists(md: MarkdownIt, options?: TaskListOptions): void;

  export default taskLists;
}
