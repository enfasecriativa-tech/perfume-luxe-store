import { Search, User, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const Header = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="text-2xl font-bold text-primary">
              PARFUM
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="O que você procura?"
                className="pl-10 h-12 bg-secondary border-0"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-5 w-5" />
              <span className="hidden md:inline">Minha Conta</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden md:inline">Carrinho</span>
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-border">
          <ul className="flex items-center justify-center gap-8 py-4">
            <li>
              <Link
                to="/produtos"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Perfumes
              </Link>
            </li>
            <li>
              <Link
                to="/produtos"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Marcas
              </Link>
            </li>
            <li>
              <Link
                to="/produtos"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Maquiagem
              </Link>
            </li>
            <li>
              <Link
                to="/produtos"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Cosméticos
              </Link>
            </li>
            <li>
              <Link
                to="/produtos"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Ofertas
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
