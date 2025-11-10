import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Zap, ChevronRight } from "lucide-react";
import "../styles/grid-pattern.css";

interface ComponentCardProps {
  name: string;
  category: string;
  quantity: number;
  available: number;
  status: "available" | "checked-out" | "low-stock";
  onCheckout: () => void;
}

export const ComponentCard = ({ 
  name, 
  category, 
  quantity, 
  available, 
  status,
  onCheckout 
}: ComponentCardProps) => {
  const statusConfig = {
    "available": { label: "Available", class: "status-available" },
    "checked-out": { label: "Checked Out", class: "status-checked-out" },
    "low-stock": { label: "Low Stock", class: "status-low-stock" }
  };

  const config = statusConfig[status];

  return (
    <Card className="component-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{category}</p>
            </div>
          </div>
          <Badge variant="secondary" className={config.class}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {available} / {quantity} available
            </span>
          </div>
        </div>
        <Button 
          onClick={onCheckout}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={available === 0}
        >
          Checkout Component
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
