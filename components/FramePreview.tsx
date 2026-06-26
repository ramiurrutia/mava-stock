import Image from "next/image";
import type { CSSProperties } from "react";
import burlapLayer from "@/app/sources/layers/ARPILLERA.png";
import whiteLayer from "@/app/sources/layers/BLANCO.png";
import type { PriceOptionId, Product } from "@/data/products";

type FramePreviewProps = {
  product: Pick<Product, "name" | "image">;
  selectedPriceId?: PriceOptionId;
};

export function FramePreview({ product, selectedPriceId }: FramePreviewProps) {
  const frameLayer = selectedPriceId === "arpillera" ? burlapLayer : whiteLayer;
  const isLandscapeArtwork = product.image.width > product.image.height * 1.1;
  const rotatedFrameStyle: CSSProperties = {
    height: "140.8%",
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%) rotate(90deg)",
    width: "71.1%",
  };
  const artAreaStyle: CSSProperties = {
    inset: isLandscapeArtwork ? "8% 10%" : "10% 8%",
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-transparent shadow-sm ${
        isLandscapeArtwork ? "aspect-[2540/1805]" : "aspect-[1805/2540]"
      }`}
      aria-label={`Vista previa de ${product.name}`}
      role="img"
    >
      <div
        className={isLandscapeArtwork ? undefined : "absolute inset-0 z-0"}
        style={isLandscapeArtwork ? rotatedFrameStyle : undefined}
      >
        <Image
          src={frameLayer}
          alt=""
          fill
          sizes="(min-width: 1280px) 280px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-fill"
          aria-hidden="true"
          priority
        />
      </div>
      <div
        className="frame-art absolute z-10 overflow-hidden shadow-[0_12px_24px_rgba(20,20,20,.22)]"
        style={artAreaStyle}
      >
        <Image
          src={product.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 220px, (min-width: 1024px) 25vw, (min-width: 640px) 38vw, 76vw"
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
