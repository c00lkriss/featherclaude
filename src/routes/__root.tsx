import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-amber-dim"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-amber-dim"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Coolkriss — Bird Photography" },
      { name: "description", content: "Award-winning bird photography from India. Explore the beauty of avian life through stunning visual stories." },
      { name: "author", content: "Coolkriss" },
      { property: "og:title", content: "Coolkriss — Bird Photography" },
      { property: "og:description", content: "Award-winning bird photography from India. Explore the beauty of avian life through stunning visual stories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@coolkriss" },
      { name: "twitter:title", content: "Coolkriss — Bird Photography" },
      { name: "twitter:description", content: "Award-winning bird photography from India. Explore the beauty of avian life through stunning visual stories." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b64b28a9-453e-4fd3-beef-c8bd7fcf71d1/id-preview-50093d66--781b122a-b790-48fd-98fd-48a86aaa954e.lovable.app-1780496959354.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b64b28a9-453e-4fd3-beef-c8bd7fcf71d1/id-preview-50093d66--781b122a-b790-48fd-98fd-48a86aaa954e.lovable.app-1780496959354.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Admin subdomain hard-redirect: admin.coolkriss.in/ → /admin
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hostname, pathname, search, hash } = window.location;
    if (hostname === "admin.coolkriss.in" && !pathname.startsWith("/admin")) {
      window.location.replace("/admin" + search + hash);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Coolkriss
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/gallery"
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="text-sm font-medium transition-colors"
          >
            Gallery
          </Link>
          <Link
            to="/map"
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="text-sm font-medium transition-colors"
          >
            Map
          </Link>
          <Link
            to="/blog"
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="text-sm font-medium transition-colors"
          >
            Blog
          </Link>
          <Link
            to="/about-birds"
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="text-sm font-medium transition-colors"
          >
            Birds of India
          </Link>
          <Link
            to="/about-birds"
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="text-sm font-medium transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}


function Footer() {
  const socialCls =
    "transition-all duration-200 hover:scale-110 hover:brightness-125";
  return (
    <footer className="w-full border-t border-border/40 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-display text-lg font-semibold text-foreground">
            Coolkriss
          </span>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Coolkriss Bird Photography. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/gallery" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Gallery
            </Link>
            <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Blog
            </Link>
            <Link to="/about-birds" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              About
            </Link>
            <a
              href="mailto:hello@coolkriss.in"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              hello@coolkriss.in
            </a>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/coolkriss/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ color: "#c9a84c" }}
                className={socialCls}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a
                href="https://www.youtube.com/@CoolKrissGokul"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                style={{ color: "#c9a84c" }}
                className={socialCls}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
