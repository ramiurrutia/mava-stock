import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const manifestPath = path.join(projectRoot, "data", "product-assets.ts");
const metadataPath = path.join(projectRoot, "data", "product-metadata.json");

function assertInsideProject(filePath) {
  const relativePath = path.relative(projectRoot, path.resolve(filePath));

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Path outside project: ${filePath}`);
  }
}

function fromImportPath(importPath) {
  if (!importPath.startsWith("@/")) {
    throw new Error(`Unsupported import path: ${importPath}`);
  }

  const filePath = path.join(projectRoot, importPath.slice(2));
  assertInsideProject(filePath);

  return filePath;
}

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function readExistingMetadata() {
  if (!existsSync(metadataPath)) {
    return new Map();
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  const products = Array.isArray(metadata.products) ? metadata.products : [];

  return new Map(
    products
      .filter((item) => typeof item.code === "string")
      .map((item) => [item.code, item]),
  );
}

function parseManifest() {
  const manifest = readFileSync(manifestPath, "utf8");
  const imports = new Map();
  const importRegex = /^import (asset\d+) from "([^"]+)";$/gm;
  const entryRegex =
    /{\s*code: "([^"]+)",\s*image: (asset\d+),\s*measureCode: "([^"]+)",\s*name: "([^"]+)",\s*themeId: "([^"]+)",\s*},/g;

  for (const match of manifest.matchAll(importRegex)) {
    imports.set(match[1], match[2]);
  }

  return Array.from(manifest.matchAll(entryRegex), (match) => {
    const [, code, importName, measureCode, name, themeId] = match;
    const importPath = imports.get(importName);

    if (!importPath) {
      throw new Error(`Missing import for ${importName}`);
    }

    const sourcePath = fromImportPath(importPath);
    const extension = path.extname(sourcePath).toLowerCase();
    const targetPath = path.join(path.dirname(sourcePath), `${code}${extension}`);

    assertInsideProject(targetPath);

    return {
      code,
      importPath,
      measureCode,
      name,
      sourcePath,
      targetPath,
      themeId,
    };
  });
}

function validateRenamePlan(entries) {
  const sourcePaths = new Set(
    entries.map((entry) => path.resolve(entry.sourcePath).toLowerCase()),
  );
  const targetPaths = new Set();

  for (const entry of entries) {
    if (!existsSync(entry.sourcePath)) {
      throw new Error(`Missing source image: ${toProjectPath(entry.sourcePath)}`);
    }

    const targetKey = path.resolve(entry.targetPath).toLowerCase();

    if (targetPaths.has(targetKey)) {
      throw new Error(`Duplicated target image: ${toProjectPath(entry.targetPath)}`);
    }

    targetPaths.add(targetKey);

    if (
      existsSync(entry.targetPath) &&
      !samePath(entry.sourcePath, entry.targetPath) &&
      !sourcePaths.has(targetKey)
    ) {
      throw new Error(`Target already exists: ${toProjectPath(entry.targetPath)}`);
    }
  }
}

function renameImages(entries) {
  const plan = entries
    .filter((entry) => !samePath(entry.sourcePath, entry.targetPath))
    .map((entry, index) => ({
      ...entry,
      tempPath: path.join(
        path.dirname(entry.sourcePath),
        `.renaming-${process.pid}-${index}-${path.basename(entry.sourcePath)}`,
      ),
    }));

  for (const entry of plan) {
    if (existsSync(entry.tempPath)) {
      throw new Error(`Temporary path already exists: ${toProjectPath(entry.tempPath)}`);
    }
  }

  for (const entry of plan) {
    renameSync(entry.sourcePath, entry.tempPath);
  }

  for (const entry of plan) {
    renameSync(entry.tempPath, entry.targetPath);
  }

  return plan.length;
}

function writeMetadata(entries) {
  const existingMetadata = readExistingMetadata();
  const products = entries.map((entry) => {
    const previous = existingMetadata.get(entry.code);

    return {
      code: entry.code,
      fileName: path.basename(entry.targetPath),
      measureCode: entry.measureCode,
      originalFileName: previous?.originalFileName ?? path.basename(entry.sourcePath),
      originalPath: previous?.originalPath ?? toProjectPath(entry.sourcePath),
      themeId: entry.themeId,
    };
  });

  mkdirSync(path.dirname(metadataPath), { recursive: true });
  writeFileSync(
    metadataPath,
    `${JSON.stringify({ products }, null, 2)}\n`,
  );
}

const entries = parseManifest();

if (entries.length === 0) {
  throw new Error("No product images found in product-assets.ts");
}

validateRenamePlan(entries);
const renamedCount = renameImages(entries);
writeMetadata(entries);

console.log(`Renamed ${renamedCount} product images.`);
console.log(`Wrote ${toProjectPath(metadataPath)}.`);
