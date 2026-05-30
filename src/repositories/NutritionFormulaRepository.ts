import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import {
  DOG_FOOD_OPTIONS,
  type DogFoodLifeStage,
  type DogFoodOption,
} from '@/src/lib/dogFoodOptions';

type NutritionFormulaDoc = {
  brand?: string;
  line?: string;
  phase?: string;
  version?: string;
  active?: boolean;
};

function normalizeText(value?: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeLifeStage(value?: string): DogFoodLifeStage {
  const normalized = normalizeText(value);
  if (normalized.includes('filh') || normalized.includes('puppy')) return 'Filhote';
  if (normalized.includes('senior') || normalized.includes('idos') || normalized.includes('ageing')) return 'Senior';
  return 'Adulto';
}

function dedupeOptions(options: DogFoodOption[]): DogFoodOption[] {
  const map = new Map<string, DogFoodOption>();

  for (const option of options) {
    const brand = option.brand.trim();
    const line = option.line.trim();
    if (!brand || !line) continue;
    map.set(`${brand.toLowerCase()}::${line.toLowerCase()}`, {
      brand,
      line,
      lifeStage: option.lifeStage,
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand, 'pt-BR');
    return brandCompare || a.line.localeCompare(b.line, 'pt-BR');
  });
}

export class NutritionFormulaRepository {
  static async getFoodOptions(): Promise<DogFoodOption[]> {
    try {
      const snap = await getDocs(query(collection(db, 'nutritionFormulas'), orderBy('brand', 'asc')));
      const options = snap.docs
        .map((formula) => formula.data() as NutritionFormulaDoc)
        .filter((formula) => formula.active !== false && formula.brand && formula.line)
        .map((formula) => ({
          brand: formula.brand || '',
          line: formula.line || '',
          lifeStage: normalizeLifeStage(formula.phase || formula.version || formula.line),
        }));

      return options.length ? dedupeOptions(options) : DOG_FOOD_OPTIONS;
    } catch (error) {
      console.warn('[NutritionFormulaRepository] Falha ao carregar nutritionFormulas; usando base local.', error);
      return DOG_FOOD_OPTIONS;
    }
  }
}

export function getBrandsFromOptions(options: DogFoodOption[]): string[] {
  return Array.from(new Set(options.map((item) => item.brand).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
}

export function getLinesFromOptions(options: DogFoodOption[]): string[] {
  return Array.from(new Set(options.map((item) => item.line).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
}

export function getLinesByBrandFromOptions(options: DogFoodOption[], brand: string): string[] {
  return options
    .filter((item) => item.brand === brand)
    .map((item) => item.line)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function getLifeStageFromOptions(
  options: DogFoodOption[],
  brand: string,
  line: string
): DogFoodLifeStage | undefined {
  return options.find((item) => item.brand === brand && item.line === line)?.lifeStage;
}
