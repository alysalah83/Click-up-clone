"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDuration } from "@/features/taskDetail/lib/duration";
import { tooltipStyle } from "./tooltipStyle";

function TimeTrackedChart({ data }: { data: { name: string; seconds: number }[] }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm">No time tracked this week.</p>;
  const hours = data.map((d) => ({ name: d.name, seconds: d.seconds, hours: Math.round((d.seconds / 3600) * 10) / 10 }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52525244" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
          <YAxis tick={{ fontSize: 12 }} unit="h" />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "#52525222" }}
            formatter={(_value, _name, item) => formatDuration((item.payload as { seconds: number }).seconds)}
          />
          <Bar dataKey="hours" name="Tracked" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimeTrackedChart;
