export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  size: string;
  available: boolean;
  artwork: {
    background: string;
    accent: string;
    motif: string;
  };
};

export const priceOptions = [
  {
    label: "Fondo blanco",
    shortLabel: "Blanco",
    price: "$129k",
    amountInThousands: 129,
  },
  {
    label: "Fondo arpillera",
    shortLabel: "Arpillera",
    price: "$142k",
    amountInThousands: 142,
  },
] as const;

export const sizeOptions = [
  {
    label: "XGM",
    size: "103 x 73",
  },
  {
    label: "XG",
    size: "115 x 75",
  },
] as const;

export const productSizeSummary = sizeOptions
  .map((option) => `${option.label} ${option.size}`)
  .join(" / ");

export const products: Product[] = [
  {
    id: "mava-001",
    code: "MAVA-001",
    name: "Abstracto tonos tierra",
    category: "Abstracto",
    size: productSizeSummary,
    available: true,
    artwork: {
      background:
        "linear-gradient(135deg, #efe0c7 0%, #b9673b 42%, #263238 100%)",
      accent: "#f2c078",
      motif:
        "radial-gradient(circle at 24% 26%, rgba(255,255,255,.65) 0 9%, transparent 10%), radial-gradient(circle at 72% 72%, rgba(23,23,23,.28) 0 18%, transparent 19%)",
    },
  },
  {
    id: "mava-002",
    code: "MAVA-002",
    name: "Botanico verde suave",
    category: "Naturaleza",
    size: productSizeSummary,
    available: true,
    artwork: {
      background:
        "linear-gradient(145deg, #eff6ed 0%, #8fb996 50%, #264b3a 100%)",
      accent: "#f7d9a7",
      motif:
        "radial-gradient(ellipse at 34% 64%, rgba(255,255,255,.55) 0 14%, transparent 15%), radial-gradient(ellipse at 70% 28%, rgba(8,48,36,.35) 0 20%, transparent 21%)",
    },
  },
  {
    id: "mava-003",
    code: "MAVA-003",
    name: "Linea urbana neutra",
    category: "Urbano",
    size: productSizeSummary,
    available: true,
    artwork: {
      background:
        "linear-gradient(160deg, #e8ecef 0%, #9ca7ad 44%, #202733 100%)",
      accent: "#d65f4a",
      motif:
        "linear-gradient(90deg, transparent 0 18%, rgba(255,255,255,.55) 19% 22%, transparent 23% 100%), linear-gradient(0deg, transparent 0 55%, rgba(214,95,74,.72) 56% 62%, transparent 63% 100%)",
    },
  },
  {
    id: "mava-004",
    code: "MAVA-004",
    name: "Costa calma",
    category: "Paisaje",
    size: productSizeSummary,
    available: false,
    artwork: {
      background:
        "linear-gradient(180deg, #d7ecf3 0%, #87b8c8 48%, #234b5f 100%)",
      accent: "#f4d35e",
      motif:
        "radial-gradient(circle at 72% 22%, rgba(244,211,94,.78) 0 9%, transparent 10%), linear-gradient(0deg, rgba(255,255,255,.35) 0 10%, transparent 11% 100%)",
    },
  },
  {
    id: "mava-005",
    code: "MAVA-005",
    name: "Geometrico coral",
    category: "Geometrico",
    size: productSizeSummary,
    available: true,
    artwork: {
      background:
        "linear-gradient(135deg, #f7f0ea 0%, #f28f73 45%, #3b2f4a 100%)",
      accent: "#2f9c95",
      motif:
        "conic-gradient(from 90deg at 50% 50%, rgba(47,156,149,.75) 0 25%, transparent 0 50%, rgba(255,255,255,.55) 0 75%, transparent 0)",
    },
  },
  {
    id: "mava-006",
    code: "MAVA-006",
    name: "Floral oscuro",
    category: "Naturaleza",
    size: productSizeSummary,
    available: true,
    artwork: {
      background:
        "linear-gradient(140deg, #22302a 0%, #5d7965 52%, #e9c46a 100%)",
      accent: "#f4a261",
      motif:
        "radial-gradient(circle at 36% 38%, rgba(244,162,97,.78) 0 8%, transparent 9%), radial-gradient(circle at 58% 56%, rgba(255,255,255,.5) 0 10%, transparent 11%), radial-gradient(circle at 68% 34%, rgba(34,48,42,.42) 0 14%, transparent 15%)",
    },
  },
  {
    id: "mava-007",
    code: "MAVA-007",
    name: "Minimal crema y negro",
    category: "Minimal",
    size: productSizeSummary,
    available: false,
    artwork: {
      background:
        "linear-gradient(120deg, #f8f4ef 0%, #dfd8cc 54%, #111111 100%)",
      accent: "#bb4430",
      motif:
        "radial-gradient(circle at 30% 34%, rgba(17,17,17,.82) 0 5%, transparent 6%), linear-gradient(115deg, transparent 0 58%, rgba(187,68,48,.78) 59% 64%, transparent 65%)",
    },
  },
  {
    id: "mava-008",
    code: "MAVA-008",
    name: "Campo moderno",
    category: "Paisaje",
    size: productSizeSummary,
    available: true,
    artwork: {
      background:
        "linear-gradient(180deg, #cde7e3 0%, #6a994e 48%, #6b4f3f 100%)",
      accent: "#bc4749",
      motif:
        "linear-gradient(18deg, transparent 0 49%, rgba(188,71,73,.72) 50% 55%, transparent 56% 100%), radial-gradient(circle at 22% 24%, rgba(255,255,255,.62) 0 8%, transparent 9%)",
    },
  },
];

export const categories = Array.from(
  new Set(products.map((product) => product.category)),
).sort();
