import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useComponents, Component } from "@/contexts/ComponentContext";
import UsageInsights from "@/components/UsageInsights";

const categories = ["Resistors", "Capacitors", "Microcontrollers", "LEDs", "ICs", "Tools"];

export const AdminPanel = () => {
  const { components, checkoutHistory, addComponent, updateComponent, deleteComponent, returnComponent, clearReturnRequest } = useComponents();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: 0,
  });

  const resetForm = () => {
    setFormData({ name: "", category: "", quantity: 0 });
  };

  const handleAdd = () => {
    if (!formData.name || !formData.category || formData.quantity <= 0) {
      toast.error("Please fill all fields correctly");
      return;
    }

    addComponent({
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
    });
    toast.success("Component added successfully");
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    if (!editingComponent || !formData.name || !formData.category || formData.quantity <= 0) {
      toast.error("Please fill all fields correctly");
      return;
    }

    updateComponent(editingComponent.id, {
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
    });
    toast.success("Component updated successfully");
    resetForm();
    setIsEditDialogOpen(false);
    setEditingComponent(null);
  };

  const handleDelete = (id: string) => {
    deleteComponent(id);
    toast.success("Component deleted successfully");
  };

  const handleReturn = (checkoutId: string) => {
    returnComponent(checkoutId);
    toast.success("Component returned successfully");
  };

  const openEditDialog = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      category: component.category,
      quantity: component.quantity,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <UsageInsights />
      {/* Pending return requests */}
      <Card className="component-card">
        <CardHeader>
          <CardTitle>Pending Return Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkoutHistory.filter(r => r.returnRequested && !r.returned).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No pending requests</TableCell>
                </TableRow>
              ) : (
                checkoutHistory.filter(r => r.returnRequested && !r.returned).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.componentName}</TableCell>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>{r.checkoutDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => { returnComponent(r.id); toast.success('Return approved'); }}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { clearReturnRequest(r.id); toast('Request rejected'); }}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Component Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove components from inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Component
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Component</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">Component Name</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-border mt-1"
                  placeholder="e.g., Resistor 1kΩ"
                />
              </div>
              <div>
                <Label htmlFor="add-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-secondary border-border mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="add-quantity">Total Quantity</Label>
                <Input
                  id="add-quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAdd} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add Component
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="component-card">
        <CardHeader>
          <CardTitle>All Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>{component.category}</TableCell>
                  <TableCell>{component.quantity}</TableCell>
                  <TableCell>{component.available}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      component.status === "available" ? "bg-green-500/20 text-green-500" :
                      component.status === "low-stock" ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-orange-500/20 text-orange-500"
                    }`}>
                      {component.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(component)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(component.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="component-card">
        <CardHeader>
          <CardTitle>Checkout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Checkout Date</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkoutHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No checkout history yet
                  </TableCell>
                </TableRow>
              ) : (
                checkoutHistory.map((checkout) => (
                  <TableRow key={checkout.id}>
                    <TableCell className="font-medium">{checkout.componentName}</TableCell>
                    <TableCell>{checkout.userName}</TableCell>
                    <TableCell>{checkout.quantity}</TableCell>
                    <TableCell>{checkout.checkoutDate}</TableCell>
                    <TableCell>{checkout.expectedReturn}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        checkout.returned ? "bg-green-500/20 text-green-500" : "bg-orange-500/20 text-orange-500"
                      }`}>
                        {checkout.returned ? "Returned" : "Checked Out"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {!checkout.returned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(checkout.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Component Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-quantity">Total Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); setEditingComponent(null); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleEdit} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
