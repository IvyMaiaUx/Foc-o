# api/

Funções serverless na Vercel. O front é outro deploy (Firebase Hosting, manual).

## Antes de criar um arquivo aqui, leia isto

**O plano Hobby publica no máximo 12 funções serverless, e esta pasta está no teto.**
Qualquer `.js` novo aqui que não comece com `_` vira a 13ª função e **derruba o deploy
inteiro** — não a função nova: o deploy todo.

A falha engana nos três lugares onde você olharia:

| Onde você olha | O que vê |
|---|---|
| Log de build | **Passa**, em ~10s, sem aviso nenhum |
| E-mail da Vercel | "Build error — project or build error" (não é build) |
| `vercel inspect --logs` | Termina em "Deploying outputs..." e `● Error`, sem motivo |

O motivo só aparece na API REST:

```bash
TOKEN=$(grep -oE '"token" *: *"[^"]+"' ~/AppData/Roaming/xdg.data/com.vercel.cli/auth.json \
  | sed 's/.*"token" *: *"//;s/"//')
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=ivymaiauxs-projects"
# errorCode: exceeded_serverless_functions_per_deployment
# errorStep: patchBuild
```

## O padrão para endpoint novo

Não crie arquivo em `api/`. Em vez disso:

1. Ponha a lógica em `api/_nome.js` — o prefixo `_` não vira função.
2. Despache de dentro de uma função existente por `?mode=`.
3. Preserve a rota pública com uma rewrite no `vercel.json`.

Já em uso: `/api/process-referral` e `/api/registrar-aceite` moram dentro de
`create-user-profile.js`; `/api/billing-charges`, `/api/refund-request` e
`/api/admin-refund` moram dentro de `customer-portal.js`.

Custo: cada dobra dessas é complexidade permanente num código que precisa ser auditável.
Se forem virando muitas, a conta a fazer é o plano Pro, não mais uma dobra.

## Conferir

`npm test` — `_limiteFuncoes.test.js` quebra se passar de 12. À mão:

```bash
ls api/*.js | grep -v "/_" | grep -v "\.test\.js" | wc -l
```

## Consolo

Deploy que morre assim **não é aliasado**: produção continua na versão anterior.
E o front não sobe junto, porque é `firebase deploy` manual. Você tem tempo de corrigir.
