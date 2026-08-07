import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#bef747", "#a78bfa", "#38d6f0", "#fb923c", "#f87171", "#84cc16"];

export default function TypeBars({ data }) {
  if (!data?.length) return <p className="text-xs font-mono text-muted-foreground">no data</p>;
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <XAxis type="number" stroke="#6b6b75" fontSize={10} />
        <YAxis type="category" dataKey="name" stroke="#6b6b75" fontSize={10} width={90} />
        <Tooltip
          contentStyle={{ background: "#111114", border: "1px solid #26262c", fontSize: 12, borderRadius: 2 }}
        />
        <Bar dataKey="count" radius={[0, 2, 2, 0]}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}