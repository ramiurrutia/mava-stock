import { readFile, readdir } from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url)).replace(
  /\\scripts$/,
  "",
);
const envPath = path.join(projectRoot, ".env");
const sourcesRoot = path.join(projectRoot, "app", "sources");
const dryRun = process.argv.includes("--dry-run");
const allowedExtensions = new Set([
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function parseEnv(content) {
  return content.split(/\r?\n/).reduce((current, line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return current;
    }

    const equalIndex = trimmed.indexOf("=");

    if (equalIndex === -1) {
      return current;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed
      .slice(equalIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    current[key] = value;

    return current;
  }, {});
}

async function loadEnv() {
  const fileEnv = await readFile(envPath, "utf8")
    .then(parseEnv)
    .catch(() => ({}));

  return {
    ...fileEnv,
    ...process.env,
  };
}

function getStorageBaseUrl(value) {
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

function encodeStoragePath(storagePath) {
  return storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  return "image/jpeg";
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listSourceFiles(entryPath);
      }

      if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
        return [];
      }

      return [entryPath];
    }),
  );

  return files.flat();
}

async function uploadFile({ bucket, cacheControl, config, filePath }) {
  const relativePath = path
    .relative(sourcesRoot, filePath)
    .replaceAll(path.sep, "/");
  const endpoint = `${config.url}/storage/v1/object/${bucket}/${encodeStoragePath(
    relativePath,
  )}`;

  if (dryRun) {
    console.log(`[dry-run] ${relativePath}`);
    return;
  }

  const fileBuffer = await readFile(filePath);
  const response = await fetch(endpoint, {
    body: new Uint8Array(fileBuffer),
    headers: {
      apikey: config.serviceRoleKey,
      ...(config.serviceRoleKey.startsWith("sb_secret_")
        ? {}
        : { Authorization: `Bearer ${config.serviceRoleKey}` }),
      "Cache-Control": cacheControl,
      "Content-Type": getContentType(filePath),
      "x-upsert": "true",
    },
    method: "POST",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");

    throw new Error(`${relativePath}: ${details || response.statusText}`);
  }

  console.log(`ok ${relativePath}`);
}

async function main() {
  const env = await loadEnv();
  const url = getStorageBaseUrl(
    env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const serviceRoleKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY;
  const bucket =
    env.SUPABASE_SOURCES_BUCKET ??
    env.NEXT_PUBLIC_SUPABASE_SOURCES_BUCKET ??
    "sources";
  const cacheControl =
    env.SUPABASE_STORAGE_CACHE_CONTROL ??
    "public, max-age=31536000, immutable";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const files = await listSourceFiles(sourcesRoot);

  console.log(
    `${dryRun ? "Simulando" : "Actualizando"} ${files.length} archivos en ${bucket} con Cache-Control: ${cacheControl}`,
  );

  for (const filePath of files) {
    await uploadFile({
      bucket,
      cacheControl,
      config: { serviceRoleKey, url },
      filePath,
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
