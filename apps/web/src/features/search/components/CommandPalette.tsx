"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { create } from "zustand";
import { axiosClient } from "@/shared/lib/axios/client";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";

type SearchResult = {
  tasks: { id: string; name: string; listId: string; status: { name: string } }[];
  lists: { id: string; name: string }[];
  docs?: { id: string; title: string; icon: string | null }[];
  whiteboards?: { id: string; title: string }[];
  goals?: { id: string; name: string }[];
  members: { id: string; name: string | null; email: string | null; avatarColor: string | null }[];
};

interface PaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
}
export const usePaletteStore = create<PaletteState>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

type Item = { key: string; group: string; label: string; hint?: string; href: string; avatar?: SearchResult["members"][number] };

const QUICK_NAV: Item[] = [
  { key: "nav-home", group: "Go to", label: "Home", href: "/home/my-work" },
  { key: "nav-inbox", group: "Go to", label: "Inbox", href: "/home/inbox" },
  { key: "nav-goals", group: "Go to", label: "Goals", href: "/home/goals" },
  { key: "nav-templates", group: "Go to", label: "Templates", href: "/home/templates" },
  { key: "nav-docs", group: "Go to", label: "Docs", href: "/home/docs" },
  { key: "nav-whiteboards", group: "Go to", label: "Whiteboards", href: "/home/whiteboards" },
  { key: "nav-teams", group: "Go to", label: "Teams", href: "/home/teams" },
  { key: "nav-dashboard", group: "Go to", label: "Dashboard", href: "/home/dashboard" },
];

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function CommandPalette() {
  const { open, setOpen } = usePaletteStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const q = useDebounced(query.trim(), 250);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        usePaletteStore.getState().setOpen(!usePaletteStore.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: lists } = useQuery({
    queryKey: ["palette", "lists"],
    queryFn: () => axiosClient.get<{ id: string; name: string }[]>("/api/lists"),
    enabled: open,
    staleTime: 60_000,
  });
  const { data: results } = useQuery({
    queryKey: ["search", q],
    queryFn: () => axiosClient.get<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: open && q.length > 0,
  });

  const items = useMemo<Item[]>(() => {
    if (!q) {
      return [
        ...QUICK_NAV,
        ...(lists ?? []).map((l) => ({ key: `l-${l.id}`, group: "Lists", label: l.name, href: `/home/lists/${l.id}/board` })),
      ];
    }
    if (!results) return [];
    return [
      ...results.tasks.map((t) => ({
        key: `t-${t.id}`,
        group: "Tasks",
        label: t.name,
        hint: t.status.name,
        href: `/home/lists/${t.listId}/board?task=${t.id}`,
      })),
      ...results.lists.map((l) => ({ key: `l-${l.id}`, group: "Lists", label: l.name, href: `/home/lists/${l.id}/board` })),
      ...(results.docs ?? []).map((d) => ({
        key: `d-${d.id}`,
        group: "Docs",
        label: `${d.icon ?? "📄"} ${d.title.trim() || "Untitled"}`,
        href: `/home/docs/${d.id}`,
      })),
      ...(results.whiteboards ?? []).map((w) => ({
        key: `w-${w.id}`,
        group: "Whiteboards",
        label: w.title.trim() || "Untitled whiteboard",
        href: `/home/whiteboards/${w.id}`,
      })),
      ...(results.goals ?? []).map((g) => ({
        key: `g-${g.id}`,
        group: "Goals",
        label: g.name,
        href: `/home/goals/${g.id}`,
      })),
      ...results.members.map((m) => ({
        key: `m-${m.id}`,
        group: "Members",
        label: displayName(m),
        hint: m.email ?? undefined,
        href: "/home/teams",
        avatar: m,
      })),
    ];
  }, [q, lists, results]);

  const select = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(items[active]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-neutral-950/50" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="bg-popover fixed top-24 left-1/2 z-50 w-[min(36rem,92vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-neutral-300 shadow-xl outline-none dark:border-neutral-700"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search tasks, lists, docs, boards, goals, people..."
            aria-label="Search"
            className="w-full border-b border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none dark:border-neutral-700"
          />
          <ul role="listbox" className="max-h-80 overflow-auto p-2">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-neutral-500">
                {q ? (results ? "No results." : "Searching...") : "Loading..."}
              </li>
            )}
            {items.map((item, i) => (
              <li key={item.key} role="presentation">
                {(i === 0 || items[i - 1]!.group !== item.group) && (
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold text-neutral-500 uppercase">{item.group}</div>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => select(item)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${i === active ? "bg-neutral-500/20" : ""}`}
                >
                  {item.avatar && <UserAvatar user={item.avatar} size="xs" />}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-xs text-neutral-500">{item.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CommandPalette;
