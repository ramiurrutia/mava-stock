import Image from "next/image";
import type { CSSProperties } from "react";
import burlapLayer from "@/app/sources/layers/ARPILLERA.png";
import whiteLayer from "@/app/sources/layers/BLANCO.png";
import {
  getProductPreviewDimensions,
  type PriceOptionId,
  type Product,
} from "@/data/products";

type FramePreviewProps = {
  product: Pick<Product, "code" | "image" | "measureCode">;
  selectedPriceId?: PriceOptionId;
};

export function FramePreview({ product, selectedPriceId }: FramePreviewProps) {
  const frameLayer = selectedPriceId === "arpillera" ? burlapLayer : whiteLayer;
  const { width, height } = getProductPreviewDimensions(product);
  const aspectRatio = width / height;
  const isPanoramicFrame = aspectRatio > 1.6;
  const useWarmFrame = selectedPriceId !== "blanco";
  const frameMargin = Math.min(width, height) * 0.095;
  const verticalInset = (frameMargin / height) * 100;
  const horizontalInset = (frameMargin / width) * 100;
  const previewStyle: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
  };
  const panoramicFrameStyle: CSSProperties = {
    backgroundColor: useWarmFrame ? "#b98555" : "#d8d2c7",
    backgroundImage: useWarmFrame
      ? "linear-gradient(90deg, rgba(255,255,255,.22), rgba(255,255,255,0) 18%, rgba(62,36,16,.24) 82%, rgba(255,255,255,.16)), linear-gradient(180deg, #d5ad7d, #a87546 48%, #d1a678)"
      : `linear-gradient(90deg, rgba(255,255,255,.32), rgba(255,255,255,0) 18%, rgba(0,0,0,.12) 82%, rgba(255,255,255,.18)), url(${frameLayer.src})`,
    backgroundPosition: "center",
    backgroundSize: "100% 100%, 240px auto",
    boxShadow:
      "inset 0 0 0 1px rgba(70,45,22,.28), inset 0 8px 16px rgba(255,255,255,.2), inset 0 -10px 18px rgba(55,32,12,.28)",
  };
  const panoramicMatStyle: CSSProperties = {
    inset: `${verticalInset * 0.5}% ${horizontalInset * 0.55}%`,
    backgroundColor: useWarmFrame ? "#d9c6a6" : "#eeeae1",
    boxShadow:
      "inset 0 0 0 1px rgba(80,70,55,.12), inset 0 7px 16px rgba(255,255,255,.42), inset 0 -7px 16px rgba(55,43,31,.14)",
  };
  const artAreaStyle: CSSProperties = {
    inset: `${verticalInset}% ${horizontalInset}%`,
  };
  const imageSizes = isPanoramicFrame
    ? "(min-width: 1280px) 440px, (min-width: 1024px) 40vw, (min-width: 640px) 60vw, 92vw"
    : "(min-width: 1280px) 280px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
  const artSizes = isPanoramicFrame
    ? "(min-width: 1280px) 400px, (min-width: 1024px) 36vw, (min-width: 640px) 54vw, 84vw"
    : "(min-width: 1280px) 220px, (min-width: 1024px) 25vw, (min-width: 640px) 38vw, 76vw";

  return (
    <div
      className="relative w-full overflow-hidden bg-transparent shadow-sm"
      style={previewStyle}
      aria-label={`Vista previa de ${product.code}`}
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
            sizes={imageSizes}
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
          sizes={artSizes}
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
