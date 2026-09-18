import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useSiteSettings } from "@/lib/site-settings";


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
      { title: "Coolkriss — Birds of India" },
      { name: "description", content: "Fine-art bird photography from across the Indian subcontinent." },
      { name: "author", content: "Coolkriss" },
      { name: "google-site-verification", content: "MimQJxeKYRmEOpiEpYuSfDiPm8HrTCGAsT2B709IHWA" },
      { property: "og:title", content: "Coolkriss — Birds of India" },
      { property: "og:description", content: "Fine-art bird photography from across the Indian subcontinent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@coolkriss" },
      { name: "twitter:title", content: "Coolkriss — Birds of India" },
      { name: "twitter:description", content: "Fine-art bird photography from across the Indian subcontinent." },
      { property: "og:image", content: "https://coolkriss.in/og-default.jpg" },
      { name: "twitter:image", content: "https://coolkriss.in/og-default.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill='%23c9a84c' d='M4 18c2-6 8-10 14-8 4 1 6 4 8 7l4-1-2 3 3 2-5 1c-1 3-4 5-8 5-7 0-12-4-14-9z'/><circle cx='22' cy='13' r='1.2' fill='%23111'/></svg>",
        type: "image/svg+xml",
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
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
        <MobileBottomNav />
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

const NAV_LINKS = [
  { to: "/gallery", label: "Gallery" },
  { to: "/map", label: "Map" },
  { to: "/blog", label: "Blog" },
  { to: "/about-birds", label: "Birds of India" },
  { to: "/about", label: "About" },
] as const;

function Header() {
  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url || "";
  const [logoFailed, setLogoFailed] = useState(false);

  // Apply favicon override from site_settings when present
  useEffect(() => {
    if (typeof document === "undefined") return;
    const fav = settings?.favicon_url;
    if (!fav) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = fav;
  }, [settings?.favicon_url]);

  // Lock body scroll while mobile menu open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt="Coolkriss"
              onError={() => setLogoFailed(true)}
              className="h-10 w-auto object-contain md:h-12"
            />
          ) : (
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Coolkriss
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile navigation lives in the bottom bar */}
      </div>
    </header>
  );
}


const BOTTOM_NAV = [
  { to: "/", icon: "home", label: "Home" },
  { to: "/gallery", icon: "grid", label: "Gallery" },
  { to: "/map", icon: "map", label: "Map" },
  { to: "/blog", icon: "book", label: "Blog" },
  { to: "/about", icon: "user", label: "About" },
] as const;

function NavIcon({ icon }: { icon: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (icon === "home")
    return (
      <svg {...common}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  if (icon === "grid")
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    );
  if (icon === "map")
    return (
      <svg {...common}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    );
  if (icon === "book")
    return (
      <svg {...common}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MobileBottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border/40 bg-background/95 px-2 pb-1 pt-2 backdrop-blur-xl md:hidden">
      {BOTTOM_NAV.map(({ to, icon, label }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "text-primary" }}
          inactiveProps={{ className: "text-muted-foreground" }}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors"
        >
          <NavIcon icon={icon} />
          <span className="text-[9px] font-medium uppercase tracking-[0.15em]">{label}</span>
        </Link>
      ))}
    </nav>
  );
}


function Footer() {
  const socialCls =
    "transition-all duration-200 hover:scale-110 hover:brightness-125";
  return (
    <footer className="w-full border-t border-border/40 bg-surface">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
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
            <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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
