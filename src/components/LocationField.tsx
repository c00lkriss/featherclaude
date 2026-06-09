import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type NominatimResult = {
  lat: number;
  lon: number;
  display_name: string;
};

const UA_HEADERS = { Accept: "application/json" } as const;

async function searchNominatim(q: string, limit = 4): Promise<NominatimResult[]> {
  if (!q.trim()) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: UA_HEADERS });
    if (!res.ok) return [];
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    return arr.map((r) => ({
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      display_name: r.display_name,
    }));
  } catch {
    return [];
  }
}

export async function geocodeOne(q: string): Promise<NominatimResult | null> {
  const arr = await searchNominatim(q, 1);
  return arr[0] ?? null;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPick: (r: NominatimResult) => void;
  /** When true, shows the "Mapped" indicator. Caller controls based on lat/long state. */
  mapped?: boolean;
  /** Resets the "mapped" state by calling onChange with new text. */
  onTextEdit?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

/**
 * Location text field with Nominatim autocomplete.
 * After 800ms debounce on typed text, fetches up to 4 suggestions
 * and shows them in a dropdown. Picking one fills the field and emits
 * lat/long via onPick.
 */
export function LocationField({
  value,
  onChange,
  onPick,
  mapped,
  onTextEdit,
  placeholder,
  className,
  inputClassName,
}: Props) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [skipNextSearch, setSkipNextSearch] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipNextSearch) {
      setSkipNextSearch(false);
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const arr = await searchNominatim(q, 4);
      setResults(arr);
      setOpen(arr.length > 0);
      setLoading(false);
    }, 800);
    return () => {
      clearTimeout(t);
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (r: NominatimResult) => {
    setSkipNextSearch(true);
    onChange(r.display_name);
    onPick(r);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onTextEdit?.();
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "e.g. Keoladeo National Park"}
          className={cn(
            "w-full rounded-sm border border-border bg-surface px-4 py-2.5 pr-28 text-sm text-foreground focus:border-primary focus:outline-none",
            inputClassName,
          )}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : mapped ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <Check className="h-3 w-3" /> Mapped
            </span>
          ) : null}
        </div>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-sm border border-border bg-background shadow-xl">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lon},${i}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs font-light text-foreground hover:bg-surface"
              >
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
