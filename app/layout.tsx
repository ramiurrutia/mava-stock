import type { Metadata } from "next";
import "./globals.css";

const siteTitle = "Mava Cuadros | Catalogo de cuadros";
const siteDescription =
  "Catalogo de cuadros decorativos en stock, impresos en tela y montados sobre bastidor. Elegi el tamano, revisa las opciones disponibles y arma tu pedido por WhatsApp.";
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
const socialImage = {
  url: "/mava-social.png",
  width: 1200,
  height: 630,
  alt: "Mava Cuadros",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Mava Cuadros",
  },
  description: siteDescription,
  applicationName: "Mava Cuadros",
  icons: {
    icon: "/mava-logo.png",
    apple: "/mava-logo.png",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "Mava Cuadros",
    images: [socialImage],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImage.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
