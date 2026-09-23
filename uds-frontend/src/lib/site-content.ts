/**
 * Website CMS model.
 *
 * Each public section is described by a schema: some section-level fields
 * (heading, subheading, ...) plus an optional repeatable item list. The admin
 * editor renders forms from these schemas, so adding an editable section is a
 * schema entry rather than a new form component.
 *
 * Stored content is plain JSON — icons are referenced by name through
 * ICON_REGISTRY rather than as React components, so a section survives a
 * round-trip through the database.
 */

import {
  Cpu, Leaf, Brain, FlaskConical, School, Heart, Wrench, Globe,
  Trophy, Award, Star, TrendingUp, Rocket, Users, Lightbulb, Zap,
  type LucideIcon,
} from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Cpu, Leaf, Brain, FlaskConical, School, Heart, Wrench, Globe,
  Trophy, Award, Star, TrendingUp, Rocket, Users, Lightbulb, Zap,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export const resolveIcon = (name: string | undefined, fallback: LucideIcon = Zap): LucideIcon =>
  (name && ICON_REGISTRY[name]) || fallback;

export type FieldType = "text" | "textarea" | "image" | "icon" | "select";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** Options for `select` fields. */
  options?: string[];
}

export interface SectionSchema {
  key: string;
  label: string;
  description: string;
  /** Section-level copy (headings, intro text). */
  fields: Field[];
  /** Optional repeatable list (projects, events, partners...). */
  items?: {
    label: string;
    singular: string;
    fields: Field[];
  };
}

export type ItemValues = Record<string, string>;

export interface SectionContent {
  fields: Record<string, string>;
  items: ItemValues[];
}

export type SiteContent = Record<string, SectionContent>;

const heading = (placeholder: string): Field[] => [
  { key: "heading", label: "Heading", type: "text", placeholder },
  { key: "subheading", label: "Subheading", type: "textarea" },
];

export const SECTION_SCHEMAS: SectionSchema[] = [
  {
    key: "hero",
    label: "Hero",
    description: "The oxblood panel at the top of the homepage.",
    fields: [
      { key: "badge", label: "Badge text", type: "text" },
      { key: "headline", label: "Headline (line 1)", type: "text" },
      { key: "headlineAccent", label: "Headline accent word", type: "text" },
      { key: "headlineEnd", label: "Headline (line 2)", type: "text" },
      { key: "subheadline", label: "Subheadline", type: "textarea" },
      { key: "aboutText", label: "Cream band text", type: "textarea" },
    ],
    items: {
      label: "Stats",
      singular: "stat",
      fields: [
        { key: "value", label: "Value", type: "text", placeholder: "200+" },
        { key: "label", label: "Label", type: "text", placeholder: "Students Trained" },
      ],
    },
  },
  {
    key: "projects",
    label: "Projects",
    description: "Innovation project showcase cards.",
    fields: heading("Building real solutions for real problems"),
    items: {
      label: "Projects",
      singular: "project",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "tags", label: "Tags (comma separated)", type: "text" },
        { key: "team", label: "Team", type: "text" },
        { key: "status", label: "Status", type: "text", placeholder: "Deployed" },
        { key: "image", label: "Image", type: "image" },
      ],
    },
  },
  {
    key: "research",
    label: "Research",
    description: "Research groups and their focus areas.",
    fields: heading("Pushing the boundary of engineering knowledge"),
    items: {
      label: "Research groups",
      singular: "group",
      fields: [
        { key: "name", label: "Group name", type: "text" },
        { key: "focus", label: "Focus areas", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "papers", label: "Papers", type: "text" },
        { key: "members", label: "Members", type: "text" },
        { key: "icon", label: "Icon", type: "icon" },
      ],
    },
  },
  {
    key: "outreach",
    label: "Outreach",
    description: "Community and schools programmes.",
    fields: heading("Engineering impact beyond the campus"),
    items: {
      label: "Programmes",
      singular: "programme",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "reach", label: "Reach", type: "text" },
        { key: "frequency", label: "Frequency", type: "text" },
        { key: "icon", label: "Icon", type: "icon" },
      ],
    },
  },
  {
    key: "internships",
    label: "Internships",
    description: "Open internship positions.",
    fields: heading("Start your engineering career here"),
    items: {
      label: "Positions",
      singular: "position",
      fields: [
        { key: "title", label: "Role title", type: "text" },
        { key: "type", label: "Type", type: "text", placeholder: "Part-time" },
        { key: "duration", label: "Duration", type: "text", placeholder: "3 months" },
        { key: "location", label: "Location", type: "text" },
        { key: "skills", label: "Skills (comma separated)", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "open", label: "Currently open", type: "select", options: ["true", "false"] },
      ],
    },
  },
  {
    key: "events",
    label: "Events",
    description: "Upcoming workshops and events.",
    fields: heading("Learn, build, and connect"),
    items: {
      label: "Events",
      singular: "event",
      fields: [
        { key: "day", label: "Day", type: "text", placeholder: "15" },
        { key: "month", label: "Month", type: "text", placeholder: "Jun" },
        { key: "title", label: "Title", type: "text" },
        { key: "time", label: "Time", type: "text" },
        { key: "location", label: "Location", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "type", label: "Type", type: "text", placeholder: "Workshop" },
        { key: "spots", label: "Spots", type: "text" },
      ],
    },
  },
  {
    key: "achievements",
    label: "Achievements",
    description: "Awards and student accomplishments.",
    fields: heading("Excellence recognised nationally and globally"),
    items: {
      label: "Achievements",
      singular: "achievement",
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "year", label: "Year", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "category", label: "Category", type: "text" },
        { key: "icon", label: "Icon", type: "icon" },
      ],
    },
  },
  {
    key: "gallery",
    label: "Gallery",
    description: "Photo tiles. Upload an image, or leave it blank to use the emoji tile.",
    fields: heading("Moments from the studio"),
    items: {
      label: "Gallery tiles",
      singular: "tile",
      fields: [
        { key: "label", label: "Caption", type: "text" },
        { key: "image", label: "Image", type: "image" },
        { key: "emoji", label: "Emoji (fallback)", type: "text" },
        {
          key: "aspect", label: "Shape", type: "select",
          options: ["square", "wide", "tall"],
        },
      ],
    },
  },
  {
    key: "sponsors",
    label: "Sponsors",
    description: "Partners and sponsors, grouped by tier.",
    fields: heading("Supported by industry leaders"),
    items: {
      label: "Partners",
      singular: "partner",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "category", label: "Category", type: "text" },
        {
          key: "tier", label: "Tier", type: "select",
          options: ["platinum", "gold", "silver", "community"],
        },
        { key: "logo", label: "Logo", type: "image" },
      ],
    },
  },
  {
    key: "contact",
    label: "Contact",
    description: "Contact details shown on the homepage and in the footer.",
    fields: [
      ...heading("Get in touch"),
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "hours", label: "Opening hours", type: "text" },
    ],
  },
];

export const getSchema = (key: string): SectionSchema | undefined =>
  SECTION_SCHEMAS.find((s) => s.key === key);

/** Fills any missing keys from defaults so a partially-saved section still renders. */
export const mergeSection = (
  stored: SectionContent | undefined,
  fallback: SectionContent
): SectionContent => {
  if (!stored) return fallback;
  return {
    fields: { ...fallback.fields, ...stored.fields },
    items: stored.items?.length ? stored.items : fallback.items,
  };
};
