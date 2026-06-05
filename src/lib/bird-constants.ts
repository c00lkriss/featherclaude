export const BIRD_ORDERS = [
  "Passeriformes", "Columbiformes", "Accipitriformes", "Falconiformes",
  "Strigiformes", "Coraciiformes", "Piciformes", "Cuculiformes",
  "Psittaciformes", "Galliformes", "Gruiformes", "Charadriiformes",
  "Pelecaniformes", "Ciconiiformes", "Anseriformes", "Apodiformes",
  "Bucerotiformes", "Suliformes", "Phoenicopteriformes", "Podicipediformes",
  "Caprimulgiformes", "Trogoniformes", "Upupiformes", "Procellariiformes",
];

export const FAMILIES_BY_ORDER: Record<string, string[]> = {
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

export const IUCN_OPTIONS = [
  "Least Concern",
  "Near Threatened",
  "Vulnerable",
  "Endangered",
  "Critically Endangered",
  "Data Deficient",
  "Not Evaluated",
];

export const MAX_FEATURED = 5;

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export const formatShutter = (t: number | undefined | null): string => {
  if (t == null) return "";
  if (t >= 1) return `${t}s`;
  return `1/${Math.round(1 / t)}`;
};

// Downscale an image File to a JPEG data URL with max edge (default 1024 px)
// for sending to the vision model. Keeps payload well under serverFn limits.
export async function fileToDownscaledDataURL(file: File, maxEdge = 1024, quality = 0.85): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
