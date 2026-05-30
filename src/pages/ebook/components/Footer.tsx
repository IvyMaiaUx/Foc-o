import { BrandLogo } from "./BrandLogo";

const footerLinks = [
  { label: "Privacidade", href: "/welcome" },
  { label: "Termos", href: "/welcome" },
  { label: "Contato", href: "mailto:focaosupport@gmail.com" },
];

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#F9F9F8",
        borderTop: "1px solid #E7E3DA",
        padding: "40px 6%",
      }}
    >
      <div
        className="max-w-7xl mx-auto"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <BrandLogo width={96} />

        <p
          style={{
            fontFamily: "var(--font-sans)",
            color: "#8A837A",
            fontSize: "0.78rem",
            fontWeight: 300,
            lineHeight: 1.6,
          }}
        >
          © {new Date().getFullYear()} Focão · Rotina &amp; Comportamento Canino
        </p>

        <div style={{ display: "flex", gap: "24px" }}>
          {footerLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                fontFamily: "var(--font-sans)",
                color: "#8A837A",
                fontSize: "0.78rem",
                fontWeight: 300,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#055A43")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8A837A")}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
