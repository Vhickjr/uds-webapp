import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, Role } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'Missing fields', description: 'Please provide username and password or signup.' });
      return;
    }

    // check demo users in localStorage
    try {
      const raw = localStorage.getItem('uds_users');
      const users = raw ? JSON.parse(raw) as Array<{username:string,password:string,role:Role}> : [];
      const found = users.find(u => u.username === username);
      if (found) {
        if (found.password !== password) {
          toast({ title: 'Incorrect password' });
          return;
        }
        // use stored role
        login(username, found.role);
        navigate(from, { replace: true });
        return;
      }
    } catch (e) {
      // ignore parse errors
    }

    // no demo user found — prompt to signup
    toast({ title: 'Account not found', description: 'No demo account found. Please signup first.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-bold mb-4">Login (demo)</h2>

        <div className="mb-4">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
        </div>

        <div className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>

        <div className="mb-6">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="backoffice">Backoffice (admin)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 bg-primary text-primary-foreground">Login</Button>
        </div>

        <div className="mt-4 text-sm text-center">
          <span>Don't have an account? </span>
          <Link to="/signup" className="text-primary">Sign up</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
