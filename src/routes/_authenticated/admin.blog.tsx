import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({
    meta: [
      { title: "Manage Blog — Coolkriss Admin" },
      { name: "description", content: "Create and manage blog posts." },
      { property: "og:title", content: "Manage Blog — Coolkriss Admin" },
      { property: "og:description", content: "Create and manage blog posts." },
    ],
  }),
  component: AdminBlogPage,
});

function AdminBlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">
        Manage Blog Posts
      </h1>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Blog post editor will appear here.</p>
      </div>
    </div>
  );
}
