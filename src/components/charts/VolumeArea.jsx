import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function VolumeArea({ data }) {
  if (!data?.length) return <p className="text-xs font-mono text-muted-foreground">no data</p>;
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spookFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bef747" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#bef747" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" stroke="#6b6b75" fontSize={10} />
        <YAxis stroke="#6b6b75" fontSize={10} />
        <Tooltip
          contentStyle={{ background: "#111114", border: "1px solid #26262c", fontSize: 12, borderRadius: 2 }}
        />
        <Area type="monotone" dataKey="count" stroke="#bef747" strokeWidth={2} fill="url(#spookFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}