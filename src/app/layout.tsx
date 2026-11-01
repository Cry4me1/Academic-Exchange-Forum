import { Toaster } from "@/components/ui/sonner";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import { I18nProvider } from "@/i18n/context";
import { cookies } from "next/headers";
import type { Locale } from "@/i18n/types";
import "katex/dist/katex.min.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [{ path: "./fonts/GeistVF.woff2", style: "normal" }],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const geistMono = localFont({
  src: [{ path: "./fonts/GeistMonoVF.woff2", style: "normal" }],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  title: "Scholarly - 学术论坛",
  description: "现代化学术交流平台，支持 LaTeX 公式、代码高亮和图表渲染",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie =
    cookieStore.get("NEXT_LOCALE")?.value ||
    cookieStore.get("scholarly_lang")?.value;
  const initialLocale: Locale = localeCookie === "en" ? "en" : "zh";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider initialLocale={initialLocale}>
          {children}
        </I18nProvider>
        <AuthRedirectHandler />
        <Toaster />
      </body>
    </html>
  );
}
