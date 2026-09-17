import type { ForecastRow, Material } from '../domain/types'
import type { UnitCode } from '../domain/units'

/**
 * Seed data. Material codes, descriptions, units and orders of magnitude are
 * taken from the planner's live `MRP-Jun'26` workbook so the numbers read as
 * real to anyone who knows the process.
 *
 * The real extract holds 1,691 materials (1,401 packaging / 245 chemical /
 * 45 raw) across 10 units. This is a representative slice covering every tag,
 * both supply bands and each exception type.
 */

interface Seed {
  code: string
  description: string
  unit: UnitCode
  category: string
  uom: string
  tag: 0 | 1 | 2 | 3 | 4
  tagSubclass?: string
  lifecycle?: 'active' | 'discontinued'
  source: 'local' | 'import'
  band: 'monthly' | 'weekly'
  leadTimeDays: number
  safetyDays?: number
  moq: number
  bundle: number | null
  pallet: number | null
  price: number
  fgCode?: string
  bomFactor?: number
  soh: number
  openPo: number
  consumption: number[]
  whSpacePallets?: number
}

// Lead times observed on the whiteboard: 7 days local, 90 days import.
// Safety days default to 45, hardcoded in the workbook as "MSL in UOM (45+LT days)".
const SAFETY_DAYS = 45

const SEEDS: Seed[] = [
  // --- OAT: Quaker / Nura oats packaging -------------------------------------
  {
    code: 'FPOAALUPOL099', description: 'Aluminium Peel-Off Lid 99mm', unit: 'OAT',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 500_000, bundle: 50_000, pallet: 50_000, price: 0.21,
    soh: 1_180_000, openPo: 0,
    consumption: [936_429, 960_968, 861_574, 1_494_170, 1_656_219, 919_657, 1_010_223, 986_540, 1_102_338, 875_119, 940_882, 1_021_774],
  },
  {
    code: 'FPOATQKRTN501', description: 'Can (Quaker) 500Gms Oats', unit: 'OAT',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 200_000, bundle: 20_000, pallet: 20_000, price: 1.34,
    soh: 210_400, openPo: 120_000,
    consumption: [927_489, 599_316, 558_001, 934_979, 1_066_812, 694_935, 712_004, 688_220, 733_110, 690_442, 705_980, 698_311],
  },
  {
    code: 'FPOAJUQRPE900', description: 'PET Jar (Quaker) 900 gms', unit: 'OAT',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 2_000, pallet: 2_000, price: 1.85,
    soh: 41_200, openPo: 0, whSpacePallets: 18,
    consumption: [86_732, 146_468, 194_325, 291_647, 85_913, 142_508, 151_220, 138_904, 160_331, 149_772, 143_015, 155_884],
  },
  {
    code: 'FPOAJUQRCP900', description: 'PET Jar Cap (Quaker) 900 gms', unit: 'OAT',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 2_000, pallet: 2_000, price: 0.32,
    soh: 208_400, openPo: 60_000, whSpacePallets: 24,
    consumption: [86_725, 146_485, 194_334, 291_669, 85_948, 142_514, 150_998, 139_220, 160_044, 149_331, 142_880, 155_610],
  },
  {
    code: 'FPOATLIDYW099', description: 'Lid 99mm Yellow Color', unit: 'OAT',
    category: 'Packaging Material', uom: 'ea', tag: 4, lifecycle: 'discontinued',
    source: 'import', band: 'monthly', leadTimeDays: 90, moq: 500_000, bundle: 50_000,
    pallet: 50_000, price: 0.19, soh: 33_689, openPo: 0,
    consumption: [0, 0, 0, 50_408, 33_689, 0, 0, 0, 0, 0, 0, 0],
  },

  // --- NFM: flour bags --------------------------------------------------------
  {
    code: 'FPWF1JRSXKG50', description: 'PP Bag Wheat Flour #1 50Kg Jenan (Red Strip)', unit: 'NFM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 5_000, pallet: 5_000, price: 1.12,
    fgCode: 'FSFLNFF1BG150', bomFactor: 20, soh: 62_000, openPo: 10_000, whSpacePallets: 22,
    consumption: [214_000, 198_500, 221_300, 205_800, 233_100, 219_400, 208_900, 227_600, 215_200, 209_700, 224_800, 218_300],
  },
  {
    code: 'FPWF1JRSXKG10', description: 'PP Bag Wheat Flour #1 10Kg Jenan (Red Strip)', unit: 'NFM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 20_000, bundle: 10_000, pallet: 10_000, price: 0.46,
    fgCode: 'FSFLNFF1BG110', bomFactor: 100, soh: 148_000, openPo: 30_000, whSpacePallets: 20,
    consumption: [402_000, 388_400, 419_700, 396_200, 431_500, 408_800, 395_300, 424_100, 412_600, 399_900, 421_200, 415_700],
  },
  {
    code: 'FPWFC2AGPRO50', description: 'PP Bag Wheat Flour Chapati (2 Star) AGF Pro 50Kg', unit: 'NFM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 5_000, bundle: null, pallet: 5_000, price: 1.08,
    fgCode: 'FSFLNFC2BG150', bomFactor: 20, soh: 4_100, openPo: 5_000,
    consumption: [61_200, 58_900, 63_400, 59_800, 64_100, 60_700, 62_300, 61_900, 59_400, 63_800, 60_100, 62_600],
  },
  {
    code: 'FPHRBRAGFPP40', description: 'PP Bag Harris Brown 40Kg (AGF Logo)', unit: 'NFM',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 12_000, bundle: 2_000, pallet: 2_000, price: 0.98,
    soh: 8_400, openPo: 12_000,
    consumption: [44_100, 41_800, 46_200, 43_500, 47_900, 45_100, 42_700, 46_800, 44_300, 43_100, 45_900, 44_700],
  },
  {
    code: 'FPBMPPSHCR001', description: 'Paper Sheet 100x120', unit: 'NFM',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 1_200, bundle: 600, pallet: 600, price: 3.40,
    soh: 480, openPo: 1_200,
    consumption: [3_100, 2_880, 3_240, 2_960, 3_380, 3_050, 2_990, 3_310, 3_120, 2_940, 3_280, 3_160],
  },

  // --- FPM: pasta film and cartons -------------------------------------------
  {
    code: 'FPBMVEGASPCRN', description: 'Carton VEGA Spaghetti 400gm x 20Pcs', unit: 'FPM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 2_500, pallet: 2_500, price: 1.42,
    fgCode: 'FSPAVEGASP400', bomFactor: 50, soh: 18_400, openPo: 49_385, whSpacePallets: 16,
    consumption: [96_400, 88_200, 102_300, 94_100, 108_700, 99_500, 91_800, 104_200, 97_600, 93_300, 101_900, 98_800],
  },
  {
    code: 'FPMDMSPFL400N', description: 'Film Del Monte Spaghetti 400g (W-210mm x L-325mm)', unit: 'FPM',
    category: 'Packaging Material', uom: 'kg', tag: 0, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 500, bundle: 100, pallet: 500, price: 18.60,
    fgCode: 'FSPADMSPX400', bomFactor: 0.0062, soh: 210, openPo: 338,
    consumption: [1_240, 1_180, 1_320, 1_205, 1_390, 1_268, 1_192, 1_344, 1_276, 1_218, 1_352, 1_299],
  },
  {
    code: 'FPMMCSPFL400G', description: 'Film Master Chef Spaghetti 1.7mm 400gm 325x210mm', unit: 'FPM',
    category: 'Packaging Material', uom: 'kg', tag: 0, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 500, bundle: 100, pallet: 500, price: 17.90,
    fgCode: 'FSPAMCSPX400', bomFactor: 0.0061, soh: 96, openPo: 12,
    consumption: [880, 812, 934, 861, 978, 903, 842, 951, 897, 868, 942, 916],
  },
  {
    code: 'FPBMSDCRCR400', description: 'Carton Serendib Macaroni Cornetto Rigate 20x400gm', unit: 'FPM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 5_000, bundle: 1_000, pallet: 1_000, price: 1.28,
    fgCode: 'FSPASDCRX400', bomFactor: 50, soh: 2_100, openPo: 100,
    consumption: [14_200, 13_400, 15_100, 13_900, 15_800, 14_600, 13_700, 15_300, 14_400, 13_800, 15_000, 14_700],
  },
  {
    code: 'FPMPDSPFL024', description: 'Film Pasta Doro Spaghetti 400gm N.7 (1.7mm)', unit: 'FPM',
    category: 'Packaging Material', uom: 'kg', tag: 1, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 400, bundle: 100, pallet: 400, price: 17.20,
    soh: 0, openPo: 0,
    consumption: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  // --- EOP: edible oil packaging ---------------------------------------------
  {
    code: 'FPEOCNJR4X5L0', description: 'Jerry Can Canola 4x5 Ltr AMA', unit: 'EOP',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 2_000, pallet: 2_000, price: 4.15,
    fgCode: 'FSOICNAMA4X5', bomFactor: 50, soh: 22_600, openPo: 8_000, whSpacePallets: 14,
    consumption: [78_400, 72_100, 84_300, 76_800, 88_200, 80_500, 74_900, 86_100, 79_300, 75_600, 83_400, 81_200],
  },
  {
    code: 'FPEOCTAMA4X50', description: 'Carton AMA Canola 4x5 Ltr', unit: 'EOP',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 2_500, pallet: 2_500, price: 2.05,
    fgCode: 'FSOICNAMA4X5', bomFactor: 12.5, soh: 6_200, openPo: 0, whSpacePallets: 8,
    consumption: [19_600, 18_000, 21_100, 19_200, 22_000, 20_100, 18_700, 21_500, 19_800, 18_900, 20_800, 20_300],
  },
  {
    code: 'FCEOANOXBHT01', description: 'Anti-Oxidant BHT (Food Grade)', unit: 'EOP',
    category: 'Chemical', uom: 'kg', tag: 1, tagSubclass: 'Flour Additives / Enzymes',
    source: 'import', band: 'monthly', leadTimeDays: 90, moq: 500, bundle: 25, pallet: 500,
    price: 42.50, soh: 310, openPo: 0,
    consumption: [188, 172, 204, 181, 216, 195, 178, 209, 192, 184, 202, 198],
  },
  {
    code: 'FCEOPALMOIL05', description: 'Palm Oil Anti-Oxidant Blend 0.05%', unit: 'EOP',
    category: 'Chemical', uom: 'kg', tag: 1, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 1_000, bundle: 25, pallet: 1_000, price: 38.20,
    soh: 4_800, openPo: 2_000,
    consumption: [402, 368, 431, 389, 448, 411, 376, 438, 405, 392, 424, 416],
  },

  // --- JFM ---------------------------------------------------------------------
  {
    code: 'FPJFBGZ1XKG50', description: 'PP Bag Wheat Flour Zein #1 50Kg', unit: 'JFM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 20_000, bundle: 5_000, pallet: 5_000, price: 1.15,
    fgCode: 'FSFLJFZ1BG150', bomFactor: 20, soh: 71_500, openPo: 60_000,
    consumption: [188_400, 176_200, 194_800, 182_100, 201_300, 189_700, 178_500, 197_200, 186_400, 180_900, 192_600, 190_100],
  },
  {
    code: 'FPJFCTAGF1210', description: 'Carton AGF Flour 12x1Kg', unit: 'JFM',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 10_000, bundle: 2_000, pallet: 2_000, price: 1.65,
    soh: 3_400, openPo: 0, whSpacePallets: 6,
    consumption: [42_100, 38_900, 45_200, 40_800, 47_300, 43_100, 39_600, 46_100, 42_800, 40_200, 44_700, 43_900],
  },
  {
    code: 'FCJFENZAMYL01', description: 'Enzyme Alpha-Amylase (Chakki MG)', unit: 'JFM',
    category: 'Chemical', uom: 'kg', tag: 1, tagSubclass: 'Chakki MG ING',
    source: 'import', band: 'monthly', leadTimeDays: 90, moq: 200, bundle: 25, pallet: 200,
    price: 128.00, soh: 84, openPo: 0,
    consumption: [96, 88, 104, 92, 110, 99, 90, 106, 97, 93, 102, 101],
  },

  // --- AGFM: feed ---------------------------------------------------------------
  {
    code: 'FPFMBGLYR5001', description: 'PP Bag Hen Layer 17% Mash 50Kg', unit: 'AGFM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 20_000, bundle: 5_000, pallet: 5_000, price: 1.05,
    fgCode: 'FSHLGM17PP150', bomFactor: 20, soh: 34_200, openPo: 0,
    consumption: [128_400, 119_600, 134_200, 124_800, 138_900, 130_100, 121_400, 136_300, 127_900, 123_200, 133_600, 131_000],
  },
  {
    code: 'FPFMBGCHK5002', description: 'PP Bag Chick Developer Pellet 50Kg', unit: 'AGFM',
    category: 'Packaging Material', uom: 'ea', tag: 0, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 20_000, bundle: 5_000, pallet: 5_000, price: 1.02,
    fgCode: 'FSPDGF15PP150', bomFactor: 20, soh: 96_000, openPo: 40_000,
    consumption: [88_200, 82_400, 92_100, 85_900, 95_300, 89_600, 83_800, 93_700, 87_400, 84_900, 91_200, 90_100],
  },

  // --- AGLE / AGPP / AGHP -------------------------------------------------------
  {
    code: 'FPLETRWEGG300', description: 'Egg Tray 30 Cavity White', unit: 'AGLE',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'local', band: 'weekly',
    leadTimeDays: 7, moq: 20_000, bundle: 5_000, pallet: 5_000, price: 0.38,
    soh: 12_800, openPo: 0, whSpacePallets: 10,
    consumption: [184_200, 172_400, 196_100, 178_900, 204_300, 188_700, 174_600, 199_200, 186_100, 179_400, 193_800, 190_500],
  },
  {
    code: 'FPPPBGCHKN101', description: 'Poly Bag Whole Chicken 1.1Kg', unit: 'AGPP',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'import', band: 'monthly',
    leadTimeDays: 90, moq: 100_000, bundle: 20_000, pallet: 20_000, price: 0.14,
    soh: 88_000, openPo: 0,
    consumption: [312_400, 288_600, 331_200, 301_800, 344_100, 318_900, 294_200, 336_400, 308_700, 297_300, 327_800, 320_100],
  },
  {
    code: 'FPHPTRHATCH18', description: 'Hatchery Chick Box 100 Cap.', unit: 'AGHP',
    category: 'Packaging Material', uom: 'ea', tag: 1, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 5_000, bundle: 1_000, pallet: 1_000, price: 2.85,
    soh: 1_200, openPo: 0,
    consumption: [18_400, 17_200, 19_600, 17_900, 20_400, 18_800, 17_400, 19_900, 18_600, 17_800, 19_300, 19_000],
  },

  // --- Out of scope: tags 2, 3, 4 ------------------------------------------------
  {
    code: 'FRWHRUSXBK125', description: 'Wheat Russian 12.5 Pro (Bulk)', unit: 'NFM',
    category: 'Raw Material', uom: 'MT', tag: 2, source: 'import', band: 'monthly',
    leadTimeDays: 120, moq: 5_000, bundle: 1_000, pallet: null, price: 1_180,
    soh: 54_050, openPo: 139_930,
    consumption: [9_810, 9_995, 10_355, 10_560, 9_720, 10_120, 9_880, 10_240, 10_010, 9_940, 10_180, 10_070],
  },
  {
    code: 'FROACANXBK000', description: 'Canadian Oats (Bulk)', unit: 'OAT',
    category: 'Raw Material', uom: 'MT', tag: 2, source: 'import', band: 'monthly',
    leadTimeDays: 120, moq: 2_000, bundle: 500, pallet: null, price: 1_420,
    soh: 937, openPo: 8_000,
    consumption: [1_039, 2_389, 2_609, 1_447, 1_120, 1_284, 1_198, 1_356, 1_240, 1_180, 1_302, 1_265],
  },
  {
    code: 'FPCSCUSTLBL01', description: 'Customer Supplied Label — Private Brand', unit: 'FPM',
    category: 'Packaging Material', uom: 'ea', tag: 3, source: 'local', band: 'monthly',
    leadTimeDays: 7, moq: 0, bundle: 1_000, pallet: 1_000, price: 0,
    soh: 44_000, openPo: 0,
    consumption: [22_400, 20_800, 23_600, 21_500, 24_200, 22_100, 20_400, 23_800, 22_600, 21_200, 23_100, 22_800],
  },
  {
    code: 'FPOATRODTN300', description: 'Can (RODHA) 300Gms Oats', unit: 'OAT',
    category: 'Packaging Material', uom: 'ea', tag: 4, lifecycle: 'discontinued',
    source: 'import', band: 'monthly', leadTimeDays: 90, moq: 100_000, bundle: 20_000,
    pallet: 20_000, price: 1.18, soh: 0, openPo: 0,
    consumption: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
]

export const MATERIALS: readonly Material[] = SEEDS.map((s) => ({
  code: s.code,
  description: s.description,
  unit: s.unit,
  category: s.category,
  uom: s.uom,
  tag: s.tag,
  tagSubclass: s.tagSubclass,
  lifecycle: s.lifecycle ?? 'active',
  source: s.source,
  band: s.band,
  leadTimeDays: s.leadTimeDays,
  safetyDays: s.safetyDays ?? SAFETY_DAYS,
  moq: s.moq,
  bundle: s.bundle,
  pallet: s.pallet,
  price: s.price,
  fgCode: s.fgCode,
  bomFactor: s.bomFactor,
  soh: s.soh,
  openPo: s.openPo,
  consumption: s.consumption,
  whSpacePallets: s.whSpacePallets,
}))

/** Finished-goods forecast, keyed by FG code — the file Sales emails over. */
export const SEED_FORECAST: readonly ForecastRow[] = [
  { fgCode: 'FSFLNFF1BG150', unit: 'NFM', uom: 'MT', m0: 4_820, m1: 5_010, m2: 4_760, description: 'Wheat Flour #1 Jenan 50Kg' },
  { fgCode: 'FSFLNFF1BG110', unit: 'NFM', uom: 'MT', m0: 3_140, m1: 3_260, m2: 3_080, description: 'Flour #1 10Kg (Local)' },
  { fgCode: 'FSFLNFC2BG150', unit: 'NFM', uom: 'MT', m0: 1_420, m1: 1_380, m2: 1_450, description: 'Flour Chapati 2 Star 50Kg' },
  { fgCode: 'FSFLJFZ1BG150', unit: 'JFM', uom: 'MT', m0: 4_180, m1: 4_320, m2: 4_090, description: 'Wheat Flour Zein #1 50Kg' },
  { fgCode: 'FSPAVEGASP400', unit: 'FPM', uom: 'MT', m0: 1_240, m1: 1_310, m2: 1_180, description: 'VEGA Spaghetti 400gm' },
  { fgCode: 'FSPADMSPX400', unit: 'FPM', uom: 'MT', m0: 186_000, m1: 194_000, m2: 178_000, description: 'Del Monte Spaghetti 400g' },
  { fgCode: 'FSPAMCSPX400', unit: 'FPM', uom: 'MT', m0: 132_000, m1: 128_000, m2: 140_000, description: 'Master Chef Spaghetti 400gm' },
  { fgCode: 'FSPASDCRX400', unit: 'FPM', uom: 'MT', m0: 310, m1: 336, m2: 298, description: 'Serendib Cornetto Rigate 400gm' },
  { fgCode: 'FSOICNAMA4X5', unit: 'EOP', uom: 'MT', m0: 1_680, m1: 1_744, m2: 1_610, description: 'Canola 4x5 Ltr AMA' },
  { fgCode: 'FSHLGM17PP150', unit: 'AGFM', uom: 'MT', m0: 2_940, m1: 3_080, m2: 2_870, description: 'Hen Layer 17% Mash 50Kg' },
  { fgCode: 'FSPDGF15PP150', unit: 'AGFM', uom: 'MT', m0: 2_120, m1: 2_060, m2: 2_180, description: 'Chick Developer Pellet 50Kg' },
]
