import { useEffect, useState } from "react";
import { Loader2, Volume2, VolumeX, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchXenoCantoCall, formatLicense } from "@/lib/xeno-canto";
import { cn } from "@/lib/utils";

type Props = {
  photoId: string;
  scientificName: string | null;
  commonName: string | null;
  stored: {
    xeno_canto_id: string | null;
    xeno_canto_url: string | null;
    xeno_canto_recordist: string | null;
    xeno_canto_license: string | null;
  };
  visible?: boolean;
};

type State = "ready" | "loading" | "not_found" | "unfetched";

export function BirdCallPlayer({ photoId, scientificName, commonName, stored, visible = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<{
    id: string | null;
    recordist: string | null;
    license: string | null;
  }>({
    id: stored.xeno_canto_id && stored.xeno_canto_id !== "not_found" ? stored.xeno_canto_id : null,
    recordist: stored.xeno_canto_recordist,
    license: stored.xeno_canto_license,
  });
  const [notFound, setNotFound] = useState(stored.xeno_canto_id === "not_found");

  useEffect(() => {
    setOpen(false);
    setInfo({
      id: stored.xeno_canto_id && stored.xeno_canto_id !== "not_found" ? stored.xeno_canto_id : null,
      recordist: stored.xeno_canto_recordist,
      license: stored.xeno_canto_license,
    });
    setNotFound(stored.xeno_canto_id === "not_found");
  }, [photoId, stored.xeno_canto_id, stored.xeno_canto_recordist, stored.xeno_canto_license]);

  const state: State = loading
    ? "loading"
    : info.id
      ? "ready"
      : notFound
        ? "not_found"
        : "unfetched";

  const tooltip =
    state === "ready" ? "Play bird call" :
    state === "loading" ? "Finding recording..." :
    state === "not_found" ? "No recording available" :
    "Click to load bird call";


  const handleClick = async () => {
    if (state === "not_found" || state === "loading") return;
    if (open) { setOpen(false); return; }
    if (info.id) { setOpen(true); return; }

    setLoading(true);
    try {
      const result = await fetchXenoCantoCall(scientificName, commonName);
      if (!result) {
        await supabase.from("photos").update({ xeno_canto_id: "not_found" }).eq("id", photoId);
        setNotFound(true);
        return;
      }
      await supabase
        .from("photos")
        .update({
          xeno_canto_id: result.id,
          xeno_canto_url: result.url,
          xeno_canto_recordist: result.recordist,
          xeno_canto_license: result.license,
        })
        .eq("id", photoId);
      setInfo({ id: result.id, recordist: result.recordist, license: result.license });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Visual styling per state
  const colorStyles: Record<State, { color: string; bg: string; opacity: number }> = {
    ready:      { color: "#c9a84c", bg: "rgba(0,0,0,0.5)", opacity: 1 },
    loading:    { color: "#c9a84c", bg: "rgba(0,0,0,0.5)", opacity: 1 },
    not_found:  { color: "#9ca3af", bg: "rgba(0,0,0,0.5)", opacity: 0.4 },
    unfetched:  { color: "#ffffff", bg: "rgba(0,0,0,0.5)", opacity: 0.7 },
  };
  const s = open && state === "ready"
    ? { color: "#111", bg: "#c9a84c", opacity: 1 }
    : colorStyles[state];

  return (
    <>
      {open && info.id && (
        <div
          className={cn(
            "absolute bottom-24 right-6 z-30 w-[360px] max-w-[calc(100vw-3rem)] rounded-xl p-3 backdrop-blur-md transition-opacity",
            visible ? "opacity-100" : "opacity-0",
          )}
          style={{ backgroundColor: "rgba(0,0,0,0.85)", border: "1px solid rgba(201,168,76,0.3)" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-light uppercase tracking-widest text-white/80">
              {commonName || scientificName} — Call
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <iframe
            src={`https://xeno-canto.org/${info.id}/embed?darkbg=1`}
            width="340"
            height="115"
            frameBorder={0}
            scrolling="no"
            style={{ borderRadius: 8, width: "100%" }}
            title="Xeno-canto recording"
          />
          <p className="mt-2 text-[10px] font-light text-white/50">
            via xeno-canto.org{info.recordist ? ` · ${info.recordist}` : ""}
            {info.license ? ` · ${formatLicense(info.license)}` : ""}
          </p>
        </div>
      )}

      <button
        onClick={handleClick}
        aria-label={tooltip}
        title={tooltip}
        disabled={state === "not_found" || state === "loading"}
        style={{
          borderColor: s.color,
          color: s.color,
          backgroundColor: s.bg,
          opacity: s.opacity,
        }}
        className={cn(
          "absolute bottom-6 right-[5.25rem] z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-300",
          state === "loading" && "animate-pulse",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {state === "loading"
          ? <Loader2 className="h-5 w-5 animate-spin" />
          : state === "not_found"
            ? <VolumeX className="h-5 w-5" />
            : <Volume2 className="h-5 w-5" />}
      </button>
    </>
  );
}
