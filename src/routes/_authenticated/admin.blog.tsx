import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sizedImage } from "@/lib/image-url";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({
    meta: [
      { title: "Manage Blog — Coolkriss Admin" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Create and manage blog posts." },
      { property: "og:title", content: "Manage Blog — Coolkriss Admin" },
      { property: "og:description", content: "Create and manage blog posts." },
    ],
  }),
  component: AdminBlogPage,
});

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  published: boolean | null;
  created_at: string | null;
};

type Draft = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  tags: string;
  content: string;
  cover_image_url: string;
  published: boolean;
};

const emptyDraft: Draft = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  tags: "",
  content: "",
  cover_image_url: "",
  published: false,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

async function uploadToSiteAssets(file: File, folder: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
}

const inputCls =
  "mt-2 w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none";
const labelCls =
  "block text-xs font-light uppercase tracking-[0.25em] text-muted-foreground";

function AdminBlogPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    qc.invalidateQueries({ queryKey: ["blog-posts"] });
    qc.invalidateQueries({ queryKey: ["latest-blog"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        title: d.title.trim(),
        slug: (d.slug.trim() || slugify(d.title)).trim(),
        excerpt: d.excerpt.trim() || null,
        content: d.content,
        cover_image_url: d.cover_image_url.trim() || null,
        tags: d.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        published: d.published,
      };
      if (!payload.title) throw new Error("Title is required");
      if (!payload.slug) throw new Error("Slug is required");
      if (d.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Post saved");
      invalidate();
      setDraft(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  const startEdit = (p: Post) => {
    setSlugTouched(true);
    setDraft({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? "",
      tags: (p.tags ?? []).join(", "),
      content: p.content ?? "",
      cover_image_url: p.cover_image_url ?? "",
      published: !!p.published,
    });
  };

  const insertInlineImage = async (file: File) => {
    if (!draft) return;
    setUploadingInline(true);
    try {
      const url = await uploadToSiteAssets(file, "blog");
      const md = `\n\n![](${url})\n\n`;
      const el = contentRef.current;
      const pos = el ? el.selectionStart : draft.content.length;
      const next = draft.content.slice(0, pos) + md + draft.content.slice(pos);
      setDraft({ ...draft, content: next });
      toast.success("Image inserted into content");
      requestAnimationFrame(() => {
        if (el) {
          el.focus();
          const caret = pos + md.length;
          el.setSelectionRange(caret, caret);
        }
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploadingInline(false);
    }
  };

  const uploadCover = async (file: File) => {
    if (!draft) return;
    setUploadingCover(true);
    try {
      const url = await uploadToSiteAssets(file, "blog/covers");
      setDraft({ ...draft, cover_image_url: url });
      toast.success("Cover uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Manage Blog Posts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Write, edit, and publish field notes.</p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => {
              setSlugTouched(false);
              setDraft({ ...emptyDraft });
            }}
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary"
          >
            <Plus className="h-4 w-4" /> New post
          </button>
        )}
      </div>

      {draft && (
        <section className="mt-8 rounded-sm border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-foreground">
              {draft.id ? "Edit post" : "New post"}
            </h2>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className={labelCls}>Title</label>
              <input
                className={inputCls}
                value={draft.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    title: e.target.value,
                    slug: slugTouched ? draft.slug : slugify(e.target.value),
                  })
                }
                placeholder="The Last Bustard of Rollapadu"
              />
            </div>

            <div>
              <label className={labelCls}>Slug</label>
              <input
                className={inputCls}
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setDraft({ ...draft, slug: e.target.value });
                }}
                placeholder="the-last-bustard-of-rollapadu"
              />
            </div>

            <div>
              <label className={labelCls}>Excerpt</label>
              <textarea
                className={inputCls}
                rows={3}
                value={draft.excerpt}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                placeholder="A one or two line summary used on cards and social previews."
              />
            </div>

            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input
                className={inputCls}
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                placeholder="Conservation, Field Notes"
              />
            </div>

            <div>
              <label className={labelCls}>Cover image</label>
              <div className="mt-2 flex items-start gap-4">
                <div className="flex h-28 w-44 items-center justify-center rounded-sm border border-dashed border-border bg-background">
                  {draft.cover_image_url ? (
                    <img
                      src={sizedImage(draft.cover_image_url, { width: 400, quality: 70 })}
                      alt="Cover"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No cover</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCover(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-primary bg-primary/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
                  >
                    {uploadingCover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploadingCover ? "Uploading…" : "Upload cover"}
                  </button>
                  {draft.cover_image_url && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, cover_image_url: "" })}
                      className="rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Content (Markdown)</label>
                <input
                  ref={inlineInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) insertInlineImage(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingInline}
                  onClick={() => inlineInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-widest text-foreground hover:border-primary disabled:opacity-50"
                >
                  {uploadingInline ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                  {uploadingInline ? "Uploading…" : "Upload inline image"}
                </button>
              </div>
              <textarea
                ref={contentRef}
                className={`${inputCls} font-mono text-[13px] leading-relaxed`}
                rows={22}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="## Heading&#10;&#10;Write your story in Markdown…"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Place the cursor where you want a photo, then click “Upload inline image”.
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Published
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate(draft)}
                className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/90 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary disabled:opacity-50"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save post
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-sm border border-border px-5 py-2.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-foreground">All posts</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : !posts || posts.length === 0 ? (
          <div className="mt-4 rounded-sm border border-dashed border-border bg-surface/50 p-10 text-center text-sm text-muted-foreground">
            No posts yet.
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-sm border border-border bg-surface">
            {posts.map((p) => (
              <li key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
                  {p.cover_image_url ? (
                    <img
                      src={sizedImage(p.cover_image_url, { width: 200, quality: 60 })}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base text-foreground">{p.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                    <span
                      className={
                        p.published
                          ? "rounded-sm border border-primary px-2 py-0.5 text-primary"
                          : "rounded-sm border border-border px-2 py-0.5"
                      }
                    >
                      {p.published ? "Published" : "Draft"}
                    </span>
                    <span>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                    <span className="truncate">/{p.slug}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-widest text-foreground hover:border-primary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete “${p.title}”? This cannot be undone.`)) remove.mutate(p.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-[11px] uppercase tracking-widest text-destructive hover:border-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
