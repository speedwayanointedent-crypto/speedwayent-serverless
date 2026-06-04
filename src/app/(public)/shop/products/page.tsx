"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { addToCart } from "@/lib/cart";
import { useToast } from "@/components/ui/Toast";
import { PageLoading } from "@/components/ui/LoadingSpinner";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  status: string;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string; image_url?: string | null };
  years?: { id: string; label: string };
};

type Category = { id: string; name: string };
type Brand = { id: string; name: string; logo_url?: string | null };
type Model = { id: string; name: string; image_url?: string | null; years?: string[] };

const PRODUCTS_PER_PAGE = 24;

function ShopProductsPageInner() {
  const params = useParams<{ modelId?: string }>();
  const modelId = params?.modelId;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [category, setCategory] = React.useState<Category | null>(null);
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [model, setModel] = React.useState<Model | null>(null);
  const { push } = useToast();

  const categoryId = searchParams.get("category");
  const brandId = searchParams.get("brand");
  const pageNum = parseInt(searchParams.get("page") || "1");

  const loadProducts = React.useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(pageNum),
        limit: String(PRODUCTS_PER_PAGE)
      };
      if (categoryId) params.category_id = categoryId;
      if (brandId) params.brand_id = brandId;
      if (modelId) params.model_id = modelId;
      if (query) params.q = query;

      const res = await apiGet<{ data: Product[]; pagination: { page: number; totalPages: number; total: number } }>("/api/products", { params });
      setProducts(res.data || []);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalProducts(res.pagination.total || 0);
      setPage(pageNum);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, brandId, modelId, query]);

  React.useEffect(() => {
    async function loadBreadcrumbs() {
      try {
        const [catRes, brandRes, modelRes] = await Promise.all([
          (categoryId && categoryId !== "undefined" && categoryId !== "null") ? apiGet<Category>(`/api/categories/${categoryId}`) : Promise.resolve(null),
          brandId ? apiGet<Brand>(`/api/brands/${brandId}`) : Promise.resolve(null),
          modelId ? apiGet<Model>(`/api/models/${modelId}`) : Promise.resolve(null)
        ]);
        setCategory(catRes);
        setBrand(brandRes);
        setModel(modelRes);
      } catch {
        // ignore
      }
    }
    loadBreadcrumbs();
    loadProducts(pageNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, brandId, modelId, pageNum]);

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (brandId) params.set("brand", brandId);
    params.set("page", "1");
    router.push(`/shop/products?${params.toString()}`);
    loadProducts(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/shop/products?${params.toString()}`);
      loadProducts(newPage);
    }
  };

  const getBackUrl = () => {
    return `/shop/brand/${brandId}?category=${categoryId}`;
  };

  const getProductImage = (product: Product): string | null => {
    if (product.model_id && product.models?.image_url) {
      return product.models.image_url;
    }
    if (product.image_url) {
      return product.image_url;
    }
    if (model?.image_url) {
      return model.image_url;
    }
    return null;
  };

  return (
    <div className="page-shell">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.push(getBackUrl())}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {brand?.name || "Brand"}
          </button>
        </div>

        <section className="section-band rounded-2xl p-4 sm:p-6">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-4">
              {model?.image_url && (
                <img src={model.image_url} alt={model.name} className="h-16 w-16 rounded-lg object-cover" />
              )}
              <div>
                <PageHeader
                  title={model?.name || "Products"}
                  subtitle={
                    [category?.name, brand?.name, model?.name]
                      .filter(Boolean)
                      .join(" → ") + ` (${totalProducts} products)`
                  }
                  actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,0.5fr))]">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing <span className="font-semibold text-foreground">{products.length}</span> of{" "}
                <span className="font-semibold text-foreground">{totalProducts}</span> products
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <PageLoading text="Loading products..." />
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
              <div className="text-base font-semibold text-foreground">No products found</div>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => {
                  const productImage = getProductImage(p);
                  return (
                    <div key={p.id} className="card card-hover p-4">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={p.name}
                          className="h-36 w-full rounded-lg object-cover sm:h-40"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center rounded-lg bg-muted sm:h-40">
                          <span className="text-sm text-muted-foreground">No image</span>
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground">
                          {p.brands?.name} {p.models?.name && `- ${p.models.name}`} {p.years?.label && `- ${p.years.label}`}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                          {p.name}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold">GHS {p.price.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.status === "active" ? "In stock" : "Unavailable"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <button
                            className="btn-outline flex-1 text-center text-sm"
                            onClick={() => {
                              addToCart({
                                id: p.id,
                                name: p.name,
                                price: p.price,
                                qty: 1,
                                image: productImage || ""
                              });
                              push("Added to cart", "success");
                            }}
                          >
                            <ShoppingCart className="mr-1 h-4 w-4" />
                            Add
                          </button>
                          <Link
                            href={`/product/${p.id}`}
                            className="btn-primary flex-1 text-center text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    className="btn-outline h-10 w-10 p-0"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm">
                    Page <span className="font-semibold">{page}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <button
                    className="btn-outline h-10 w-10 p-0"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ShopProductsPage() {
  return (
    <React.Suspense fallback={<div className="p-8">Loading...</div>}>
      <ShopProductsPageInner />
    </React.Suspense>
  );
}
