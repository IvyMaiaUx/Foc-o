export const DOG_NAME_MAX_LENGTH = 24;
export const DOG_AGE_MAX_YEARS = 30;
export const DOG_WEIGHT_MAX_KG = 120;
export const DOG_LIFE_STAGE_OPTIONS = ['Filhote', 'Adulto', 'Sênior', 'Não sei'];
export const UNKNOWN_DOG_AGE = 'Não sei';

const PUPPY_AGE_OPTIONS = ['0-3 meses', '4-6 meses', '7-12 meses', UNKNOWN_DOG_AGE];
const ADULT_AGE_OPTIONS = ['1 ano', '2 anos', '3 anos', '4 anos', '5 anos', '6 anos', '7 anos', '8 anos', '9 anos', '10 anos', '11 anos', '12 anos', UNKNOWN_DOG_AGE];
const SENIOR_AGE_OPTIONS = ['7-9 anos', '10-12 anos', '13+ anos', UNKNOWN_DOG_AGE];

export const getDogAgeOptions = (lifeStage: string) => {
  if (lifeStage === 'Filhote') return PUPPY_AGE_OPTIONS;
  if (lifeStage === 'Adulto') return ADULT_AGE_OPTIONS;
  if (lifeStage === 'Senior' || lifeStage === 'Sênior') return SENIOR_AGE_OPTIONS;
  return [UNKNOWN_DOG_AGE];
};

export const sanitizeDogName = (value: string) =>
  value.replace(/\s{2,}/g, ' ').slice(0, DOG_NAME_MAX_LENGTH);

export const sanitizeIntegerInput = (value: string, max: number) => {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const asNumber = Number(digitsOnly);
  return String(Math.min(asNumber, max));
};

export const sanitizeDecimalInput = (value: string, max: number) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [integerPart, ...decimalParts] = normalized.split('.');
  const decimalPart = decimalParts.join('').slice(0, 1);

  let nextValue = decimalParts.length > 0 ? `${integerPart}.${decimalPart}` : integerPart;
  if (nextValue === '.') return '';

  const asNumber = Number(nextValue);
  if (Number.isFinite(asNumber) && asNumber > max) {
    nextValue = String(max);
  }

  return nextValue;
};

export const validateDogBasics = (fields: { name: string; age: string; weight: string }) => {
  const name = fields.name.trim();
  const weight = Number(fields.weight);

  if (!name || !fields.weight) {
    return 'Preencha nome e peso do cão.';
  }

  if (name.length > DOG_NAME_MAX_LENGTH) {
    return `O nome do cão deve ter no máximo ${DOG_NAME_MAX_LENGTH} caracteres.`;
  }

  const numericAge = Number(fields.age);
  const isLegacyNumericAge = /^\d+$/.test(fields.age) && numericAge >= 0 && numericAge <= DOG_AGE_MAX_YEARS;
  if (fields.age && !isLegacyNumericAge && !DOG_LIFE_STAGE_OPTIONS.includes(fields.age) && !getDogAgeOptions('Filhote').includes(fields.age) && !getDogAgeOptions('Adulto').includes(fields.age) && !getDogAgeOptions('Sênior').includes(fields.age) && fields.age !== 'Senior' && fields.age !== 'Nao sei') {
    return 'Selecione uma idade aproximada válida.';
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > DOG_WEIGHT_MAX_KG) {
    return `Informe um peso entre 0.1 e ${DOG_WEIGHT_MAX_KG} kg.`;
  }

  return null;
};

export const validateDogProfileEdit = (fields: { name: string; age: string; weight: string }) => {
  const name = fields.name.trim();
  const weight = Number(fields.weight);

  if (name.length > DOG_NAME_MAX_LENGTH) {
    return `O nome do cão deve ter no máximo ${DOG_NAME_MAX_LENGTH} caracteres.`;
  }

  const numericAge = Number(fields.age);
  const isLegacyNumericAge = /^\d+$/.test(fields.age) && numericAge >= 0 && numericAge <= DOG_AGE_MAX_YEARS;
  if (
    fields.age &&
    !isLegacyNumericAge &&
    !DOG_LIFE_STAGE_OPTIONS.includes(fields.age) &&
    !getDogAgeOptions('Filhote').includes(fields.age) &&
    !getDogAgeOptions('Adulto').includes(fields.age) &&
    !getDogAgeOptions('Sênior').includes(fields.age) &&
    fields.age !== 'Senior' &&
    fields.age !== 'Nao sei' &&
    fields.age !== 'Não sei'
  ) {
    return 'Selecione uma idade aproximada válida.';
  }

  if (fields.weight && (!Number.isFinite(weight) || weight <= 0 || weight > DOG_WEIGHT_MAX_KG)) {
    return `Informe um peso entre 0.1 e ${DOG_WEIGHT_MAX_KG} kg.`;
  }

  return null;
};
