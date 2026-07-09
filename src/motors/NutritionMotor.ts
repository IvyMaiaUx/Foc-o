import { DogProfile } from '../types';
import { NUTRITION_DATABASE, NutritionTableRow } from '../lib/nutritionBase';

const normalizeStr = (str?: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export class NutritionMotor {
  static interpolateWeight(weight: number, table: NutritionTableRow[], activityColumn: 'lowActivityGrams' | 'normalActivityGrams' | 'highActivityGrams'): number {
    if (table.length === 0) return 0;
    
    // Sort table just in case
    const sorted = [...table].sort((a, b) => a.weightKg - b.weightKg);

    // If below min, extrapolate or use min
    if (weight <= sorted[0].weightKg) {
      return sorted[0][activityColumn] || sorted[0].normalActivityGrams;
    }

    // If above max, extrapolate or use max
    if (weight >= sorted[sorted.length - 1].weightKg) {
      return sorted[sorted.length - 1][activityColumn] || sorted[sorted.length - 1].normalActivityGrams;
    }

    // Find the two points to interpolate between
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (weight >= p1.weightKg && weight <= p2.weightKg) {
        const v1 = p1[activityColumn] || p1.normalActivityGrams;
        const v2 = p2[activityColumn] || p2.normalActivityGrams;
        
        // Linear interpolation
        const fraction = (weight - p1.weightKg) / (p2.weightKg - p1.weightKg);
        return v1 + fraction * (v2 - v1);
      }
    }

    return 0;
  }

  static findFormula(dog: DogProfile) {
    const dBrand = normalizeStr(dog.foodBrand);
    const dLine = normalizeStr(dog.foodLine);
    const dStage = normalizeStr(dog.lifeStage);
    const dVersion = normalizeStr(dog.foodVersion);

    if (!dBrand) {
      return { match: undefined, confidence: 'low' as const };
    }

    const matches = [];

    for (const f of NUTRITION_DATABASE) {
      let score = 0;
      let exactBrand = false;
      let exactLine = false;
      let exactStage = false;
      let exactVersion = false;

      const fBrand = normalizeStr(f.brand);
      const fBrandAliases = (f.brandAliases || []).map(normalizeStr);
      
      const isExactBrand = fBrand === dBrand || fBrandAliases.includes(dBrand);
      const isFuzzyBrand = fBrand.includes(dBrand) || dBrand.includes(fBrand) || fBrandAliases.some(a => dBrand.includes(a));
      
      if (isExactBrand) {
        score += 15;
        exactBrand = true;
      } else if (isFuzzyBrand) {
        score += 10;
      } else {
        continue;
      }

      const fLine = normalizeStr(f.line);
      const fLineAliases = (f.lineAliases || []).map(normalizeStr);
      if (dLine) {
        if (fLine === dLine || fLineAliases.includes(dLine)) {
          score += 10;
          exactLine = true;
        } else if (fLine.includes(dLine) || dLine.includes(fLine) || fLineAliases.some(a => dLine.includes(a))) {
          score += 5;
        }
      }

      const fStage = normalizeStr(f.lifeStage);
      const fStageAliases = (f.lifeStageAliases || []).map(normalizeStr);
      if (dStage) {
        if (fStage === dStage || fStageAliases.includes(dStage)) {
          score += 5;
          exactStage = true;
        } else if (fStage.includes(dStage) || dStage.includes(fStage) || fStageAliases.some(a => dStage.includes(a))) {
          score += 3;
        }
      }

      const fVersion = normalizeStr(f.version);
      const fVersionAliases = (f.versionAliases || []).map(normalizeStr);
      if (dVersion) {
        if (fVersion === dVersion || fVersionAliases.includes(dVersion)) {
          score += 3;
          exactVersion = true;
        } else if (fVersion.includes(dVersion) || dVersion.includes(fVersion) || fVersionAliases.some(a => dVersion.includes(a))) {
          score += 1;
        }
      }

      matches.push({ formula: f, score, exactBrand, exactLine, exactStage, exactVersion });
    }

    if (matches.length === 0) {
      return { match: undefined, confidence: 'low' as const };
    }

    matches.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.exactBrand !== b.exactBrand) return a.exactBrand ? -1 : 1;
      if (a.exactLine !== b.exactLine) return a.exactLine ? -1 : 1;
      if (a.exactStage !== b.exactStage) return a.exactStage ? -1 : 1;
      if (a.exactVersion !== b.exactVersion) return a.exactVersion ? -1 : 1;
      return 0;
    });

    const best = matches[0];
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    if (best.exactBrand && best.exactLine && best.exactStage) {
      confidence = 'high';
    } else if (best.exactBrand && (best.exactLine || best.score >= 15)) {
      confidence = 'medium';
    }

    return { match: best.formula, confidence };
  }

  static calculateFood(dog: DogProfile | null) {
    const defaultMeta = { weightUsed: 0, activityLevel: 'Normal', mealsPerDay: 2, confidence: 'low' as 'high' | 'medium' | 'low', formulaName: '' };
    if (!dog || !dog.weight) return { daily: 0, perMeal: 0, fallsback: true, meta: defaultMeta };
    const weight = parseFloat(dog.weight);
    if (isNaN(weight) || weight <= 0) return { daily: 0, perMeal: 0, fallsback: true, meta: defaultMeta };
    
    // Parse meals per day
    let meals = 2; // Default
    if (dog.mealsPerDay) {
      const parsedMeals = parseInt(dog.mealsPerDay.replace(/[^0-9]/g, ''));
      if (!isNaN(parsedMeals) && parsedMeals > 0) meals = parsedMeals;
    }

    // Determine activity level column
    let activityColumn: 'lowActivityGrams' | 'normalActivityGrams' | 'highActivityGrams' = 'normalActivityGrams';
    let activityLabel = 'Normal';
    // energyLevel é salvo como 'low' | 'medium' | 'high' (onboarding/EditarPerfil).
    // Mantemos fallback para strings PT legadas por segurança com dados antigos.
    const energy = String(dog.energyLevel || '').toLowerCase();
    if (energy === 'low' || energy === 'baixa' || energy === 'muito calma') {
      activityColumn = 'lowActivityGrams';
      activityLabel = 'Baixa';
    } else if (energy === 'high' || energy === 'alta' || energy === 'muito alta' || energy === 'inesgotável') {
       activityColumn = 'highActivityGrams';
       activityLabel = 'Alta';
    }

    const { match: formula, confidence } = this.findFormula(dog);
    const meta = { weightUsed: weight, activityLevel: activityLabel, mealsPerDay: meals, confidence, formulaName: '' };

    if (formula) {
      const dailyGrams = Math.round(this.interpolateWeight(weight, formula.table, activityColumn));
      
      if (dailyGrams > 0) {
        const perMeal = Math.round(dailyGrams / meals);
        return { daily: dailyGrams, perMeal, fallsback: false, meta: { ...meta, formulaName: `${formula.brand} ${formula.line} ${formula.lifeStage}` } };
      }
    }

    // Fallback formula: RER = 70 * (weight ^ 0.75)
    // Daily Energy Requirement (~1.6 x RER for average adult dog)
    // Modify multiplier based on activity
    let multiplier = 1.6;
    if (activityColumn === 'lowActivityGrams') multiplier = 1.4;
    if (activityColumn === 'highActivityGrams') multiplier = 1.8;

    const rer = 70 * Math.pow(weight, 0.75);
    const der = rer * multiplier; 
    
    // Assuming standard kibble is around 3.5 kcal/gram (3500 kcal/kg)
    const dailyGramsFallback = Math.round(der / 3.5);
    const perMealFallback = Math.round(dailyGramsFallback / meals);
    
    return { daily: dailyGramsFallback, perMeal: perMealFallback, fallsback: true, meta: { ...meta, confidence: 'low' as 'high' | 'medium' | 'low' } };
  }
}
