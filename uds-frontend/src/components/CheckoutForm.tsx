"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useComponents } from "@/contexts/ComponentContext";
import { useAuth } from "@/contexts/AuthContext";

interface CheckoutFormProps {
  component: {
    id: string;
    name: string;
    available: number;
  };
  onClose: () => void;
}

export const CheckoutForm = ({ component, onClose }: CheckoutFormProps) => {
  const { checkoutComponent } = useComponents();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [quantity, setQuantity] = useState(1);
  const [expectedReturn, setExpectedReturn] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!userName || !expectedReturn) {
      toast.error("Please fill in all fields");
      return;
    }

    if (quantity > component.available) {
      toast.error(`Only ${component.available} units available`);
      return;
    }

    const result = await checkoutComponent(component.id, quantity, expectedReturn);
    if (!result.ok) {
      toast.error(result.error ?? "Checkout failed");
      return;
    }
    toast.success(`${component.name} checked out successfully!`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="component" className="text-foreground">Component</Label>
        <Input id="component" value={component.name} disabled className="bg-secondary border-border mt-1" />
      </div>

      <div>
        <Label htmlFor="userName" className="text-foreground">Your Name</Label>
        <Input
          id="userName"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="bg-secondary border-border mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="quantity" className="text-foreground">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={component.available}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="bg-secondary border-border mt-1"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">{component.available} units available</p>
      </div>

      <div>
        <Label htmlFor="returnDate" className="text-foreground">Expected Return Date</Label>
        <Input
          id="returnDate"
          type="date"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          className="bg-secondary border-border mt-1"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
          Confirm Checkout
        </Button>
      </div>
    </form>
  );
};