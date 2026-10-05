import type { Metadata, Viewport } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter-var",
  subsets: ["latin"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alsswabi.edu.pk"),
  title: {
    default: "American Lycetuff Swabi Campus | Learn, Grow & Shine",
    template: "%s | American Lycetuff Swabi",
  },
  description:
    "American Lycetuff DNK STEM School, Swabi Campus. Play Group through SSC and Cambridge, STEM and robotics labs, and admissions open for 2026–27.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a2d59",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${openSans.variable} antialiased`} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) add attributes to <html>/<body> before React loads */}
      <body className="flex min-h-screen flex-col overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
