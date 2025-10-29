import { Search, User, ShoppingCart, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import { useState } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Perfumes", href: "/produtos" },
    { label: "Marcas", href: "/produtos" },
    { label: "Maquiagem", href: "/produtos" },
    { label: "Cosméticos", href: "/produtos" },
    { label: "Ofertas", href: "/produtos" },
  ];

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="flex items-center justify-between py-3 md:py-4 gap-2 md:gap-4">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background">
              <nav className="flex flex-col gap-4 mt-8">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="text-xl md:text-2xl font-bold text-primary">
              PARFUM
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="O que você procura?"
                className="pl-10 h-12 bg-secondary border-0"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <Link to="/minha-conta">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">Minha Conta</span>
              </Button>
            </Link>
            <Link to="/carrinho">
              <Button variant="ghost" size="sm" className="gap-2 relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden lg:inline">Carrinho</span>
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="O que você procura?"
              className="pl-9 h-10 bg-secondary border-0 text-sm"
            />
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="border-t border-border hidden lg:block">
          <ul className="flex items-center justify-center gap-8 py-4">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
