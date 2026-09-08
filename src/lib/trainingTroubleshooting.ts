/**
 * "E AGORA?" — orientação para quando o treino não funciona.
 *
 * Quando o tutor marca "Difícil" ou "Não concluí", o app pergunta O QUE aconteceu e
 * devolve um ajuste concreto. A regra interna: ninguém termina uma sessão sem saber
 * o que fazer depois.
 *
 * Por que causas e não textos por treino: as formas de falhar se repetem entre os 60
 * treinos ("subiu o critério rápido demais", "sessão longa demais", "a comida apareceu
 * antes do comportamento"). São ~12 causas cobrindo todos os blocos, com ajuste de
 * texto só onde o significado realmente muda de bloco para bloco.
 *
 * Ao adicionar um treino novo, nada precisa ser escrito aqui: basta que o bloco dele
 * exista em CAUSES_BY_BLOCK. O teste deste arquivo falha se um bloco ficar sem causas.
 */

export type TroubleshootingBlockId = 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' | 'b9';

export interface CauseGuidance {
  /** Por que isso costuma acontecer. Explica, não culpa. */
  cause: string;
  /** O que fazer na próxima sessão. Sempre concreto e executável hoje. */
  action: string;
  /** O que o app faz com essa informação. Fecha o ciclo. */
  next: string;
}

export interface FailureCause {
  id: string;
  /** Rótulo do botão. Aceita o token {nome}. */
  label: string;
  base: CauseGuidance;
  /** Ajuste de texto para blocos onde a causa significa outra coisa. */
  byBlock?: Partial<Record<TroubleshootingBlockId, Partial<CauseGuidance>>>;
}

/** Tentativas malsucedidas no mesmo treino a partir das quais sugerimos um profissional. */
export const PROFESSIONAL_HELP_THRESHOLD = 3;

export const FAILURE_CAUSES: Record<string, FailureCause> = {
  sem_atencao: {
    id: 'sem_atencao',
    label: '{nome} nem prestou atenção',
    base: {
      cause: 'Quase sempre é o ambiente competindo com você, ou o petisco não valendo o esforço.',
      action: 'Refaça em um cômodo mais silencioso, com a TV desligada e sem outras pessoas por perto. Troque o petisco por algo de valor mais alto — frango, queijo ou salsicha em pedaços bem pequenos. E treine antes da refeição, nunca depois.',
      next: 'Vamos repetir este treino, e ele volta pelo começo.',
    },
    byBlock: {
      b4: {
        action: 'Antes da rua, faça o exercício dentro de casa e depois no corredor ou na garagem. A calçada tem cheiro, barulho e movimento demais para quem ainda está aprendendo o gesto.',
      },
      b7: {
        cause: 'No lugar certo, o que costuma faltar é tempo. O cão precisa de alguns minutos parado ali para o corpo entender que é hora.',
        action: 'Fique no local por três a cinco minutos, em silêncio, sem brincar e sem conversar. Se não acontecer nada, volte para dentro e tente de novo em quinze minutos.',
      },
    },
  },

  levantou: {
    id: 'levantou',
    label: '{nome} levantou ou saiu do lugar',
    base: {
      cause: 'O critério subiu mais rápido do que ele conseguia acompanhar. Normalmente é tempo demais, distância demais, ou os dois de uma vez.',
      action: 'Volte para o último ponto em que ele acertava com facilidade e fique ali por três repetições seguidas. Só então aumente — e aumente uma coisa de cada vez: ou o tempo, ou a distância. Nunca as duas juntas.',
      next: 'A próxima sessão começa um degrau abaixo.',
    },
  },

  so_petisco: {
    id: 'so_petisco',
    label: '{nome} só queria o petisco',
    base: {
      cause: 'A comida está aparecendo antes do comportamento. Assim ela vira o alvo, e não a recompensa.',
      action: 'Mantenha o petisco fechado na mão ou no bolso, fora do campo de visão. Espere o comportamento acontecer, marque com "Muito bem!" e só então leve a mão até ele. A ordem importa: primeiro o acerto, depois a comida aparece.',
      next: 'Vamos repetir este treino com esse ajuste.',
    },
  },

  agitado: {
    id: 'agitado',
    label: '{nome} ficou agitado demais',
    base: {
      cause: 'Ou a sessão passou do ponto, ou ele já chegou ligado no treino.',
      action: 'Corte a sessão pela metade. Comece com algo que ele já faz bem, para entrar no ritmo, e encerre enquanto ele ainda está inteiro — não quando cansar. Se ele chega elétrico, um passeio curto antes rende mais do que insistir.',
      next: 'A próxima sessão vem mais curta.',
    },
    byBlock: {
      b5: {
        cause: 'Perto demais, cedo demais. A agitação é o sinal de que ele já passou do ponto em que conseguia se organizar.',
        action: 'Aumente a distância até onde ele consegue observar e voltar a olhar para você sozinho. Pode ser bem mais longe do que você imaginava, e tudo bem — é desse ponto que se avança.',
      },
      b8: {
        cause: 'O manejo mexe com o corpo, e corpo é onde o cão tem menos escolha. A agitação costuma ser desconforto, não teimosia.',
        action: 'Faça sessões de menos de um minuto, uma parte do corpo por vez, e pare antes que ele peça para parar. Se qualquer toque específico gera reação forte e repetida, vale descartar dor com o veterinário antes de continuar treinando.',
      },
    },
  },

  parou_no_meio: {
    id: 'parou_no_meio',
    label: 'Funcionou no começo e depois parou',
    base: {
      cause: 'É o sinal mais comum de sessão longa demais. O petisco perde a graça, a cabeça satura, e o que estava certo começa a sair errado.',
      action: 'Encerre no melhor momento, não no pior. Três ou quatro acertos seguidos e para — mesmo que pareça cedo, mesmo que sobre tempo no relógio. O que ele leva para o dia seguinte é a última coisa que aconteceu.',
      next: 'Vamos manter este treino, com sessões mais curtas.',
    },
  },

  depende_do_petisco: {
    id: 'depende_do_petisco',
    label: 'Só faz se eu tiver petisco na mão',
    base: {
      cause: 'A mão com comida virou parte do comando. É uma etapa normal do aprendizado, mas ela precisa sair de cena.',
      action: 'Faça exatamente o mesmo gesto com a mão vazia. Quando ele acertar, marque e pegue o petisco do bolso só depois. Em seguida vá alternando: às vezes petisco, às vezes só o elogio.',
      next: 'Vamos repetir este treino até o gesto valer sozinho.',
    },
  },

  puxou: {
    id: 'puxou',
    label: '{nome} puxou a guia o tempo todo',
    base: {
      cause: 'Puxar funciona. Toda vez que a guia estica e o passeio continua, ele aprende que puxar é o que leva adiante.',
      action: 'Pare de andar no instante em que a guia esticar. Não puxe de volta e não chame — só pare. Volte a andar quando ela afrouxar sozinha. Os primeiros passeios vão render poucos metros, e isso é esperado.',
      next: 'Vamos ficar neste treino até a guia afrouxar sozinha.',
    },
  },

  reagiu: {
    id: 'reagiu',
    label: '{nome} latiu, avançou ou travou',
    base: {
      cause: 'A distância estava curta demais. Quando o cão reage, ele já passou do ponto em que conseguia pensar — e insistir ali ensina que aquilo é mesmo motivo de alarme.',
      action: 'Aumente a distância até o ponto em que ele consegue olhar e voltar para você por conta própria. Pode ser o dobro do que você tentou. É desse ponto que se avança, um pouco por semana, sem pressa.',
      next: 'A próxima sessão começa de mais longe.',
    },
  },

  chorou_sozinho: {
    id: 'chorou_sozinho',
    label: '{nome} chorou ou latiu assim que saí',
    base: {
      cause: 'O tempo foi maior do que ele aguenta hoje. Ficar sozinho não se treina esperando o choro passar — se treina voltando antes dele começar.',
      action: 'Reduza para um tempo em que ele nem chega a reclamar, mesmo que sejam cinco segundos. Saia sem despedida e volte sem festa: quanto menos evento for a sua saída, menos ela pesa. Repita três vezes e só aumente quando as três forem tranquilas.',
      next: 'A próxima sessão começa por um tempo bem menor.',
    },
  },

  errou_o_lugar: {
    id: 'errou_o_lugar',
    label: 'Fez no lugar errado de novo',
    base: {
      cause: 'Ou o intervalo entre as saídas foi longo demais, ou o local certo ainda não ficou óbvio.',
      action: 'Encurte o intervalo: leve ao local logo depois de acordar, de comer, de brincar e a cada duas horas. Quando acertar, recompense ali mesmo, na hora — não depois, quando voltarem. Limpe os acidentes com produto sem amônia, porque o cheiro chama de volta.',
      next: 'Vamos reforçar a rotina de horários nos próximos dias.',
    },
  },

  se_afastou: {
    id: 'se_afastou',
    label: '{nome} se afastou ou não deixou encostar',
    base: {
      cause: 'O toque avançou mais rápido do que a confiança.',
      action: 'Volte para onde ele aceita sem se mexer — às vezes é só aproximar a mão, sem encostar. Marque e recompense esse ponto por alguns dias antes de ir adiante. E deixe a saída sempre livre: cão que pode sair quando quiser costuma ficar mais.',
      next: 'A próxima sessão começa por um passo mais leve.',
    },
  },

  travou: {
    id: 'travou',
    label: '{nome} travou e não quis andar',
    base: {
      cause: 'Cão que trava está com medo ou desconfortável, não com preguiça. Puxar a guia nesse momento piora — ele aprende que insistir força o passo.',
      action: 'Pare, afrouxe a guia e espere sem falar nada. No primeiro passo que ele der sozinho, marque e recompense. Se ele trava sempre no mesmo ponto da rua, mude o trajeto por alguns dias. E confira se a coleira ou o peitoral não está apertando em algum lugar.',
      next: 'Vamos ficar neste treino até o passeio fluir sem travadas.',
    },
  },

  escondeu: {
    id: 'escondeu',
    label: '{nome} se escondeu ou quis ir embora',
    base: {
      cause: 'Isso é medo, não desinteresse — e medo pede exatamente o contrário de insistir.',
      action: 'Aumente a distância e deixe que ele escolha se aproximar sozinho, sem guia esticada e sem colo. Recompense qualquer olhada na direção do que assusta, mesmo de bem longe. Nunca leve até perto para mostrar que não tem perigo: isso confirma o medo em vez de desfazer.',
      next: 'A próxima sessão começa de bem mais longe.',
    },
  },

  destruiu: {
    id: 'destruiu',
    label: 'Destruiu ou mexeu nas coisas',
    base: {
      cause: 'Destruição na ausência raramente é bagunça. É o que ele faz com a tensão enquanto espera.',
      action: 'Reduza o tempo até um ponto em que nada acontece, e deixe algo para ocupar a boca na saída — um brinquedo recheado que dure mais do que a sua ausência. Guarde o que não pode ser destruído em vez de corrigir depois: bronca na volta não se conecta com o que aconteceu antes.',
      next: 'A próxima sessão começa por um tempo bem menor.',
    },
  },

  fez_necessidades_sozinho: {
    id: 'fez_necessidades_sozinho',
    label: 'Fez xixi ou cocô enquanto eu estava fora',
    base: {
      cause: 'Pode ser a tensão da ausência, e pode ser só bexiga cheia. Vale separar as duas coisas antes de tratar como comportamento.',
      action: 'Leve ao local certo sempre logo antes de sair. Se mesmo assim ele continuar fazendo dentro só quando fica sozinho, então é a ausência que está pesando — e o caminho é encurtar o tempo, não cobrar o acerto.',
      next: 'A próxima sessão começa por um tempo bem menor.',
    },
  },

  nao_desgruda: {
    id: 'nao_desgruda',
    label: 'Nem consegui chegar até a porta',
    base: {
      cause: 'Para ele, a saída começou antes da porta: pegar a chave, calçar o sapato, mexer na bolsa. É aí que a tensão sobe.',
      action: 'Treine só os sinais, sem sair. Pegue a chave e sente no sofá. Calce o sapato e vá para a cozinha. Repita até que esses gestos não signifiquem mais nada. A porta só volta para o exercício depois disso.',
      next: 'Vamos trabalhar os sinais de saída antes de contar o tempo.',
    },
  },

  segurou_e_fez_dentro: {
    id: 'segurou_e_fez_dentro',
    label: 'Segurou lá fora e fez assim que entrou',
    base: {
      cause: 'Lá fora tem cheiro demais para investigar. Ele volta para casa sem ter relaxado — e relaxa aqui dentro.',
      action: 'Fique mais tempo parado no local, sem andar e sem conversar: cinco minutos, mesmo que pareça muito. E não volte para dentro logo depois do acerto. Se entrar em casa sempre encerra o passeio, ele aprende a adiar para prolongar a rua.',
      next: 'Vamos reforçar o tempo parado no local nos próximos dias.',
    },
  },

  rosnou: {
    id: 'rosnou',
    label: '{nome} rosnou ou tentou morder',
    base: {
      cause: 'Rosnado é aviso, e aviso é uma coisa boa: ele está pedindo espaço em vez de partir direto para a mordida. Nunca puna o rosnado — cão que aprende a não avisar passa a morder sem aviso nenhum.',
      action: 'Encerre o exercício sem bronca e sem drama, e não repita esse toque por enquanto.',
      next: 'Este é um caso para olhar de perto, não para resolver por aqui: vale marcar consulta com o veterinário para descartar dor e conversar com um adestrador presencial. O Focão segue com vocês para o resto da rotina.',
    },
  },

  nao_entendi: {
    id: 'nao_entendi',
    label: 'Não entendi o que era para fazer',
    base: {
      cause: 'Se a instrução não ficou clara, o problema é do texto, não seu.',
      action: 'Abra o treino de novo e leia os passos sem o cachorro por perto — ler com calma, antes de chamar {nome}, costuma resolver sozinho. Depois faça só o primeiro passo, algumas vezes, sem se preocupar com o resto.',
      next: 'Vamos manter este treino para vocês tentarem de novo sem pressa.',
    },
  },

  interrompido: {
    id: 'interrompido',
    label: 'Fomos interrompidos ou faltou tempo',
    base: {
      cause: 'Isso não é falha de treino, é a vida acontecendo. Sessão interrompida não desfaz nada do que já foi aprendido.',
      action: 'Da próxima vez, escolha um horário em que ninguém precise de você por dez minutos, deixe o celular em outro cômodo e os petiscos já separados na mão. E se o dia não colaborar, cinco minutos inteiros valem mais do que quinze picotados.',
      next: 'Este treino continua de onde vocês pararam. É só retomar quando der.',
    },
  },

  nao_fez: {
    id: 'nao_fez',
    label: 'Simplesmente não fez',
    base: {
      cause: 'Quando não dá para apontar o que saiu errado, quase sempre o passo era grande demais.',
      action: 'Quebre em uma parte menor e recompense a tentativa, não só o resultado inteiro. Se o treino pede que ele deite, já vale recompensar o movimento de abaixar a cabeça. O passo seguinte só entra quando esse estiver fácil.',
      next: 'Vamos repetir este treino em pedaços menores.',
    },
  },
};

/**
 * As saídas que não são sobre o cão. Sem elas, quem parou porque tocou a campainha ou
 * porque não entendeu a instrução acaba marcando "Simplesmente não fez" e recebe um
 * conselho de adestramento que não tem nada a ver com o que aconteceu.
 * Ficam sempre no fim da lista, nesta ordem.
 */
const NAO_FOI_O_CAO = ['nao_entendi', 'interrompido', 'nao_fez'];

/**
 * Quais causas aparecem em cada bloco, e em que ordem.
 * A primeira é a mais provável naquele contexto; "Simplesmente não fez" fecha sempre.
 */
export const CAUSES_BY_BLOCK: Record<TroubleshootingBlockId, string[]> = {
  b1: ['sem_atencao', 'so_petisco', 'agitado', 'parou_no_meio', 'depende_do_petisco', ...NAO_FOI_O_CAO],
  b2: ['levantou', 'sem_atencao', 'so_petisco', 'agitado', 'parou_no_meio', 'depende_do_petisco', ...NAO_FOI_O_CAO],
  b3: ['so_petisco', 'levantou', 'agitado', 'sem_atencao', 'parou_no_meio', ...NAO_FOI_O_CAO],
  b4: ['puxou', 'travou', 'sem_atencao', 'agitado', 'parou_no_meio', ...NAO_FOI_O_CAO],
  b5: ['reagiu', 'escondeu', 'agitado', 'sem_atencao', ...NAO_FOI_O_CAO],
  b6: ['chorou_sozinho', 'destruiu', 'fez_necessidades_sozinho', 'nao_desgruda', 'agitado', 'parou_no_meio', ...NAO_FOI_O_CAO],
  b7: ['errou_o_lugar', 'segurou_e_fez_dentro', 'sem_atencao', 'parou_no_meio', ...NAO_FOI_O_CAO],
  b8: ['se_afastou', 'rosnou', 'agitado', 'parou_no_meio', ...NAO_FOI_O_CAO],
  b9: ['sem_atencao', 'so_petisco', 'parou_no_meio', 'depende_do_petisco', ...NAO_FOI_O_CAO],
};

/** Bloco desconhecido (treino novo, bloco renomeado) cai num conjunto genérico em vez de sumir. */
const FALLBACK_CAUSES = ['sem_atencao', 'agitado', 'parou_no_meio', ...NAO_FOI_O_CAO];

function isKnownBlock(blockId: string | undefined): blockId is TroubleshootingBlockId {
  return !!blockId && blockId in CAUSES_BY_BLOCK;
}

export function interpolateDogName(text: string, dogName?: string | null): string {
  return text.replace(/\{nome\}/g, dogName?.trim() || 'Ele');
}

/** Opções de "O que aconteceu?" para o bloco do treino, já com o nome do cão aplicado. */
export function getFailureCauses(
  blockId: string | undefined,
  dogName?: string | null
): Array<{ id: string; label: string }> {
  const ids = isKnownBlock(blockId) ? CAUSES_BY_BLOCK[blockId] : FALLBACK_CAUSES;
  return ids
    .map((id) => FAILURE_CAUSES[id])
    .filter(Boolean)
    .map((cause) => ({ id: cause.id, label: interpolateDogName(cause.label, dogName) }));
}

/** Orientação final: base da causa, sobrescrita pelo ajuste do bloco quando existir. */
export function getGuidance(
  causeId: string,
  blockId: string | undefined,
  dogName?: string | null
): CauseGuidance | null {
  const cause = FAILURE_CAUSES[causeId];
  if (!cause) return null;

  const override = isKnownBlock(blockId) ? cause.byBlock?.[blockId] : undefined;
  const merged: CauseGuidance = { ...cause.base, ...(override || {}) };

  return {
    cause: interpolateDogName(merged.cause, dogName),
    action: interpolateDogName(merged.action, dogName),
    next: interpolateDogName(merged.next, dogName),
  };
}

/**
 * Conta tentativas sem sucesso no mesmo treino, incluindo a que acabou de acontecer.
 * "Sem sucesso" = feedback 'hard' ou 'failed'.
 */
export function countUnsuccessfulAttempts(
  logs: Array<{ trainingId?: string; feedback?: string }>,
  trainingId: string
): number {
  return logs.filter(
    (log) => log.trainingId === trainingId && (log.feedback === 'hard' || log.feedback === 'failed')
  ).length;
}

export function shouldOfferProfessionalHelp(unsuccessfulAttempts: number): boolean {
  return unsuccessfulAttempts >= PROFESSIONAL_HELP_THRESHOLD;
}

export const PROFESSIONAL_HELP_LABEL = 'Já tentamos várias vezes e não anda';

/**
 * O limite do app, dito em voz alta. Nenhum aplicativo lê a linguagem corporal do cão
 * no momento em que a coisa acontece — e é justamente isso que estes casos pedem.
 */
export function getProfessionalHelpNote(blockId: string | undefined): CauseGuidance {
  if (blockId === 'b5') {
    return {
      cause: 'Reatividade é um dos casos em que ler o corpo do cão no momento exato faz toda a diferença — e isso nenhum aplicativo consegue fazer, o Focão inclusive.',
      action: 'Vale procurar um adestrador presencial ou um veterinário comportamental para ver de perto o que está acontecendo.',
      next: 'O Focão continua com vocês para organizar a rotina e acompanhar o que for indicado.',
    };
  }

  if (blockId === 'b6') {
    return {
      cause: 'Ansiedade de separação tem grau, e nem todo grau se resolve com tempo e repetição. Daqui não dá para enxergar o que acontece na sua ausência.',
      action: 'Vale procurar um adestrador presencial ou um veterinário comportamental. Em alguns casos o acompanhamento vai além do treino, e isso é normal.',
      next: 'O Focão continua com vocês para organizar a rotina e acompanhar o que for indicado.',
    };
  }

  return {
    cause: 'Três tentativas sem avanço costumam significar algo que não dá para ver por aqui.',
    action: 'Vale uma conversa com um adestrador presencial ou com o veterinário. Às vezes é comportamento, às vezes é dor ou desconforto que ninguém notou — e um cão desconfortável não aprende.',
    next: 'O Focão continua com vocês para organizar a rotina e acompanhar o que for indicado.',
  };
}
