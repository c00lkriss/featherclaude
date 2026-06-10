import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import exifr from "exifr";
import { Upload, X, ImagePlus, Star, Loader2, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  geteBirdLocationSuggestion,
  geocodeWithNominatim,
  type EbirdSuggestion,
} from "@/lib/ebird-suggestion";
import { EBirdSuggestionCard } from "@/components/EBirdSuggestionCard";
import { LocationField } from "@/components/LocationField";
import { readImageMeta } from "@/lib/image-meta";
import { parseSpeciesFromFilename } from "@/lib/filename-species";
import { fetchXenoCantoCall } from "@/lib/xeno-canto";
import { identifyBird } from "@/lib/identify-bird.functions";
import { fileToDownscaledDataURL } from "@/lib/bird-constants";


export const Route = createFileRoute("/_authenticated/admin/upload")({
  head: () => ({
    meta: [
      { title: "Upload Photo — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UploadPage,
});

const BIRD_ORDERS = [
  "Passeriformes", "Columbiformes", "Accipitriformes", "Falconiformes",
  "Strigiformes", "Coraciiformes", "Piciformes", "Cuculiformes",
  "Psittaciformes", "Galliformes", "Gruiformes", "Charadriiformes",
  "Pelecaniformes", "Ciconiiformes", "Anseriformes", "Apodiformes",
  "Bucerotiformes", "Suliformes", "Phoenicopteriformes", "Podicipediformes",
  "Caprimulgiformes", "Trogoniformes", "Upupiformes", "Procellariiformes",
];

// Minimal family suggestions by order (autocomplete hints)
const FAMILIES_BY_ORDER: Record<string, string[]> = {
  Passeriformes: ["Muscicapidae", "Corvidae", "Sturnidae", "Pycnonotidae", "Nectariniidae", "Motacillidae", "Hirundinidae", "Laniidae", "Estrildidae", "Ploceidae"],
  Columbiformes: ["Columbidae"],
  Accipitriformes: ["Accipitridae", "Pandionidae"],
  Falconiformes: ["Falconidae"],
  Strigiformes: ["Strigidae", "Tytonidae"],
  Coraciiformes: ["Coraciidae", "Alcedinidae", "Meropidae"],
  Piciformes: ["Picidae", "Megalaimidae"],
  Cuculiformes: ["Cuculidae"],
  Psittaciformes: ["Psittaculidae"],
  Galliformes: ["Phasianidae"],
  Gruiformes: ["Gruidae", "Rallidae"],
  Charadriiformes: ["Charadriidae", "Scolopacidae", "Laridae", "Recurvirostridae", "Jacanidae"],
  Pelecaniformes: ["Pelecanidae", "Ardeidae", "Threskiornithidae"],
  Ciconiiformes: ["Ciconiidae"],
  Anseriformes: ["Anatidae"],
  Apodiformes: ["Apodidae"],
  Bucerotiformes: ["Bucerotidae", "Upupidae"],
};

type FormState = {
  // taxonomy
  order_name: string;
  family_name: string;
  genus: string;
  species_name: string;
  common_name: string;
  species_slug: string;
  // details
  title: string;
  description: string;
  date_taken: string;
  // exif
  camera: string;
  lens: string;
  iso: string;
  aperture: string;
  shutter_speed: string;
  focal_length: string;
  // location
  location: string;
  latitude: string;
  longitude: string;
  region: string;
  country: string;
  // settings
  tags: string;
  is_featured: boolean;
  iucn_status: string;
};

const EMPTY: FormState = {
  order_name: "", family_name: "", genus: "", species_name: "",
  common_name: "", species_slug: "",
  title: "", description: "", date_taken: "",
  camera: "", lens: "", iso: "", aperture: "", shutter_speed: "", focal_length: "",
  location: "", latitude: "", longitude: "", region: "", country: "",
  tags: "", is_featured: false, iucn_status: "",
};

const IUCN_OPTIONS = [
  "Least Concern",
  "Near Threatened",
  "Vulnerable",
  "Endangered",
  "Critically Endangered",
  "Data Deficient",
  "Not Evaluated",
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

function UploadPage() {
  const navigate = useNavigate();
  const identify = useServerFn(identifyBird);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [commonNameTouched, setCommonNameTouched] = useState(false);
  const [ebirdSuggestion, setEbirdSuggestion] = useState<EbirdSuggestion | null>(null);
  const [ebirdLoading, setEbirdLoading] = useState(false);
  const [locationMapped, setLocationMapped] = useState(false);
  const [filenameGuess, setFilenameGuess] = useState<string | null>(null);
  const [filenameStatus, setFilenameStatus] = useState<"pending" | "accepted" | "rejected" | "none">("none");
  const [ebirdMatchBadge, setEbirdMatchBadge] = useState<"hit" | "miss" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!commonNameTouched) return;
    set("species_slug", slugify(form.common_name));
  }, [form.common_name, commonNameTouched]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Re-query eBird suggestion whenever the scientific name or photo date changes.
  useEffect(() => {
    let cancelled = false;
    const sci = form.species_name.trim();
    if (!sci) {
      setEbirdSuggestion(null);
      return;
    }
    setEbirdLoading(true);
    const t = setTimeout(async () => {
      const sug = await geteBirdLocationSuggestion({
        scientific_name: sci,
        common_name: form.common_name,
        photo_date: form.date_taken || null,
      });
      if (!cancelled) {
        setEbirdSuggestion(sug);
        setEbirdLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setEbirdLoading(false);
    };
  }, [form.species_name, form.common_name, form.date_taken]);

  const acceptEbirdLocation = async (loc: {
    location: string;
    state_province: string | null;
    ebird_lat: number | null;
    ebird_long: number | null;
  }) => {
    setForm((p) => ({
      ...p,
      location: loc.location,
      region: loc.state_province ?? p.region,
      latitude: loc.ebird_lat != null ? String(loc.ebird_lat) : p.latitude,
      longitude: loc.ebird_long != null ? String(loc.ebird_long) : p.longitude,
    }));
    setLocationMapped(loc.ebird_lat != null);
    if (loc.ebird_lat == null && loc.location) {
      // Resolve lat/long via Nominatim if we don't already have it
      const geo = await geocodeWithNominatim(loc.location);
      if (geo) {
        setForm((p) => ({
          ...p,
          latitude: geo.lat.toFixed(6),
          longitude: geo.lon.toFixed(6),
        }));
        setLocationMapped(true);
      }
    }
  };

  const handleFile = async (f: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Image is larger than 20 MB.");
      return;
    }
    setFile(f);

    // Filename parsing
    const guess = parseSpeciesFromFilename(f.name);
    setFilenameGuess(guess);
    setFilenameStatus(guess ? "pending" : "none");
    setEbirdMatchBadge(null);

    // Read EXIF
    try {
      const exif = await exifr.parse(f, { gps: true });
      if (exif) {
        setForm((p) => ({
          ...p,
          camera: p.camera || [exif.Make, exif.Model].filter(Boolean).join(" "),
          lens: p.lens || exif.LensModel || exif.Lens || "",
          iso: p.iso || (exif.ISO ? String(exif.ISO) : ""),
          aperture: p.aperture || (exif.FNumber ? `f/${exif.FNumber}` : ""),
          shutter_speed: p.shutter_speed || formatShutter(exif.ExposureTime),
          focal_length: p.focal_length || (exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : ""),
          date_taken: p.date_taken || (exif.DateTimeOriginal
            ? new Date(exif.DateTimeOriginal).toISOString().slice(0, 10) : ""),
          latitude: p.latitude || (exif.latitude != null ? exif.latitude.toFixed(6) : ""),
          longitude: p.longitude || (exif.longitude != null ? exif.longitude.toFixed(6) : ""),
        }));
      }
    } catch {
      // silent — EXIF is optional
    }
  };

  const acceptFilename = async () => {
    if (!filenameGuess) return;
    setCommonNameTouched(true);
    set("common_name", filenameGuess);
    set("title", filenameGuess);
    setFilenameStatus("accepted");

    // Cross-reference eBird life list
    const { data } = await supabase
      .from("ebird_lifelist")
      .select("common_name, scientific_name")
      .ilike("common_name", `%${filenameGuess}%`)
      .limit(1);
    const hit = data?.[0];
    if (hit) {
      setEbirdMatchBadge("hit");
      setForm((p) => ({
        ...p,
        common_name: hit.common_name || p.common_name,
        species_name: p.species_name || hit.scientific_name || "",
        title: p.title || hit.common_name || filenameGuess,
      }));
      toast.success("Matched your eBird list — taxonomy pre-filled.");
    } else {
      setEbirdMatchBadge("miss");
      toast.warning("Not in your eBird list — please verify taxonomy.");
    }
  };

  const detectWithAI = async () => {
    if (!file) return;
    setAiLoading(true);
    try {
      const dataUrl = await fileToDownscaledDataURL(file, 1024, 0.85);
      const ai = await identify({ data: { image_data_url: dataUrl } });
      setForm((p) => ({
        ...p,
        common_name: ai.common_name || p.common_name,
        species_name: ai.scientific_name || p.species_name,
        genus: ai.genus || p.genus,
        family_name: ai.family_name || p.family_name,
        order_name: ai.order_name || p.order_name,
        iucn_status: ai.iucn_status || p.iucn_status,
        title: p.title || ai.common_name || "",
        description: p.description || ai.identification_notes || "",
      }));
      setCommonNameTouched(true);
      setFilenameStatus("rejected");
      toast.success(`Identified: ${ai.common_name ?? "unknown"}`);
    } catch (err: any) {
      toast.error(err?.message || "AI detection failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please choose an image first.");

    // Validation
    const required: (keyof FormState)[] = ["order_name", "family_name", "species_name", "common_name", "title"];
    for (const k of required) {
      if (!form[k]) {
        toast.error(`Missing: ${k.replace(/_/g, " ")}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Compute aspect ratio metadata
      const meta = await readImageMeta(file);

      // If location set but no lat/long, attempt geocode at submit time
      let latNum = form.latitude ? parseFloat(form.latitude) : null;
      let lonNum = form.longitude ? parseFloat(form.longitude) : null;
      let missingCoords = false;
      if (form.location && (latNum == null || lonNum == null)) {
        const geo = await geocodeWithNominatim(form.location);
        if (geo) {
          latNum = geo.lat;
          lonNum = geo.lon;
        } else {
          missingCoords = true;
        }
      }

      // Upload to storage
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const identifier = slugify(form.common_name || form.species_name || "bird");
      const photoSlug = (await import("@/lib/bird-constants")).buildPhotoSlug(identifier);
      const path = `${form.order_name}/${photoSlug}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);
      const image_url = pub.publicUrl;

      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const locationParts = [form.location, form.region, form.country].filter(Boolean);

      const { data: inserted, error: insErr } = await supabase.from("photos").insert({
        title: form.title,
        description: form.description || null,
        order_name: form.order_name,
        family_name: form.family_name,
        genus: form.genus || null,
        species_name: form.species_name,
        common_name: form.common_name || null,
        species_identifier: identifier,
        species_slug: photoSlug,
        image_url,
        thumbnail_url: image_url,
        date_taken: form.date_taken || null,
        camera: form.camera || null,
        lens: form.lens || null,
        iso: form.iso ? parseInt(form.iso, 10) : null,
        aperture: form.aperture || null,
        shutter_speed: form.shutter_speed || null,
        focal_length: form.focal_length || null,
        location: locationParts.join(", ") || null,
        latitude: latNum,
        longitude: lonNum,
        missing_coordinates: missingCoords,
        image_width: meta?.width ?? null,
        image_height: meta?.height ?? null,
        aspect_ratio: meta?.aspect_ratio ?? null,
        tags,
        is_featured: form.is_featured,
        iucn_status: form.iucn_status || null,
      }).select("id").single();
      if (insErr) throw insErr;

      // Background — fetch xeno-canto call (don't await)
      if (inserted?.id && form.species_name) {
        fetchXenoCantoCall(form.species_name).then(async (call) => {
          if (!call) {
            await supabase.from("photos").update({ xeno_canto_id: "not_found" }).eq("id", inserted.id);
            return;
          }
          await supabase.from("photos").update({
            xeno_canto_id: call.id,
            xeno_canto_url: call.url,
            xeno_canto_recordist: call.recordist,
            xeno_canto_license: call.license,
          }).eq("id", inserted.id);
        }).catch(() => {});
      }

      toast.success("Photograph uploaded.");
      navigate({ to: "/admin/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const familySuggestions = FAMILIES_BY_ORDER[form.order_name] ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12 flex items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/dashboard"
            className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">
            Upload Photograph
          </h1>
        </div>
        <Link
          to="/admin/bulk-upload"
          className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-surface px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          Bulk Upload →
        </Link>
      </header>


      <form onSubmit={handleSubmit} className="space-y-12">
        {/* 1. Image */}
        <Section title="Image" number="01">
          {!preview ? (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-sm border-2 border-dashed bg-surface/50 px-6 py-16 text-center transition-colors",
                dragOver ? "border-primary bg-surface" : "border-border hover:border-primary/60",
              )}
            >
              <ImagePlus className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-display text-lg text-foreground">Drop a photograph here</p>
                <p className="mt-1 text-xs font-light text-muted-foreground">
                  JPG · PNG · WEBP · max 20 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="relative overflow-hidden rounded-sm border border-border bg-background">
              <img src={preview} alt="Preview" className="mx-auto max-h-[300px] w-auto object-contain" />
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute right-3 top-3 rounded-full bg-background/80 p-2 text-foreground backdrop-blur-md hover:text-primary"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Filename detection card */}
          {file && filenameStatus === "pending" && (
            <div className="mt-4 rounded-sm border border-border bg-surface p-5">
              {filenameGuess ? (
                <>
                  <p className="text-xs font-light uppercase tracking-widest text-muted-foreground">
                    📁 Detected from filename
                  </p>
                  <p className="font-display mt-2 text-lg text-foreground">"{filenameGuess}"</p>
                  <p className="mt-2 text-sm text-muted-foreground">Is this correct?</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={acceptFilename}
                      className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary"
                    >
                      <FileText className="h-3.5 w-3.5" /> Yes, use this name
                    </button>
                    <button
                      type="button"
                      onClick={detectWithAI}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2 text-xs font-medium uppercase tracking-widest text-foreground hover:border-primary"
                    >
                      {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      No, detect with AI
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-light uppercase tracking-widest text-muted-foreground">
                    🤖 Filename unclear
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">No species name found in filename.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={detectWithAI}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary"
                    >
                      {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Detect species with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilenameStatus("rejected")}
                      className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2 text-xs font-medium uppercase tracking-widest text-foreground hover:border-primary"
                    >
                      Enter manually
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {ebirdMatchBadge === "hit" && (
            <p className="mt-3 inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-400">
              ✓ Found in your eBird list
            </p>
          )}
          {ebirdMatchBadge === "miss" && (
            <p className="mt-3 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-medium text-amber-400">
              ⚠ Not in your eBird list — please verify taxonomy
            </p>
          )}

        </Section>

        {/* 2. Taxonomy */}
        <Section title="Taxonomy" number="02">
          <Grid>
            <Field label="Order *">
              <select
                required
                value={form.order_name}
                onChange={(e) => set("order_name", e.target.value)}
                className={selectCls}
              >
                <option value="">Select an order…</option>
                {BIRD_ORDERS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Family *">
              <input
                required list="family-list" value={form.family_name}
                onChange={(e) => set("family_name", e.target.value)}
                className={inputCls}
              />
              <datalist id="family-list">
                {familySuggestions.map((f) => <option key={f} value={f} />)}
              </datalist>
            </Field>
            <Field label="Genus">
              <input value={form.genus} onChange={(e) => set("genus", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Species (scientific) *">
              <input
                required
                value={form.species_name}
                onChange={(e) => set("species_name", e.target.value)}
                className={cn(inputCls, "italic")}
                placeholder="Genus species"
              />
            </Field>
            <Field label="Common name *">
              <input
                required
                value={form.common_name}
                onChange={(e) => { set("common_name", e.target.value); setCommonNameTouched(true); }}
                className={inputCls}
              />
            </Field>
            <Field label="Slug (auto)">
              <input
                value={form.species_slug}
                onChange={(e) => { set("species_slug", slugify(e.target.value)); setCommonNameTouched(true); }}
                className={cn(inputCls, "text-muted-foreground")}
              />
            </Field>
          </Grid>
        </Section>

        {/* 2b. Conservation */}
        <Section title="Conservation" number="2b" hint="IUCN Red List status">
          <Field label="IUCN Status">
            <select
              value={form.iucn_status}
              onChange={(e) => set("iucn_status", e.target.value)}
              className={selectCls}
            >
              <option value="">Select a status…</option>
              {IUCN_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </Section>

        {/* 3. Photo details */}
        <Section title="Photograph" number="03">
          <Grid>
            <Field label="Title *">
              <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Date taken">
              <input type="date" value={form.date_taken} onChange={(e) => set("date_taken", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Description" full>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
          </Grid>
        </Section>

        {/* 4. EXIF */}
        <Section title="Capture Data" number="04" hint="Auto-filled from EXIF — edit as needed">
          <Grid>
            <Field label="Camera"><input value={form.camera} onChange={(e) => set("camera", e.target.value)} className={inputCls} /></Field>
            <Field label="Lens"><input value={form.lens} onChange={(e) => set("lens", e.target.value)} className={inputCls} /></Field>
            <Field label="ISO"><input value={form.iso} onChange={(e) => set("iso", e.target.value)} className={inputCls} /></Field>
            <Field label="Aperture"><input value={form.aperture} onChange={(e) => set("aperture", e.target.value)} placeholder="f/5.6" className={inputCls} /></Field>
            <Field label="Shutter"><input value={form.shutter_speed} onChange={(e) => set("shutter_speed", e.target.value)} placeholder="1/1000" className={inputCls} /></Field>
            <Field label="Focal length"><input value={form.focal_length} onChange={(e) => set("focal_length", e.target.value)} placeholder="400mm" className={inputCls} /></Field>
          </Grid>
        </Section>

        {/* 5. Location */}
        <Section title="Location" number="05">
          <div className="mb-5 space-y-2">
            <EBirdSuggestionCard
              suggestion={ebirdSuggestion}
              loading={ebirdLoading}
              onAccept={acceptEbirdLocation}
            />
          </div>
          <Grid>
            <Field label="Place name" full>
              <LocationField
                value={form.location}
                onChange={(v) => set("location", v)}
                onTextEdit={() => {
                  set("latitude", "");
                  set("longitude", "");
                  setLocationMapped(false);
                }}
                onPick={(r) => {
                  set("latitude", r.lat.toFixed(6));
                  set("longitude", r.lon.toFixed(6));
                  setLocationMapped(true);
                }}
                mapped={locationMapped || !!(form.latitude && form.longitude)}
                placeholder="e.g. Keoladeo National Park"
              />
            </Field>
            <Field label="State / Region"><input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} /></Field>
            <Field label="Country"><input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} /></Field>
          </Grid>
        </Section>


        {/* 6. Tags & settings */}
        <Section title="Tags & Settings" number="06">
          <Field label="Tags (comma-separated)">
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputCls}
              placeholder="wetland, monsoon, juvenile"
            />
            {form.tags.split(",").filter((t) => t.trim()).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
                  <span key={i} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-light text-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Field>

          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface p-4">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set("is_featured", e.target.checked)}
              className="h-4 w-4 accent-[--color-primary]"
            />
            <Star className={cn("h-4 w-4", form.is_featured ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-light text-foreground">
              Featured photograph — show in the landing page hero carousel
            </span>
          </label>
        </Section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 border-t border-border pt-8">
          <Link
            to="/admin/dashboard"
            className="text-xs font-light uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-none border border-primary bg-primary/90 px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {submitting ? "Uploading…" : "Publish Photograph"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- helpers ---------- */

const inputCls =
  "w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none";
const selectCls = cn(inputCls, "appearance-none");

function Section({ title, number, hint, children }: { title: string; number: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-5 flex items-baseline gap-4">
        <span className="font-display text-xs font-light text-muted-foreground">{number}</span>
        <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
        {hint && <span className="text-xs font-light text-muted-foreground">— {hint}</span>}
      </header>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("block", full && "md:col-span-2")}>
      <span className="mb-2 block text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatShutter(t: number | undefined | null): string {
  if (t == null) return "";
  if (t >= 1) return `${t}s`;
  return `1/${Math.round(1 / t)}`;
}
