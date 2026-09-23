"use client";

import { useSection } from "@/contexts/SiteContentContext";

// `open` round-trips through the CMS as a string.
const isOpen = (p: { open?: string }) => p.open !== "false";
import { Briefcase, Clock, MapPin, ArrowRight } from "lucide-react";

export default function InternshipsSection() {
  const { fields, items: positions } = useSection("internships");

  return (
    <section id="internships" className="py-24 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Internships
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            Our internship programme gives undergraduate and postgraduate students direct experience
            working on real projects alongside faculty researchers and industry partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {positions.map((pos) => (
            <div
              key={pos.title}
              className={`rounded-2xl border bg-card p-7 transition-all duration-300 ${
                isOpen(pos)
                  ? "border-border hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg"
                  : "border-border opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    isOpen(pos)
                      ? "bg-green-500/15 text-green-500 border border-green-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isOpen(pos) ? "Open" : "Filled"}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">{pos.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {pos.description}
              </p>

              <div className="flex flex-wrap gap-3 mb-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pos.type} · {pos.duration}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {pos.location}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {(pos.skills ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {isOpen(pos) && (
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Apply now <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}