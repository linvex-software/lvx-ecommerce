import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Novidades", href: "/produtos?filter=new" },
  { name: "Vestidos", href: "/produtos?category=vestidos" },
  { name: "Conjuntos", href: "/produtos?category=conjuntos" },
  { name: "Blusas", href: "/produtos?category=blusas" },
  { name: "Saias & Calças", href: "/produtos?category=saias" },
  { name: "Natal & Festas", href: "/produtos?filter=featured" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border" style={{zIndex: 99999}}>
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-widest font-body">
        FRETE GRÁTIS PARA COMPRAS ACIMA DE R$ 299
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground tracking-wide">
              Flor de Menina
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Link to="/busca" className="p-2 hover:text-primary transition-colors">
              <Search size={20} />
            </Link>
            <Link to="/minha-conta" className="p-2 hover:text-primary transition-colors hidden sm:block">
              <User size={20} />
            </Link>
            <button className="p-2 hover:text-primary transition-colors hidden sm:block">
              <Heart size={20} />
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 hover:text-primary transition-colors relative"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-[104px] bg-background z-40 transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col p-6 gap-4 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-body py-3 border-b border-border text-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex gap-4 mt-6">
            <Link to="/minha-conta" className="flex items-center gap-2 text-foreground">
              <User size={20} />
              <span>Minha Conta</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
