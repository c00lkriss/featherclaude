import { useEffect, useState } from "react";
import { Loader2, Volume2, X } from "lucide-react";
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

  // Reset when photo changes
  useEffect(() => {
    setOpen(false);
    setInfo({
      id: stored.xeno_canto_id && stored.xeno_canto_id !== "not_found" ? stored.xeno_canto_id : null,
      recordist: stored.xeno_canto_recordist,
      license: stored.xeno_canto_license,
    });
  }, [photoId, stored.xeno_canto_id, stored.xeno_canto_recordist, stored.xeno_canto_license]);

  const notFound = stored.xeno_canto_id === "not_found" && !info.id;

  const handleClick = async () => {
    if (notFound) return;
    if (open) {
      setOpen(false);
      return;
    }
    if (info.id) {
      setOpen(true);
      return;
    }
    const query = scientificName || commonName;
    if (!query) return;
    setLoading(true);
    try {
      const result = await fetchXenoCantoCall(query);
      if (!result) {
        await supabase.from("photos").update({ xeno_canto_id: "not_found" }).eq("id", photoId);
        setInfo({ id: null, recordist: null, license: null });
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

  return (
    <>
      {open && info.id && (
        <div
          className={cn(
            "absolute bottom-24 right-6 z-30 w-[360px] max-w-[calc(100vw-3rem)] rounded-xl p-3 backdrop-blur-md transition-opacity",
            visible ? "opacity-100" : "opacity-0",
          )}
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(201,168,76,0.3)",
          }}
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
        aria-label={open ? "Hide call" : "Play bird call"}
        disabled={loading || notFound}
        title={notFound ? "No call recording found for this species" : info.id ? "Show call" : "Fetch call"}
        style={{
          borderColor: "#c9a84c",
          color: open ? "#111" : "#c9a84c",
          backgroundColor: open ? "#c9a84c" : "rgba(0,0,0,0.5)",
          opacity: notFound ? 0.4 : 1,
        }}
        className={cn(
          "absolute bottom-6 right-[5.25rem] z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </>
  );
}
