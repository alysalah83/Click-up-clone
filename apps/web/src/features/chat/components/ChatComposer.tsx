"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { displayName } from "@/features/members/lib/avatar";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { cn } from "@/shared/lib/utils/cn";
import { mentionQuery } from "../lib";
import type { ChatUser } from "../types";

const MAX = 4000;

interface ChatComposerProps {
  members: ChatUser[];
  placeholder: string;
  onSubmit: (body: string) => void | Promise<unknown>;
  initialValue?: string;
  autoFocus?: boolean;
  /** Edit mode: shows Cancel / Save and Escape cancels. */
  onCancel?: () => void;
  submitLabel?: string;
  compact?: boolean;
}

/**
 * The chat input: Enter sends, Shift+Enter adds a line, `@` opens member autocomplete
 * (arrows + Enter/Tab to pick) and inserts `@[Name](userId)` tokens.
 */
function ChatComposer({
  members,
  placeholder,
  onSubmit,
  initialValue = "",
  autoFocus,
  onCancel,
  submitLabel,
  compact,
}: ChatComposerProps) {
  const [value, setValue] = useState(initialValue);
  const [caret, setCaret] = useState(initialValue.length);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the text, up to ~8 lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const trigger = dismissed ? undefined : mentionQuery(value, caret);
  const options =
    trigger === undefined
      ? []
      : members.filter((m) => displayName(m).toLowerCase().includes(trigger.query.toLowerCase())).slice(0, 6);
  const showOptions = options.length > 0;

  const pick = (index: number) => {
    const member = options[index];
    if (!member || !trigger) return;
    const token = `@[${displayName(member).replace(/[[\]]/g, "")}](${member.id}) `;
    const next = value.slice(0, trigger.start) + token + value.slice(caret);
    const nextCaret = trigger.start + token.length;
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
    if (!body) return;
    void onSubmit(body);
    if (!onCancel) {
      setValue("");
      setCaret(0);
    }
  };

  return (
    <div className="relative">
      {showOptions && (
        <ul
          role="listbox"
          aria-label="Mention suggestions"
          className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          <li className="px-3 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
            People in this space
          </li>
          {options.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                onMouseMove={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm",
                  i === active && "bg-violet-100 dark:bg-violet-500/20",
                )}
              >
                <UserAvatar user={m} size="xs" />
                <span className="truncate">{displayName(m)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 shadow-xs focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/15 dark:border-neutral-700 dark:bg-neutral-900",
          compact && "rounded-lg px-2 py-1.5",
        )}
      >
        <textarea
          ref={ref}
          value={value}
          rows={1}
          autoFocus={autoFocus}
          maxLength={MAX}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setCaret(e.target.selectionStart);
            setActive(0);
            setDismissed(false);
          }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
          onKeyDown={(e) => {
            if (showOptions) {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                setActive((a) => (a + step + options.length) % options.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                pick(active);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDismissed(true);
                return;
              }
            }
            if (e.key === "Escape" && onCancel) {
              e.preventDefault();
              onCancel();
              return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[200px] min-h-6 flex-1 resize-none bg-transparent py-0.5 text-sm leading-6 outline-none placeholder:text-neutral-400"
        />
        {onCancel ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              className="cursor-pointer rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitLabel ?? "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Send message"
            onClick={submit}
            disabled={!value.trim()}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800"
          >
            <SendHorizontal className="size-4" />
          </button>
        )}
      </div>
      {!compact && !onCancel && (
        <p className="mt-1 hidden px-1 text-[11px] text-neutral-400 sm:block">
          <kbd className="font-sans font-semibold">Enter</kbd> to send · <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new line ·{" "}
          <kbd className="font-sans font-semibold">@</kbd> to mention · **bold**, `code`
        </p>
      )}
    </div>
  );
}

export default ChatComposer;
