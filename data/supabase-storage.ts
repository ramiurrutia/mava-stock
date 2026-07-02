import type { StaticImageData } from "next/image";

function cleanEnvValue(value?: string) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

const supabaseUrl = cleanEnvValue(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
);
const sourcesBucket =
  cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_SOURCES_BUCKET) || "sources";

function getPublicStorageBaseUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.hostname.endsWith(".storage.supabase.co")) {
      const projectRef = url.hostname.replace(".storage.supabase.co", "");

      return `https://${projectRef}.supabase.co`;
    }

    return url.origin;
  } catch {
    return value.replace(/\/storage\/v1\/s3\/?$/, "").replace(/\/$/, "");
  }
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getSupabaseSourceUrl(path: string) {
  if (!supabaseUrl) {
    return `/missing-supabase-url/${encodeStoragePath(path)}`;
  }

  const baseUrl = getPublicStorageBaseUrl(supabaseUrl);

  return `${baseUrl}/storage/v1/object/public/${sourcesBucket}/${encodeStoragePath(path)}`;
}

export function createSupabaseImage(
  path: string,
  width: number,
  height: number,
): StaticImageData {
  return {
    src: getSupabaseSourceUrl(path),
    width,
    height,
  };
}
