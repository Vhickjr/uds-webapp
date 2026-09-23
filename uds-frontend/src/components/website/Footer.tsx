"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Mail, Phone, Clock, ArrowUp } from "lucide-react";

const links = {
  Studio: [
    { label: "About Us", href: "#about" },
    { label: "Innovation Projects", href: "#projects" },
    { label: "Research", href: "#research" },
    { label: "Gallery", href: "#gallery" },
  ],
  Programs: [
    { label: "Internships", href: "#internships" },
    { label: "Outreach", href: "#outreach" },
    { label: "Events & Workshops", href: "#events" },
    { label: "Partnerships", href: "#sponsors" },
  ],
  Platform: [
    { label: "Inventory App", href: "/dashboard" },
    { label: "Sign In", href: "/login" },
    { label: "Create Account", href: "/signup" },
    { label: "Contact", href: "#contact" },
  ],
};

export default function Footer() {
  return (
    <footer id="footer" className="bg-brand-ink text-[#f4f4f4]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="inline-flex rounded-xl bg-white px-3 py-2 mb-5">
              <Image
                src="/uds-logo.png"
                alt="UNILAG Design Studio — Innovation Hub"
                width={273}
                height={142}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-lg leading-relaxed text-[#f4f4f4] max-w-sm mb-6">
              A smart innovation hub at the University of Lagos where students engineer real
              solutions to real African problems.
            </p>
            <div>
              <h2 className="font-display text-xl font-semibold mb-3">Socials</h2>
              <a
                href="https://x.com/unilag_design?s=11"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UNILAG Design Studio on X"
                className="inline-flex p-2.5 rounded-lg border border-white/20 text-[#f4f4f4] hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h2 className="font-display text-xl font-semibold mb-3">{group}</h2>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-base text-[#f4f4f4] hover:text-brand-gold transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div id="contact-details" className="border-t border-white/15 pt-8 mb-6">
          <h2 className="font-display text-xl font-semibold mb-3">Contact</h2>
          <div className="grid gap-2.5 sm:grid-cols-3 text-base">
            <a
              href="tel:+2349162343100"
              className="inline-flex items-center gap-2 hover:text-brand-gold transition-colors"
            >
              <Phone className="h-4 w-4 shrink-0" />
              +234 916 234 3100
            </a>
            <a
              href="mailto:designstudio.eng@unilag.edu.ng"
              className="inline-flex items-center gap-2 hover:text-brand-gold transition-colors"
            >
              <Mail className="h-4 w-4 shrink-0" />
              designstudio.eng@unilag.edu.ng
            </a>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              Open Hours: 8AM – 4PM, Monday – Friday
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/15 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-base">
          <p>© {new Date().getFullYear()} UNIVERSITY OF LAGOS</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 underline hover:text-brand-gold transition-colors"
          >
            Back to Top
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
