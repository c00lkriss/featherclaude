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

type Mode = "signin" | "signup";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState<boolean>(false);

  // Redirect away if already signed in as admin; detect if any admin exists.
  useEffect(() => {
    (async () => {
      console.log("[admin] checking existing session…");
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        console.log("[admin] existing user:", userData.user.id);
        const { data: ok } = await supabase.rpc("bootstrap_admin");
        if (ok) {
          navigate({ to: "/admin/dashboard", replace: true });
          return;
        }
      }
      // Check if any admin role exists (publicly readable: no, but count via signed-out
      // we can't read user_roles. So we infer from a flag: try to call bootstrap_admin
      // only after sign-in. For now assume signup is allowed; we'll hide it after success.)
      setChecking(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        console.log("[admin] signing up:", email);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (signUpError) {
          console.error("[admin] signUp error:", signUpError);
          throw signUpError;
        }
        console.log("[admin] signUp result:", { user: data.user?.id, session: !!data.session });

        if (data.session) {
          // Auto-confirm enabled → session present. Trigger has already created
          // profile + admin role for the first user.
          console.log("[admin] session present, verifying admin role…");
          const { data: ok, error: rpcErr } = await supabase.rpc("bootstrap_admin");
          if (rpcErr) {
            console.error("[admin] bootstrap_admin error:", rpcErr);
            throw rpcErr;
          }
          if (!ok) {
            await supabase.auth.signOut();
            throw new Error("This account is not authorized for admin access.");
          }
          console.log("[admin] redirecting to dashboard");
          setAdminExists(true);
          navigate({ to: "/admin/dashboard", replace: true });
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        console.log("[admin] signing in:", email);
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          console.error("[admin] signIn error:", signInError);
          throw signInError;
        }

        console.log("[admin] sign-in success, checking admin role…");
        const { data: ok, error: rpcErr } = await supabase.rpc("bootstrap_admin");
        if (rpcErr) throw rpcErr;
        if (!ok) {
          await supabase.auth.signOut();
          throw new Error("This account is not authorized for admin access.");
        }
        console.log("[admin] redirecting to dashboard");
        navigate({ to: "/admin/dashboard", replace: true });
      }
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
          {error && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-sm border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
              {info}
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
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Admin Account"}
          </button>

          {mode === "signin" && adminExists === false && (
            <p className="text-center text-xs font-light text-muted-foreground">
              No admin yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
                className="text-primary hover:underline"
              >
                Create the admin account
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-center text-xs font-light text-muted-foreground">
              Already set up?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
