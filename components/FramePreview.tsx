import Image from "next/image";
import type { CSSProperties } from "react";
import burlapLayer from "@/app/sources/layers/ARPILLERA.png";
import whiteLayer from "@/app/sources/layers/BLANCO.png";
import {
  getProductMeasureDimensions,
  type PriceOptionId,
  type Product,
} from "@/data/products";

type FramePreviewProps = {
  product: Pick<Product, "name" | "image" | "measureCode">;
  selectedPriceId?: PriceOptionId;
};

export function FramePreview({ product, selectedPriceId }: FramePreviewProps) {
  const frameLayer = selectedPriceId === "arpillera" ? burlapLayer : whiteLayer;
  const { width, height } = getProductMeasureDimensions(product);
  const aspectRatio = width / height;
  const isPanoramicFrame = aspectRatio > 1.6;
  const isBurlap = selectedPriceId === "arpillera";
  const frameMargin = Math.min(width, height) * 0.095;
  const verticalInset = (frameMargin / height) * 100;
  const horizontalInset = (frameMargin / width) * 100;
  const previewStyle: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
  };
  const panoramicFrameStyle: CSSProperties = {
    backgroundColor: isBurlap ? "#b99b73" : "#c89a6a",
    backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.32), rgba(255,255,255,0) 18%, rgba(0,0,0,.12) 82%, rgba(255,255,255,.18)), url(${frameLayer.src})`,
    backgroundPosition: "center",
    backgroundSize: "100% 100%, 240px auto",
    boxShadow:
      "inset 0 0 0 1px rgba(70,45,22,.2), inset 0 8px 16px rgba(255,255,255,.28), inset 0 -10px 18px rgba(55,32,12,.2)",
  };
  const panoramicMatStyle: CSSProperties = {
    inset: `${verticalInset * 0.5}% ${horizontalInset * 0.55}%`,
    backgroundColor: isBurlap ? "#d4c1a1" : "#eeeae1",
    boxShadow:
      "inset 0 0 0 1px rgba(80,70,55,.12), inset 0 7px 16px rgba(255,255,255,.42), inset 0 -7px 16px rgba(55,43,31,.14)",
  };
  const artAreaStyle: CSSProperties = {
    inset: `${verticalInset}% ${horizontalInset}%`,
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-transparent shadow-sm"
      style={previewStyle}
      aria-label={`Vista previa de ${product.name}`}
      role="img"
    >
      {isPanoramicFrame ? (
        <>
          <div className="absolute inset-0 z-0" style={panoramicFrameStyle} />
          <div className="absolute z-0" style={panoramicMatStyle} />
        </>
      ) : (
        <div className="absolute inset-0 z-0">
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
      )}
      <div
        className={`frame-art absolute z-10 overflow-hidden ${
          isPanoramicFrame
            ? "shadow-[0_5px_14px_rgba(20,20,20,.18)]"
            : "shadow-[0_12px_24px_rgba(20,20,20,.22)]"
        }`}
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
