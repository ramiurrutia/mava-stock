import Image from "next/image";
import type { CSSProperties } from "react";
import burlapTexture from "@/app/sources/layers/txt_arpillera.png";
import {
  getProductPreviewDimensions,
  type PriceOptionId,
  type Product,
} from "@/data/products";

type FramePreviewProps = {
  onArtworkError?: () => void;
  product: Pick<Product, "code" | "image" | "measureCode">;
  selectedPriceId?: PriceOptionId;
};

export function FramePreview({
  onArtworkError,
  product,
  selectedPriceId,
}: FramePreviewProps) {
  const isBurlap = selectedPriceId === "arpillera";
  const { width, height } = getProductPreviewDimensions(product);
  const aspectRatio = width / height;
  const isPanoramicFrame = aspectRatio > 1.6;
  const frameWidth = Math.min(width, height) * 0.045;
  const artMargin = Math.min(width, height) * 0.115;
  const frameVerticalInset = (frameWidth / height) * 100;
  const frameHorizontalInset = (frameWidth / width) * 100;
  const artVerticalInset = (artMargin / height) * 100;
  const artHorizontalInset = (artMargin / width) * 100;
  const previewStyle: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
  };
  const frameStyle: CSSProperties = {
    backgroundColor: "#b98555",
    backgroundImage:
      "linear-gradient(90deg, rgba(255,255,255,.26), rgba(255,255,255,0) 18%, rgba(62,36,16,.24) 82%, rgba(255,255,255,.16)), linear-gradient(180deg, #d9b181, #a87546 50%, #d1a678)",
    backgroundPosition: "center",
    backgroundSize: "100% 100%",
    boxShadow:
      "inset 0 0 0 1px rgba(70,45,22,.28), inset 0 8px 16px rgba(255,255,255,.2), inset 0 -10px 18px rgba(55,32,12,.28)",
  };
  const matStyle: CSSProperties = {
    inset: `${frameVerticalInset}% ${frameHorizontalInset}%`,
    backgroundColor: isBurlap ? "#b69058" : "#eeeae1",
    backgroundImage: isBurlap
      ? `url(${burlapTexture.src})`
      : "linear-gradient(rgba(255,255,255,.45), rgba(60,52,43,.05))",
    backgroundPosition: "center",
    backgroundSize: isBurlap ? "180px 180px" : "100% 100%",
    boxShadow: isBurlap
      ? "inset 0 0 0 1px rgba(80,60,35,.18)"
      : "inset 0 0 0 1px rgba(80,70,55,.12), inset 0 7px 16px rgba(255,255,255,.42), inset 0 -7px 16px rgba(55,43,31,.14)",
  };
  const artAreaStyle: CSSProperties = {
    inset: `${artVerticalInset}% ${artHorizontalInset}%`,
  };
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
      <div className="absolute inset-0 z-0" style={frameStyle} />
      <div className="absolute z-0" style={matStyle} />
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
          onError={() => onArtworkError?.()}
        />
      </div>
    </div>
  );
}
