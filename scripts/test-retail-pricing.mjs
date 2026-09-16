import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadModule(filename, aliases = {}, context = {}) {
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports, require: (id) => aliases[id] ?? require(id),
    Response, Request, Headers, URLSearchParams, console, ...context,
  }, { filename });
  return exports;
}

const measures = ["XG", "XGM", "DNG", "TC", "TEXTURADO", "SG", "SGF"];
const pricing = loadModule("data/products.ts", {
  "@/data/product-assets": {
    productAssets: measures.map((measureCode) => ({
      code: `${measureCode}-001`, measureCode, themeId: "abstracto",
      image: { src: "/test.jpg", width: 100, height: 150 },
    })),
  },
  "@/data/product-pairs": { getProductPairInfo: () => undefined },
});
const orders = loadModule("data/orders.ts");
const retailProducts = pricing.products.map((product) => pricing.applyProductPriceList(product, "minorista"));

test("all seven measures have the supplied retail prices, including both TC finishes", () => {
  const expected = {
    XG: { blanco: 258, arpillera: 284 },
    XGM: { blanco: 258, arpillera: 284 },
    DNG: { blanco: 175, arpillera: 180 },
    TC: { blanco: 90, arpillera: 94 },
    TEXTURADO: { base: 330 }, SG: { base: 590 }, SGF: { base: 480 },
  };
  assert.deepEqual(Array.from(pricing.productFolders.flatMap((folder) => folder.measures.map((measure) => measure.code))).sort(), measures.toSorted());
  for (const product of retailProducts) {
    const options = pricing.getProductPriceOptions(product);
    assert.deepEqual(Object.fromEntries(options.map((option) => [option.id, option.amountInThousands])), expected[product.measureCode]);
    for (const option of options) assert.equal(option.price, `$${expected[product.measureCode][option.id]} mil`);
  }
  assert.equal(pricing.getProductDefaultPriceId(retailProducts.find((product) => product.measureCode === "TC")), "blanco");
});

test("retail pricing never mutates the cached wholesale catalog or custom admin prices", () => {
  const before = JSON.stringify(pricing.products);
  for (const product of pricing.products) {
    assert.equal(pricing.applyProductPriceList(product, "mayorista"), product);
    pricing.applyProductPriceList(product, "minorista");
  }
  assert.equal(JSON.stringify(pricing.products), before);
  const tc = pricing.products.find((product) => product.measureCode === "TC");
  assert.equal(pricing.findPriceOption(tc, "base").amountInThousands, 45);
  const custom = { ...tc, dynamic: true, priceOptions: [{ id: "base", amountInThousands: 50, price: "$50 mil" }] };
  assert.equal(pricing.findPriceOption(pricing.applyProductPriceList(custom, "mayorista"), "base").amountInThousands, 50);
  assert.equal(pricing.findPriceOption(pricing.applyProductPriceList(custom, "minorista"), "arpillera").amountInThousands, 94);
});

test("equal-price sizes keep the same retail amount for every available finish", () => {
  for (const [measureCode, expected] of [["SG", 590], ["SGF", 480], ["TEXTURADO", 330]]) {
    const product = { ...pricing.products.find((item) => item.measureCode === measureCode), priceOptions: pricing.priceOptions };
    const retail = pricing.applyProductPriceList(product, "minorista");
    for (const option of pricing.getProductPriceOptions(retail)) assert.equal(option.amountInThousands, expected);
  }
});

test("selection URLs, totals and empty selections retain the retail list", () => {
  const ids = ["xg-001", "tc-001"];
  const selected = { "xg-001": "arpillera", "tc-001": "blanco" };
  const params = pricing.createSelectionSearchParams(ids, selected, "minorista");
  assert.equal(params.get("lista"), "minorista");
  const parsed = pricing.parseSelectionParams(params);
  assert.equal(pricing.getSelectedPriceTotal(parsed.ids, parsed.selectedPriceIds, retailProducts), 374);
  assert.equal(pricing.formatPriceTotal(374), "$374.000");
  assert.equal(pricing.createSelectionSearchParams([], {}, "minorista").get("lista"), "minorista");
  assert.equal(pricing.createSelectionSearchParams(ids, selected).has("lista"), false);
  assert.equal(pricing.getCatalogPath(pricing.parsePriceList(params.get("lista"))), "/minorista");
});

function apiHarness() {
  const rows = [];
  const customerOrders = loadModule("lib/customerOrders.ts", {
    "@/data/products": pricing, "@/data/orders": orders,
  }, {
    process: { env: { SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test" } },
    fetch: async (_url, init) => {
      if (init.method === "POST") rows.push({ ...JSON.parse(init.body), id: "saved-order" });
      return Response.json(rows);
    },
  });
  const api = loadModule("app/api/orders/route.ts", {
    "@/data/products": pricing,
    "@/lib/customerOrders": customerOrders,
    "@/lib/catalogProducts": { getCatalogProducts: async () => pricing.products },
  });
  return { api, customerOrders, rows };
}

function request(body) {
  return new Request("http://test/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName: "Test", whatsapp: "123456789", ...body }),
  });
}

test("order API calculates retail prices on the server and persists the original price list", async () => {
  const { api, customerOrders, rows } = apiHarness();
  const response = await api.POST(request({
    priceList: "minorista", productIds: ["xg-001", "tc-001"],
    selectedPriceIds: { "xg-001": "arpillera", "tc-001": "blanco" },
    total: 1, price: 1,
  }));
  assert.equal(response.status, 201);
  const { order } = await response.json();
  assert.equal(order.total, 374000);
  assert.equal(rows[0].items[0].price, 284000);
  assert.equal(rows[0].items[1].price, 90000);
  const restored = await customerOrders.getCustomerOrderById(order.id);
  assert.equal(orders.getOrderPriceList(restored), "minorista");
  assert.equal(restored.total, 374000);
});

test("legacy wholesale orders keep their prices and invalid retail options are rejected", async () => {
  const { api, rows } = apiHarness();
  const wholesale = await api.POST(request({ productIds: ["tc-001"], selectedPriceIds: { "tc-001": "base" } }));
  assert.equal(wholesale.status, 201);
  assert.equal((await wholesale.json()).order.total, 45000);
  assert.equal(orders.getOrderPriceList({ items: [{ price: 45000 }] }), "mayorista");
  for (const body of [
    { priceList: "invalid", productIds: ["tc-001"], selectedPriceIds: { "tc-001": "base" } },
    { priceList: "minorista", productIds: ["tc-001"], selectedPriceIds: { "tc-001": "base" } },
    { priceList: "minorista", productIds: ["tc-001"], selectedPriceIds: {} },
  ]) assert.equal((await api.POST(request(body))).status, 400);
  assert.equal(rows.length, 1);
});
