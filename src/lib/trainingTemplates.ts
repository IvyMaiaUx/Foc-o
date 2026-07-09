export interface TrainingTemplate {
  id: string;
  name: string;
  blockId: string;
  level: string; // iniciante, intermediario, avancado
  duration: string;
  objective: string;
  prerequisites: string[];
  nextPossible: string[];
  tags: string[];
  problemTags: string[];
  objectiveTags: string[];
  profileTags: string[];
  levelTag: 'iniciante' | 'intermediario' | 'avancado';
  beforeStart?: string;
  steps: string[];
}

/**
 * NÍVEL DO TREINO (`levelTag`) — CLASSIFICAÇÃO INTERNA.
 * Não é exibida ao tutor: serve só para o IntelligentPlanMotor montar/ordenar o plano
 * conforme o nível do cão (`dogProfile.trainingBase`). Regra do motor: um treino só
 * entra no plano se `rank(levelTag) <= rank(nível do cão)`, com +1 de tolerância quando
 * o treino é de núcleo (blocos b1/b2) ou ataca um problema declarado do cão.
 * Ranks: iniciante = 0 · intermediario = 1 · avancado = 2.
 *
 * Critério para classificar cada treino:
 * - iniciante    → FUNDAMENTO/BÁSICO. Qualquer cão (inclusive filhote/iniciante) pode
 *                  começar sem pré-requisito de comportamento. Ex.: nome, senta, xixi no local.
 * - intermediario→ Exige uma base mínima já assimilada; envolve distrações, generalização
 *                  ou mais autocontrole. Ex.: passeio com distrações, socialização, rotina consistente.
 * - avancado     → Refinamento, manejo delicado ou truques; pressupõe base sólida.
 *                  Ex.: cooperação veterinária, escovação, encadear comandos.
 *
 * OBS.: o campo `level` (string) é apenas rótulo interno/legado; quem o motor lê é o
 * `levelTag`. Ao editar um treino, mantenha os dois coerentes.
 */
export const TRAINING_TEMPLATES: Record<string, TrainingTemplate> = {
  'b1-t1': {
    id: 'b1-t1', name: 'Nome e contato visual', blockId: 'b1', level: 'iniciante', duration: '10 min',
    objective: 'Cultive presença e resposta ao chamado com mais conexão.', prerequisites: [], nextPossible: ["b1-t2"],
    tags: ["foco", "conexao"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["foco", "obediencia"],
    profileTags: ["filhote", "adulto", "senior", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Fique em um ambiente calmo, com o cão perto de você e petiscos em mãos.',
      'Diga o nome do cão uma vez, em tom leve e claro.',
      'No momento em que ele olhar para você, marque com "Muito bem!" e entregue o petisco.',
      'Repita por alguns minutos, fazendo pequenas pausas entre as repetições.',
    ]
  },
  'b1-t2': {
    id: 'b1-t2', name: 'Segue minha mão', blockId: 'b1', level: 'iniciante', duration: '10 min',
    objective: 'Conduza a atenção do cão de forma suave e precisa.', prerequisites: ["b1-t1"], nextPossible: ["b1-t3"],
    tags: ["foco", "conexao"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["foco", "obediencia"],
    profileTags: ["filhote", "adulto", "senior", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Mostre um petisco próximo ao focinho do cão, sem deixar que ele pegue de imediato.',
      'Mova a mão lentamente para um lado, para o outro e um pouco para cima.',
      'Recompense sempre que ele acompanhar o movimento com atenção e calma.',
      'Repita em séries curtas, encerrando antes que ele perca o interesse.',
    ]
  },
  'b1-t3': {
    id: 'b1-t3', name: 'Atenção em ambiente calmo', blockId: 'b1', level: 'iniciante', duration: '12 min',
    objective: 'Fortaleça o foco em um contexto de baixa distração.', prerequisites: ["b1-t2"], nextPossible: ["b1-t4"],
    tags: ["foco", "conexao"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["foco", "calma"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Fique parado com o cão em frente ou ao seu lado, em um ambiente sem distrações.',
      'Espere ele olhar espontaneamente para você, sem chamar o nome toda hora.',
      'Marque o olhar com "Muito bem!" e recompense.',
      'Repita até que ele comece a oferecer atenção com mais frequência.',
    ]
  },
  'b1-t4': {
    id: 'b1-t4', name: 'Atenção com pequena distração', blockId: 'b1', level: 'iniciante', duration: '12 min',
    objective: 'Ensine o cão a retornar para você com mais facilidade.', prerequisites: ["b1-t3"], nextPossible: ["b1-t5"],
    tags: ["foco", "conexao"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["foco", "calma"],
    profileTags: ["filhote", "adulto", "senior", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Coloque uma distração leve no ambiente, como um brinquedo parado ou um som baixo.',
      'Aguarde o cão perceber a distração e depois voltar a olhar para você.',
      'Recompense toda vez que ele escolher prestar atenção em você.',
      'Faça séries curtas e reduza a distração se ele estiver muito disperso.',
    ]
  },
  'b1-t5': {
    id: 'b1-t5', name: 'Atenção em movimento', blockId: 'b1', level: 'iniciante', duration: '12 min',
    objective: 'Leve a conexão para situações com deslocamento e ação.', prerequisites: ["b1-t4"], nextPossible: ["b1-t6"],
    tags: ["foco", "conexao"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["foco", "passeio"],
    profileTags: ["filhote", "adulto", "senior", "alta_energia"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Caminhe alguns passos lentos pelo ambiente com o cão por perto.',
      'Espere que ele acompanhe seu movimento e volte a olhar para você.',
      'Marque e recompense sempre que ele mantiver essa conexão em movimento.',
      'Aumente aos poucos a quantidade de passos antes da recompensa.',
    ]
  },
  'b1-t6': {
    id: 'b1-t6', name: 'Conexão antes do comando', blockId: 'b1', level: 'iniciante', duration: '12 min',
    objective: 'Construa atenção antes de qualquer pedido.', prerequisites: ["b1-t5"], nextPossible: [],
    tags: ["foco", "conexao"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["foco", "obediencia"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Antes de pedir qualquer comando simples, espere o cão te olhar primeiro.',
      'Só depois do contato visual, dê o comando em tom calmo.',
      'Recompense quando ele fizer o comportamento após essa conexão inicial.',
      'Repita até que "olhar antes" vire parte natural da interação.',
    ]
  },
  'b2-t1': {
    id: 'b2-t1', name: 'Senta', blockId: 'b2', level: 'iniciante', duration: '10 min',
    objective: 'Estabeleça uma resposta clara para momentos do dia a dia.', prerequisites: [], nextPossible: ["b2-t2"],
    tags: ["obediencia_basica"],
    problemTags: ["falta_de_foco", "pula_em_pessoas"],
    objectiveTags: ["obediencia", "calma"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Com um petisco na mão, leve-o lentamente para cima e um pouco para trás da cabeça do cão.',
      'Quando ele sentar naturalmente para acompanhar o movimento, marque e recompense.',
      'Depois de algumas repetições, adicione a palavra "Senta" antes do gesto.',
      'Faça séries curtas e finalize quando o acerto estiver fluido.',
    ]
  },
  'b2-t2': {
    id: 'b2-t2', name: 'Deita', blockId: 'b2', level: 'iniciante', duration: '10 min',
    objective: 'Trabalhe calma, postura e disponibilidade para ouvir.', prerequisites: ["b2-t1"], nextPossible: ["b2-t3"],
    tags: ["obediencia_basica"],
    problemTags: ["falta_de_foco", "pula_em_pessoas"],
    objectiveTags: ["obediencia", "calma"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Com o cão sentado, leve o petisco da altura do focinho em direção ao chão.',
      'Arraste devagar o petisco para frente, incentivando o cão a deitar.',
      'Assim que ele tocar os cotovelos no chão, marque e recompense.',
      'Repita algumas vezes e só depois adicione a palavra "Deita".',
    ]
  },
  'b2-t3': {
    id: 'b2-t3', name: 'Fica por 3 segundos', blockId: 'b2', level: 'iniciante', duration: '8 min',
    objective: 'Desenvolva permanência com serenidade e controle.', prerequisites: ["b2-t2"], nextPossible: ["b2-t4"],
    tags: ["obediencia_basica"],
    problemTags: ["falta_de_foco", "pula_em_pessoas"],
    objectiveTags: ["obediencia", "calma"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Peça "Senta" ou "Deita" e mostre a mão aberta como sinal de pausa.',
      'Conte mentalmente 3 segundos sem se afastar.',
      'Se o cão permanecer parado, marque e recompense.',
      'Se ele levantar antes, apenas reinicie com menos tempo.',
    ]
  },
  'b2-t4': {
    id: 'b2-t4', name: 'Fica com pequena distância', blockId: 'b2', level: 'iniciante', duration: '10 min',
    objective: 'Amplie a estabilidade mesmo com um pouco mais de espaço.', prerequisites: ["b2-t3"], nextPossible: ["b2-t5"],
    tags: ["obediencia_basica"],
    problemTags: ["falta_de_foco", "pula_em_pessoas"],
    objectiveTags: ["obediencia", "calma"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Peça "Fica" com o cão sentado ou deitado.',
      'Dê um passo para trás e espere 2 a 3 segundos.',
      'Se ele permanecer no lugar, volte até ele, marque e recompense.',
      'Aumente a distância bem aos poucos, sem apressar.',
    ]
  },
  'b2-t5': {
    id: 'b2-t5', name: 'Vem quando chamado', blockId: 'b2', level: 'iniciante', duration: '12 min',
    objective: 'Reforce proximidade, vínculo e retorno com segurança.', prerequisites: ["b2-t4"], nextPossible: ["b2-t6"],
    tags: ["obediencia_basica"],
    problemTags: ["falta_de_foco"],
    objectiveTags: ["obediencia", "convivencia"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Fique a poucos passos do cão em um ambiente seguro e sem distrações.',
      'Chame o nome dele e diga "Vem!" em tom animado e acolhedor.',
      'Quando ele vier até você, marque e recompense com entusiasmo.',
      'Repita em diferentes pontos do ambiente, sempre tornando sua aproximação valiosa.',
    ]
  },
  'b2-t6': {
    id: 'b2-t6', name: 'Espera', blockId: 'b2', level: 'iniciante', duration: '10 min',
    objective: 'Introduza pausas curtas com mais equilíbrio emocional.', prerequisites: ["b2-t5"], nextPossible: [],
    tags: ["obediencia_basica"],
    problemTags: ["falta_de_foco", "pula_em_pessoas"],
    objectiveTags: ["obediencia", "calma"],
    profileTags: ["filhote", "adulto", "senior"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Coloque o cão em posição calma diante de você, perto de uma porta ou alimento.',
      'Diga "Espera" e faça uma pausa curta antes de liberar.',
      'Se ele mantiver o autocontrole, marque e recompense ou libere a atividade.',
      'Aumente o tempo de espera gradualmente, sempre em pequenos passos.',
    ]
  },
  'b3-t1': {
    id: 'b3-t1', name: 'Ignorar petisco na mão', blockId: 'b3', level: 'iniciante', duration: '8 min',
    objective: 'Mostre que a calma também faz parte da recompensa.', prerequisites: [], nextPossible: ["b3-t2"],
    tags: ["autocontrole"],
    problemTags: ["destruicao", "mordidas", "pula_em_pessoas"],
    objectiveTags: ["calma", "convivencia"],
    profileTags: ["filhote", "adulto", "alta_energia", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Mostre um petisco na mão fechada e deixe o cão cheirar sem abrir.',
      'Espere até ele parar de insistir, mesmo que por um segundo.',
      'Assim que ele recuar ou relaxar, marque e recompense com outro petisco.',
      'Repita até que ele entenda que a calma abre oportunidades.',
    ]
  },
  'b3-t2': {
    id: 'b3-t2', name: 'Esperar liberação para comer', blockId: 'b3', level: 'iniciante', duration: '10 min',
    objective: 'Transforme a refeição em um momento de autocontrole.', prerequisites: ["b3-t1"], nextPossible: ["b3-t3"],
    tags: ["autocontrole"],
    problemTags: ["destruicao", "mordidas"],
    objectiveTags: ["calma", "convivencia", "rotina"],
    profileTags: ["filhote", "adulto", "alta_energia", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Prepare o pote de comida e peça ao cão que sente ou fique parado.',
      'Abaixe o pote lentamente, mas suba de novo se ele avançar antes da hora.',
      'Quando ele esperar com calma, coloque o pote e diga a palavra de liberação.',
      'Repita diariamente para tornar a rotina previsível e tranquila.',
    ]
  },
  'b3-t3': {
    id: 'b3-t3', name: 'Soltar objeto', blockId: 'b3', level: 'iniciante', duration: '10 min',
    objective: 'Desenvolva trocas leves e cooperação no manejo diário.', prerequisites: ["b3-t2"], nextPossible: ["b3-t4"],
    tags: ["autocontrole"],
    problemTags: ["destruicao", "mordidas"],
    objectiveTags: ["calma", "convivencia"],
    profileTags: ["filhote", "adulto", "alta_energia", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Ofereça um brinquedo que o cão goste e deixe-o segurar por alguns segundos.',
      'Mostre um petisco de alto valor perto do focinho e diga "Solta".',
      'No momento em que ele largar o objeto, marque e recompense.',
      'Devolva o brinquedo em algumas repetições para não gerar frustração excessiva.',
    ]
  },
  'b3-t4': {
    id: 'b3-t4', name: 'Não pular nas pessoas', blockId: 'b3', level: 'iniciante', duration: '12 min',
    objective: 'Incentive chegadas mais estáveis e receptivas.', prerequisites: ["b3-t3"], nextPossible: ["b3-t5"],
    tags: ["autocontrole"],
    problemTags: ["pula_em_pessoas", "agitado"],
    objectiveTags: ["calma", "convivencia"],
    profileTags: ["filhote", "adulto", "alta_energia", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Aproxime-se do cão ou peça ajuda de outra pessoa para simular uma chegada.',
      'Se ele tentar pular, retire atenção e espere as quatro patas voltarem ao chão.',
      'No instante em que ele permanecer no chão, marque e recompense.',
      'Repita até que manter o corpo calmo seja mais vantajoso do que pular.',
    ]
  },
  'b3-t5': {
    id: 'b3-t5', name: 'Esperar na porta', blockId: 'b3', level: 'iniciante', duration: '10 min',
    objective: 'Pratique pausas conscientes antes do movimento.', prerequisites: ["b3-t4"], nextPossible: ["b3-t6"],
    tags: ["autocontrole"],
    problemTags: ["pula_em_pessoas", "falta_de_foco"],
    objectiveTags: ["calma", "convivencia"],
    profileTags: ["filhote", "adulto", "alta_energia", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Leve o cão até uma porta fechada e peça para ele parar ou sentar.',
      'Comece a abrir a porta lentamente. Se ele avançar, feche de novo.',
      'Quando ele esperar com calma, marque e recompense.',
      'Aumente a abertura gradualmente até conseguir abrir e passar com tranquilidade.',
    ]
  },
  'b3-t6': {
    id: 'b3-t6', name: 'Permanecer calmo antes da recompensa', blockId: 'b3', level: 'iniciante', duration: '10 min',
    objective: 'Ensine o cão a sustentar o equilíbrio antes de receber.', prerequisites: ["b3-t5"], nextPossible: [],
    tags: ["autocontrole"],
    problemTags: ["destruicao", "mordidas", "pula_em_pessoas"],
    objectiveTags: ["calma", "convivencia"],
    profileTags: ["filhote", "adulto", "alta_energia", "agitado"],
    levelTag: 'iniciante',
    beforeStart: 'Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.',
    steps: [
      'Segure algo que o cão queira muito: petisco, brinquedo ou guia do passeio.',
      'Espere um momento de calma real, como sentar ou parar de pular.',
      'Marque esse instante e entregue a recompensa.',
      'Repita em diferentes contextos para generalizar autocontrole.',
    ]
  },
  'b4-t1': {
    id: 'b4-t1', name: 'Junto parado', blockId: 'b4', level: 'intermediário', duration: '8 min',
    objective: 'Apresente a posição com clareza antes do movimento.', prerequisites: [], nextPossible: ["b4-t2"],
    tags: ["passeio"],
    problemTags: ["puxa_na_guia", "falta_de_foco"],
    objectiveTags: ["passeio", "foco"],
    profileTags: ["adulto", "alta_energia", "grande_porte"],
    levelTag: 'intermediario',
    beforeStart: 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
    steps: [
      'Fique com o cão ao seu lado, com a guia frouxa e petiscos em mãos.',
      'Recompense quando ele permanecer perto da sua perna com calma.',
      'Faça pequenas pausas e reforce a posição correta algumas vezes.',
      'Termine antes que ele fique inquieto ou perca o foco.',
    ]
  },
  'b4-t2': {
    id: 'b4-t2', name: 'Junto por poucos passos', blockId: 'b4', level: 'intermediário', duration: '10 min',
    objective: 'Comece a construir uma caminhada mais conectada.', prerequisites: ["b4-t1"], nextPossible: ["b4-t3"],
    tags: ["passeio"],
    problemTags: ["puxa_na_guia", "falta_de_foco"],
    objectiveTags: ["passeio", "foco"],
    profileTags: ["adulto", "alta_energia", "grande_porte"],
    levelTag: 'intermediario',
    beforeStart: 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
    steps: [
      'Com o cão ao seu lado, dê 2 ou 3 passos lentos para frente.',
      'Se ele acompanhar sem tensionar a guia, marque e recompense.',
      'Volte ao ponto inicial e repita pequenas sequências.',
      'Aumente aos poucos a quantidade de passos antes da recompensa.',
    ]
  },
  'b4-t3': {
    id: 'b4-t3', name: 'Junto com mudança de direção', blockId: 'b4', level: 'intermediário', duration: '12 min',
    objective: 'Trabalhe adaptação e atenção durante o percurso.', prerequisites: ["b4-t2"], nextPossible: ["b4-t4"],
    tags: ["passeio"],
    problemTags: ["puxa_na_guia", "falta_de_foco"],
    objectiveTags: ["passeio", "foco"],
    profileTags: ["adulto", "alta_energia", "grande_porte"],
    levelTag: 'intermediario',
    beforeStart: 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
    steps: [
      'Caminhe com o cão ao seu lado por poucos passos.',
      'Mude de direção de forma suave e previsível.',
      'Recompense quando ele ajustar o corpo e seguir você sem puxar.',
      'Use mudanças simples no início e só depois varie mais.',
    ]
  },
  'b4-t4': {
    id: 'b4-t4', name: 'Redirecionar ao puxar', blockId: 'b4', level: 'intermediário', duration: '12 min',
    objective: 'Ensine o retorno ao foco quando a tensão aparece.', prerequisites: ["b4-t3"], nextPossible: ["b4-t5"],
    tags: ["passeio"],
    problemTags: ["puxa_na_guia", "falta_de_foco"],
    objectiveTags: ["passeio", "foco"],
    profileTags: ["adulto", "alta_energia", "grande_porte"],
    levelTag: 'intermediario',
    beforeStart: 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
    steps: [
      'Comece uma caminhada curta em ambiente tranquilo.',
      'Quando a guia tensionar, pare de andar imediatamente.',
      'Espere o cão aliviar a pressão ou voltar a sua direção.',
      'Marque, recompense e retome o movimento somente quando houver calma.',
    ]
  },
  'b4-t5': {
    id: 'b4-t5', name: 'Passeio com distrações leves', blockId: 'b4', level: 'intermediário', duration: '15 min',
    objective: 'Leve o treino para um cenário mais próximo da rotina.', prerequisites: ["b4-t4"], nextPossible: ["b4-t6"],
    tags: ["passeio"],
    problemTags: ["puxa_na_guia", "falta_de_foco"],
    objectiveTags: ["passeio", "foco"],
    profileTags: ["adulto", "alta_energia", "grande_porte"],
    levelTag: 'intermediario',
    beforeStart: 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
    steps: [
      'Leve o cão para um local com estímulos leves, como movimento distante ou cheiros suaves.',
      'Reforce momentos em que ele escolhe ficar próximo e atento a você.',
      'Se ele se dispersar demais, aumente a distância da distração.',
      'Finalize a sessão com sucesso, não no auge da dificuldade.',
    ]
  },
  'b4-t6': {
    id: 'b4-t6', name: 'Passeio com distrações moderadas', blockId: 'b4', level: 'intermediário', duration: '15 min',
    objective: 'Aumente o desafio sem perder a qualidade do passeio.', prerequisites: ["b4-t5"], nextPossible: [],
    tags: ["passeio"],
    problemTags: ["puxa_na_guia", "falta_de_foco"],
    objectiveTags: ["passeio", "foco"],
    profileTags: ["adulto", "alta_energia", "grande_porte"],
    levelTag: 'intermediario',
    beforeStart: 'Mantenha o foco na calma. Ajuste a distância ou a distração se o cão se dispersar, e sempre recompense bons comportamentos.',
    steps: [
      'Vá para um ambiente com um pouco mais de movimento, mantendo controle e distância segura.',
      'Trabalhe curtos trechos de caminhada com atenção e guia frouxa.',
      'Recompense toda vez que ele retornar o foco e caminhar melhor.',
      'Se houver excesso de excitação, reduza a dificuldade e retome o controle.',
    ]
  },
  'b5-t1': {
    id: 'b5-t1', name: 'Observar sem reagir', blockId: 'b5', level: 'intermediário', duration: '10 min',
    objective: 'Pratique presença diante de estímulos com mais estabilidade.', prerequisites: [], nextPossible: ["b5-t2"],
    tags: ["socializacao"],
    problemTags: ["reatividade", "medo", "latidos"],
    objectiveTags: ["social", "convivencia"],
    profileTags: ["medroso", "reativo", "apartamento", "casa"],
    levelTag: 'intermediario',
    beforeStart: 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.',
    steps: [
      'Posicione o cão a uma distância confortável do estímulo que costuma chamar atenção.',
      'Permita que ele observe sem forçar aproximação.',
      'Marque e recompense sempre que ele olhar e se mantiver calmo.',
      'Encerre antes de qualquer reação intensa.',
    ]
  },
  'b5-t2': {
    id: 'b5-t2', name: 'Aproximação controlada', blockId: 'b5', level: 'intermediário', duration: '12 min',
    objective: 'Construa confiança em encontros feitos no ritmo certo.', prerequisites: ["b5-t1"], nextPossible: ["b5-t3"],
    tags: ["socializacao"],
    problemTags: ["reatividade", "medo", "latidos"],
    objectiveTags: ["social", "convivencia"],
    profileTags: ["medroso", "reativo", "apartamento", "casa"],
    levelTag: 'intermediario',
    beforeStart: 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.',
    steps: [
      'Escolha uma pessoa, objeto ou contexto que o cão possa observar com segurança.',
      'Aproximem-se em pequenos passos, sempre respeitando o conforto do cão.',
      'Recompense calma, curiosidade e recuperação rápida.',
      'Se ele demonstrar desconforto, voltar alguns passos e alivie a situação.',
    ]
  },
  'b5-t3': {
    id: 'b5-t3', name: 'Receber pessoas em casa com calma', blockId: 'b5', level: 'intermediário', duration: '15 min',
    objective: 'Organize chegadas de forma mais previsível e tranquila.', prerequisites: ["b5-t2"], nextPossible: ["b5-t4"],
    tags: ["socializacao"],
    problemTags: ["reatividade", "medo", "latidos"],
    objectiveTags: ["social", "convivencia"],
    profileTags: ["medroso", "reativo", "apartamento", "casa"],
    levelTag: 'intermediario',
    beforeStart: 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.',
    steps: [
      'Prepare o ambiente antes da chegada da visita, com guia, petiscos e espaço organizado.',
      'Peça um comportamento simples, como sentar ou ficar no tapetinho.',
      'Recompense calma antes e durante a aproximação da visita.',
      'Mantenha a interação breve e positiva, sem exigir demais no início.',
    ]
  },
  'b5-t4': {
    id: 'b5-t4', name: 'Ver outros cães à distância', blockId: 'b5', level: 'intermediário', duration: '12 min',
    objective: 'Trabalhe regulação antes da aproximação.', prerequisites: ["b5-t3"], nextPossible: ["b5-t5"],
    tags: ["socializacao"],
    problemTags: ["reatividade", "medo", "latidos"],
    objectiveTags: ["social", "convivencia"],
    profileTags: ["medroso", "reativo", "apartamento", "casa"],
    levelTag: 'intermediario',
    beforeStart: 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.',
    steps: [
      'Escolha um local onde o cão possa ver outro cão sem ficar sobrecarregado.',
      'Mantenha distância suficiente para ele ainda conseguir ouvir e olhar para você.',
      'Recompense atenção, calma e recuperação rápida.',
      'Só reduza a distância quando ele estiver confortável de forma consistente.',
    ]
  },
  'b5-t5': {
    id: 'b5-t5', name: 'Sons e objetos novos', blockId: 'b5', level: 'intermediário', duration: '10 min',
    objective: 'Amplie a segurança do cão diante do inesperado.', prerequisites: ["b5-t4"], nextPossible: ["b5-t6"],
    tags: ["socializacao"],
    problemTags: ["reatividade", "medo", "latidos"],
    objectiveTags: ["social", "convivencia"],
    profileTags: ["medroso", "reativo", "apartamento", "casa"],
    levelTag: 'intermediario',
    beforeStart: 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.',
    steps: [
      'Apresente um som ou objeto novo de forma leve e controlada.',
      'Permita que o cão observe no próprio ritmo, sem forçar contato.',
      'Recompense curiosidade, aproximação calma ou simples tolerância tranquila.',
      'Repita em baixa intensidade até o estímulo parecer neutro.',
    ]
  },
  'b5-t6': {
    id: 'b5-t6', name: 'Generalização em rua/parque', blockId: 'b5', level: 'intermediário', duration: '15 min',
    objective: 'Leve os aprendizados para contextos mais reais.', prerequisites: ["b5-t5"], nextPossible: [],
    tags: ["socializacao"],
    problemTags: ["reatividade", "medo", "latidos"],
    objectiveTags: ["social", "convivencia"],
    profileTags: ["medroso", "reativo", "apartamento", "casa"],
    levelTag: 'intermediario',
    beforeStart: 'Priorize sempre a sensação de segurança. Trabalhe à distância e recompense a tranquilidade antes de qualquer aproximação.',
    steps: [
      'Leve para um ambiente um pouco mais real, como rua tranquila ou parque com espaço.',
      'Relembre comportamentos já conhecidos em dificuldade baixa.',
      'Recompense qualquer manutenção de foco, calma e resposta aos comandos.',
      'Termine cedo, valorizando a adaptação ao contexto novo.',
    ]
  },
  'b6-t1': {
    id: 'b6-t1', name: 'Tapetinho / lugar de calma', blockId: 'b6', level: 'intermediário', duration: '10 min',
    objective: 'Crie uma referência física de segurança e descanso.', prerequisites: [], nextPossible: ["b6-t2"],
    tags: ["ansiedade_separacao"],
    problemTags: ["ansiedade_separacao", "destruicao", "latidos"],
    objectiveTags: ["calma"],
    profileTags: ["apartamento", "filhote", "medroso"],
    levelTag: 'intermediario',
    beforeStart: 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.',
    steps: [
      'Apresente um tapete ou cama como ponto fixo de descanso.',
      'Recompense qualquer aproximação voluntária ao local.',
      'Depois, recompense quando o cão permanecer alguns segundos ali.',
      'Aos quais, associe o espaço a relaxamento e previsibilidade.',
    ]
  },
  'b6-t2': {
    id: 'b6-t2', name: 'Ficar sozinho por 30 segundos', blockId: 'b6', level: 'intermediário', duration: '8 min',
    objective: 'Comece a construir autonomia em ausências breves.', prerequisites: ["b6-t1"], nextPossible: ["b6-t3"],
    tags: ["ansiedade_separacao"],
    problemTags: ["ansiedade_separacao", "destruicao", "latidos"],
    objectiveTags: ["calma"],
    profileTags: ["apartamento", "filhote", "medroso"],
    levelTag: 'intermediario',
    beforeStart: 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.',
    steps: [
      'Deixe o cão em um ambiente seguro e familiar, sem grande ritual.',
      'Afaste-se por poucos segundos e volte antes que ele se desorganize.',
      'Recompense a calma na sua volta, sem exagerar na chegada.',
      'Repita em saídas curtíssimas e previsíveis.',
    ]
  },
  'b6-t3': {
    id: 'b6-t3', name: 'Ficar sozinho por 2 minutos', blockId: 'b6', level: 'intermediário', duration: '10 min',
    objective: 'Amplie a tolerância à separação de forma gradual.', prerequisites: ["b6-t2"], nextPossible: ["b6-t4"],
    tags: ["ansiedade_separacao"],
    problemTags: ["ansiedade_separacao", "destruicao", "latidos"],
    objectiveTags: ["calma"],
    profileTags: ["apartamento", "filhote", "medroso"],
    levelTag: 'intermediario',
    beforeStart: 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.',
    steps: [
      'Comece só depois que os 30 segundos já estiverem bem aceitos.',
      'Aumente o tempo de ausência gradualmente, sem saltos grandes.',
      'Mantenha o retorno calmo e neutro.',
      'Se houver dificuldade, volte para um tempo menor.',
    ]
  },
  'b6-t4': {
    id: 'b6-t4', name: 'Ritual de saída calmo', blockId: 'b6', level: 'intermediário', duration: '8 min',
    objective: 'Reduza a carga emocional dos sinais de partida.', prerequisites: ["b6-t3"], nextPossible: ["b6-t5"],
    tags: ["ansiedade_separacao"],
    problemTags: ["ansiedade_separacao", "destruicao", "latidos"],
    objectiveTags: ["calma"],
    profileTags: ["apartamento", "filhote", "medroso"],
    levelTag: 'intermediario',
    beforeStart: 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.',
    steps: [
      'Simule pequenos sinais de saída, como pegar chave ou calçar sapato.',
      'Faça isso sem sair de fato, para reduzir a carga emocional do ritual.',
      'Recompense o cão quando ele permanecer mais calmo durante esses sinais.',
      'Aos poucos, misture esses gestos na rotina normal.',
    ]
  },
  'b6-t5': {
    id: 'b6-t5', name: 'Independência em outro cômodo', blockId: 'b6', level: 'intermediário', duration: '10 min',
    objective: 'Incentive conforto mesmo sem proximidade constante.', prerequisites: ["b6-t4"], nextPossible: ["b6-t6"],
    tags: ["ansiedade_separacao"],
    problemTags: ["ansiedade_separacao", "destruicao", "latidos"],
    objectiveTags: ["calma"],
    profileTags: ["apartamento", "filhote", "medroso"],
    levelTag: 'intermediario',
    beforeStart: 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.',
    steps: [
      'Incentive o cão a ficar confortável em outro cômodo por alguns instantes.',
      'Use o tapetinho, brinquedo calmo ou alimento de baixa excitação como apoio.',
      'Recompense a permanência tranquila sem necessidade de contato constante.',
      'Aumente esse intervalo aos poucos, sempre respeitando o conforto.',
    ]
  },
  'b6-t6': {
    id: 'b6-t6', name: 'Relaxamento após ausência', blockId: 'b6', level: 'intermediário', duration: '10 min',
    objective: 'Transforme o reencontro em um retorno mais sereno.', prerequisites: ["b6-t5"], nextPossible: [],
    tags: ["ansiedade_separacao"],
    problemTags: ["ansiedade_separacao", "destruicao", "latidos"],
    objectiveTags: ["calma"],
    profileTags: ["apartamento", "filhote", "medroso"],
    levelTag: 'intermediario',
    beforeStart: 'A independência se constrói aos poucos. Aja com naturalidade e evite fazer muita festa nas idas e vindas.',
    steps: [
      'Ao retornar, observe como o cão responde e mantenha sua energia baixa.',
      'Recompense quando ele se reorganizar e relaxar rapidamente.',
      'Evite transformar o reencontro em um pico de excitação.',
      'Repita até que a volta faça parte da rotina com mais serenidade.',
    ]
  },
  'b7-t1': {
    id: 'b7-t1', name: 'Acertar xixi/cocô no local', blockId: 'b7', level: 'iniciante', duration: '12 min',
    objective: 'Fortaleça acertos com consistência e clareza.', prerequisites: [], nextPossible: ["b7-t2"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.',
    steps: [
      'Leve o cão ao local certo em horários de maior chance de acerto.',
      'Fique atento aos sinais corporais e à rotina após comida, sono ou brincadeira.',
      'No momento do acerto, marque e recompense imediatamente.',
      'Repita com consistência para criar associação clara.',
    ]
  },
  'b7-t2': {
    id: 'b7-t2', name: 'Sinal pós-refeição', blockId: 'b7', level: 'iniciante', duration: '10 min',
    objective: 'Use a rotina a favor do aprendizado.', prerequisites: ["b7-t1"], nextPossible: ["b7-t3"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.',
    steps: [
      'Após a refeição, conduza o cão ao local de necessidade no tempo mais adequado para ele.',
      'Mantenha esse ritual de forma previsível todos os dias.',
      'Recompense o acerto no lugar certo.',
      'Observe o padrão do cão para ajustar melhor os horários.',
    ]
  },
  'b7-t3': {
    id: 'b7-t3', name: 'Recompensa por acerto', blockId: 'b7', level: 'iniciante', duration: '8 min',
    objective: 'Associe o comportamento certo a uma resposta imediata.', prerequisites: ["b7-t2"], nextPossible: ["b7-t4"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.',
    steps: [
      'Escolha uma recompensa simples e rápida para o momento do acerto.',
      'Entregue logo após a necessidade acontecer no local correto.',
      'Use tom calmo e positivo para marcar o comportamento.',
      'Repita até que o local certo fique muito claro para o cão.',
    ]
  },
  'b7-t4': {
    id: 'b7-t4', name: 'Rotina de saída', blockId: 'b7', level: 'iniciante', duration: '10 min',
    objective: 'Organize previsibilidade para facilitar o acerto.', prerequisites: ["b7-t3"], nextPossible: ["b7-t5"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.',
    steps: [
      'Organize horários consistentes para levar o cão ao local adequado.',
      'Use sempre uma sequência parecida, para criar previsibilidade.',
      'Reforce acertos e mantenha paciência diante de erros.',
      'Ajuste a frequência de saídas de acordo com a idade e o histórico do cão.',
    ]
  },
  'b7-t5': {
    id: 'b7-t5', name: 'Controle de acidentes', blockId: 'b7', level: 'intermediario', duration: '8 min',
    objective: 'Corrija a rota com observação e ajustes leves.', prerequisites: ["b7-t4"], nextPossible: ["b7-t6"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "apartamento"],
    levelTag: 'intermediario',
    beforeStart: 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.',
    steps: [
      'Se houver acidente, limpe sem bronca e sem chamar atenção do cão para o erro.',
      'Observe o que aconteceu antes: tempo demais sem saída, excitação, mudança de rotina.',
      'Use essa observação para prevenir o próximo acidente.',
      'Foque mais em aumentar acertos do que em "corrigir" falhas.',
    ]
  },
  'b7-t6': {
    id: 'b7-t6', name: 'Generalização da rotina', blockId: 'b7', level: 'intermediario', duration: '12 min',
    objective: 'Consolide o comportamento em diferentes momentos do dia.', prerequisites: ["b7-t5"], nextPossible: ["b7-t7"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "apartamento"],
    levelTag: 'intermediario',
    beforeStart: 'Paciência é fundamental. Foque em recompensar os acertos nos horários certos, sem dar broncas nos erros.',
    steps: [
      'Aplique a rotina de acerto em diferentes dias, horários e pequenas variações do ambiente.',
      'Mantenha o local adequado sempre acessível e claro.',
      'Continue reforçando acertos mesmo quando o comportamento já estiver melhor.',
      'Só reduza o reforço quando a consistência estiver bem sólida.',
    ]
  },
  'b7-t7': {
    id: 'b7-t7', name: 'Associar saída à necessidade', blockId: 'b7', level: 'iniciante', duration: '10 min',
    objective: 'Crie a conexão entre sair de casa e fazer as necessidades na rua.', prerequisites: [], nextPossible: ["b7-t8"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "passeio"],
    profileTags: ["filhote", "adulto", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Leve o cão sempre no mesmo horário e vá direto ao ponto de eliminação antes de qualquer passeio ou brincadeira. A regra é: necessidade primeiro, diversão depois.',
    steps: [
      'Coloque a guia e vá diretamente para o local de eliminação sem brincadeiras no caminho.',
      'Fique parado, com pouca ou nenhuma conversa, para que o cão se concentre.',
      'Aguarde pacientemente até que ele faça xixi ou cocô.',
      'Assim que ele terminar, marque com "Muito bem!" e ofereça recompensa ou libere para o passeio.',
    ]
  },
  'b7-t8': {
    id: 'b7-t8', name: 'Reforço de rotina', blockId: 'b7', level: 'iniciante', duration: '15 min',
    objective: 'Consolide consistência e o local certo com rotina previsível e reforço imediato.', prerequisites: ["b7-t7"], nextPossible: ["b7-t9"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "passeio"],
    profileTags: ["filhote", "adulto", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Se o comportamento começou do nada em um cão já treinado, vale checar com o veterinário antes — pode ser causa médica. Nunca repreenda depois do fato: o cão não associa o castigo ao xixi de minutos atrás, só aprende a ter medo de você.',
    steps: [
      'Leve o cão sempre no mesmo local, na coleira, nos horários-chave: ao acordar, depois de comer e antes de dormir.',
      'Espere ele fazer no lugar certo — evite ficar andando, deixe o cheiro do local guiar.',
      'Assim que ele terminar, marque com elogio e dê o petisco nos primeiros 5 segundos.',
      'Reduza o espaço livre dele em casa até ele mostrar 1-2 semanas de consistência lá fora.',
    ]
  },
  'b7-t9': {
    id: 'b7-t9', name: 'Aguardar o momento certo', blockId: 'b7', level: 'iniciante', duration: '12 min',
    objective: 'Treine a paciência do cão — e a sua — no momento da eliminação.', prerequisites: ["b7-t8"], nextPossible: ["b7-t10"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "calma"],
    profileTags: ["filhote", "adulto", "apartamento"],
    levelTag: 'iniciante',
    beforeStart: 'Cães que se distraem facilmente demoram mais. Mantenha a guia curta e o ambiente o mais calmo possível. Não force nem arraste — apenas aguarde.',
    steps: [
      'Chegue ao local e fique parado, com a guia curta e sem interagir.',
      'Deixe o cão farejar a área ao redor sem se locomover demais.',
      'Evite distrair com chamados, carinhos ou movimentos enquanto ele não eliminar.',
      'Após a eliminação, elogie bastante e libere para o passeio como recompensa natural.',
    ]
  },
  'b7-t10': {
    id: 'b7-t10', name: 'Reduzir acidentes dentro de casa', blockId: 'b7', level: 'intermediario', duration: '10 min',
    objective: 'Diminua os erros internos aumentando a previsibilidade das saídas.', prerequisites: ["b7-t9"], nextPossible: ["b7-t11"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["filhote", "adulto", "apartamento"],
    levelTag: 'intermediario',
    beforeStart: 'Acidentes acontecem — não brigue com o cão por eles. O segredo é antecipar: saídas mais frequentes nos horários críticos (ao acordar, após comer, após brincar, antes de dormir).',
    steps: [
      'Anote os horários em que costumam acontecer os acidentes e programe saídas antes desses momentos.',
      'Fique de olho nos sinais de que o cão precisa ir: farejar o chão, andar em círculos, ir até a porta.',
      'Quando notar esses sinais, leve imediatamente para a rua e recompense o acerto.',
      'Se ocorrer um acidente, limpe sem chamar atenção para o cão e ajuste o horário da próxima saída.',
    ]
  },
  'b7-t11': {
    id: 'b7-t11', name: 'Eliminar em locais diferentes na rua', blockId: 'b7', level: 'intermediario', duration: '12 min',
    objective: 'Generalize o comportamento para que o cão elimine em qualquer ponto adequado fora de casa.', prerequisites: ["b7-t10"], nextPossible: ["b7-t12"],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "passeio"],
    profileTags: ["filhote", "adulto", "apartamento"],
    levelTag: 'intermediario',
    beforeStart: 'Alguns cães só eliminam em um local específico. Variar gradualmente os locais ajuda a criar flexibilidade e evita problemas em viagens ou mudanças de rotina.',
    steps: [
      'Leve o cão a um local diferente do habitual, ainda familiar (mesmo quarteirão ou praça próxima).',
      'Use o comando "Faz xixi" e aguarde como nas sessões anteriores.',
      'Recompense ao eliminar no novo local.',
      'A cada saída, varie levemente o ponto de eliminação para ampliar a generalização.',
    ]
  },
  'b7-t12': {
    id: 'b7-t12', name: 'Consistência total na rua', blockId: 'b7', level: 'intermediario', duration: '10 min',
    objective: 'Consolide o hábito de eliminar exclusivamente fora de casa.', prerequisites: ["b7-t11"], nextPossible: [],
    tags: ["higiene_necessidades"],
    problemTags: ["xixi_fora_lugar"],
    objectiveTags: ["rotina", "passeio"],
    profileTags: ["filhote", "adulto", "apartamento"],
    levelTag: 'intermediario',
    beforeStart: 'Esta etapa é de manutenção. Continue saindo com frequência e reforçando ocasionalmente os acertos. A consistência da sua rotina é o principal fator de sucesso.',
    steps: [
      'Mantenha as saídas regulares nos horários já estabelecidos.',
      'Reforce com elogios (não precisa ser petisco toda vez) quando o cão eliminar corretamente.',
      'Fique atento a mudanças de rotina — viagens, novos ambientes ou estresse podem causar regressões temporárias.',
      'Em caso de regressão, volte às saídas mais frequentes por alguns dias sem pressão.',
    ]
  },
  'b8-t1': {
    id: 'b8-t1', name: 'Aceitar toque em patas e orelhas', blockId: 'b8', level: 'avançado', duration: '8 min',
    objective: 'Desenvolva tolerância ao cuidado com mais confiança.', prerequisites: [], nextPossible: ["b8-t2"],
    tags: ["manejo"],
    problemTags: ["medo", "reatividade"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["medroso", "filhote", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.',
    steps: [
      'Toque levemente uma região por vez, por pouco tempo.',
      'Recompense se o cão permanecer calmo e tolerar o contato.',
      'Aumente a duração e a precisão do toque aos quais.',
      'Pare antes do desconforto aumentar.',
    ]
  },
  'b8-t2': {
    id: 'b8-t2', name: 'Escovação calma', blockId: 'b8', level: 'avançado', duration: '10 min',
    objective: 'Transforme o manejo em uma experiência mais leve.', prerequisites: ["b8-t1"], nextPossible: ["b8-t3"],
    tags: ["manejo"],
    problemTags: ["medo", "reatividade"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["medroso", "filhote", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.',
    steps: [
      'Mostre a escova e recompense o cão por se manter tranquilo.',
      'Faça um ou dois movimentos suaves e recompense.',
      'Alterne entre escovar e pausar, mantendo a sessão positiva.',
      'Aumente a duração gradualmente, sempre respeitando o ritmo do cão.',
    ]
  },
  'b8-t3': {
    id: 'b8-t3', name: 'Coleira e guia sem estresse', blockId: 'b8', level: 'avançado', duration: '8 min',
    objective: 'Organize o início do passeio com mais equilíbrio.', prerequisites: ["b8-t2"], nextPossible: ["b8-t4"],
    tags: ["manejo"],
    problemTags: ["medo", "reatividade"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["medroso", "filhote", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.',
    steps: [
      'Apresente coleira e guia como objetos neutros ou positivos.',
      'Recompense o cão por permitir aproximação e colocação com calma.',
      'Faça sessões curtas de colocar e tirar sem sair para passeio toda vez.',
      'Reduza a antecipação e aumente a tolerância tranquila.',
    ]
  },
  'b8-t4': {
    id: 'b8-t4', name: 'Banho e toalha', blockId: 'b8', level: 'avançado', duration: '10 min',
    objective: 'Construa cooperação nos momentos de cuidado físico.', prerequisites: ["b8-t3"], nextPossible: ["b8-t5"],
    tags: ["manejo"],
    problemTags: ["medo", "reatividade"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["medroso", "filhote", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.',
    steps: [
      'Introduza toalha, ambiente do banho e pequenos toques com água de forma leve.',
      'Recompense calma e cooperação em cada microetapa.',
      'Evite transformar a sessão em um evento longo logo no começo.',
      'Vá construindo tolerância passo a passo.',
    ]
  },
  'b8-t5': {
    id: 'b8-t5', name: 'Entrar e sair do carro / caixa', blockId: 'b8', level: 'avançado', duration: '10 min',
    objective: 'Trabalhe deslocamentos com mais segurança e fluidez.', prerequisites: ["b8-t4"], nextPossible: ["b8-t6"],
    tags: ["manejo"],
    problemTags: ["medo", "reatividade"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["medroso", "filhote", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.',
    steps: [
      'Apresente o espaço de forma aberta e segura, sem pressão.',
      'Recompense aproximação, cheirar e colocar uma pata para dentro.',
      'Depois recompense entrar totalmente e permanecer alguns segundos.',
      'Repita também a saída calma, sem pressa.',
    ]
  },
  'b8-t6': {
    id: 'b8-t6', name: 'Cooperação em contexto veterinário', blockId: 'b8', level: 'avançado', duration: '10 min',
    objective: 'Prepare o cão para manejos delicados com menos tensão.', prerequisites: ["b8-t5"], nextPossible: [],
    tags: ["manejo"],
    problemTags: ["medo", "reatividade"],
    objectiveTags: ["rotina", "convivencia"],
    profileTags: ["medroso", "filhote", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Apresente os estímulos físicos com muita leveza. Crie associações positivas a cada movimento e sem forçar.',
    steps: [
      'Simule pequenos manejos, como olhar boca, orelhas e corpo.',
      'Recompense tolerância tranquila e permanência.',
      'Faça isso em sessões curtas e positivas, fora de momentos de estresse real.',
      'O objetivo é construir previsibilidade e cooperação, não contenção.',
    ]
  },
  'b9-t1': {
    id: 'b9-t1', name: 'Toca', blockId: 'b9', level: 'iniciante', duration: '8 min',
    objective: 'Crie uma interação simples, útil e responsiva.', prerequisites: [], nextPossible: ["b9-t2"],
    tags: ["enriquecimento"],
    problemTags: ["destruicao", "falta_de_foco"],
    objectiveTags: ["foco"],
    profileTags: ["alta_energia", "agitado", "adulto"],
    levelTag: 'iniciante',
    beforeStart: 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.',
    steps: [
      'Apresente a mão aberta perto do focinho do cão.',
      'Quando ele encostar naturalmente com o nariz, marque e recompense.',
      'Repita até o gesto ficar claro.',
      'Depois adicione a palavra "Toca".',
    ]
  },
  'b9-t2': {
    id: 'b9-t2', name: 'Gira', blockId: 'b9', level: 'iniciante', duration: '8 min',
    objective: 'Trabalhe leveza, atenção e coordenação.', prerequisites: ["b9-t1"], nextPossible: ["b9-t3"],
    tags: ["enriquecimento"],
    problemTags: ["destruicao", "falta_de_foco"],
    objectiveTags: ["foco"],
    profileTags: ["alta_energia", "agitado", "adulto"],
    levelTag: 'iniciante',
    beforeStart: 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.',
    steps: [
      'Use um petisco para guiar o cão em um pequeno círculo.',
      'Quando ele completar o movimento, marque e recompense.',
      'Faça para os dois lados, se possível.',
      'Depois adicione a palavra "Gira".',
    ]
  },
  'b9-t3': {
    id: 'b9-t3', name: 'Vai para a cama', blockId: 'b9', level: 'intermediario', duration: '10 min',
    objective: 'Dê ao cão um ponto claro de pausa e organização.', prerequisites: ["b9-t2"], nextPossible: ["b9-t4"],
    tags: ["enriquecimento"],
    problemTags: ["destruicao", "falta_de_foco"],
    objectiveTags: ["foco"],
    profileTags: ["alta_energia", "agitado", "adulto"],
    levelTag: 'intermediario',
    beforeStart: 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.',
    steps: [
      'Aponte o tapete ou caminha e incentive o cão a ir até lá.',
      'Recompense quando ele colocar as patas e depois quando permanecer.',
      'Aos quais, transforme isso em um comando funcional.',
      'Use em momentos calmos para criar associação positiva.',
    ]
  },
  'b9-t4': {
    id: 'b9-t4', name: 'Busca objeto', blockId: 'b9', level: 'intermediario', duration: '12 min',
    objective: 'Estimule foco, engajamento e retorno ao tutor.', prerequisites: ["b9-t3"], nextPossible: ["b9-t5"],
    tags: ["enriquecimento"],
    problemTags: ["destruicao", "falta_de_foco"],
    objectiveTags: ["foco"],
    profileTags: ["alta_energia", "agitado", "adulto"],
    levelTag: 'intermediario',
    beforeStart: 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.',
    steps: [
      'Escolha um brinquedo leve e interessante para o cão.',
      'Jogue a curta distância e incentive-o a pegar.',
      'Recompense quando ele retornar com o objeto ou se aproximar de você com ele.',
      'Trabalhe aos quais a entrega, sem transformar em disputa.',
    ]
  },
  'b9-t5': {
    id: 'b9-t5', name: 'Procura petisco', blockId: 'b9', level: 'intermediario', duration: '10 min',
    objective: 'Ative o faro e a concentração de forma prazerosa.', prerequisites: ["b9-t4"], nextPossible: ["b9-t6"],
    tags: ["enriquecimento"],
    problemTags: ["destruicao", "falta_de_foco"],
    objectiveTags: ["foco"],
    profileTags: ["alta_energia", "agitado", "adulto"],
    levelTag: 'intermediario',
    beforeStart: 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.',
    steps: [
      'Mostre um petisco ao cão e esconda em um lugar fácil.',
      'Diga um sinal como "Procura!" e deixe-o buscar.',
      'Recompense a exploração calma e o sucesso na busca.',
      'Aumente a dificuldade aos quais, sempre mantendo a brincadeira divertida.',
    ]
  },
  'b9-t6': {
    id: 'b9-t6', name: 'Encadeamento de comandos básicos', blockId: 'b9', level: 'avançado', duration: '12 min',
    objective: 'Una comportamentos conhecidos em uma sequência mais fluida.', prerequisites: ["b9-t5"], nextPossible: [],
    tags: ["enriquecimento"],
    problemTags: ["destruicao", "falta_de_foco"],
    objectiveTags: ["foco"],
    profileTags: ["alta_energia", "agitado", "adulto"],
    levelTag: 'avancado',
    beforeStart: 'Em cenários com mais distrações, o ritmo do cão e a clareza da sua comunicação são essenciais. Respeite os sinais de desconforto.',
    steps: [
      'Escolha dois comandos que o cão já conheça bem, como "Senta" e "Fica".',
      'Peça o primeiro, depois o segundo, com calma e clareza.',
      'Recompense quando ele completar a sequência.',
      'Aumente para três passos curtos apenas quando a combinação estiver fluida.',
    ]
  },
};
