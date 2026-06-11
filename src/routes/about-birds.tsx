import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/about-birds")({
  head: () => ({
    meta: [
      { title: "Birds of India — Coolkriss" },
      { name: "description", content: "A field guide to India's avifauna: taxonomy, anatomy, field identification, major orders, biogeographic zones and seasons." },
      { property: "og:title", content: "Birds of India — Coolkriss" },
      { property: "og:description", content: "Explore one of the world's richest avifaunal regions — 1,300+ species across the Indian subcontinent." },
    ],
  }),
  component: AboutBirdsPage,
});

const AMBER = "#c9a84c";

/* ─────────────────────────────────────────────
   Section 1 — Hero
   ───────────────────────────────────────────── */
function Hero() {
  // 10 floating feathers
  const feathers = Array.from({ length: 10 }).map((_, i) => ({
    top: `${(i * 53) % 90 + 5}%`,
    left: `${(i * 37) % 92 + 2}%`,
    size: 40 + ((i * 13) % 60),
    delay: `${(i * 1.7) % 8}s`,
    duration: `${14 + (i % 5) * 3}s`,
  }));

  const stats = [
    { v: "1,300+", l: "Species" },
    { v: "~13%", l: "of World's Birds" },
    { v: "5", l: "Biogeographic Zones" },
    { v: "78", l: "Endemic Species" },
  ];

  return (
    <header
      className="relative overflow-hidden"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Floating feathers */}
      <div className="pointer-events-none absolute inset-0">
        {feathers.map((f, i) => (
          <svg
            key={i}
            className="absolute animate-feather-float"
            style={{
              top: f.top,
              left: f.left,
              width: f.size,
              height: f.size,
              opacity: 0.06,
              color: AMBER,
              animationDelay: f.delay,
              animationDuration: f.duration,
            }}
            viewBox="0 0 64 64"
            fill="currentColor"
          >
            <path d="M32 2C18 8 10 22 12 38c1 7 4 13 8 18l4-4c-3-4-6-9-7-15C15 25 22 13 32 8c10 5 17 17 15 29-1 6-4 11-7 15l4 4c4-5 7-11 8-18 2-16-6-30-20-36z" />
            <path d="M30 18l-6 26 6-4 6 4-6-26z" opacity="0.7" />
          </svg>
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-white" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
          Birds of India
        </h1>
        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
          Exploring one of the world's richest avifaunal regions
        </p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div
              key={s.l}
              className="rounded-lg border p-5"
              style={{ borderColor: "rgba(201,168,76,0.3)", backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <div className="font-display text-3xl md:text-4xl font-bold" style={{ color: AMBER }}>
                {s.v}
              </div>
              <div className="mt-2 text-xs md:text-sm uppercase tracking-wider text-white/60">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes feather-float {
          0%   { transform: translate(0,0) rotate(0deg); }
          50%  { transform: translate(20px,-30px) rotate(180deg); }
          100% { transform: translate(0,0) rotate(360deg); }
        }
        .animate-feather-float { animation: feather-float linear infinite; }
      `}</style>
    </header>
  );
}

/* ─────────────────────────────────────────────
   Section 2 — Taxonomy
   ───────────────────────────────────────────── */
function TaxonomySection() {
  const levels = [
    { name: "Class", greek: "Aves (Latin: 'birds')", desc: "Warm-blooded, feathered, egg-laying vertebrates.", example: "Aves" },
    { name: "Order", greek: "From Latin 'ordo' — rank", desc: "Groups families sharing major anatomical traits.", example: "Columbiformes" },
    { name: "Family", greek: "From Latin 'familia'", desc: "Closely related genera with similar body plans.", example: "Columbidae" },
    { name: "Genus", greek: "Greek 'genos' — kind", desc: "A tight cluster of very similar species.", example: "Columba" },
    { name: "Species", greek: "Latin 'species' — sort", desc: "An interbreeding population, the smallest rank.", example: "Columba livia" },
  ];

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">The Language of Birds</h2>
          <p className="mt-3 text-muted-foreground">How scientists organise the avian world</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-2">
          {levels.map((lv, i) => (
            <div key={lv.name} className="flex items-stretch gap-3 md:flex-1">
              <div
                className="group relative flex-1 rounded-lg border bg-surface p-5 transition-all hover:border-primary hover:-translate-y-1"
                style={{ borderColor: "rgba(201,168,76,0.35)" }}
              >
                <div className="font-display text-lg font-bold text-foreground">{lv.name}</div>
                <div className="mt-1 text-xs italic text-muted-foreground">{lv.greek}</div>
                <div className="mt-3 text-sm text-foreground/80">{lv.desc}</div>
                <div className="mt-3 text-xs font-mono" style={{ color: AMBER }}>{lv.example}</div>
              </div>
              {i < levels.length - 1 && (
                <div className="hidden md:flex items-center" style={{ color: AMBER }}>→</div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-surface/60 p-6 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">A worked example</div>
          <div className="mt-3 font-mono text-base md:text-lg" style={{ color: AMBER }}>
            Aves → Columbiformes → Columbidae → Columba → Columba livia
          </div>
          <div className="mt-2 text-sm text-foreground/80">"Rock Pigeon"</div>
        </div>

        <div className="mt-10 max-w-3xl mx-auto text-center">
          <h3 className="font-display text-xl text-foreground">Why does taxonomy matter for birders?</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Knowing a bird's family is a shortcut to its behaviour, habitat and field marks. Once you recognise a
            silhouette as a "wagtail" or a "drongo", you've already narrowed the world's 11,000 birds down to a
            handful of candidates — and you know where to look, what to listen for, and which features matter for the ID.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Section 3 — Anatomy
   ───────────────────────────────────────────── */
type AnatomyPart = { id: string; name: string; left: string; top: string; look: string; matters: string; example: string };

const ANATOMY: AnatomyPart[] = [
  { id: "bill",        name: "Bill / Beak",   left: "8%",  top: "42%", look: "Shape, length, colour, curvature.", matters: "Indicates diet — hooked = raptor, probing = wader, conical = seedeater.", example: "The long decurved bill of a Sunbird signals nectar feeding." },
  { id: "crown",       name: "Crown",         left: "28%", top: "12%", look: "Cap colour and pattern on top of head.", matters: "Often the most diagnostic head feature.", example: "The chestnut crown identifies the Eurasian Tree Sparrow." },
  { id: "supercilium", name: "Supercilium",   left: "22%", top: "22%", look: "Bold or thin 'eyebrow' stripe above the eye.", matters: "A classic field mark in warblers and pipits.", example: "A white supercilium is key to the White-browed Wagtail." },
  { id: "eye",         name: "Eye",           left: "25%", top: "28%", look: "Iris colour, eye-ring, eye-stripe.", matters: "Pale iris distinguishes many otherwise-similar birds.", example: "Pale yellow eye of the Jungle Babbler." },
  { id: "ear",         name: "Ear Coverts",   left: "32%", top: "30%", look: "Patch of feathers behind/below the eye.", matters: "Often coloured or framed in species like nuthatches.", example: "Black ear coverts mark a male House Sparrow." },
  { id: "throat",      name: "Throat",        left: "18%", top: "40%", look: "Front of neck under the bill.", matters: "Frequently brightly coloured in males.", example: "The crimson throat of a Crimson Sunbird." },
  { id: "nape",        name: "Nape",          left: "42%", top: "18%", look: "Back of neck, between crown and mantle.", matters: "Useful for separating similar species in profile.", example: "Black-naped Monarch is named for this." },
  { id: "mantle",      name: "Mantle",        left: "52%", top: "22%", look: "Upper back between wings.", matters: "Often a different shade from the crown or rump.", example: "Grey mantle is a key feature of the Common Myna." },
  { id: "coverts",     name: "Wing Coverts",  left: "55%", top: "38%", look: "Small feathers covering the base of the wing.", matters: "Wing bars are formed by their pale tips.", example: "Two white wing bars on a Chiffchaff." },
  { id: "primary",     name: "Primaries",     left: "65%", top: "52%", look: "Outermost flight feathers.", matters: "Determine wing shape and flight style.", example: "Long pointed primaries of the Common Swift." },
  { id: "secondary",   name: "Secondaries",   left: "58%", top: "48%", look: "Inner flight feathers along the trailing edge.", matters: "Often show a contrasting panel.", example: "White secondary patch flashes on a Hoopoe in flight." },
  { id: "breast",      name: "Breast",        left: "28%", top: "48%", look: "Upper chest, below the throat.", matters: "Streaking, spotting and colour key for ID.", example: "Orange breast names the Red-breasted Flycatcher." },
  { id: "belly",       name: "Belly",         left: "32%", top: "58%", look: "Mid underside of body.", matters: "Often pale and contrasts with breast.", example: "White belly on a Black Drongo." },
  { id: "flanks",      name: "Flanks",        left: "42%", top: "58%", look: "Sides of the body, below the folded wing.", matters: "Streaks or barring here are diagnostic.", example: "Rufous flanks identify the White-bellied Blue Flycatcher." },
  { id: "vent",        name: "Vent",          left: "52%", top: "65%", look: "Area under the base of the tail.", matters: "Pale or barred vent often clinches an ID.", example: "Rufous vent of the Red-vented Bulbul." },
  { id: "tail",        name: "Tail",          left: "72%", top: "50%", look: "Length, shape, colour, white edges.", matters: "Forked, graduated or square tails name many birds.", example: "Deeply forked tail of the Black Drongo." },
  { id: "rump",        name: "Rump",          left: "62%", top: "38%", look: "Lower back, above the tail.", matters: "Contrasting rump patches are often visible in flight.", example: "White rump of the Pied Bushchat in flight." },
  { id: "tarsus",      name: "Tarsus",        left: "38%", top: "75%", look: "Leg between the foot and the joint.", matters: "Colour and length help separate similar species.", example: "Yellow tarsus of the Cattle Egret." },
];

const TOPO_PRIMARY = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Wren_troglodytes_topography.svg/1200px-Wren_troglodytes_topography.svg.png";
const TOPO_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Pied_kingfisher_topography.svg/1200px-Pied_kingfisher_topography.svg.png";

function AnatomySection() {
  const [active, setActive] = useState<AnatomyPart | null>(ANATOMY[0]);
  const [imgSrc, setImgSrc] = useState(TOPO_PRIMARY);

  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Anatomy of a Bird</h2>
          <p className="mt-3 text-muted-foreground">The map you use to describe what you see</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <div
              className="relative mx-auto w-full max-w-[900px] rounded-xl p-6"
              style={{ backgroundColor: "#111111" }}
            >
              <div className="relative">
                <img
                  src={imgSrc}
                  alt="Bird topography diagram"
                  onError={() => {
                    if (imgSrc !== TOPO_FALLBACK) setImgSrc(TOPO_FALLBACK);
                  }}
                  className="block w-full h-auto select-none"
                  draggable={false}
                />
                {ANATOMY.map((p) => {
                  const isActive = active?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActive(p)}
                      className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
                      style={{ left: p.left, top: p.top }}
                      aria-label={p.name}
                    >
                      <span
                        className="block rounded-full transition-all"
                        style={{
                          width: isActive ? 14 : 10,
                          height: isActive ? 14 : 10,
                          backgroundColor: isActive ? "#fde68a" : AMBER,
                          boxShadow: isActive ? "0 0 0 4px rgba(253,230,138,0.25)" : "0 0 0 3px rgba(201,168,76,0.18)",
                        }}
                      />
                      <span
                        className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 md:opacity-90"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                      >
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-right text-[11px] text-white/40">
                Illustration: Wikimedia Commons — Public Domain
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-6 bg-background lg:sticky lg:top-20" style={{ borderColor: "rgba(201,168,76,0.4)" }}>
            {active ? (
              <>
                <div className="text-xs uppercase tracking-wider" style={{ color: AMBER }}>Field Mark</div>
                <h3 className="mt-1 font-display text-2xl text-foreground">{active.name}</h3>
                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <div className="font-semibold text-foreground/80">What to look for</div>
                    <p className="mt-1 text-muted-foreground">{active.look}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground/80">Why it matters</div>
                    <p className="mt-1 text-muted-foreground">{active.matters}</p>
                  </div>
                  <div className="border-l-2 pl-3 italic text-foreground/70" style={{ borderColor: AMBER }}>
                    {active.example}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tap a dot on the diagram to learn more.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────
   Section 4 — BESS Method
   ───────────────────────────────────────────── */
function BessSection() {
  const cards = [
    {
      letter: "B",
      title: "Body & Shape",
      icon: (
        <svg viewBox="0 0 64 64" fill="currentColor" className="w-8 h-8"><path d="M10 38c4-12 16-18 28-14 6 2 10 6 12 12l8-2-4 6 6 4-10 2c-2 6-8 10-16 10-12 0-22-8-24-18z" /></svg>
      ),
      points: [
        "Overall size — sparrow, myna, crow, kite or heron sized?",
        "Body shape: slim/stocky, upright/horizontal posture",
        "Tail length: short stub, medium, long graduated",
        "Wing shape in flight: pointed, rounded, broad",
      ],
    },
    {
      letter: "E",
      title: "Bill, Wings & Feet",
      icon: (
        <svg viewBox="0 0 64 64" fill="currentColor" className="w-8 h-8"><path d="M4 30l44-10-30 22z" /><circle cx="40" cy="20" r="3" /></svg>
      ),
      points: [
        "Bill shape: hooked, straight, curved, spatulate, serrated",
        "Bill length relative to head size",
        "Leg colour and length",
        "Foot type: perching, raptorial, wading, webbed",
      ],
    },
    {
      letter: "S",
      title: "Colours & Patterns",
      icon: (
        <svg viewBox="0 0 64 64" fill="currentColor" className="w-8 h-8"><path d="M32 4C20 12 14 28 18 44c2 8 8 14 14 16 6-2 12-8 14-16 4-16-2-32-14-40zm0 8v44" /></svg>
      ),
      points: [
        "Overall colour — dorsal (top) vs ventral (below)",
        "Head pattern: cap, mask, stripe, plain",
        "Wing bars: one, two or none",
        "Breast pattern: streaked, spotted, plain, barred",
        "Rump colour (often visible in flight) and eye colour",
      ],
    },
    {
      letter: "S",
      title: "Voice & Behaviour",
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-8 h-8"><path d="M8 32h6" /><path d="M18 22v20" /><path d="M28 14v36" /><path d="M38 22v20" /><path d="M48 28v8" /><path d="M56 32h2" /></svg>
      ),
      points: [
        "Call type: whistle, churr, chatter, melodious, harsh",
        "Song vs alarm call",
        "Feeding behaviour: gleaning, hawking, probing, diving",
        "Social: solitary, pairs, flocks",
        "Habitat preference",
      ],
    },
  ];

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Field Identification Guide</h2>
        </div>
        <p className="max-w-3xl mx-auto text-center text-muted-foreground leading-relaxed">
          Identification is a craft of patience. Watch the bird first — note its shape, the way it moves, the
          sounds it makes — and only then reach for the field guide. The longer you observe, the easier the ID.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border bg-surface p-6 transition-all hover:-translate-y-1"
              style={{ borderColor: "rgba(201,168,76,0.3)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-bold"
                  style={{ backgroundColor: "rgba(201,168,76,0.12)", color: AMBER }}
                >
                  {c.letter}
                </div>
                <div style={{ color: AMBER }}>{c.icon}</div>
                <h3 className="font-display text-xl text-foreground">{c.title}</h3>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {c.points.map((p, j) => (
                  <li key={j} className="flex gap-2">
                    <span style={{ color: AMBER }}>•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Field notes template */}
        <div
          className="mt-14 max-w-2xl mx-auto rounded-lg border bg-surface p-8 shadow-2xl"
          style={{ borderColor: "rgba(201,168,76,0.4)", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(201,168,76,0.08) 28px)" }}
        >
          <h3 className="font-display text-2xl text-foreground">Quick Field Notes Template</h3>
          <p className="text-xs text-muted-foreground">Screenshot this when you spot an unknown bird</p>

          <div className="mt-6 space-y-3 font-mono text-sm text-foreground/90">
            <div>📍 Location: ___________________</div>
            <div>📅 Date &amp; Time: _______________</div>
            <div>🌤️ Habitat: ____________________</div>
            <div className="pt-2">
              <div className="text-xs uppercase tracking-wider" style={{ color: AMBER }}>Size</div>
              <div>☐ Sparrow ☐ Myna ☐ Pigeon ☐ Crow ☐ Kite ☐ Heron</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: AMBER }}>Bill</div>
              <div>☐ Short ☐ Medium ☐ Long ☐ Straight ☐ Curved ☐ Hooked</div>
            </div>
            <div>Colour (top): _________________</div>
            <div>Colour (below): _______________</div>
            <div>Special marks: ________________</div>
            <div>Behaviour: ____________________</div>
            <div>Call / sound: _________________</div>
            <div>Flock size: ___________________</div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Share these notes on birding communities like IndiaBiotic, eBird India, or Wildlife of India for help with ID
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Section 5 — Orders Accordion
   ───────────────────────────────────────────── */
const ORDERS = [
  {
    name: "Passeriformes", pron: "pass-er-ih-FOR-meez", count: "~600 species in India",
    line: "The perching birds — over half of all bird species.",
    about: "The largest and most diverse order, found in nearly every habitat across India from Himalayan forests to urban gardens. United by a perching foot with three toes forward and one back.",
    families: ["Muscicapidae — Indian Robin, Magpie-Robin, Shamas", "Corvidae — House Crow, Treepies, Magpies", "Pycnonotidae — Red-vented Bulbul, Red-whiskered Bulbul", "Nectariniidae — Purple Sunbird, Crimson Sunbird"],
    tips: ["Small to medium with grasping feet", "Vocal: many sing complex songs", "Often the most active birds in any habitat"],
  },
  {
    name: "Columbiformes", pron: "co-LUM-bih-FOR-meez", count: "~30 species in India",
    line: "Pigeons and doves.",
    about: "Plump-bodied birds with small heads and short legs found across India, from the Rock Pigeon of cities to forest fruit doves. They drink by sucking — a rarity among birds.",
    families: ["Columbidae — Rock Pigeon, Spotted Dove, Yellow-footed Green Pigeon, Imperial Pigeons"],
    tips: ["Stout body, small head", "Cooing voices", "Strong direct flight with audible wing claps"],
  },
  {
    name: "Accipitriformes", pron: "ack-SIP-ih-trih-FOR-meez", count: "~60 species in India",
    line: "Diurnal raptors — hawks, eagles, vultures and kites.",
    about: "Hook-billed predators with powerful talons. India holds globally important populations of vultures, eagles and the Black Kite, the most abundant raptor in many cities.",
    families: ["Accipitridae — Shikra, Black Kite, Crested Serpent Eagle, vultures", "Pandionidae — Osprey"],
    tips: ["Hooked bill, strong talons", "Soaring flight with broad wings", "Watch for tail and wing pattern in flight"],
  },
  {
    name: "Strigiformes", pron: "STRIJ-ih-FOR-meez", count: "~33 species in India",
    line: "Owls.",
    about: "Mostly nocturnal predators with forward-facing eyes, silent flight and acute hearing. India has owls from the tiny Jungle Owlet to the massive Eurasian Eagle-Owl.",
    families: ["Strigidae — Spotted Owlet, Brown Fish Owl, Indian Eagle-Owl", "Tytonidae — Barn Owl, Grass Owl"],
    tips: ["Large head, forward-facing eyes", "Listen at dusk and dawn for hoots and screeches", "Look for pellets and whitewash under roosts"],
  },
  {
    name: "Coraciiformes", pron: "co-RAY-see-ih-FOR-meez", count: "~25 species in India",
    line: "Kingfishers, bee-eaters and rollers — brilliant colourists.",
    about: "Colourful insectivores and fishers with syndactyl feet (toes partly fused). Indian rollers, bee-eaters perched on wires, and kingfishers along every waterbody.",
    families: ["Alcedinidae — Common, White-throated, Pied Kingfisher", "Meropidae — Green, Blue-tailed, Chestnut-headed Bee-eater", "Coraciidae — Indian Roller"],
    tips: ["Often very colourful", "Sit on exposed perches and sally for prey", "Strong straight bill"],
  },
  {
    name: "Piciformes", pron: "PIE-sih-FOR-meez", count: "~45 species in India",
    line: "Woodpeckers and barbets.",
    about: "Zygodactyl (two toes forward, two back) tree-climbers with chisel bills. India has 30+ woodpeckers and a rich barbet community known for monotonous calls in summer.",
    families: ["Picidae — Black-rumped Flameback, Grey-headed Woodpecker", "Megalaimidae — Coppersmith, White-cheeked, Brown-headed Barbet"],
    tips: ["Cling to vertical trunks", "Listen for drumming and metronomic calls", "Undulating flight"],
  },
  {
    name: "Cuculiformes", pron: "kew-KEW-lih-FOR-meez", count: "~25 species in India",
    line: "Cuckoos, koels and coucals.",
    about: "Slender, long-tailed birds — many of them brood parasites that lay eggs in other birds' nests. The Asian Koel and Common Hawk-Cuckoo announce summer across India.",
    families: ["Cuculidae — Asian Koel, Common Hawk-Cuckoo, Greater Coucal, Sirkeer Malkoha"],
    tips: ["Long tail, slim body", "Loud diagnostic calls in breeding season", "Often skulk in dense foliage"],
  },
  {
    name: "Psittaciformes", pron: "sit-TAS-ih-FOR-meez", count: "~13 species in India",
    line: "Parrots and parakeets.",
    about: "Hook-billed, brightly coloured birds with zygodactyl feet. The Rose-ringed and Plum-headed Parakeets are familiar across the country; hill forests hold the Vernal Hanging-Parrot and Lorikeets.",
    families: ["Psittaculidae — Rose-ringed, Plum-headed, Alexandrine Parakeet, Vernal Hanging-Parrot"],
    tips: ["Loud screeching flocks in flight", "Hooked bill, brilliant green plumage", "Strong, direct, fast flight"],
  },
  {
    name: "Galliformes", pron: "gal-LIH-FOR-meez", count: "~25 species in India",
    line: "Pheasants, partridges, quails and junglefowl.",
    about: "Heavy-bodied ground-dwellers that prefer running to flying. India is the homeland of the Red Junglefowl — ancestor of all domestic chickens — and several spectacular Himalayan pheasants.",
    families: ["Phasianidae — Red Junglefowl, Indian Peafowl, Grey Francolin, Himalayan Monal"],
    tips: ["Heavy body, short rounded wings", "Often heard scratching in leaf litter", "Explosive whirring take-off"],
  },
  {
    name: "Gruiformes", pron: "GREW-ih-FOR-meez", count: "~22 species in India",
    line: "Cranes, rails, crakes and coots.",
    about: "A diverse order linked by wetlands and grasslands. India hosts the Sarus Crane — the world's tallest flying bird — and globally threatened Bengal Florican.",
    families: ["Gruidae — Sarus, Demoiselle, Common Crane", "Rallidae — White-breasted Waterhen, Common Coot, Purple Swamphen"],
    tips: ["Long legs and neck (cranes); skulking rails", "Trumpeting calls of cranes carry far", "Watch reedbeds at dawn for rails"],
  },
  {
    name: "Charadriiformes", pron: "ka-rad-ree-ih-FOR-meez", count: "~140 species in India",
    line: "Waders, gulls, terns and shorebirds.",
    about: "Mostly waterside birds — long-legged probers, slender-billed plovers, gulls and terns. India's coasts and inland wetlands host enormous numbers of winter visitors from Central Asia.",
    families: ["Charadriidae — Lapwings, Plovers", "Scolopacidae — Sandpipers, Stints, Curlews", "Laridae — Gulls and Terns", "Jacanidae — Pheasant-tailed, Bronze-winged Jacana"],
    tips: ["Long legs for wading", "Probing or picking feeding action", "Many in non-breeding plumage in winter — focus on bill and leg colour"],
  },
  {
    name: "Pelecaniformes", pron: "pel-ih-CAN-ih-FOR-meez", count: "~30 species in India",
    line: "Pelicans, herons, egrets, ibises and spoonbills.",
    about: "Large waterbirds that nest colonially. From the Spot-billed Pelican of southern lakes to the white egrets in every paddy field, this order dominates Indian wetlands.",
    families: ["Pelecanidae — Spot-billed and Great White Pelican", "Ardeidae — Grey, Purple Heron, Egrets, Pond-Heron", "Threskiornithidae — Glossy Ibis, Black-headed Ibis, Eurasian Spoonbill"],
    tips: ["Long bills and necks", "Slow methodical wading", "Fly with neck retracted (herons) or extended (storks/ibises)"],
  },
  {
    name: "Bucerotiformes", pron: "byew-SER-oh-tih-FOR-meez", count: "~10 species in India",
    line: "Hornbills and the Hoopoe.",
    about: "Hornbills are large, casque-billed forest birds essential to seed dispersal. India's flagship species — the Great Hornbill — is found in the Western Ghats and Northeast.",
    families: ["Bucerotidae — Indian Grey, Malabar Pied, Great Hornbill", "Upupidae — Common Hoopoe"],
    tips: ["Massive bill, often with a casque", "Loud, far-carrying calls and noisy flight", "Fruiting trees attract them in flocks"],
  },
  {
    name: "Anseriformes", pron: "an-SER-ih-FOR-meez", count: "~50 species in India",
    line: "Ducks, geese and swans.",
    about: "Webbed-footed waterfowl, mostly winter visitors to Indian wetlands from Central Asia and Siberia. A few residents like the Spot-billed Duck and Lesser Whistling-Duck.",
    families: ["Anatidae — Northern Pintail, Common Teal, Bar-headed Goose, Spot-billed Duck"],
    tips: ["Broad flat bill, webbed feet", "Often in large mixed flocks on lakes", "Males often more boldly patterned"],
  },
  {
    name: "Falconiformes", pron: "fal-CON-ih-FOR-meez", count: "~14 species in India",
    line: "Falcons — agile aerial predators.",
    about: "Long-winged, fast-flying raptors that kill with the bill rather than the talons. India hosts breeding species like the Shaheen Falcon and stunning passage migrants like the Amur Falcon.",
    families: ["Falconidae — Common Kestrel, Shaheen Falcon, Amur Falcon, Peregrine Falcon"],
    tips: ["Long pointed wings, fast direct flight", "Hovering kestrels are unmistakable", "Tear-drop facial markings on many species"],
  },
  {
    name: "Apodiformes", pron: "ah-POD-ih-FOR-meez", count: "~10 species in India",
    line: "Swifts — aerialists of the bird world.",
    about: "Spend almost their entire lives in the air, eating, drinking, mating and even sleeping on the wing. Includes the Indian Swiftlet, whose nests are harvested in coastal caves.",
    families: ["Apodidae — House Swift, Asian Palm Swift, Alpine Swift, Indian Swiftlet"],
    tips: ["Stiff scythe-shaped wings", "Never perch on the ground or branches", "Often seen wheeling in screaming flocks at dusk"],
  },
];

const OrderIcon = () => (
  <svg viewBox="0 0 32 24" className="w-8 h-6" fill="currentColor"><path d="M2 14c3-6 9-10 16-10 4 0 8 2 10 6l2-1-1 3 2 2-4 1c-1 4-5 7-10 7-7 0-13-3-15-8z" /></svg>
);

function OrdersSection() {
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Major Orders in India</h2>
          <p className="mt-3 text-muted-foreground">16 orders that account for nearly all of India's birds</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {ORDERS.map((o) => (
            <AccordionItem
              key={o.name}
              value={o.name}
              className="border rounded-lg bg-background px-5"
              style={{ borderColor: "rgba(201,168,76,0.2)" }}
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center gap-4 text-left">
                  <span style={{ color: AMBER }}><OrderIcon /></span>
                  <div className="flex-1">
                    <div className="font-display text-lg text-foreground">
                      {o.name} <span className="text-xs font-normal italic text-muted-foreground">({o.pron})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{o.line}</div>
                  </div>
                  <span
                    className="hidden sm:inline-block rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                    style={{ backgroundColor: "rgba(201,168,76,0.12)", color: AMBER }}
                  >
                    {o.count}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: AMBER }}>About</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{o.about}</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: AMBER }}>Key families in India</div>
                    <ul className="space-y-2 text-sm text-foreground/80">
                      {o.families.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: AMBER }}>Field ID tips</div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {o.tips.map((t) => <li key={t} className="flex gap-2"><span style={{ color: AMBER }}>›</span><span>{t}</span></li>)}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Section 6 — Biogeographic Zones
   ───────────────────────────────────────────── */
const ZONES = [
  { name: "The Himalayas", bg: "rgba(96,165,250,0.05)", geo: "The mountain rampart along India's northern border, from Kashmir to Arunachal Pradesh.", climate: "Alpine meadows, conifer forests and rhododendron thickets across steep elevational gradients.", species: ["Himalayan Monal", "Snow Partridge", "Wallcreeper", "Grandala", "Fire-tailed Myzornis"], cons: "Several Himalayan endemics rely on shrinking alpine habitats.", endemics: true },
  { name: "Western Ghats", bg: "rgba(74,222,128,0.05)", geo: "A 1,600-km mountain chain running parallel to India's southwestern coast.", climate: "Evergreen and shola forests, fed by the southwest monsoon — a global biodiversity hotspot.", species: ["Malabar Trogon", "Nilgiri Flycatcher", "White-bellied Treepie", "Crimson-backed Sunbird", "Grey-headed Bulbul"], cons: "Home to 16+ endemic bird species under heavy habitat pressure.", endemics: true },
  { name: "Gangetic Plains", bg: "rgba(250,204,21,0.05)", geo: "The vast alluvial plain drained by the Ganges and its tributaries across northern India.", climate: "Wetlands, rivers and intensive agriculture — supports immense waterbird populations.", species: ["Sarus Crane", "Indian Skimmer", "Black-necked Stork", "River Tern", "Pied Kingfisher"], cons: "Wetland conversion threatens the world's tallest flying bird, the Sarus Crane.", endemics: false },
  { name: "Northeastern India", bg: "rgba(168,85,247,0.05)", geo: "The states east of Bhutan — Assam, Arunachal, Nagaland, Manipur, Mizoram and Meghalaya.", climate: "Subtropical evergreen and montane forests at the confluence of Indomalayan and Indo-Chinese biotas.", species: ["Beautiful Nuthatch", "Ward's Trogon", "Rufous-necked Hornbill", "Blyth's Tragopan", "Mrs Hume's Pheasant"], cons: "India's most species-rich region — hosts many globally restricted-range birds.", endemics: true },
  { name: "Deccan Plateau", bg: "rgba(251,146,60,0.05)", geo: "The triangular plateau covering most of peninsular India, south of the Vindhyas.", climate: "Thorn scrub, dry deciduous forest and open grasslands shaped by a long dry season.", species: ["Indian Bustard", "Painted Sandgrouse", "Yellow-wattled Lapwing", "Indian Courser", "Sykes's Lark"], cons: "Grassland birds like the Great Indian Bustard are on the brink of extinction.", endemics: false },
  { name: "Coastal & Islands", bg: "rgba(34,211,238,0.05)", geo: "India's 7,500 km coastline plus the Andaman, Nicobar and Lakshadweep island groups.", climate: "Mangroves, mudflats, estuaries and tropical island forests.", species: ["Andaman Drongo", "Nicobar Pigeon", "Crab Plover", "Indian Skimmer", "Lesser Flamingo"], cons: "Island endemics are vulnerable to invasive species and sea-level rise.", endemics: true },
];

function ZonesSection() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Biogeographic Zones</h2>
          <p className="mt-3 text-muted-foreground">Six worlds within one country</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ZONES.map((z) => (
            <div
              key={z.name}
              className="rounded-lg border border-border p-6 transition-all hover:-translate-y-1"
              style={{ backgroundColor: z.bg }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-2xl text-foreground">{z.name}</h3>
                {z.endemics && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: "rgba(201,168,76,0.18)", color: AMBER }}
                  >
                    Endemics
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-foreground/80">{z.geo}</p>
              <p className="mt-2 text-sm text-muted-foreground">{z.climate}</p>

              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider mb-2" style={{ color: AMBER }}>Characteristic species</div>
                <ul className="space-y-1 text-sm text-foreground/80">
                  {z.species.map((s) => <li key={s}>• {s}</li>)}
                </ul>
              </div>

              <p className="mt-5 text-xs italic" style={{ color: AMBER }}>
                {z.cons}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Section 7 — Seasons Calendar
   ───────────────────────────────────────────── */
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// activity 0..3 mapped per row per month
const SEASON_ROWS: { name: string; species: string; row: number[] }[] = [
  { name: "Resident Birds", species: "House Sparrow, Common Myna, Indian Robin, Purple Sunbird", row: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
  { name: "Winter Migrants", species: "Common Rosefinch, Bluethroat, Rosy Starling, waders & ducks", row: [3, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3, 3] },
  { name: "Summer / Breeding Visitors", species: "Asian Koel, Common Hawk-Cuckoo, Indian Pitta, Blue-tailed Bee-eater", row: [0, 0, 1, 2, 3, 3, 3, 3, 2, 1, 0, 0] },
  { name: "Passage Migrants", species: "Amur Falcon, various warblers, Eurasian Roller", row: [0, 0, 2, 3, 1, 0, 0, 0, 2, 3, 1, 0] },
];

function activityStyle(v: number) {
  if (v === 0) return { backgroundColor: "rgba(255,255,255,0.03)" };
  if (v === 1) return { backgroundColor: "rgba(201,168,76,0.18)" };
  if (v === 2) return { backgroundColor: "rgba(201,168,76,0.45)" };
  return { backgroundColor: "rgba(201,168,76,0.95)" };
}

function SeasonsSection() {
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">When to Watch</h2>
          <p className="mt-3 text-muted-foreground">Bird seasons across the Indian calendar</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 md:p-6 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid" style={{ gridTemplateColumns: "200px repeat(12, 1fr)" }}>
              <div></div>
              {MONTHS.map((m, i) => (
                <div key={i} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
                  {m}
                </div>
              ))}
            </div>
            {/* Rows */}
            {SEASON_ROWS.map((r, ri) => (
              <div key={ri} className="grid items-center" style={{ gridTemplateColumns: "200px repeat(12, 1fr)" }}>
                <div className="py-3 pr-3">
                  <div className="text-sm font-semibold text-foreground">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{r.species}</div>
                </div>
                {r.row.map((v, ci) => (
                  <div key={ci} className="px-0.5 py-1">
                    <div className="h-8 rounded" style={activityStyle(v)} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-3 w-6 rounded" style={activityStyle(0)} />Absent</div>
            <div className="flex items-center gap-2"><div className="h-3 w-6 rounded" style={activityStyle(1)} />Possible</div>
            <div className="flex items-center gap-2"><div className="h-3 w-6 rounded" style={activityStyle(2)} />Present</div>
            <div className="flex items-center gap-2"><div className="h-3 w-6 rounded" style={activityStyle(3)} />Peak</div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <span className="text-foreground font-semibold">Best birding months in India: October to March</span> — when
          winter migrants arrive and resident birds begin breeding activity.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Section 8 — Conservation
   ───────────────────────────────────────────── */
const IUCN = [
  { code: "LC", name: "Least Concern", color: "#16a34a", def: "Widespread and abundant.", count: "~900 Indian species" },
  { code: "NT", name: "Near Threatened", color: "#84cc16", def: "Close to qualifying for a threatened category.", count: "~70 Indian species" },
  { code: "VU", name: "Vulnerable", color: "#eab308", def: "Facing a high risk of extinction in the wild.", count: "~55 Indian species" },
  { code: "EN", name: "Endangered", color: "#f97316", def: "Facing a very high risk of extinction.", count: "~30 Indian species" },
  { code: "CR", name: "Critically Endangered", color: "#dc2626", def: "Facing an extremely high risk of extinction.", count: "~17 Indian species" },
];

const CR_BIRDS = [
  { name: "Great Indian Bustard", pop: "~100 remaining", threat: "Power-line collisions and grassland loss." },
  { name: "Bengal Florican", pop: "~500–600 remaining", threat: "Conversion of tall-grass habitat to farmland." },
  { name: "Jerdon's Courser", pop: "Extremely rare, nocturnal", threat: "Scrub clearance in Andhra Pradesh." },
  { name: "Forest Owlet", pop: "Rediscovered 1997", threat: "Logging of dry deciduous central Indian forests." },
  { name: "Siberian Crane", pop: "Rare winter visitor, near extinct", threat: "Loss of wintering wetlands along the migration route." },
];

function ConservationSection() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">Conservation Status</h2>
          <p className="mt-3 text-muted-foreground">The IUCN Red List, applied to India's avifauna</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-3">
            {IUCN.map((s) => (
              <div key={s.code} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md font-bold text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.code}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.def}</div>
                </div>
                <div className="text-xs font-mono whitespace-nowrap" style={{ color: AMBER }}>{s.count}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-display text-2xl text-foreground mb-4">India's Critically Endangered Birds</h3>
            <div className="space-y-3">
              {CR_BIRDS.map((b) => (
                <div key={b.name} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-semibold text-foreground">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.pop}</div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{b.threat}</p>
                  <a
                    href={`https://en.wikipedia.org/wiki/${encodeURIComponent(b.name.trim().replace(/\s+/g, "_"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium hover:underline"
                    style={{ color: AMBER }}
                  >
                    Wikipedia ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Section 9 — CTA
   ───────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
          See these birds through Gokul's lens
        </h2>
        <p className="mt-4 text-lg text-white/70">
          Browse photographs organised by bird order and family
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/gallery"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: AMBER, color: "#0a0a0a" }}
          >
            Explore the Gallery →
          </Link>
          <Link
            to="/map"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 font-semibold text-white transition-all hover:bg-white/5"
            style={{ borderColor: AMBER }}
          >
            View the World Map →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */
function AboutBirdsPage() {
  return (
    <div>
      <Hero />
      <TaxonomySection />
      <AnatomySection />
      <BessSection />
      <OrdersSection />
      <ZonesSection />
      <SeasonsSection />
      <ConservationSection />
      <CtaSection />
    </div>
  );
}
