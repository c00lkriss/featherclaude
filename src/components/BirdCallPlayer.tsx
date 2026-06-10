import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2, Square } from "lucide-react";
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

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function BirdCallPlayer({ photoId, scientificName, commonName, stored, visible = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [info, setInfo] = useState<{
    url: string | null;
    recordist: string | null;
    license: string | null;
  }>({
    url: stored.xeno_canto_url,
    recordist: stored.xeno_canto_recordist,
    license: stored.xeno_canto_license,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop & reset when photo changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setInfo({
      url: stored.xeno_canto_url,
      recordist: stored.xeno_canto_recordist,
      license: stored.xeno_canto_license,
    });
  }, [photoId, stored.xeno_canto_url, stored.xeno_canto_recordist, stored.xeno_canto_license]);

  const play = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(url);
    audioRef.current = a;
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
    a.addEventListener("timeupdate", () => setCurrent(a.currentTime));
    a.addEventListener("ended", () => {
      setPlaying(false);
      setCurrent(0);
    });
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setCurrent(0);
  };

  const handleClick = async () => {
    if (playing) {
      stop();
      return;
    }
    if (info.url && info.url !== "not_found") {
      play(info.url);
      return;
    }
    if (stored.xeno_canto_id === "not_found") return;
    if (!scientificName) return;

    setLoading(true);
    try {
      const result = await fetchXenoCantoCall(scientificName);
      if (!result) {
        await supabase
          .from("photos")
          .update({ xeno_canto_id: "not_found" })
          .eq("id", photoId);
        setInfo({ url: null, recordist: null, license: null });
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
      setInfo({ url: result.url, recordist: result.recordist, license: result.license });
      play(result.url);
    } finally {
      setLoading(false);
    }
  };

  const hasCall = !!info.url && info.url !== "not_found";
  const notFound = stored.xeno_canto_id === "not_found" && !info.url;

  return (
    <>
      {/* Floating audio bar */}
      {playing && info.url && (
        <div
          className={cn(
            "absolute bottom-24 right-6 z-30 flex max-w-xs flex-col gap-1 rounded-lg border border-amber-400/40 bg-black/80 px-4 py-3 text-xs text-white backdrop-blur-md transition-opacity",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="flex items-center gap-3">
            <Waveform />
            <span className="flex-1 truncate font-medium">
              🔊 {commonName || scientificName} — Call
            </span>
            <button
              onClick={stop}
              aria-label="Stop"
              className="rounded-full p-1 text-amber-300 hover:bg-white/10"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="font-mono text-[10px] text-white/70">
            {fmtTime(current)} / {fmtTime(duration)}
          </div>
          {info.recordist && (
            <div className="text-[10px] text-white/50">
              Recording by {info.recordist}
              {info.license ? ` · ${formatLicense(info.license)}` : ""} · xeno-canto.org
            </div>
          )}
        </div>
      )}

      {/* Speaker button */}
      <button
        onClick={handleClick}
        aria-label={playing ? "Stop call" : "Play bird call"}
        disabled={loading || notFound}
        title={notFound ? "No recording available" : hasCall ? "Play call" : "Fetch & play call"}
        style={{
          borderColor: "#c9a84c",
          color: playing ? "#111" : "#c9a84c",
          backgroundColor: playing ? "#c9a84c" : "rgba(0,0,0,0.5)",
        }}
        className={cn(
          "absolute bottom-6 right-[5.25rem] z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-300 disabled:opacity-40",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : playing ? (
          <Square className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>
    </>
  );
}

function Waveform() {
  return (
    <div className="flex h-5 items-end gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-amber-400"
          style={{
            animation: `wave 0.9s ease-in-out ${i * 0.12}s infinite`,
            height: "100%",
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
