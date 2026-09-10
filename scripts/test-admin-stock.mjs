import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadModule(filename, context = {}, aliases = {}) {
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports, require: (id) => aliases[id] ?? require(id),
    Response, Request, Headers, console, crypto, ...context,
  }, { filename });
  return exports;
}

function stockHarness() {
  let row = {
    id: "main", unavailable_product_ids: ["xg-002"], orders: [],
    updated_at: "2026-01-01T00:00:00.000Z",
  };
  let conflict = false;
  const store = loadModule("lib/adminStore.ts", {
    process: { cwd: () => ".", env: { SUPABASE_URL: "https://test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test" } },
    fetch: async (url, init) => {
      if (!init.method) return Response.json([row]);
      const version = new URL(url).searchParams.get("updated_at");
      if (conflict) {
        conflict = false;
        row = { ...row, stock_quantities: { ...row.stock_quantities, "sg-001": 7 }, updated_at: "2026-02-01T00:00:00.000Z" };
        return Response.json([]);
      }
      if (version !== `eq.${row.updated_at}`) return Response.json([]);
      row = { ...row, ...JSON.parse(init.body) };
      return Response.json([row]);
    },
  });
  return { store, conflict: () => { conflict = true; } };
}

const order = {
  productIds: ["xg-001"], productCodes: ["XG-001"],
  selectedPriceIds: { "xg-001": "blanco" }, totalInThousands: 129,
  sharePath: "/compartir?pedido=test",
};

test("legacy stock, quantities and availability remain compatible", async () => {
  const { store } = stockHarness();
  assert.deepEqual(JSON.parse(JSON.stringify(await store.getStockState())), {
    stockQuantities: {}, unavailableProductIds: ["xg-002"], deductedOrderIds: [],
  });
  await store.setProductStockQuantity("xg-002", 2);
  assert.equal((await store.getUnavailableProductIds()).includes("xg-002"), false);
  await store.setProductsAvailability(["xg-002"], true);
  assert.equal((await store.getStockState()).stockQuantities["xg-002"], 2);
  await store.setProductsAvailability(["xg-002"], false);
  assert.equal((await store.getStockState()).stockQuantities["xg-002"], 0);
  await store.setProductsAvailability(["xg-002"], true);
  assert.equal((await store.getStockState()).stockQuantities["xg-002"], 1);
});

test("each saved order deducts once and only zero stock becomes unavailable", async () => {
  const { store } = stockHarness();
  await store.setProductStockQuantity("xg-001", 2);
  await Promise.all([
    store.createFinishedOrder(order, "order-1"),
    store.createFinishedOrder(order, "order-1"),
  ]);
  assert.equal((await store.getStockState()).stockQuantities["xg-001"], 1);
  assert.equal((await store.getUnavailableProductIds()).includes("xg-001"), false);
  await store.createFinishedOrder(order, "order-2");
  assert.equal((await store.getStockState()).stockQuantities["xg-001"], 0);
  assert.equal((await store.getUnavailableProductIds()).includes("xg-001"), true);
  await store.createFinishedOrder(order, "order-3");
  assert.equal((await store.getStockState()).stockQuantities["xg-001"], 0);
});

test("concurrent remote saves preserve the other admin's quantities", async () => {
  const harness = stockHarness();
  harness.conflict();
  await harness.store.setProductStockQuantity("xg-001", 2);
  const { stockQuantities } = await harness.store.getStockState();
  assert.equal(stockQuantities["sg-001"], 7);
  assert.equal(stockQuantities["xg-001"], 2);
});

test("public API omits internal counts, admin API requires authentication", async () => {
  const { store } = stockHarness();
  await store.setProductStockQuantity("xg-001", 5);
  const aliases = {
    "@/lib/adminStore": store,
    "@/lib/adminAuth": { isAdminRequest: (request) => request.headers.get("x-mava-admin-key") === "test" },
  };
  const publicApi = loadModule("app/api/stock/route.ts", {}, aliases);
  assert.deepEqual(Object.keys(await (await publicApi.GET()).json()), ["unavailableProductIds"]);
  const adminApi = loadModule("app/api/admin/stock/route.ts", {}, aliases);
  assert.equal((await adminApi.GET(new Request("http://test"))).status, 401);
  const response = await adminApi.GET(new Request("http://test", { headers: { "x-mava-admin-key": "test" } }));
  assert.equal((await response.json()).stockQuantities["xg-001"], 5);
  assert.equal((await adminApi.PATCH(new Request("http://test", { method: "PATCH" }))).status, 401);
  for (const quantity of [-1, 1.5, 10000, "2", null]) {
    const result = await adminApi.PATCH(new Request("http://test", {
      method: "PATCH", headers: { "x-mava-admin-key": "test" },
      body: JSON.stringify({ productId: "xg-001", quantity }),
    }));
    assert.equal(result.status, 400);
  }
});

test("order API deducts the saved items, preserves status and rejects repeat deductions", async () => {
  const { store } = stockHarness();
  await store.setProductStockQuantity("xg-001", 2);
  const api = loadModule("app/api/admin/orders/route.ts", {}, {
    "@/lib/adminStore": store,
    "@/lib/adminAuth": { isAdminRequest: () => true },
    "@/data/orders": { isOrderStatus: () => true },
    "@/lib/customerOrders": {
      getCustomerOrderById: async (id) => id === "order-1" ? {
        id, total: 129000, items: [{ id: "xg-001", code: "XG-001", background: "blanco" }],
      } : null,
      updateCustomerOrderStatus: async (id, status) => ({ id, status }),
    },
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await api.POST(new Request("http://test", {
      method: "POST", body: JSON.stringify({ orderId: "order-1", productIds: ["wrong-id"] }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).stockQuantities["xg-001"], 1);
  }
  const response = await api.PATCH(new Request("http://test", {
    method: "PATCH", body: JSON.stringify({ id: "order-1", status: "listo" }),
  }));
  assert.equal((await response.json()).order.status, "listo");
});
