"use client";

import { useEffect, useMemo, useState } from "react";
import { products as staticProducts, type Product } from "@/data/products";
import type { CatalogHighlights } from "@/lib/catalogHighlights";

const catalogProductsChangeEvent = "mava-catalog-products-change";
const catalogDataLoadedEvent = "mava-catalog-data-loaded";
let cachedDynamicProducts: Product[] | null = null;
let cachedCatalogHighlights: CatalogHighlights | null = null;
let pendingDynamicProductsRequest: Promise<Product[] | null> | null = null;

type ProductsResponse = {
  highlights?: CatalogHighlights;
  products?: Product[];
};

const emptyHighlights: CatalogHighlights = {
  folderIds: [],
  measureCodes: [],
  productCodes: [],
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
  if (!forceRefresh && cachedDynamicProducts) {
    return cachedDynamicProducts;
  }

  if (!forceRefresh && pendingDynamicProductsRequest) {
    return pendingDynamicProductsRequest;
  }

  const url = forceRefresh
    ? `/api/products?refresh=${Date.now()}`
    : "/api/products";
  const request = fetch(url, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        return cachedDynamicProducts;
      }

      const data = (await response.json().catch(() => null)) as
        | ProductsResponse
        | null;

      if (Array.isArray(data?.highlights?.productCodes)) {
        cachedCatalogHighlights = {
          folderIds: Array.isArray(data.highlights.folderIds)
            ? data.highlights.folderIds
            : [],
          measureCodes: Array.isArray(data.highlights.measureCodes)
            ? data.highlights.measureCodes
            : [],
          productCodes: data.highlights.productCodes,
        };
      }

      return Array.isArray(data?.products) ? data.products : null;
    })
    .then((products) => {
      if (products) {
        cachedDynamicProducts = products;
      }

      window.dispatchEvent(new Event(catalogDataLoadedEvent));

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

export function useCatalogHighlights() {
  const [highlights, setHighlights] =
    useState<CatalogHighlights>(emptyHighlights);

  useEffect(() => {
    let ignore = false;

    function syncHighlights() {
      if (!ignore && cachedCatalogHighlights) {
        setHighlights(cachedCatalogHighlights);
      }
    }

    void fetchDynamicProducts().then(syncHighlights);
    window.addEventListener(catalogDataLoadedEvent, syncHighlights);

    return () => {
      ignore = true;
      window.removeEventListener(catalogDataLoadedEvent, syncHighlights);
    };
  }, []);

  return highlights;
}

export function useCatalogProducts(initialProducts: Product[] = staticProducts) {
  const [dynamicProducts, setDynamicProducts] = useState<Product[] | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    async function loadProducts(forceRefresh = false) {
      const products = await fetchDynamicProducts(forceRefresh);

      if (!ignore && products) {
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
    const baseProducts = dynamicProducts ? [] : staticProducts;
    const bucketProducts = dynamicProducts ?? [];

    return mergeCatalogProducts(baseProducts, [
      ...bucketProducts,
      ...localDynamicProducts,
    ]);
  }, [dynamicProducts, initialProducts]);
}
