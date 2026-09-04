/* GERADO por scripts/gerar-legal.mjs a partir de docs/legal/privacidade.md. Nao editar aqui. */
export const PRIVACIDADE = `# POLÍTICA DE PRIVACIDADE — FOCÃO

**Última atualização:** {{atualizadoEm}} · **Versão:** {{versaoPrivacidade}}
**Substitui a versão de 02/06/2025**

---

## 1. Introdução

Esta Política explica como o **Focão** (focaoapp.com.br) coleta, usa, compartilha e protege seus dados pessoais, conforme a **Lei nº 13.709/2018 (LGPD)** e o **Marco Civil da Internet (Lei nº 12.965/2014)**.

Aplica-se ao aplicativo (PWA), às páginas do site, aos e-books, às comunicações por e-mail, push e WhatsApp, e a todos os serviços do Focão.

## 2. Controlador e Encarregado

**Controlador:**
{{razaoSocial}} — CNPJ {{cnpj}}
{{endereco}}

**Encarregado pelo Tratamento de Dados (DPO):**
{{encarregada}} — **{{emailPrivacidade}}**
Prazo de resposta: até 15 dias.

## 3. Onde coletamos e o quê

| Ponto de coleta | Dados |
|---|---|
| **Formulário de e-book** | Nome, e-mail, telefone/WhatsApp |
| **Presell e quiz** | Nome do cão, e-mail, respostas do questionário |
| **Cadastro** | Nome, e-mail, senha (armazenada com *hash*) |
| **Onboarding do cão** (9 etapas) | Nome, raça, idade, porte, rotina da casa, cuidados de saúde, personalidade, comportamento, base de treino e objetivos |
| **Uso do app** | Check-ins, treinos, progresso, histórico, registros de nutrição e vacinação, agenda, uso do SOS |
| **Assinatura** | Status da transação, últimos dígitos e bandeira do cartão. Os dados completos são inseridos diretamente na Stripe e **não trafegam pelos nossos servidores** |
| **Reembolso** | Dados do pedido, motivo da solicitação, protocolo |
| **Indicação** | Identificador de quem indicou e de quem foi indicado |
| **Suporte** | Conteúdo das mensagens enviadas |
| **Navegação** | IP, registros de acesso, dispositivo, sistema operacional, navegador, páginas vistas, origem do clique (UTM, fbclid), rolagem e identificador de visitante |

> **Sobre os dados do cão:** informações sobre o animal não são dados pessoais de pessoa natural e, portanto, **não são "dados sensíveis"** no sentido do art. 5º, II da LGPD. Ainda assim, por estarem vinculadas à sua conta, recebem o mesmo nível de confidencialidade.

## 4. Finalidades e bases legais

| Finalidade | Base legal (LGPD) |
|---|---|
| Criar e manter a conta; gerar e executar o plano de treino | Execução de contrato (art. 7º, V) |
| Personalizar o plano conforme perfil e check-ins | Execução de contrato (art. 7º, V) |
| Gerenciar teste, assinatura, cobrança, reembolso e cancelamento | Execução de contrato (art. 7º, V) |
| Entregar e-books adquiridos | Execução de contrato (art. 7º, V) |
| E-mails transacionais (acesso, fim do teste, cobrança, reembolso) | Execução de contrato (art. 7º, V) |
| Operar o programa de indicação | Execução de contrato (art. 7º, V) |
| Envio de material rico e contato comercial (formulário de e-book) | Consentimento (art. 7º, I) |
| Notificações push | Consentimento (art. 7º, I) |
| Mensagens por WhatsApp | Consentimento (art. 7º, I) |
| Pixels de marketing, remarketing e mensuração de campanha | Consentimento (art. 7º, I) |
| Prevenir fraude e abuso do teste gratuito e da indicação | Legítimo interesse (art. 7º, IX) |
| Melhorar o produto, medir uso e corrigir erros | Legítimo interesse (art. 7º, IX) |
| Suporte ao usuário | Execução de contrato / legítimo interesse |
| Registros de acesso | Obrigação legal (art. 7º, II) |
| Dados fiscais e financeiros | Obrigação legal (art. 7º, II) |
| Exercício de direitos em processo | Art. 7º, VI |

**Não vendemos seus dados pessoais.**

## 5. Com quem compartilhamos

| Operador | Finalidade | Dados envolvidos | País |
|---|---|---|---|
| **Google Firebase** | Autenticação, banco de dados e hospedagem | Cadastro, perfil do cão, uso do app | EUA |
| **Stripe** | Pagamento e gestão da assinatura | Dados de cobrança e transação | EUA |
| **Kirvano** | Checkout dos e-books | Dados de compra do e-book | {{kirvanoPais}} |
| **Meta** | Meta Pixel — mensuração de campanhas | Eventos de navegação e conversão, coletados por cookies no seu navegador. **Não enviamos à Meta seu e-mail, telefone ou qualquer outro dado que identifique você** | EUA |
| **Supabase** | Armazenamento de eventos de navegação e conversão do rastreamento próprio | Identificador de visitante, origem, páginas vistas | {{supabaseRegiao}} |
| **WhatsApp (Meta)** | Envio de lembretes e avisos operacionais | Nome e telefone | EUA |

Esses parceiros atuam como **operadores**, obrigados contratualmente a tratar os dados apenas conforme nossas instruções.

Também podemos compartilhar dados: (i) por **ordem judicial** ou requisição de autoridade competente; (ii) em caso de **reorganização societária**, com aviso prévio.

## 6. Transferência internacional

Parte dos nossos operadores — incluindo Google, Stripe, Meta e Supabase — está sediada fora do Brasil. Essas transferências ocorrem com base no **art. 33 da LGPD**, mediante cláusulas contratuais padrão e garantias de proteção equivalentes às da legislação brasileira.

## 7. Cookies e armazenamento no navegador

O Focão usa cookies e armazenamento local. A lista completa, com finalidade e duração de cada chave, está na **[Política de Cookies](https://focaoapp.com.br/cookies)**.

Em resumo:

- **Essenciais** — sessão autenticada, registro do seu consentimento e funcionamento do PWA. Não podem ser desativados.
- **Marketing e mensuração** — Meta Pixel e rastreamento próprio. **Só são ativados após o seu aceite** no banner; nada é carregado antes disso.

Você pode alterar sua escolha a qualquer momento em **\`Perfil → Privacidade & LGPD → Preferências de cookies\`** ou pelo link **Preferências de cookies** no rodapé das páginas públicas.

## 8. Por quanto tempo guardamos

| Dado | Prazo |
|---|---|
| Conta, perfil do cão, treinos e registros | Enquanto a conta estiver ativa |
| Após exclusão da conta | Eliminação: **{{prazoEliminacao}}**, salvo exceções abaixo |
| Registros de acesso (IP, data/hora) | **6 meses** (art. 15, Marco Civil) |
| Dados fiscais e de pagamento | **5 anos** (legislação fiscal e art. 27 do CDC) |
| Registro de consentimento | **5 anos** após a revogação, como prova do aceite |
| Leads do formulário de e-book | **{{prazoLeads}}** sem interação, ou até pedido de exclusão |
| Dados para defesa em processo | Até o fim do prazo prescricional |
| Cópia de segurança (backup) | **14 dias**, em rodízio: a cópia mais antiga é apagada a cada nova |

Vencidos os prazos, os dados são **eliminados ou anonimizados**.

Sobre as cópias de segurança: quando você exclui a conta, os dados saem do sistema no prazo acima, mas **podem permanecer por até 14 dias nas cópias de segurança** já geradas, até que o rodízio as substitua. Essas cópias não são consultadas no dia a dia — servem apenas para restaurar o serviço em caso de perda de dados.

## 9. Segurança

Adotamos criptografia em trânsito (HTTPS/TLS), senhas armazenadas com *hash*, controle de acesso por perfil, regras de autorização no banco de dados, registro de atividades e revisão periódica de fornecedores.

Mantemos **cópia de segurança diária** do banco de dados, guardada fora do ambiente do aplicativo, em equipamento sob controle exclusivo da controladora e com acesso restrito a ela. A cópia existe para restaurar o serviço em caso de perda de dados.

Nenhum sistema é totalmente seguro. Havendo incidente com risco relevante, **comunicaremos você e a ANPD** nos prazos legais (art. 48 da LGPD).

## 10. Seus direitos (art. 18 da LGPD)

Você pode a qualquer momento:

- **Confirmar** a existência de tratamento e **acessar** seus dados
- **Corrigir** dados incompletos, inexatos ou desatualizados
- Pedir **anonimização, bloqueio ou eliminação** de dados desnecessários ou tratados em desconformidade
- Solicitar a **portabilidade**
- **Eliminar** dados tratados com base em consentimento
- Saber com quem **compartilhamos** seus dados
- Ser informado sobre a **possibilidade de não consentir** e suas consequências
- **Revogar o consentimento**, de forma tão simples quanto foi concedê-lo
- **Opor-se** a tratamento baseado em legítimo interesse
- Solicitar **revisão de decisões automatizadas**

### Como exercer

Diretamente no app, em **\`Perfil → Privacidade & LGPD\`**:

- **Portabilidade** — *Exportar Meus Dados*, com download imediato em formato JSON
- **Eliminação** — *Excluir Minha Conta*
- **Revogar consentimento de marketing** — *Preferências de cookies*

Também pelo link **Preferências de cookies** no rodapé das páginas públicas.

Para os demais direitos: **{{emailPrivacidade}}**

Respondemos em até **15 dias**. Podemos solicitar informações adicionais para confirmar sua identidade. Pedidos podem ser recusados quando houver obrigação legal de manter os dados — nesse caso, explicaremos o motivo.

## 11. Decisões automatizadas

O Focão usa regras automatizadas para montar e ajustar o plano de treino a partir do perfil do cão e dos seus check-ins. Essas sugestões são **educacionais**, não produzem efeitos jurídicos sobre você e podem ser revistas mediante solicitação ao encarregado.

## 12. Crianças e adolescentes

O Focão é destinado a **maiores de 18 anos** e não coleta intencionalmente dados de menores.

Identificado cadastro de menor sem o consentimento específico e em destaque de ao menos um dos pais ou responsável legal (art. 14 da LGPD), a conta será encerrada e os dados eliminados. Responsáveis podem nos avisar em {{emailPrivacidade}}.

## 13. Alterações desta Política

Podemos atualizar esta Política. Mudanças relevantes serão comunicadas por e-mail e/ou aviso no app com antecedência razoável. A data e a versão constam no topo, e versões anteriores ficam disponíveis mediante solicitação.

## 14. Contato e ANPD

**{{emailPrivacidade}}** — Encarregado: {{encarregada}}

Você também pode registrar reclamação na **Autoridade Nacional de Proteção de Dados (ANPD)**: www.gov.br/anpd

---

**{{razaoSocial}} — CNPJ {{cnpj}}**
focaoapp.com.br
`;
