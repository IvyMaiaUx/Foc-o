import { Reveal } from "./Reveal";

export function PainSection() {
  return (
    <section
      style={{ backgroundColor: "#FAFAFA" }}
      className="py-24 px-6 md:px-16 lg:px-24"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Reveal>
          <div style={{ width: "36px", height: "2px", backgroundColor: "#055A43" }} />
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              color: "#1E1E1E",
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              lineHeight: 1.2,
              fontWeight: 500,
              maxWidth: "680px",
            }}
          >
            Seu cachorro não é teimoso. Talvez ele só esteja sem previsibilidade
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-col gap-5 max-w-2xl">
            <p
              style={{
                fontFamily: "var(--font-sans)",
                color: "#555",
                fontSize: "1rem",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Ansiedade, destruição, agitação, dificuldade de obediência. Muitos desses comportamentos têm raiz em rotinas inconsistentes, energia acumulada sem canal e falta de contexto previsível.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                color: "#555",
                fontSize: "1rem",
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Não é maldade. Não é teimosia. É biologia comportamental. E quando você entende isso, tudo muda: a relação, a comunicação e o bem-estar dos dois.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <div
            style={{
              backgroundColor: "#DDEFE7",
              borderRadius: "14px",
              padding: "20px 24px",
              borderLeft: "3px solid #055A43",
              maxWidth: "520px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-serif)",
                color: "#055A43",
                fontSize: "1.05rem",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              "Entender o comportamento do seu cão começa por entender o que ele precisa. Não o que ele faz."
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

