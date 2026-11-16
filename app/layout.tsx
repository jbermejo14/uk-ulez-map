import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://ukcleanzone.co.uk"),
  title: {
    default: "UKCleanZone | UK Clean Air Zones, London ULEZ Map & Reg Checker (2026)",
    template: "%s | UKCleanZone",
  },
  description:
    "Instant UK registration number plate checker and interactive map for London ULEZ, Congestion Charge, Scottish LEZs, and all 14 UK Clean Air Zones. Avoid £180 fines.",
  keywords: [
    "UK ULEZ checker",
    "London ULEZ map",
    "Clean air zone checker",
    "Birmingham clean air zone",
    "Bristol CAZ map",
    "Glasgow LEZ fines",
    "Edinburgh LEZ compliance",
    "Euro 6 diesel ULEZ",
    "UK number plate emission checker",
  ],
  authors: [{ name: "UKCleanZone Technical Team" }],
  creator: "UKCleanZone",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ukcleanzone.co.uk",
    title: "UKCleanZone | UK Clean Air Zones, London ULEZ Map & Reg Checker (2026)",
    description:
      "Check your UK registration plate against all 14 active Clean Air, ULEZ, and LEZ zones. View boundary maps, daily charges, hours, and penalty fines.",
    siteName: "UKCleanZone",
  },
  twitter: {
    card: "summary_large_image",
    title: "UKCleanZone | UK ULEZ & Clean Air Zone Map Checker",
    description: "Check your car registration plate against London ULEZ, Scottish LEZs, and English Clean Air Zones.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://ukcleanzone.co.uk/#website",
        "url": "https://ukcleanzone.co.uk",
        "name": "UKCleanZone",
        "description": "UK Clean Air Zones, ULEZ Map and Vehicle Compliance Checker",
        "inLanguage": "en-GB",
      },
      {
        "@type": "SoftwareApplication",
        "name": "UKCleanZone Vehicle Compliance Checker",
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "GBP",
        },
        "description": "Check UK vehicle registration compliance with ULEZ, Clean Air Zones, and Scottish LEZ standards.",
      },
    ],
  };

  return (
    <html lang="en-GB" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-zinc-900 dark:bg-[#0A0A0A] dark:text-zinc-100 transition-colors`}>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
