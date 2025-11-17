import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;
  const from = state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
    // including navigate & from for exhaustive-deps compliance
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Missing fields', description: 'Please provide email and password.' });
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: 'Logged in' });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast({ title: 'Login failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-bold mb-4">Login</h2>

        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>

        <div className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>

        <div className="flex gap-3">
          <Button disabled={submitting} type="submit" className="flex-1 bg-primary text-primary-foreground">{submitting ? 'Logging in...' : 'Login'}</Button>
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
