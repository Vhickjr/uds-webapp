import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComponents } from "@/contexts/ComponentContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const getLastNDates = (n: number) => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

export const UsageInsights = () => {
  const { checkoutHistory, components } = useComponents();

  // Top 5 most-borrowed items (by total quantity)
  const counts: Record<string, number> = {};
  checkoutHistory.forEach(r => {
    counts[r.componentName] = (counts[r.componentName] || 0) + r.quantity;
  });

  const topItems = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  // Checkouts over last 7 days
  const last7 = getLastNDates(7);
  const dateMap: Record<string, number> = {};
  last7.forEach(d => (dateMap[d] = 0));
  checkoutHistory.forEach(r => {
    // checkoutDate is YYYY-MM-DD per context
    if (r.checkoutDate in dateMap) dateMap[r.checkoutDate] += r.quantity;
  });
  const series = last7.map(d => ({ date: d, value: dateMap[d] || 0 }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Borrowed Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="text-muted-foreground">No borrow records yet</div>
            ) : (
              <ol className="list-decimal pl-5">
                {topItems.map(item => (
                  <li key={item.name} className="mb-1">
                    <div className="flex justify-between"><span>{item.name}</span><span className="text-muted-foreground">{item.qty}</span></div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checkouts (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsageInsights;
