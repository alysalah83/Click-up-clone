"use client";

import { useRef, useState } from "react";
import { displayName } from "@/features/members/lib/avatar";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { cn } from "@/shared/lib/utils/cn";
import { useCreateComment } from "../hooks/useComments";

interface CommentComposerProps {
  taskId: string;
  listId: string;
  parentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}

/** Textarea with `@` autocomplete of workspace members; inserts `@[Name](userId)` tokens. */
function CommentComposer({ taskId, listId, parentId, placeholder, autoFocus, onDone }: CommentComposerProps) {
  const { members } = useListMembers(listId);
  const create = useCreateComment(taskId);
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  const before = value.slice(0, caret);
  const trigger = /(^|\s)@([^\s@[\]]{0,30})$/.exec(before);
  const query = trigger?.[2]?.toLowerCase();
  const options =
    query === undefined
      ? []
      : (members ?? [])
          .filter((m) => displayName({ id: m.userId, name: m.name, email: m.email }).toLowerCase().includes(query))
          .slice(0, 5);
  const showOptions = options.length > 0;

  const pick = (index: number) => {
    const member = options[index];
    if (!member || !trigger) return;
    const name = displayName({ id: member.userId, name: member.name, email: member.email }).replace(/[[\]]/g, "");
    const start = caret - trigger[2]!.length - 1;
    const token = `@[${name}](${member.userId}) `;
    const next = value.slice(0, start) + token + value.slice(caret);
    const nextCaret = start + token.length;
    setValue(next);
    setCaret(nextCaret);
    setActive(0);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const submit = () => {
    const body = value.trim();
    if (!body || create.isPending) return;
    create.mutate(
      { body, parentId },
      {
        onSuccess() {
          setValue("");
          setCaret(0);
          onDone?.();
        },
      },
    );
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
        maxLength={5000}
        placeholder={placeholder ?? "Write a comment… use @ to mention"}
        aria-label={parentId ? "reply" : "new comment"}
        onChange={(e) => {
          setValue(e.target.value);
          setCaret(e.target.selectionStart);
          setActive(0);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={(e) => {
          if (showOptions) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % options.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + options.length) % options.length);
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              pick(active);
              return;
            }
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        className="w-full resize-none rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-violet-500 dark:border-neutral-700"
      />
      {showOptions && (
        <ul
          role="listbox"
          aria-label="mention suggestions"
          className="absolute bottom-full left-0 z-10 mb-1 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          {options.map((m, i) => (
            <li key={m.userId} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm",
                  i === active && "bg-violet-100 dark:bg-violet-500/20",
                )}
              >
                <UserAvatar user={{ id: m.userId, name: m.name, email: m.email, avatarColor: m.avatarColor }} size="xs" />
                <span className="truncate">{displayName({ id: m.userId, name: m.name, email: m.email })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-1.5 flex justify-end gap-2">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="cursor-pointer rounded-md px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || create.isPending}
          className="cursor-pointer rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? "Sending…" : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </div>
  );
}

export default CommentComposer;
