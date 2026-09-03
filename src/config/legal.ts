/**
 * Fonte única dos documentos legais.
 *
 * O texto dos três documentos vive em `src/content/legal/`, escrito em markdown,
 * com marcadores `{{chave}}` que são substituídos pelos valores daqui. Assim os
 * dados que se repetem (razão social, CNPJ, prazos) ficam num lugar só — mudar
 * o CNPJ é editar uma linha, não caçar ocorrência em três documentos.
 *
 * ATENÇÃO: enquanto `LEGAL_PENDENCIAS` não estiver vazio, os documentos ainda
 * têm lacuna e NÃO devem ir para produção.
 */

/**
 * Versão de cada documento. O aceite gravado no cadastro guarda estas strings,
 * então o histórico de quem aceitou o quê continua rastreável. Ao mudar o texto
 * de forma relevante, suba a versão aqui.
 */
export const LEGAL_VERSIONS = {
  termos: '1.0',
  privacidade: '2.0',
  cookies: '1.0',
} as const;

export const LEGAL_URLS = {
  termos: '/termos',
  privacidade: '/privacidade',
  cookies: '/cookies',
} as const;

export const LEGAL_TITULOS = {
  termos: 'Termos de Uso',
  privacidade: 'Política de Privacidade',
  cookies: 'Política de Cookies',
} as const;

export type LegalDocId = keyof typeof LEGAL_VERSIONS;

/** Marcador usado nos campos que ainda não foram preenchidos. */
const PENDENTE = '[PREENCHER]';

/**
 * Dados do controlador. Tudo que está como PENDENTE precisa ser preenchido
 * antes de publicar — são os campos que só a operação do Focão tem.
 */
export const EMPRESA = {
  razaoSocial: PENDENTE,
  cnpj: PENDENTE,
  endereco: PENDENTE,
  /** Pessoa encarregada pelo tratamento de dados (art. 41 da LGPD). */
  encarregada: PENDENTE,
  emailContato: 'contato@focaoapp.com.br',
  emailPrivacidade: 'privacidade@focaoapp.com.br',
} as const;

/**
 * Prazos citados nos documentos. Cada um vira uma obrigação assumida por
 * escrito, então preencha com o que a operação consegue cumprir de verdade.
 */
export const PRAZOS = {
  /**
   * Eliminação dos dados após a exclusão da conta. É síncrona: o app apaga as
   * 17 subcoleções, o documento do usuário, os arquivos do Storage e a conta no
   * Auth, nessa ordem, antes de retornar.
   */
  eliminacao: 'imediata',
  /** Retenção de lead de e-book sem interação. */
  leads: PENDENTE,
  /** Antecedência do aviso de mudança nos Termos. */
  avisoMudanca: PENDENTE,
  /** Novas tentativas de cobrança antes de suspender o acesso. */
  tentativasCobranca: PENDENTE,
  /** Análise de um pedido de reembolso. */
  analiseReembolso: '3 dias úteis',
  /**
   * Prazo para acionarmos o estorno depois de aprovar o pedido. Não confundir
   * com o tempo até o valor aparecer no extrato: esse depende da operadora do
   * cartão de cada pessoa e está numa linha separada do documento.
   */
  estorno: '1 dia útil',
  /** Resposta do suporte. */
  respostaSuporte: '2 dias úteis',
  /** Sobrescrita dos backups. */
  backup: PENDENTE,
} as const;

/** Horário de atendimento do suporte, como aparece nos Termos. */
export const HORARIO_ATENDIMENTO = PENDENTE;

/** Pontos que dependem de confirmação externa. */
export const TERCEIROS = {
  /** País de tratamento da Kirvano. */
  kirvanoPais: PENDENTE,
  /** Quem figura como fornecedor perante o consumidor na venda dos e-books. */
  kirvanoPapel: PENDENTE,
  /** Região onde o projeto Supabase está hospedado. */
  supabaseRegiao: PENDENTE,
  /** Endereço do regulamento do Indique e Ganhe. */
  urlRegulamentoIndique: PENDENTE,
} as const;

/** Data de última atualização exibida no topo dos documentos. */
export const LEGAL_ATUALIZADO_EM = PENDENTE;

/** Valores injetados nos `{{marcadores}}` do markdown. */
export const LEGAL_VALORES: Record<string, string> = {
  razaoSocial: EMPRESA.razaoSocial,
  cnpj: EMPRESA.cnpj,
  endereco: EMPRESA.endereco,
  encarregada: EMPRESA.encarregada,
  emailContato: EMPRESA.emailContato,
  emailPrivacidade: EMPRESA.emailPrivacidade,
  atualizadoEm: LEGAL_ATUALIZADO_EM,
  versaoTermos: LEGAL_VERSIONS.termos,
  versaoPrivacidade: LEGAL_VERSIONS.privacidade,
  versaoCookies: LEGAL_VERSIONS.cookies,
  prazoEliminacao: PRAZOS.eliminacao,
  prazoLeads: PRAZOS.leads,
  prazoAvisoMudanca: PRAZOS.avisoMudanca,
  prazoTentativasCobranca: PRAZOS.tentativasCobranca,
  prazoAnaliseReembolso: PRAZOS.analiseReembolso,
  prazoEstorno: PRAZOS.estorno,
  prazoRespostaSuporte: PRAZOS.respostaSuporte,
  prazoBackup: PRAZOS.backup,
  horarioAtendimento: HORARIO_ATENDIMENTO,
  kirvanoPais: TERCEIROS.kirvanoPais,
  kirvanoPapel: TERCEIROS.kirvanoPapel,
  supabaseRegiao: TERCEIROS.supabaseRegiao,
  urlRegulamentoIndique: TERCEIROS.urlRegulamentoIndique,
};

/** Campos ainda não preenchidos. Vazio = documentos prontos para publicar. */
export const LEGAL_PENDENCIAS = Object.entries(LEGAL_VALORES)
  .filter(([, valor]) => valor === PENDENTE)
  .map(([chave]) => chave);

export const LEGAL_PUBLICAVEL = LEGAL_PENDENCIAS.length === 0;
