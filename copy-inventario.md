# Inventário de Copy — App Focão

> ⚠️ **DESATUALIZADO** — este inventário reflete a copy **até a v0.3.0**. A revisão de tom **v0.4.0** (09/07/2026) alterou ~105 strings em 30 arquivos (régua de tom: convite, sentence case, sem "com sucesso"/"Por favor", `{dogName}`, etc.) e **NÃO** está refletida aqui. Para o texto atual, consulte o código-fonte ou regenere este inventário.

> Documento gerado em **09/07/2026**. Inventário exaustivo de todos os textos voltados ao usuário (UI em português) extraídos do código-fonte em `src/`.
>
> **Convenções:**
> - Textos dinâmicos aparecem como template com variáveis entre chaves, ex.: `Faz {daysSince} dias`.
> - Cada variante condicional é uma linha própria, com a condição na coluna *Contexto*.
> - `[BACKEND]` = texto que vem do Firestore/repositórios/motors (não hardcoded na tela).
> - Textos de `className` foram ignorados; foco em texto exibido, `aria-label`, `placeholder`, `title`, `alert`/`confirm`, toasts e notificações.

---

## Índice de fluxos

1. Onboarding
2. Autenticação (Welcome, Login, Registro, Recuperação, Ativação, Confirmação)
3. Home
4. Plano
5. Treino
6. Check-in
7. Evolução
8. Perfil / Editar Perfil
9. Nutrição
10. Vacinas
11. Agenda
12. Histórico de Treinos / Treinos SOS
13. Relatórios (Semanal / Impressão)
14. Notificações (tela) / Assinatura
15. Indique e Ganhe
16. Suporte / Ajuda (FAQ)
17. Beta / Manutenção / DevTools
18. Ebook Landing / Presell / Política de Privacidade
19. Admin (Check-ins / Notificações)
20. Componentes compartilhados / Tab bar
21. Copy dinâmica dos motors
22. Biblioteca de treinos (nomes/objetivos)
23. Notificações locais / WhatsApp / E-mails (services)

---

## 1. Onboarding

### OnboardingIntro

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Benefício 1 - título | Card de benefícios | Plano em sequência |
| Benefício 1 - descrição | Card de benefícios | Treinos claros, organizados por etapa e sem bagunçar a evolução. |
| Benefício 2 - título | Card de benefícios | Check-ins comportamentais |
| Benefício 2 - descrição | Card de benefícios | Registre a rotina e ajude o Focão a entender o que está mudando. |
| Benefício 3 - título | Card de benefícios | Evolução visível |
| Benefício 3 - descrição | Card de benefícios | Acompanhe progresso, consistência e próximos passos. |
| Cabeçalho (title) | Topo | Treinos guiados, evolução visível e rotina mais clara. |
| Cabeçalho (subtitle) | Topo | O Focão organiza o próximo passo do seu cão e acompanha a evolução ao longo da jornada. |
| Cabeçalho (step) | Mini-label do topo | COMECE PELO ESSENCIAL |
| Aviso beta | Somente quando `isBeta` | Você está usando uma versão beta gratuita e em validação. |
| Card destaque - título | Card principal | Em poucos minutos, seu plano inicial fica pronto. |
| Card destaque - parágrafo | Card principal | Vamos pedir só o necessário agora. Depois você pode completar o perfil para deixar relatórios e recomendações mais precisos. |
| Botão principal | Rodapé (loading enquanto `isContinuing`) | Começar agora |

### DogData (Etapa 1 de 6)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Sobre seu cão |
| Cabeçalho (subtitle) | Topo | Só precisamos do básico para montar a primeira trilha de treino. |
| Cabeçalho (step) | Mini-label | ETAPA 1 DE 6 |
| Mini-label cão pré-preenchido | Beta, cão já cadastrado (`hideBetaPrefilledBasics`) | Cão cadastrado |
| Input label | Quando NÃO pré-preenchido | Nome do cão |
| Input placeholder | Quando NÃO pré-preenchido | Ex: Bento |
| Label sexo | Campo sexo | Sexo |
| Opção sexo | Botões | Macho |
| Opção sexo | Botões | Fêmea |
| Label fase | Campo fase da vida | Fase da vida |
| Placeholder seletor fase | Nenhuma fase selecionada | Selecione a fase |
| Label idade | Campo idade | Idade aprox. |
| Placeholder seletor idade | Idade não preenchida | Opcional |
| Label peso | Campo peso | Peso aprox. |
| Placeholder input peso | Campo peso | Ex: 15.5 |
| Sufixo peso | Ao lado do input | kg |
| Parágrafo informativo | Card | Você poderá adicionar raça, alimentação, convivência, foto e detalhes avançados depois no perfil. |
| Erro | Falta fase da vida ou sexo | Preencha os dados essenciais do seu cão. |
| Erro | `validateDogBasics` retorna erro | [BACKEND] {validationError} (ver seção Validação) |
| Botão | Rodapé | Continuar |
| BottomSheet fase - título | Modal fase da vida | Fase da vida |
| BottomSheet fase - placeholder | Modal fase da vida | Buscar fase... |
| BottomSheet idade - título | Modal idade | Idade aproximada |
| BottomSheet idade - placeholder | Modal idade | Buscar idade... |

### Routine (Etapa 2 de 6)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Rotina básica |
| Cabeçalho (subtitle) | Topo | Essas informações ajudam a ajustar a sequência inicial de treinos. |
| Cabeçalho (step) | Mini-label | ETAPA 2 DE 6 |
| Seção moradia (uppercase) | — | Onde ele vive? |
| Opção apartment - título | Card moradia | Apartamento |
| Opção apartment - descrição | Card moradia | Rotina com menos espaço físico e mais necessidade de previsibilidade. |
| Opção house - título | Card moradia | Casa |
| Opção house - descrição | Card moradia | Ambiente com mais espaço e estímulos próprios da casa. |
| Seção passeios (uppercase) | — | Quantos passeios por dia? |
| Opção passeios | Botões | Não passeia |
| Opção passeios | Botões | 1 vez |
| Opção passeios | Botões | 2 vezes |
| Opção passeios | Botões | 3+ vezes |
| Seção duração (uppercase) | Só se `shouldAskDuration` (passeia) | Duração média |
| Opção duração | Botões | 15 min |
| Opção duração | Botões | 30 min |
| Opção duração | Botões | 1h |
| Opção duração | Botões | 2h+ |
| Botão | Rodapé | Continuar |

### Personality (Etapa 3 de 6)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Energia e personalidade |
| Cabeçalho (subtitle) | Topo (dinâmico; `dogName` fallback "seu cão") | Agora vamos entender melhor como o {dogName} se comporta no dia a dia. Essas informações ajudam o app a ajustar os treinos, a rotina e a forma ideal de conduzir cada etapa. |
| Cabeçalho (step) | Mini-label | ETAPA 3 DE 6 |
| Seção energia (uppercase) | Dinâmico com nome | COMO VOCÊ DESCREVERIA O NÍVEL DE ENERGIA DO {dogName MAIÚSCULO}? |
| Opção energia (low) | Botões | Baixo |
| Opção energia (medium) | Botões | Moderado |
| Opção energia (high) | Botões | Alto |
| Seção personalidade (uppercase) | — | QUAL OPÇÃO MAIS COMBINA COM A PERSONALIDADE DELE? |
| Traço | Chips | Calmo |
| Traço | Chips | Sociável |
| Traço | Chips | Brincalhão |
| Traço | Chips | Independente |
| Traço | Chips | Medroso |
| Traço | Chips | Agitado |
| Traço | Chips | Teimoso |
| Traço | Chips | Atento |
| Seção recompensa (uppercase) | Dinâmico com nome | O QUE MAIS CHAMA A ATENÇÃO DO {dogName MAIÚSCULO} E PODE FUNCIONAR MELHOR COMO RECOMPENSA DURANTE OS TREINOS? |
| Opção recompensa (treats) | Grid | Petiscos |
| Opção recompensa (toys) | Grid | Brinquedos |
| Opção recompensa (praise) | Grid | Elogios e carinho |
| Opção recompensa (play) | Grid | Bolinha / brincadeiras |
| Opção recompensa (food) | Grid | Comida em geral |
| Opção recompensa (unknown) | Grid | Ainda não sei |
| Confirm (window.confirm) | Ao avançar em `isUpdateMode` | Vamos gerar um novo plano com base no seu perfil. Seus treinos já concluídos serão mantidos. |
| Alert (window.alert) | Falha ao recalcular plano (updateMode) | Não foi possível recalcular seu plano agora. Tente novamente em instantes. |
| Botão | Rodapé | Próximo |

### Behavior (Etapa 4 de 6)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Maior dificuldade |
| Cabeçalho (subtitle) | Topo | Marque o que mais atrapalha a rotina hoje. |
| Cabeçalho (step) | Mini-label | ETAPA 4 DE 6 |
| Opção (pulling) | Card | Puxa muito no passeio |
| Opção (barking) | Card | Late demais |
| Opção (lack_focus) | Card | Não consegue focar |
| Opção (agitation) | Card | Fica muito agitado |
| Opção (destructive) | Card | Destrói objetos |
| Opção (separation_anxiety) | Card | Ansiedade ao ficar sozinho |
| Opção (none) | Card | Quero começar pelo básico |
| Botão | Rodapé | Continuar |

### TrainingBase (Etapa 5 de 6)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Base de treino |
| Cabeçalho (subtitle) | Topo | Isso evita recomendar comandos que ele já domina. |
| Cabeçalho (step) | Mini-label | ETAPA 5 DE 6 |
| Opção (beginner) - título | Card nível | Iniciante |
| Opção (beginner) - descrição | Card nível | Ainda não sabe comandos ou precisa reforçar a base. |
| Opção (intermediate) - título | Card nível | Intermediário |
| Opção (intermediate) - descrição | Card nível | Já entende alguns comandos básicos. |
| Opção (advanced) - título | Card nível | Avançado |
| Opção (advanced) - descrição | Card nível | Obedece bem a vários comandos. |
| Seção comandos | Nível intermediário/avançado | Quais comandos ele já sabe? |
| Comando | Chips (interm./avanç.) | Senta |
| Comando | Chips | Fica |
| Comando | Chips | Deita |
| Comando | Chips | Vem |
| Comando | Chips | Junto |
| Comando | Chips | Solta |
| Comando | Chips | Não pular |
| Comando | Chips (só avançado) | Toca |
| Comando | Chips (só avançado) | Gira |
| Comando | Chips (só avançado) | Cumprimenta |
| Comando | Chips (só avançado) | Rasteja |
| Comando | Chips (só avançado) | Buscar |
| Comando | Chips (só avançado) | Morto |
| Comando | Chips (só avançado) | Busca por faro |
| Botão | Rodapé | Continuar |

### Goals (Etapa 6 de 6)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Objetivo principal |
| Cabeçalho (subtitle) | Topo | Escolha o foco inicial. Depois o plano pode evoluir com base no histórico. |
| Cabeçalho (step) | Mini-label | ETAPA 6 DE 6 |
| Opção (obedience) | Lista | Melhorar obediência básica |
| Opção (walks) | Lista | Melhorar passeio na guia |
| Opção (focus) | Lista | Aumentar foco e atenção |
| Opção (anxiety_alone) | Lista | Reduzir ansiedade ao ficar sozinho |
| Opção (barking) | Lista | Reduzir latidos |
| Opção (destruction) | Lista | Evitar destruição de objetos |
| Opção (routine) | Lista | Criar uma rotina melhor |
| Opção (other) | Lista | Outro |
| Label observação | Campo | Algo importante? |
| Parágrafo auxiliar | Campo observação | Se quiser, conte em uma frase o que mais quer melhorar. |
| Placeholder textarea | Campo observação | Ex: ele morde quando fica muito agitado... |
| Botão | Rodapé (desabilitado sem objetivo) | Criar plano |

### HealthCare (Etapa 3 de 7 — fluxo estendido de alimentação/saúde)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Alimentação atual |
| Cabeçalho (subtitle) | Topo (dinâmico; `dogName` fallback "seu cão") | Conte como o {dogName} se alimenta hoje para personalizarmos melhor as recomendações nutricionais. |
| Cabeçalho (step) | Mini-label | ETAPA 3 DE 7 |
| Label dietas | Dinâmico | Como o {dogName} se alimenta hoje? |
| Opção dieta | Botões | Ração seca |
| Opção dieta | Botões | Ração úmida |
| Opção dieta | Botões | Alimentação natural |
| Opção dieta | Botões | Mista |
| Label marca | Dieta = Mista | Qual a marca principal? |
| Label marca | Dieta ração e ≠ Mista | Qual marca ele usa hoje? |
| Placeholder seletor marca | Marca não selecionada | Ex: Royal Canin, PremieR... |
| Placeholder input marca livre | Marca "Outra"/fora da lista | Digite a marca da ração... |
| Label linha | Dieta = Mista | Qual é a linha principal? |
| Label linha | Ração e ≠ Mista | Qual é a linha da ração? |
| Placeholder seletor linha | Linha não selecionada | Selecione a linha da ração... |
| Placeholder input linha livre | Linha "Outra"/fora da lista | Digite a linha da ração... |
| Label fase | Seção ração | Em qual fase ele está? |
| Opção fase | Botões | Filhote |
| Opção fase | Botões | Adulto |
| Opção fase | Botões (salvo como "Senior") | Sênior |
| Label versão | Seção ração | A fórmula é de algum tipo específico? |
| Opção versão | Botões | Padrão |
| Opção versão | Botões | Castrado |
| Opção versão | Botões | Light |
| Opção versão | Botões | Sensível |
| Opção versão | Botões | Outra versão |
| Label natural | Dieta = Alimentação natural | Detalhes da Alimentação Natural |
| Placeholder textarea natural | Dieta natural | Ex: dietas cruas, cozidas, restrições... |
| Label orientação | Dieta natural | Acompanha orientação profissional? |
| Opção orientação | Botões | Sim, com nutrólogo/vet |
| Opção orientação | Botões | Não, faço por conta |
| Opção orientação | Botões | Pretendo buscar |
| Label refeições | Qualquer dieta | Quantas vezes ele come por dia? |
| Opção refeições | Botões | 1 vez |
| Opção refeições | Botões | 2 vezes |
| Opção refeições | Botões | 3 vezes |
| Opção refeições | Botões | 4 ou mais |
| Input label quantidade | Ração | Você sabe quanto ele come por dia hoje? (Opcional) |
| Input placeholder quantidade | Ração | Ex: 120 |
| Sufixo quantidade | Ração | gramas |
| Título seção | Bloco geral | Informações Gerais |
| Input label peso | — | Peso atual |
| Input placeholder peso | — | 00.0 |
| Sufixo peso | — | kg |
| Input label | Data | Última vacina |
| Input label | Data | Próxima vacina |
| Input label | Data | Próximo check-up |
| Label observações | Campo | Observações de saúde (opcional) |
| Placeholder textarea observações | Campo | Alguma condição de saúde, alergia ou preferência que devemos saber? |
| Dica - label | Card | Dica do Especialista |
| Dica - texto | Card | Manter o peso ideal aumenta a longevidade em até 20%. |
| Erro | Dieta não selecionada | Por favor, selecione como o cão se alimenta. |
| Erro | Refeições não informadas | Por favor, informe a quantidade de refeições. |
| Erro | Peso não informado | Por favor, informe o peso atual. |
| Erro | Peso fora do intervalo | Informe um peso entre 0.1 e {DOG_WEIGHT_MAX_KG} kg. |
| Erro | Falha ao agendar lembretes | Ocorreu um erro ao agendar os lembretes. |
| Botão | Rodapé normal | Próximo passo |
| Botão | Enquanto `isSubmitting` | Salvando... |
| BottomSheet marca - título | Modal | Selecione a Marca |
| BottomSheet marca - placeholder | Modal | Buscar marca... |
| BottomSheet marca - opções | Modal (fonte remota) | [BACKEND] `NutritionFormulaRepository.getFoodOptions()` + "Outra" |
| BottomSheet linha - título | Modal | Selecione a Linha |
| BottomSheet linha - placeholder | Modal | Buscar linha... |
| BottomSheet linha - opções | Modal (fonte remota) | [BACKEND] `NutritionFormulaRepository.getFoodOptions()` + "Outra" |

### Analyzing (montagem do plano)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Label comportamento (pulling) | Passos de análise | puxar na guia |
| Label comportamento (barking) | Passos | latidos excessivos |
| Label comportamento (lack_focus) | Passos | falta de foco |
| Label comportamento (agitation) | Passos | agitação e impulsividade |
| Label comportamento (destructive) | Passos | destruir objetos |
| Label comportamento (separation_anxiety) | Passos | ansiedade ao ficar sozinho |
| Label objetivo (obedience) | Passos | obediência básica |
| Label objetivo (walks) | Passos | passeio sem puxar |
| Label objetivo (focus) | Passos | foco e atenção |
| Label objetivo (anxiety_alone) | Passos | reduzir a ansiedade |
| Label objetivo (barking) | Passos | reduzir os latidos |
| Label objetivo (destruction) | Passos | evitar a destruição |
| Label objetivo (routine) | Passos | criar uma rotina melhor |
| Label nível (beginner) | Passos | iniciante |
| Label nível (intermediate) | Passos | intermediário |
| Label nível (advanced) | Passos | avançado |
| Passo análise 1 | Sempre (dinâmico) | Analisando o perfil {name}… |
| Passo análise 2 | Há comportamento identificado | Identifiquei a dificuldade: {problem}. |
| Passo análise 2 (alt) | Sem comportamento identificado | Montando uma base sólida de fundamentos. |
| Passo análise 3 | Há objetivo | Priorizando seu objetivo: {goal}. |
| Passo análise 4 | Sempre (dinâmico) | Ajustando ao nível {nível} do {name}. |
| Passo análise 5 | Sempre | Selecionando e ordenando os treinos ideais… |
| alt imagem | Avatar do cão (com foto) | Cão |
| Inicial fallback avatar | Sem nome | C |
| Título | Tela de progresso | Montando o plano |
| Subtítulo | Progresso (dinâmico) | Personalizando cada treino para {dogDisplayName}. |
| Porcentagem | Anel de progresso | {progress}% |
| Alert (window.alert) | Erro ao salvar onboarding | Erro de permissão ou conexão: {error.message} |

---

## 2. Autenticação

### Welcome

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Título | `isBeta` | Bem-vindo ao Beta do Focão. |
| Título | Não beta | Uma vida com mais harmonia. |
| Parágrafo | `isBeta` | Você foi convidado para testar gratuitamente a versão inicial do app. Seu uso e seu feedback vão nos ajudar a melhorar a experiência antes do lançamento oficial. |
| Parágrafo | Não beta | Acompanhamento premium de rotina, treino e saúde para tutores que exigem o melhor. |
| Botão primário | `isBeta` | Começar teste |
| Botão primário | Não beta | Criar minha conta |
| Botão secundário | `isBeta` | Saiba como funciona |
| Botão secundário | Não beta | Já sou membro |
| Botão terciário (link) | Só `isBeta` | Já tenho conta |

### Login

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Bem-vindo de volta. |
| Cabeçalho (subtitle) | Fluxo de ativação (`isActivationFlow`) | Entre na sua conta para concluir a ativação da assinatura vinculada a este e-mail. |
| Cabeçalho (subtitle) | Fluxo normal | Ficamos felizes em ter você e seu cãozinho por aqui mais uma vez. |
| Aviso sucesso | `registrationState.registered` | Conta criada com sucesso. Entre com o e-mail e a senha que você acabou de cadastrar. |
| Aviso sucesso | `registrationState.passwordReset` | Senha atualizada com sucesso. Entre com sua nova senha. |
| Input label | E-mail | E-mail |
| Input placeholder | E-mail | seu@email.com |
| Input label | Senha | Senha |
| Input placeholder | Senha | ******** |
| Erro | Campos vazios | Por favor, preencha todos os campos. |
| Erro | Credencial inválida (`auth/invalid-credential`) | E-mail ou senha incorretos. |
| Erro | Outro erro | Erro ao entrar. Tente novamente. |
| Link | Abaixo do formulário | Esqueci minha senha |
| Botão | Rodapé (loading) | Entrar |

### Register

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | `isBeta` | Crie seu acesso beta |
| Cabeçalho (title) | Não beta | Comece sua jornada. |
| Cabeçalho (subtitle) | `isBeta` | Preencha seus dados para começar a testar o app. |
| Cabeçalho (subtitle) | Não beta | Crie sua conta para acompanhar a rotina, os treinos e a evolução do seu cão. |
| Input label | Nome | Seu nome |
| Input placeholder | Nome | Como quer ser chamado(a)? |
| Input label | E-mail | E-mail |
| Input placeholder | E-mail, `isBeta` | seu melhor e-mail |
| Input placeholder | E-mail, não beta | mesmo e-mail do pagamento |
| Input label | WhatsApp (só beta) | WhatsApp |
| Input placeholder | WhatsApp (só beta) | com DDD |
| Input label | Nome do cão (só beta) | Nome do cachorro |
| Input placeholder | Nome do cão (só beta) | Ex: Bento |
| Input label | Idade do cão (só beta) | Idade do cachorro |
| Input placeholder | Idade do cão (só beta) | Ex: 2 anos |
| Input label | Senha | Senha |
| Input placeholder | Senha | Mínimo 6 caracteres |
| Erro | Campos obrigatórios vazios | Por favor, preencha todos os campos. |
| Erro | Falha ao finalizar acesso beta | Sua conta foi criada, mas não conseguimos finalizar o acesso beta. Confira sua conexão e toque em Entrar no Beta novamente para completar. |
| Info | E-mail já em uso + ativar (envio ok) | Este e-mail já possui conta. Enviamos um link de recuperação para você concluir a ativação. |
| Info | E-mail já em uso + beta (envio ok) | Este e-mail já possui conta. Enviamos um link para você recuperar o acesso e entrar no beta. |
| Info | E-mail já em uso + normal (envio ok) | Este e-mail já possui conta. Enviamos um link de recuperação para o seu e-mail. |
| Erro | E-mail já em uso + ativar (falha envio) | Este e-mail já possui conta. Entre nele para concluir a ativação do acesso. |
| Erro | E-mail já em uso + beta (falha envio) | Este e-mail já possui conta. Faça login com ele para entrar no beta ou use "Esqueci minha senha". |
| Erro | E-mail já em uso + normal (falha envio) | Este e-mail já possui conta. Faça login ou use "Esqueci minha senha" para continuar. |
| Erro | Senha fraca (`auth/weak-password`) | A senha precisa ter pelo menos 6 caracteres. |
| Erro | E-mail inválido (`auth/invalid-email`) | Informe um e-mail válido. |
| Erro | Genérico ao criar conta | Não foi possível criar sua conta agora. Tente novamente. |
| Botão | Rodapé, `isBeta` (loading) | Entrar no Beta |
| Botão | Rodapé, não beta (loading) | Continuar |
| Nota | Abaixo do botão, só beta | Você está acessando uma versão beta gratuita do app. |

### ForgotPassword

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Esqueci minha senha |
| Cabeçalho (subtitle) | Fluxo de ativação | Informe o e-mail da conta para recuperar a senha e concluir a ativação. |
| Cabeçalho (subtitle) | Fluxo normal | Informe seu e-mail para receber um link de redefinição. |
| Sucesso - título | `success` | E-mail enviado |
| Sucesso - texto | `success` + ativação | Se houver uma conta vinculada a este e-mail, você receberá um link para redefinir sua senha e concluir a ativação. |
| Sucesso - texto | `success` + normal | Se houver uma conta vinculada a este e-mail, você receberá um link para redefinir sua senha. |
| Input label | Não sucesso | E-mail |
| Input placeholder | Não sucesso | seu@email.com |
| Erro | E-mail vazio | Por favor, informe seu e-mail. |
| Erro | E-mail inválido (`auth/invalid-email`) | Informe um e-mail válido. |
| Erro | Muitas tentativas (`auth/too-many-requests`) | Muitas tentativas. Aguarde alguns minutos e tente novamente. |
| Erro | Genérico | Não foi possível enviar o e-mail agora. Tente novamente. |
| Botão | Estado normal | Enviar link |
| Botão | `success` | Enviar novamente |
| Link | Rodapé | Voltar para o login |

### ResetPassword

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Topo | Crie uma nova senha |
| Cabeçalho (subtitle) | Topo | Escolha uma senha segura para voltar a acessar sua conta. |
| Input label | Link válido | Nova senha |
| Input placeholder | Link válido | Mínimo de 6 caracteres |
| Input label | Confirmação | Confirme sua nova senha |
| Input placeholder | Confirmação | Digite novamente |
| Erro | Link sem oobCode | Este link de redefinição está incompleto. |
| Erro | Link expirado/usado | Este link expirou ou já foi utilizado. Solicite um novo e-mail de recuperação. |
| Erro | Senha < 6 caracteres | A nova senha precisa ter pelo menos 6 caracteres. |
| Erro | Senhas não coincidem | As senhas não coincidem. |
| Erro | Falha ao redefinir | Não foi possível redefinir sua senha. Solicite um novo link e tente novamente. |
| Botão | Link válido (loading) | Salvar nova senha |
| Botão | Link inválido | Solicitar novo link |

### Ativar (ativação de assinatura)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Título | Status `loading` | Verificando pagamento... |
| Texto | Status `loading` (dinâmico) | Buscando sua assinatura vinculada ao e-mail {user.email}. |
| Título | Status `success` | Premium ativado! |
| Badge | Status `success` | Bem-vindo ao Focão Premium |
| Texto | Status `success` | Seu acesso completo foi liberado. Aproveite todos os treinos personalizados e recursos exclusivos. |
| Botão | Status `success` | Comecar jornada _(sic — sem acento no código)_ |
| Título | Status `already-active` | Premium já ativo! |
| Texto | Status `already-active` | Você já possui acesso ilimitado às funcionalidades Premium do Focão. Redirecionando... |
| Título | Status `no-auth` | Login necessario _(sic)_ |
| Texto | Status `no-auth` | Entre na conta vinculada ao pagamento. Se esqueceu a senha, use a recuperacao e volte para esta ativacao. _(sic)_ |
| Botão | Status `no-auth` | Fazer login |
| Botão | Status `no-auth` | Recuperar senha |
| Botão | Status `no-auth` | Criar conta |
| Título | Status `error` | Ativacao pendente _(sic)_ |
| Texto | Status `error`, nenhuma ativação | Não encontramos nenhuma ativação pendente para o e-mail {user.email}. Se você acabou de pagar, aguarde 1 a 2 minutos e atualize esta página. |
| Texto | Status `error`, exceção genérica | Ocorreu um erro ao verificar sua ativação. Tente novamente. |
| Botão | Status `error` | Tentar novamente |
| Botão | Status `error` | Entrar em outra conta |
| Botão | Status `error` | Recuperar senha |
| Botão | Status `error` | Ir para a home grátis |

### EmailConfirmed

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Cabeçalho (title) | Status `success` | E-mail confirmado |
| Cabeçalho (title) | Status `error` | Não foi possível confirmar |
| Cabeçalho (title) | Status `loading` | Confirmando e-mail |
| Cabeçalho (subtitle) | Status `loading` | Aguarde enquanto validamos seu link de confirmação. |
| Cabeçalho (subtitle) | Status `success`/`error` | {message} (dinâmico, abaixo) |
| Mensagem (success) | Link válido | Seu e-mail foi confirmado com sucesso. Agora você já pode entrar no Focão. |
| Mensagem (error) | Link incompleto/inválido | Este link de confirmação está incompleto ou inválido. |
| Mensagem (error) | Link expirado/usado | Este link expirou ou já foi utilizado. Entre na sua conta para solicitar um novo envio, se necessário. |
| Botão | Rodapé (desabilitado em loading) | Entrar no app |

### AuthLayout (compartilhado)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Confirm (window.confirm) | Ao tocar em sair (logout) | Deseja realmente sair da sua conta? |
| alt imagem | Imagem de topo (`topImage`) | Fundo |
| title (attr) | Botão de logout (`showLogoutButton`) | Encerrar sessão |

---

## 3. Home

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Fallback nome do usuário | Sem nome | Tutor |
| Notificação nativa (título) | Recompensa de indicação (indicador) | 🎁 Recompensa liberada! |
| Notificação nativa (corpo) | Amigo ativou Premium; `friendName` fallback "Seu amigo" | {friendName} ativou o Premium e você ganhou +7 dias de acesso Premium. |
| Notificação nativa (título) | Recompensa (indicado) | 🎉 Obrigado por apoiar o Focão! |
| Notificação nativa (corpo) | Assinatura ativada (indicado); `referrerName` fallback "Tutor" | Sua assinatura foi ativada com sucesso. Além disso, {referrerName} (que te convidou) acabou de receber +7 dias Premium graças à sua indicação. 🐶💛 |
| Header (mini-label) | Saudação; fallback "Tutor" | Olá, {primeiroNome} |
| Header (título) | Há nome do cão; `dogArticle`=a/o | Como está {dogArticle} {dogName}? |
| Header (título) | Sem nome do cão | Resumo de hoje |
| Botão notificações | aria-label do sino | Notificações |
| Avatar do cão (alt) | Com foto | Avatar do cão |
| Avatar do cão (fallback) | Sem foto; inicial fallback "C" | {inicial} / C |
| Seção Beta (mini-label) | `isBeta` | Beta Focão |
| Seção Beta (título) | `isBeta` | Você está no Beta do Focão |
| Seção Beta (texto) | `isBeta` | Use o app normalmente e, quando puder, nos envie seu feedback. Isso vai ajudar a construir a versão oficial. |
| Seção Beta (botão) | `isBeta` | Enviar feedback |
| Banner alerta prioritário | `priorityAlert` presente | [BACKEND] {homeState.priorityAlert} (ver HomeMotor) |
| Banner WhatsApp (título) | `whatsappEnabled !== true` | WhatsApp do Focão |
| Banner WhatsApp (texto) | `whatsappEnabled !== true` | Receba lembretes de treino, avisos de inatividade e relatórios semanais direto no seu WhatsApp. |
| Banner WhatsApp (botão) | `whatsappEnabled !== true` | Conectar WhatsApp |
| Banner upgrade plano (título) | `showPlanUpgradeBanner` | Deixe seu plano mais inteligente |
| Banner upgrade plano (texto) | `showPlanUpgradeBanner` | Responda mais algumas perguntas e recalculamos seu plano com base no perfil do seu cão. Seus treinos já concluídos são mantidos. |
| Banner upgrade plano (botão) | `showPlanUpgradeBanner` | Recalcular plano |
| Banner upgrade plano (botão) | `showPlanUpgradeBanner` | Agora não |
| Card relatório pronto (título) | `showReportReady` | Relatório da Semana |
| Card relatório pronto (texto) | `showReportReady` | Sua análise semanal está pronta. |
| Card treino do dia (badge) | Treino concluído hoje | Concluído |
| Card treino do dia (badge) | Treino pendente | Treino do Dia |
| Card treino do dia (título) | Hero | [BACKEND] {homeState.heroTitle} (ver HomeMotor) |
| Card treino do dia (subtítulo) | Hero | [BACKEND] {homeState.heroSubtitle} |
| Card treino do dia (CTA) | Hero | [BACKEND] {homeState.heroCta} |
| Card "tudo concluído" (título) | Sem tarefa ativa e sem treino hoje | Tudo concluído! |
| Card "tudo concluído" (texto) | Mesma condição | Aguarde a geração do seu próximo plano de treinos pelo sistema. |
| Gap Directive (mini-label) | `gapDirective` presente | Hoje {dogName} precisa... |
| Gap Directive (texto) | `gapDirective` presente | Que tal retomar {gapDirective.skillLabel}? |
| Gap Directive (sugestão) | `gapDirective` presente | [BACKEND] {gapDirective.suggestion} (ver DailyMissionsMotor) |
| Missões da semana (mini-label) | `dailyMissions.length > 0` | Missões da semana |
| Missão (texto/quando/duração) | Cada missão | [BACKEND] {mission.text} / {mission.when} / {mission.duration} (ver DailyMissionsMotor) |
| Bento Check-in (título) | Sempre | Check-in |
| Bento Check-in (status) | `hasCheckedInToday` | ✓ Feito hoje · toque pra editar |
| Bento Check-in (status) | Não feito | Pendente hoje |
| Bento Nutrição (título) | Sempre | Alimentação |
| Bento Nutrição (status) | `nutritionIsPending` | Configuração pendente |
| Bento Nutrição (status) | Configurado | Sugestão consciente |
| Card Treinos SOS (título/texto) | Sempre | Treinos SOS / Ajuda rápida para crise |
| Card Agenda (título/texto) | Sempre | Agenda do Cão / Ver próximos treinos |
| Card Evolução (título) | Sempre | Evolução Geral |
| Card Evolução (subtítulo) | `totalSessions` fallback 0 | {n} treinos realizados |
| Card Evolução (streak) | `streak > 0` | {streak} dias |
| Card Evolução (label) | `planTotalTasks > 0` | Progresso do plano |
| Card Evolução (percentual) | `planTotalTasks > 0` | {planProgressPct}% |
| Card Evolução (etapa) | `planTotalTasks > 0` | Etapa {planDoneTasks} de {planTotalTasks} |
| Card Evolução (link) | `planTotalTasks > 0` | Ver detalhes |
| Card Evolução (texto) | `planTotalTasks === 0` | Acompanhe a evolução {dogArticle} {dogName} |
| Checkin Insights (título) | `hasEnoughData` e `isPremium` | Padrão observado |
| Checkin Insights (texto) | Mesma condição | [BACKEND] {checkinInsights.insightText} (ver CheckinInsightsMotor) |
| Painel notificações (título) | Painel aberto | Notificações |
| Painel notificações (vazio) | `notifications.length === 0` | Nenhuma notificação no momento. |
| Notificação item (título/mensagem) | Cada notificação | [BACKEND] {n.title} / {n.message} |
| Modal promo (ícone) | referral_reward_indicator / outro | 🎁 / 🎉 |
| Modal promo (título/corpo) | Modal aberto | [BACKEND] {promoNotification.title} / {promoNotification.body} |
| Modal promo (botão) | Modal aberto | Entendido |
| Prompt feedback beta (aria-label) | Prompt aberto | Fechar feedback |
| Prompt feedback beta (título) | Prompt aberto | Como está sendo sua experiência? |
| Prompt feedback beta (texto) | Prompt aberto | Seu feedback é essencial para evoluirmos o app. |
| Prompt feedback beta (opções) | Prompt aberto | Muito boa / Boa / Pode melhorar / Tive dificuldades |
| Feedback beta (texto enviado ao suporte) | Ao escolher opção | [Feedback beta] Minha experiência até agora está: {label}. O que mais me ajudou foi: |

---

## 4. Plano

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| translateLevel | beginner | Iniciante |
| translateLevel | intermediate | Intermediário |
| translateLevel | advanced | Avançado |
| Fallback nome do cão | — | seu cão |
| Header (mini-label) | Sempre | Trilha de evolução personalizada |
| Header (título) | Sempre | Plano de treino |
| Header (subtítulo) | `dogGender`=female→da, senão do | Acompanhe a evolução {da/do} {dogName} passo a passo. |
| Card progresso (label) | Sempre | Progresso geral |
| Card progresso (texto) | Sempre | {completedTasks} de {tasks} etapas do plano |
| Card progresso (percentual) | Sempre | {overallProgress}% |
| Botão agenda | Sempre | Ver agenda completa |
| Estado plano concluído (título) | `!currentTask` | Plano concluído |
| Estado plano concluído (texto) | `!currentTask` | Todas as etapas atuais foram concluídas. Continue registrando a rotina para acompanhar a evolução. |
| Próximo treino (mini-label) | Há `currentTask` | Seu próximo treino |
| Próximo treino (módulo) | Há `currentTask` | [BACKEND] {currentTask.moduleName} |
| Próximo treino (badge) | Há `currentTask` | Treino atual |
| Card treino atual (etapa) | Há `currentModule` | Etapa {currentModuleStep} de {currentModule.tasks.length} |
| Card treino atual (etapa fallback) | Sem `currentModule` | Etapa atual |
| Card treino atual (título/descrição/duração) | Sempre | [BACKEND] {currentTask.title} / {objective} / {duration} |
| Card treino atual (botão) | Sempre | Começar treino |
| Próximos passos (título) | `upcomingTasks.length > 0` | Próximos passos |
| Próximos passos (texto) | Mesma condição | A sequência prevista para continuar a evolução. |
| Próximo passo (badge) | `index === 0` | Próximo passo |
| Próximo passo (badge) | Demais | Em breve |
| Próximo passo (texto) | `index === 0` | Libera ao concluir o treino atual. |
| Próximo passo (texto) | Demais | Libera após concluir a próxima etapa. |
| Toggle sequência | `upcomingTasks.length > 2` expandido | Ocultar sequência completa |
| Toggle sequência | recolhido | Ver sequência completa |
| Concluídos (título) | `completedTasks.length > 0` | Concluídos recentemente |
| Concluídos (texto) | Mesma condição | Refaça um exercício sem alterar sua trilha. |
| Concluídos (botão) | `isPremium` | Histórico |
| Concluído item (badge) | `isPremium` | Revisão disponível |
| Concluído item (badge) | Não Premium | Revisão Premium |
| Módulos (título) | `modules.length > 0` | Módulos do plano |
| Módulos (texto) | Mesma condição | Progresso por área de desenvolvimento. |
| Módulo item (nome) | Cada módulo | [BACKEND] {module.name} (ver Biblioteca de treinos) |
| Módulo item (texto) | Cada módulo | {module.completed} de {module.tasks.length} concluídos |
| Módulo item (badge) | Concluído | Concluído |
| Módulo item (badge) | `isCurrent` | Em andamento |
| Módulo item (badge) | Caso contrário | Futuro |
| Rodapé nível | `knownCommands.length > 0` | Nível {translateLevel} · {n} comandos consolidados |

---

## 5. Treino

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Passos fallback (1) | Sem steps na task/template | Fique em um ambiente silencioso, sem distrações, segurando alguns petiscos. |
| Passos fallback (2) | Mesma condição | Aguarde o seu cão olhar. |
| Passos fallback (3) | Mesma condição | No exato momento em que ele olhar, diga "Muito bem!" (ou clique) e dê o petisco. |
| Passos fallback (4) | Mesma condição | Repita o processo por 5 minutos, faça uma pausa, e repita novamente. |
| Tela feedback (título) | `showFeedback` | Como foi o treino? |
| Tela feedback (texto) | `showFeedback` | Seu feedback ajuda a adaptar os próximos treinos para o seu cão. |
| Feedback opção (label) | — | Fácil |
| Feedback opção (desc) | Cão fêmea | Ela tirou de letra |
| Feedback opção (desc) | Cão macho | Ele tirou de letra |
| Feedback opção | — | Médio / Exigiu um pouco de foco |
| Feedback opção | — | Difícil / Precisamos praticar mais |
| Feedback opção | — | Não concluí / Paramos no meio |
| Tela conclusão (mini-label) | `isFailed` | Tentativa Registrada |
| Tela conclusão (mini-label) | Não falhou | Sessão Finalizada |
| Tela conclusão (título) | `isFailed` | Tudo bem pausar |
| Tela conclusão (título) | Não falhou | Treino concluído |
| Tela conclusão (texto) | `isFailed`; `art`=da/do | Respeitar o limite {art} {dogName} também é cuidado. Vocês podem retomar quando estiverem prontos. |
| Tela conclusão (texto) | `isHard`; `art`=da/do | Nem todo dia precisa ser perfeito. Respeitar o ritmo {art} {dogName} também faz parte da evolução. |
| Tela conclusão (texto) | Sucesso normal | Excelente trabalho. A consistência de hoje se transforma nos resultados de amanhã. |
| Tela conclusão (oferta check-in) | `shouldOfferCheckin` | Registre o check-in de hoje para deixar os relatórios e as próximas recomendações mais precisos. |
| Tela conclusão (botão) | `shouldOfferCheckin` | Fazer check-in de hoje |
| Tela conclusão (botão) | Sem oferta | Voltar ao Início |
| Tela conclusão (botão secundário) | `shouldOfferCheckin` | Agora não |
| Estado sem treino (texto) | `!activeTask` | Treino não encontrado. |
| Estado sem treino (botão) | `!activeTask` | Voltar |
| Estado plano concluído (título) | Índice além do fim | Plano concluído! 🎉 |
| Estado plano concluído (texto) | Mesma condição | Vocês terminaram todos os treinos deste plano. Aguarde a geração do próximo ou acompanhe a evolução. |
| Estado plano concluído (botão) | Mesma condição | Ver evolução |
| Estado etapa futura (título) | `isFutureTraining` | Esta etapa ainda não foi liberada. |
| Estado etapa futura (texto) | `isFutureTraining` | Conclua o treino atual para avançar pela trilha na ordem recomendada. |
| Estado etapa futura (botão) | `isFutureTraining` | Voltar ao plano |
| PremiumGate (featureName) | `isReview && !isPremium` | Revisão de Treinos |
| PremiumGate (featureName) | `isPremiumTrainingLocked` | Treinamento Completo |
| Header (badge) | `isReview` | Modo revisão |
| Header (badge) | Não revisão | Módulo {activeTask.module} |
| Avatar do cão (alt) | Com foto | Dog |
| Avatar do cão (fallback) | Sem foto; inicial fallback "F" | {inicial} / F |
| Nome do cão (mini-label) | Fallback "Seu cão" | [BACKEND] {dogProfile.name} / Seu cão |
| Banner treino priorizado | Prioridade alta + override manual | Treino priorizado para a fase atual do seu cão. |
| Título / descrição do treino | Sempre | [BACKEND] {activeTask.title} / {objective} |
| Card motivo (título/texto) | `trainingReason` presente | [BACKEND] {reasonTitle} / {reasonText} (ver TrainingReasonMotor) |
| Card motivo (label/valor) | `trainingReason` presente | Fase / [BACKEND] {phase} |
| Card motivo (label/valor) | `trainingReason` presente | Foco Atual / [BACKEND] {focus} |
| Card "antes de começar" (label) | Sempre | Antes de começar |
| Card "antes de começar" (texto) | Fallback sem `beforeStart` | Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável. |
| Card "antes de começar" (texto) | Template com `beforeStart` | [BACKEND] {beforeStart} |
| Passo a passo (título) | Sempre | Passo a passo |
| Passo a passo (duração) | Sempre | [BACKEND] {activeTask.duration} |
| Passo (texto) | Cada passo | [BACKEND] {step} (ver Biblioteca de treinos) |
| Botão inferior | `!isSaving` | Marcar como Concluído |

---

## 6. Check-in

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Fallback nome do cão | — | seu cão |
| Erro (throw) | Usuário não autenticado | Usuário não autenticado |
| Tela conclusão (título) | `isCompleted` | Diário Atualizado |
| Tela conclusão (texto) | `isCompleted` | Check-in de hoje registrado. Cuidar também é observar. Hoje vocês deram mais um passo na jornada. |
| Tela conclusão (botão) | `isCompleted` | Voltar ao Início |
| Passo 1 (título) | `step === 1` | Energia |
| Passo 1 (subtítulo) | `step === 1` | Como foi o ritmo do seu cão hoje? |
| Passo 1 (opções) | `step === 1` | Calmo e relaxado / Equilibrado / Agitado e sem foco |
| Passo 2 (título) | `step === 2` | Alimentação |
| Passo 2 (subtítulo) | `step === 2` | O apetite dele estava normal? |
| Passo 2 (opções) | `step === 2` | Comeu tudo com gosto / Deixou um pouco / Sem apetite |
| Passo 3 (título) | `step === 3` | Comportamento |
| Passo 3 (subtítulo) | `step === 3` | Houve algum desvio na rotina ou reatividade? |
| Passo 3 (opções) | `step === 3` | Passeio tranquilo / Reagiu a outros cães / Ansiedade ao ficar só / Dia excelente, sem problemas |
| Passo 4 (título) | `step === 4` | Contexto do dia |
| Passo 4 (subtítulo) | `step === 4` | Opcional. Esses detalhes tornam as recomendações mais precisas. |
| Passo 4 (label passeio) | `step === 4` | Teve passeio hoje? |
| Passo 4 (opções passeio) | `step === 4` | Sim / Não / Não informar |
| Passo 4 (label duração) | `walked === true` | Duração aproximada |
| Passo 4 (opções duração) | `walked === true` | 10 min / 20 min / 30 min / 45 min |
| Passo 4 (label local) | `walked === true` | Onde aconteceu? |
| Passo 4 (opções local) | `walked === true` | Rua tranquila / Rua movimentada / Perto de cães / Lugar novo |
| Passo 4 (label incidentes) | `step === 4` | Aconteceu algo relevante? |
| Passo 4 (opções incidentes) | `step === 4` | Puxou a guia / Latiu em excesso / Reagiu a estímulos / Destruiu objetos / Agitação na saída / Xixi fora do lugar / Mordeu durante brincadeira |
| Passo 4 (label gatilhos) | `incidents.length > 0` | O que pode ter provocado? |
| Passo 4 (opções gatilhos) | `incidents.length > 0` | Campainha / Visitas / Outros cães / Barulho da rua / Ficou sozinho / Hora de sair / Mudança na rotina / Não identifiquei |
| Passo 4 (label intensidade) | `incidents.length > 0` | Intensidade percebida |
| Passo 4 (opções intensidade) | `incidents.length > 0` | Leve / Moderada / Alta |
| Passo 4 (label observação) | `step === 4` | Observação rápida |
| Passo 4 (placeholder textarea) | `step === 4` | Ex.: ficou mais calmo depois do passeio. |
| Header (mini-label) | Sempre | Check-in de hoje |
| Header (título) | `dogGender`=female→da, senão do | Como foi o dia {da/do} {dogName}? |
| Barra progresso (label) | Sempre | Passo {step} de 4 |
| Rodapé (erro) | `saveError` | Não foi possível salvar seu check-in. Verifique a conexão e tente de novo. |
| Rodapé (botão) | `step === 4` | Finalizar Check-in |
| Rodapé (botão) | `step !== 4` | Continuar |

---

## 7. Evolução

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Header (mini-label) | Sempre | Seu progresso |
| Header (título) | Sempre | Evolução |
| Card retomar (mini-label) | `!isEmpty` e `daysSinceLastActivity >= 7` | Sentimos sua falta |
| Card retomar (texto) | Mesma cond. e `>= 900` | Que tal começar a acompanhar a evolução? |
| Card retomar (texto) | Mesma cond., `< 900` | Faz {insights.daysSinceLastActivity} dias sem um registro |
| Card retomar (subtexto) | `>= 7` | Um check-in rápido já atualiza a leitura da evolução do seu cão. |
| Card retomar (botão) | `>= 7` | Fazer check-in |
| Card score (mini-label) | `!isEmpty` e `hasEnoughData` | Evolução geral |
| Card score (valor) | Mesma condição | {insights.evolutionScore} |
| Card score (denominador) | Mesma condição | /100 |
| Card score (delta) | `scoreDelta !== 0` | {+/-}{scoreDelta} esta semana |
| Card score (label) | Mesma condição | [BACKEND] {insights.scoreLabel} |
| Status row (item) | `!isEmpty`; cada item | [BACKEND] {item.label} |
| Stats cards (label) | Sempre | Sessões |
| Stats cards (label) | Sempre | Check-ins |
| Stats cards (label) | `streak === 1` | Dia seguido |
| Stats cards (label) | `streak !== 1` | Dias seguidos |
| Narrativa (mini-label) | `smartReading` presente | Análise da semana |
| Narrativa (headline/recomendação) | Mesma condição | [BACKEND] {smartReading.headline} / {recommendation} |
| Narrativa (botão) | Mesma condição | Ver relatório completo |
| Skill progress (título) | `skillProgress.length > 0` | Evolução por habilidade |
| Skill item (label/percentual) | Cada skill | [BACKEND] {skill.label} / {skill.pct}% |
| Skill item (texto) | `completions === 1` | {skill.completions} sessão concluída |
| Skill item (texto) | `completions !== 1` | {skill.completions} sessões concluídas |
| Emocional (título) | `emotionalTrends.length > 0` | Evolução emocional |
| Emocional item (label) | Cada trend | [BACKEND] {trend.label} |
| Emocional item (valor) | direction down→↓, senão ↑ | {↓/↑} {trend.change}% |
| Gráfico semanal (título) | Sempre; fallback | [BACKEND] {insights.chartTitle} / Atividade Semanal |
| Gráfico semanal (subtítulo) | Sempre | [BACKEND] {insights.chartSubtitle} |
| Gráfico (dica) | Sempre | Toque em um dia para ver detalhes |
| Linha do tempo (título) | `timeline.length > 0` | Linha do tempo |
| Timeline item (dia/label) | Cada evento | [BACKEND] {event.dayLabel} / {event.label} |
| Conquistas (título) | `achievements.length > 0` | Conquistas |
| Conquistas (botão) | Mesma condição | Ver relatório |
| Conquista item (contexto/título/descrição) | Cada conquista | [BACKEND] {context} / {title} / {description} |
| Empty state (título) | `insights.isEmpty` | Comece hoje |
| Empty state (texto) | `insights.isEmpty` | Complete um treino ou check-in para ver sua evolução aqui. |
| Bottom sheet (dia) | `selectedDay` presente | [BACKEND] {selectedDay.dayLabel} |
| Bottom sheet (check-in) | `selectedDay.hasCheckin` | Check-in registrado |
| Bottom sheet (treino título) | Cada treino do dia | [BACKEND] {t.title} |
| Bottom sheet (treino duração) | `durationMinutes` presente | {t.durationMinutes} min |
| Bottom sheet (vazio) | Sem check-in e sem treinos | Nenhuma atividade registrada neste dia. |

---

## 8. Perfil / Editar Perfil

### Perfil

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| valueOrFallback | Valor vazio/nulo | Não informado |
| yesNo | Verdadeiro / Falso / Vazio | Sim / Não / Não informado |
| housingLabel | apartment / house / vazio | Apartamento / Casa / Não informado |
| levelLabel | low/medium/high | Baixo / Médio / Alto |
| levelLabel | beginner/intermediate/advanced | Iniciante / Intermediário / Avançado |
| levelLabel | vazio | Não informado |
| behaviorLabel | separation_anxiety | Ansiedade de separação |
| behaviorLabel | destructive | Comportamento destrutivo |
| behaviorLabel | barking | Latidos excessivos |
| behaviorLabel | pulling | Puxa muito no passeio |
| behaviorLabel | none | Nenhum problema grave |
| behaviorIssues (map) | anxiety | Ansiedade |
| behaviorIssues (map) | barking | Latidos excessivos |
| behaviorIssues (map) | reactivity | Reatividade |
| behaviorIssues (map) | destruction | Destruição |
| behaviorIssues (map) | aggression | Agressividade |
| behaviorIssues (map) | peeWrongPlace | Xixi fora do lugar |
| behaviorIssues (map) | fear | Medo ou insegurança |
| behaviorIssues (map) | pullingLeash | Puxa a guia |
| behaviorIssues (map) | hyperactivity | Hiperatividade |
| rewardLabel | treats/toys/praise/play/food/unknown | Petiscos / Brinquedos / Elogios e carinho / Bolinha / brincadeiras / Comida em geral / Ainda não sei |
| rewardLabel | vazio | Não informado |
| Header - fallback nome usuário | Sem displayName | Tutor |
| Header - badge assinatura | status = past_due | Pagamento pendente |
| Header - badge assinatura | status = canceled | Cancelado |
| Header - badge assinatura | premium | Premium |
| Header - badge assinatura | trial ativo | Trial ({daysLeft} dias) |
| Header - badge assinatura | padrão/grátis | Plano Grátis |
| Header - nome do cão | Sem dogData | Seu cão |
| Header - subtítulo tutor | Sempre | Tutor(a): {primeiro nome} |
| Header - subtítulo tutor | userName vazio | Usuário |
| Header - avatar fallback | Sem foto e sem nome | C |
| Header - badge | Ambiente beta | Beta gratuito |
| Seção Desenvolvimento (título) | Sempre | Desenvolvimento |
| Item Treinos SOS (título/subtítulo) | Sempre | Treinos SOS / Protocolos rápidos para crise |
| Item Histórico (título/subtítulo) | Sempre | Histórico de Treinos / Sessões concluídas |
| Item Recalcular (título/subtítulo) | `canRecalcular` | Recalcular meu plano / Gerar plano personalizado inteligente |
| Seção Saúde & Rotina (título) | Sempre | Saúde & Rotina |
| Item Nutrição (título/subtítulo) | Sempre | Nutrição & Peso / Plano alimentar e pesagem |
| Item Vacinação (título/subtítulo) | Sempre | Carteira de Vacinação / Próximas doses e histórico |
| Seção Promoções (título) | Sempre | Promoções |
| Item Indique (título) | Sempre | Indique e Ganhe |
| Item Indique (badge) | validReferrals === 1 | 🥉 Embaixador |
| Item Indique (badge) | validReferrals === 2 | 🥈 Tutor Influente |
| Item Indique (badge) | validReferrals >= 3 | 🥇 Embaixador Gold |
| Item Indique (subtítulo) | Sempre | Ganhe 7 dias Premium com seus amigos |
| Seção Conta (título) | Sempre | Conta |
| Item Editar Perfil (título) | Sempre | Editar Perfil |
| Item Notificações (título) | Sempre | Notificações & Lembretes |
| Item Plano (título) | Beta / não-beta | Beta Focão / Seu plano |
| Item Plano (subtítulo) | Beta / não-beta | Feedback, bugs e sugestões / Status da assinatura e acesso |
| Item FAQ (título/subtítulo) | Sempre | Perguntas Frequentes / FAQ |
| Item Suporte (título) | Sempre | Falar com Especialistas |
| Item Suporte (badge) | `hasUnreadSupport` | Novo |
| Item Suporte (subtítulo) | Sempre | Chat de Suporte em tempo real |
| Seção Privacidade (título) | Sempre | Privacidade & LGPD |
| Item Exportar (título/subtítulo) | Sempre | Exportar Meus Dados / Baixar meus dados estruturados em JSON |
| Item Excluir (título/subtítulo) | Sempre | Excluir Minha Conta / Excluir permanentemente todos os meus dados (LGPD) |
| Logout (botão) | Sempre | Encerrar Sessão |
| Export - alert erro | Falha ao exportar | Ocorreu um erro ao exportar seus dados. Tente novamente. |
| Excluir conta - confirm 1 | Ao excluir | Tem certeza absoluta de que deseja excluir sua conta e TODOS os seus dados do Focão permanentemente? Esta ação é irreversível. |
| Excluir conta - confirm 2 | Após confirmar 1 | Para confirmar e cumprir a LGPD, o Focão irá deletar seu histórico de treinos, check-ins, vacinas, perfil do cão e cadastro. Clique em OK para confirmar a exclusão imediata. |
| Excluir conta - erro (throw) | Resposta não OK | Não foi possível concluir a exclusão. Tente novamente em alguns minutos. |
| Excluir conta - alert sucesso | Concluída | Sua conta e todos os seus dados foram excluídos com sucesso em conformidade com a LGPD. |
| Excluir conta - alert reautenticação | `requires-recent-login` | Por motivos de segurança, você precisa fazer login novamente antes de excluir sua conta. Por favor, encerre a sessão, faça login de novo e repita o processo. |
| Excluir conta - alert erro genérico | Outros erros | Ocorreu um erro ao excluir sua conta: {err.message} |

### EditarPerfil

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| ENERGY_OPTIONS | Nível energia | Baixa (Calmo) / Média (Equilibrado) / Alta (Agitado) |
| TRAINING_BASE_OPTIONS | Base treino | Nenhuma base / Comandos básicos / Intermediário |
| Badge assinatura | (mesmas variantes do Perfil) | Pagamento pendente / Cancelado / Premium / Trial ({daysLeft} dias) / Plano Grátis |
| Fallback nome tutor | Sem nome | Tutor |
| Upload foto - erro img.onerror | Falha ao carregar imagem | Falha ao processar a imagem. |
| Upload foto - erro catch | Falha no upload | Falha ao processar a foto do cão. |
| Salvar - erro sem usuário | Não autenticado | Você precisa estar conectado para salvar o perfil. |
| Salvar - erro nome tutor | Nome vazio/curto | Informe o nome do tutor. |
| Salvar - sucesso | Salvo | Alterações salvas com sucesso. |
| Salvar - erro genérico | Falha | Erro ao salvar as informações. |
| Bottom sheet foto (mini-label) | Opções de foto | Foto do cão |
| Bottom sheet foto - opções | — | Tirar foto / Escolher da galeria / Cancelar |
| Header - mini-label / título | Sempre | Configurações / Editar Perfil |
| Avatar - aria-label | Botão foto | Alterar foto do cão |
| Avatar - alt / fallback | Foto presente / sem foto e nome | Foto do cão / C |
| Nome do cão (título) | `name` vazio | Seu cão |
| Subtítulo tutor | Sempre / fallback | Tutor(a): {primeiro nome} / Tutor |
| Abas | Sempre | Básico / Rotina / Perfil / Saúde |
| Input nome tutor (label/placeholder) | Aba básico | Nome do tutor / Ex: Isabelle |
| Input nome cão (label/placeholder) | Aba básico | Nome do cão / Ex: Bento |
| Sexo (label) | Aba básico | Sexo |
| Sexo - botões | Aba básico | Macho / Fêmea |
| Raça (label) | Aba básico | Raça |
| Raça - placeholder | `breed` vazio | Selecione a raça |
| Fase da vida (label/placeholder) | Aba básico | Fase da vida / Selecione a fase |
| Idade (label/placeholder) | Aba básico | Idade aprox. / Opcional |
| Peso (label/placeholder) | Aba básico | Peso (kg) / Ex: 15.5 |
| Passeios (label/placeholder) | Aba rotina | Frequência de passeios / Ex: 2 vezes ao dia, Só finais de semana |
| Convive pessoas (label) | Aba rotina | Convive com mais pessoas? |
| Convive pessoas - botões | Aba rotina | Sim / Não |
| Convive animais (label) | Aba rotina | Convive com outros animais? |
| Convive animais - botões | Aba rotina | Sim / Não |
| Relação animais (label/placeholder) | `livesWithAnimals` | Como é a relação deles? / Ex: Brincam bastante, Não se dão bem |
| Nível energia (label/placeholder) | Aba comportamento | Nível de Energia / Selecione |
| Base treino (label/placeholder) | Aba comportamento | Base de Treino Anterior / Selecione |
| Alimentação base (label) | Aba saúde | Alimentação Base |
| Alimentação - opções | Aba saúde | Selecione / Ração Seca / Ração Úmida / Alimentação Natural / Mista |
| Marca ração (label/placeholder) | Diet seca/úmida/mista | Marca da Ração (se aplicável) / Ex: Golden, Premier, etc |
| Refeições/dia (label/placeholder) | Aba saúde | Refeições por dia / Ex: 2 vezes |
| Última vacina (label/placeholder) | Aba saúde | Última vacina ou checkup / Ex: Há 3 meses |
| Próximo checkup (label/placeholder) | Aba saúde | Próximo checkup / Ex: Janeiro de 2024 |
| Observações (label/placeholder) | Aba saúde | Observações de Saúde / Alergias, medicamentos, etc. |
| Botão salvar | isSaving true/false | Salvando... / Salvar Alterações |
| BottomSheet raça (título/placeholder) | Modal | Selecione a Raça / Buscar raça... |
| BottomSheet marca (título/placeholder) | Modal | Selecione a Marca / Buscar marca... |
| BottomSheet fase (título/placeholder) | Modal | Fase da vida / Buscar fase... |
| BottomSheet idade (título/placeholder) | Modal | Idade aproximada / Buscar idade... |
| BottomSheet energia (título/placeholder) | Modal | Nível de energia / Buscar... |
| BottomSheet base treino (título/placeholder) | Modal | Base de treino anterior / Buscar... |
| Opção marca ração extra | Lista | Outra |

---

## 9. Nutrição

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| COMMON_VERSIONS | Opções versão ração | Raças Pequenas / Raças Médias / Raças Grandes / Castrados / Grãos Mini |
| PremiumGate (featureName) | Não premium | Nutrição inteligente |
| Fallback razão nutrição | Fórmula não cadastrada | [BACKEND] Fórmula específica não cadastrada; estimativa aproximada aplicada. |
| Header (mini-label / título) | Sempre | Módulo de Saúde / Nutrição |
| Card principal (mini-label) | Sempre | Plano Diário |
| Card principal (nome cão) | Sem dogData / com | Seu cão / [BACKEND] {dogData.name} |
| Badge precisão | `fallsback` | Recomendado |
| Badge precisão | confidence high/medium/baixa | Alta Precisão / Boa Precisão / Aproximado |
| Valor diário | daily > 0 / = 0 | {foodInfo.daily}g / --g |
| Rótulo diário | Sempre | Recomendado por dia |
| Marca ração | `foodBrand` presente | [BACKEND] {dogData.foodBrand} |
| Valor por refeição | perMeal > 0 / = 0 | {foodInfo.perMeal}g / --g |
| Rótulo refeição | Sempre | Por refeição |
| Quantidade informada (label/valor) | `foodQuantity` presente | Quantidade atual (informada): / {dogData.foodQuantity}g / dia |
| Meta - peso | weightUsed > 0 / = 0 | {peso} kg / -- kg |
| Meta - atividade | Sempre | Atividade: {activityLevel} |
| Meta - refeições | Sempre | {mealsPerDay} refeições/dia |
| Info recomendação | `foodBrand` presente | Essa recomendação foi calculada com base no peso informado ({weightUsed} kg), nível de energia ({activityLevel}) e alimentação cadastrada. |
| Info recomendação | `foodBrand` ausente | Configure a alimentação atual para receber uma recomendação mais precisa. |
| Orientações (título) | Sempre | Orientações |
| Dica 1 (título/texto) | Sempre | Hidratação constante / Mantenha água fresca sempre disponível. Aumente a oferta em dias quentes ou após passeios. |
| Dica 2 (título/texto) | Sempre | Petiscos no Treino / Os petiscos de treino devem representar, no máximo, 10% do total calórico diário para evitar sobrepeso. |
| Botão cadastrar ração | Sempre | Cadastrar ração atual |
| Modal - título | Aberto | Qual ração ele come? |
| Modal - Marca (label/placeholder) | Aberto | Marca / Selecione uma marca... |
| Modal - Marca (input livre) | Marca fora da lista | Digite o nome da marca... |
| Modal - Linha (label/placeholder) | Aberto | Linha / Selecione uma linha... |
| Modal - Linha (input livre) | Linha fora da lista | Digite a linha (ex: Formula, Maxi...) |
| Modal - Fase (label) | Aberto | Fase |
| Modal - Fase (botões) | Opções | Filhote / Adulto / Sênior |
| Modal - Versão (label/placeholder) | Aberto | Versão / Selecione a versão... |
| Modal - Versão (input livre) | Versão fora da lista | Digite a versão ou sabor... |
| Modal - Quantidade (label/placeholder) | Aberto | Quantidade Diária (em gramas) / Ex: 250 |
| Modal - unidade | Sempre | g |
| Modal - botão salvar | Sempre | Salvar Informações |
| BottomSheet marca/linha/versão (título) | Modais | Selecione a Marca / Selecione a Linha / Selecione a Versão |
| BottomSheet marca/linha/versão (placeholder) | Modais | Buscar marca... / Buscar linha... / Buscar versão... |
| BottomSheet - opção extra | Listas | Outra |

---

## 10. Vacinas

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| PremiumGate (featureName) | Não premium | Controle de Vacinas |
| Fallback nome cão | Agendamento | Seu cão |
| Header (mini-label / título) | Sempre | Módulo de Saúde / Vacinas |
| Status card (título) | Próxima dose < 30 dias | Atenção às Doses |
| Status card (título) | Sem dose crítica | Proteção em dia |
| Status card (texto) | Próxima dose < 30 dias | Há vacinas que vencem este mês. |
| Status card (texto) | Sem dose crítica | Não há doses críticas pendentes. |
| Próximas doses (título) | `upcoming.length > 0` | Próximas Doses |
| Item próxima dose (nome) | Sempre | [BACKEND] {item.name} |
| Item próxima dose (badge) | Sempre | Em {monthsDiff} meses ({data}) |
| Histórico (título) | Sempre | Histórico |
| Histórico (vazio) | `history.length === 0` | Nenhum registro encontrado. |
| Histórico (nome/data) | Item | [BACKEND] {item.name} / Aplicada em {data} |
| Histórico (notas) | `item.notes` presente | [BACKEND] {item.notes} |
| Footer CTA (botão) | Sempre | Registrar nova dose |
| Form (título) | Aberto | Nova Vacina |
| Form - Nome vacina (label/placeholder) | Aberto | Nome da Vacina / Selecione a vacina |
| Form - Data aplicação (label) | Aberto | Data de Aplicação |
| Form - Próxima dose (label) | Aberto | Próxima Dose (opcional) |
| Form - Anotações (label/placeholder) | Aberto | Anotações / Lote (opcional) / Ex: Fabricante, reações... |
| Form - botão salvar | `!isSaving` | Salvar Registro |
| BottomSheet vacina (opções) | Lista | V8 (Polivalente) / V10 (Polivalente) / V11 / V12 / Antirrábica / Giárdia / Gripe Canina / Tosse dos Canis / Leishmaniose / Lyme (Borreliose) / Coronavirose / Outra |
| BottomSheet vacina (título/placeholder) | Modal | Selecione a Vacina / Buscar vacina... |

---

## 11. Agenda

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| handleDeleteEvent - confirm | Ao excluir compromisso | Excluir este compromisso? |
| Fallback nome cão | Sem nome | seu cão |
| Header (título) | Sempre | Agenda de {dogName} |
| Header (subtítulo) | Sempre | Veja os próximos passos da rotina, treinos e cuidados. |
| Personalizar agenda (título) | Sempre | Personalizar agenda |
| Personalizar agenda (texto) | Sempre | Defina os horários de lembrete para a rotina do cão. |
| Badge salvo | `agendaSaved` | Salvo |
| AgendaTimeInput (labels) | Sempre | Treino diário / Check-in da Rotina / Avisos de Vacinas / Alerta de Relatório Semanal |
| AgendaTimeInput - texto horário | Toggle ligado | Horário do lembrete: |
| Botão salvar agenda | `!isSavingAgenda` | Salvar agenda |
| Bloco Hoje (título) | Sempre | Hoje |
| Botão adicionar | Sempre | Compromisso |
| Treino do dia (mini-label) | Sempre | Treino diário |
| Treino do dia (título) | activeTask presente / ausente | [BACKEND] {activeTask.title} / Sem treino previsto |
| Treino do dia (status) | Concluído / não | Concluído / Pendente |
| Check-in (mini-label/título) | Sempre | Monitoramento / Check-in da Rotina |
| Check-in (status) | Concluído / não | Concluído / Pendente |
| Nutrição (mini-label) | Sempre | Alimentação |
| Nutrição (texto) | Sempre | [BACKEND] {agendaState.nutritionText} (ver AgendaMotor) |
| Evento customizado (mini-label) | daily/weekly/once | {time} • Diário / {time} • Semanal / {time} • Compromisso |
| Evento customizado (título) | Sempre | [BACKEND] {event.title} |
| Evento customizado - excluir (title attr) | Sempre | Excluir compromisso |
| Em seguida no plano (título) | Sempre | Em seguida no plano |
| Ver completo (botão) | Sempre | Ver completo |
| Próximos treinos - vazio | Sem `upcomingTasks` | Não há mais tarefas no bloco atual. |
| Próximos treinos - item título | Task presente | [BACKEND] {t.title} |
| Próximos treinos - item meta | Task presente | {t.duration} • Bloco {t.module} |
| Esta semana (título) | Sempre | Esta semana |
| Dia semana - label | Sempre | [BACKEND] {day.label} |
| Dia semana - treino | `hasTraining` | Treino planejado |
| Dia semana - vacina | `hasVaccine` | Dia de vacina! |
| Dia semana - relatório | `isReportDay` | Relatório Semanal |
| Dia semana - evento | Eventos do dia | {event.time} • {event.title} |
| Próximos Cuidados (título) | Sempre | Próximos Cuidados |
| Card vacina próxima (título/nome) | `upcomingVaccine` presente | Vacina próxima / [BACKEND] {upcomingVaccine.name} |
| Card trial (título/texto) | `trialEndingSoon` | Trial expirando / [BACKEND] {agendaState.todayAlert} |
| Card relatório (título) | Sempre | Relatório |
| Card relatório (texto) | reportAvailable true/false | Pronto para ver / Domingo |
| Card saúde em dia (título/texto) | Sem `upcomingVaccine` | Saúde em dia / Nenhuma vacina |
| Modal adicionar (título) | Aberto | Adicionar compromisso |
| Modal - Nome (label/placeholder) | Aberto | Nome do compromisso / Ex: Passeio no parque, Escovar dentes |
| Modal - Horário (label) | Aberto | Horário |
| Modal - Categoria (label) | Aberto | Categoria |
| Modal - Categoria (opções) | walk/feed/grooming/vet/meds/other | Passeio / Ração / Banho/Escova / Vet / Remédio / Outro |
| Modal - Repetição (label) | Aberto | Repetição |
| Modal - Repetição (opções) | daily/weekly/once | Diário / Semanal / Uma vez |
| Modal - Dias da semana (label) | frequency = weekly | Dias da semana |
| Modal - Dias da semana (chars) | frequency = weekly | D, S, T, Q, Q, S, S |
| Modal - Data (label) | frequency = once | Data do compromisso |
| Modal - botões | Sempre / `!isCreatingEvent` | Cancelar / Adicionar |

## 12. Histórico de Treinos

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| PremiumGate (featureName) | Não premium | Histórico Completo |
| formatDate - fallback | Data nula | Data desconhecida |
| Header (mini-label / título) | Sempre | Módulo de Foco / Histórico |
| Empty state (título/texto) | `logs.length === 0` | Sem histórico / Vocês ainda não concluíram nenhum treino. Que tal começar hoje? |
| Empty state (botão) | `logs.length === 0` | Ir para o Plano |
| Stats (mini-label) | Logs presentes | Métricas de Foco |
| Stats (labels) | Logs presentes | Sessões Concluídas / Tempo de Treino |
| Stats - valor tempo | Logs presentes | {total}m |
| Log (título/duração) | Sempre | [BACKEND] {log.title} / {durationMinutes} min |
| Log (data/hora) | Sempre | {formatDate} • {formatTime} |

## 12b. Treinos SOS

Protocolos de crise. Cada protocolo tem título, gatilho (trigger), duração, "primeiro movimento" (firstMove) e 3 passos.

| Protocolo | Campo | Texto atual |
|---|---|---|
| Destruição | trigger / duração / firstMove | roendo, rasgando ou pegando objetos / 5 min / Troque o objeto sem bronca. |
| Destruição | passos | Retire o objeto com calma e ofereça um mordedor ou brinquedo recheável. / Reduza o espaço por alguns minutos para baixar a agitação. / Depois faça 3 minutos de farejo com petiscos no chão. |
| Latidos | trigger / duração / firstMove | campainha, janela, barulho ou visita / 4 min / Afaste do gatilho. |
| Latidos | passos | Bloqueie a visão ou leve o cão para outro cômodo. / Peça uma ação fácil, como olhar para você ou sentar. / Recompense qualquer pausa curta de silêncio. |
| Agitação | trigger / duração / firstMove | andando sem parar, ofegante ou sem relaxar / 6 min / Diminua os estímulos. |
| Agitação | passos | Reduza luz, barulho, visitas e acesso à janela. / Ofereça lamber ou farejar por poucos minutos. / Fique presente sem falar demais até ele baixar a intensidade. |
| Mordidas | trigger / duração / firstMove | brincadeira passando do ponto / 3 min / Congele a interação. |
| Mordidas | passos | Pare o movimento por alguns segundos. / Tire mãos, roupas e pés do alcance sem empurrar. / Redirecione para um brinquedo comprido e retome só com boca suave. |
| Xixi fora | trigger / duração / firstMove | acidente recente dentro de casa / 5 min / Limpe sem chamar atenção. |
| Xixi fora | passos | Limpe o local sem bronca e sem discurso. / Leve o cão ao local correto mesmo que ele já tenha feito. / Anote horário e contexto para antecipar a próxima ida. |
| Puxando na guia | trigger / duração / firstMove | passeio acelerado ou guia esticada / 4 min / Pare antes de continuar. |
| Puxando na guia | passos | Fique parado até a guia afrouxar, sem puxar de volta. / Recompense quando o cão olhar para você ou voltar alguns passos. / Retome com poucos passos lentos e repita quando necessário. |
| Pulando nas pessoas | trigger / duração / firstMove | chegada, visita ou excesso de empolgação / 4 min / Retire atenção por alguns segundos. |
| Pulando nas pessoas | passos | Vire o corpo levemente e evite falar ou tocar enquanto houver pulos. / Recompense assim que as quatro patas voltarem ao chão. / Peça para a pessoa se aproximar novamente somente quando houver calma. |
| Medo ou insegurança | trigger / duração / firstMove | recuo, tremor, tentativa de fuga ou corpo encolhido / 5 min / Aumente a distância do gatilho. |
| Medo ou insegurança | passos | Leve o cão para um ponto em que ele consiga observar sem entrar em pânico. / Evite forçar aproximações ou prender o cão perto do que causa medo. / Ofereça petiscos no chão e encerre a interação se ele não conseguir relaxar. |

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Header - aria-label voltar | Sempre | Voltar |
| Header - badge / título | Sempre | Treinos SOS / O que está acontecendo agora? |
| Header - subtítulo | Sempre | Escolha a situação e siga só o primeiro movimento. O objetivo é baixar a intensidade, não resolver tudo de uma vez. |
| Detalhe - mini-label | Sempre | Primeiro movimento |
| Detalhe - bloco passos (label) | Sempre | Depois disso |
| Detalhe - nota rodapé | Sempre | Siga apenas estes passos agora. Quando a situação estiver mais calma, retome o plano normalmente pela Home. |
| Aviso segurança | Sempre | Se houver risco de mordida, fuga, dor, engasgo, intoxicação ou machucado, procure ajuda veterinária ou presencial imediatamente. |

---

## 13. Relatórios

### RelatorioSemanal

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| PremiumGate (featureName) | Não premium | Relatório Semanal |
| Header (mini-label / título) | Sempre | Análise Comportamental / Relatório Semanal |
| Header (botão) | Relatório desbloqueado | PDF |
| Estado de erro | `!report` | Erro ao carregar relatório. |
| Seção resumo (mini-label) | Desbloqueado | Últimos 7 dias |
| Parágrafo intro | `maturityLevel === 'empty'`, fêmea | Precisamos de mais alguns dias de atividade para montar o relatório da {dogName}. |
| Parágrafo intro | `maturityLevel === 'empty'`, macho | Precisamos de mais alguns dias de atividade para montar o relatório do {dogName}. |
| Parágrafo intro | `!== 'empty'`, fêmea | Um olhar detalhado sobre o desenvolvimento da {dogName}. |
| Parágrafo intro | `!== 'empty'`, macho | Um olhar detalhado sobre o desenvolvimento do {dogName}. |
| Card vazio (título/corpo) | `maturityLevel === 'empty'` | Relatório em construção / Seu relatório semanal ficará mais completo conforme você registra treinos e check-ins. |
| Card estatísticas (labels) | `!== 'empty'` | Treinos / Check-ins |
| Chip dias com registros | `!== 'empty'` | {report.activeDays} de 7 dias com registros |
| Chip streak | streak === 1 / > 1 | 1 dia seguido / {report.streak} dias seguidos |
| Resumo inteligente (mini-label) | `smartReading` existe | Resumo inteligente |
| Resumo inteligente (headline/corpo/evidência/recomendação) | `smartReading` existe | [BACKEND] {headline} / {body} / {item} / {recommendation} |
| Acompanhamento equipe (mini-label) | `adminReport` presente | Acompanhamento da equipe Focão |
| Acompanhamento equipe (título/resumo/recomendação) | `adminReport.*` existe | [BACKEND] {title} / {summary} / {recommendation} |
| Comparação (mini-label) | `!== 'empty'` | Comparação entre semanas |
| Comparação (headline/detalhe) | `!== 'empty'` | [BACKEND] {comparison.headline} / {comparison.detail} (ver WeeklyReportMotor) |
| Comparação (labels métricas) | `hasPreviousWeekData` | Dias ativos / Treinos / Check-ins |
| Comparação (valores) | `hasPreviousWeekData` | {current} vs. {previous} |
| Padrão recorrente (mini-label / texto) | `recurringPattern` existe | Padrão recorrente / [BACKEND] {report.recurringPattern} |
| Conquistas (título) | Há achievements | Conquistas da jornada |
| Conquista (contexto/título/descrição) | Cada achievement | [BACKEND] {context} / {title} / {description} |
| Seção (título) | `!== 'empty'` | Análise Comportamental |
| Comportamento positivo (label) | `behaviorAverage > 0` | Comportamento Positivo {report.behaviorAverage}% |
| Comportamento positivo (texto) | `predominantMood` existe | Humor predominante: {report.predominantMood}. |
| Comportamento positivo (texto) | Sem `predominantMood` | Registros variados na semana. |
| Padrões de rotina (título/texto) | `checkinInsights?.hasEnoughData` | Padrões de Rotina / [BACKEND] {checkinInsights.insightText} |
| Destaque (título/texto) | `mainImprovement` existe | Destaque da Semana / [BACKEND] {report.mainImprovement} |
| Atenção (título/texto) | `attentionPoint` existe | Atenção e Ajuste / [BACKEND] {report.attentionPoint} |
| Atenção (rótulo/texto sugestão) | `attentionPoint` e `nextWeekSuggestion` | Sugestão / [BACKEND] {report.nextWeekSuggestion} |
| Próxima semana (rótulo/texto) | `!attentionPoint` e `nextWeekSuggestion` | Próxima Semana / [BACKEND] {report.nextWeekSuggestion} |
| Consistência (título/texto) | `activeDays > 0` | Consistência / {pct}% da semana ativa |
| Fallback nome do cão | State default | Seu cão |

### RelatorioImpressao (versão para impressão/PDF)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| sessionFeedback | easy / medium / hard / outro | Fluiu bem / Em adaptação / Pede reforço / Concluído |
| foodTypeLabel | dry/wet/natural/mixed/padrão | Ração seca / Alimento úmido / Alimentação natural / Alimentação mista / Não cadastrada |
| trainingLevelLabel | beginner/intermediate/advanced/sem | Iniciante / Intermediário / Avançado / Não informado |
| goalLabel | obedience | Melhorar obediência básica |
| goalLabel | bond | Fortalecer o vínculo |
| goalLabel | behavior | Melhorar comportamento |
| goalLabel | focus | Melhorar foco e atenção |
| goalLabel | confidence | Desenvolver confiança |
| goalLabel | training | Avançar nos treinos |
| Estado vazio (texto/botão) | `!dog || !report` | Ainda não há dados suficientes para gerar o relatório. / Voltar |
| Título executivo | `hasEnoughData`, com headline | [BACKEND] {smartReading.headline} |
| Título executivo | `hasEnoughData`, sem headline (fallback) | Uma semana de evolução construída com consistência. |
| Título executivo | `!hasEnoughData` | A leitura da jornada ainda está em construção. |
| Corpo executivo | `hasEnoughData`, com body | [BACKEND] {smartReading.body} |
| Corpo executivo | `hasEnoughData`, sem body (fallback) | Os registros desta semana já permitem acompanhar a rotina e orientar os próximos exercícios com mais precisão. |
| Corpo executivo | `!hasEnoughData` | Ainda faltam registros para interpretar a evolução de {dog.name} com segurança. Com check-ins em pelo menos três dias da semana, o Focão consegue transformar a rotina em recomendações mais precisas. |
| Objetivo 1 | `totalCheckins < 3` | Registrar check-ins em pelo menos três dias da semana. |
| Objetivo 1 | `totalCheckins >= 3` | Manter a frequência de check-ins para preservar a qualidade da leitura. |
| Objetivo 2 | `totalTrainings === 0` | Concluir ao menos um treino guiado durante a semana. |
| Objetivo 2 | `totalTrainings > 0` | Repetir os exercícios atuais em sessões curtas e consistentes. |
| Objetivo 3 | recommendation existe | [BACKEND] {recommendation} |
| Objetivo 3 | sem recommendation (fallback) | Observar pequenas mudanças na rotina e registrar o que funcionou melhor. |
| Personalidade / Objetivos (fallback) | Array vazio | Não informado / Acompanhar a evolução da rotina |
| Rotina - passeios / duração | Valores numéricos | {dog.walkFrequency} passeio(s) por dia / {dog.walkDurationMinutes} min por passeio |
| Rotina - moradia | apartment / house | Apartamento / Casa |
| trackingStatus | `!hasEnoughData` / >=75 / <75 | Base em construção / Boa consistência / Evolução parcial |
| Barra topo (botões) | Sempre | Voltar / Imprimir / Salvar PDF |
| Header (mini-label) | Sempre | Focão · acompanhamento contínuo |
| Header (título) | Sempre | Relatório semanal de {dog.name} |
| Header (logo / sublinha) | Sempre | FOCÃO / Evolução acompanhada |
| Header (período / emissão) | Sempre | Período analisado: {formatPeriod()} / Emitido em {data atual} |
| Header (raça/idade/peso) | Sempre | {dog.breed / 'SRD'} · {dog.age / 'idade não informada'}{ · {dog.weight} kg} |
| Resumo (mini-label / badge) | Sempre | Resumo da semana / {trackingStatus} |
| Resumo (índice) | Sempre | Índice de acompanhamento / {trackingScore}/100 |
| Métricas (labels) | Sempre | Consistência semanal / Dias ativos / Treinos concluídos / Check-ins comportamentais |
| Métricas (sublinhas) | Sempre | Sequência acompanhada / Rotina da semana / Repetição registrada (>0) / Acompanhamento não iniciado (=0) / Base útil para análise (`hasEnoughData`) / Base ainda insuficiente |
| Comparação (título/headline/detalhe) | Sempre | Comparação entre semanas / [BACKEND] {headline} / {detail} |
| Comparação (padrão) | `recurringPattern` existe | Padrão recorrente / [BACKEND] {recurringPattern} |
| Contexto (título/labels) | Sempre | Contexto de {dog.name} / Perfil comportamental / Nível de treino / Objetivo atual |
| Nutrição (título/labels) | Sempre | Nutrição e rotina / Alimentação / Marca / linha / Rotina cadastrada |
| Nutrição (rotina fallback) | `routineParts` vazio | Ainda não informada |
| Orientação equipe (mini-label / título / resumo) | `hasEditorialNote` | Orientação da equipe Focão / [BACKEND] {adminReport.title} / {adminReport.summary} |
| O que evoluiu (título) | `hasEnoughData` | O que evoluiu |
| O que evoluiu (texto) | com checkinInsights / mainImprovement | [BACKEND] {insightText} / {mainImprovement} |
| O que evoluiu (texto fallback) | Sem dados | A frequência de registros já permite acompanhar a evolução com mais clareza. |
| O que evoluiu (evidência) | smartReading.evidence | [BACKEND] {evidence} |
| Ponto de atenção (título) | `hasEnoughData` | Ponto de atenção |
| Ponto de atenção (texto) | com smartReading.attention/attentionPoint | [BACKEND] {smartReading.attention / report.attentionPoint} |
| Ponto de atenção (texto fallback) | Sem dados | Nenhum ponto crítico foi identificado nos registros desta semana. |
| Construir leitura (título) | `!hasEnoughData` | Como construir uma leitura mais precisa |
| Construir leitura (texto) | `!hasEnoughData` | O relatório amadurece junto com o histórico. Pequenos registros ao longo da semana já são suficientes para revelar padrões úteis. |
| Construir leitura (itens) | `!hasEnoughData` | 3 check-ins comportamentais / Registros em pelo menos 3 dias / 1 treino guiado concluído / Observações sobre a rotina |
| Próxima semana (mini-label / título) | Sempre | Próxima semana / Foco recomendado para {dog.name} |
| Treinos recentes (título) | `recentSessions.length > 0` | Treinos recentes |
| Treinos recentes (módulo/data/badge) | Cada sessão | [BACKEND] {session.moduleTitle} / {sessionDate} · {min} min / {sessionFeedback} |
| Lembretes saúde (título) | Vacinas cadastradas | Lembretes de saúde cadastrados |
| Lembretes saúde (item) | Cada vacina | [BACKEND] {vaccine.name}{ · próxima dose: {nextDose}} |
| Rodapé | Sempre | © {ano} Focão · acompanhamento contínuo da evolução do seu cão. |
| Rodapé | Sempre | Este resumo reflete os registros informados pelo tutor e não substitui avaliação veterinária ou comportamental presencial. |

### LockedReportState (relatório bloqueado)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| CTA (label) | `trainingsMet === true` | Registrar check-in de hoje |
| CTA (label) | `trainingsMet === false` | Fazer treino de hoje |
| Título | `dogName` termina em 'a' | Construindo a semana da {dogName} |
| Título | `dogName` não termina em 'a' | Construindo a semana de {dogName} |
| Título | Sem `dogName` | Construindo a semana |
| Subtítulo | Sempre | Faltam alguns registros pra liberar seu relatório. Continue acompanhando o dia a dia! |
| Donut (percentual/label) | Sempre | {clampedPct}% / concluído |
| Checklist (item label / contador) | Cada requisito | [BACKEND] {r.label} / {current}/{target} |

---

## 14. Notificações (tela) / Assinatura

### Notificacoes

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Notificação nativa (título/corpo) | Permissão concedida | Notificações ativadas / Você receberá os lembretes do Focão. |
| Header (título) | Sempre | Notificações |
| Toast salvo | `saved` | Alterações salvas com sucesso. |
| Seção (título) | Sempre | Lembretes no App |
| Toggle push (título/descrição) | Sempre | Ativar notificações push / Receba avisos conforme a agenda do seu cão. |
| Aviso bloqueio | `permissionStatus === 'denied'` | As notificações do sistema estão bloqueadas no navegador. Os lembretes dentro do app continuam disponíveis. |
| TimeRow (labels) | `enabled` | Horário do treino / Horário do check-in / Horário de vacinas |
| Subtítulo tipos | `enabled` | Tipos de lembretes |
| ReminderToggle (labels) | `enabled` | Treino diário / Check-in de rotina / Vacinas e saúde / Relatório semanal |
| Botão salvar | `!saving` | Salvar preferências |

### Assinatura

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| formatDate | Sem timestamp | --/--/---- |
| Erro portal (throw) | Resposta não-ok | Falha ao abrir portal de gerenciamento. |
| Erro portal (throw) | Sem URL retornada | Nenhum link retornado do portal. |
| Erro portal (fallback) | Catch sem mensagem | Erro ao carregar o portal. Tente novamente. |
| Benefício (lista) | Sempre | Plano de treino completo e personalizado |
| Benefício (lista) | Sempre | Relatório semanal de evolução |
| Benefício (lista) | Sempre | Insights com base nos check-ins |
| Benefício (lista) | Sempre | Nutrição, vacinas e rotina em um só lugar |
| Benefício (lista) | Sempre | Acompanhamento contínuo da jornada do cão |
| Título página | Sempre | Seu plano |
| Badge status | `isPremium` / `!isPremium` | Premium ativo / Premium não ativo |
| Nome plano | `isPremium` / `!isPremium` | Focão Premium / Acesso gratuito |
| Descrição plano | `isPremium` | Ativo desde: {formatDate(activeSince)} |
| Descrição plano | `!isPremium` | Quando seu Premium for liberado, os benefícios aparecem automaticamente nesta conta. |
| Botão gerenciar | `stripeCustomerId` e `isPremium` | Gerenciar assinatura |
| Botão gerenciar | `stripeCustomerId` e `!isPremium` | Atualizar pagamento |
| Erro portal (exibido) | `portalError` existe | {portalError} |
| Aviso cancelamento | `cancelAtPeriodEnd` | Sua assinatura Premium está programada para ser cancelada. Você manterá o acesso Premium até {formatDate(currentPeriodEnd)}. Nenhuma nova cobrança será realizada. |
| Alert pagamento | `!isPremium`, sem link configurado | Link de pagamento não configurado no painel administrativo. |
| Botão premium (CTA) | `!isPremium` | Seja Premium por R$ 47,00/mês |
| Benefícios (mini-label) | Sempre | Benefícios Premium |
| Rodapé | Sempre | O acesso Premium é vinculado ao email usado na compra e nesta conta. |

---

## 15. Indique e Ganhe

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| statusMessage | `isLimitReached` | Limite de indicações atingido! |
| statusMessage | `remainingReferrals === 1` | Ainda falta {remainingReferrals} indicação para atingir o limite. |
| statusMessage | `remainingReferrals !== 1` | Ainda faltam {remainingReferrals} indicações para atingir o limite. |
| getStatusLabel | pending | Pendente |
| getStatusLabel | activated | Ativado (Onboarding) |
| getStatusLabel | converted | Assinante (Aguardando check-ins) |
| getStatusLabel | rewarded | Recompensado |
| getStatusLabel | invalid | Inválido / Duplicado |
| Header (título) | Sempre | Indique e Ganhe |
| Banner (badge) | `isLimitReached` | Limite Atingido |
| Banner (título) | Sempre | Ganhe até 21 dias Premium |
| Banner (texto) | Sempre | Convide outros tutores e ganhe até 21 dias Premium. Cada tutor que concluir a jornada e se tornar Premium libera +7 dias para você. |
| Stat card (labels/valores) | Sempre | Indicações Válidas ({validReferrals}/3) / Dias Ganhos ({referralRewardsDays} dias) |
| Badges (título) | Sempre | Badges de Reconhecimento |
| Badge 1 (nome/descrição) | Sempre | Embaixador Focão / 1 indicação válida concluída |
| Badge 2 (nome/descrição) | Sempre | Tutor Influente / 2 indicações válidas concluídas |
| Badge 3 (nome/descrição) | Sempre | Embaixador Gold / 3 indicações válidas concluídas |
| Badge (conquistado) | `validReferrals >= n` | Conquistado |
| Código (label) | Sempre | Seu código de indicação |
| Código (valor) | Sempre | [BACKEND] {referralCode} (fallback: FOC-XXXXXX) |
| Botão compartilhar | `copiedLink === true` | Mensagem de convite copiada! |
| Botão compartilhar | `copiedLink === false` | Compartilhar convite |
| Mensagem de convite (clipboard) | Ao copiar link | Estou usando o Focão para acompanhar a evolução do meu cão 🐶\n\nUse meu link para conhecer:\n{referralLink} |
| Histórico (título) | Sempre | Status das Indicações |
| Histórico (vazio) | `referrals.length === 0` | Nenhuma indicação iniciada ainda. |
| Histórico (item nome) | Cada referral | Tutor Indicado |
| Histórico (item detalhe) | Onboarding concluído / pendente | Check-ins: {n} \| Onboarding: OK / Check-ins: {n} \| Onboarding: Pendente |
| Regras (título) | Sempre | Regras do Programa |
| Regras (parágrafo) | Sempre | Todos os usuários do Focão podem fazer indicações, sejam usuários Free, Trial ou Premium. |
| Regras (parágrafo) | Sempre | A indicação é considerada válida somente após o indicado: |
| Regras (itens) | Sempre | criar a conta; / concluir o onboarding; / fazer pelo menos 2 check-ins; / ativar uma assinatura Premium. |
| Regras (parágrafo) | Sempre | Cada indicação válida libera +7 dias Premium para quem indicou. |
| Regras (parágrafo) | Sempre | A recompensa é acumulativa, com limite vitalício de no máximo 3 indicações válidas por usuário, totalizando até 21 dias Premium. |
| Regras (parágrafo) | Sempre | Tentativas de autoindicação ou duplicação de dados, como e-mail ou WhatsApp, invalidarão a indicação de forma permanente. |
| Regras (parágrafo) | Sempre | A recompensa só será liberada após a confirmação do pagamento da assinatura Premium. |

---

## 16. Suporte / Ajuda

### Suporte (chat)

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Fallback nome do cão | Sem perfil | Cãozinho |
| Fallback nome do usuário | Sem displayName/email | Tutor |
| Alert tamanho imagem | Imagem > 5MB | A imagem deve ter no máximo 5MB |
| Texto mensagem (fallback) | Envio só com imagem | Enviou uma imagem |
| Header (título/subtítulo) | Sempre | Equipe Focão / Suporte |
| Aviso resposta | Sempre | Resposta em até 48h úteis |
| Estado vazio (título/texto) | `messages.length === 0` | Como podemos ajudar? / Envie suas dúvidas sobre treinamento, comportamento ou nutrição. Nossos especialistas responderão em breve. |
| Separador data | hoje / ontem / outras | Hoje / Ontem / {data formatada pt-BR} |
| Anexo imagem (alt) | Mensagem com imagem | Anexo |
| Balão mensagem (texto) | Cada mensagem | [BACKEND] {msg.text} |
| Preview imagem (alt) | Imagem selecionada | Preview |
| Input (placeholder) | Sempre | Digite sua mensagem... |

### Ajuda (FAQ)

**Categoria: Onboarding e plano inicial**

| Pergunta | Resposta |
|---|---|
| Por que o app faz tantas perguntas no início? | As respostas ajudam o Focão a entender o perfil do seu cão e montar um plano mais coerente com a rotina, o comportamento e os objetivos da casa. |
| O plano inicial é igual para todos os cães? | Não. O plano é organizado com base nas informações preenchidas no onboarding, como energia, comportamento, rotina, nível de treino e objetivos do tutor. |
| Posso alterar informações do meu cão depois? | Sim. Os dados principais podem ser ajustados no perfil e nas seções de saúde, alimentação e rotina. |

**Categoria: Treinos e rotina**

| Pergunta | Resposta |
|---|---|
| Como funciona o treino do dia? | O treino do dia é a atividade principal sugerida pelo plano atual. Ele aparece na Home e reflete o momento da jornada do seu cão. |
| Preciso fazer treinos longos? | Não. O Focão prioriza sessões curtas, consistentes e possíveis de manter na rotina. |
| O que acontece quando eu concluo um treino? | O app registra a sessão, coleta seu feedback e atualiza o progresso do plano e da evolução do cão. |
| E se eu marcar "Não concluí"? | O app entende que houve tentativa real, mas não conta como treino concluído. Isso evita avançar o plano cedo demais e respeita o tempo do cão. |
| Posso repetir um treino? | Sim. Repetir faz parte do processo, especialmente quando o cão ainda está consolidando a habilidade. |

**Categoria: Check-in e evolução**

| Pergunta | Resposta |
|---|---|
| Para que serve o check-in diário? | O check-in ajuda o app a entender como foi o dia do cão, incluindo treino, humor, comportamento, passeio e observações importantes. |
| Preciso fazer check-in todo dia? | Não é obrigatório, mas quanto mais consistente for o registro, mais útil fica a leitura da evolução e dos relatórios. |
| O que muda quando eu salvo um check-in? | O app atualiza o histórico do dia, recalcula a evolução e usa essas informações para gerar leituras mais inteligentes ao longo do tempo. |
| Por que minha evolução está zerada? | Se você começou agora ou ainda não registrou treinos e check-ins suficientes, a evolução aparece vazia de forma intencional. Ela passa a refletir o uso real do app. |
| O que é a sequência (streak)? | É o número de dias em que houve uso real do app, como treino, tentativa de treino ou check-in. |

**Categoria: Nutrição e alimentação**

| Pergunta | Resposta |
|---|---|
| Como funciona a recomendação alimentar do Focão? | O app identifica a ração atual do seu cão, cruza isso com o peso, a idade, a atividade e outras informações relevantes, e estima uma recomendação diária. |
| O cálculo usa a embalagem da ração? | Sempre que possível, sim. A proposta do Focão é usar a referência nutricional da fórmula selecionada como base para a estimativa. |
| E se eu não encontrar a ração do meu cão? | Nesse caso, o app pode usar uma estimativa simplificada ou permitir preenchimento complementar, dependendo da etapa da implementação. |
| A recomendação substitui orientação veterinária? | Não. A estimativa do app é uma referência inicial para organização da rotina e não substitui avaliação profissional individualizada. |

**Categoria: Saúde e vacinas**

| Pergunta | Resposta |
|---|---|
| Posso registrar vacinas no app? | Sim. O módulo de vacinas permite acompanhar histórico, próximas doses e lembretes. |
| O app avisa sobre vacinas próximas? | Sim, quando os lembretes estiverem ativos, o app pode avisar com antecedência sobre vacinas futuras. |
| Posso atualizar peso e informações de saúde? | Sim. O perfil de saúde do cão pode ser ajustado ao longo do tempo para manter o acompanhamento mais fiel à realidade. |

**Categoria: Assinatura e planos**

| Pergunta | Resposta |
|---|---|
| O Focão tem período de teste? | Sim. Novos usuários podem começar com um período de teste, quando essa regra estiver ativa no app. |
| Qual a diferença entre free, trial e premium? | (itens) Free: acesso básico / Trial: acesso temporário a recursos premium / Premium: acesso completo aos recursos avançados |
| Quais recursos podem ser premium? | Dependendo da configuração do produto, itens como relatórios mais completos, insights avançados e módulos enriquecidos podem ficar disponíveis apenas em trial ou premium. |
| Posso cancelar depois? | A lógica de cancelamento depende da plataforma de pagamento integrada ao app, mas a intenção é manter esse processo simples e transparente. |

**Categoria: Suporte e uso do app**

| Pergunta | Resposta |
|---|---|
| O app está funcionando, mas um botão não responde. O que faço? | Feche e abra o app novamente. Se o problema continuar, registre o comportamento para revisão técnica. |
| Meus dados ficam salvos? | Sim, a proposta do app é trabalhar com persistência real para manter seu progresso, perfil e histórico. |
| O Focão substitui um adestrador ou veterinário? | Não. O Focão é uma ferramenta de acompanhamento e organização da rotina, pensada para apoiar o tutor com mais clareza e consistência. |

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Header (título/subtítulo) | Sempre | Como podemos ajudar? / Encontre respostas rápidas ou fale conosco. |
| Quick action (título/subtítulo) | Sempre | Falar com Suporte / Tempo de resposta: ~2h |

---

## 17. Beta / Manutenção / DevTools

### BetaFocao

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| betaPoints (lista) | Sempre | Acesso gratuito nesta fase / Versão em validação / Melhorias com base no seu feedback / Recursos oficiais na versão futura |
| Botão voltar (aria-label) | Sempre | Voltar |
| Mini-label / título | Sempre | Beta Focão / Ajude a construir o Focão |
| Parágrafo | Sempre | Você está participando da fase beta do app. Nesta etapa, seu papel é testar, explorar e nos dizer o que funciona bem e o que precisa melhorar. |
| Caixa destaque | Sempre | Este acesso faz parte da fase de testes do app. Novidades e recursos adicionais serão apresentados na versão oficial. |
| Subtítulo seção | Sempre | Como funciona o Beta |
| Parágrafo | Sempre | Durante essa fase, o acesso ao app é gratuito e temporário. Nosso objetivo é entender o que funciona melhor, o que precisa ser ajustado e quais recursos geram mais valor para você. |
| Botão "Enviar feedback" (título/subtítulo) | Sempre | Enviar feedback / Conte sua experiência |
| Prompt suporte (state) | Clicou "Enviar feedback" | [Feedback beta] O que mais gostei foi: |
| Botão "Reportar problema" (título/subtítulo) | Sempre | Reportar problema / Descreva o que aconteceu |
| Prompt suporte (state) | Clicou "Reportar problema" | [Bug beta] Encontrei o seguinte problema: |
| Botão "Sugerir função" (título/subtítulo) | Sempre | Sugerir função / Ideias para a versão oficial |
| Prompt suporte (state) | Clicou "Sugerir função" | [Sugestão beta] Minha sugestão é: |
| Botão "Avaliar experiência" (título/subtítulo) | Sempre | Avaliar experiência / Muito boa, boa ou pode melhorar |
| Prompt suporte (state) | Clicou "Avaliar experiência" | [Avaliação beta] Minha avaliação geral é: |
| Botão principal | `user` logado / `!user` | Continuar usando / Entendi, quero testar |

### Manutencao

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Título | Sempre | Estamos em manutenção |
| Parágrafo | Sempre | O Focão está passando por melhorias para oferecer uma experiência ainda mais premium para você e seu cão. |
| Chip/badge | Sempre | Voltamos em breve |

### DevTools

| Local (tela/componente) | Contexto (quando aparece) | Texto atual |
|---|---|---|
| Header (título) | Sempre | Dev Tools |
| Botão | Sempre | Acessar Central de Notificações (ADM) |
| Botão | Sempre | Gerar Dados de Teste (Últimos 5 dias) |
| Botão | Sempre | Limpar Histórico |
| Status | Gerando / sem usuário | Gerando... / Usuário não logado. |
| Status | Sucesso geração | Dados mockados gerados com sucesso! |
| Status | Erro | Erro: {err.message} |
| Status | Limpando / sucesso limpeza | Limpando... / Histórico limpo com sucesso! |

---

## 18. Ebook Landing / Presell / Política de Privacidade

### EbookLanding (componentes)

**Navbar**

| Local | Contexto | Texto atual |
|---|---|---|
| Logo (aria-label) | Topo fixo | Focão |
| CTA | Botão fixo (rola até o formulário) | Baixar e-book grátis |

**HeroSection**

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow | Selo acima do título | E-book gratuito · Focão |
| Título (h1) | Headline | Entenda o que realmente influencia o comportamento do seu cão |
| Subtítulo | Parágrafo (com ênfase) | Baixe gratuitamente o e-book *Rotina & Comportamento Canino* e descubra como rotina, previsibilidade e consistência impactam diretamente o bem-estar do seu cão. |
| Bullet 1 | Lista de benefícios | Entenda por que certos comportamentos se repetem |
| Bullet 2 | Lista de benefícios | Descubra como a rotina reduz ansiedade |
| Bullet 3 | Lista de benefícios | Aprenda a observar padrões antes de corrigir |
| CTA | Botão principal | Quero baixar o e-book grátis |
| Nota do CTA | Abaixo do botão | Leitura prática, clara e baseada em ciência comportamental. |
| Mockup (eyebrow) | Selo na capa | Focão · E-book gratuito |
| Mockup (título h2) | Capa | Rotina & Comportamento Canino |
| Mockup (rodapé) | Rodapé da capa | Como previsibilidade, consistência e observação transformam a relação com seu cão. |

**PainSection**

| Local | Contexto | Texto atual |
|---|---|---|
| Título (h2) | Headline | Seu cachorro não é teimoso. Talvez ele só esteja sem previsibilidade |
| Parágrafo 1 | Corpo | Ansiedade, destruição, agitação, dificuldade de obediência. Muitos desses comportamentos têm raiz em rotinas inconsistentes, energia acumulada sem canal e falta de contexto previsível. |
| Parágrafo 2 | Corpo | Não é maldade. Não é teimosia. É biologia comportamental. E quando você entende isso, tudo muda: a relação, a comunicação e o bem-estar dos dois. |
| Citação | Caixa destacada | "Entender o comportamento do seu cão começa por entender o que ele precisa. Não o que ele faz." |

**LearnSection**

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow / título (h2) | Seção | O que você vai aprender / Quatro pilares que transformam a relação com seu cão |
| Card 1 (título/descrição) | Pilar | Previsibilidade reduz ansiedade / Cães que sabem o que esperar do dia apresentam menor nível de cortisol e comportamentos mais equilibrados. |
| Card 2 (título/descrição) | Pilar | Energia sem canal vira destruição / Quando a energia não encontra saída adequada, ela encontra a sua própria - e raramente é onde você queria. |
| Card 3 (título/descrição) | Pilar | Corrigir sem estrutura gera ruído / Sem consistência, comandos e correções viram ruído. O cão não aprende - ele só reage. |
| Card 4 (título/descrição) | Pilar | Acompanhar padrões muda decisões / Observar o comportamento ao longo do tempo revela gatilhos que passariam despercebidos no dia a dia. |

**BenefitsSection**

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow / título (h2) | Seção | Benefícios práticos / O que muda quando você entende o comportamento do seu cão |
| Subtítulo | Introdução | Não é sobre adestramento perfeito. É sobre uma relação mais consciente, mais calma e mais humana com o seu cão. |
| Item 1 (label/detail) | Card | Mais clareza no dia a dia / Você age com intenção, não no improviso. |
| Item 2 (label/detail) | Card | Menos improviso / Rotina estruturada significa menos surpresas. |
| Item 3 (label/detail) | Card | Mais segurança para agir / Saber o porquê dá confiança na resposta certa. |
| Item 4 (label/detail) | Card | Mais equilíbrio na rotina / Seu cão e você ganham quando há previsibilidade. |
| Item 5 (label/detail) | Card | Mais consciência sobre gatilhos / Identificar padrões antes de corrigir é o diferencial. |

**EditorialSection**

| Local | Contexto | Texto atual |
|---|---|---|
| Citação (blockquote) | Frase editorial | Rotina não é rigidez. É previsibilidade que acalma. |
| Assinatura | Abaixo da citação | Rotina & Comportamento Canino · Focão |

**TestimonialsSection**

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow / título (h2) | Seção | O que dizem os tutores / Mudanças reais quando a rotina entra em cena |
| Depoimento 1 (texto/nome/cão) | Card | "Eu achava que ele era teimoso por natureza. Depois que entendi a questão da rotina, em duas semanas ele já estava muito mais calmo." / Ana Paula M. / Tutora do Thor, 3 anos |
| Depoimento 2 (texto/nome/cão) | Card | "A destruição em casa parou quase que imediatamente quando comecei a estruturar melhor os horários de energia dela." / Rodrigo F. / Tutor da Luna, 2 anos |
| Depoimento 3 (texto/nome/cão) | Card | "Nunca tinha pensado que a ansiedade dele tinha tudo a ver com a falta de previsibilidade no dia a dia. Mudou tudo." / Camila S. / Tutora do Bento, 5 anos |

**LeadForm**

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow / título (h2) | Seção | Acesso gratuito / Baixe gratuitamente o e-book |
| Subtítulo | Introdução | Preencha os campos abaixo e receba o e-book por e-mail e WhatsApp. |
| Label / placeholder Nome | Campo | Nome / Seu nome |
| Label / placeholder E-mail | Campo | E-mail / seu@email.com |
| Label / placeholder WhatsApp | Campo | WhatsApp / (00) 00000-0000 |
| Mensagem de erro | Envio falha (catch) | Não foi possível enviar agora. Tente novamente em alguns instantes. |
| Botão | `submitting` false/true | Receber e-book agora / Enviando... |
| Nota de privacidade | Abaixo do botão | Seus dados estão seguros. Sem spam, prometemos. |
| Sucesso (título/parágrafo) | `submitted === true` | Pedido recebido! / Seu pedido entrou no Focão. Vamos enviar o e-book por e-mail e WhatsApp. |

**AppCTA**

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow / título (h2) | Seção | App Focão / Depois de entender, o próximo passo é aplicar com consistência |
| Parágrafo | Corpo | O app Focão ajuda você a acompanhar rotina, energia, alimentação e comportamento em um só lugar - transformando observação em ação consistente, todos os dias. |
| Botão | Link `/register` | Quero conhecer o app Focão |

**Footer**

| Local | Contexto | Texto atual |
|---|---|---|
| Copyright | `{year}` dinâmico | © {year} Focão · Rotina & Comportamento Canino |
| Links | Rodapé | Privacidade / Termos / Contato |

_Nota: `EbookLanding.tsx`, `BrandLogo.tsx` e `Reveal.tsx` são orquestradores/wrappers sem texto próprio. Toda a copy da landing é hardcoded (editável diretamente)._

### PresellFocao

_Quase toda a copy vem de `PresellConfigRepository.getConfig()` (Firestore), com fallback nos padrões de `getDefaultPresellConfig()`. Linhas `[BACKEND]` mostram o texto padrão embutido; em produção podem ser sobrescritas pelo backend._

| Local | Contexto | Texto atual |
|---|---|---|
| Header (logo/botão) | Cabeçalho fixo | Focão / Entrar |
| Hero (eyebrow) | `config.heroEyebrow` | [BACKEND] Comece pelo essencial |
| Hero (título) | `config.heroTitle` | [BACKEND] Treinos guiados, evolução visível e rotina mais clara. |
| Hero (subtítulo) | `config.heroSubtitle` | [BACKEND] O Focão organiza o próximo passo do seu cão e acompanha a evolução ao longo da jornada. |
| Hero (CTA) | `config.heroCta` | [BACKEND] Começar agora |
| Benefícios (card 1) | `config.benefits[0]` | [BACKEND] Plano em sequência / Treinos claros, organizados por etapa e sem bagunçar a evolução. |
| Benefícios (card 2) | `config.benefits[1]` | [BACKEND] Check-ins comportamentais / Registre a rotina e ajude o Focão a entender o que está mudando. |
| Benefícios (card 3) | `config.benefits[2]` | [BACKEND] Evolução visível / Acompanhe progresso, consistência e próximos passos. |
| Galeria (eyebrow/título) | Literal | Veja por dentro / Simples de usar, fácil de evoluir. |
| Galeria (legendas prints) | Literal | Seu próximo passo, sempre claro / Treinos guiados, em sequência / Acompanhe a evolução acontecer |
| Quiz "routine" (eyebrow/pergunta) | `config.quizSteps[0]` | [BACKEND] Rotina / Hoje, como está a rotina do seu cão? |
| Quiz "routine" (opções) | — | [BACKEND] Meio bagunçada / Existe rotina, mas falha / É boa, quero evoluir |
| Quiz "challenge" (eyebrow/pergunta) | `config.quizSteps[1]` | [BACKEND] Comportamento / O que mais atrapalha no dia a dia? |
| Quiz "challenge" (opções) | — | [BACKEND] Ansiedade ou agitação / Passeio difícil / Falta de obediência / Xixi ou rotina instável |
| Quiz "consistency" (eyebrow/pergunta) | `config.quizSteps[2]` | [BACKEND] Consistência / Com que frequência você consegue treinar? |
| Quiz "consistency" (opções) | — | [BACKEND] Quase nunca / Algumas vezes na semana / Quase todo dia |
| Quiz "training" (eyebrow/pergunta) | `config.quizSteps[3]` | [BACKEND] Direção / O que falta para o treino funcionar melhor? |
| Quiz "training" (opções) | — | [BACKEND] Saber o próximo passo / Acompanhar evolução / Ter treinos mais simples |
| Quiz "goal" (eyebrow/pergunta) | `config.quizSteps[4]` | [BACKEND] Objetivo / Qual resultado você mais quer agora? |
| Quiz "goal" (opções) | — | [BACKEND] Mais calma em casa / Passeios mais tranquilos / Obediência e foco / Rotina mais previsível |
| Captura (eyebrow/título) | `config.captureEyebrow`/`captureTitle` | [BACKEND] Diagnóstico pronto / Para onde devemos enviar o diagnóstico e o plano inicial do seu cão? |
| Captura (texto) | `config.captureText` | [BACKEND] Precisamos do seu e-mail para salvar seu progresso e garantir que você não perca seu plano personalizado. |
| Captura (placeholders) | Literal | Seu nome / Nome do cão / Seu melhor e-mail / WhatsApp opcional |
| Captura (botão) | `config.captureButton` / salvando | [BACKEND] Ver meu diagnóstico / Salvando... |
| Captura (erro e-mail) | E-mail vazio/sem "@" | Informe um e-mail válido para receber o diagnóstico. |
| Captura (erro salvar) | Falha (catch) | Não conseguimos salvar seus dados agora. Tente novamente. |
| Fallback nome do lead | Nome e nome do cão vazios | Tutor Focão |
| Resultado (eyebrow) | `config.resultEyebrow` | [BACKEND] Diagnóstico inicial |
| Resultado (texto de apoio) | `config.resultSupportText` | [BACKEND] Em poucos minutos, seu plano inicial fica pronto. Depois você pode completar o perfil para deixar relatórios e recomendações mais precisos. |
| Resultado (botão) | `config.resultCta` | [BACKEND] Baixar o app e iniciar plano agora |
| Diagnóstico "passeio" (título/texto) | `challenge === 'passeio'` | [BACKEND] Seu cão precisa de uma sequência mais clara para o passeio. / O primeiro plano deve reduzir improviso, organizar comandos simples e medir se a rotina está ficando mais previsível. |
| Diagnóstico "calma" (título/texto) | `challenge === 'ansiedade'` | [BACKEND] Seu cão parece precisar de mais previsibilidade e treino curto. / A prioridade é criar uma rotina possível, com exercícios guiados e check-ins para entender o que melhora ou piora. |
| Diagnóstico "obediencia" (título/texto) | `challenge === 'obediencia'` | [BACKEND] Seu cão precisa de progressão, não de comandos soltos. / O melhor começo é seguir treinos por etapa, registrar consistência e avançar quando o comportamento estiver mais estável. |
| Diagnóstico fallback (título/texto) | Nenhuma correspondência (ex.: xixi) | [BACKEND] Seu cão precisa de uma rotina mais clara para evoluir. / O plano inicial deve organizar o essencial: próximos treinos, check-ins comportamentais e acompanhamento visível da evolução. |

### PoliticaPrivacidade

_Copy jurídica de formato longo. Títulos e rótulos verbatim; corpo resumido._

| Local | Contexto | Texto atual |
|---|---|---|
| Eyebrow / título (h1) | Cabeçalho | Focão App / Política de Privacidade |
| Data | Cabeçalho (fixa) | Última atualização: 02 de junho de 2025 |
| Seção 1 (título) | — | 1. Quem somos |
| Seção 2 (título) | — | 2. Dados que coletamos |
| Seção 2 (cabeçalhos tabela) | — | Dado / Descrição / Finalidade |
| Seção 3 (título) | — | 3. Como usamos seus dados |
| Seção 4 (título) | — | 4. Compartilhamento com terceiros |
| Seção 4 (cabeçalhos tabela) | — | Serviço / Finalidade / Política |
| Seção 5 (título) | — | 5. Seus direitos (LGPD — Lei 13.709/2018) |
| Seção 6 (título) | — | 6. Retenção de dados |
| Seção 7 (título) | — | 7. Segurança |
| Seção 8 (título) | — | 8. Cookies e tecnologias de rastreamento |
| Seção 8 (cabeçalhos tabela) | — | Categoria / Uso / Base |
| Seção 9 (título) | — | 9. Alterações nesta política |
| Seção 10 (título) | — | 10. Contato e DPO |

_Contato citado no corpo: contato@focaoapp.com.br. Nota: Seção 6 usa "activa" (grafia PT-PT em vez de "ativa")._

---

## 19. Admin

### AdminCheckins

| Local | Contexto | Texto atual |
|---|---|---|
| Header (mini-label/título) | Sempre | Admin / Observações dos check-ins |
| Mensagem de erro | `error` setado | Não foi possível carregar as observações. Verifique se você tem acesso de admin. |
| Estado vazio | `notes.length === 0` | Nenhuma observação registrada ainda. |
| Contador | Há observações | {notes.length} observação(ões) |
| Card (nome/data/comportamento/observação) | Cada observação | [BACKEND] {n.userName} / {n.date} / {n.comportamento} / {n.note} |

### AdminNotificacoes

| Local | Contexto | Texto atual |
|---|---|---|
| Header (título/subtítulo/botão) | Sempre | Central de Notificações / Disparo e segmentação para usuários do Focão / Observações dos check-ins |
| Passo 1 (título seção) | Etapa 1 | Compor Notificação |
| Passo 1 (label título / placeholder) | Etapa 1 | Título / Ex: O treino de hoje já está pronto. |
| Passo 1 (label subtexto / placeholder) | Etapa 1 | Subtexto (Mensagem) / Ex: Pequenos passos ainda contam. Bora evoluir? |
| Passo 1 (label segmentação) | Etapa 1 | Segmentação |
| Passo 1 (opções segmentação) | Etapa 1 | Todos os usuários / Free / Trial / Premium / Onboarding incompleto / Sem check-in recente / Sem treino recente / Com vacina próxima / Sem nutrição configurada |
| Passo 1 (label destino) | Etapa 1 | Destino ao tocar |
| Passo 1 (opções destino) | Etapa 1 | Home / Treino do dia / Check-in / Agenda / Nutrição / Vacinas / Relatório Semanal / Assinatura / Chat / Suporte |
| Passo 1 (label agendamento) | Etapa 1 | Agendamento |
| Passo 1 (radios) | Etapa 1 | Enviar agora / Agendar data/hora |
| Passo 1 (label frequência) | `scheduleType === 'schedule'` | Frequência (Opcional) |
| Passo 1 (opções frequência) | `scheduleType === 'schedule'` | Única / Diária / Semanal |
| Passo 1 (botão) | Etapa 1 | Continuar |
| Passo 2 (título seção) | Etapa 2 | Confirmação de Envio |
| Passo 2 (labels mini) | Etapa 2 | Mensagem / Segmento / Estimativa / Agendamento / Ação ao tocar |
| Passo 2 (estimativa) | Calculando / calculado | ... / ~ {estimatedUsers} usuários |
| Passo 2 (agendamento valor) | now / schedule | Enviar agora / Agendado ({frequency}) |
| Passo 2 (alerta) | `segment === 'all'` | Atenção: Você está prestes a enviar push notifications para todos os usuários do app. Confirme se as informações estão corretas. |
| Passo 2 (botão envio) | Enviando / now / schedule | Processando... / Disparar Notificação / Confirmar Agendamento |
| Preview celular (título/status bar) | Painel | Prévia no Celular / 09:41 |
| Preview celular (título fallback / timestamp) | `title` vazio | Título da notificação / agora |
| Preview celular (corpo fallback) | `body` vazio | Mensagem de exemplo como aparecerá na tela do usuário. |
| Histórico (título/vazio) | Painel | Últimos Disparos / Nenhum histórico encontrado. |
| Histórico (item) | Cada item | [BACKEND] {h.title} / {h.status} / {h.body} / {data} / ~{h.estimatedUsers} alcances |
| Alert (toast nativo) | Sucesso agendado / enviado / erro | Notificação agendada com sucesso! / Notificação enviada com sucesso! / Erro ao enviar. |
| getSegmentName (map) | Resumo Passo 2 | Todos os usuários / Usuários Free / Usuários no Trial / Usuários Premium / Onboarding incompleto / Sem check-in recente / Sem treino recente / Com vacina próxima / Sem nutrição configurada |
| getDestinationName (map) | Resumo Passo 2 | Home / Treino do Dia / Check-in / Agenda / Nutrição / Vacinas / Relatório Semanal / Assinatura / Chat/Suporte |

_Nota: divergências de capitalização entre os `options` e os mapas de nome ("Treino do dia" vs "Treino do Dia"; "Chat / Suporte" vs "Chat/Suporte")._

---

## 20. Componentes compartilhados / Tab bar

### MainLayout (barra de navegação inferior)

| Local | Contexto | Texto atual |
|---|---|---|
| Tab | Sempre | Home |
| Tab | Ambiente beta (`isBeta`) | Beta |
| Tab | Não beta | Plano |
| Tab | Sempre | Check-in |
| Tab | Sempre | Evolução |
| Tab | Sempre | Perfil |

### InstallPrompt

| Local | Contexto | Texto atual |
|---|---|---|
| Botão dispensar (aria-label) | Todos os modos | Dispensar |
| Banner (aria-label / título) | Modos ios / mac-safari | Instalar aplicativo / Instalar o Focão |
| Instrução iOS | `mode === 'ios'` | Toque em e depois em "Adicionar à Tela de Início". |
| Instrução macOS | `mode === 'mac-safari'` | No menu Arquivo do Safari, escolha "Adicionar ao Dock". |
| Banner Chromium (aria-label / título) | Modo android/chromium | Instalar aplicativo / Instalar o Focão |
| Banner Chromium (subtexto / botão) | Modo android/chromium | Acesso rápido direto na tela inicial. / Instalar |

### LgpdBanner

| Local | Contexto | Texto atual |
|---|---|---|
| Banner (aria-label) | Visível | Aviso de privacidade |
| Banner (texto) | Visível | Cookies essenciais e, com seu consentimento, de marketing (Meta) para medir anúncios. |
| Banner (link/botões) | Visível | Política / Recusar / Aceitar |

### AppLaunchSplash

| Local | Contexto | Texto atual |
|---|---|---|
| Tagline (uppercase) | Tela de abertura | Rotina, treino e evolução |

### Wordmark

| Local | Contexto | Texto atual |
|---|---|---|
| Wordmark (aria-label / texto) | Sempre | FOCÃO |

### Componentes de UI (texto hardcoded)

| Componente | Local | Contexto | Texto atual |
|---|---|---|---|
| BottomSheetSelect | Placeholder busca (default) | Prop não fornecida | Buscar... |
| BottomSheetSelect | Estado vazio | Sem resultado | Nenhum resultado encontrado para "{search}" |
| Input | Botão senha (aria-label) | Senha visível / oculta | Ocultar senha / Visualizar senha |
| Input | Sugestões de e-mail | Ao digitar domínio parcial | {localPart}@{domínio} (gmail.com, hotmail.com, outlook.com, yahoo.com, icloud.com, live.com, uol.com.br, bol.com.br, terra.com.br) |
| PremiumGate | Parágrafo | Sempre | Este recurso faz parte do plano Premium. Inicie seus 7 dias gratuitos para desbloquear. |
| PremiumGate | Botões | Sempre | Ver planos / Voltar |

_Badge, SelectCard e Button não têm copy hardcoded (recebem texto via props/children)._

### Validação de dados do cão (dogFieldValidation)

| Local | Contexto | Texto atual |
|---|---|---|
| DOG_LIFE_STAGE_OPTIONS | Opções fase da vida | Filhote / Adulto / Sênior / Não sei |
| Idade (filhote) | Opções | 0-3 meses / 4-6 meses / 7-12 meses / Não sei |
| Idade (adulto) | Opções | 1 ano … 12 anos / Não sei |
| Idade (sênior) | Opções | 7-9 anos / 10-12 anos / 13+ anos / Não sei |
| validateDogBasics | Nome/peso vazio | Preencha nome e peso do cão. |
| validateDogBasics/Edit | Nome > 24 caracteres | O nome do cão deve ter no máximo {DOG_NAME_MAX_LENGTH} caracteres. |
| validateDogBasics/Edit | Idade inválida | Selecione uma idade aproximada válida. |
| validateDogBasics/Edit | Peso fora do intervalo | Informe um peso entre 0.1 e {DOG_WEIGHT_MAX_KG} kg. |

---

## 21. Copy dinâmica dos motors

> Estes textos são gerados por classes em `src/motors/**` e exibidos principalmente na Home, Treino, Evolução, Relatórios e Agenda. `art`/`pronoun` variam por gênero (da/do, dela/dele); `dogName` fallback "seu cão".

### HomeMotor — priorityAlert (banner de alerta)

| Condição | Texto atual |
|---|---|
| `isPremiumLocked` (premium/teste expirou) | Seu período premium ou de teste expirou. Escolha um plano para liberar os próximos treinos. |
| Trial ativo e `trialDaysLeft <= 3` | Aproveite! Seu período de teste acaba em {trialDaysLeft} {dia/dias}. |
| Treino feito, sem check-in | Treino do dia concluído! Registre o check-in para analisarmos o comportamento. |
| Vacina próxima (priorityAction=vaccine) | Lembrete: Vacina "{upcomingVaccine.name}" agendada para os próximos dias. |
| Nutrição pendente | Aproveite para cadastrar a ração real do seu cão para ajustar a porção diária ideal. |

### HomeMotor — hero e insights

| Condição | Campo | Texto atual |
|---|---|---|
| `isPremiumLocked` | heroCta / primaryCTA / secondaryCTA | Assinar Premium / Ver Planos / Continuar Free |
| `isPremiumLocked` | mainInsight | Sua jornada no Focão está pausada. Desbloqueie o acesso para continuar acompanhando a evolução inteligente do seu cão. |
| `isPremiumLocked` | emotionalMessage | Acompanhar a rotina {pronoun} é o primeiro passo para o comportamento ideal. |
| `isNewUser` | heroTitle / heroSubtitle | Primeiro passo do plano / Ative sua primeira sessão de treinamento. |
| `isNewUser` | mainInsight | A jornada de {dogName} começa pelos primeiros registros. Comece pelo treino de hoje ou registre o primeiro check-in. |
| `isNewUser` | emotionalMessage | Cada pequeno registro hoje molda as recomendações de amanhã. |
| `isNewUser` | primaryCTA / secondaryCTA | Começar treino / Fazer check-in |
| Treino feito hoje | heroTitle / heroSubtitle | Sessão concluída / Hoje vocês deram mais um passo. Amanhã seguimos com a próxima etapa. |
| Treino feito, sem check-in | mainInsight | O treino {art} {dogName} já foi feito hoje. Como está o comportamento {pronoun} agora? |
| Treino feito, sem check-in | emotionalMessage / primaryCTA / secondaryCTA | Entender o reflexo do treino na rotina é o que cria a verdadeira consistência. / Fazer check-in / Ver evolução |
| Treino feito e check-in feito | mainInsight | Dia completo! Vocês treinaram e acompanharam a rotina {art} {dogName} com sucesso. |
| Treino feito e check-in feito | emotionalMessage / primaryCTA / secondaryCTA | Dia após dia, o comportamento que você espera toma forma. / Ver relatório / Explorar dicas |
| Sem tarefa ativa (plano pausado) | heroSubtitle / mainInsight | Aguarde a geração do seu próximo plano de treinos. / Vocês concluíram a etapa programada. Estamos preparando a continuidade. |
| Sem tarefa ativa | emotionalMessage / primaryCTA / secondaryCTA | A pausa também faz parte do aprendizado. / Ver histórico / Revisar nutrição |
| Treino pendente (padrão) | mainInsight | Hoje o objetivo {art} {dogName} é {objectiveText}. |
| Treino pendente (padrão) | emotionalMessage | Consistência é mais importante do que intensidade. Alguns minutos hoje já fazem a diferença. |
| Fallbacks | heroTitle / heroSubtitle / heroCta | Plano Concluído / Sem pendências. / Começar agora |
| objectiveText | Com tarefa ativa / sem | focar em {título minúsculo} / manter a rotina |

### DailyMissionsMotor — Gap (retomada de habilidade)

_Só dispara quando há gap >= 4 dias numa habilidade. Labels de habilidade: foco, obediência, passeio com guia, calma e autocontrole, socialização, rotina, convivência, permanência, vínculo._

| Habilidade (tag) | Sugestão (`{name}` = nome do cão) |
|---|---|
| foco | Chame {name} pelo nome 5 vezes com recompensa — 3 minutos bastam |
| obediencia | Pratique "senta" e "fica" com {name} em 5 repetições com recompensa |
| passeio | Faça 10 minutos de caminhada tranquila com {name}, foco na guia frouxa |
| calma | Peça que {name} descanse em um local fixo por 2 minutos sem interação |
| social | Leve {name} a um ambiente diferente por 5 minutos, sem pressão |
| rotina | Mantenha o horário de saída de hoje consistente — rotina é treino |
| convivencia | Pratique "fica" com {name} enquanto outras pessoas estão por perto |
| independencia | Deixe {name} sozinho em outro cômodo com a porta aberta por 1 minuto |
| vinculo | Reserve 5 minutos só para brincar com {name} sem comandos — puro vínculo |
| (fallback) | Retome o treino de {skillLabel} com {name} — mesmo 5 minutos fazem diferença |

### DailyMissionsMotor — missões geradas

| Missão | Condição | Texto atual |
|---|---|---|
| m1 (daily_training) | Há tarefa atual | Pratique "{currentTask.title}" por 5 minutos |
| m1 (daily_recall) | Sem tarefa atual | Chame {name} pelo nome 5 vezes e recompense cada resposta |
| m2 (daily_leash) | issue pulling/puxa_na_guia | Pratique caminhar ao lado d{a/o} {name} por 3 minutos sem puxar |
| m2 (daily_calm) | issue barking/latidos | Pratique "ignora" com {name}: fique indiferente a latidos por 2 minutos |
| m2 (daily_stay) | issue separation_anxiety/ansiedade | Peça que {name} fique em outro cômodo por 1 minuto com a porta aberta |
| m2 (daily_focus) | issue reactive/reatividade | Pratique contato visual com {name} em ambiente calmo: 10 repetições |
| m2 (daily_sit) | Padrão | Pratique o comando "senta" com {name}: 5 repetições com recompensa |
| m3 (daily_walk) | Sempre; minutos por energia (high 20 / low 10 / medium 15) | Faça um passeio calmo de {walkMinutes} minutos com {name}, sem pressão |

### TrainingReasonMotor — "Por que este treino?"

Título fixo: **Por que este treino?** (ou **Próxima Etapa** quando não há tarefa). Fase varia: Fase inicial da jornada (<=3 sessões) / Construção de consistência (<=10) / Refinamento da rotina.

| Condição (problema detectado) | Texto (reasonText) |
|---|---|
| Sem tarefa | O plano está sendo preparado para as próximas evoluções. |
| latidos, count >= 2 | Notamos que {name} latiu em {count} dos últimos {total} registros — este treino trabalha o autocontrole e reduz essa reação de forma gradual. |
| latidos, count < 2 | {name} tem tendência a latir em certas situações — este treino desenvolve a calma e o autocontrole necessários. |
| puxa_na_guia, count >= 2 | Nos últimos {total} registros, {name} puxou na guia {count} {vez/vezes} — este treino trabalha passeios com mais leveza e atenção mútua. |
| puxa_na_guia, count < 2 | Um dos objetivos é melhorar o passeio d{art} {name} — este treino é o próximo passo para uma guia mais solta. |
| reatividade, count >= 2 | Notamos reatividade d{art} {name} em {count} registros recentes — este treino constrói respostas mais calmas e seguras diante de estímulos. |
| reatividade, count < 2 | {name} apresenta algum nível de reatividade — este treino ajuda a criar tranquilidade diante do que antes provocava reação. |
| destruicao, count >= 1 | Registramos comportamentos destrutivos recentes d{art} {name} — este treino trabalha o redirecionamento de energia de forma positiva. |
| destruicao, count 0 | Este treino ajuda {name} a canalizar energia de forma construtiva e evitar destruição. |
| mordidas, count >= 1 | Notamos episódios de mordidas nos últimos registros — este treino ensina {name} a controlar o impulso e respeitar limites. |
| mordidas, count 0 | Este treino desenvolve o autocontrole d{art} {name} em relação a mordidas e pressão de boca. |
| agitado, count >= 2 | {name} esteve agitad{a/o} na hora de sair em registros recentes — este treino ensina a controlar essa excitação antes do passeio. |
| agitado, count < 2 | Este treino ajuda {name} a desenvolver calma na rotina de saída, tornando os passeios mais tranquilos desde o início. |
| xixi_em_lugar_errado, count >= 1 | Registramos acidentes dentro de casa nos últimos dias — este treino reforça a rotina de fazer xixi na rua de forma consistente. |
| xixi_em_lugar_errado, count 0 | Este treino estabelece uma rotina clara para {name} aprender a fazer xixi sempre no lugar certo. |
| pula_em_pessoas | {name} tem o hábito de pular em pessoas — este treino ensina a cumprimentar com os quatro pés no chão, de forma gentil. |
| ansiedade | Notamos sinais de ansiedade no perfil d{art} {name} — este treino trabalha a segurança emocional e a confiança de forma progressiva. |
| falta_de_foco | Este treino desenvolve o foco e a atenção d{art} {name} — habilidades que são a base para todos os outros comandos. |
| medo | {name} apresenta algum nível de insegurança — este treino fortalece a confiança de forma gradual, sem pressão. |
| social | Este treino melhora a sociabilidade d{art} {name} com pessoas e outros animais, de forma segura e positiva. |
| Fallback energia alta | Notamos que a energia d{art} {name} estava alta nos últimos registros — este treino ajuda a canalizar esse entusiasmo com foco. |
| Fallback energia baixa | Este treino respeita o ritmo d{art} {name}, propondo estímulos de forma suave e no tempo certo. |
| Fallback início (<=2 sessões) | Como {art} {name} está no início da jornada, este treino cria a base para uma convivência mais calma e conectada. (+ "Ele conversa diretamente com a principal meta cadastrada." se houver goal) |
| Fallback geral | Estamos personalizando a rotina com base nos registros recentes. Este treino é o próximo passo natural na evolução d{art} {name}. |

**Dicas de recompensa (anexadas ao reasonText):**

| rewardPreference | Texto |
|---|---|
| treats | Use petiscos pequenos como recompensa — funciona muito bem para o aprendizado. |
| toys | Ofereça o brinquedo favorito como recompensa ao final de cada acerto. |
| praise | Elogie com entusiasmo a cada acerto — voz animada é a melhor recompensa. |
| play | Uma breve brincadeira é uma ótima recompensa depois de cada tentativa bem-sucedida. |
| food | Use a própria ração como recompensa — pratico e eficiente. |

**Focus (label do foco atual):** Autocontrole de latidos / Passeio com guia solta / Reações mais calmas / Redirecionamento de energia / Controle de mordida / Controle de agitação / Rotina de xixi na rua / Cumprimentos calmos / Segurança emocional / Foco e atenção / Confiança e segurança / Socialização (fallback: Foco e consistência).

### CheckinInsightsMotor — insightText (exibido na Home e Relatório)

| Condição | Texto atual |
|---|---|
| Nenhum check-in | Registre mais check-ins para revelar os padrões do seu cão. |
| Passeios agendados não concluídos + energia alta | Nos dias em que os passeios agendados não foram marcados como concluídos, seu cão tendeu a apresentar energia mais alta e falta de foco. Priorize os passeios da agenda. |
| Doses de remédio não concluídas | Notamos que algumas doses de remédios agendadas não foram concluídas. Lembre-se de manter os horários da medicação em dia para o bem-estar físico do seu cão. |
| Comportamento melhor após treino | Nos dias em que vocês treinaram, o comportamento de seu cão melhorou. A consistência está funcionando. |
| Comportamento pior + energia alta | Seu cão demonstra energia alta nos dias de treino. Sessões mais curtas e frequentes podem funcionar melhor. |
| Comportamento pior | Alguns dias após o treino registraram mais agitação. Considere ajustar o horário ou a intensidade. |
| Refeições marcadas regularmente | A consistência na marcação das refeições mostra uma rotina alimentar exemplar. Isso ajuda a estabilizar os níveis de energia ao longo do dia. |
| Energia predominante alta | Seu cão tem demonstrado energia elevada com frequência. Treinos de foco e autocontrole ajudam a canalizar isso. |
| Energia predominante baixa | Seu cão tem aparecido mais calmo nos check-ins. Mantenha o ritmo de treinos leves e consistentes. |
| Padrão (fallback) | Continue registrando para refinar as recomendações do plano. |

### WeeklyReportMotor — análise da semana

**mainImprovement (destaque):**

| Condição | Texto atual |
|---|---|
| maturity inicial, treinos e check-ins | Vocês deram os primeiros passos registrando treinos e check-ins no diário. |
| maturity inicial, só treinos | Os primeiros treinos da semana foram registrados. |
| maturity inicial, outro | O diário já começou a ser preenchido. |
| Energia calma na maioria | A energia se manteve mais equilibrada e relaxada na maior parte da semana. |
| Comportamento positivo >= metade | O comportamento geral mostrou-se bastante estável. |
| >= 3 treinos | A consistência nos treinos foi excelente, o que ajuda na rotina e no foco. |
| Padrão | O engajamento com a rotina foi o destaque desta semana. |

**attentionPoint + nextWeekSuggestion:**

| Condição | attentionPoint / nextWeekSuggestion |
|---|---|
| maturity inicial | (sem atenção) / Continue registrando o humor do seu cão nos check-ins para montarmos um histórico. |
| Reatividade | Notamos maior sensibilidade e reação a estímulos externos durante os passeios. / Vale realizar exercícios de foco rápido antes e durante os passeios para diminuir a reatividade. |
| Ansiedade | Houve sinais de ansiedade ou agitação em momentos de separação. / Introduza treinos curtos do comando "Fica" e prêmios para reforçar a independência. |
| Puxar na guia | Os registros indicam dificuldade recorrente em manter um passeio mais calmo. / Reforce treinos curtos de atenção e condução antes de aumentar a duração dos passeios. |
| Destruição | Houve registros de destruição de objetos durante a semana. / Combine gasto mental curto com manejo do ambiente nos períodos de maior agitação. |
| Picos de energia (outro) | Identificamos alguns picos de energia agitada e falta de foco. / Considere adicionar pequenas sessões de gasto mental com brinquedos recheáveis. |
| Sem treinos | A semana passou quase sem treinos direcionados registrados. / Retome com treinos de 3 a 5 minutos diários de obediência básica para aquecer. |
| Treinos falhos | Alguns treinos pareceram mais difíceis ou não puderam ser concluídos. / Divida os comandos que não saíram tão perfeitos em etapas menores e aumente as recompensas. |
| Sem problemas aparentes | (sem atenção) / Mantenha o ritmo atual, a evolução da comunicação entre vocês está fluindo de forma excelente! |
| Ajuste maturity parcial | Continue preenchendo os check-ins para mapearmos melhor os desafios. |

**comparison.headline:**

| Condição | Texto atual |
|---|---|
| Sem semana anterior | A comparação entre semanas começará com os próximos registros. |
| activityDelta > 0 | A rotina ganhou mais presença nesta semana. |
| activityDelta < 0 | A frequência de registros caiu em relação à semana anterior. |
| Estável | A frequência de acompanhamento se manteve estável. |

**comparison.detail:**

| Condição | Texto atual |
|---|---|
| Sem semana anterior | Ainda não há registros suficientes da semana anterior para medir tendência com segurança. |
| Com dados | {activeDays} dia(s) ativos nesta semana e {previousActiveDays} na semana anterior. Foram {totalTrainings} treino(s) e {totalCheckins} check-in(s) no período atual. |

**recurringPattern (gatilho >= 2 ou incidente >= 2):**

| Padrão | Texto atual |
|---|---|
| Gatilho recorrente | O gatilho mais recorrente nos registros recentes foi {label}. Observe se os episódios diminuem quando esse contexto é antecipado com mais previsibilidade. |
| leash_pulling | A dificuldade em manter um passeio calmo apareceu de forma recorrente. Vale priorizar exercícios curtos de atenção antes de sair. |
| excessive_barking | Os latidos excessivos apareceram em mais de um registro recente. Observe quais estímulos antecedem esses episódios. |
| reactivity | A reatividade a estímulos externos se repetiu nos registros recentes. Trabalhe distância segura e foco em ambientes mais simples. |
| destruction | A destruição de objetos apareceu de forma recorrente. Combine manejo do ambiente com atividades curtas de gasto mental. |
| energia agitada | A energia elevada e a dificuldade de foco apareceram com frequência. Sessões mais curtas e previsíveis podem funcionar melhor. |

_Labels de gatilho:_ campainha / chegada de visitas / presença de outros cães / barulhos da rua / momentos em que ficou sozinho / hora de sair de casa / mudanças na rotina.

### AgendaMotor

| Campo | Condição | Texto atual |
|---|---|---|
| nutritionText | Padrão | {daily}g/dia configurado |
| nutritionText | Pendente | Configuração pendente |
| nutritionText | Fallback | Plano alimentar configurado |
| todayAlert | Trial terminando (<= 2 dias) | Seu período grátis termina em {trialDaysLeft} dias. |
| weeklyPreview (labels) | Próximos 4 dias | Amanhã / Dom / Seg / Ter / Qua / Qui / Sex / Sáb |

### NutritionMotor / IntelligentPlanMotor

| Local | Contexto | Texto atual |
|---|---|---|
| NutritionMotor - activityLabel | Nível de energia | Normal / Baixa / Alta |
| IntelligentPlanMotor - deriveFocus | issue pulling | Melhorar os passeios e foco externo |
| IntelligentPlanMotor - deriveFocus | separation_anxiety / destructive | Controle de ansiedade e relaxamento |
| IntelligentPlanMotor - deriveFocus | trainingBase advanced | Refinamento e Truques Avançados |
| IntelligentPlanMotor - deriveFocus | Padrão | Obediência básica e vínculo |

### TrainingTags — motivo de recomendação (reason)

| Condição | Texto atual |
|---|---|
| Com tags casadas (até 3 traduzidas) | Recomendado porque combina com {tags} e necessidades de comportamento. |
| Sem tags | Recomendado para o desenvolvimento e evolução geral do seu cão. |

_Labels de tag (tradução usada no reason):_ foco / conexão com o tutor / obediência básica / autocontrole / passeio tranquilo / socialização / ansiedade de separação / higiene e necessidades / cuidados e manejo físico / enriquecimento mental / puxar a guia / latidos excessivos / destruição de objetos / morder brinquedos/mãos / fazer xixi fora do lugar / reatividade / medo de barulhos ou pessoas / pular nas pessoas / falta de foco / idade de filhote / fase de adulto / fase sênior / pequeno porte / médio porte / grande porte / morar em apartamento / morar em casa / alta energia / média energia / baixa energia / comportamento medroso / comportamento agitado / comportamento calmo / sociabilidade / comportamento reativo / criação de rotina / convivência harmônica.

---

## 22. Biblioteca de treinos (`trainingTemplates.ts` / `trainingTree.ts`)

Estes nomes de módulo, títulos, objetivos e passos são copy hardcoded que aparece dinamicamente em Plano, Treino, Agenda e Histórico. Cada treino tem ainda 4 passos ("Passo a passo") e um texto "Antes de começar" (a maioria usa o padrão: _"Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável."_). Passos individuais não estão listados aqui na íntegra por volume; ver o arquivo para os 4 passos de cada treino.

**Nomes dos módulos (blocos):**

| ID | Nome do módulo |
|---|---|
| b1 | Conexão e foco |
| b2 | Fundamentos da obediência |
| b3 | Autocontrole e frustração |
| b4 | Passeio sem puxar |
| b5 | Socialização e ambiente |
| b6 | Ansiedade e autonomia |
| b7 | Necessidades e rotina |
| b8 | Manejo doméstico e cooperação |
| b9 | Vínculo e truques úteis |

**Treinos (nome · duração · objetivo):**

| ID | Nome | Duração | Objetivo (descrição exibida) |
|---|---|---|---|
| b1-t1 | Nome e contato visual | 10 min | Cultive presença e resposta ao chamado com mais conexão. |
| b1-t2 | Segue minha mão | 10 min | Conduza a atenção do cão de forma suave e precisa. |
| b1-t3 | Atenção em ambiente calmo | 12 min | Fortaleça o foco em um contexto de baixa distração. |
| b1-t4 | Atenção com pequena distração | 12 min | Ensine o cão a retornar para você com mais facilidade. |
| b1-t5 | Atenção em movimento | 12 min | Leve a conexão para situações com deslocamento e ação. |
| b1-t6 | Conexão antes do comando | 12 min | Construa atenção antes de qualquer pedido. |
| b2-t1 | Senta | 10 min | Estabeleça uma resposta clara para momentos do dia a dia. |
| b2-t2 | Deita | 10 min | Trabalhe calma, postura e disponibilidade para ouvir. |
| b2-t3 | Fica por 3 segundos | 8 min | Desenvolva permanência com serenidade e controle. |
| b2-t4 | Fica com pequena distância | 10 min | Amplie a estabilidade mesmo com um pouco mais de espaço. |
| b2-t5 | Vem quando chamado | 12 min | Reforce proximidade, vínculo e retorno com segurança. |
| b2-t6 | Espera | 10 min | Introduza pausas curtas com mais equilíbrio emocional. |
| b3-t1 | Ignorar petisco na mão | 8 min | Mostre que a calma também faz parte da recompensa. |
| b3-t2 | Esperar liberação para comer | 10 min | Transforme a refeição em um momento de autocontrole. |
| b3-t3 | Soltar objeto | 10 min | Desenvolva trocas leves e cooperação no manejo diário. |
| b3-t4 | Não pular nas pessoas | 12 min | Incentive chegadas mais estáveis e receptivas. |
| b3-t5 | Esperar na porta | 10 min | Pratique pausas conscientes antes do movimento. |
| b3-t6 | Permanecer calmo antes da recompensa | 10 min | Ensine o cão a sustentar o equilíbrio antes de receber. |
| b4-t1 | Junto parado | 8 min | Apresente a posição com clareza antes do movimento. |
| b4-t2 | Junto por poucos passos | 10 min | Comece a construir uma caminhada mais conectada. |
| b4-t3 | Junto com mudança de direção | 12 min | Trabalhe adaptação e atenção durante o percurso. |
| b4-t4 | Redirecionar ao puxar | 12 min | Ensine o retorno ao foco quando a tensão aparece. |
| b4-t5 | Passeio com distrações leves | 15 min | Leve o treino para um cenário mais próximo da rotina. |
| b4-t6 | Passeio com distrações moderadas | 15 min | Aumente o desafio sem perder a qualidade do passeio. |
| b5-t1 | Observar sem reagir | 10 min | Pratique presença diante de estímulos com mais estabilidade. |
| b5-t2 | Aproximação controlada | 12 min | Construa confiança em encontros feitos no ritmo certo. |
| b5-t3 | Receber pessoas em casa com calma | 15 min | Organize chegadas de forma mais previsível e tranquila. |
| b5-t4 | Ver outros cães à distância | 12 min | Trabalhe regulação antes da aproximação. |
| b5-t5 | Sons e objetos novos | 10 min | Amplie a segurança do cão diante do inesperado. |
| b5-t6 | Generalização em rua/parque | 15 min | Leve os aprendizados para contextos mais reais. |
| b6-t1 | Tapetinho / lugar de calma | 10 min | Crie uma referência física de segurança e descanso. |
| b6-t2 | Ficar sozinho por 30 segundos | 8 min | Comece a construir autonomia em ausências breves. |
| b6-t3 | Ficar sozinho por 2 minutos | 10 min | Amplie a tolerância à separação de forma gradual. |
| b6-t4 | Ritual de saída calmo | 8 min | Reduza a carga emocional dos sinais de partida. |
| b6-t5 | Independência em outro cômodo | 10 min | Incentive conforto mesmo sem proximidade constante. |
| b6-t6 | Relaxamento após ausência | 10 min | Transforme o reencontro em um retorno mais sereno. |
| b7-t1 | Acertar xixi/cocô no local | 12 min | Fortaleça acertos com consistência e clareza. |
| b7-t2 | Sinal pós-refeição | 10 min | Use a rotina a favor do aprendizado. |
| b7-t3 | Recompensa por acerto | 8 min | Associe o comportamento certo a uma resposta imediata. |
| b7-t4 | Rotina de saída | 10 min | Organize previsibilidade para facilitar o acerto. |
| b7-t5 | Controle de acidentes | 8 min | Corrija a rota com observação e ajustes leves. |
| b7-t6 | Generalização da rotina | 12 min | Consolide o comportamento em diferentes momentos do dia. |
| b7-t7 | Associar saída à necessidade | 10 min | Crie a conexão entre sair de casa e fazer as necessidades na rua. |
| b7-t8 | Reforço de rotina | 15 min | Consolide consistência e o local certo com rotina previsível e reforço imediato. |
| b7-t9 | Aguardar o momento certo | 12 min | Treine a paciência do cão — e a sua — no momento da eliminação. |
| b7-t10 | Reduzir acidentes dentro de casa | 10 min | Diminua os erros internos aumentando a previsibilidade das saídas. |
| b7-t11 | Eliminar em locais diferentes na rua | 12 min | Generalize o comportamento para que o cão elimine em qualquer ponto adequado fora de casa. |
| b7-t12 | Consistência total na rua | 10 min | Consolide o hábito de eliminar exclusivamente fora de casa. |
| b8-t1 | Aceitar toque em patas e orelhas | 8 min | Desenvolva tolerância ao cuidado com mais confiança. |
| b8-t2 | Escovação calma | 10 min | Transforme o manejo em uma experiência mais leve. |
| b8-t3 | Coleira e guia sem estresse | 8 min | Organize o início do passeio com mais equilíbrio. |
| b8-t4 | Banho e toalha | 10 min | Construa cooperação nos momentos de cuidado físico. |
| b8-t5 | Entrar e sair do carro / caixa | 10 min | Trabalhe deslocamentos com mais segurança e fluidez. |
| b8-t6 | Cooperação em contexto veterinário | 10 min | Prepare o cão para manejos delicados com menos tensão. |
| b9-t1 | Toca | 8 min | Crie uma interação simples, útil e responsiva. |
| b9-t2 | Gira | 8 min | Trabalhe leveza, atenção e coordenação. |
| b9-t3 | Vai para a cama | 10 min | Dê ao cão um ponto claro de pausa e organização. |
| b9-t4 | Busca objeto | 12 min | Estimule foco, engajamento e retorno ao tutor. |
| b9-t5 | Procura petisco | 10 min | Ative o faro e a concentração de forma prazerosa. |
| b9-t6 | Encadeamento de comandos básicos | 12 min | Una comportamentos conhecidos em uma sequência mais fluida. |

---

## 23. Notificações locais / WhatsApp / E-mails (services)

### useReminders — notificações locais (toast in-app + `new Notification`)

Todas com título **Focão** (exceto suporte, com título **Equipe Focão**).

| Lembrete | Condição | Corpo |
|---|---|---|
| Treino | Passou do horário do treino e ainda não notificado hoje | Está na hora do treino do seu cão. |
| Check-in | Passou do horário do check-in | Já registrou como foi o dia do seu cão? |
| Vacinas | Vacina vence em 3, 1 ou 0 dias | Lembrete de vacina: {nomes} está próxima ou vence hoje. |
| Relatório semanal | Segunda-feira 09:00, com >= 3 check-ins na semana | Seu relatório semanal está pronto. Veja a evolução. |
| Suporte | Nova mensagem do admin (título "Equipe Focão") | Você tem uma nova mensagem no suporte. |

### NotificationRepository — títulos de lembretes agendados

| Local | Texto |
|---|---|
| Lembrete de check-up (title) | Lembrete de Check-up |
| Lembrete de vacina (title) | Lembrete de Vacina |

### WhatsAppNotificationService

Serviço de envio de mensagens WhatsApp por template. Os textos dos templates são renderizados no provedor externo (não hardcoded aqui). Tipos de notificação: `welcome`, `agenda_day`, `training_reminder`, `checkin_reminder`, `vaccine_reminder`, `weekly_report`, `monthly_report`, `inactivity_3d`, `trial_ending`, `payment_failed`, `renewal_success`, `premium_activated`, `referral_reward`, `test`.

| Local | Contexto | Texto (mensagens de erro internas) |
|---|---|---|
| enqueueNotification (throw) | Usuário não autenticado | Usuário não autenticado para envio de WhatsApp. |
| enqueueNotification (throw) | Resposta não-ok da API | Falha ao enviar mensagem pelo WhatsApp. |
| sendMockMessage | Telefone ausente | Telefone não disponível para envio |
| sendMockMessage | Falha no disparo | Falha no disparo do template |
| sendMockMessage | Erro inesperado | Erro inesperado no envio de simulação |

_Nota: o conteúdo textual das mensagens de WhatsApp voltadas ao usuário é definido pelos templates no backend/provedor, não no código-fonte do app._

### AuthEmailService

Serviço de e-mails de autenticação (verificação e recuperação de senha). Envia requisições ao endpoint `send-auth-email`; o conteúdo dos e-mails é montado no backend (não hardcoded no app). Tipos: `verification`, `password_reset` (com redirect opcional `ativar`/`assinatura`).

---

## Observações finais

- **`[BACKEND]`**: valores vindos de Firestore/repositórios/motors. Notavelmente, toda a copy da `PresellFocao` é sobrescrevível via `PresellConfigRepository`; relatórios podem receber "Acompanhamento/Orientação da equipe Focão" (adminReport) e "Resumo inteligente" (smartReading) do backend.
- **Typos preservados verbatim no código:** em `Ativar.tsx` faltam acentos ("Comecar jornada", "Login necessario", "Ativacao pendente", "recuperacao", "ativacao"); em `PoliticaPrivacidade` Seção 6 usa "activa" (PT-PT).
- **Divergências de capitalização** entre `options` e mapas em `AdminNotificacoes` ("Treino do dia" vs "Treino do Dia"; "Chat / Suporte" vs "Chat/Suporte").
- Arquivos sem copy de UI hardcoded relevante: `Badge`, `SelectCard`, `Button` (via props/children), `EbookLanding`, `BrandLogo`, `Reveal` (wrappers).

