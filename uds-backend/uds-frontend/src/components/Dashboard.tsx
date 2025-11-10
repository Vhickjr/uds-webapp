import { Package, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComponents } from "@/contexts/ComponentContext";
import "../styles/grid-pattern.css";

export const Dashboard = () => {
  const { components, checkoutHistory } = useComponents();

  const totalComponents = components.reduce((sum, c) => sum + c.quantity, 0);
  const checkedOutCount = components.reduce((sum, c) => sum + (c.quantity - c.available), 0);
  const lowStockCount = components.filter(c => c.status === "low-stock").length;
  const activeUsers = new Set(checkoutHistory.filter(c => !c.returned).map(c => c.userName)).size;

  const stats = [
    {
      title: "Total Components",
      value: totalComponents.toString(),
      icon: Package,
      trend: `${components.length} types`,
      color: "primary"
    },
    {
      title: "Checked Out",
      value: checkedOutCount.toString(),
      icon: TrendingUp,
      trend: `${activeUsers} users`,
      color: "accent"
    },
    {
      title: "Low Stock",
      value: lowStockCount.toString(),
      icon: AlertCircle,
      trend: "Need reorder",
      color: "destructive"
    },
    {
      title: "Active Users",
      value: activeUsers.toString(),
      icon: Users,
      trend: "Currently borrowing",
      color: "primary"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Studio Inventory Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage your electrical components</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
