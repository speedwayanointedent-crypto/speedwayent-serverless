"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, Shield, Truck, Star, Package } from "lucide-react";
import { apiGet } from "@/lib/api";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Button } from "@/components/ui/Button";

type Category = { id: string; name: string; image_url?: string | null; product_count?: number };

const fallbackImage = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop";

export default function ShopPage() {
  return (
    <React.Suspense fallback={<div className="p-8">Loading...</div>}>
      <ShopPageInner />
    </React.Suspense>
  );
}

function ShopPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") || "");

  React.useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiGet<Category[]>("/api/categories");
        setCategories(data || []);
        setError(null);
      } catch {
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  const handleCategoryClick = (cat: Category) => {
    router.push(`/shop/category/${cat.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:pt-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Shop by Category</h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Browse our catalogue of genuine spare parts by category. Find exactly what you need for your vehicle.</p>
        </div>

        <div className="flex items-center gap-4 max-w-2xl mx-auto mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <WhatsAppButton label="Help" className="h-14 px-6 shadow-lg shadow-green-500/20" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400">Loading categories...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{error}</h3>
            <Button variant="primary" onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No categories found</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCategories.map((cat, index) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img
                      src={cat.image_url || fallbackImage}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="px-6 py-3 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white font-semibold shadow-xl flex items-center gap-2">
                        Browse <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{cat.name}</h3>
                    {cat.product_count !== undefined && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{cat.product_count} products</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Shield, label: "Verified Fitment", color: "primary" },
                { icon: Truck, label: "Fast Delivery", color: "success" },
                { icon: Star, label: "Top Quality", color: "warning" },
                { icon: Shield, label: "Secure Payment", color: "primary" }
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className={`w-12 h-12 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
