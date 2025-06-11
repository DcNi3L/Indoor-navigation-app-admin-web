"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { useTranslation } from "react-i18next"

interface StatisticsChartProps {
  data: Array<{
    name: string
    value: number
    to: string
    color: string
  }>
  title: string
  onBarClick: (data: any) => void
}

export default function StatisticsChart({ data, title, onBarClick }: StatisticsChartProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide mb-6">{title}</h2>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
          <YAxis allowDecimals={false} stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "none",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} cursor="pointer">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                onClick={() => onBarClick(entry)}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
