"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X, Sun, Moon, ShoppingCart, User, LayoutDashboard, ChevronRight, Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { getCartCount } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Reviews", path: "/reviews" },
  { label: "Orders", path: "/orders" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, role, clearAuth } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleCart = () => setCartCount(getCartCount());
    handleCart();
    window.addEventListener("cart_updated", handleCart);
    window.addEventListener("storage", handleCart);
    return () => {
      window.removeEventListener("cart_updated", handleCart);
      window.removeEventListener("storage", handleCart);
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const menu = mobileMenuRef.current;
    if (!menu) return;
    const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(menu.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => !el.hasAttribute("disabled"));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        return;
      }
      if (e.key !== "Tab" || focusables.length === 0) return;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last?.focus();
        }
        return;
      }
      if (active === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const signOut = () => {
    clearAuth();
    setMobileMenuOpen(false);
    router.push("/");
  };

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname?.startsWith(path));

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14 sm:h-16 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="leading-none">
            <div className="text-sm sm:text-base font-bold text-foreground tracking-tight">Speedway</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Auto Parts</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`relative rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-1.5">
          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center animate-scale-in">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          {isAuthenticated ? (
            <>
              {role && ["admin", "manager", "staff"].includes(role) && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              )}
              <Link
                href="/account"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                {role ? role[0].toUpperCase() + role.slice(1) : "Account"}
              </Link>
              <button
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all active:scale-[0.98]"
            >
              Sign In
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1">
          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="md:hidden fixed inset-0 z-[100]">
              <button
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu overlay"
              />
              <div
                id="mobile-nav"
                ref={mobileMenuRef}
                className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl animate-slide-in-right overflow-y-auto overscroll-contain"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-foreground">Menu</span>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="px-4 py-4 space-y-1">
                  {navLinks.map((link, index) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors animate-fade-in-up ${
                        isActive(link.path)
                          ? "bg-primary/5 text-primary"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      }`}
                      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </Link>
                  ))}
                </nav>

                <div className="mx-5 border-t border-slate-100 dark:border-slate-800" />

                <div className="px-4 py-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTheme()}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === "dark" ? "Light" : "Dark"}
                    </button>
                    <Link
                      href="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Cart {cartCount > 0 && `(${cartCount})`}
                    </Link>
                  </div>

                  {isAuthenticated && role && ["admin", "manager", "staff"].includes(role) && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Admin Dashboard</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                    </Link>
                  )}
                </div>

                <div className="px-4 pb-6 mt-auto">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link
                        href="/account"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 h-11 rounded-xl px-4 border border-slate-200 dark:border-slate-700 text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                      <button
                        className="w-full flex items-center justify-center h-11 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                        onClick={signOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center h-12 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/25 transition-all"
                    >
                      Sign In to Your Account
                    </Link>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
};
