import { useState, type CSSProperties, type FormEvent, type RefObject } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "./Reveal";
import { LeadRepository } from "../../../repositories/LeadRepository";

interface LeadFormProps {
  formRef: RefObject<HTMLDivElement | null>;
}

export function LeadForm({ formRef }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await LeadRepository.createMarketingLead(form);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Não foi possível enviar agora. Tente novamente em alguns instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    border: "1px solid #E7E3DA",
    borderRadius: "10px",
    backgroundColor: "#FAFAFA",
    fontFamily: "var(--font-sans)",
    fontSize: "0.95rem",
    fontWeight: 300,
    color: "#1E1E1E",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  return (
    <section
      style={{ backgroundColor: "#F9F9F8" }}
      className="py-24 px-6 md:px-16 lg:px-24"
    >
      <div ref={formRef} className="max-w-2xl mx-auto">
        <div className="text-center mb-12 flex flex-col gap-4">
          <Reveal>
            <span
              style={{
                color: "#055A43",
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Acesso gratuito
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                color: "#1E1E1E",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                lineHeight: 1.2,
                fontWeight: 500,
              }}
            >
              Baixe gratuitamente o e-book
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                color: "#888",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                fontWeight: 300,
              }}
            >
              Preencha os campos abaixo e receba o e-book por e-mail e WhatsApp.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.25}>
          {submitted ? (
            <div
              style={{
                backgroundColor: "#DDEFE7",
                border: "1px solid rgba(5,90,67,0.2)",
                borderRadius: "16px",
                padding: "48px 32px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <CheckCircle2 size={40} style={{ color: "#055A43" }} />
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "#1E1E1E",
                  fontSize: "1.4rem",
                  fontWeight: 500,
                }}
              >
                Pedido recebido!
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "#555",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                Seu pedido entrou no Focão. Vamos enviar o e-book por e-mail e WhatsApp.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: "#FAFAFA",
                border: "1px solid #E7E3DA",
                borderRadius: "20px",
                padding: "40px 36px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#555",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={form.name}
                  required
                  minLength={2}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#055A43")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E7E3DA")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#555",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  required
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#055A43")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E7E3DA")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#555",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  value={form.whatsapp}
                  required
                  maxLength={32}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#055A43")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E7E3DA")}
                />
              </div>

              {error && (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#B23A48",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: "8px",
                  backgroundColor: "#055A43",
                  color: "#FAFAFA",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  padding: "16px 32px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: submitting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "background-color 0.2s ease",
                  opacity: submitting ? 0.72 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.backgroundColor = "#044835";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#055A43")}
              >
                {submitting ? "Enviando..." : "Receber e-book agora"}
                <ArrowRight size={16} />
              </button>

              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "#AAA",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  fontWeight: 300,
                  lineHeight: 1.6,
                }}
              >
                Seus dados estão seguros. Sem spam, prometemos.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

