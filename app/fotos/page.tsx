import Link from "next/link";

const runway =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPDqaZN7-ypaXf5tsMwJNxqONSp1rv22BBCBwFGeyW7OVBVB6hsMgYGGeMnGhGlMgNqF1U1W29Hl1VLUA5KoDLCEe45qW3IWZQ-hOEswPxbk7shZ63aGGfNZiIlYAHMF3uzzYbLPqswd5JG4ixPDHPH439fnJivOLydNC4J1B16SKRPQe3RTTA9S8tyPbxwPYQIwX07Pe3aEirIWUf1WZ3Arnfzr6oHQeEkLe5HMj2YzvXHU0cjOjx";

export default function PhotosPage() {
  return (
    <main className="public-page">
      <section
        className="hero"
        style={{
          maxWidth: "none",
          height: 560,
          backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.65),transparent),url(${runway})`,
          display: "grid",
          alignItems: "end",
          justifyItems: "center",
          padding: 45,
        }}
      >
        <h1 style={{ color: "white", textAlign: "center" }}>
          Reviva os melhores<br />momentos
        </h1>
      </section>
      <section className="registration-section" style={{ paddingTop: 70 }}>
        <p className="lead">
          A última edição do Fashion Date foi inesquecível. Uma noite de pura
          elegância, tendências exclusivas e encontros marcantes.
        </p>
        <a
          className="primary-button"
          style={{ display: "inline-block", textDecoration: "none", margin: "28px 0 70px" }}
          href="#galeria-em-breve"
        >
          VER E BAIXAR FOTOS ↓
        </a>
        <div className="ticket" id="galeria-em-breve">
          <div className="eyebrow">Save the date</div>
          <h1 style={{ fontSize: 48 }}>A Próxima Edição</h1>
          <p className="muted">
            Estamos preparando algo ainda mais grandioso. Não fique de fora do
            próximo evento de moda do ano.
          </p>
          <Link
            className="secondary-button"
            style={{ display: "block", padding: 18, textDecoration: "none", marginTop: 30 }}
            href="/"
          >
            QUERO PARTICIPAR DO PRÓXIMO FASHION DATE
          </Link>
        </div>
      </section>
    </main>
  );
}
