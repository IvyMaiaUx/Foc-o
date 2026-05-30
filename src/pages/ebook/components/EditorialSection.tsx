import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function EditorialSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });

  return (
    <section
      ref={ref}
      style={{ backgroundColor: "#1E1E1E" }}
      className="py-28 px-6 md:px-16 lg:px-24"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        {/* Top rule */}
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: "36px", height: "1px", backgroundColor: "rgba(255,255,255,0.25)" }}
        />

        <motion.blockquote
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          style={{
            fontFamily: "var(--font-serif)",
            color: "#FAFAFA",
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            lineHeight: 1.2,
            fontWeight: 400,
            fontStyle: "italic",
          }}
        >
          Rotina não é rigidez.{" "}
          <span style={{ fontWeight: 500, fontStyle: "normal", color: "#DDEFE7" }}>
            É previsibilidade que acalma.
          </span>
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          style={{ display: "flex", alignItems: "center", gap: "16px" }}
        >
          <div style={{ width: "24px", height: "1px", backgroundColor: "rgba(255,255,255,0.2)" }} />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.8rem",
              fontWeight: 300,
              letterSpacing: "0.08em",
            }}
          >
            Rotina &amp; Comportamento Canino · Focão
          </span>
        </motion.div>
      </div>
    </section>
  );
}

