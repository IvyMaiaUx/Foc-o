import { Reveal } from "./Reveal";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const benefits = [
  { label: "Mais clareza no dia a dia", detail: "Você age com intenção, não no improviso." },
  { label: "Menos improviso", detail: "Rotina estruturada significa menos surpresas." },
  { label: "Mais segurança para agir", detail: "Saber o porquê dá confiança na resposta certa." },
  { label: "Mais equilíbrio na rotina", detail: "Seu cão e você ganham quando há previsibilidade." },
  { label: "Mais consciência sobre gatilhos", detail: "Identificar padrões antes de corrigir é o diferencial." },
];

export function BenefitsSection() {
  const listRef = useRef<HTMLDivElement>(null);
  const listInView = useInView(listRef, { once: true, margin: "-60px 0px" });

  return (
    <section
      style={{ backgroundColor: "#055A43" }}
      className="py-24 px-6 md:px-16 lg:px-24"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-6">
          <Reveal>
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Benefícios práticos
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                color: "#FAFAFA",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                lineHeight: 1.2,
                fontWeight: 500,
              }}
            >
              O que muda quando você entende o comportamento do seu cão
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                color: "rgba(255,255,255,0.65)",
                fontSize: "1rem",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Não é sobre adestramento perfeito. É sobre uma relação mais consciente, mais calma e mais humana com o seu cão.
            </p>
          </Reveal>
        </div>

        <motion.div
          ref={listRef}
          className="flex flex-col gap-4"
          initial="hidden"
          animate={listInView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              whileHover={{
                y: -3,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "rgba(255,255,255,0.18)",
              }}
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                transition: "box-shadow 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#DDEFE7",
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#FAFAFA",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {b.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.82rem",
                    fontWeight: 300,
                    lineHeight: 1.5,
                    marginTop: "2px",
                  }}
                >
                  {b.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

