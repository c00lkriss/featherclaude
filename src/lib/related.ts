/**
 * Blog <-> bird matching.
 *
 * A photo and a blog post are related ONLY when one of the post's tags is
 * case-insensitively EQUAL (trimmed, whole string) to the photo's
 * common_name or species_name. Never substring matching.
 */

export const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Tags safe to use inside a PostgREST `or(...)` filter (no commas/parens/dots issues). */
export function safeFilterTags(tags: (string | null)[] | null | undefined): string[] {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((t) => (t ?? "").trim())
        .filter((t) => t.length > 0 && !/[,()"']/.test(t)),
    ),
  );
}

export function tagsMatchPhoto(
  tags: (string | null)[] | null | undefined,
  photo: { common_name?: string | null; species_name?: string | null },
): boolean {
  const set = new Set((tags ?? []).map((t) => norm(t)).filter(Boolean));
  if (set.size === 0) return false;
  const common = norm(photo.common_name);
  const sci = norm(photo.species_name);
  return (!!common && set.has(common)) || (!!sci && set.has(sci));
}

export function tagListHas(tags: (string | null)[] | null | undefined, tag: string): boolean {
  const t = norm(tag);
  return (tags ?? []).some((x) => norm(x) === t);
}
