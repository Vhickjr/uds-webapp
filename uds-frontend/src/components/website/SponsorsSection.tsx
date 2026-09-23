"use client";

import { useSection } from "@/contexts/SiteContentContext";
import { Handshake } from "lucide-react";

const tierConfig = {
  platinum: { label: "Platinum", color: "hsl(9 55% 32%)", size: "text-lg" },
  gold: { label: "Gold", color: "hsl(41 87% 44%)", size: "text-base" },
  silver: { label: "Silver", color: "hsl(30 10% 62%)", size: "text-sm" },
  community: { label: "Community Partner", color: "hsl(18 29% 52%)", size: "text-sm" },
};

export default function SponsorsSection() {
  const { fields, items: partners } = useSection("sponsors");

  const platinum = partners.filter((p) => p.tier === "platinum");
  const gold = partners.filter((p) => p.tier === "gold");
  const silver = partners.filter((p) => p.tier === "silver");
  const community = partners.filter((p) => p.tier === "community");

  const PartnerBadge = ({ partner }: { partner: (typeof partners)[0] }) => {
    const cfg = tierConfig[partner.tier as keyof typeof tierConfig];
    return (
      <div
        className="rounded-xl border border-border bg-card px-5 py-4 flex flex-col items-center justify-center text-center gap-1 hover:border-primary/40 transition-colors"
        style={{ borderTopColor: cfg.color, borderTopWidth: 2 }}
      >
        <div className={`font-bold text-foreground ${cfg.size}`}>{partner.name}</div>
        <div className="text-xs text-muted-foreground">{partner.category}</div>
      </div>
    );
  };

  return (
    <section id="sponsors" className="py-24 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Partnerships & Sponsors
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            Our partners provide funding, equipment, mentorship, and real-world project
            opportunities to Design Studio students and researchers.
          </p>
        </div>

        {/* Platinum */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Platinum Partners
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {platinum.map((p) => <PartnerBadge key={p.name} partner={p} />)}
          </div>
        </div>

        {/* Gold */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-yellow-500">
              Gold Partners
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {gold.map((p) => <PartnerBadge key={p.name} partner={p} />)}
          </div>
        </div>

        {/* Silver */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Silver Partners
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {silver.map((p) => <PartnerBadge key={p.name} partner={p} />)}
          </div>
        </div>

        {/* Community */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
              Community Partners
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {community.map((p) => <PartnerBadge key={p.name} partner={p} />)}
          </div>
        </div>

        <div className="mt-12 p-6 rounded-2xl border border-dashed border-primary/40 text-center">
          <p className="text-muted-foreground mb-3 text-sm">
            Interested in partnering with the UNILAG Design Studio?
          </p>
          <a
            href="#contact"
            className="text-primary font-semibold text-sm hover:underline"
          >
            Become a partner →
          </a>
        </div>
      </div>
    </section>
  );
}