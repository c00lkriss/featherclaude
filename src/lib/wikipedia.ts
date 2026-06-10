export function getWikipediaUrl(commonName: string): string {
  return `https://en.wikipedia.org/wiki/${commonName.trim().replace(/\s+/g, "_")}`;
}
