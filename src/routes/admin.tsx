import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Coolkriss" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: ok } = await supabase.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin",
        });
        if (ok) {
          navigate({ to: "/admin/dashboard", replace: true });
          return;
        }
      }
      setChecking(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const { data: signedIn } = await supabase.auth.getUser();
      const { data: ok, error: rpcErr } = await supabase.rpc("has_role", {
        _user_id: signedIn.user!.id,
        _role: "admin",
      });
      if (rpcErr) throw rpcErr;
      if (!ok) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for admin access.");
      }
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err: any) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm font-light text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">Admin</p>
          <h1 className="font-display text-4xl font-semibold text-foreground">Sign In</h1>
          <p className="mt-3 text-sm font-light text-muted-foreground">
            Manage photographs and field notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-light uppercase tracking-[0.25em] text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-none border border-primary bg-primary/90 px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
