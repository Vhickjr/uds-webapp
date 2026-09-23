"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) router.replace(from);
  }, [isAuthenticated, router, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please provide email and password." });
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast({ title: "Logged in" });
      router.replace(from);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast({ title: "Login failed", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background circuit-pattern px-4 py-10">
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-[0_4px_24px_hsl(9_55%_19%_/_0.10)]">
                <Link href="/" className="flex justify-center mb-6">
          <Image
            src="/uds-logo.png"
            alt="UNILAG Design Studio — Innovation Hub"
            width={273}
            height={142}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>
        <h2 className="font-display text-2xl font-bold text-center mb-1">Login</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">UNILAG Design Studio · Inventory System</p>

        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>

        <div className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>

        <Button disabled={submitting} type="submit" className="w-full rounded-pill bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-brand-maroon">
          {submitting ? "Logging in..." : "Login"}
        </Button>

        <div className="mt-4 text-sm text-center">
          <span>Don&apos;t have an account? </span>
          <Link href="/signup" className="font-semibold text-brand-oxblood underline underline-offset-2 hover:text-brand-gold">Sign up</Link>
        </div>
      </form>
    </div>
  );
}
