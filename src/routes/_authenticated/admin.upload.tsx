import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/upload")({
  head: () => ({
    meta: [
      { title: "Upload Photo — Coolkriss Admin" },
      { name: "description", content: "Upload new bird photographs." },
      { property: "og:title", content: "Upload Photo — Coolkriss Admin" },
      { property: "og:description", content: "Upload new bird photographs." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">
        Upload Photo
      </h1>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-muted-foreground">Photo upload form will appear here.</p>
      </div>
    </div>
  );
}
