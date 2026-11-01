"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendDataPoint {
  date: string;
  users: number;
  posts: number;
  comments: number;
}

interface AdminTrendChartProps {
  data: TrendDataPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-2xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              {entry.name}:
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function AdminTrendChart({ data }: AdminTrendChartProps) {
  return (
    <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          活跃度趋势
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          近 14 天注册 / 发帖 / 评论趋势
        </p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientComments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.22}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="users"
              name="新增用户"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#gradientUsers)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="posts"
              name="发帖数"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradientPosts)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="comments"
              name="评论数"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradientComments)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
