/* Texto do documento legal. Editar aqui; os marcadores vem de src/config/legal.ts. */
export const TERMOS = `# TERMOS DE USO — FOCÃO

**Última atualização:** {{atualizadoEm}} · **Versão:** {{versaoTermos}}

---

## 1. Quem somos

O **Focão** (focaoapp.com.br) é operado por **{{razaoSocial}}**, CNPJ **{{cnpj}}**, com sede em **{{endereco}}**.

Contato: **{{emailContato}}**

## 2. Aceitação

Ao criar uma conta, iniciar o período de teste, assinar, adquirir um e-book ou usar o Focão de qualquer forma, você declara que leu e concorda com estes Termos e com a [Política de Privacidade](https://focaoapp.com.br/privacidade).

O aceite é registrado no momento do cadastro, com data, hora e versão dos documentos vigentes.

Se não concorda, não utilize a plataforma.

## 3. O que é o Focão

O Focão é um **aplicativo web progressivo (PWA)** de educação e organização do treino comportamental de cães. A partir de um perfil do animal montado no onboarding, a plataforma gera um plano progressivo em blocos, indica o treino do dia, registra o check-in diário e acompanha a evolução.

**Recursos disponíveis:** plano de treino adaptativo, treino diário, escolha de treinos, check-in, evolução, histórico, relatórios, biblioteca de exercícios, registros de nutrição, registros de vacinação, agenda, módulo SOS, notificações, indicação e gestão da assinatura.

A composição dos recursos pode variar conforme o plano contratado e evoluir ao longo do tempo.

## 4. O que o Focão NÃO é

O Focão oferece **orientação educacional e progressiva** sobre comportamento e rotina canina, baseada em princípios de reforço positivo. Ele **não é e não substitui**:

- consulta, diagnóstico, prescrição ou tratamento **médico-veterinário**;
- avaliação presencial por **adestrador ou veterinário comportamentalista**;
- atendimento **de urgência ou emergência**.

Não prometemos resultado garantido, cura de comportamento nem prazo determinado de melhora.

**Casos que exigem profissional:** agressividade consistente, mordidas, automutilação, fobias severas, mudança brusca de comportamento ou quadros que não evoluem com constância devem ser acompanhados por médico-veterinário ou adestrador qualificado. O uso do app não deve atrasar essa busca.

As decisões sobre treino, saúde e manejo do seu cão são de **sua exclusiva responsabilidade**, inclusive quanto à segurança de pessoas e de outros animais.

## 5. Módulos de registro e o módulo SOS

### 5.1 Nutrição, vacinas e agenda
São **ferramentas de anotação e organização pessoal**. Os dados são inseridos por você e refletem apenas o que você registrou. Não constituem carteira de vacinação válida, prontuário clínico, prescrição nutricional nem documento oficial de qualquer natureza.

Conferir a exatidão desses registros e cumprir prazos de vacinação e vermifugação é responsabilidade sua, junto ao seu médico-veterinário.

### 5.2 Módulo SOS
O SOS é um recurso de **orientação e direcionamento rápido** em situações de urgência. Ele **não presta atendimento veterinário, não realiza diagnóstico à distância e não aciona automaticamente serviços de emergência**.

Em qualquer situação de risco à vida ou à saúde do seu cão, **procure imediatamente um médico-veterinário ou hospital veterinário**. O uso do SOS não deve atrasar essa busca.

Não nos responsabilizamos por decisões tomadas com base no conteúdo do SOS nem por sua indisponibilidade momentânea por falha de conexão, do dispositivo ou da plataforma.

## 6. Cadastro e conta

Para usar o Focão você precisa ter **18 anos ou mais**, capacidade civil plena, e fornecer informações verdadeiras e atualizadas.

A conta é **pessoal e intransferível**. Você é responsável por manter a senha em sigilo e por tudo que ocorrer na sua conta. Em caso de uso não autorizado, avise em {{emailContato}}.

## 7. Período de teste de 7 dias

- O Focão oferece **7 (sete) dias corridos de acesso sem custo**.
- Para ativar o teste é necessário **cadastrar um cartão de crédito**.
- **Nenhuma cobrança é feita durante os 7 dias.**
- Não havendo cancelamento até o fim do 7º dia, a assinatura é ativada automaticamente e a primeira cobrança de **R$ 67,00** ocorre no **8º dia**.
- Enviaremos **lembrete por e-mail antes do fim do teste**, informando data e valor da primeira cobrança.
- O cancelamento durante o teste pode ser feito a qualquer momento pelo app, sem qualquer cobrança.
- O teste é limitado a **um por pessoa e por cartão**. Criar contas múltiplas para repeti-lo é violação destes Termos.

## 8. Assinatura, preço e renovação

**Plano:** Assinatura Focão — **R$ 67,00 por mês**, após o período de teste.

**Renovação automática:** renovada mensalmente no cartão cadastrado, até que você cancele.

**Processamento:** os pagamentos da assinatura são processados pela **Stripe**. O Focão **não armazena** os dados completos do seu cartão — recebemos apenas status da transação, últimos dígitos e bandeira.

**Falha na cobrança:** novas tentativas poderão ser feitas por até **{{prazoTentativasCobranca}}**. Persistindo a falha, o acesso aos recursos pagos será suspenso.

**Alteração de preço:** reajustes serão comunicados com **antecedência mínima de 30 dias**, válidos apenas para ciclos seguintes. Discordando, você pode cancelar antes da próxima renovação, sem multa.

## 9. Direito de arrependimento

Nos termos do **art. 49 do Código de Defesa do Consumidor**, você pode desistir da contratação em até **7 (sete) dias corridos**, com devolução integral do valor pago.

Para maior clareza, o Focão adota como marco inicial desse prazo a **data da primeira cobrança efetiva** — você tem os 7 dias de teste gratuito **e mais** 7 dias de arrependimento após o primeiro pagamento.

## 10. Reembolso

Pedidos de reembolso são feitos pelo app, em \`Perfil → Assinatura\`.

- O pedido é feito **por cobrança específica**: você localiza a cobrança no histórico da sua assinatura e solicita o reembolso daquele valor, e não da assinatura como um todo.
- A solicitação gera um **número de protocolo**, exibido na tela e enviado por e-mail.
- Você pode acompanhar o andamento pelo protocolo dentro do app, a qualquer momento.
- Analisaremos e responderemos em até **{{prazoAnaliseReembolso}}**.
- Aprovado, o estorno é processado no **mesmo meio de pagamento**, em até **{{prazoEstorno}}** a partir da aprovação.
- O valor pode levar **1 a 2 faturas** para aparecer no extrato do cartão — prazo definido pela operadora, fora do nosso controle.
- Reembolsos enquadrados no item 9 (arrependimento) são **integrais e automáticos**, sem análise de mérito.

Após o reembolso integral, o acesso aos recursos pagos é encerrado.

## 11. Cancelamento

### 11.1 Como cancelar
O cancelamento é feito **diretamente pelo aplicativo**, em \`Perfil → Assinatura\`, sem necessidade de contato com atendimento — conforme o **Decreto nº 11.034/2022**, que garante o cancelamento pelo mesmo meio da contratação.

### 11.2 Solicitação e efetivação
A solicitação é registrada imediatamente, com confirmação na tela e por e-mail. O **status da assinatura é atualizado** no seu perfil, junto com a data em que o acesso termina.

### 11.3 Efeitos
- A **cobrança recorrente é interrompida** — não haverá novas cobranças.
- Cancelamento **durante o teste**: acesso encerrado ao fim do 7º dia, sem qualquer cobrança.
- Cancelamento **com assinatura ativa**: acesso mantido **até o fim do período já pago**.
- **Não há reembolso proporcional** de ciclos já iniciados, salvo nos casos dos itens 9 e 10 ou por determinação legal.

### 11.4 Excluir a conta
Cancelar a assinatura **não exclui** sua conta nem seus dados. Para excluir, use \`Perfil → Excluir conta\`. A exclusão é definitiva e apaga o histórico de treinos, registros e o perfil do seu cão. Ver item 8 da Política de Privacidade sobre prazos de retenção legal.

## 12. E-books e materiais complementares

Os e-books são vendidos separadamente da assinatura, com checkout processado pela **Kirvano**. {{kirvanoPapel}}

O conteúdo é licenciado para **uso pessoal e não comercial**. É proibido copiar, revender, compartilhar arquivos ou redistribuir por qualquer meio.

Por se tratar de conteúdo digital de acesso imediato, aplica-se o prazo de **7 dias** do art. 49 do CDC, contado da compra.

## 13. Programa "Indique e Ganhe"

O programa segue o regulamento disponível em {{urlRegulamentoIndique}}. Benefícios são liberados apenas após confirmação da assinatura do indicado e cumprimento das regras vigentes.

Autoindicação, contas múltiplas, indicações fraudulentas ou envio de spam anulam os benefícios e podem levar ao encerramento da conta.

Podemos alterar ou encerrar o programa a qualquer momento, preservando benefícios já validados.

## 14. Comunicações

Você pode receber:

- **E-mails transacionais** — cadastro, confirmação, recuperação de senha, fim do teste, cobrança, assinatura e reembolso. São essenciais ao serviço e não passíveis de descadastramento enquanto a conta existir.
- **Notificações push** — treino do dia, check-in, agenda e lembretes. Dependem de autorização no dispositivo e podem ser desativadas a qualquer momento em \`Perfil → Notificações\` ou nas configurações do sistema.
- **Mensagens por WhatsApp** — lembretes e avisos operacionais, **somente se você autorizar expressamente** o contato por esse canal. A autorização pode ser retirada a qualquer momento, respondendo à própria mensagem ou solicitando em {{emailContato}}.
- **E-mails de marketing** — mediante consentimento, com descadastramento em um clique.

A entrega de notificações e mensagens depende de sistema operacional, navegador, conexão e configurações do dispositivo, e **não é garantida**. Não confie exclusivamente nos lembretes do app para compromissos de saúde do seu cão.

## 15. Uso aceitável

Você concorda em **não**:

- copiar, revender, redistribuir ou disponibilizar o conteúdo fora da plataforma;
- fazer engenharia reversa, raspagem de dados (*scraping*), acesso automatizado ou tentativa de invasão;
- compartilhar credenciais de acesso;
- criar múltiplas contas para repetir o teste gratuito, burlar cobranças ou abusar do programa de indicação;
- inserir conteúdo ilícito, ofensivo ou que retrate maus-tratos a animais;
- usar a plataforma para fins fraudulentos ou que violem direitos de terceiros.

O descumprimento pode gerar **suspensão ou encerramento imediato** da conta, sem reembolso, sem prejuízo das medidas legais cabíveis.

## 16. Conteúdo que você insere

Os dados que você cadastra — perfil do cão, check-ins, registros de nutrição e vacinas, agenda, anotações e fotos — continuam sendo **seus**.

Você nos concede licença gratuita e não exclusiva para armazenar, processar e exibir esse conteúdo **exclusivamente para operar o serviço para você** e, de forma **anonimizada e agregada**, para melhorar o produto.

Você declara ter os direitos necessários sobre o que envia.

## 17. Propriedade intelectual

Marca, nome, logotipo, layout, código-fonte, textos, planos de treino, biblioteca de exercícios, e-books e demais conteúdos são de titularidade da {{razaoSocial}} ou de seus licenciadores, protegidos pelas Leis nº 9.279/1996, 9.610/1998 e 9.609/1998.

A assinatura concede **licença de uso pessoal, limitada, revogável e intransferível**, sem transferência de propriedade.

## 18. Disponibilidade e suporte

Trabalhamos para manter a plataforma disponível, mas não garantimos funcionamento ininterrupto ou livre de erros. Pode haver indisponibilidade por manutenção, atualização, falha de terceiros ou força maior.

Como PWA, algumas funções podem operar com dados em cache. Registros feitos offline são sincronizados quando a conexão retorna — **confira sempre se a informação foi salva**.

Suporte: **{{emailContato}}** e \`Perfil → Suporte\`, com resposta em até **{{prazoRespostaSuporte}}**, {{horarioAtendimento}}.

## 19. Limitação de responsabilidade

Na máxima extensão permitida pela legislação brasileira, o Focão não se responsabiliza por:

- decisões de manejo ou treino tomadas com base no conteúdo educacional da plataforma;
- danos causados pelo cão a pessoas, animais ou bens;
- agravamento de quadro comportamental ou de saúde do animal;
- exatidão dos registros de nutrição, vacinação e agenda inseridos por você;
- não recebimento ou atraso de notificações e mensagens;
- perda de dados por falha do dispositivo, do navegador ou exclusão feita pelo próprio usuário;
- falhas de serviços de terceiros (Stripe, Kirvano, Firebase, WhatsApp, provedores).

Nada nestes Termos afasta as garantias legais do Código de Defesa do Consumidor.

## 20. Suspensão e encerramento

Podemos suspender ou encerrar contas que violem estes Termos, com aviso quando possível. Em caso de fraude, ataque à plataforma ou ilegalidade, o encerramento pode ser imediato.

Você pode encerrar sua conta a qualquer momento (item 11.4).

## 21. Alterações destes Termos

Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail e/ou aviso no app com **{{prazoAvisoMudanca}}** de antecedência, e exigirão novo aceite quando alterarem preço, escopo do serviço ou regras de cobrança.

Versões anteriores ficam disponíveis mediante solicitação.

## 22. Disposições gerais

A invalidade de uma cláusula não afeta as demais. A tolerância quanto a um descumprimento não significa renúncia a direitos.

## 23. Lei aplicável e foro

Regidos pelas leis da República Federativa do Brasil. Fica eleito o **foro do domicílio do consumidor**, conforme o Código de Defesa do Consumidor.

---

**{{razaoSocial}} — CNPJ {{cnpj}}**
{{emailContato}} · focaoapp.com.br
`;
