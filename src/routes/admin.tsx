import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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

type Mode = "signin" | "signup";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If already signed in as admin, jump straight to dashboard
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: ok } = await supabase.rpc("bootstrap_admin");
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
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: ok, error: rpcErr } = await supabase.rpc("bootstrap_admin");
        if (rpcErr) throw rpcErr;
        if (!ok) {
          await supabase.auth.signOut();
          throw new Error("This account is not authorized for admin access.");
        }

        toast.success("Welcome back.");
        navigate({ to: "/admin/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
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
          <p className="mb-3 text-xs font-light uppercase tracking-[0.3em] text-primary">
            Admin
          </p>
          <h1 className="font-display text-4xl font-semibold text-foreground">
            {mode === "signin" ? "Sign In" : "Create Admin"}
          </h1>
          <p className="mt-3 text-sm font-light text-muted-foreground">
            {mode === "signin"
              ? "Manage photographs and field notes."
              : "The first registered user becomes the site administrator."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-xs font-light text-muted-foreground">
            {mode === "signin" ? "Need to set up the admin account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:underline"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
