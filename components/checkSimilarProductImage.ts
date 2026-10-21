import type { Product } from "@/data/products";
import {
  fingerprintLength,
  fingerprintSize,
  imageDifference,
  similarImageThreshold,
} from "@/lib/imageSimilarity";

const cacheKey = "mava-image-fingerprints-v1";
const cacheLifetime = 24 * 60 * 60 * 1000;
type CachedFingerprint = { value: string; expires: number };
const fingerprints = new Map<string, CachedFingerprint>();
let cacheLoaded = false;

function loadCache() {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const entries: unknown = JSON.parse(localStorage.getItem(cacheKey) ?? "[]");
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2) continue;
      const [url, cached] = entry;
      if (typeof url === "string" && cached &&
          typeof cached.value === "string" && cached.value.length === fingerprintLength &&
          typeof cached.expires === "number" && cached.expires > Date.now()) {
        fingerprints.set(url, cached);
      }
    }
  } catch {
    // Private browsing or a full cache must not prevent adding a product.
  }
}

function saveCache(urls: Set<string>) {
  for (const [url, cached] of fingerprints) {
    if (!urls.has(url) || cached.expires <= Date.now()) fingerprints.delete(url);
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify([...fingerprints]));
  } catch {
    // The in-memory cache still works if browser storage is unavailable.
  }
}

async function fingerprint(src: string, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  const img = new Image();
  img.crossOrigin = "anonymous";
  try {
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
        img.onload = null;
        img.onerror = null;
        if (error) reject(error);
        else resolve();
      };
      const abort = () => finish(new DOMException("Revision cancelada", "AbortError"));
      const timeout = setTimeout(() => finish(new Error("La imagen no respondio")), 12000);
      signal.addEventListener("abort", abort, { once: true });
      img.onload = () => finish();
      img.onerror = () => finish(new Error("No se pudo comparar la imagen"));
      img.src = src;
    });
    signal.throwIfAborted();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = fingerprintSize;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("No se pudo analizar la imagen");
    context.fillStyle = "white";
    context.fillRect(0, 0, fingerprintSize, fingerprintSize);
    context.drawImage(img, 0, 0, fingerprintSize, fingerprintSize);
    const { data } = context.getImageData(0, 0, fingerprintSize, fingerprintSize);
    let value = "";
    for (let index = 0; index < data.length; index += 4) {
      value += String.fromCharCode(data[index], data[index + 1], data[index + 2]);
    }
    return value;
  } finally {
    img.src = "";
  }
}

export async function checkSimilarProductImage(
  file: File,
  products: Product[],
  signal: AbortSignal,
  onProgress: (checked: number, total: number) => void,
) {
  loadCache();
  const localUrl = URL.createObjectURL(file);
  let uploaded: string;
  try {
    uploaded = await fingerprint(localUrl, signal);
  } finally {
    URL.revokeObjectURL(localUrl);
  }
  const matches: { code: string; difference: number }[] = [];
  let failed = 0;
  let checked = 0;
  let cursor = 0;
  onProgress(0, products.length);
  // Bound image decoding and network concurrency; never scan on catalog page load.
  async function worker() {
    while (cursor < products.length) {
      signal.throwIfAborted();
      const product = products[cursor++];
      const url = product.image.src;
      try {
        const cached = fingerprints.get(url);
        const value = cached && cached.expires > Date.now()
          ? cached.value
          : await fingerprint(url, signal);
        fingerprints.set(url, { value, expires: cached?.expires && cached.expires > Date.now()
          ? cached.expires : Date.now() + cacheLifetime });
        const difference = imageDifference(uploaded, value);
        if (difference <= similarImageThreshold) matches.push({ code: product.code, difference });
      } catch {
        signal.throwIfAborted();
        failed++;
      }
      checked++;
      if (checked % 10 === 0 || checked === products.length) onProgress(checked, products.length);
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(4, products.length) }, worker));
  } finally {
    saveCache(new Set(products.map((product) => product.image.src)));
  }
  signal.throwIfAborted();
  return { matches: matches.sort((a, b) => a.difference - b.difference), failed };
}
