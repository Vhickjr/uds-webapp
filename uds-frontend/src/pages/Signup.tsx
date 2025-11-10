import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, Role } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'Missing fields', description: 'Please provide username and password.' });
      return;
    }

    try {
      const raw = localStorage.getItem('uds_users');
      const users = raw ? JSON.parse(raw) as Array<{username:string,password:string,role:Role}> : [];
      if (users.find(u => u.username === username)) {
        toast({ title: 'User exists', description: 'Please choose another username or login.' });
        return;
      }
      users.push({ username, password, role });
      localStorage.setItem('uds_users', JSON.stringify(users));
    } catch (e) {
      // ignore
    }

    // auto-login demo user
    login(username, role);
    toast({ title: 'Account created', description: 'You are now logged in.' });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSignup} className="w-full max-w-md bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-bold mb-4">Sign up (demo)</h2>

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
          <Button type="submit" className="flex-1 bg-primary text-primary-foreground">Create account</Button>
        </div>

        <div className="mt-4 text-sm text-center">
          <span>Already have an account? </span>
          <Link to="/login" className="text-primary">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
