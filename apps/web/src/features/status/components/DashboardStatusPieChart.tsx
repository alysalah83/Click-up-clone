"use client";

import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import { getRandomColor } from "@/shared/ui/AvatarPicker/helper";

function DashboardStatusPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <PieChart responsive className="h-full w-full">
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#525252"
        label
      >
        {data.map((entry, index) => (
          <Cell key={index} fill={COLORS_TOKENS[getRandomColor()].hex} />
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
      <Legend />
    </PieChart>
  );
}

export default DashboardStatusPieChart;
