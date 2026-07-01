import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const imagesRoot = path.join(projectRoot, "app", "sources", "images");
const outputPath = path.join(projectRoot, "data", "product-assets.ts");
const metadataPath = path.join(projectRoot, "data", "product-metadata.json");
const validExtensions = new Set([".jpeg", ".jpg", ".png"]);
const validThemeIds = new Set([
  "abstracto",
  "animales",
  "botanico",
  "objetos",
  "paisajes",
  "retratos",
  "texturas",
  "vehiculos",
]);
const validPriceOptionIds = new Set(["blanco", "arpillera", "base"]);

const folderConfigs = [
  { folder: "XGM", measureCode: "XGM" },
  { folder: "DNG", measureCode: "DNG" },
  { folder: "TC", measureCode: "TC" },
  { folder: "XG", measureCode: "XG" },
  { folder: "SGF", measureCode: "SGF" },
  { folder: "SG", measureCode: "SG" },
  {
    folder: "TEXTURADOS",
    measureCode: "TEXTURADO",
    codePrefix: "TEXTURADO",
    themeId: "texturas",
  },
  { folder: "TEXTURADO", measureCode: "TEXTURADO", themeId: "texturas" },
];

const themeRules = [
  {
    id: "retratos",
    includes: ["arts-439", "crea-61", "creat-1", "daisy-1", "mixi-10"],
  },
  {
    id: "vehiculos",
    includes: ["4994 - 755301691", "4995 - 910059314", "5198 - 2443940499"],
  },
  {
    id: "animales",
    includes: [
      "118481903",
      "1201530585",
      "121275790",
      "1449684001",
      "206805789",
      "4999 - 1002927714",
      "505894643",
      "5207 - 546010177",
    ],
  },
  {
    id: "paisajes",
    includes: [
      "1518pix",
      "1519pix",
      "1520pix",
      "1569670274",
      "1569670290",
      "1665845324",
      "3047sa",
      "3048sa",
      "3018sa",
      "3019sa",
      "4912",
      "5138",
      "673713283",
      "673713858",
      "673713973",
      "728601752",
      "ashe-2a",
      "ashe-2b",
      "gall-21",
      "henk-590",
      "henk-591",
      "henk-566",
      "henk-567",
      "ozz-1",
      "ozz-2",
      "paper -4",
      "paper-1",
    ],
  },
  {
    id: "botanico",
    includes: [
      "4816",
      "4818",
      "5086",
      "5087",
      "5107",
      "5125",
      "5146",
      "5147",
      "5161",
      "5162",
      "5196",
      "5197",
      "5231",
      "5254",
      "5255",
      "5286",
      "5287",
      "artl-10",
      "artl-11",
      "arti-36",
      "arti-37",
      "auva-1",
      "bay leaf",
      "desig-10",
      "desig-11",
      "digis-1",
      "digis-2",
      "digis-13",
      "digis-135",
      "dng-011",
      "dng-012",
      "dng-013",
      "forgio-1",
      "gray leaves",
      "har -10",
      "jay-13",
      "jay-15",
      "lili-10",
      "maha",
      "pape-101",
      "rol-542",
      "thyme",
      "vel-16",
      "whatsapp image 2026-06-26",
      "xg 50 x 100",
    ],
  },
  {
    id: "objetos",
    includes: [
      "2990sa",
      "2991sa",
      "2992sa",
      "2993sa",
      "2994sa",
      "2995sa",
      "2996sa",
      "2997sa",
      "2998sa",
      "2999sa",
      "3000sa",
      "3001sa",
      "31431311",
      "5221",
      "5222",
      "soul",
    ],
  },
  {
    id: "texturas",
    includes: [
      "4381",
      "4382",
      "5003",
      "5004",
      "5018",
      "5019",
      "5078",
      "5079",
      "5228",
      "found-10",
      "found-11",
      "kam-1",
      "kam-2",
      "tree rings",
    ],
  },
];

const designRules = [
  {
    name: "Composicion en grilla",
    includes: ["1417shu", "1418 shu", "1419shu"],
  },
  {
    name: "Horizonte brumoso",
    includes: ["1518pix", "1519pix", "1520pix"],
  },
  {
    name: "Curvas negras",
    includes: ["2988sa", "2989sa", "3079sa", "3081sa"],
  },
  {
    name: "Escultura fluida",
    includes: [
      "2990sa",
      "2991sa",
      "2992sa",
      "2993sa",
      "2994sa",
      "2995sa",
      "2996sa",
      "2997sa",
      "2998sa",
      "2999sa",
      "3000sa",
      "3001sa",
    ],
  },
  {
    name: "Ondas calidas",
    includes: ["3008sa", "3009sa", "3011sa"],
  },
  {
    name: "Horizonte dorado",
    includes: ["3018sa", "3019sa"],
  },
  {
    name: "Paisaje verde",
    includes: ["3047sa", "3048sa"],
  },
  {
    name: "Bloques difusos",
    includes: ["3054sa", "3055sa"],
  },
  {
    name: "Discos punteados",
    includes: ["3059sa", "3060sa"],
  },
  {
    name: "Abanico de ramas",
    includes: ["3061sa"],
  },
  {
    name: "Nube marmolada",
    includes: ["3063sa"],
  },
  {
    name: "Bloques tierra claro",
    includes: ["3064sa", "3065sa"],
  },
  {
    name: "Medios circulos",
    includes: ["3073sa", "3074sa", "3075sa"],
  },
  {
    name: "Grieta mineral",
    includes: ["3082sa"],
  },
  {
    name: "Lineas verticales",
    includes: ["3084sa", "3085sa"],
  },
  {
    name: "Brochas circulares",
    includes: ["3087sa", "3088sa", "3089sa", "3090sa"],
  },
  {
    name: "Vasija geometrica",
    includes: ["3091sa"],
  },
  {
    name: "Niebla abstracta",
    includes: ["3097sa", "3098sa"],
  },
  {
    name: "Circulos gestuales",
    includes: ["3982"],
  },
  {
    name: "Trazos negros",
    includes: ["4325", "4328", "4828"],
  },
  {
    name: "Paisaje abstracto",
    includes: ["4342", "gall-21"],
  },
  {
    name: "Anillos de madera",
    includes: ["4381", "4382", "tree rings"],
  },
  {
    name: "Espiral gestual",
    includes: ["4388"],
  },
  {
    name: "Celdas organicas",
    includes: ["4423", "4424"],
  },
  {
    name: "Hierbas acuarela",
    includes: ["4407", "4408", "jay-13", "jay-15"],
  },
  {
    name: "Ramas abstractas",
    includes: ["ever-14", "ever-15"],
  },
  {
    name: "Hojas secas",
    includes: ["4816", "4818"],
  },
  {
    name: "Mandala blanco",
    includes: ["4830"],
  },
  {
    name: "Bloques horizontales",
    includes: ["4965", "4967"],
  },
  {
    name: "Bloque negro",
    includes: ["4964"],
  },
  {
    name: "Curvas monocromo",
    includes: ["4983"],
  },
  {
    name: "Arcos beige",
    includes: ["4988"],
  },
  {
    name: "Auto clasico",
    includes: ["4994"],
  },
  {
    name: "Auto de carrera",
    includes: ["4995"],
  },
  {
    name: "Manada de caballos",
    includes: ["4999"],
  },
  {
    name: "Relieve de placas",
    includes: ["5003", "5004"],
  },
  {
    name: "Magnolias blancas",
    includes: ["5005", "5110", "rol-542"],
  },
  {
    name: "Bloque gris",
    includes: ["5007"],
  },
  {
    name: "Cuadricula sepia",
    includes: ["5016", "5017"],
  },
  {
    name: "Piedras abstractas",
    includes: ["5018", "5019"],
  },
  {
    name: "Cuadros oscuros",
    includes: ["5020", "5021"],
  },
  {
    name: "Textura blanca",
    includes: ["5022", "5023"],
  },
  {
    name: "Bloques oscuros",
    includes: ["5025", "5204"],
  },
  {
    name: "Bloques superpuestos",
    includes: ["5030"],
  },
  {
    name: "Flores en bruma",
    includes: ["5031", "5032"],
  },
  {
    name: "Trazos verticales",
    includes: ["5034", "5035", "5114"],
  },
  {
    name: "Geometria natural",
    includes: ["5040", "5041"],
  },
  {
    name: "Lineas finas",
    includes: ["5047", "5048"],
  },
  {
    name: "Planos curvos",
    includes: ["5052", "5053"],
  },
  {
    name: "Cruces neutras",
    includes: ["5058", "5059"],
  },
  {
    name: "Caballos",
    includes: [
      "118481903",
      "121275790",
      "1449684001",
      "206805789",
      "505894643",
      "5207",
    ],
  },
  {
    name: "Cebras",
    includes: ["1201530585"],
  },
  {
    name: "Bruma calida",
    includes: ["5069", "5070"],
  },
  {
    name: "Arcos lineales",
    includes: ["5071", "5072"],
  },
  {
    name: "Marmol beige",
    includes: ["5078", "5079"],
  },
  {
    name: "Ramas de cardo",
    includes: ["5086", "5087"],
  },
  {
    name: "Ventanas abstractas",
    includes: ["5105", "5106"],
  },
  {
    name: "Plumeros naturales",
    includes: ["5107", "5196", "5197", "whatsapp image 2026-06-26", "xg 50 x 100"],
  },
  {
    name: "Ovalos superpuestos",
    includes: ["5117", "thez-1"],
  },
  {
    name: "Magnolia clara",
    includes: ["5125"],
  },
  {
    name: "Paisaje de costa",
    includes: [
      "1569670274",
      "1569670290",
      "1665845324",
      "4912",
      "5138",
      "673713283",
      "673713858",
      "673713973",
      "728601752",
      "ashe-2a",
      "ashe-2b",
    ],
  },
  {
    name: "Ondas suaves",
    includes: ["5133", "5134"],
  },
  {
    name: "Relieve floral",
    includes: ["5146", "5147"],
  },
  {
    name: "Bloques tierra",
    includes: ["5149", "5150"],
  },
  {
    name: "Horizonte con tinta",
    includes: ["5153"],
  },
  {
    name: "Flores translucidas",
    includes: ["5161", "5162"],
  },
  {
    name: "Geometria calida",
    includes: ["5165"],
  },
  {
    name: "Paisaje en bruma",
    includes: ["5177", "5178"],
  },
  {
    name: "Minimal negro",
    includes: ["5181", "5182"],
  },
  {
    name: "Moto clasica",
    includes: ["5198"],
  },
  {
    name: "Relieve circular",
    includes: ["5201", "5202"],
  },
  {
    name: "Escultura oval",
    includes: ["5221", "5222"],
  },
  {
    name: "Geometria negra",
    includes: ["5223", "5224", "5225"],
  },
  {
    name: "Capas circulares",
    includes: ["5238", "5239"],
  },
  {
    name: "Tulipanes claros",
    includes: ["5231"],
  },
  {
    name: "Flores silvestres",
    includes: ["5254", "5255"],
  },
  {
    name: "Tinta abstracta",
    includes: ["5278", "5279"],
  },
  {
    name: "Hojas crema",
    includes: ["5286", "5287"],
  },
  {
    name: "Sol argentino",
    includes: ["31431311"],
  },
  {
    name: "Circulo terracota",
    includes: ["alico-7"],
  },
  {
    name: "Abedul minimalista",
    includes: ["1139572313"],
  },
  {
    name: "Ramo claro",
    includes: ["artl-10", "artl-11"],
  },
  {
    name: "Retrato con turbante",
    includes: ["arts-439"],
  },
  {
    name: "Hortensias sepia",
    includes: ["digis-13", "digis-135"],
  },
  {
    name: "Flor negra",
    includes: ["dng-011", "dng-012", "dng-013"],
  },
  {
    name: "Retrato floral",
    includes: ["crea-61"],
  },
  {
    name: "Retrato dorado",
    includes: ["creat-1"],
  },
  {
    name: "Retrato con flor blanca",
    includes: ["daisy-1"],
  },
  {
    name: "Hojas talladas",
    includes: ["desig-10", "desig-11"],
  },
  {
    name: "Flores verdes",
    includes: ["digis-1", "digis-2"],
  },
  {
    name: "Flor blanca en relieve",
    includes: ["forgio-1", "har -10"],
  },
  {
    name: "Hojas grises",
    includes: ["gray leaves"],
  },
  {
    name: "Lineas sobre papel",
    includes: ["happy-10", "happy-11", "happy-12", "happy-13"],
  },
  {
    name: "Circulos tierra",
    includes: ["happy-14", "happy-15"],
  },
  {
    name: "Bloques verticales",
    includes: ["haru-2"],
  },
  {
    name: "Olas sepia",
    includes: ["henk-215", "henk-216"],
  },
  {
    name: "Manchas tierra",
    includes: ["henk-435", "henk-437"],
  },
  {
    name: "Formas superpuestas",
    includes: ["henk-439", "henk-440"],
  },
  {
    name: "Cortes geometricos",
    includes: ["henk-441"],
  },
  {
    name: "Ventanas suaves",
    includes: ["henk-96", "henk-97"],
  },
  {
    name: "Bloques neutros",
    includes: [
      "henk-117",
      "henk-118",
      "henk-133",
      "henk-134",
      "henk-512",
      "henk-513",
      "henk-523",
      "henk-524",
      "henk-525",
      "henk-526",
      "henk-575",
      "henk-576",
      "henk-583",
      "henk-584",
      "henk-586",
      "henk-587",
      "henk-588",
      "henk-589",
      "image-14",
      "image-15",
      "mag-35",
      "mag-36",
    ],
  },
  {
    name: "Horizonte gris",
    includes: ["henk-566", "henk-567", "henk-590", "henk-591"],
  },
  {
    name: "Velos oscuros",
    includes: ["henk-594", "henk-595"],
  },
  {
    name: "Ovalos verdes",
    includes: ["henk-667"],
  },
  {
    name: "Flores blancas panoramicas",
    includes: ["5116", "auva-1"],
  },
  {
    name: "Flores blancas verticales",
    includes: ["lili-10"],
  },
  {
    name: "Cuadrados opticos",
    includes: ["lets-1"],
  },
  {
    name: "Flor blanca gigante",
    includes: ["5111", "rol-894"],
  },
  {
    name: "Retrato con flores naranjas",
    includes: ["mixi-10"],
  },
  {
    name: "Costa luminosa",
    includes: ["paper -4", "paper-1"],
  },
  {
    name: "Piezas de ajedrez",
    includes: ["soul"],
  },
  {
    name: "Patron terracota",
    includes: ["sty-2", "sty-3"],
  },
  {
    name: "Oxidos suaves",
    includes: ["found-10", "found-11", "5228"],
  },
  {
    name: "Textura de lineas",
    exact: ["1231232"],
  },
  {
    name: "Trazo curvo texturado",
    exact: ["124124"],
  },
  {
    name: "Circulos texturados",
    exact: ["124124212424", "4", "453643", "5645"],
  },
  {
    name: "Laberinto texturado",
    exact: ["124124244"],
  },
  {
    name: "Grilla texturada",
    exact: ["2", "24"],
  },
  {
    name: "Cruz texturada",
    exact: ["345"],
  },
  {
    name: "Circulo gestual texturado",
    exact: ["94"],
  },
  {
    name: "Lineas organicas texturadas",
    includes: ["whatsapp image 2026-06-23"],
  },
];

const fallbackDesignNameByThemeId = {
  abstracto: "Abstracto neutro",
  animales: "Figura animal",
  botanico: "Botanico natural",
  objetos: "Objeto decorativo",
  paisajes: "Paisaje sereno",
  retratos: "Retrato artistico",
  texturas: "Textura grafica",
  vehiculos: "Vehiculo clasico",
};

function readProductMetadata() {
  if (!existsSync(metadataPath)) {
    return new Map();
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  const products = Array.isArray(metadata.products) ? metadata.products : [];

  return new Map(
    products
      .filter(
        (item) =>
          typeof item.code === "string" &&
          typeof item.name === "string" &&
          validThemeIds.has(item.themeId),
      )
      .map((item) => [item.code, item]),
  );
}

const productMetadataByCode = readProductMetadata();

function isValidPriceOption(option) {
  return (
    option &&
    typeof option === "object" &&
    validPriceOptionIds.has(option.id) &&
    typeof option.label === "string" &&
    typeof option.shortLabel === "string" &&
    typeof option.price === "string" &&
    Number.isFinite(option.amountInThousands)
  );
}

function readMetadataPriceOptions(metadata) {
  if (!Array.isArray(metadata?.priceOptions)) {
    return undefined;
  }

  const priceOptions = metadata.priceOptions.filter(isValidPriceOption);

  return priceOptions.length > 0 ? priceOptions : undefined;
}

function normalizeName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferThemeId(config, stem) {
  if (config.themeId) {
    return config.themeId;
  }

  const normalizedStem = normalizeName(stem).toLowerCase();
  const rule = themeRules.find((item) =>
    item.includes.some((keyword) => normalizedStem.includes(keyword)),
  );

  return rule?.id ?? "abstracto";
}

function inferDesignInfo(stem, themeId) {
  const normalizedStem = normalizeName(stem).toLowerCase();
  const rule = designRules.find((item) =>
    item.exact?.some((keyword) => normalizedStem === keyword.toLowerCase()) ||
    item.includes?.some((keyword) =>
      normalizedStem.includes(keyword.toLowerCase()),
    ),
  );
  const baseName = rule?.name ?? fallbackDesignNameByThemeId[themeId];

  return {
    baseName,
    groupId: slugify(rule?.name ?? `${themeId}-${baseName}`),
  };
}

function makeVariantKey(stem) {
  const normalized = normalizeName(stem)
    .toLowerCase()
    .replace(/\(copy\)/g, "")
    .replace(/\b\d+\s*x\s*\d+\b/g, "")
    .replace(/\bedit\b/g, "")
    .replace(/\bnew\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || normalizeName(stem).toLowerCase();
}

function makeDisplayName(baseName, variantIndex, variantCount) {
  if (variantCount <= 1) {
    return baseName;
  }

  return `${baseName} ${String(variantIndex).padStart(3, "0")}`;
}

function getCodePrefix(config) {
  return config.codePrefix ?? config.measureCode;
}

function getExistingCodeInfo(fileName, codePrefix) {
  const stem = path.basename(fileName, path.extname(fileName));
  const match = normalizeName(stem).match(
    new RegExp(`^${escapeRegExp(codePrefix)}-(\\d{3})$`, "i"),
  );

  if (!match) {
    return null;
  }

  return {
    code: `${codePrefix}-${match[1]}`,
    number: Number(match[1]),
  };
}

function makeCode(prefix, position) {
  return `${prefix}-${String(position).padStart(3, "0")}`;
}

function makeImportPath(filePath) {
  const relativePath = path
    .relative(projectRoot, filePath)
    .split(path.sep)
    .join("/");

  return `@/${relativePath}`;
}

function listImages(config) {
  const folderPath = path.join(imagesRoot, config.folder);
  const codePrefix = getCodePrefix(config);

  if (!existsSync(folderPath)) {
    return [];
  }

  return readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isFile()) {
        return false;
      }

      return validExtensions.has(path.extname(entry.name).toLowerCase());
    })
    .map((entry) => ({
      entry,
      existingCode: getExistingCodeInfo(entry.name, codePrefix),
    }))
    .sort((a, b) => {
      if (a.existingCode && b.existingCode) {
        return a.existingCode.number - b.existingCode.number;
      }

      if (a.existingCode) {
        return -1;
      }

      if (b.existingCode) {
        return 1;
      }

      return a.entry.name.localeCompare(b.entry.name, "es", {
        numeric: true,
        sensitivity: "base",
      });
    })
    .map(({ entry, existingCode }) => {
      const filePath = path.join(folderPath, entry.name);
      const stem = path.basename(entry.name, path.extname(entry.name));
      const themeId = inferThemeId(config, stem);
      const design = inferDesignInfo(stem, themeId);

      return {
        codePrefix,
        designBaseName: design.baseName,
        designGroupId: design.groupId,
        existingCode: existingCode?.code,
        filePath,
        imageName: normalizeName(stem),
        importPath: makeImportPath(filePath),
        measureCode: config.measureCode,
        themeId,
      };
    });
}

const assets = folderConfigs.flatMap(listImages);
const usedCodeNumbersByPrefix = new Map();

function getUsedCodeNumbers(prefix) {
  const current = usedCodeNumbersByPrefix.get(prefix);

  if (current) {
    return current;
  }

  const next = new Set();
  usedCodeNumbersByPrefix.set(prefix, next);

  return next;
}

function getCodeNumber(code) {
  const match = code.match(/-(\d{3})$/);

  return match ? Number(match[1]) : null;
}

const resolvedAssets = assets.map((asset) => {
  const usedNumbers = getUsedCodeNumbers(asset.codePrefix);

  if (asset.existingCode) {
    const existingNumber = getCodeNumber(asset.existingCode);

    if (!existingNumber || usedNumbers.has(existingNumber)) {
      throw new Error(`Duplicated product code: ${asset.existingCode}`);
    }

    usedNumbers.add(existingNumber);

    return {
      ...asset,
      code: asset.existingCode,
    };
  }

  let nextNumber = 1;

  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  usedNumbers.add(nextNumber);

  return {
    ...asset,
    code: makeCode(asset.codePrefix, nextNumber),
  };
});

const variantIndexesByGroup = new Map();

const assetsWithMetadata = resolvedAssets.map((asset) => {
  const metadata = productMetadataByCode.get(asset.code);

  if (!metadata) {
    return asset;
  }

  return {
    ...asset,
    imageName: metadata.name,
    metadataName: metadata.name,
    priceOptions: readMetadataPriceOptions(metadata),
    themeId: metadata.themeId,
  };
});

assetsWithMetadata.forEach((asset) => {
  if (asset.metadataName) {
    return;
  }

  const group =
    variantIndexesByGroup.get(asset.designGroupId) ??
    new Map();
  const variantKey = makeVariantKey(asset.imageName);

  if (!group.has(variantKey)) {
    group.set(variantKey, group.size + 1);
  }

  variantIndexesByGroup.set(asset.designGroupId, group);
});

const namedAssets = assetsWithMetadata.map((asset) => {
  if (asset.metadataName) {
    return asset;
  }

  const group = variantIndexesByGroup.get(asset.designGroupId);
  const variantKey = makeVariantKey(asset.imageName);
  const variantIndex = group.get(variantKey);

  return {
    ...asset,
    imageName: makeDisplayName(asset.designBaseName, variantIndex, group.size),
  };
});

const imports = namedAssets
  .map((asset, index) => {
    const importName = `asset${String(index + 1).padStart(3, "0")}`;

    return `import ${importName} from ${JSON.stringify(asset.importPath)};`;
  })
  .join("\n");

const entries = namedAssets
  .map((asset, index) => {
    const importName = `asset${String(index + 1).padStart(3, "0")}`;

    return `  {
    code: ${JSON.stringify(asset.code)},
    image: ${importName},
    measureCode: ${JSON.stringify(asset.measureCode)},
    name: ${JSON.stringify(asset.imageName)},
    ${
      asset.priceOptions
        ? `priceOptions: ${JSON.stringify(asset.priceOptions)},\n    `
        : ""
    }themeId: ${JSON.stringify(asset.themeId)},
  },`;
  })
  .join("\n");

const output = `import type { StaticImageData } from "next/image";
${imports}

export type ProductAsset = {
  code: string;
  image: StaticImageData;
  measureCode: "XG" | "SGF" | "SG" | "DNG" | "TC" | "XGM" | "TEXTURADO";
  name: string;
  priceOptions?: readonly {
    id: "blanco" | "arpillera" | "base";
    label: string;
    shortLabel: string;
    price: string;
    amountInThousands: number;
  }[];
  themeId:
    | "abstracto"
    | "animales"
    | "botanico"
    | "objetos"
    | "paisajes"
    | "retratos"
    | "texturas"
    | "vehiculos";
};

export const productAssets = [
${entries}
] as const satisfies readonly ProductAsset[];
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
console.log(`Generated ${resolvedAssets.length} product assets.`);
