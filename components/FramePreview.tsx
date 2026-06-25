import Image from "next/image";
import frameTemplate from "@/app/sources/layers/MARCO.png";
import type { Product } from "@/data/products";

type FramePreviewProps = {
  product: Pick<Product, "id" | "name" | "artwork">;
};

type ArtworkTheme = {
  stops: [string, string, string];
  accent: string;
  variant: "abstract" | "botanical" | "urban" | "coast" | "geo" | "floral" | "minimal" | "field";
};

const artworkThemes: Record<string, ArtworkTheme> = {
  "mava-001": {
    stops: ["#efe0c7", "#b9673b", "#263238"],
    accent: "#f2c078",
    variant: "abstract",
  },
  "mava-002": {
    stops: ["#eff6ed", "#8fb996", "#264b3a"],
    accent: "#f7d9a7",
    variant: "botanical",
  },
  "mava-003": {
    stops: ["#e8ecef", "#9ca7ad", "#202733"],
    accent: "#d65f4a",
    variant: "urban",
  },
  "mava-004": {
    stops: ["#d7ecf3", "#87b8c8", "#234b5f"],
    accent: "#f4d35e",
    variant: "coast",
  },
  "mava-005": {
    stops: ["#f7f0ea", "#f28f73", "#3b2f4a"],
    accent: "#2f9c95",
    variant: "geo",
  },
  "mava-006": {
    stops: ["#22302a", "#5d7965", "#e9c46a"],
    accent: "#f4a261",
    variant: "floral",
  },
  "mava-007": {
    stops: ["#f8f4ef", "#dfd8cc", "#111111"],
    accent: "#bb4430",
    variant: "minimal",
  },
  "mava-008": {
    stops: ["#cde7e3", "#6a994e", "#6b4f3f"],
    accent: "#bc4749",
    variant: "field",
  },
};

export function FramePreview({ product }: FramePreviewProps) {
  return (
    <div
      className="relative aspect-3/4 w-full overflow-hidden bg-transparent shadow-sm"
      aria-label={`Vista previa de ${product.name}`}
      role="img"
    >
      <Image
        src={frameTemplate}
        alt=""
        fill
        sizes="(min-width: 1280px) 280px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        aria-hidden="true"
        priority
      />
      <div className="frame-art absolute z-10 overflow-hidden shadow-[0_12px_24px_rgba(20,20,20,.22)]">
        <ArtworkSvg product={product} />
      </div>
    </div>
  );
}

function ArtworkSvg({ product }: FramePreviewProps) {
  const theme =
    artworkThemes[product.id] ??
    ({
      stops: ["#f7f0ea", "#c8aa7a", "#263238"],
      accent: product.artwork.accent,
      variant: "abstract",
    } satisfies ArtworkTheme);
  const gradientId = `${product.id}-gradient`;

  return (
    <svg
      viewBox="0 0 400 520"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={theme.stops[0]} />
          <stop offset="48%" stopColor={theme.stops[1]} />
          <stop offset="100%" stopColor={theme.stops[2]} />
        </linearGradient>
      </defs>
      <rect width="400" height="520" fill={`url(#${gradientId})`} />
      <ArtworkMotif theme={theme} />
      <rect x="28" y="476" width="68" height="10" fill={theme.accent} />
    </svg>
  );
}

type ArtworkMotifProps = {
  theme: ArtworkTheme;
};

function ArtworkMotif({ theme }: ArtworkMotifProps) {
  switch (theme.variant) {
    case "botanical":
      return (
        <>
          <ellipse cx="130" cy="315" rx="72" ry="42" fill="#ffffff" opacity="0.52" />
          <ellipse cx="282" cy="150" rx="58" ry="94" fill="#083024" opacity="0.34" />
          <path d="M80 430 C155 330 205 230 320 80" fill="none" stroke={theme.accent} strokeWidth="10" opacity="0.78" />
        </>
      );
    case "urban":
      return (
        <>
          <rect x="76" y="0" width="18" height="520" fill="#ffffff" opacity="0.52" />
          <rect x="0" y="290" width="400" height="34" fill={theme.accent} opacity="0.72" />
          <rect x="250" y="72" width="84" height="322" fill="#111827" opacity="0.28" />
        </>
      );
    case "coast":
      return (
        <>
          <circle cx="292" cy="114" r="38" fill={theme.accent} opacity="0.82" />
          <path d="M0 390 C95 350 178 432 274 382 C318 360 358 350 400 366 L400 520 L0 520 Z" fill="#ffffff" opacity="0.34" />
          <path d="M0 424 C96 390 180 468 286 414 C330 392 370 388 400 402" fill="none" stroke="#ffffff" strokeWidth="12" opacity="0.46" />
        </>
      );
    case "geo":
      return (
        <>
          <path d="M0 0 L210 0 L0 268 Z" fill="#ffffff" opacity="0.48" />
          <path d="M400 80 L400 360 L150 360 Z" fill={theme.accent} opacity="0.72" />
          <circle cx="158" cy="250" r="88" fill="#3b2f4a" opacity="0.38" />
        </>
      );
    case "floral":
      return (
        <>
          <circle cx="145" cy="190" r="42" fill={theme.accent} opacity="0.76" />
          <circle cx="220" cy="260" r="56" fill="#ffffff" opacity="0.48" />
          <circle cx="286" cy="172" r="66" fill="#22302a" opacity="0.42" />
          <path d="M90 420 C135 320 235 300 310 112" fill="none" stroke="#ffffff" strokeWidth="8" opacity="0.38" />
        </>
      );
    case "minimal":
      return (
        <>
          <circle cx="116" cy="170" r="24" fill="#111111" opacity="0.82" />
          <path d="M238 0 L400 0 L400 520 L312 520 Z" fill="#111111" opacity="0.88" />
          <path d="M0 390 L400 120" fill="none" stroke={theme.accent} strokeWidth="24" opacity="0.78" />
        </>
      );
    case "field":
      return (
        <>
          <path d="M0 290 C120 250 220 310 400 235 L400 520 L0 520 Z" fill="#6a994e" opacity="0.76" />
          <path d="M0 340 C120 300 230 370 400 300 L400 520 L0 520 Z" fill="#6b4f3f" opacity="0.72" />
          <circle cx="88" cy="118" r="34" fill="#ffffff" opacity="0.58" />
          <path d="M0 308 L400 104" fill="none" stroke={theme.accent} strokeWidth="18" opacity="0.7" />
        </>
      );
    case "abstract":
    default:
      return (
        <>
          <circle cx="96" cy="138" r="46" fill="#ffffff" opacity="0.62" />
          <circle cx="292" cy="374" r="76" fill="#171717" opacity="0.28" />
          <path d="M0 368 C82 312 148 470 230 406 C298 354 336 258 400 286 L400 520 L0 520 Z" fill={theme.accent} opacity="0.38" />
        </>
      );
  }
}
