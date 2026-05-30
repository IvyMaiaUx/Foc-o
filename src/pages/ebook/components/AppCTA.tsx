import { ArrowRight, Smartphone } from "lucide-react";
import { Reveal } from "./Reveal";

export function AppCTA() {
  return (
    <section
      style={{ backgroundColor: "#FAFAFA" }}
      className="py-24 px-6 md:px-16 lg:px-24"
    >
      <Reveal>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            backgroundColor: "#1E1E1E",
            borderRadius: "24px",
            padding: "clamp(40px, 6vw, 72px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              backgroundColor: "rgba(5,90,67,0.15)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              right: "120px",
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              backgroundColor: "rgba(5,90,67,0.08)",
              pointerEvents: "none",
            }}
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 max-w-lg">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#055A43",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Smartphone size={16} style={{ color: "#FAFAFA" }} />
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  App Focão
                </span>
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "#FAFAFA",
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  lineHeight: 1.2,
                  fontWeight: 500,
                }}
              >
                Depois de entender, o próximo passo é aplicar com consistência
              </h2>

              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "0.95rem",
                  lineHeight: 1.8,
                  fontWeight: 300,
                }}
              >
                O app Focão ajuda você a acompanhar rotina, energia, alimentação e comportamento em um só lugar - transformando observação em ação consistente, todos os dias.
              </p>
            </div>

            <div className="flex-shrink-0">
              <a
                href="/register"
                style={{
                  backgroundColor: "#055A43",
                  color: "#FAFAFA",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  padding: "16px 28px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#066e52")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#055A43")}
              >
                Quero conhecer o app Focão
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

