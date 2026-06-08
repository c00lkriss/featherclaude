import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/ebird")({
  head: () => ({
    meta: [
      { title: "eBird Life List Manager — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EbirdAdminPage,
});

/* ---------------- CSV parsing ---------------- */

// RFC4180-ish parser handling quoted fields with commas/newlines and "" escapes.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

function toIntOrNull(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseEbirdDate(s: string | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ParsedRow = {
  row_number: number | null;
  taxon_order: number | null;
  category: string | null;
  common_name: string | null;
  scientific_name: string | null;
  obs_count: string | null;
  location: string | null;
  state_province: string | null;
  date_observed: string | null;
  location_id: string | null;
  checklist_id: string | null;
  exotic: string | null;
  countable: number;
};

function rowsToRecords(rows: string[][]): ParsedRow[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const map = {
    row: idx("Row #"),
    taxon: idx("Taxon Order"),
    cat: idx("Category"),
    common: idx("Common Name"),
    sci: idx("Scientific Name"),
    count: idx("Count"),
    loc: idx("Location"),
    sp: idx("S/P"),
    date: idx("Date"),
    locid: idx("LocID"),
    subid: idx("SubID"),
    exotic: idx("Exotic"),
    countable: idx("Countable"),
  };
  const out: ParsedRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every((c) => c.trim() === "")) continue;
    const get = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    out.push({
      row_number: toIntOrNull(get(map.row)),
      taxon_order: toIntOrNull(get(map.taxon)),
      category: get(map.cat) || null,
      common_name: get(map.common) || null,
      scientific_name: get(map.sci) || null,
      obs_count: get(map.count) || null,
      location: get(map.loc) || null,
      state_province: get(map.sp) || null,
      date_observed: parseEbirdDate(get(map.date)),
      location_id: get(map.locid) || null,
      checklist_id: get(map.subid) || null,
      exotic: get(map.exotic) || null,
      countable: get(map.countable) === "1" ? 1 : 0,
    });
  }
  return out;
}

/* ---------------- Page ---------------- */

function EbirdAdminPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const { data: history } = useQuery({
    queryKey: ["ebird-upload-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ebird_upload_log")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const lastUpload = history?.[0];

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const rows = parseCSV(text);
      const records = rowsToRecords(rows);
      if (records.length === 0) throw new Error("No data rows found in CSV.");

      setProgress({ done: 0, total: records.length });

      // Full replace
      const { error: delErr } = await supabase.from("ebird_lifelist").delete().not("id", "is", null);
      if (delErr) throw delErr;

      // Batch insert
      const BATCH = 100;
      for (let i = 0; i < records.length; i += BATCH) {
        const slice = records.slice(i, i + BATCH);
        const { error } = await supabase.from("ebird_lifelist").insert(slice);
        if (error) throw error;
        setProgress({ done: Math.min(i + BATCH, records.length), total: records.length });
      }

      const countable = records.filter((r) => r.countable === 1).length;
      const { error: logErr } = await supabase.from("ebird_upload_log").insert({
        filename: file.name,
        total_count: records.length,
        countable_count: countable,
        status: "success",
        notes: null,
      });
      if (logErr) console.warn("[ebird] log insert failed:", logErr.message);

      return { total: records.length, countable };
    },
    onSuccess: ({ total, countable }) => {
      toast.success(
        `✓ Imported ${total} records · ${countable} countable · ${total - countable} other`,
      );
      qc.invalidateQueries({ queryKey: ["ebird-upload-log"] });
      qc.invalidateQueries({ queryKey: ["map-stats"] });
      qc.invalidateQueries({ queryKey: ["wishlist-lifelist"] });
      qc.invalidateQueries({ queryKey: ["wishlist-photo-species"] });
      setFile(null);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setProgress(null);
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-10">
        <Link
          to="/admin/dashboard"
          className="text-xs font-light uppercase tracking-[0.25em] text-muted-foreground hover:text-primary"
        >
          ← Dashboard
        </Link>
        <h1 className="font-display mt-4 text-4xl font-semibold text-foreground md:text-5xl">
          eBird Life List Manager
        </h1>
      </header>

      <section className="mb-6 rounded-sm border border-border bg-surface">
        <button
          onClick={() => setInstructionsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-medium text-foreground">How to export from eBird</span>
          {instructionsOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {instructionsOpen && (
          <div className="border-t border-border px-5 py-4 text-sm font-light text-muted-foreground">
            Export from eBird: <em>My eBird → Download My Data → Life List</em>. Upload below to sync.
            This replaces your previous list entirely.
          </div>
        )}
      </section>

      {lastUpload && (
        <div className="mb-6 rounded-sm border border-primary/40 bg-primary/10 px-5 py-3 text-sm text-primary">
          Last synced:{" "}
          <span className="font-medium">
            {new Date(lastUpload.uploaded_at as string).toLocaleString()}
          </span>{" "}
          · {lastUpload.total_count} species imported
        </div>
      )}

      <section className="rounded-sm border border-dashed border-border bg-surface/60 p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Upload className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-foreground">Choose your eBird Life List CSV</p>
            <p className="mt-1 text-xs font-light text-muted-foreground">
              CSV only · this replaces all previous rows
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-4 file:rounded-sm file:border file:border-border file:bg-background file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-widest file:text-foreground hover:file:border-primary hover:file:text-primary"
          />
          {file && (
            <p className="text-xs font-light text-muted-foreground">
              Selected: <span className="text-foreground">{file.name}</span>
            </p>
          )}

          <button
            onClick={() => file && importMutation.mutate(file)}
            disabled={!file || importMutation.isPending}
            className="mt-2 rounded-none border border-primary bg-primary/90 px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
          >
            {importMutation.isPending ? "Importing…" : "Import Life List"}
          </button>

          {progress && (
            <div className="mt-3 w-full max-w-sm">
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-light text-muted-foreground">
                {progress.done} / {progress.total}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xs font-light uppercase tracking-[0.3em] text-muted-foreground">
          Upload history
        </h2>
        {!history || history.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border bg-surface/50 p-8 text-center text-sm font-light text-muted-foreground">
            No imports yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Countable</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-border/60 text-foreground">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(h.uploaded_at as string).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{h.filename}</td>
                    <td className="px-4 py-3 text-right">{h.total_count}</td>
                    <td className="px-4 py-3 text-right">{h.countable_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
