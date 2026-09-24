"use client";

import { useSection } from "@/contexts/SiteContentContext";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";
import { cld } from "@/lib/cloudinary";

// Fallback tile background for CMS-added items with no image.
const TILE = "linear-gradient(135deg, hsl(9 55% 20%), hsl(9 45% 12%))";
import { Image as ImageIcon } from "lucide-react";

export default function GallerySection() {
  const { fields, items: galleryItems } = useSection("gallery");

  return (
    <section id="gallery" className="py-24 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-14 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Innovation Gallery
          </span>
          <h2 className="text-4xl font-black text-foreground mb-4">
            {fields.heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            A glimpse into the workshops, demos, and milestones that make the UNILAG Design Studio
            one of Africa&apos;s most active engineering communities.
          </p>
          </div>
        </Reveal>

        {/* Masonry-style grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {galleryItems.map((item, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-2xl border border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-300"
              style={{
                background: item.image
                  ? `url(${cld(item.image, "f_auto,q_auto,w_600")}) center/cover`
                  : item.bg || TILE,
                minHeight: item.aspect === "tall" ? 280 : item.aspect === "wide" ? 160 : 200,
              }}
            >
              <div className="relative w-full h-full min-h-[inherit] flex flex-col items-center justify-center p-6 group-hover:scale-[1.02] transition-transform duration-300">
                {/* Placeholder icon */}
                {!item.image && <div className="mb-3 text-4xl">{item.emoji}</div>}
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <ImageIcon className="h-3 w-3" />
                  <span>{item.label}</span>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm font-medium">{item.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Gallery images will be populated with real studio photos. Add them to <code className="text-primary">public/gallery/</code>.
        </p>
      </div>
    </section>
  );
}