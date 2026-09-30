"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axiosClient } from "@/shared/lib/axios/client";
import { tooltipStyle } from "./tooltipStyle";
import type { Burndown } from "./types";

function BurndownCard({ lists }: { lists: { id: string; name: string }[] }) {
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [result, setResult] = useState<{ listId: string; data?: Burndown; failed?: boolean }>();

  useEffect(() => {
    if (!listId) return;
    let cancelled = false;
    axiosClient
      .get<Burndown>(`/api/dashboard/burndown?listId=${listId}`)
      .then((data) => !cancelled && setResult({ listId, data }))
      .catch(() => !cancelled && setResult({ listId, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [listId]);

  const loaded = result?.listId === listId ? result : undefined;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold">Burndown (14 days)</h3>
        <select
          aria-label="Burndown list"
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
        >
          {lists.map((l) => (
            <option key={l.id} value={l.id} className="text-neutral-900">
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="h-64 w-full">
        {loaded?.data ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={loaded.data.points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#52525244" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="remaining" name="Remaining" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-16 text-center text-sm">
            {!listId ? "No lists yet." : loaded?.failed ? "Could not load burndown." : "Loading..."}
          </p>
        )}
      </div>
    </div>
  );
}

export default BurndownCard;
