# Reembolsos

Fluxo: o usuário pede → um admin analisa no painel → **a aprovação chama a API da Stripe pelo
backend** → o webhook confirma e fecha a solicitação. O webhook nunca inicia reembolso.

```
Usuário solicita  →  requested
                        ↓ (admin)
                   under_review  ⇄  needs_information
                        ↓                     ↓
                    rejected              approved  →  (Stripe refunds.create)  →  processing
                                                                                       ↓ webhook
                                                                              refunded | failed
```

`refunded` só é gravado depois da confirmação da Stripe pelo webhook — aprovar no painel
leva a solicitação até `processing`, nunca direto para concluída.

## Onde fica o quê

| Camada | Arquivo |
| --- | --- |
| Regras de negócio, transições, protocolo, idempotência | `api/_refunds.js` |
| Endpoints (rewrites em `vercel.json`) | `api/customer-portal.js` |
| Confirmação da Stripe | `api/stripe-webhook.js` |
| Tela do usuário | `src/pages/SolicitarReembolso.tsx`, `src/pages/AcompanharReembolso.tsx` |
| Acesso do app à API | `src/repositories/RefundRepository.ts` |
| Painel | repo `focaoadm`: `src/pages/admin/AdminRefunds.tsx`, `AdminRefundDetail.tsx` |

Os endpoints moram todos dentro de `api/customer-portal.js` porque o plano Hobby da Vercel
permite no máximo **12 funções serverless** e o projeto já usa as 12. As rotas públicas são
rewrites (`vercel.json`), no mesmo padrão do `/api/process-referral`:

| Rota | Destino | Quem usa |
| --- | --- | --- |
| `POST /api/billing-charges` | `customer-portal?mode=charges` | app (histórico de cobranças) |
| `POST /api/refund-request` | `customer-portal?mode=refund-request` | app (`create`, `get`, `list`, `cancel`) |
| `POST /api/admin-refund` | `customer-portal?mode=admin-refund` | painel (`approve`, `reject`, `request_info`, `under_review`) |

`.vercelignore` mantém os `api/*.test.js` fora do deploy — sem isso cada teste viraria uma
função e estouraria o limite de 12.

## Dados (Firestore)

- `refundRequests/{protocolo}` — o id do documento **é** o protocolo (`FOC-AAAAMMDD-XXXXX`),
  o que garante unicidade sem contador e sem dado pessoal.
- `refundRequests/{protocolo}/events/{id}` — histórico de transições. Eventos vindos da Stripe
  usam id determinístico `stripe_{event.id}`: é essa a trava de idempotência do webhook.

Escrita é exclusiva do backend (Admin SDK). Nas regras, leitura é só para admin — a tela do
usuário recebe uma versão filtrada pela API (`toUserView`), sem e-mail do admin, id de
reembolso na Stripe, chave de idempotência ou mensagem técnica de erro.

## Variáveis de ambiente

Na Vercel (projeto do Foc-o), já existentes e usadas também pelo reembolso:

- `STRIPE_SECRET_KEY` — chamada de `refunds.create`.
- `STRIPE_WEBHOOK_SECRET` — validação da assinatura do webhook.
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Admin SDK.
- `FIRESTORE_DATABASE_ID` — banco nomeado do projeto.
- `RESEND_API_KEY` — e-mails de status.

No app (build do Vite):

- `VITE_PREMIUM_CLAIM_API_URL` — já existente; é dela que sai a base da API.
- `VITE_BILLING_CHARGES_API_URL` / `VITE_REFUND_REQUEST_API_URL` — opcionais, só se as rotas
  ficarem em um host diferente do resto da API.

No painel (`focaoadm`):

- `VITE_ADMIN_REFUND_API_URL` — padrão `https://foc-o.vercel.app/api/admin-refund`.

## Configuração na Stripe

No endpoint de webhook que já aponta para `/api/stripe-webhook`, habilite os eventos:

- `refund.created`
- `refund.updated`
- `refund.failed`
- `charge.refunded`
- `charge.refund.updated` (nome legado, mantido por segurança)

Sem esses eventos as solicitações ficam paradas em "Estorno em processamento": o reembolso
acontece na Stripe, mas o app não recebe a confirmação para marcar `refunded`.

## Permissões

- Solicitar/acompanhar/cancelar: usuário autenticado, e só sobre as próprias solicitações.
- Ver a fila, recusar, pedir informação: Admin.
- **Aprovar (mexe em dinheiro): Super Admin.** Conferido no backend por
  `resolveAdminActor`, que usa as custom claims do token e as listas de
  `adminSettings/auth` — nunca o que o front diz.

Como as regras do Firestore identificam admin por `request.auth.token.admin == true` (ou pelo
e-mail de bootstrap), quem estiver só em `adminSettings/auth` sem a custom claim continua sem
enxergar a coleção — mesma situação das telas de cancelamento e auditoria que já existiam.

## Política

Reembolso **integral** e janela de **7 dias** a partir da cobrança (art. 49 do CDC), em
`REFUND_WINDOW_DAYS`. O código já está pronto para parcial (basta passar `amount` no
`refunds.create`), mas o MVP não expõe isso.

Aprovar um reembolso **não** cancela a assinatura: cancelar a renovação continua sendo a ação
separada de `/api/cancel-subscription`.
