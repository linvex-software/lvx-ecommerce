'use client'

import { useState } from "react";
import { ShoppingBag, Search, User, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStoreTheme } from "@/lib/hooks/use-store-theme";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
    cartCount: number;
    onCartClick: () => void;
    onSearch?: (query: string) => void;
}

const Navbar = ({ cartCount, onCartClick, onSearch }: NavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { data: theme } = useStoreTheme();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const menuItems = [
        { label: "NOVIS!", href: "#" },
        { label: "COLEÇÃO NOVA", href: "#", badge: "ESPECIAL FIM DE ANO" },
        { label: "PRODUTOS", href: "#", hasSubmenu: true },
        { label: "MAIS VENDIDOS", href: "#" },
        { label: "SALE!", href: "#", highlight: true },
        { label: "KITS PROMOCIONAIS", href: "#" },
        { label: "BAZAR", href: "#" },
    ];

    return (
        <>
            <nav className="sticky top-0 bg-background z-50 flex flex-col shadow-sm">
                {/* Top Bar */}
                <div className="border-b border-border">
                    <div className="container mx-auto px-4 py-3 md:py-4">
                        <div className="flex items-center justify-between gap-4">
                            {/* Logo - Left on Mobile, Center on Desktop */}
                            <div className="flex items-center gap-3 md:flex-1">
                                {theme?.logo_url ? (
                                    <img
                                        src={theme.logo_url}
                                        alt="Logo"
                                        className="w-12 h-12 md:w-14 md:h-14 object-contain"
                                    />
                                ) : (
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-muted rounded flex items-center justify-center">
                                        <span className="text-xs font-semibold">Logo</span>
                                    </div>
                                )}
                            </div>

                            {/* Search Bar - Desktop Only */}
                            <div className="flex-1 max-w-md hidden md:block">
                                <div className="relative">
                                    <Input
                                        placeholder="O que você está buscando?"
                                        className="rounded-full pl-4 pr-10 border-foreground/20 focus-visible:ring-2 focus-visible:ring-foreground/20"
                                        onChange={(e) => onSearch?.(e.target.value)}
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            {/* Icons - Right */}
                            <div className="flex items-center justify-end gap-3 md:gap-6 md:flex-1">
                                {/* Search Icon - Mobile Only */}
                                <button
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                                    aria-label="Buscar"
                                >
                                    <Search className="h-5 w-5" />
                                </button>

                                {/* User Icon - Desktop Only */}
                                <div className="hidden md:flex flex-col items-center cursor-pointer hover:text-muted-foreground transition-colors">
                                    <User className="h-5 w-5" />
                                    <span className="text-[10px] mt-1">Minha Conta</span>
                                </div>

                                {/* Cart Icon */}
                                <div
                                    className="flex flex-col items-center cursor-pointer hover:text-muted-foreground transition-colors relative"
                                    onClick={onCartClick}
                                >
                                    <motion.div
                                        className="relative"
                                        animate={cartCount > 0 ? { scale: [1, 1.15, 1] } : {}}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                    >
                                        <ShoppingBag className="h-5 w-5" />
                                        <AnimatePresence>
                                            {cartCount > 0 && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[9px] flex items-center justify-center font-bold"
                                                >
                                                    {cartCount}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                    <span className="text-[10px] mt-1 hidden md:block">Carrinho</span>
                                </div>

                                {/* Hamburger Menu - Mobile Only */}
                                <button
                                    onClick={toggleMenu}
                                    className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                                    aria-label="Menu"
                                >
                                    <Menu className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Search Bar */}
                        {isSearchOpen && (
                            <div className="mt-3 md:hidden">
                                <div className="relative">
                                    <Input
                                        placeholder="O que você está buscando?"
                                        className="rounded-full pl-4 pr-10 border-foreground/20"
                                        onChange={(e) => onSearch?.(e.target.value)}
                                        autoFocus
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Bar - Desktop Only */}
                <div className="border-b border-border py-3 hidden md:block">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-center gap-8 text-xs font-medium tracking-wide">
                            {menuItems.map((item, index) => (
                                <a
                                    key={index}
                                    href={item.href}
                                    className={`hover:text-muted-foreground transition-colors flex items-center gap-1 ${item.highlight ? 'text-red-600 font-bold' : ''
                                        }`}
                                >
                                    {item.label}
                                    {item.badge && <span className="text-[9px] ml-1">• {item.badge}</span>}
                                    {item.hasSubmenu && <ChevronDown className="h-3 w-3" />}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300"
                    onClick={closeMenu}
                />
            )}

            {/* Mobile Menu Sidebar - Slides from Right */}
            <div
                className={`fixed top-0 right-0 h-full w-[280px] bg-background z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold">Menu</h2>
                    <button
                        onClick={closeMenu}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="overflow-y-auto h-[calc(100%-140px)]">
                    <div className="p-4 space-y-1">
                        {menuItems.map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                onClick={closeMenu}
                                className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors ${item.highlight ? 'bg-red-50 text-red-600 font-bold' : ''
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {item.badge && (
                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                {item.hasSubmenu && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Menu Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
                    <a
                        href="#"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        onClick={closeMenu}
                    >
                        <User className="h-5 w-5" />
                        <span className="text-sm font-medium">Minha Conta</span>
                    </a>
                </div>
            </div>
        </>
    );
};

export default Navbar;
