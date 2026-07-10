import { CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { BrandLogo } from "./BrandLogo";

interface HeroSectionProps {
  onCtaClick: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section
      id="top"
      style={{ backgroundColor: "#F7F5EF" }}
      className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 py-24"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-8">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            style={{
              color: "#055A43",
              fontFamily: "var(--font-sans)",
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            E-book gratuito · Focão
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{
              fontFamily: "var(--font-serif)",
              color: "#1E1E1E",
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              lineHeight: 1.15,
              fontWeight: 500,
            }}
          >
            Entenda o que realmente influencia o comportamento do seu cão
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
            style={{
              fontFamily: "var(--font-sans)",
              color: "#555",
              fontSize: "1.05rem",
              lineHeight: 1.75,
              fontWeight: 300,
            }}
          >
            Baixe gratuitamente o e-book <em>Rotina &amp; Comportamento Canino</em> e descubra como rotina, previsibilidade e consistência impactam diretamente o bem-estar do seu cão.
          </motion.p>

          <motion.ul
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
            }}
          >
            {[
              "Entenda por que certos comportamentos se repetem",
              "Descubra como a rotina reduz ansiedade",
              "Aprenda a observar padrões antes de corrigir",
            ].map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3"
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
                }}
              >
                <CheckCircle size={18} style={{ color: "#055A43", marginTop: "3px", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "#1E1E1E",
                    fontSize: "0.95rem",
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  {item}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="flex flex-col gap-3 items-start"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.85 }}
          >
            <button
              onClick={onCtaClick}
              style={{
                backgroundColor: "#055A43",
                color: "#F7F5EF",
                fontFamily: "var(--font-sans)",
                fontSize: "0.95rem",
                fontWeight: 500,
                letterSpacing: "0.02em",
                padding: "16px 36px",
                borderRadius: "50px",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#044835")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#055A43")}
            >
              Quero baixar o e-book grátis
            </button>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                color: "#777",
                fontSize: "0.8rem",
                fontWeight: 300,
              }}
            >
              Leitura prática, clara e baseada em ciência comportamental.
            </span>
          </motion.div>
        </div>

        <motion.div
          className="flex items-center justify-center lg:justify-end"
          initial={{ opacity: 0, x: 32, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, -0.6, 0.4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "320px",
              height: "420px",
              backgroundColor: "#055A43",
              borderRadius: "16px",
              boxShadow: "20px 24px 60px rgba(5, 90, 67, 0.18), 0 4px 20px rgba(0,0,0,0.08)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "36px 32px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-60px",
                right: "-60px",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
            <motion.div
              aria-hidden="true"
              animate={{ x: ["-120%", "120%"] }}
              transition={{ duration: 5.8, repeat: Infinity, repeatDelay: 2.8, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.12) 42%, transparent 58%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "30px",
                left: "32px",
                right: "32px",
              }}
            >
              <div style={{ marginBottom: "26px" }}>
                <BrandLogo tone="light" width={92} />
              </div>
              <span
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: "20px",
                }}
              >
                Focão · E-book gratuito
              </span>
              <div
                style={{
                  width: "40px",
                  height: "2px",
                  backgroundColor: "rgba(255,255,255,0.3)",
                  marginBottom: "28px",
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "#F7F5EF",
                  fontSize: "1.65rem",
                  lineHeight: 1.2,
                  fontWeight: 500,
                }}
              >
                Rotina &amp;<br />Comportamento<br />Canino
              </h2>
            </div>

            <div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "rgba(255,255,255,0.68)",
                  fontSize: "0.78rem",
                  lineHeight: 1.6,
                  fontWeight: 300,
                }}
              >
                Como previsibilidade, consistência e observação transformam a relação com seu cão.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

