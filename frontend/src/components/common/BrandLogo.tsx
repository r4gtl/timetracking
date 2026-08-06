import logo from "../../assets/logo.png";

// Componente a parte perché è riusato in 3 pagine (Report, Fatture, Dettaglio
// fattura) senza duplicare il markup: se domani cambia il logo o la sua
// posizione, si tocca un solo file.
export function BrandLogo() {
  return <img src={logo} alt="Logo aziendale" className="brand-logo" />;
}
