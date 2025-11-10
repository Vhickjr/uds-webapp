import { useComponents } from "@/contexts/ComponentContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const MyBorrowings = () => {
  const { checkoutHistory, requestReturn } = useComponents();
  const { user } = useAuth();

  const myRecords = checkoutHistory.filter(r => r.userName === user?.username);

  const handleRequestReturn = (id: string) => {
    requestReturn(id);
    toast.success("Return requested — awaiting admin approval");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Borrowings</h2>
        <p className="text-muted-foreground">Your checkout records and return requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Checkouts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Checkout Date</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No records found</TableCell>
                </TableRow>
              ) : (
                myRecords.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.componentName}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>{r.checkoutDate}</TableCell>
                    <TableCell>{r.expectedReturn}</TableCell>
                    <TableCell>
                      {r.returned ? (
                        <span className="text-green-600">Returned</span>
                      ) : r.returnRequested ? (
                        <span className="text-yellow-600">Return requested</span>
                      ) : (
                        <span className="text-orange-600">Checked out</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!r.returned && !r.returnRequested && (
                        <Button variant="outline" size="sm" onClick={() => handleRequestReturn(r.id)}>Request Return</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBorrowings;
