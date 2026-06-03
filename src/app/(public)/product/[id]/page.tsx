"use client";

import React from "react";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, CheckCircle2, Heart, ShoppingCart, ChevronLeft, ChevronRight, X, Star, Minus, Plus, Package, Video } from "lucide-react";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { addToCart } from "@/lib/cart";

type GalleryItem = { url: string; type: "image" | "video" };

type Product = {
  id: string; name: string; description?: string | null; price: number; quantity: number;
  image_url?: string | null; category_id?: string | null; brand_id?: string | null;
  model_id?: string | null; year_id?: string | null;
  gallery?: GalleryItem[];
  categories?: { name: string }; brands?: { name: string };
  models?: { name: string; image_url?: string | null; gallery?: string[] };
  years?: { id: string; label: string };
};

type Review = { id: number; rating: number; title?: string | null; body: string; created_at: string; users?: { full_name?: string | null } };

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200";

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductDetailsInner id={id} />;
}

function ProductDetailsInner({ id }: { id: string }) {
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recommended, setRecommended] = React.useState<Product[]>([]);
  const [recommendedLoading, setRecommendedLoading] = React.useState(true);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = React.useState(true);
  const [galleryLightbox, setGalleryLightbox] = React.useState<{ index: number; items: GalleryItem[] } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [reviewForm, setReviewForm] = React.useState({ rating: 5, title: "", body: "" });
  const [wishlistBusy, setWishlistBusy] = React.useState(false);
  const [subscribeBusy, setSubscribeBusy] = React.useState(false);
  const [qty, setQty] = React.useState(1);
  const { push } = useToast();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthed(Boolean(window.localStorage.getItem("auth_token")));
    }
  }, []);

  React.useEffect(() => {
    async function load() {
      try {
        const prod = await apiGet<Product>(`/api/products/${id}`);
        setProduct(prod);
        setActiveImageIndex(0);

        const [recRes, revRes] = await Promise.all([
          apiGet<{ data: Product[] }>("/api/products?limit=10").catch(() => ({ data: [] } as any)),
          apiGet<Review[]>(`/api/reviews/product/${prod.id}`).catch(() => [] as any)
        ]);

        const all = (recRes as any)?.data || [];
        const filtered = all.filter((p: Product) => p.id !== prod.id).slice(0, 4);
        setRecommended(filtered);
        setReviews(revRes || []);
      } catch (err) {
        console.error("Failed to load product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
        setRecommendedLoading(false);
        setReviewLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const addItemToCart = () => {
    if (!product) return;
    const img = product.model_id ? (product.models?.image_url || "") : (product.image_url || "");
    addToCart({ id: product.id, name: product.name, price: product.price, qty, image: img });
    push(`${qty} item${qty > 1 ? 's' : ''} added to cart`, "success");
  };

  const addToWishlist = async () => {
    if (!product) return;
    if (!isAuthed) { push("Please sign in to save to wishlist", "error"); return; }
    if (wishlistBusy) return;
    try {
      setWishlistBusy(true);
      await apiPost("/api/wishlist/items", { product_id: product.id });
      push("Added to wishlist", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setWishlistBusy(false);
    }
  };

  const notifyWhenInStock = async () => {
    if (!product) return;
    if (!isAuthed) { push("Please sign in to get alerts", "error"); return; }
    if (subscribeBusy) return;
    try {
      setSubscribeBusy(true);
      await apiPost("/api/stock-subscriptions", { product_id: product.id });
      push("We'll notify you when it's back", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubscribeBusy(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isAuthed) { push("Please sign in to leave a review", "error"); return; }
    try {
      const res = await apiPost<Review>("/api/reviews", { product_id: product.id, rating: reviewForm.rating, title: reviewForm.title || null, body: reviewForm.body });
      setReviews(prev => [res, ...prev]);
      setReviewForm({ rating: 5, title: "", body: "" });
      push("Thanks for your review!", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const productImage = product?.model_id ? product.models?.image_url : product?.image_url;

  const galleryItems: GalleryItem[] = React.useMemo(() => {
    if (!product) return [];
    const items: GalleryItem[] = [];
    const seen = new Set<string>();

    const addItem = (url: string | null | undefined, type: "image" | "video") => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({ url, type });
    };

    const mainImg = product.model_id ? product.models?.image_url : product.image_url;
    addItem(mainImg, "image");

    if (Array.isArray(product.gallery)) {
      for (const item of product.gallery) {
        if (item?.url) addItem(item.url, item.type || "image");
      }
    }

    if (product.models?.gallery && Array.isArray(product.models.gallery)) {
      for (const url of product.models.gallery) {
        addItem(url, "image");
      }
    }

    if (product.image_url && !seen.has(product.image_url)) {
      addItem(product.image_url, "image");
    }

    return items;
  }, [product]);

  const displayItem = galleryItems[activeImageIndex] || null;
  const displayImage = displayItem?.url || productImage;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:pt-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
        ) : !product ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Product not found</h3>
              <Link href="/shop" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg font-medium">Browse Shop</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    {displayItem ? (
                      displayItem.type === "video" ? (
                        <video
                          src={displayItem.url}
                          className="w-full h-full object-contain"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img src={displayItem.url} alt={product.name} className="w-full h-full object-contain p-4" />
                      )
                    ) : displayImage ? (
                      <img src={displayImage} alt={product.name} className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-20 h-20 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>

                  {galleryItems.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(prev => prev === 0 ? galleryItems.length - 1 : prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(prev => prev === galleryItems.length - 1 ? 0 : prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 active:scale-95 transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </>
                  )}

                  {galleryItems.length > 1 && (
                    <button
                      onClick={() => setGalleryLightbox({ index: activeImageIndex, items: galleryItems })}
                      className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                      aria-label="View full size"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                  )}

                  {galleryItems.length > 1 && (
                    <div className="absolute bottom-3 right-3">
                      <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                        {activeImageIndex + 1} / {galleryItems.length}
                      </span>
                    </div>
                  )}

                  {displayItem?.type === "video" && (
                    <div className="absolute left-4 top-4">
                      <span className="px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Video
                      </span>
                    </div>
                  )}
                  {product.quantity <= 5 && product.quantity > 0 && displayItem?.type !== "video" && (
                    <div className="absolute left-4 top-4">
                      <span className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-bold shadow-lg">Only {product.quantity} left</span>
                    </div>
                  )}
                </div>

                {galleryItems.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {galleryItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all ${
                          idx === activeImageIndex
                            ? "border-primary shadow-md shadow-primary/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        {item.type === "video" ? (
                          <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                                <Video className="w-3.5 h-3.5 text-gray-800" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img src={item.url} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                        {idx === activeImageIndex && (
                          <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded-xl" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.categories?.name && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{product.categories.name}</span>}
                      {product.brands?.name && <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">{product.brands.name}</span>}
                      {product.models?.name && <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">{product.models.name}</span>}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h1>
                  </div>
                  <button onClick={addToWishlist} disabled={wishlistBusy} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                <p className="mt-4 text-gray-600 dark:text-gray-300">{product.description || "Premium spare part ready to ship."}</p>

                <div className="mt-6 flex items-center gap-4">
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">GHS {product.price.toLocaleString()}</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${product.quantity > 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
                    {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                {product.quantity > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                    <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 shadow flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-500"><Minus className="w-4 h-4" /></button>
                      <span className="w-12 text-center font-bold text-lg text-gray-900 dark:text-white">{qty}</span>
                      <button onClick={() => setQty(Math.min(product.quantity, qty + 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 shadow flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-500"><Plus className="w-4 h-4" /></button>
                    </div>
                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">Max: {product.quantity}</span>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {[
                    { icon: CheckCircle2, text: "Verified fitment for your vehicle" },
                    { icon: Truck, text: "Fast delivery across Ghana" },
                    { icon: ShieldCheck, text: "Quality checked before dispatch" }
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Icon className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
                      {text}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  {product.quantity > 0 ? (
                    <button onClick={addItemToCart} className="flex-1 h-14 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
                      <span className="flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5" /> Add to Cart</span>
                    </button>
                  ) : (
                    <button onClick={notifyWhenInStock} disabled={subscribeBusy} className="flex-1 h-14 rounded-xl bg-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {subscribeBusy ? "Subscribing..." : "Notify When Available"}
                    </button>
                  )}
                  <button onClick={() => router.push("/checkout")} className="flex-1 h-14 rounded-xl bg-primary text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]">
                    Buy Now
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Truck className="w-5 h-5 text-primary" />
                    <span>Same-day dispatch for orders before 3pm</span>
                  </div>
                </div>
              </div>
            </div>

            {recommended.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">You May Also Like</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {recommended.map((item) => {
                    const img = item.model_id ? item.models?.image_url : item.image_url;
                    return (
                      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:-translate-y-1">
                        <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                          {img ? <img src={img} alt={item.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Package className="w-12 h-12 text-gray-300" /></div>}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.categories?.name}</p>
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{item.name}</h3>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="font-bold text-lg text-gray-900 dark:text-white">GHS {item.price.toLocaleString()}</p>
                            <span className={`text-xs font-medium ${item.quantity > 0 ? "text-green-600" : "text-red-500"}`}>{item.quantity > 0 ? "In Stock" : "Out"}</span>
                          </div>
                            <button onClick={() => { addToCart({ id: item.id, name: item.name, price: item.price, qty: 1, image: img || "" }); push("Added to cart", "success"); }} className="mt-3 w-full py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">Add to Cart</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customer Reviews</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                  {reviewLoading ? (
                    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet. Be the first!</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(r => (
                        <div key={r.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{r.users?.full_name || "Customer"}</span>
                            <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />)}
                          </div>
                          {r.title && <p className="font-medium text-gray-800 dark:text-gray-200">{r.title}</p>}
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Write a Review</h3>
                  <form onSubmit={submitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                      <div className="flex items-center gap-2">
                        {[5,4,3,2,1].map(v => (
                          <button key={v} type="button" onClick={() => setReviewForm(prev => ({ ...prev, rating: v }))} className="p-1">
                            <Star className={`w-8 h-8 ${v <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input value={reviewForm.title} onChange={e => setReviewForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Review title (optional)" className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <textarea value={reviewForm.body} onChange={e => setReviewForm(prev => ({ ...prev, body: e.target.value }))} placeholder="Write your review..." rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity">Submit Review</button>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {galleryLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setGalleryLightbox(null)}>
          <button className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" onClick={() => setGalleryLightbox(null)}><X className="w-6 h-6" /></button>
          {galleryLightbox.items.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 z-10" onClick={e => { e.stopPropagation(); setGalleryLightbox(li => li ? { ...li, index: li.index === 0 ? li.items.length - 1 : li.index - 1 } : null); }}><ChevronLeft className="w-10 h-10" /></button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 z-10" onClick={e => { e.stopPropagation(); setGalleryLightbox(li => li ? { ...li, index: li.index === li.items.length - 1 ? 0 : li.index + 1 } : null); }}><ChevronRight className="w-10 h-10" /></button>
            </>
          )}
          {galleryLightbox.items[galleryLightbox.index]?.type === "video" ? (
            <video
              src={galleryLightbox.items[galleryLightbox.index].url}
              className="max-h-[85vh] max-w-[90vw]"
              controls
              autoPlay
              playsInline
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={galleryLightbox.items[galleryLightbox.index]?.url}
              alt={`Gallery ${galleryLightbox.index + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={e => e.stopPropagation()}
            />
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full bg-black/60 px-6 py-3 text-white">
            <span className="text-sm font-medium">{galleryLightbox.index + 1} / {galleryLightbox.items.length}</span>
            {galleryLightbox.items[galleryLightbox.index]?.type === "video" && (
              <span className="flex items-center gap-1.5 text-xs bg-purple-600 px-2 py-1 rounded-full">
                <Video className="w-3 h-3" /> Video
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
