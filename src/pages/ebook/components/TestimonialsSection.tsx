import { Star } from "lucide-react";
import { Reveal } from "./Reveal";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const testimonials = [
  {
    name: "Ana Paula M.",
    dog: "Tutora do Thor, 3 anos",
    text: "Eu achava que ele era teimoso por natureza. Depois que entendi a questão da rotina, em duas semanas ele já estava muito mais calmo.",
  },
  {
    name: "Rodrigo F.",
    dog: "Tutor da Luna, 2 anos",
    text: "A destruição em casa parou quase que imediatamente quando comecei a estruturar melhor os horários de energia dela.",
  },
  {
    name: "Camila S.",
    dog: "Tutora do Bento, 5 anos",
    text: "Nunca tinha pensado que a ansiedade dele tinha tudo a ver com a falta de previsibilidade no dia a dia. Mudou tudo.",
  },
];

export function TestimonialsSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, margin: "-60px 0px" });

  return (
    <section
      style={{ backgroundColor: "#F7F5EF" }}
      className="py-24 px-6 md:px-16 lg:px-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-4">
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
              O que dizem os tutores
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                color: "#1E1E1E",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                lineHeight: 1.2,
                fontWeight: 500,
                maxWidth: "480px",
              }}
            >
              Mudanças reais quando a rotina entra em cena
            </h2>
          </Reveal>
        </div>

        <motion.div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
              }}
              style={{
                backgroundColor: "#F7F5EF",
                border: "1px solid #E7E3DA",
                borderRadius: "16px",
                padding: "28px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", gap: "3px" }}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={13} style={{ color: "#055A43", fill: "#055A43" }} />
                ))}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "#1E1E1E",
                  fontSize: "0.98rem",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  fontWeight: 400,
                  flexGrow: 1,
                }}
              >
                "{t.text}"
              </p>
              <div
                style={{
                  paddingTop: "16px",
                  borderTop: "1px solid #E7E3DA",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#1E1E1E",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#AAA",
                    fontSize: "0.75rem",
                    fontWeight: 300,
                  }}
                >
                  {t.dog}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

