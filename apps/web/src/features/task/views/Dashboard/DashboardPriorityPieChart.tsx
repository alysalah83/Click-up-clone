"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Data {
  name: string;
  value: number;
  fill: string;
}

function DashboardPriorityPieChart({ data }: { data: Data[] }) {
  const width = 300;
  const height = 300;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={width} height={height}>
          <Pie
            dataKey="value"
            nameKey="name"
            startAngle={180}
            endAngle={0}
            data={data}
            cx="50%"
            cy="70%"
            innerRadius={50}
            outerRadius={100}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#262626",
              borderRadius: "11px",
              padding: "4px 12px",
              border: "#525252",
            }}
            itemStyle={{
              color: "#a1a1a1",
              fontWeight: "600",
              letterSpacing: "0.5px",
              fontSize: "16px",
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardPriorityPieChart;
