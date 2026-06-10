/**
 * Attempts to extract a species name from a photo filename.
 * Returns title-cased name, or null if nothing meaningful remains.
 */
export function parseSpeciesFromFilename(filename: string): string | null {
  if (!filename) return null;
  let name = filename;

  // Strip extension
  name = name.replace(/\.(jpe?g|png|webp|raw|nef|cr2|arw|tif?f|heic)$/i, "");

  // Camera/file prefixes & suffixes
  name = name.replace(/\b(_?DSC[_-]?\d*|DSC_?\d*|IMG[_-]?\d*|_MG_?\d*|DJI[_-]?\d*|GOPR\d*|GH\d+|P\d{7,})\b/gi, " ");

  // Dates
  name = name.replace(/\b(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{8})\b/g, " ");

  // Common prefixes
  name = name.replace(/\b(edited|crop|cropped|final|best|select|selected|raw|copy)[_-\s]*/gi, " ");

  // Parenthetical numbers and trailing counters
  name = name.replace(/\([\d\s]+\)/g, " ");
  name = name.replace(/[_-]\d+$/g, " ");
  name = name.replace(/\s+\d+$/g, " ");

  // Replace separators with spaces
  name = name.replace(/[_.\-]+/g, " ");

  // Remove stray digits and extra junk tokens
  const tokens = name
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => !/^\d+$/.test(t))
    .filter((t) => !/^(male|female|juv|juvenile|adult|breeding|nonbreeding|imm|immature)$/i.test(t));

  if (tokens.length === 0) return null;
  // Require at least one alphabetic token of >=3 chars
  if (!tokens.some((t) => /^[a-zA-Z]{3,}$/.test(t))) return null;

  const titled = tokens
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(" ");

  // Reject single-word generic words
  if (/^(Bird|Photo|Image|Untitled)$/i.test(titled)) return null;

  return titled;
}
