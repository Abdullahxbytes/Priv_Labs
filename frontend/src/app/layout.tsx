import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/material-symbols-rounded/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Priv Lab — Know Before You Install", template: "%s | Priv Lab" },
  description: "Understand Android app permissions, privacy disclosures, and supporting evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
