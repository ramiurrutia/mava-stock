import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function loadModule(file, context = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  runInNewContext(outputText, { exports, ...context });
  return exports;
}

const algorithm = loadModule("lib/imageSimilarity.ts");
const fingerprint = String.fromCharCode(...Array.from({ length: algorithm.fingerprintLength }, (_, i) => 40 + i % 160));

test("identical composition matches regardless of filename; small encoding changes match", () => {
  assert.equal(algorithm.imageDifference(fingerprint, fingerprint), 0);
  const recompressed = Array.from(fingerprint, (value) => String.fromCharCode(value.charCodeAt(0) + 3)).join("");
  assert.ok(algorithm.imageDifference(fingerprint, recompressed) < algorithm.similarImageThreshold);
});

test("different compositions and malformed fingerprints do not match", () => {
  const different = Array.from(fingerprint, (value) => String.fromCharCode(255 - value.charCodeAt(0))).join("");
  assert.ok(algorithm.imageDifference(fingerprint, different) > algorithm.similarImageThreshold);
  assert.equal(algorithm.imageDifference("", fingerprint), Infinity);
});

function browserHarness(storage = new Map()) {
  const loads = [];
  const released = [];
  class MockImage {
    set src(url) {
      this.url = url;
      if (!url) return;
      loads.push(url);
      queueMicrotask(() => url.includes("broken") ? this.onerror?.() : this.onload?.());
    }
  }
  const checker = loadModule("components/checkSimilarProductImage.ts", {
    require: () => algorithm,
    Image: MockImage,
    DOMException,
    setTimeout, clearTimeout,
    URL: {
      createObjectURL: () => "blob:uploaded",
      revokeObjectURL: (url) => released.push(url),
    },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    document: {
      createElement: () => {
        let url;
        return { getContext: () => ({
          fillRect() {},
          drawImage(img) { url = img.url; },
          getImageData: () => ({ data: Array.from({ length: 16 * 16 * 4 }, (_, i) => i % 4 === 3 ? 255 : url.includes("different") ? 230 : 40) }),
        }) };
      },
    },
  });
  return { checker, loads, released, storage };
}

const products = [
  { code: "XGM-001", image: { src: "/same.webp" } },
  { code: "TC-002", image: { src: "/different.jpg" } },
  { code: "DNG-003", image: { src: "/broken.png" } },
];

test("compares across measures and reports failed images instead of silently declaring no duplicate", async () => {
  const { checker, released } = browserHarness();
  let progress;
  const result = await checker.checkSimilarProductImage({}, products, new AbortController().signal,
    (checked, total) => { progress = [checked, total]; });
  assert.deepEqual(Array.from(result.matches, (match) => match.code), ["XGM-001"]);
  assert.equal(result.failed, 1);
  assert.deepEqual(progress, [3, 3]);
  assert.deepEqual(released, ["blob:uploaded"]);
});

test("reuse fingerprints in memory and after a page reload, retry failed images", async () => {
  const first = browserHarness();
  const run = (checker) => checker.checkSimilarProductImage({}, products, new AbortController().signal, () => {});
  await run(first.checker);
  first.loads.length = 0;
  await run(first.checker);
  assert.deepEqual(first.loads, ["blob:uploaded", "/broken.png"]);
  const reloaded = browserHarness(first.storage);
  await run(reloaded.checker);
  assert.deepEqual(reloaded.loads, ["blob:uploaded", "/broken.png"]);
});

test("cancellation aborts review and releases the local file URL", async () => {
  const { checker, loads, released } = browserHarness();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(checker.checkSimilarProductImage({}, products, controller.signal, () => {}),
    (error) => error.name === "AbortError");
  assert.deepEqual(loads, []);
  assert.deepEqual(released, ["blob:uploaded"]);
});

test("broken local cache does not prevent comparison", async () => {
  const { checker } = browserHarness(new Map([["mava-image-fingerprints-v1", "not JSON"]]));
  const result = await checker.checkSimilarProductImage({}, products.slice(0, 1), new AbortController().signal, () => {});
  assert.equal(result.matches.length, 1);
});
