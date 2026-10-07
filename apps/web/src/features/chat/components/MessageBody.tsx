import { Fragment, memo } from "react";
import { cn } from "@/shared/lib/utils/cn";
import { parseMessage, type Inline } from "../lib";

function InlineNode({ node, viewerId }: { node: Inline; viewerId?: string }) {
  switch (node.type) {
    case "text":
      return <>{node.text}</>;
    case "bold":
      return <strong className="font-semibold">{node.text}</strong>;
    case "italic":
      return <em>{node.text}</em>;
    case "code":
      return (
        <code className="rounded border border-neutral-200 bg-neutral-100 px-1 py-px font-mono text-[0.85em] text-rose-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-rose-300">
          {node.text}
        </code>
      );
    case "link":
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-violet-600 underline-offset-2 hover:underline dark:text-violet-300"
        >
          {node.text}
        </a>
      );
    case "mention": {
      const mine = node.userId === viewerId?.toLowerCase();
      return (
        <span
          className={cn(
            "rounded px-1 font-medium",
            mine
              ? "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200"
              : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
          )}
        >
          @{node.name}
        </span>
      );
    }
  }
}

/** Markdown-lite: **bold**, *italic*, `code`, ``` blocks, links, line breaks and @mention chips (mine in yellow). */
function MessageBody({ body, viewerId, className }: { body: string; viewerId?: string; className?: string }) {
  return (
    <div className={cn("text-sm leading-relaxed break-words text-neutral-800 dark:text-neutral-200", className)}>
      {parseMessage(body).map((block, i) =>
        block.type === "code" ? (
          <pre
            key={i}
            className="my-1 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          >
            {block.text}
          </pre>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {block.inlines.map((node, j) => (
              <Fragment key={j}>
                <InlineNode node={node} viewerId={viewerId} />
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  );
}

export default memo(MessageBody);
