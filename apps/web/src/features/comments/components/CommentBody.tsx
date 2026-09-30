import { Fragment } from "react";

const MENTION = /@\[([^\]]{1,100})\]\(([0-9a-fA-F-]{36})\)/g;

/** Renders a comment body, turning `@[Name](userId)` tokens into highlighted chips. */
function CommentBody({ body }: { body: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of body.matchAll(MENTION)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(<Fragment key={`t${last}`}>{body.slice(last, index)}</Fragment>);
    parts.push(
      <span
        key={`m${index}`}
        className="rounded bg-violet-100 px-1 font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
      >
        @{match[1]}
      </span>,
    );
    last = index + match[0].length;
  }
  if (last < body.length) parts.push(<Fragment key={`t${last}`}>{body.slice(last)}</Fragment>);

  return <p className="text-sm break-words whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{parts}</p>;
}

export default CommentBody;
