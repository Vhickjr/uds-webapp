"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Projects", href: "#projects" },
  { label: "Research", href: "#research" },
  { label: "Events", href: "#events" },
  { label: "Internships", href: "#internships" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_12px_rgba(75,30,22,0.10)]" : ""
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo wordmark */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/uds-logo.png"
              alt="UNILAG Design Studio — Innovation Hub"
              width={273}
              height={142}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-base font-semibold text-brand-ink hover:text-brand-oxblood transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className="text-base font-semibold text-brand-ink hover:text-brand-oxblood transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-pill bg-brand-oxblood px-6 py-2.5 text-sm font-bold text-brand-cream hover:bg-brand-maroon transition-colors"
            >
              Open App
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-brand-ink p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-white border-t border-brand-sand shadow-[0_2px_8px_rgba(75,30,22,0.10)]">
          <div className="px-4 py-5 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="block w-full text-left py-2 text-lg font-semibold text-brand-ink border-b border-brand-sand/60 last:border-b-0 hover:text-brand-oxblood transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-pill border border-brand-oxblood/25 px-4 py-2.5 text-center text-sm font-bold text-brand-oxblood"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-pill bg-brand-oxblood px-4 py-2.5 text-center text-sm font-bold text-brand-cream"
              >
                Open App
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
