import { useState } from "react";
import { MapPin, X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EbirdSuggestion, EbirdObservation } from "@/lib/ebird-suggestion";

type Props = {
  suggestion: EbirdSuggestion | null;
  loading?: boolean;
  onAccept: (loc: {
    location: string;
    state_province: string | null;
    ebird_lat: number | null;
    ebird_long: number | null;
  }) => void;
  onDismiss?: () => void;
  className?: string;
};

function fmtYear(d: string | null): string {
  if (!d) return "";
  try {
    return String(new Date(d).getFullYear());
  } catch {
    return "";
  }
}

export function EBirdSuggestionCard({ suggestion, loading, onAccept, onDismiss, className }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (loading) {
    return (
      <div className={cn("rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-xs font-light text-muted-foreground", className)}>
        🔎 Checking your eBird list…
      </div>
    );
  }

  if (!suggestion || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const acceptAndDismiss = (loc: Parameters<typeof onAccept>[0]) => {
    onAccept(loc);
    setDismissed(true);
  };

  if (suggestion.tier === "new") {
    return (
      <div className={cn("rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300", className)}>
        🎉 New species for your eBird life list! Consider adding this sighting to eBird after uploading.
      </div>
    );
  }


  if (suggestion.tier === "common") {
    return (
      <div className={cn("rounded-sm border border-border bg-surface px-4 py-3", className)}>
        <p className="text-xs font-light text-muted-foreground">{suggestion.message}</p>
        {suggestion.alternatives.length > 0 && (
          <ObservationChips
            label="Recent records"
            list={suggestion.alternatives}
            onPick={(o) =>
              acceptAndDismiss({
                location: o.location ?? "",
                state_province: o.state_province,
                ebird_lat: o.ebird_lat,
                ebird_long: o.ebird_long,
              })
            }
          />
        )}
      </div>
    );
  }

  if (suggestion.tier === "none" || !suggestion.location) return null;


  const accentBorder = suggestion.tier === "high" ? "border-primary" : "border-amber-400/60";
  const accentBg = suggestion.tier === "high" ? "bg-primary/10" : "bg-amber-500/10";

  return (
    <div className={cn("rounded-sm border-2", accentBorder, accentBg, className)}>
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.25em] text-primary">
            <Sparkles className="h-3 w-3" />
            Suggested from your eBird list
          </p>
          <p className="mt-2 font-display text-base font-semibold text-foreground">
            <MapPin className="mr-1 inline-block h-4 w-4 text-primary" />
            {suggestion.location}
            {suggestion.state_province && (
              <span className="text-muted-foreground">, {suggestion.state_province}</span>
            )}
          </p>
          <p className="mt-1 text-xs font-light italic text-muted-foreground">
            {suggestion.message}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onAccept({
                location: suggestion.location!,
                state_province: suggestion.state_province,
                ebird_lat: suggestion.ebird_lat,
                ebird_long: suggestion.ebird_long,
              })
            }
            className="inline-flex items-center gap-1 rounded-sm border border-primary bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-3 w-3" /> Use
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-sm border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      {suggestion.alternatives.length > 0 && (
        <div className="border-t border-border/60 px-4 pb-3 pt-2">
          <ObservationChips
            label="Other observations"
            list={suggestion.alternatives}
            onPick={(o) =>
              onAccept({
                location: o.location ?? "",
                state_province: o.state_province,
                ebird_lat: o.ebird_lat,
                ebird_long: o.ebird_long,
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function ObservationChips({
  label,
  list,
  onPick,
}: {
  label: string;
  list: EbirdObservation[];
  onPick: (o: EbirdObservation) => void;
}) {
  return (
    <>
      <p className="text-[10px] font-light uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o)}
            className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-light text-foreground hover:border-primary hover:text-primary"
            title={`${o.location ?? ""}${o.date_observed ? " · " + o.date_observed : ""}`}
          >
            {o.location?.split(",")[0] ?? "Unknown"} · {fmtYear(o.date_observed)}
          </button>
        ))}
      </div>
    </>
  );
}
