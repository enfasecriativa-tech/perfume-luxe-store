import { Link } from "react-router-dom";
import { CreditCard, Lock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Institucional */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Institucional</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/trabalhe-conosco" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trabalhe Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Atendimento ao Cliente</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dúvidas Frequentes
                </Link>
              </li>
              <li>
                <Link to="/trocas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link to="/rastreio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Rastrear Pedido
                </Link>
              </li>
            </ul>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Formas de Pagamento</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="bg-background border border-border rounded p-2 flex items-center justify-center w-12 h-8">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-background border border-border rounded p-2 flex items-center justify-center w-12 h-8">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-background border border-border rounded p-2 flex items-center justify-center w-12 h-8">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Cartão de crédito, débito, boleto e PIX
            </p>
          </div>

          {/* Segurança */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Compra Segura</h3>
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-4">
              <Lock className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Site 100% Seguro</p>
                <p className="text-xs text-muted-foreground">Certificado SSL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Acqua D'or. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
