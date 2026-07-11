# Roteiro de teste com tutores reais — App Focão

> Para consultar no celular, durante o teste, com o tutor na sua frente.
> Objetivo: descobrir onde a experiência trava e **se as pessoas voltam sozinhas** — antes de investir em mais features.

---

## ⭐ Regra de ouro: fique calado

Você observa, não ensina. **Qualquer explicação sua contamina o teste.** Se o tutor travar, aguente o silêncio (conte até 10 mentalmente) e só então pergunte "o que você está pensando agora?". Anote o travamento — ele é o achado, não um problema a resolver na hora.

---

## 1. Quem recrutar (3–5 tutores)

Poucos e diversos vale mais que muitos iguais. Busque variedade no **cão**, porque a jornada muda completamente por perfil:

- [ ] 1 tutor de **filhote** (destruição, xixi, energia)
- [ ] 1 tutor de **cão adulto com problema claro** (puxa na guia, late, reativo)
- [ ] 1 tutor de **cão idoso / calmo** (rotina, saúde)
- [ ] 1–2 **livres** (o que aparecer)
- [ ] **Pelo menos 1 iPhone e 1 Android** — o Focão é PWA e a instalação muda por plataforma ("Adicionar à Tela de Início" no iPhone vs. banner do Chrome no Android). É ponto clássico de abandono que só aparece testando nos dois.

Evite amigos que vão te poupar. Quanto menos te devem, melhor o feedback.

> **⏳ Ritmo:** não faça os 5 no mesmo dia. Comece com **1–2 tutores**, digira os achados, depois os próximos — o tutor 1 afia seu olhar para o tutor 2. Se um problema grave aparecer logo nos primeiros, dá para corrigir **antes** dos demais e validar a correção no mesmo estudo.

---

## 2. Ficha do participante (preencher antes de começar)

Num app assim, o "usuário" é a **dupla tutor+cão**. Sem o perfil do cão, você não consegue interpretar os padrões depois.

> 🔒 **Diga isto ao participante antes de começar:** *"Vou observar seu uso e olhar os seus registros no sistema durante a semana de teste, tá bem?"* Transparência simples — evita saia-justa e é o espírito da LGPD que o próprio app leva a sério.

| Campo | Anotação |
|---|---|
| Nome do tutor | |
| Nome / idade do cão | |
| Porte e energia | |
| Principal queixa de comportamento | |
| Já usou app de treino antes? | |
| Aparelho (iPhone/Android + modelo) | |

---

## 3. Dia 1 — Teste assistido (15–20 min)

### 🎯 A tarefa de ouro: onboarding sozinho, sem contexto
Entregue **só o link** e uma frase:
> "É um app para treinar seu cão. Pode usar como quiser."

**Nada além disso.** Nem "clique aqui", nem "primeiro faça X". Observe **calado** do primeiro toque até **o primeiro treino concluído**. É aqui que ~80% dos problemas aparecem.

### 👀 O que observar (marque onde travar)
- [ ] Entende que precisa criar conta / fazer onboarding?
- [ ] O onboarding faz sentido? Alguma pergunta gera dúvida/hesitação?
- [ ] Chega na Home e entende **o que fazer primeiro**?
- [ ] Acha o "treino do dia" sozinho?
- [ ] Conclui o primeiro treino sem ajuda?
- [ ] Entende o check-in? Faz espontaneamente?
- [ ] Onde os dedos hesitam? O que ele **ignora** na tela?
- [ ] Expressões: franziu a testa, suspirou, "hã?", releu algo.

### 🚫 O que NÃO fazer
- Não conduzir ("agora vá em…"). Não justificar decisões de design. Não defender o app. Não sorrir de aprovação/reprovação — cara neutra.
- **Bug não se conserta ao vivo:** se aparecer um bug, **anote e siga**. Sacar o notebook para corrigir na hora interrompe o teste e vira sessão de suporte técnico.

---

## 4. Semana de uso natural (sem cutucar)

Depois do Dia 1: **uma semana de uso livre, sem nenhum lembrete seu.** Não mande mensagem, não pergunte "usou hoje?". 

### 👑 A métrica-rainha
> **Quem volta no dia 2 (e nos seguintes) sem ser cutucado?**

Isso vale mais que qualquer feedback verbal. Se ninguém voltar sozinho, esse é o achado mais importante do estudo inteiro — e nenhum elogio educado muda isso. Anote, por tutor, **em quais dias ele abriu o app** (dá pra cruzar depois com os check-ins reais no banco).

---

## 5. Entrevista de fim de semana (comportamento, não opinião)

Pergunte sobre **o que a pessoa fez**, não o que ela **achou**. Opinião rende elogio educado; comportamento rende ouro.

### Perguntas que rendem
- "Me conta a **última vez** que você abriu o app — o que te fez abrir?"
- "Teve algum dia que você pensou em abrir e não abriu? O que aconteceu?"
- "O que você lembra de ter feito no app esta semana?" (veja o que ele **não** lembra)
- "Se o app sumisse amanhã, você sentiria falta de quê?"

### 💣 A pergunta matadora
> "Você pagaria **R$ 47/mês** por isso? Por quê não?"

Observe a **reação facial** antes da resposta — ela vale mais que as palavras. O "por quê não" é onde mora a verdade.

### 🚫 Perguntas a evitar (geram resposta gentil e inútil)
- "O que você achou do app?"
- "Você gostou da tela de X?"
- "Você usaria isso?" (todo mundo diz que sim)
- "Ficou bonito?" / qualquer pergunta que sugira a resposta desejada.

---

## 6. Como registrar → virar backlog

Depois de cada tutor, preencha (não confie na memória):

| Achado | Onde (tela/momento) | Gravidade (1-3) | Perfil do cão | Padrão? |
|---|---|---|---|---|

- **Gravidade 3** = travou / desistiu / não entendeu o essencial.
- **Padrão?** = apareceu em ≥2 tutores? Aí vira prioridade real (1 tutor pode ser exceção; 2+ é sinal).
- No fim: ordene por (gravidade × recorrência). **Isso** define o próximo backlog — não uma lista de features pré-concebida.

---

## ✅ Checklist rápido (tenha na mão)

1. [ ] Ficha tutor+cão preenchida
2. [ ] Entreguei só o link + 1 frase
3. [ ] Fiquei **calado** até o 1º treino concluído
4. [ ] Anotei cada travamento + expressão
5. [ ] Combinei 1 semana de uso livre, sem cutucar
6. [ ] Registrei em quais dias ele voltou sozinho
7. [ ] Entrevista comportamental + pergunta dos R$ 47
8. [ ] Achados na tabela → ordenados por gravidade × recorrência

> Sua parte que não dá para delegar: **recrutar os tutores.** O resto o roteiro cobre. 🐶
