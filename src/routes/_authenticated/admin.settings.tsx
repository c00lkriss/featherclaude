import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Coolkriss" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminSettings,
});

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "site_title", label: "Site title" },
  { key: "photographer_name", label: "Photographer name" },
  { key: "contact_email", label: "Contact email" },
];

function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings } = useSiteSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setValues((v) => ({ ...settings, ...v }));
  }, [settings]);

  const saveKey = async (key: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) throw error;
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        FIELDS.map((f) => saveKey(f.key, values[f.key] ?? "")),
      );
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Site Settings
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Logo, favicon, and site-wide identity.
      </p>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <AssetUploader
          label="Logo"
          settingKey="logo_url"
          currentUrl={values.logo_url || ""}
          hint="PNG/SVG with transparent background, ~ 200×60."
        />
        <AssetUploader
          label="Favicon"
          settingKey="favicon_url"
          currentUrl={values.favicon_url || ""}
          hint="32×32 ICO/PNG/SVG."
        />
      </section>

      <section className="mt-10 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-light uppercase tracking-[0.25em] text-muted-foreground">
              {f.label}
            </label>
            <input
              type="text"
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: e.target.value }))
              }
              className="mt-2 w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="mt-2 inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save text settings
        </button>
      </section>
    </div>
  );
}

function AssetUploader({
  label,
  settingKey,
  currentUrl,
  hint,
}: {
  label: string;
  settingKey: string;
  currentUrl: string;
  hint?: string;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl);

  useEffect(() => setUrl(currentUrl), [currentUrl]);

  const onPick = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${settingKey}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: dbErr } = await supabase
        .from("site_settings")
        .upsert({ key: settingKey, value: publicUrl }, { onConflict: "key" });
      if (dbErr) throw dbErr;
      setUrl(publicUrl);
      toast.success(`${label} updated`);
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onClear = async () => {
    await supabase
      .from("site_settings")
      .upsert({ key: settingKey, value: "" }, { onConflict: "key" });
    setUrl("");
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    toast.success(`${label} cleared`);
  };

  return (
    <div className="rounded-sm border border-border bg-surface p-5">
      <div className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 flex h-20 items-center justify-center rounded-sm border border-dashed border-border bg-background">
        {url ? (
          <img src={url} alt={label} className="max-h-16 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">No {label.toLowerCase()} set</span>
        )}
      </div>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-sm border border-primary bg-primary/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {url && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-sm border border-border px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
