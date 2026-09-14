import { useRef, useState, type CSSProperties, type FormEvent, type RefObject } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { LeadCaptureError, LeadRepository } from "../../../repositories/LeadRepository";
import { sendFimDaCulpaEmail } from "../../../services/LeadMagnetEmailService";
import { LEGAL_URLS } from "../../../config/legal";

interface LeadFormProps {
  formRef?: RefObject<HTMLDivElement | null>;
  contentName?: string;
  /**
   * Material entregue por e-mail logo depois da captura. Hoje só o Fim da Culpa tem
   * endpoint de entrega (`/api/send-lead-magnet`); sem isto o formulário só registra o lead.
   */
  delivery?: "fim_da_culpa";
  /** Quando false, o bloco não desenha título próprio (a página já apresenta o material). */
  showHeading?: boolean;
}

type Status = "idle" | "saving" | "sending" | "done" | "error";
type FieldErrors = { name?: string; email?: string; consent?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, consent: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim().length < 2) errors.name = "Diga como podemos te chamar (mínimo 2 letras).";
  if (!EMAIL_RE.test(email.trim())) errors.email = "Confira o e-mail: ele precisa estar completo, como nome@email.com.";
  if (!consent) errors.consent = "Precisamos do seu aceite para mandar o material por e-mail.";
  return errors;
}

function captureMessage(err: unknown): string {
  const reason = err instanceof LeadCaptureError ? err.reason : "unavailable";
  if (reason === "invalid") return "Confira seu nome e e-mail e tente de novo.";
  if (reason === "rate_limited") return "Recebemos muitos pedidos desta conexão. Espere alguns minutos e tente de novo.";
  return "Não conseguimos registrar seu pedido agora. Verifique sua internet e tente de novo.";
}

export function LeadForm({ formRef, contentName = "ebook_comportamento_e_rotina", delivery, showHeading = true }: LeadFormProps) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(false);
  // Trava contra duplo clique/Enter repetido: o estado do React só muda no próximo render.
  const inFlight = useRef(false);
  // E-mail cujo lead já foi gravado. Se a entrega falhar, tentar de novo reenvia só o
  // e-mail — sem criar um segundo lead para a mesma pessoa.
  const savedFor = useRef<string | null>(null);

  const busy = status === "saving" || status === "sending";
  const sentTo = form.email.trim().toLowerCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;

    const errors = validate(form.name, form.email, consent);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStatus("idle");
      setError("");
      return;
    }

    inFlight.current = true;
    setError("");
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    try {
      if (savedFor.current !== email) {
        setStatus("saving");
        try {
          await LeadRepository.createMarketingLead({ name, email, emailPermission: consent });
        } catch (err) {
          setError(captureMessage(err));
          setStatus("error");
          return;
        }
        savedFor.current = email;
        const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
        fbq?.("track", "Lead", { content_name: contentName, content_category: "ebook_free" });
      }

      if (delivery === "fim_da_culpa") {
        setStatus("sending");
        try {
          const result = await sendFimDaCulpaEmail({ name, email, consent: true });
          setCooldown(result.status === "cooldown");
        } catch {
          setError("Seu pedido ficou registrado, mas o e-mail com o e-book não saiu. Toque em enviar para tentar de novo.");
          setStatus("error");
          return;
        }
      }

      setStatus("done");
    } finally {
      inFlight.current = false;
    }
  };

  const inputStyle = (invalid: boolean): CSSProperties => ({
    width: "100%",
    padding: "14px 16px",
    border: `1px solid ${invalid ? "#B23A48" : "#D9D3C7"}`,
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    fontFamily: "var(--font-sans)",
    fontSize: "1rem", // 16px: abaixo disso o iOS dá zoom ao focar o campo
    fontWeight: 400,
    color: "#1E1E1E",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  });

  const labelStyle: CSSProperties = {
    fontFamily: "var(--font-sans)",
    color: "#3F4A42",
    fontSize: "0.85rem",
    fontWeight: 500,
  };

  const fieldErrorStyle: CSSProperties = {
    fontFamily: "var(--font-sans)",
    color: "#B23A48",
    fontSize: "0.8rem",
    lineHeight: 1.45,
  };

  const focusOn = (e: { currentTarget: HTMLInputElement }) => {
    e.currentTarget.style.borderColor = "#055A43";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5,90,67,0.12)";
  };
  const focusOff = (invalid: boolean) => (e: { currentTarget: HTMLInputElement }) => {
    e.currentTarget.style.borderColor = invalid ? "#B23A48" : "#D9D3C7";
    e.currentTarget.style.boxShadow = "none";
  };

  const card: CSSProperties = {
    backgroundColor: "#FFFDF8",
    border: "1px solid #E7E3DA",
    borderRadius: "20px",
    padding: "clamp(24px, 5vw, 36px)",
    boxShadow: "0 12px 40px rgba(30,30,30,0.06)",
  };

  if (status === "done") {
    return (
      <div ref={formRef} style={{ ...card, backgroundColor: "#EAF4EF", borderColor: "rgba(5,90,67,0.2)" }} role="status" aria-live="polite">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "14px" }}>
          <CheckCircle2 size={36} style={{ color: "#055A43" }} aria-hidden="true" />
          <h3 style={{ fontFamily: "var(--font-serif)", color: "#1E1E1E", fontSize: "1.45rem", fontWeight: 500, lineHeight: 1.2 }}>
            {delivery ? (cooldown ? "Esse e-book já está a caminho" : "Pronto! O e-book está a caminho") : "Pedido recebido"}
          </h3>
          <p style={{ fontFamily: "var(--font-sans)", color: "#3F4A42", fontSize: "0.98rem", lineHeight: 1.65 }}>
            {delivery ? (
              cooldown ? (
                <>Já mandamos o link para <strong>{sentTo}</strong> há poucos minutos. Procure pela mensagem do Focão antes de pedir de novo.</>
              ) : (
                <>Enviamos o link do guia para <strong>{sentTo}</strong>. Costuma chegar em poucos minutos.</>
              )
            ) : (
              <>Seu pedido ficou registrado para <strong>{sentTo}</strong>.</>
            )}
          </p>
          {delivery && (
            <ul style={{ fontFamily: "var(--font-sans)", color: "#55615A", fontSize: "0.88rem", lineHeight: 1.6, paddingLeft: "18px", listStyle: "disc" }}>
              <li>Assunto: “Seu e-book gratuito está aqui — Guia: O Fim da Culpa”.</li>
              <li>Não achou? Olhe as abas Promoções e Spam.</li>
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} style={{ scrollMarginTop: "88px" }}>
      <form onSubmit={handleSubmit} noValidate style={{ ...card, display: "flex", flexDirection: "column", gap: "18px" }} aria-busy={busy}>
        {showHeading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", color: "#1E1E1E", fontSize: "clamp(1.35rem, 3vw, 1.6rem)", lineHeight: 1.2, fontWeight: 500 }}>
              Receba o e-book grátis
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", color: "#55615A", fontSize: "0.92rem", lineHeight: 1.6, display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <Mail size={16} style={{ color: "#055A43", marginTop: "3px", flexShrink: 0 }} aria-hidden="true" />
              Mandamos o link para o seu e-mail. Sem cadastro e sem cartão.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="lead-name" style={labelStyle}>Como podemos te chamar?</label>
          <input
            id="lead-name"
            type="text"
            autoComplete="given-name"
            placeholder="Seu nome"
            value={form.name}
            maxLength={80}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
            }}
            style={inputStyle(Boolean(fieldErrors.name))}
            onFocus={focusOn}
            onBlur={focusOff(Boolean(fieldErrors.name))}
          />
          {fieldErrors.name && <p id="lead-name-error" style={fieldErrorStyle}>{fieldErrors.name}</p>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="lead-email" style={labelStyle}>Seu melhor e-mail</label>
          <input
            id="lead-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nome@email.com"
            value={form.email}
            maxLength={120}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "lead-email-error" : undefined}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
            }}
            style={inputStyle(Boolean(fieldErrors.email))}
            onFocus={focusOn}
            onBlur={focusOff(Boolean(fieldErrors.email))}
          />
          {fieldErrors.email && <p id="lead-email-error" style={fieldErrorStyle}>{fieldErrors.email}</p>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: busy ? "default" : "pointer" }}>
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.consent)}
              aria-describedby={fieldErrors.consent ? "lead-consent-error" : undefined}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (fieldErrors.consent) setFieldErrors({ ...fieldErrors, consent: undefined });
              }}
              style={{ marginTop: "3px", width: "18px", height: "18px", flexShrink: 0, accentColor: "#055A43" }}
            />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", lineHeight: 1.5, color: "#55615A" }}>
              Quero receber o material por e-mail e li a{" "}
              <a href={LEGAL_URLS.privacidade} target="_blank" rel="noopener noreferrer" style={{ color: "#055A43", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                Política de Privacidade
              </a>
              .
            </span>
          </label>
          {fieldErrors.consent && <p id="lead-consent-error" style={fieldErrorStyle}>{fieldErrors.consent}</p>}
        </div>

        {error && (
          <p role="alert" style={{ ...fieldErrorStyle, fontSize: "0.88rem", fontWeight: 500, backgroundColor: "#FBEDEE", borderRadius: "10px", padding: "10px 12px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            backgroundColor: busy ? "#2E6F5A" : "#055A43",
            color: "#F7F5EF",
            fontFamily: "var(--font-sans)",
            fontSize: "1rem",
            fontWeight: 500,
            minHeight: "52px",
            padding: "14px 28px",
            borderRadius: "50px",
            border: "none",
            cursor: busy ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!busy) e.currentTarget.style.backgroundColor = "#044835";
          }}
          onMouseLeave={(e) => {
            if (!busy) e.currentTarget.style.backgroundColor = "#055A43";
          }}
        >
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              {status === "sending" ? "Enviando o e-book…" : "Registrando…"}
            </>
          ) : (
            <>
              {delivery ? "Receber o e-book grátis" : "Receber e-book agora"}
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>

        <p style={{ fontFamily: "var(--font-sans)", color: "#6B7A6E", fontSize: "0.8rem", textAlign: "center", lineHeight: 1.55 }}>
          Todo e-mail do Focão tem link para sair da lista.
        </p>
      </form>
    </div>
  );
}
