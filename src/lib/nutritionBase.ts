export interface NutritionTableRow {
  weightKg: number;
  lowActivityGrams?: number;
  normalActivityGrams: number;
  highActivityGrams?: number;
}

export interface FoodFormula {
  id: string;
  brand: string;      // Ex: "PremieR"
  brandAliases?: string[]; // Ex: ["premier", "premiere"]
  line: string;       // Ex: "Formula", "Golden", "Seleção Natural"
  lineAliases?: string[];
  lifeStage: string;  // "Filhote", "Adulto", "Sênior"
  lifeStageAliases?: string[];
  version: string;    // "Padrão", "Castrado", "Light", "Sensível"
  versionAliases?: string[];
  kcalPerKg: number;
  table: NutritionTableRow[];
  notes?: string;
}

// Exemplos de fórmulas reais para teste
export const NUTRITION_DATABASE: FoodFormula[] = [
  {
    id: "premier_formula_adulto_padrao",
    brand: "PremieR",
    brandAliases: ["premier", "premiere", "premio"],
    line: "Fórmula Natural", // Changing this to make it clearer
    lineAliases: ["formula", "formula natural", "fórmula"],
    lifeStage: "Adulto",
    lifeStageAliases: ["adultos", "adult"],
    version: "Padrão",
    versionAliases: ["padrao", "normal", "original"],
    kcalPerKg: 3980,
    table: [
      { weightKg: 2, normalActivityGrams: 45, highActivityGrams: 55 },
      { weightKg: 5, normalActivityGrams: 90, highActivityGrams: 110 },
      { weightKg: 10, normalActivityGrams: 155, highActivityGrams: 190 },
      { weightKg: 15, normalActivityGrams: 210, highActivityGrams: 250 },
      { weightKg: 20, normalActivityGrams: 260, highActivityGrams: 310 },
      { weightKg: 25, normalActivityGrams: 305, highActivityGrams: 370 },
      { weightKg: 30, normalActivityGrams: 350, highActivityGrams: 420 },
      { weightKg: 40, normalActivityGrams: 435, highActivityGrams: 520 },
      { weightKg: 50, normalActivityGrams: 515, highActivityGrams: 615 },
    ],
    notes: "PremieR Formula Adultos Raças Médias e Grandes"
  },
  {
    id: "premier_formula_adulto_castrado",
    brand: "PremieR",
    line: "Formula",
    lifeStage: "Adulto",
    version: "Castrado",
    kcalPerKg: 3600,
    table: [
      { weightKg: 10, lowActivityGrams: 135, normalActivityGrams: 155 },
      { weightKg: 15, lowActivityGrams: 180, normalActivityGrams: 210 },
      { weightKg: 20, lowActivityGrams: 225, normalActivityGrams: 260 },
      { weightKg: 25, lowActivityGrams: 265, normalActivityGrams: 310 },
      { weightKg: 30, lowActivityGrams: 305, normalActivityGrams: 355 },
      { weightKg: 40, lowActivityGrams: 380, normalActivityGrams: 440 },
    ],
    notes: "PremieR Ambientes Internos Cães Castrados - Adultos"
  },
  {
    id: "royal_canin_maxi_adulto",
    brand: "Royal Canin",
    line: "Maxi",
    lifeStage: "Adulto",
    version: "Padrão",
    kcalPerKg: 3803,
    table: [
      { weightKg: 26, lowActivityGrams: 275, normalActivityGrams: 318, highActivityGrams: 361 },
      { weightKg: 30, lowActivityGrams: 306, normalActivityGrams: 354, highActivityGrams: 402 },
      { weightKg: 35, lowActivityGrams: 343, normalActivityGrams: 397, highActivityGrams: 452 },
      { weightKg: 40, lowActivityGrams: 379, normalActivityGrams: 439, highActivityGrams: 499 },
      { weightKg: 44, lowActivityGrams: 408, normalActivityGrams: 472, highActivityGrams: 536 },
    ],
    notes: "Royal Canin Maxi Adult"
  }
];
