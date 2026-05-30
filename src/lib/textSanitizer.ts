import type { TrainingTask } from '@/src/types';

const QUESTION_MARK_REPLACEMENTS: Array<[RegExp, string]> = [
  [/M\?o/g, 'Mão'],
  [/m\?o/g, 'mão'],
  [/Veterin\?rio/g, 'Veterinário'],
  [/veterin\?rio/g, 'veterinário'],
  [/Pr\?ximo/g, 'Próximo'],
  [/pr\?ximo/g, 'próximo'],
  [/Pr\?ximas/g, 'Próximas'],
  [/pr\?ximas/g, 'próximas'],
  [/Pr\?ximos/g, 'Próximos'],
  [/pr\?ximos/g, 'próximos'],
  [/Sa\?da/g, 'Saída'],
  [/sa\?da/g, 'saída'],
  [/Sa\?das/g, 'Saídas'],
  [/sa\?das/g, 'saídas'],
  [/Preven\?\?o/g, 'Prevenção'],
  [/preven\?\?o/g, 'prevenção'],
  [/Aten\?\?o/g, 'Atenção'],
  [/aten\?\?o/g, 'atenção'],
  [/Consolida\?\?o/g, 'Consolidação'],
  [/consolida\?\?o/g, 'consolidação'],
  [/Evolu\?\?o/g, 'Evolução'],
  [/evolu\?\?o/g, 'evolução'],
  [/Sess\?o/g, 'Sessão'],
  [/sess\?o/g, 'sessão'],
  [/Intera\?\?o/g, 'Interação'],
  [/intera\?\?o/g, 'interação'],
  [/Refei\?\?o/g, 'Refeição'],
  [/refei\?\?o/g, 'refeição'],
  [/Libera\?\?o/g, 'Liberação'],
  [/libera\?\?o/g, 'liberação'],
  [/Posi\?\?o/g, 'Posição'],
  [/posi\?\?o/g, 'posição'],
  [/Aproxima\?\?o/g, 'Aproximação'],
  [/aproxima\?\?o/g, 'aproximação'],
  [/Distra\?\?o/g, 'Distração'],
  [/distra\?\?o/g, 'distração'],
  [/Frustra\?\?o/g, 'Frustração'],
  [/frustra\?\?o/g, 'frustração'],
  [/Socializa\?\?o/g, 'Socialização'],
  [/socializa\?\?o/g, 'socialização'],
  [/Vacina\?\?o/g, 'Vacinação'],
  [/vacina\?\?o/g, 'vacinação'],
  [/Rea\?\?o/g, 'Reação'],
  [/rea\?\?o/g, 'reação'],
  [/Rela\?\?o/g, 'Relação'],
  [/rela\?\?o/g, 'relação'],
  [/Situa\?\?es/g, 'Situações'],
  [/situa\?\?es/g, 'situações'],
  [/Conex\?o/g, 'Conexão'],
  [/conex\?o/g, 'conexão'],
  [/Conex\?\?o/g, 'Conexão'],
  [/conex\?\?o/g, 'conexão'],
  [/Obedi\?ncia/g, 'Obediência'],
  [/obedi\?ncia/g, 'obediência'],
  [/Dist\?ncia/g, 'Distância'],
  [/dist\?ncia/g, 'distância'],
  [/Sequ\?ncia/g, 'Sequência'],
  [/sequ\?ncia/g, 'sequência'],
  [/Consist\?ncia/g, 'Consistência'],
  [/consist\?ncia/g, 'consistência'],
  [/Perman\?ncia/g, 'Permanência'],
  [/perman\?ncia/g, 'permanência'],
  [/Independ\?ncia/g, 'Independência'],
  [/independ\?ncia/g, 'independência'],
  [/V\?nculo/g, 'Vínculo'],
  [/v\?nculo/g, 'vínculo'],
  [/Sa\?de/g, 'Saúde'],
  [/sa\?de/g, 'saúde'],
  [/F\?cil/g, 'Fácil'],
  [/f\?cil/g, 'fácil'],
  [/M\?dio/g, 'Médio'],
  [/m\?dio/g, 'médio'],
  [/Dif\?cil/g, 'Difícil'],
  [/dif\?cil/g, 'difícil'],
  [/Voc\?/g, 'Você'],
  [/voc\?/g, 'você'],
  [/N\?o/g, 'Não'],
  [/n\?o/g, 'não'],
  [/C\?o/g, 'Cão'],
  [/c\?o/g, 'cão'],
  // Nomes de treinos do plano
  [/Pux\?es/g, 'Puxões'],
  [/pux\?es/g, 'puxões'],
  [/Distra\?\?es/g, 'Distrações'],
  [/distra\?\?es/g, 'distrações'],
  [/Escova\?\?o/g, 'Escovação'],
  [/escova\?\?o/g, 'escovação'],
  [/M\?dias/g, 'Médias'],
  [/m\?dias/g, 'médias'],
  [/Parado/g, 'Parado'],
  [/Junto \(Parado\)/g, 'Junto (Parado)'],
  [/Junto \(Poucos Passos\)/g, 'Junto (Poucos Passos)'],
  [/Junto \(Com Curvas\)/g, 'Junto (Com Curvas)'],
  [/Redirecionar Pux\?es/g, 'Redirecionar Puxões'],
  [/Passeio \(Distra\?\?es Leves\)/g, 'Passeio (Distrações Leves)'],
  [/Passeio \(Distra\?\?es M\?dias\)/g, 'Passeio (Distrações Médias)'],
  [/Escova\?\?o Calma/g, 'Escovação Calma'],
  [/Coleira sem Estresse/g, 'Coleira sem Estresse'],
  [/Toque \(Patas e Orelhas\)/g, 'Toque (Patas e Orelhas)'],
  [/Cuidados e Bem-Estar/g, 'Cuidados e Bem-Estar'],
  [/Passeio sem Puxar/g, 'Passeio sem Puxar'],
  [/Aten\?\?o/g, 'Atenção'],
  [/aten\?\?o/g, 'atenção'],
  [/Condi\?\?o/g, 'Condição'],
  [/condi\?\?o/g, 'condição'],
  [/Forma\?\?o/g, 'Formação'],
  [/forma\?\?o/g, 'formação'],
  [/Corre\?\?o/g, 'Correção'],
  [/corre\?\?o/g, 'correção'],
  [/Gest\?o/g, 'Gestão'],
  [/gest\?o/g, 'gestão'],
  [/Regula\?\?o/g, 'Regulação'],
  [/regula\?\?o/g, 'regulação'],
  [/Reda\?\?o/g, 'Redação'],
  [/Composi\?\?o/g, 'Composição'],
  [/Constru\?\?o/g, 'Construção'],
  [/constru\?\?o/g, 'construção'],
  [/Execu\?\?o/g, 'Execução'],
  [/execu\?\?o/g, 'execução'],
  [/Exposi\?\?o/g, 'Exposição'],
  [/exposi\?\?o/g, 'exposição'],
  [/Instru\?\?o/g, 'Instrução'],
  [/instru\?\?o/g, 'instrução'],
  [/Introdu\?\?o/g, 'Introdução'],
  [/introdu\?\?o/g, 'introdução'],
  [/Produ\?\?o/g, 'Produção'],
  [/produ\?\?o/g, 'produção'],
  [/Redu\?\?o/g, 'Redução'],
  [/redu\?\?o/g, 'redução'],
  [/Repeti\?\?o/g, 'Repetição'],
  [/repeti\?\?o/g, 'repetição'],
  [/Solu\?\?o/g, 'Solução'],
  [/solu\?\?o/g, 'solução'],
  [/Transi\?\?o/g, 'Transição'],
  [/transi\?\?o/g, 'transição'],
  [/fun\?\?o/g, 'função'],
  [/Fun\?\?o/g, 'Função'],
  [/infor\?\?o/g, 'informação'],
  [/Informa\?\?o/g, 'Informação'],
  [/informa\?\?o/g, 'informação'],
  [/Alimenta\?\?o/g, 'Alimentação'],
  [/alimenta\?\?o/g, 'alimentação'],
  [/Explora\?\?o/g, 'Exploração'],
  [/explora\?\?o/g, 'exploração'],
  [/Generaliza\?\?o/g, 'Generalização'],
  [/generaliza\?\?o/g, 'generalização'],
  [/Regres\?o/g, 'Regressão'],
  [/Motiva\?\?o/g, 'Motivação'],
  [/motiva\?\?o/g, 'motivação'],
  [/Percep\?\?o/g, 'Percepção'],
  [/percep\?\?o/g, 'percepção'],
  [/Cria\?\?o/g, 'Criação'],
  [/cria\?\?o/g, 'criação'],
  [/Integra\?\?o/g, 'Integração'],
  [/integra\?\?o/g, 'integração'],
  [/Adapta\?\?o/g, 'Adaptação'],
  [/adapta\?\?o/g, 'adaptação'],
  [/Concentra\?\?o/g, 'Concentração'],
  [/concentra\?\?o/g, 'concentração'],
  [/Observa\?\?o/g, 'Observação'],
  [/observa\?\?o/g, 'observação'],
  [/Apresenta\?\?o/g, 'Apresentação'],
  [/apresenta\?\?o/g, 'apresentação'],
  [/opera\?\?o/g, 'operação'],
  [/Coopera\?\?o/g, 'Cooperação'],
  [/coopera\?\?o/g, 'cooperação'],
  [/Coordena\?\?o/g, 'Coordenação'],
  [/coordena\?\?o/g, 'coordenação'],
  [/Delimita\?\?o/g, 'Delimitação'],
  [/Coloca\?\?o/g, 'Colocação'],
  [/coloca\?\?o/g, 'colocação'],
  [/Negocia\?\?o/g, 'Negociação'],
  [/Associa\?\?o/g, 'Associação'],
  [/associa\?\?o/g, 'associação'],
];

const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/â€¢/g, '-'],
  [/â€“/g, '-'],
  [/â€”/g, '-'],
  [/â€˜/g, "'"],
  [/â€™/g, "'"],
  [/â€œ/g, '"'],
  [/â€/g, '"'],
];

function repairMojibake(text: string) {
  if (!/[ÃÂâ]/.test(text) || typeof TextDecoder === 'undefined') return text;

  try {
    const bytes = Uint8Array.from(Array.from(text), (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const decodedScore = (decoded.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;
    const originalScore = (text.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;
    const hasFewerArtifacts = (decoded.match(/[ÃÂâ]/g) || []).length < (text.match(/[ÃÂâ]/g) || []).length;

    return decodedScore >= originalScore && hasFewerArtifacts ? decoded : text;
  } catch {
    return text;
  }
}

export function sanitizeText(text?: string | null) {
  if (!text) return '';

  let current = text;

  for (let i = 0; i < 3; i += 1) {
    current = repairMojibake(current);

    for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
      current = current.replace(pattern, replacement);
    }

    for (const [pattern, replacement] of QUESTION_MARK_REPLACEMENTS) {
      current = current.replace(pattern, replacement);
    }
  }

  return current;
}

export function sanitizeTrainingTask(task: TrainingTask): TrainingTask {
  return {
    ...task,
    title: sanitizeText(task.title),
    module: sanitizeText(task.module),
    moduleName: sanitizeText(task.moduleName),
    description: sanitizeText(task.description),
    steps: (task.steps || []).map(sanitizeText),
  };
}
