import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Coolkriss" },
      { name: "description", content: "Manage photos, blog posts, and content." },
      { property: "og:title", content: "Admin Dashboard — Coolkriss" },
      { property: "og:description", content: "Manage photos, blog posts, and content." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold text-foreground">
        Admin Dashboard
      </h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/upload"
          className="group rounded-lg border border-border bg-surface p-8 transition-colors hover:border-primary/50"
        >
          <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary">
            Upload Photo
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add new bird photographs to the gallery.
          </p>
        </Link>
        <Link
          to="/admin/blog"
          className="group rounded-lg border border-border bg-surface p-8 transition-colors hover:border-primary/50"
        >
          <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary">
            Blog Posts
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage blog articles.
          </p>
        </Link>
      </div>
    </div>
  );
}
