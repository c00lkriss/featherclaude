import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Upload } from "lucide-react";
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

function AdminSettings() {
  const { data: settings } = useSiteSettings();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setValues((v) => ({ ...settings, ...v }));
  }, [settings]);

  const onChange = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-foreground">Site Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Branding, contact info, and the editable About page.
      </p>

      <Section title="Site Branding" keys={["site_title"]} values={values} onChange={onChange}>
        <div className="grid gap-6 md:grid-cols-2">
          <AssetUploader label="Logo" settingKey="logo_url" currentUrl={values.logo_url || ""} hint="PNG/SVG/WEBP, transparent bg, ~ 200×60." />
          <AssetUploader label="Favicon" settingKey="favicon_url" currentUrl={values.favicon_url || ""} hint="32×32 ICO/PNG/SVG." />
        </div>
        <Field label="Site title" k="site_title" values={values} onChange={onChange} placeholder="Coolkriss" />
      </Section>

      <Section title="Contact Info" keys={["contact_email", "instagram_url", "youtube_url"]} values={values} onChange={onChange}>
        <Field label="Contact email" k="contact_email" values={values} onChange={onChange} placeholder="hello@coolkriss.in" />
        <Field label="Instagram URL" k="instagram_url" values={values} onChange={onChange} placeholder="https://instagram.com/…" />
        <Field label="YouTube URL" k="youtube_url" values={values} onChange={onChange} placeholder="https://youtube.com/@…" />
      </Section>

      <Section title="About Page" keys={["about_bio"]} values={values} onChange={onChange}>
        <div>
          <label className="block text-xs font-light uppercase tracking-[0.25em] text-muted-foreground">
            Photographer bio
          </label>
          <textarea
            value={values.about_bio ?? ""}
            onChange={(e) => onChange("about_bio", e.target.value)}
            rows={8}
            className="mt-2 w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="Tell the story…"
          />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  keys,
  values,
  children,
}: {
  title: string;
  keys: string[];
  values: Record<string, string>;
  onChange: (k: string, v: string) => void;
  children: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const rows = keys.map((k) => ({ key: k, value: values[k] ?? "" }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      setSaved(true);
      toast.success(`${title} saved`);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-10 rounded-sm border border-border bg-surface p-6">
      <h2 className="font-display text-lg text-foreground">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  k,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  k: string;
  values: Record<string, string>;
  onChange: (k: string, v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-light uppercase tracking-[0.25em] text-muted-foreground">{label}</label>
      <input
        type="text"
        value={values[k] ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(k, e.target.value)}
        className="mt-2 w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
      />
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
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => setUrl(currentUrl), [currentUrl]);

  const upload = async (file: File) => {
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
    await supabase.from("site_settings").upsert({ key: settingKey, value: "" }, { onConflict: "key" });
    setUrl("");
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    toast.success(`${label} cleared`);
  };

  return (
    <div>
      <div className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-2 flex h-24 cursor-pointer items-center justify-center rounded-sm border border-dashed bg-background transition-colors ${dragOver ? "border-primary" : "border-border hover:border-primary/60"}`}
      >
        {url ? (
          <img src={url} alt={label} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">Drag & drop or click to upload</span>
        )}
      </div>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
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
          <button type="button" onClick={onClear} className="rounded-sm border border-border px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
