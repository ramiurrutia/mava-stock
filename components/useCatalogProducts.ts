"use client";

import { useEffect, useMemo, useState } from "react";
import { products as staticProducts, type Product } from "@/data/products";

const catalogProductsChangeEvent = "mava-catalog-products-change";
let cachedDynamicProducts: Product[] | null = null;
let pendingDynamicProductsRequest: Promise<Product[]> | null = null;

type ProductsResponse = {
  products?: Product[];
};

export function mergeCatalogProducts(
  baseProducts: Product[],
  dynamicProducts: Product[],
) {
  const uniqueDynamicProducts = Array.from(
    new Map(dynamicProducts.map((product) => [product.code, product])).values(),
  );
  const dynamicCodes = new Set(
    uniqueDynamicProducts.map((product) => product.code),
  );

  return [
    ...baseProducts.filter((product) => !dynamicCodes.has(product.code)),
    ...uniqueDynamicProducts,
  ];
}

export function notifyCatalogProductsChanged() {
  window.dispatchEvent(new Event(catalogProductsChangeEvent));
}

async function fetchDynamicProducts(forceRefresh = false) {
  if (!forceRefresh && pendingDynamicProductsRequest) {
    return pendingDynamicProductsRequest;
  }

  const url = forceRefresh
    ? `/api/products?refresh=${Date.now()}`
    : "/api/products";
  const request = fetch(url, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        return cachedDynamicProducts ?? [];
      }

      const data = (await response.json().catch(() => null)) as
        | ProductsResponse
        | null;

      return Array.isArray(data?.products) ? data.products : [];
    })
    .then((products) => {
      cachedDynamicProducts = products;
      return products;
    })
    .finally(() => {
      if (pendingDynamicProductsRequest === request) {
        pendingDynamicProductsRequest = null;
      }
    });

  pendingDynamicProductsRequest = request;

  return request;
}

export function useCatalogProducts(initialProducts: Product[] = staticProducts) {
  const [dynamicProducts, setDynamicProducts] = useState<Product[] | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    async function loadProducts(forceRefresh = false) {
      const products = await fetchDynamicProducts(forceRefresh);

      if (!ignore) {
        setDynamicProducts(products);
      }
    }

    function refreshProducts() {
      void loadProducts(true);
    }

    void loadProducts();
    window.addEventListener(catalogProductsChangeEvent, refreshProducts);

    return () => {
      ignore = true;
      window.removeEventListener(catalogProductsChangeEvent, refreshProducts);
    };
  }, []);

  return useMemo(() => {
    const localDynamicProducts = initialProducts.filter(
      (product) => product.dynamic,
    );
    const bucketProducts = dynamicProducts ?? [];

    return mergeCatalogProducts(staticProducts, [
      ...bucketProducts,
      ...localDynamicProducts,
    ]);
  }, [dynamicProducts, initialProducts]);
}
