"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !password) {
      toast({ title: "Missing fields", description: "All fields are required." });
      return;
    }
    setSubmitting(true);
    try {
      await signup({ firstName, lastName, email, phone, password });
      toast({ title: "Account created", description: "You are now logged in." });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast({ title: "Signup failed", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background circuit-pattern px-4 py-10">
      <form onSubmit={handleSignup} className="relative z-10 w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-[0_4px_24px_hsl(9_55%_19%_/_0.10)]">
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
        <h2 className="font-display text-2xl font-bold text-center mb-1">Create account</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">UNILAG Design Studio · Inventory System</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>

        <div className="mb-4">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
        </div>

        <div className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>


        <Button disabled={submitting} type="submit" className="w-full rounded-pill bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-brand-maroon">
          {submitting ? "Creating..." : "Create account"}
        </Button>

        <div className="mt-4 text-sm text-center">
          <span>Already have an account? </span>
          <Link href="/login" className="font-semibold text-brand-oxblood underline underline-offset-2 hover:text-brand-gold">Login</Link>
        </div>
      </form>
    </div>
  );
}