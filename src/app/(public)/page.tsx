"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Shield, Truck, Wrench, BadgeCheck, Clock,
  Star, Users, MapPin, ArrowRight, Search, Car, Phone, Mail,
  ChevronRight, ArrowDown, Paintbrush, Zap, ThumbsUp, Package,
  Heart, Sparkles, Gauge, Filter, Lightbulb, Headphones,
  ChevronLeft, Quote, Layers
} from "lucide-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useScrollReveal, useScrollRevealBatch } from "@/lib/useScrollReveal";
import { apiGet, getApiErrorMessage } from "@/lib/api";

/* ─── Data ──────────────────────────────────────────────────────── */

const features = [
  { title: "Genuine Parts", description: "Trusted brands with verified fitment for your vehicle. Every part sourced from certified suppliers.", icon: Shield, color: "blue" as const },
  { title: "Fast Delivery", description: "Nationwide delivery with reliable tracking. Same-day dispatch on orders before 2pm.", icon: Truck, color: "green" as const },
  { title: "Expert Support", description: "Speak to specialists for fitment, compatibility, and installation advice.", icon: Headphones, color: "amber" as const },
  { title: "Quality Assured", description: "Every order inspected for quality and accuracy before dispatch.", icon: BadgeCheck, color: "emerald" as const },
  { title: "Smart Search", description: "Find the exact part by vehicle make, model, year, or part number.", icon: Filter, color: "violet" as const },
  { title: "Easy Returns", description: "Hassle-free returns within 14 days. No questions asked policy.", icon: ThumbsUp, color: "rose" as const },
];

const stats = [
  { label: "Parts in Stock", value: "15,000+", icon: Package },
  { label: "Happy Customers", value: "5,000+", icon: Heart },
  { label: "Avg Delivery", value: "24 hrs", icon: Zap },
  { label: "Years Experience", value: "8+", icon: Gauge },
];

const trustItems = [
  "OEM & Aftermarket", "Fitment Verified", "Secure Checkout",
  "Mobile Money Accepted", "Fast Dispatch", "Easy Returns",
  "Expert Support", "Quality Inspected",
];

const categoryColors = [
  "from-blue-500 to-cyan-500",
  "from-red-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-yellow-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-green-500",
  "from-orange-500 to-red-500",
  "from-fuchsia-500 to-pink-500",
  "from-sky-500 to-blue-500",
  "from-lime-500 to-green-500",
];

const categoryIcons = [
  Gauge, Shield, Car, Zap, Paintbrush, Sparkles,
  Wrench, Package, Filter, Lightbulb, Truck, Headphones,
];

const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/40", icon: "text-blue-600 dark:text-blue-400", ring: "ring-blue-200/60 dark:ring-blue-800/40" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200/60 dark:ring-emerald-800/40" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-600 dark:text-amber-400", ring: "ring-amber-200/60 dark:ring-amber-800/40" },
  emerald: { bg: "bg-teal-50 dark:bg-teal-950/40", icon: "text-teal-600 dark:text-teal-400", ring: "ring-teal-200/60 dark:ring-teal-800/40" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/40", icon: "text-violet-600 dark:text-violet-400", ring: "ring-violet-200/60 dark:ring-violet-800/40" },
  rose: { bg: "bg-rose-50 dark:bg-rose-950/40", icon: "text-rose-600 dark:text-rose-400", ring: "ring-rose-200/60 dark:ring-rose-800/40" },
};

type Review = { id: number; rating: number; title?: string | null; body: string; users?: { full_name: string } | null };
type Product = { id: string; name: string; price: number; image_url?: string | null; categories?: { name: string } };
type Category = { id: string; name: string; image_url?: string | null; product_count?: number };

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop";

/* ─── Section Wrapper with Reveal ───────────────────────────────── */

const RevealSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}> = ({ children, className = "", delay = 0, direction = "up" }) => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

  const directionClass = {
    up: "reveal",
    left: "reveal-left",
    right: "reveal-right",
    scale: "reveal-scale",
  }[direction];

  return (
    <section
      ref={ref}
      className={`${directionClass} ${isVisible ? "revealed" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
};

/* ─── Main Component ────────────────────────────────────────────── */

export default function LandingPage() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [featured, setFeatured] = React.useState<Product[]>([]);
  const [dbCategories, setDbCategories] = React.useState<Category[]>([]);
  const [search, setSearch] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  const router = useRouter();

  const heroReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.05 });
  const { setRef: setFeatureRef, visibleItems: visibleFeatures } = useScrollRevealBatch(features.length);
  const { setRef: setCatRef, visibleItems: visibleCats } = useScrollRevealBatch(dbCategories.length);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [reviewsData, productsData, categoriesData] = await Promise.all([
          apiGet<Review[] | unknown>("/api/reviews").catch(() => []),
          apiGet<{ data: Product[] } | unknown>("/api/products?limit=6").catch(() => ({ data: [] })),
          apiGet<Category[] | unknown>("/api/categories").catch(() => []),
        ]);
        const safeReviews = Array.isArray(reviewsData) ? reviewsData : [];
        setReviews(safeReviews.slice(0, 6));
        const products = (productsData as any)?.data;
        const safeProducts = Array.isArray(products) ? products : [];
        setFeatured([...safeProducts].sort(() => Math.random() - 0.5).slice(0, 3));
        const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
        setDbCategories(safeCategories);
      } catch { /* Silently fail */ }
    }
    loadData();
  }, []);

  // Auto-rotate testimonials
  React.useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  const reviewAvg = Array.isArray(reviews) && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviews.length).toFixed(1)
    : "5.0";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(search.trim() ? `/shop?q=${encodeURIComponent(search)}` : "/shop");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      <main>
        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background image - visible on all screens */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2000&auto=format&fit=crop"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-950/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
            {/* Color tint */}
            <div className="absolute inset-0 bg-primary/5" />
            {/* Glow orbs */}
            <div className="absolute top-[-100px] left-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-50px] right-[-50px] w-[500px] h-[500px] bg-blue-600/6 rounded-full blur-[120px]" />
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          <div className="relative container-max">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-4rem)] py-10 sm:py-12 lg:py-0">
              {/* Left content */}
              <div
                ref={heroReveal.ref}
                className={`reveal-left ${heroReveal.isVisible ? "revealed" : ""} flex flex-col justify-center`}
              >
                {/* Badge */}
                <div className="inline-flex self-start items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6 sm:mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-primary-200">
                    Trusted by 5,000+ customers
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-[1.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-white leading-[1.15] sm:leading-[1.1] tracking-tight font-display">
                  Premium Auto Parts{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent">
                      for Every Make
                    </span>
                  </span>
                  {" "}&amp; Model
                </h1>

                {/* Subtitle */}
                <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-slate-300 max-w-lg leading-relaxed">
                  Genuine parts, expert fitment advice, and fast delivery across Ghana.
                  Trusted by thousands of workshops and drivers.
                </p>

                {/* Search */}
                <form onSubmit={handleSearch} className="mt-6 sm:mt-8">
                  <div className={`relative flex items-center rounded-2xl bg-white/[0.08] border transition-all duration-300 ${searchFocused ? 'border-primary/40 ring-2 ring-primary/20 bg-white/[0.12]' : 'border-white/15 hover:border-white/25'}`}>
                    <Search className="ml-4 sm:ml-5 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      placeholder="Search parts, brands, or vehicles..."
                      className="flex-1 min-w-0 h-12 sm:h-14 px-3 sm:px-4 bg-transparent text-white placeholder-slate-400 outline-none text-sm sm:text-base"
                    />
                    <button
                      type="submit"
                      className="mr-1.5 sm:mr-2 h-10 sm:h-11 px-4 sm:px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg shadow-primary/25 flex-shrink-0"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* CTAs */}
                <div className="mt-6 sm:mt-8 flex flex-wrap gap-2.5 sm:gap-3">
                  <Link
                    href="/shop"
                    className="group inline-flex items-center gap-2 h-11 sm:h-12 px-5 sm:px-7 rounded-xl sm:rounded-2xl bg-white text-slate-900 text-sm sm:text-base font-semibold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                    Shop Parts
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                  <Link
                    href="/shop?q=Car+Modification+Accessories"
                    className="group inline-flex items-center gap-2 h-11 sm:h-12 px-5 sm:px-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm sm:text-base font-semibold shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Paintbrush className="w-4 h-4 sm:w-5 sm:h-5" />
                    Spec your Car
                  </Link>
                  <WhatsAppButton
                    label="Contact Us"
                    className="h-11 sm:h-12 px-5 sm:px-7 shadow-lg shadow-green-500/20 rounded-xl sm:rounded-2xl text-sm sm:text-base"
                  />
                </div>

                {/* Trust row */}
                <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
                  {[
                    { icon: Shield, label: "Verified Parts" },
                    { icon: Truck, label: "Fast Delivery" },
                    { icon: CheckCircle, label: "Quality Assured" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-slate-300">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Hero image card (desktop & tablet) */}
              <div className="relative animate-fade-in-up hidden md:block" style={{ animationDelay: '150ms' }}>
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-[2rem] blur-2xl" />
                <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop"
                    alt="Premium Auto Parts"
                    className="w-full aspect-[4/3] object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  {/* Stats overlay */}
                  <div className="absolute bottom-4 left-4 right-4 lg:bottom-5 lg:left-5 lg:right-5">
                    <div className="grid grid-cols-4 gap-2 lg:gap-3">
                      {stats.map((stat) => (
                        <div key={stat.label} className="text-center p-2 lg:p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15">
                          <stat.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary mx-auto mb-1 lg:mb-1.5" />
                          <AnimatedCounter
                            value={stat.value}
                            className="text-base lg:text-lg font-bold text-white block"
                          />
                          <p className="text-[9px] lg:text-[10px] text-slate-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile stats bar (below content on small screens) */}
              <div className="grid grid-cols-4 gap-2 md:hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-2.5 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-sm">
                    <stat.icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                    <AnimatedCounter
                      value={stat.value}
                      className="text-sm font-bold text-white block"
                    />
                    <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 animate-bounce">
            <ArrowDown className="w-4 h-4 text-white/40" />
          </div>
        </section>

        {/* ── TRUST MARQUEE ───────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-y border-slate-100 dark:border-slate-800">
          <div className="hidden sm:block container-max py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-primary/70" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sm:hidden py-3">
            <div className="marquee-track">
              <div className="marquee-content">
                {[...trustItems, ...trustItems].map((item, i) => (
                  <div key={`${item}-${i}`} className="flex items-center gap-1.5 whitespace-nowrap px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <CheckCircle className="w-3 h-3 text-primary/70 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white dark:bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/30" />
          <div className="relative container-max section-padding">
            <RevealSection direction="up" className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary mb-4">
                <Sparkles className="w-3 h-3" />
                Why Choose Us
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white font-display">
                Built for workshops &amp; drivers
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Simple, reliable service for everyone who needs quality auto parts in Ghana
              </p>
            </RevealSection>

            <div className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const colors = colorMap[feature.color];
                return (
                  <div
                    key={feature.title}
                    ref={setFeatureRef(index)}
                    className={`group relative p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 reveal ${visibleFeatures.has(index) ? "revealed" : ""}`}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.bg} ring-1 ${colors.ring} flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110`}>
                      <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">{feature.title}</h3>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="relative container-max section-padding">
            <RevealSection direction="up" className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary mb-4">
                <Layers className="w-3 h-3" />
                Browse Categories
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white font-display">
                Find exactly what you need
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Shop by category to find the right parts for your vehicle
              </p>
            </RevealSection>

            {dbCategories.length > 0 && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {dbCategories.map((cat, index) => {
                const IconComponent = categoryIcons[index % categoryIcons.length];
                const gradientColor = categoryColors[index % categoryColors.length];
                return (
                <Link
                  key={cat.id}
                  href={`/shop/category/${cat.id}`}
                  ref={setCatRef(index)}
                  className={`group relative p-4 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center reveal-scale ${visibleCats.has(index) ? "revealed" : ""}`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/10 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">{cat.name}</h3>
                  {cat.product_count !== undefined && (
                    <span className="inline-block mt-2 text-[10px] sm:text-xs font-semibold text-primary">{cat.product_count.toLocaleString()} parts</span>
                  )}
                </Link>
                );
              })}
            </div>
            )}
          </div>
        </section>

        {/* ── FEATURED PRODUCTS ───────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="bg-white dark:bg-slate-950">
            <div className="container-max section-padding">
              <RevealSection direction="up">
                <div className="flex items-end justify-between gap-4 mb-8 sm:mb-12">
                  <div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary mb-3 sm:mb-4">
                      <Package className="w-3 h-3" />
                      Popular Now
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white font-display">Featured Products</h2>
                    <p className="mt-1.5 sm:mt-2 text-sm text-slate-500 dark:text-slate-400">Hand-picked items from our catalog</p>
                  </div>
                  <Link
                    href="/shop"
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-primary/30 hover:text-primary transition-all"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </RevealSection>

              <div className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-3">
                {featured.map((item, index) => (
                  <RevealSection key={item.id} direction="up" delay={index * 100}>
                    <Link
                      href={`/product/${item.id}`}
                      className="group relative block bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="aspect-square sm:aspect-[4/3] bg-slate-100 dark:bg-slate-700/50 overflow-hidden relative">
                        <img
                          src={item.image_url || fallbackImage}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {item.categories?.name || "Auto Parts"}
                          </span>
                        </div>
                        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hidden sm:flex">
                          <span className="w-full py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-center text-sm font-semibold text-slate-900 dark:text-white shadow-lg">
                            View Details
                          </span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {item.name}
                        </h3>
                        <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            GHS {item.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </RevealSection>
                ))}
              </div>

              <div className="mt-6 sm:hidden">
                <Link
                  href="/shop"
                  className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-all"
                >
                  View All Products <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── STATS BAR ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-violet-600">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <RevealSection direction="scale" className="relative container-max py-12 sm:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white/60 mx-auto mb-2 sm:mb-3" />
                  <AnimatedCounter
                    value={stat.value}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white block font-display"
                  />
                  <p className="text-sm sm:text-base text-white/70 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── SOCIAL PROOF + LOCATION ─────────────────────────────── */}
        <section className="bg-slate-50 dark:bg-slate-900/30">
          <div className="container-max section-padding">
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-5">
              {/* Reviews Card - takes 3 columns */}
              <RevealSection direction="left" className="lg:col-span-3">
                <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-5 sm:p-8 lg:p-10 h-full">
                  {/* Header */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug font-display">Trusted by Workshops Nationwide</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{reviewAvg} rating</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 sm:mb-6">
                    Thousands of professionals rely on Speedway for consistent stock and fast fulfillment.
                  </p>

                  {/* Reviews carousel or list */}
                  {reviews.length > 0 ? (
                    <div className="relative">
                      {/* Desktop: show 2 reviews */}
                      <div className="hidden sm:block space-y-3">
                        {reviews.slice(0, 2).map((review) => (
                          <div key={review.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-1 text-amber-400 mb-2">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                            {review.title && <p className="font-medium text-base text-slate-900 dark:text-white">{review.title}</p>}
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{review.body}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{review.users?.full_name || "Customer"}</p>
                          </div>
                        ))}
                      </div>

                      {/* Mobile: carousel */}
                      <div className="sm:hidden">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                          <Quote className="w-5 h-5 text-primary/40 mb-2" />
                          <div className="flex items-center gap-1 text-amber-400 mb-2">
                            {Array.from({ length: reviews[currentTestimonial]?.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          {reviews[currentTestimonial]?.title && (
                            <p className="font-medium text-sm text-slate-900 dark:text-white">{reviews[currentTestimonial].title}</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                            {reviews[currentTestimonial]?.body}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                            {reviews[currentTestimonial]?.users?.full_name || "Customer"}
                          </p>
                        </div>
                        {reviews.length > 1 && (
                          <div className="flex items-center justify-center gap-3 mt-3">
                            <button
                              onClick={() => setCurrentTestimonial((p) => (p - 1 + reviews.length) % reviews.length)}
                              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              aria-label="Previous review"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex gap-1.5">
                              {reviews.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentTestimonial(i)}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentTestimonial ? "bg-primary w-4" : "bg-slate-300 dark:bg-slate-600"}`}
                                  aria-label={`Go to review ${i + 1}`}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => setCurrentTestimonial((p) => (p + 1) % reviews.length)}
                              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              aria-label="Next review"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                      <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Be the first to leave a review!</p>
                    </div>
                  )}

                  <Link
                    href="/reviews"
                    className="mt-5 sm:mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all group"
                  >
                    View All Reviews <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </RevealSection>

              {/* Location Card - takes 2 columns */}
              <RevealSection direction="right" delay={150} className="lg:col-span-2">
                <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-5 sm:p-8 lg:p-10 text-white h-full">
                  <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold leading-snug font-display">Visit Our Accra Hub</h3>
                      <p className="text-xs sm:text-sm text-slate-400">Expert support on site</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { icon: MapPin, text: "Abossey-Okai, Accra, Ghana" },
                      { icon: Clock, text: "Mon - Sat, 8:00am - 6:00pm" },
                      { icon: Phone, text: "+233 XX XXX XXXX" },
                      { icon: Mail, text: "info@speedway.com" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Map placeholder */}
                  <div className="mt-6 rounded-xl overflow-hidden border border-white/10 bg-slate-700/50 h-32 sm:h-40 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Abossey-Okai, Accra</p>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <Link
                      href="/contact"
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 sm:h-12 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 active:scale-[0.98] transition-all"
                    >
                      <Mail className="w-4 h-4" /> Contact Sales
                    </Link>
                    <WhatsAppButton label="WhatsApp Us" className="flex-1 h-11 sm:h-12 rounded-xl text-sm" />
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ── NEWSLETTER CTA ──────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white dark:bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
          <RevealSection direction="scale" className="relative container-max section-padding">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 sm:mb-6">
                <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white font-display">
                Stay in the loop
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Get exclusive deals, new arrivals, and expert maintenance tips delivered to your inbox.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  className="h-12 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                No spam, unsubscribe anytime.
              </p>
            </div>
          </RevealSection>
        </section>
      </main>
    </div>
  );
}
