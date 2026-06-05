import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import exifr from "exifr";
import { CheckCircle2, ImagePlus, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { fileToDownscaledDataURL, formatShutter, slugify } from "@/lib/bird-constants";
import { identifyBird } from "@/lib/identify-bird.functions";

export const Route = createFileRoute("/_authenticated/admin/bulk-upload")({
  head: () => ({
    meta: [
      { title: "Bulk Upload — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BulkUploadPage,
});

type ItemStatus =
  | "queued"
  | "reading_exif"
  | "detecting"
  | "ready"
  | "saving"
  | "saved"
  | "error";

type Item = {
  id: string;
  file: File;
  preview: string;
  status: ItemStatus;
  errorMsg?: string;
  // AI / EXIF derived
  common_name?: string;
  species_name?: string;
  genus?: string;
  family_name?: string;
  order_name?: string;
  iucn_status?: string;
  confidence?: number;
  notes?: string;
  // EXIF
  camera?: string;
  lens?: string;
  iso?: string;
  aperture?: string;
  shutter_speed?: string;
  focal_length?: string;
  date_taken?: string;
  latitude?: string;
  longitude?: string;
  // user-editable
  title?: string;
  description?: string;
  location?: string;
  country?: string;
  is_featured?: boolean;
};

const MAX_FILES = 20;

function BulkUploadPage() {
  const identify = useServerFn(identifyBird);
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    if (arr.length === 0) {
      toast.error("Only JPG, PNG, or WEBP images are accepted.");
      return;
    }
    const room = MAX_FILES - items.length;
    if (room <= 0) {
      toast.error(`Queue is full — ${MAX_FILES} images max per batch.`);
      return;
    }
    const slice = arr.slice(0, room);
    if (arr.length > slice.length) toast.warning(`Only added ${slice.length} of ${arr.length} (limit ${MAX_FILES}).`);

    const newItems: Item[] = slice.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      status: "queued",
      country: "India",
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const removeItem = (id: string) =>
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });

  // Sequential processing pipeline
  useEffect(() => {
    if (processing) return;
    const next = items.find((i) => i.status === "queued");
    if (!next) return;
    setProcessing(true);
    (async () => {
      try {
        updateItem(next.id, { status: "reading_exif" });
        let exif: any = {};
        try {
          exif = (await exifr.parse(next.file, { gps: true })) ?? {};
        } catch {
          /* ignore */
        }
        const exifPatch: Partial<Item> = {
          camera: [exif.Make, exif.Model].filter(Boolean).join(" ") || undefined,
          lens: exif.LensModel || exif.Lens || undefined,
          iso: exif.ISO ? String(exif.ISO) : undefined,
          aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
          shutter_speed: formatShutter(exif.ExposureTime) || undefined,
          focal_length: exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : undefined,
          date_taken: exif.DateTimeOriginal
            ? new Date(exif.DateTimeOriginal).toISOString().slice(0, 10)
            : undefined,
          latitude: exif.latitude != null ? exif.latitude.toFixed(6) : undefined,
          longitude: exif.longitude != null ? exif.longitude.toFixed(6) : undefined,
        };
        updateItem(next.id, { ...exifPatch, status: "detecting" });

        const dataUrl = await fileToDownscaledDataURL(next.file, 1024, 0.85);
        const ai = await identify({ data: { image_data_url: dataUrl } });

        updateItem(next.id, {
          status: "ready",
          common_name: ai.common_name,
          species_name: ai.scientific_name,
          genus: ai.genus,
          family_name: ai.family_name,
          order_name: ai.order_name,
          iucn_status: ai.iucn_status,
          confidence: ai.confidence,
          notes: ai.identification_notes,
          title: ai.common_name || next.file.name.replace(/\.[^.]+$/, ""),
        });
      } catch (err: any) {
        console.error("[bulk] processing failed:", err);
        updateItem(next.id, { status: "error", errorMsg: err?.message || "Failed" });
      } finally {
        setProcessing(false);
      }
    })();
  }, [items, processing, identify]);

  const saveAll = async () => {
    const ready = items.filter((i) => i.status === "ready");
    if (ready.length === 0) {
      toast.error("No cards are ready to save.");
      return;
    }
    for (const item of ready) {
      updateItem(item.id, { status: "saving" });
      try {
        const ext = item.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const slug = slugify(item.common_name || item.species_name || "bird");
        const orderFolder = item.order_name || "Unknown";
        const path = `${orderFolder}/${slug}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, item.file, { contentType: item.file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
        const image_url = pub.publicUrl;

        const { error: insErr } = await supabase.from("photos").insert({
          title: item.title || item.common_name || "Untitled",
          description: item.description || item.notes || null,
          order_name: item.order_name || "Unknown",
          family_name: item.family_name || "Unknown",
          genus: item.genus || null,
          species_name: item.species_name || "Unknown",
          common_name: item.common_name || null,
          species_slug: slug,
          image_url,
          thumbnail_url: image_url,
          date_taken: item.date_taken || null,
          camera: item.camera || null,
          lens: item.lens || null,
          iso: item.iso ? parseInt(item.iso, 10) : null,
          aperture: item.aperture || null,
          shutter_speed: item.shutter_speed || null,
          focal_length: item.focal_length || null,
          location: item.location || null,
          latitude: item.latitude ? parseFloat(item.latitude) : null,
          longitude: item.longitude ? parseFloat(item.longitude) : null,
          country: item.country || "India",
          tags: [],
          is_featured: item.is_featured ?? false,
          iucn_status: item.iucn_status || null,
        });
        if (insErr) throw insErr;
        updateItem(item.id, { status: "saved" });
      } catch (err: any) {
        console.error("[bulk] save failed:", err);
        updateItem(item.id, { status: "error", errorMsg: err?.message || "Save failed" });
      }
    }
    toast.success("Batch save complete.");
  };

  const readyCount = items.filter((i) => i.status === "ready").length;
  const editingItem = items.find((i) => i.id === editing) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/dashboard"
            className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">
            Bulk Upload
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Drop up to {MAX_FILES} photos — species, taxonomy and EXIF are auto-detected.
          </p>
        </div>
        <Link
          to="/admin/upload"
          className="hidden text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary md:block"
        >
          Single Upload →
        </Link>
      </header>

      {/* Dropzone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed bg-surface/50 px-6 py-12 text-center transition-colors",
          dragOver ? "border-primary bg-surface" : "border-border hover:border-primary/60",
        )}
      >
        <ImagePlus className="h-9 w-9 text-muted-foreground" />
        <div>
          <p className="font-display text-lg text-foreground">Drop photographs here</p>
          <p className="mt-1 text-xs font-light text-muted-foreground">
            JPG · PNG · WEBP · {items.length}/{MAX_FILES} queued
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </label>

      {/* Action bar */}
      {items.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
          <p className="text-xs font-light text-muted-foreground">
            {readyCount} ready · {items.filter((i) => i.status === "saved").length} saved ·{" "}
            {items.filter((i) => i.status === "error").length} errors
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                items.forEach((i) => URL.revokeObjectURL(i.preview));
                setItems([]);
              }}
              className="text-xs font-light uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={readyCount === 0}
              className="inline-flex items-center gap-2 rounded-none border border-primary bg-primary/90 px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save All Ready ({readyCount})
            </button>
          </div>
        </div>
      )}

      {/* Queue grid */}
      {items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      )}

      {/* Edit drawer */}
      {editingItem && (
        <EditDrawer
          item={editingItem}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateItem(editingItem.id, patch);
            setEditing(null);
            toast.success("Card updated.");
          }}
        />
      )}
    </div>
  );
}

/* -------- Cards -------- */

function StatusPill({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, { label: string; cls: string; pulse?: boolean }> = {
    queued: { label: "Queued", cls: "bg-muted text-muted-foreground" },
    reading_exif: { label: "Reading EXIF…", cls: "bg-blue-500/15 text-blue-400" },
    detecting: { label: "Detecting species…", cls: "bg-amber-500/15 text-amber-400", pulse: true },
    ready: { label: "Ready to save", cls: "bg-emerald-500/15 text-emerald-400" },
    saving: { label: "Saving…", cls: "bg-blue-500/15 text-blue-400", pulse: true },
    saved: { label: "Saved", cls: "bg-emerald-500/20 text-emerald-300" },
    error: { label: "Error", cls: "bg-destructive/15 text-destructive" },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        s.cls,
        s.pulse && "animate-pulse",
      )}
    >
      {status === "saved" && <CheckCircle2 className="h-3 w-3" />}
      {(status === "detecting" || status === "saving" || status === "reading_exif") && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {s.label}
    </span>
  );
}

function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const tier = value >= 75 ? "High" : value >= 50 ? "Medium" : "Low";
  const cls =
    tier === "High"
      ? "bg-emerald-500/15 text-emerald-300"
      : tier === "Medium"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-destructive/15 text-destructive";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", cls)}>
      {tier} · {Math.round(value)}%
    </span>
  );
}

function QueueCard({
  item,
  onEdit,
  onRemove,
}: {
  item: Item;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const canEdit = item.status !== "saving" && item.status !== "saved";
  return (
    <div className="group relative overflow-hidden rounded-sm border border-border bg-surface">
      <div className="relative aspect-square">
        <img src={item.preview} alt="" className="h-full w-full object-cover" />
        {canEdit && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground opacity-0 backdrop-blur-md transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {item.status === "ready" && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            className="absolute bottom-2 right-2 rounded-full bg-background/80 p-1.5 text-foreground opacity-0 backdrop-blur-md transition-opacity hover:text-primary group-hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-2 p-3">
        <StatusPill status={item.status} />
        <p className="font-display truncate text-sm font-semibold text-foreground">
          {item.common_name || item.file.name}
        </p>
        {item.species_name && (
          <p className="truncate text-[11px] font-light italic text-muted-foreground">
            {item.species_name}
          </p>
        )}
        {item.status === "ready" && <ConfidenceBadge value={item.confidence} />}
        {item.errorMsg && <p className="text-[10px] text-destructive">{item.errorMsg}</p>}
      </div>
    </div>
  );
}

/* -------- Edit Drawer -------- */

function EditDrawer({
  item,
  onClose,
  onSave,
}: {
  item: Item;
  onClose: () => void;
  onSave: (patch: Partial<Item>) => void;
}) {
  const [draft, setDraft] = useState<Item>(item);
  const set = <K extends keyof Item>(k: K, v: Item[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Edit photograph</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <img src={draft.preview} alt="" className="mb-4 max-h-56 w-full rounded-sm object-cover" />

        <div className="space-y-3 text-sm">
          <Pair label="Common name">
            <input value={draft.common_name ?? ""} onChange={(e) => set("common_name", e.target.value)} className={inp} />
          </Pair>
          <Pair label="Scientific name">
            <input value={draft.species_name ?? ""} onChange={(e) => set("species_name", e.target.value)} className={cn(inp, "italic")} />
          </Pair>
          <Pair label="Genus">
            <input value={draft.genus ?? ""} onChange={(e) => set("genus", e.target.value)} className={inp} />
          </Pair>
          <Pair label="Family">
            <input value={draft.family_name ?? ""} onChange={(e) => set("family_name", e.target.value)} className={inp} />
          </Pair>
          <Pair label="Order">
            <input value={draft.order_name ?? ""} onChange={(e) => set("order_name", e.target.value)} className={inp} />
          </Pair>
          <Pair label="IUCN status">
            <input value={draft.iucn_status ?? ""} onChange={(e) => set("iucn_status", e.target.value)} className={inp} />
          </Pair>
          <Pair label="Title">
            <input value={draft.title ?? ""} onChange={(e) => set("title", e.target.value)} className={inp} />
          </Pair>
          <Pair label="Description / notes">
            <textarea
              rows={3}
              value={draft.description ?? draft.notes ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className={cn(inp, "resize-none")}
            />
          </Pair>
          <Pair label="Location">
            <input value={draft.location ?? ""} onChange={(e) => set("location", e.target.value)} className={inp} />
          </Pair>
          <Pair label="Country">
            <input value={draft.country ?? "India"} onChange={(e) => set("country", e.target.value)} className={inp} />
          </Pair>
          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={!!draft.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
            />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Featured</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <button onClick={onClose} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            className="rounded-none border border-primary bg-primary/90 px-5 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";

function Pair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

// silence unused-import warnings if needed
void Trash2;
