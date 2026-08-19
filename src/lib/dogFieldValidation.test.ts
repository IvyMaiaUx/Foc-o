import { describe, it, expect } from 'vitest';
import { validateDogBasics } from './dogFieldValidation';

const base = { name: 'Skankk', age: '4-6 meses', weight: '8.5' };

describe('validateDogBasics', () => {
  it('aceita o preenchimento completo', () => {
    expect(validateDogBasics(base)).toBeNull();
  });

  it('cobra só o peso quando é só o peso que falta', () => {
    expect(validateDogBasics({ ...base, weight: '' })).toBe('Preencha o peso do cão.');
  });

  it('cobra só o nome quando é só o nome que falta', () => {
    expect(validateDogBasics({ ...base, name: '   ' })).toBe('Preencha o nome do cão.');
  });

  it('cita os dois campos quando os dois estão vazios', () => {
    expect(validateDogBasics({ ...base, name: '', weight: '' })).toBe('Preencha o nome e o peso do cão.');
  });

  it('continua validando faixa de peso', () => {
    expect(validateDogBasics({ ...base, weight: '0' })).toMatch(/peso entre/);
    expect(validateDogBasics({ ...base, weight: '999' })).toMatch(/peso entre/);
  });

  it('continua validando a idade selecionada', () => {
    expect(validateDogBasics({ ...base, age: 'ontem' })).toBe('Selecione uma idade aproximada válida.');
  });
});
