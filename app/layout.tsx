import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4b0014",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fashiondate.com.br"),
  title: "Fashion Date — Sorteio Provador Fashion 2026",
  description:
    "Participe do sorteio exclusivo Provador Fashion no Fashion Date Crente Chic by Renata Castanheira. Cadastre sua loja e receba seu número da sorte.",
  applicationName: "Fashion Date",
  authors: [{ name: "Fashion Date Crente Chic" }],
  keywords: [
    "Fashion Date",
    "Crente Chic",
    "Renata Castanheira",
    "Provador Fashion",
    "Sorteio de Moda",
    "Lojistas",
    "Moda Evangélica",
  ],
  alternates: {
    canonical: "https://fashiondate.com.br/",
  },
  openGraph: {
    title: "Fashion Date — Sorteio Provador Fashion 2026",
    description:
      "Participe do sorteio exclusivo Provador Fashion no Fashion Date Crente Chic by Renata Castanheira. Cadastre sua loja e receba seu número da sorte.",
    url: "https://fashiondate.com.br/",
    siteName: "Fashion Date",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/fashiondate-logo.png",
        width: 1200,
        height: 630,
        alt: "Fashion Date Crente Chic by Renata Castanheira",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion Date — Sorteio Provador Fashion 2026",
    description:
      "Participe do sorteio exclusivo Provador Fashion no Fashion Date Crente Chic by Renata Castanheira.",
    images: ["/fashiondate-logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://fashiondate.com.br/#website",
      "url": "https://fashiondate.com.br/",
      "name": "Fashion Date",
      "description":
        "Plataforma oficial do Fashion Date Crente Chic para cadastro de lojistas e sorteio Provador Fashion.",
      "inLanguage": "pt-BR",
    },
    {
      "@type": "Event",
      "@id": "https://fashiondate.com.br/#event",
      "name": "Fashion Date Crente Chic 2026 - 7ª Edição",
      "description":
        "Maior evento de moda evangélica da América Latina, com sorteio exclusivo Provador Fashion por Renata Castanheira.",
      "startDate": "2026-09-01T18:00:00-03:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Fashion Date 2026",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "BR",
        },
      },
      "organizer": {
        "@type": "Organization",
        "name": "Fashion Date Crente Chic by Renata Castanheira",
        "url": "https://fashiondate.com.br/",
        "logo": "https://fashiondate.com.br/fashiondate-logo.png",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,600;0,6..96,700;0,6..96,800;0,6..96,900;1,6..96,600;1,6..96,700&family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;0,900;1,500;1,600;1,700;1,800&family=Playfair+Display+SC:wght@700;800;900&family=Cormorant+Garamond:wght@700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
