"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, RotateCcw, ChevronUp, ChevronDown, Database, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useSiteContent } from "@/contexts/SiteContentContext";
import { ImageUploadField } from "@/components/ImageUploadField";
import {
  SECTION_SCHEMAS, ICON_NAMES, type Field, type ItemValues, type SectionContent,
} from "@/lib/site-content";

const FieldInput = ({
  field, value, onChange,
}: { field: Field; value: string; onChange: (v: string) => void }) => {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          placeholder={field.placeholder} className="mt-1" />
      );
    case "image":
      return <div className="mt-1"><ImageUploadField value={value} onChange={onChange} /></div>;
    case "icon":
      return (
        <Select value={value || ICON_NAMES[0]} onValueChange={onChange}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ICON_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "select":
      return (
        <Select value={value || field.options?.[0] || ""} onValueChange={onChange}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder} className="mt-1" />
      );
  }
};

export const SiteAdminPanel = () => {
  const { getSection, saveSection, resetSection, source, loading } = useSiteContent();

  const [activeKey, setActiveKey] = useState(SECTION_SCHEMAS[0].key);
  const [draft, setDraft] = useState<SectionContent>({ fields: {}, items: [] });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const schema = SECTION_SCHEMAS.find((s) => s.key === activeKey)!;

  // Reload the draft whenever the section changes or stored content arrives.
  useEffect(() => {
    const current = getSection(activeKey);
    setDraft({
      fields: { ...current.fields },
      items: current.items.map((i) => ({ ...i })),
    });
    setDirty(false);
  }, [activeKey, getSection, loading]);

  const setField = (key: string, value: string) => {
    setDraft((d) => ({ ...d, fields: { ...d.fields, [key]: value } }));
    setDirty(true);
  };

  const setItemField = (index: number, key: string, value: string) => {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    }));
    setDirty(true);
  };

  const addItem = () => {
    const blank: ItemValues = {};
    schema.items?.fields.forEach((f) => { blank[f.key] = ""; });
    setDraft((d) => ({ ...d, items: [...d.items, blank] }));
    setDirty(true);
  };

  const removeItem = (index: number) => {
    setDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }));
    setDirty(true);
  };

  const moveItem = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= draft.items.length) return;
    setDraft((d) => {
      const items = [...d.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...d, items };
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection(activeKey, draft);
      setDirty(false);
      toast.success(
        source === "supabase"
          ? `${schema.label} published`
          : `${schema.label} saved locally`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSection(activeKey);
      toast.success(`${schema.label} reset to default`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Website Content</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit what visitors see on the public homepage.
            </p>
          </div>
          <Badge variant={source === "supabase" ? "default" : "secondary"} className="gap-1.5">
            {source === "supabase" ? (
              <><Database className="h-3 w-3" /> Supabase</>
            ) : (
              <><HardDrive className="h-3 w-3" /> This browser only</>
            )}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {SECTION_SCHEMAS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveKey(s.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  s.key === activeKey
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle>{schema.label}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{schema.description}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {schema.fields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
              <FieldInput
                field={f}
                value={draft.fields[f.key] ?? ""}
                onChange={(v) => setField(f.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {schema.items && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {schema.items.label}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {draft.items.length}
              </span>
            </CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add {schema.items.singular}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {draft.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No {schema.items.label.toLowerCase()} yet.
              </p>
            ) : (
              draft.items.map((item, index) => (
                <div key={index} className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {schema.items!.singular} {index + 1}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => moveItem(index, -1)}
                        disabled={index === 0} aria-label="Move up">
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => moveItem(index, 1)}
                        disabled={index === draft.items.length - 1} aria-label="Move down">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}
                        aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {schema.items!.fields.map((f) => (
                      <div
                        key={f.key}
                        className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}
                      >
                        <Label htmlFor={`i-${index}-${f.key}`} className="text-xs">
                          {f.label}
                        </Label>
                        <FieldInput
                          field={f}
                          value={item[f.key] ?? ""}
                          onChange={(v) => setItemField(index, f.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SiteAdminPanel;
