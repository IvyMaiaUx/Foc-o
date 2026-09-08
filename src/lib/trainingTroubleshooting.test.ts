import { describe, it, expect } from 'vitest';
import {
  CAUSES_BY_BLOCK,
  FAILURE_CAUSES,
  countUnsuccessfulAttempts,
  getFailureCauses,
  getGuidance,
  getProfessionalHelpNote,
  shouldOfferProfessionalHelp,
} from './trainingTroubleshooting';
import { TRAINING_TEMPLATES } from './trainingTemplates';

/**
 * O risco deste arquivo não é lógica, é conteúdo faltando: um bloco novo de treinos
 * entra e o tutor que falha ali cai numa tela sem nenhuma opção. Estes testes existem
 * para que isso quebre no CI, e não na mão de quem está tentando treinar o cachorro.
 */
describe('cobertura dos blocos', () => {
  it('todo bloco que tem treino tem causas de falha', () => {
    const blocosComTreino = new Set(Object.values(TRAINING_TEMPLATES).map((t) => t.blockId));
    for (const blockId of blocosComTreino) {
      expect(CAUSES_BY_BLOCK[blockId as keyof typeof CAUSES_BY_BLOCK], `bloco ${blockId} sem causas`)
        .toBeDefined();
    }
  });

  it('toda causa referenciada por um bloco existe', () => {
    for (const [blockId, ids] of Object.entries(CAUSES_BY_BLOCK)) {
      for (const id of ids) {
        expect(FAILURE_CAUSES[id], `causa "${id}" citada em ${blockId} não existe`).toBeDefined();
      }
    }
  });

  it('nenhum bloco fica sem saída: "Simplesmente não fez" fecha todos', () => {
    for (const [blockId, ids] of Object.entries(CAUSES_BY_BLOCK)) {
      expect(ids, `bloco ${blockId} sem opção final`).toContain('nao_fez');
    }
  });

  it('toda causa cadastrada é usada por pelo menos um bloco', () => {
    const usadas = new Set(Object.values(CAUSES_BY_BLOCK).flat());
    for (const id of Object.keys(FAILURE_CAUSES)) {
      expect(usadas.has(id), `causa "${id}" está órfã`).toBe(true);
    }
  });
});

describe('getFailureCauses', () => {
  it('troca {nome} pelo nome do cão', () => {
    const opcoes = getFailureCauses('b6', 'Luna');
    expect(opcoes[0].label).toBe('Luna chorou ou latiu assim que saí');
  });

  it('sem nome, não deixa o token vazar para a tela', () => {
    for (const nome of [undefined, null, '', '   ']) {
      const opcoes = getFailureCauses('b6', nome);
      expect(opcoes.some((o) => o.label.includes('{nome}'))).toBe(false);
    }
  });

  it('bloco desconhecido cai no conjunto genérico em vez de vir vazio', () => {
    const opcoes = getFailureCauses('b99', 'Thor');
    expect(opcoes.length).toBeGreaterThan(0);
    expect(opcoes.map((o) => o.id)).toContain('nao_fez');
  });
});

describe('getGuidance', () => {
  it('usa o texto base quando o bloco não tem ajuste', () => {
    const base = getGuidance('agitado', 'b2', 'Thor');
    expect(base?.action).toContain('Corte a sessão pela metade');
  });

  it('usa o ajuste do bloco quando ele existe', () => {
    const b5 = getGuidance('agitado', 'b5', 'Thor');
    expect(b5?.action).toContain('distância');
    expect(b5?.action).not.toContain('Corte a sessão pela metade');
  });

  it('o ajuste parcial não apaga os campos que ele não sobrescreve', () => {
    const b4 = getGuidance('sem_atencao', 'b4', 'Thor');
    // b4 sobrescreve só `action`; `next` tem que continuar vindo da base.
    expect(b4?.next).toBe('Vamos repetir este treino, e ele volta pelo começo.');
  });

  it('causa inexistente devolve null em vez de quebrar a tela', () => {
    expect(getGuidance('nao_existe', 'b1', 'Thor')).toBeNull();
  });

  it('nenhuma orientação vaza o token {nome}', () => {
    for (const [blockId, ids] of Object.entries(CAUSES_BY_BLOCK)) {
      for (const id of ids) {
        const g = getGuidance(id, blockId, 'Luna');
        expect(`${g?.cause}${g?.action}${g?.next}`).not.toContain('{nome}');
      }
    }
  });
});

describe('sugestão de profissional', () => {
  const logs = [
    { trainingId: 'b6-t2', feedback: 'failed' },
    { trainingId: 'b6-t2', feedback: 'hard' },
    { trainingId: 'b6-t2', feedback: 'easy' },
    { trainingId: 'b2-t1', feedback: 'failed' },
  ];

  it('conta só as tentativas sem sucesso do mesmo treino', () => {
    expect(countUnsuccessfulAttempts(logs, 'b6-t2')).toBe(2);
    expect(countUnsuccessfulAttempts(logs, 'b2-t1')).toBe(1);
    expect(countUnsuccessfulAttempts(logs, 'b9-t1')).toBe(0);
  });

  it('não sugere na primeira nem na segunda — só na terceira', () => {
    expect(shouldOfferProfessionalHelp(1)).toBe(false);
    expect(shouldOfferProfessionalHelp(2)).toBe(false);
    expect(shouldOfferProfessionalHelp(3)).toBe(true);
  });

  it('reatividade e ansiedade têm texto próprio; o resto tem o genérico', () => {
    expect(getProfessionalHelpNote('b5').cause).toContain('Reatividade');
    expect(getProfessionalHelpNote('b6').cause).toContain('Ansiedade de separação');
    expect(getProfessionalHelpNote('b2').cause).toContain('Três tentativas');
  });

  it('nunca empurra a culpa para o tutor nem promete o que o app não faz', () => {
    for (const blockId of ['b2', 'b5', 'b6']) {
      const nota = getProfessionalHelpNote(blockId);
      expect(nota.action).toMatch(/adestrador|veterinário/);
      expect(nota.next).toContain('Focão continua');
    }
  });
});
