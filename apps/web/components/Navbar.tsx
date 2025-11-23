import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
    cartCount: number;
    onCartClick: () => void;
}

const Navbar = ({ cartCount, onCartClick }: NavbarProps) => {
    return (
        <nav className="border-b border-border sticky top-0 bg-background z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">STORE</h1>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm hover:text-muted-foreground transition-colors">
                            Produtos
                        </a>
                        <a href="#" className="text-sm hover:text-muted-foreground transition-colors">
                            Sobre
                        </a>
                        <a href="#" className="text-sm hover:text-muted-foreground transition-colors">
                            Contato
                        </a>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        onClick={onCartClick}
                    >
                        <ShoppingBag className="h-5 w-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-bold">
                                {cartCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
