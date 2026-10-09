export const PILARES = [
  'ficar-sozinho',
  'xixi-no-lugar',
  'filhotes',
  'agitacao',
  'comandos-basicos',
  'rotina-e-limites',
  'adocao-e-racas',
] as const;

export type Pilar = (typeof PILARES)[number];

export interface PilarInfo {
  nome: string;
  descricao: string;
}

export const PILAR_INFO: Record<Pilar, PilarInfo> = {
  'ficar-sozinho': { nome: 'Ficar sozinho', descricao: 'Ansiedade de separação, chorar e destruir quando você sai.' },
  'xixi-no-lugar': { nome: 'Xixi no lugar', descricao: 'Ensinar o lugar certo e parar os acidentes em casa.' },
  'filhotes': { nome: 'Filhotes', descricao: 'Mordidas, socialização e os primeiros dias em casa.' },
  'agitacao': { nome: 'Agitação', descricao: 'Pular nas pessoas, latir e não conseguir se acalmar.' },
  'comandos-basicos': { nome: 'Comandos básicos', descricao: 'Senta, fica, vem e os comandos do dia a dia.' },
  'rotina-e-limites': { nome: 'Rotina e limites', descricao: 'Organizar o dia do cão e colocar limites com carinho.' },
  'adocao-e-racas': { nome: 'Adoção e raças', descricao: 'Escolher, adotar e entender o temperamento de cada cão.' },
};

/** Botões "nas palavras do tutor" no topo da home. */
export const BOTOES_TUTOR: { texto: string; pilar: Pilar }[] = [
  { texto: 'Chora quando eu saio', pilar: 'ficar-sozinho' },
  { texto: 'Faz xixi fora do lugar', pilar: 'xixi-no-lugar' },
  { texto: 'Pula em todo mundo', pilar: 'agitacao' },
  { texto: 'Filhote morde tudo', pilar: 'filhotes' },
  { texto: 'Não vem quando chamo', pilar: 'comandos-basicos' },
  { texto: 'Late para a campainha', pilar: 'agitacao' },
];
