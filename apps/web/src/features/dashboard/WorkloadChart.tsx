"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { tooltipStyle } from "./tooltipStyle";

function WorkloadChart({ data }: { data: { name: string; open: number; done: number }[] }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm">No tasks yet.</p>;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52525244" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "#52525222" }} />
          <Legend />
          <Bar dataKey="open" name="Open" stackId="w" fill="#6366f1" />
          <Bar dataKey="done" name="Done" stackId="w" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WorkloadChart;
