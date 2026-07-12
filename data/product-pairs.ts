export type ProductPairGroup = {
  id: string;
  label: string;
  codes: readonly string[];
};

export type ProductPairInfo = {
  groupId: string;
  label: string;
  position: number;
  relatedCodes: readonly string[];
  size: number;
};

// Metadata independiente del codigo/archivo para no romper pedidos guardados.
export const productPairGroups = [
  {
    id: "xg-lineas-cruzadas",
    label: "Lineas cruzadas",
    codes: ["XG-013", "XG-014"],
  },
  {
    id: "xg-bruma-calida",
    label: "Bruma calida",
    codes: ["XG-015", "XG-016"],
  },
] as const satisfies readonly ProductPairGroup[];

export const productPairInfoByCode = Object.fromEntries(
  productPairGroups.flatMap((group) =>
    group.codes.map((code, index) => [
      code,
      {
        groupId: group.id,
        label: group.label,
        position: index + 1,
        relatedCodes: group.codes.filter((relatedCode) => relatedCode !== code),
        size: group.codes.length,
      },
    ]),
  ),
) as Record<string, ProductPairInfo | undefined>;

export function getProductPairInfo(code: string) {
  return productPairInfoByCode[code.toUpperCase()];
}
