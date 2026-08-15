import { APP_CONFIG } from "@/constants/config";

export function Footer() {
  return (
    <footer className="stitch-footer">
      © {APP_CONFIG.edition} {APP_CONFIG.name}. Todos os direitos reservados.
    </footer>
  );
}
