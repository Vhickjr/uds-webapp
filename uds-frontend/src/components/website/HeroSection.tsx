"use client";

import Link from "next/link";
import { useSection } from "@/contexts/SiteContentContext";
import { ArrowRight, CalendarCheck } from "lucide-react";

export default function HeroSection() {
  const { fields, items: stats } = useSection("hero");

  return (
    <section id="home" className="pt-[72px]">
      {/* Oxblood panel with rounded top corners — the live site's signature block */}
      <div className="max-w-[1200px] mx-auto mt-8 sm:mt-12 px-4 sm:px-0">
        <div className="uds-panel grid lg:grid-cols-[3fr_2fr] items-center gap-10 px-6 sm:px-12 py-12 sm:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill border border-brand-gold/40 bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold text-brand-gold mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
              {fields.badge}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[2.8rem] xl:text-5xl font-bold leading-[1.1] text-white mb-5">
              {fields.headline}{" "}
              <span className="text-brand-gold">{fields.headlineAccent}</span>
              <br />
              {fields.headlineEnd}
            </h1>

            <p className="text-base sm:text-lg text-[#e6e6e6] max-w-[500px] leading-relaxed mb-8">
              {fields.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#projects"
                className="uds-btn group inline-flex items-center justify-center gap-2 text-base"
              >
                Explore Projects
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard?tab=spaces"
                className="uds-btn uds-btn-gold group inline-flex items-center justify-center gap-2 text-base"
              >
                <CalendarCheck className="h-4 w-4" />
                Book a Space
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-pill border border-brand-cream/30 px-7 py-3.5 text-base font-bold text-brand-cream hover:bg-white/10 transition-colors"
              >
                Open Inventory App
              </Link>
            </div>
          </div>

          {/* Stats block sits where the live site places its hero image */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/[0.06] border border-brand-cream/15 p-5 backdrop-blur-sm"
              >
                <div className="font-display text-3xl font-bold text-brand-gold mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-[#e6e6e6]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cream "about" band, mirroring the live site's section directly under the hero */}
      <div id="about" className="max-w-[1200px] mx-auto px-4 sm:px-0">
        <div className="uds-panel-cream px-6 sm:px-12 py-12 sm:py-14 text-center">
          <p className="font-display mx-auto max-w-[1000px] text-lg sm:text-xl leading-[1.7] text-brand-oxblood">
            {fields.aboutText}
          </p>
        </div>
      </div>
    </section>
  );
}
