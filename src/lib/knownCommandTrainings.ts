const KNOWN_COMMAND_TRAINING_IDS: Record<string, string[]> = {
  senta: ['b2-t1'],
  deita: ['b2-t2'],
  fica: ['b2-t3'],
  vem: ['b2-t5'],
  junto: ['b4-t1'],
  solta: ['b3-t3'],
  'nao pular': ['b3-t4'],
  toca: ['b9-t1'],
  gira: ['b9-t2'],
  buscar: ['b9-t4'],
  'busca por faro': ['b9-t5']
};

function normalizeCommand(command: string): string {
  return command
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function knownCommandTrainingIds(knownCommands: string[] = []): Set<string> {
  const trainingIds = new Set<string>();

  for (const command of knownCommands) {
    for (const trainingId of KNOWN_COMMAND_TRAINING_IDS[normalizeCommand(command)] || []) {
      trainingIds.add(trainingId);
    }
  }

  return trainingIds;
}

export function filterKnownCommandTrainings(trainingIds: string[], knownCommands: string[] = []): string[] {
  const skippedTrainingIds = knownCommandTrainingIds(knownCommands);
  return trainingIds.filter(trainingId => !skippedTrainingIds.has(trainingId));
}
