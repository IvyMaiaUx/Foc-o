// Interruptores de recurso que o produto liga e desliga sem depender de deploy de backend.
// Ficam aqui, e não espalhados pelas telas, pra dar pra achar tudo que está pausado.

// Envio por WhatsApp está pausado: enquanto estiver false, o convite "Conectar WhatsApp"
// some da home. Voltar para true devolve o card, sem mais nenhuma alteração.
export const WHATSAPP_OPT_IN_ENABLED = false;
