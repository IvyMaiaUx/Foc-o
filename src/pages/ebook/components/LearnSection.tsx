import { Brain, Zap, Volume2, BarChart2 } from "lucide-react";
import { Reveal } from "./Reveal";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const cards = [
  {
    icon: Brain,
    title: "Previsibilidade reduz ansiedade",
    description:
      "Cães que sabem o que esperar do dia apresentam menor nível de cortisol e comportamentos mais equilibrados.",
  },
  {
    icon: Zap,
    title: "Energia sem canal vira destruição",
    description:
      "Quando a energia não encontra saída adequada, ela encontra a sua própria - e raramente é onde você queria.",
  },
  {
    icon: Volume2,
    title: "Corrigir sem estrutura gera ruído",
    description:
      "Sem consistência, comandos e correções viram ruído. O cão não aprende - ele só reage.",
  },
  {
    icon: BarChart2,
    title: "Acompanhar padrões muda decisões",
    description:
      "Observar o comportamento ao longo do tempo revela gatilhos que passariam despercebidos no dia a dia.",
  },
];

export function LearnSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-60px 0px" });

  return (
    <section
      style={{ backgroundColor: "#F7F5EF" }}
      className="py-24 px-6 md:px-16 lg:px-24"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 flex flex-col gap-4">
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
              O que você vai aprender
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
                maxWidth: "520px",
              }}
            >
              Quatro pilares que transformam a relação com seu cão
            </h2>
          </Reveal>
        </div>

        <motion.div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate={gridInView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 28 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
                }}
                style={{
                  backgroundColor: "#F7F5EF",
                  border: "1px solid #E7E3DA",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "0 8px 32px rgba(5,90,67,0.1)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: "#DDEFE7",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} style={{ color: "#055A43" }} />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "#1E1E1E",
                    fontSize: "1.05rem",
                    lineHeight: 1.3,
                    fontWeight: 500,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#777",
                    fontSize: "0.88rem",
                    lineHeight: 1.7,
                    fontWeight: 300,
                  }}
                >
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

