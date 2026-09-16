import type { Metadata } from "next";
import { CatalogClient } from "@/components/CatalogClient";

const title = "Catalogo minorista | Mava Cuadros";
const description =
  "Cuadros impresos en tela y montados sobre bastidor. Consulta los modelos, medidas y opciones disponibles para tu hogar.";

export const metadata: Metadata = {
  title: "Catalogo minorista",
  description,
  alternates: { canonical: "/minorista" },
  openGraph: {
    title,
    description,
    url: "/minorista",
    siteName: "Mava Cuadros",
    locale: "es_AR",
    type: "website",
    images: [
      { url: "/mava-social.png", width: 1200, height: 630, alt: "Mava Cuadros" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/mava-social.png"],
  },
};

export default function RetailHome() {
  return <CatalogClient priceList="minorista" />;
}
