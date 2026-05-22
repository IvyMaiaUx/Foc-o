export interface TrainingBlock {
  id: string;
  name: string;
  order: number;
}

export const BLOCKS: Record<string, TrainingBlock> = {
  'b1': { id: 'b1', name: 'Conexão e foco', order: 1 },
  'b2': { id: 'b2', name: 'Fundamentos da obediência', order: 2 },
  'b3': { id: 'b3', name: 'Autocontrole e frustração', order: 3 },
  'b4': { id: 'b4', name: 'Passeio sem puxar', order: 4 },
  'b5': { id: 'b5', name: 'Socialização e ambiente', order: 5 },
  'b6': { id: 'b6', name: 'Ansiedade e autonomia', order: 6 },
  'b7': { id: 'b7', name: 'Necessidades e rotina', order: 7 },
  'b8': { id: 'b8', name: 'Manejo doméstico e cooperação', order: 8 },
  'b9': { id: 'b9', name: 'Vínculo e truques úteis', order: 9 },
};
