'use client'
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";



const data = [
  { date: "Jan", engagement: 2000 },
  { date: "Feb", engagement: 4500 },
  { date: "Mar", engagement: 3000 },
  { date: "Apr", engagement: 2500 },
  { date: "May", engagement: 5500 },
  { date: "Jun", engagement: 6000 },
];

export const EngagementChart = () => {
  return (
    <Card className="p-6 mb-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Engagement Over Time</h3>
        <p className="text-sm text-muted-foreground">Last 6 months engagement rate</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
          <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
