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
    id: "dng-composiciones-lineales",
    label: "Composiciones lineales",
    codes: ["DNG-001", "DNG-002", "DNG-003"],
  },
  {
    id: "dng-curvas-negras",
    label: "Curvas negras",
    codes: ["DNG-004", "DNG-005"],
  },
  {
    id: "dng-bloques-grises",
    label: "Bloques grises",
    codes: ["DNG-006", "DNG-007"],
  },
  {
    id: "dng-anillos-madera",
    label: "Anillos de madera",
    codes: ["DNG-011", "DNG-012"],
  },
  {
    id: "dng-celdas-organicas",
    label: "Celdas organicas",
    codes: ["DNG-014", "DNG-015"],
  },
  {
    id: "dng-bloques-negros",
    label: "Bloques negros",
    codes: ["DNG-019", "DNG-020"],
  },
  {
    id: "dng-relieves-blancos",
    label: "Relieves blancos",
    codes: ["DNG-021", "DNG-022"],
  },
  {
    id: "dng-celdas-oxido",
    label: "Celdas oxido",
    codes: ["DNG-023", "DNG-024"],
  },
  {
    id: "dng-organicos-tierra",
    label: "Organicos tierra",
    codes: ["DNG-025", "DNG-026"],
  },
  {
    id: "dng-relieves-neutros",
    label: "Relieves neutros",
    codes: ["DNG-029", "DNG-030"],
  },
  {
    id: "dng-lineas-cruzadas",
    label: "Lineas cruzadas",
    codes: ["DNG-032", "DNG-033"],
  },
  {
    id: "dng-geometria-lineal",
    label: "Geometria lineal",
    codes: ["DNG-036", "DNG-037"],
  },
  {
    id: "dng-graficas-cruzadas",
    label: "Graficas cruzadas",
    codes: ["DNG-038", "DNG-039"],
  },
  {
    id: "dng-arcos-neutros",
    label: "Arcos neutros",
    codes: ["DNG-042", "DNG-043"],
  },
  {
    id: "dng-marmol-fluido",
    label: "Marmol fluido",
    codes: ["DNG-044", "DNG-045"],
  },
  {
    id: "dng-ramas-secas",
    label: "Ramas secas",
    codes: ["DNG-046", "DNG-047"],
  },
  {
    id: "dng-abstractos-cruz",
    label: "Abstractos cruz",
    codes: ["DNG-048", "DNG-049"],
  },
  {
    id: "dng-ondas-blancas",
    label: "Ondas blancas",
    codes: ["DNG-052", "DNG-053"],
  },
  {
    id: "dng-botanicos-relieve",
    label: "Botanicos relieve",
    codes: ["DNG-054", "DNG-055"],
  },
  {
    id: "dng-bloques-verticales",
    label: "Bloques verticales",
    codes: ["DNG-056", "DNG-057"],
  },
  {
    id: "dng-flores-sepia",
    label: "Flores sepia",
    codes: ["DNG-058", "DNG-059"],
  },
  {
    id: "dng-niebla-verde",
    label: "Niebla verde",
    codes: ["DNG-061", "DNG-062"],
  },
  {
    id: "dng-plumeros",
    label: "Plumeros",
    codes: ["DNG-063", "DNG-064"],
  },
  {
    id: "dng-circulos-grises",
    label: "Circulos grises",
    codes: ["DNG-065", "DNG-066"],
  },
  {
    id: "dng-piezas-ceramicas",
    label: "Piezas ceramicas",
    codes: ["DNG-067", "DNG-068"],
  },
  {
    id: "dng-botanicos-campo",
    label: "Botanicos campo",
    codes: ["DNG-071", "DNG-072"],
  },
  {
    id: "dng-botanicos-suaves",
    label: "Botanicos suaves",
    codes: ["DNG-075", "DNG-076"],
  },
  {
    id: "dng-hortensias-neutras",
    label: "Hortensias neutras",
    codes: ["DNG-077", "DNG-078"],
  },
  {
    id: "dng-flores-negras",
    label: "Flores negras",
    codes: ["DNG-079", "DNG-080", "DNG-081"],
  },
  {
    id: "dng-tramas-finas",
    label: "Tramas finas",
    codes: ["DNG-083", "DNG-084"],
  },
  {
    id: "dng-formas-madera",
    label: "Formas madera",
    codes: ["DNG-086", "DNG-087"],
  },
  {
    id: "dng-ajedrez",
    label: "Ajedrez",
    codes: ["DNG-088", "DNG-089", "DNG-090", "DNG-091", "DNG-092"],
  },
  {
    id: "dng-pampas",
    label: "Pampas",
    codes: ["DNG-095", "DNG-096"],
  },
  {
    id: "dng-ramas-verdes",
    label: "Ramas verdes",
    codes: ["DNG-097", "DNG-098"],
  },
  {
    id: "dng-horizontes-dorados",
    label: "Horizontes dorados",
    codes: ["DNG-099", "DNG-100"],
  },
  {
    id: "dng-horizontes-verdes",
    label: "Horizontes verdes",
    codes: ["DNG-101", "DNG-102"],
  },
  {
    id: "dng-puntos-circulares",
    label: "Puntos circulares",
    codes: ["DNG-103", "DNG-104"],
  },
  {
    id: "dng-trazos-negros",
    label: "Trazos negros",
    codes: ["DNG-105", "DNG-106"],
  },
  {
    id: "dng-hojas-verdes",
    label: "Hojas verdes",
    codes: ["DNG-109", "DNG-110"],
  },
  {
    id: "dng-geometria-curva",
    label: "Geometria curva",
    codes: ["DNG-111", "DNG-112"],
  },
  {
    id: "dng-hojas-minimas",
    label: "Hojas minimas",
    codes: ["DNG-113", "DNG-114"],
  },
  {
    id: "dng-botanicos-grises",
    label: "Botanicos grises",
    codes: ["DNG-115", "DNG-116"],
  },
  {
    id: "dng-arcos-cobre",
    label: "Arcos cobre",
    codes: ["DNG-117", "DNG-118"],
  },
  {
    id: "dng-hojas-doradas",
    label: "Hojas doradas",
    codes: ["DNG-119", "DNG-120"],
  },
  {
    id: "dng-playa-nubes",
    label: "Playa nubes",
    codes: ["DNG-121", "DNG-122"],
  },
  {
    id: "dng-circulos-dorados",
    label: "Circulos dorados",
    codes: ["DNG-123", "DNG-124"],
  },
  {
    id: "dng-bloques-tierra",
    label: "Bloques tierra",
    codes: ["DNG-125", "DNG-126"],
  },
  {
    id: "dng-horizonte-textura",
    label: "Horizonte textura",
    codes: ["DNG-127", "DNG-128"],
  },
  {
    id: "dng-caminos-playa",
    label: "Caminos playa",
    codes: ["DNG-129", "DNG-130"],
  },
  {
    id: "dng-pastizales-playa",
    label: "Pastizales playa",
    codes: ["DNG-131", "DNG-132"],
  },
  {
    id: "dng-playa-byn",
    label: "Playa blanco y negro",
    codes: ["DNG-137", "DNG-139"],
  },
  {
    id: "sg-collage-tierra",
    label: "Collage tierra",
    codes: ["SG-007", "SG-008"],
  },
  {
    id: "sgf-abstractos-tierra",
    label: "Abstractos tierra",
    codes: ["SGF-005", "SGF-006"],
  },
  {
    id: "sgf-cortes-madera",
    label: "Cortes de madera",
    codes: ["SGF-007", "SGF-008", "SGF-009"],
  },
  {
    id: "tc-composiciones-lineales",
    label: "Composiciones lineales",
    codes: ["TC-001", "TC-002", "TC-003"],
  },
  {
    id: "tc-horizontes-calidos",
    label: "Horizontes calidos",
    codes: ["TC-004", "TC-005", "TC-006"],
  },
  {
    id: "tc-escultura-arcilla",
    label: "Escultura arcilla",
    codes: ["TC-007", "TC-008", "TC-009", "TC-010", "TC-015", "TC-016", "TC-017", "TC-018"],
  },
  {
    id: "tc-relieves-blancos",
    label: "Relieves blancos",
    codes: ["TC-011", "TC-012", "TC-013", "TC-014"],
  },
  {
    id: "tc-lineas-fluidas",
    label: "Lineas fluidas",
    codes: ["TC-019", "TC-020", "TC-021"],
  },
  {
    id: "tc-horizontes-dorados",
    label: "Horizontes dorados",
    codes: ["TC-022", "TC-023"],
  },
  {
    id: "tc-horizontes-verdes",
    label: "Horizontes verdes",
    codes: ["TC-024", "TC-025"],
  },
  {
    id: "tc-bloques-grises",
    label: "Bloques grises",
    codes: ["TC-026", "TC-027"],
  },
  {
    id: "tc-puntos-circulares",
    label: "Puntos circulares",
    codes: ["TC-028", "TC-029"],
  },
  {
    id: "tc-lineas-neutras",
    label: "Lineas neutras",
    codes: ["TC-032", "TC-033"],
  },
  {
    id: "tc-geometria-negra",
    label: "Geometria negra",
    codes: ["TC-034", "TC-035", "TC-036"],
  },
  {
    id: "tc-trazos-negros",
    label: "Trazos negros",
    codes: ["TC-037", "TC-038"],
  },
  {
    id: "tc-tramas-verticales",
    label: "Tramas verticales",
    codes: ["TC-040", "TC-041", "TC-061"],
  },
  {
    id: "tc-gestos-negros",
    label: "Gestos negros",
    codes: ["TC-042", "TC-043", "TC-044", "TC-045"],
  },
  {
    id: "tc-niebla-tierra",
    label: "Niebla tierra",
    codes: ["TC-047", "TC-048"],
  },
  {
    id: "tc-hierbas-ilustradas",
    label: "Hierbas ilustradas",
    codes: ["TC-049", "TC-050", "TC-056", "TC-057"],
  },
  {
    id: "tc-flores-bruma",
    label: "Flores en bruma",
    codes: ["TC-051", "TC-052"],
  },
  {
    id: "tc-geometria-dorada",
    label: "Geometria dorada",
    codes: ["TC-053", "TC-054", "TC-055"],
  },
  {
    id: "tc-graficos-rojos",
    label: "Graficos rojos",
    codes: ["TC-058", "TC-059"],
  },
  {
    id: "tc-capas-papel",
    label: "Capas papel",
    codes: ["TC-062", "TC-063"],
  },
  {
    id: "tc-lineas-blancas",
    label: "Lineas blancas",
    codes: ["TC-065", "TC-066"],
  },
  {
    id: "tc-circulos-tramados",
    label: "Circulos tramados",
    codes: ["TC-067", "TC-068", "TC-069"],
  },
  {
    id: "tc-puertas-oxido",
    label: "Puertas oxido",
    codes: ["TC-070", "TC-071"],
  },
  {
    id: "tc-relieve-topografico",
    label: "Relieve topografico",
    codes: ["TC-072", "TC-073"],
  },
  {
    id: "tc-aves-verdes",
    label: "Aves verdes",
    codes: ["TC-074", "TC-075"],
  },
  {
    id: "tc-botanicos-claros",
    label: "Botanicos claros",
    codes: ["TC-078", "TC-079"],
  },
  {
    id: "tc-ondas-tierra",
    label: "Ondas tierra",
    codes: ["TC-080", "TC-081"],
  },
  {
    id: "tc-circulos-verdes",
    label: "Circulos verdes",
    codes: ["TC-076", "TC-082"],
  },
  {
    id: "texturado-grillas-negras",
    label: "Grillas negras",
    codes: ["TEXTURADO-001", "TEXTURADO-003"],
  },
  {
    id: "texturado-circulos-organicos",
    label: "Circulos organicos",
    codes: ["TEXTURADO-002", "TEXTURADO-008"],
  },
  {
    id: "texturado-gestos-negros",
    label: "Gestos negros",
    codes: ["TEXTURADO-004", "TEXTURADO-005"],
  },
  {
    id: "texturado-radiales-arpillera",
    label: "Radiales arpillera",
    codes: ["TEXTURADO-006", "TEXTURADO-011"],
  },
  {
    id: "texturado-tramas-lineales",
    label: "Tramas lineales",
    codes: ["TEXTURADO-009", "TEXTURADO-010"],
  },
  {
    id: "texturado-lineas-organicas",
    label: "Lineas organicas",
    codes: ["TEXTURADO-012", "TEXTURADO-013"],
  },
  {
    id: "xg-flores-blancas",
    label: "Flores blancas",
    codes: ["XG-010", "XG-019", "XG-057"],
  },
  {
    id: "xg-playas-grises",
    label: "Playas grises",
    codes: ["XG-022", "XG-050"],
  },
  {
    id: "xg-pasarelas-playa",
    label: "Pasarelas playa",
    codes: ["XG-040", "XG-041"],
  },
  {
    id: "xg-trazos-neutros",
    label: "Trazos neutros",
    codes: ["XG-065", "XG-066"],
  },
  {
    id: "xg-hojas-grises",
    label: "Hojas grises",
    codes: ["XG-069", "XG-070"],
  },
  {
    id: "xg-bloques-grises",
    label: "Bloques grises",
    codes: ["XG-078", "XG-079"],
  },
  {
    id: "xg-bloques-tierra",
    label: "Bloques tierra",
    codes: ["XG-110", "XG-111"],
  },
  {
    id: "xg-playas-calidas",
    label: "Playas calidas",
    codes: ["XG-117", "XG-118"],
  },
  {
    id: "xg-abstractos-neutros",
    label: "Abstractos neutros",
    codes: ["XG-137", "XG-138"],
  },
  {
    id: "xg-plumeros",
    label: "Plumeros",
    codes: ["XG-139", "XG-140"],
  },
  {
    id: "xgm-playa-pasarela-amanecer",
    label: "Playa pasarela amanecer",
    codes: ["XGM-001", "XGM-002"],
  },
  {
    id: "xgm-curvas-brocha-neutras",
    label: "Curvas brocha neutras",
    codes: ["XGM-004", "XGM-005", "XGM-011", "XGM-012"],
  },
  {
    id: "xgm-arcos-madera",
    label: "Arcos madera",
    codes: ["XGM-006", "XGM-007"],
  },
  {
    id: "xgm-circulos-negros",
    label: "Circulos negros",
    codes: ["XGM-008", "XGM-009"],
  },
  {
    id: "xgm-lineas-marron",
    label: "Lineas marron",
    codes: ["XGM-014", "XGM-015"],
  },
  {
    id: "xgm-estratos-tierra",
    label: "Estratos tierra",
    codes: ["XGM-017", "XGM-018"],
  },
  {
    id: "xgm-horizonte-textura",
    label: "Horizonte textura",
    codes: ["XGM-019", "XGM-020"],
  },
  {
    id: "xgm-bloques-luz",
    label: "Bloques luz",
    codes: ["XGM-027", "XGM-028"],
  },
  {
    id: "xgm-curvas-geometricas",
    label: "Curvas geometricas",
    codes: ["XGM-030", "XGM-031"],
  },
  {
    id: "xgm-bloques-negros",
    label: "Bloques negros",
    codes: ["XGM-033", "XGM-034"],
  },
  {
    id: "xgm-relieves-hoja",
    label: "Relieves hoja",
    codes: ["XGM-038", "XGM-039"],
  },
  {
    id: "xgm-barcos-blancos",
    label: "Barcos blancos",
    codes: ["XGM-040", "XGM-041"],
  },
  {
    id: "xgm-gestos-pluma",
    label: "Gestos pluma",
    codes: ["XGM-047", "XGM-049", "XGM-169", "XGM-170"],
  },
  {
    id: "xgm-cintas-negras",
    label: "Cintas negras",
    codes: ["XGM-050", "XGM-051"],
  },
  {
    id: "xgm-pinceladas-blancas",
    label: "Pinceladas blancas",
    codes: ["XGM-052", "XGM-053"],
  },
  {
    id: "xgm-collage-neutro",
    label: "Collage neutro",
    codes: ["XGM-055", "XGM-056"],
  },
  {
    id: "xgm-collage-tierra",
    label: "Collage tierra",
    codes: ["XGM-058", "XGM-059"],
  },
  {
    id: "xgm-arcos-suaves",
    label: "Arcos suaves",
    codes: ["XGM-060", "XGM-061"],
  },
  {
    id: "xgm-rectangulos-neutros",
    label: "Rectangulos neutros",
    codes: ["XGM-064", "XGM-065", "XGM-070", "XGM-071"],
  },
  {
    id: "xgm-rectangulos-verdes",
    label: "Rectangulos verdes",
    codes: ["XGM-066", "XGM-067"],
  },
  {
    id: "xgm-horizontes-negros",
    label: "Horizontes negros",
    codes: ["XGM-068", "XGM-069"],
  },
  {
    id: "xgm-surf-byn",
    label: "Surf blanco y negro",
    codes: ["XGM-072", "XGM-073"],
  },
  {
    id: "xgm-rectangulos-tierra",
    label: "Rectangulos tierra",
    codes: ["XGM-074", "XGM-075"],
  },
  {
    id: "xgm-ondas-tierra",
    label: "Ondas tierra",
    codes: ["XGM-078", "XGM-079"],
  },
  {
    id: "xgm-lineas-cruzadas",
    label: "Lineas cruzadas",
    codes: ["XGM-087", "XGM-088"],
  },
  {
    id: "xgm-bruma-calida",
    label: "Bruma calida",
    codes: ["XGM-089", "XGM-090"],
  },
  {
    id: "xgm-bloques-blancos",
    label: "Bloques blancos",
    codes: ["XGM-096", "XGM-097"],
  },
  {
    id: "xgm-circulos-grises",
    label: "Circulos grises",
    codes: ["XGM-098", "XGM-099"],
  },
  {
    id: "xgm-hojas-relieve",
    label: "Hojas relieve",
    codes: ["XGM-102", "XGM-103"],
  },
  {
    id: "xgm-playas-horizontales",
    label: "Playas horizontales",
    codes: ["XGM-109", "XGM-110", "XGM-111"],
  },
  {
    id: "xgm-playa-pasarela",
    label: "Playa pasarela",
    codes: ["XGM-113", "XGM-114"],
  },
  {
    id: "xgm-botanicos-suaves",
    label: "Botanicos suaves",
    codes: ["XGM-116", "XGM-117"],
  },
  {
    id: "xgm-dunas",
    label: "Dunas",
    codes: ["XGM-119", "XGM-120"],
  },
  {
    id: "xgm-relieves-hojas",
    label: "Relieves hojas",
    codes: ["XGM-124", "XGM-125"],
  },
  {
    id: "xgm-flores-acuarela",
    label: "Flores acuarela",
    codes: ["XGM-126", "XGM-127"],
  },
  {
    id: "xgm-lineas-finas",
    label: "Lineas finas",
    codes: ["XGM-129", "XGM-130"],
  },
  {
    id: "xgm-geometria-madera",
    label: "Geometria madera",
    codes: ["XGM-134", "XGM-135"],
  },
  {
    id: "xgm-bloques-abstractos",
    label: "Bloques abstractos",
    codes: ["XGM-141", "XGM-142"],
  },
  {
    id: "xgm-pinceladas-neutras",
    label: "Pinceladas neutras",
    codes: ["XGM-143", "XGM-144"],
  },
  {
    id: "xgm-bloques-textura",
    label: "Bloques textura",
    codes: ["XGM-145", "XGM-146"],
  },
  {
    id: "xgm-horizonte-gris",
    label: "Horizonte gris",
    codes: ["XGM-147", "XGM-148"],
  },
  {
    id: "xgm-velos-neutros",
    label: "Velos neutros",
    codes: ["XGM-149", "XGM-150"],
  },
  {
    id: "xgm-bloques-rectangulares",
    label: "Bloques rectangulares",
    codes: ["XGM-154", "XGM-155"],
  },
  {
    id: "xgm-paisajes-bruma",
    label: "Paisajes bruma",
    codes: ["XGM-157", "XGM-158"],
  },
  {
    id: "xgm-lineas-fluidas",
    label: "Lineas fluidas",
    codes: ["XGM-159", "XGM-160", "XGM-161"],
  },
  {
    id: "xgm-lineas-neutras",
    label: "Lineas neutras",
    codes: ["XGM-163", "XGM-164"],
  },
  {
    id: "xgm-geometria-negra",
    label: "Geometria negra",
    codes: ["XGM-165", "XGM-166", "XGM-167"],
  },
  {
    id: "xgm-niebla-marron",
    label: "Niebla marron",
    codes: ["XGM-172", "XGM-173"],
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
