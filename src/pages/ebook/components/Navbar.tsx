import { BrandLogo } from "./BrandLogo";

interface NavbarProps {
  onCtaClick: () => void;
}

export function Navbar({ onCtaClick }: NavbarProps) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "rgba(249,249,248,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E7E3DA",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24"
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href="#top"
          aria-label="Focão"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <BrandLogo width={104} />
        </a>

        <button
          onClick={onCtaClick}
          style={{
            backgroundColor: "#055A43",
            color: "#F7F5EF",
            fontFamily: "var(--font-sans)",
            fontSize: "0.82rem",
            fontWeight: 500,
            padding: "10px 22px",
            borderRadius: "50px",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#044835")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#055A43")}
        >
          Baixar e-book grátis
        </button>
      </div>
    </nav>
  );
}

