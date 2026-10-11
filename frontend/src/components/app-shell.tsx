import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand-link" aria-label="Priv Lab home">
            <Image
              className="header-logo"
              src="/privlab-logo.png"
              alt=""
              width={80}
              height={80}
              priority
            />
          </Link>
          <Link className="header-action" href="/#app-search">
            Check an app
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="site-main">
        {children}
      </main>
      <footer className="site-footer">
        <div>
          <Image
            className="footer-logo"
            src="/privlab-logo.png"
            alt="Priv Lab"
            width={80}
            height={80}
          />
          <p>
            Disclosures describe stated practices, not observed app behavior. AI can make mistakes.
            Reports are informational, not legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
