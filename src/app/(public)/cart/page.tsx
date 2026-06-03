"use client";

import React from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Shield, Truck, RotateCcw } from "lucide-react";
import { LocalCartItem, getCart, removeFromCart, saveCart, updateQty } from "@/lib/cart";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export default function CartPage() {
  const [items, setItems] = React.useState<LocalCartItem[]>([]);

  React.useEffect(() => {
    setItems(getCart());
    const handler = () => setItems(getCart());
    window.addEventListener("cart_updated", handler);
    return () => window.removeEventListener("cart_updated", handler);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const whatsappMessage = items.length
    ? `Hello! I'd like to order:\n${items
        .map((item) => `- ${item.name} x${item.qty} (GHS ${item.price})`)
        .join("\n")}\nTotal: GHS ${total}`
    : "Hello! I need help with my cart.";

  const onDecrease = (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    if (current.qty <= 1) {
      removeFromCart(id);
      setItems(getCart());
      return;
    }
    updateQty(id, current.qty - 1);
    setItems(getCart());
  };

  const onIncrease = (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    updateQty(id, current.qty + 1);
    setItems(getCart());
  };

  const onRemove = (id: string) => {
    removeFromCart(id);
    setItems(getCart());
  };

  const onClear = () => {
    saveCart([]);
    setItems([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {items.length > 0 ? `${items.length} item${items.length !== 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md text-center">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              href="/shop"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="relative">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop"}
                        alt={item.name}
                        className="w-full sm:w-28 h-28 rounded-2xl object-cover shadow-md"
                      />
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                        {item.qty}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-snug mb-2">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                          <Shield className="w-3 h-3" /> Verified Fitment
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                          In Stock
                        </span>
                      </div>
                      <p className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                        GHS {item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                        <button
                          onClick={() => onDecrease(item.id)}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.qty}</span>
                        <button
                          onClick={() => onIncrease(item.id)}
                          className="w-10 h-10 rounded-lg bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-28 h-fit">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600 px-6 py-4">
                  <h2 className="text-lg font-bold text-white">Order Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal ({items.length} items)</span>
                    <span className="font-medium text-gray-900 dark:text-white">GHS {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {shipping === 0 ? "Free" : `GHS ${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">Add GHS {(500 - subtotal).toFixed(2)} more for free shipping!</p>
                    </div>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                        GHS {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="block w-full py-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-bold text-center shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    Proceed to Checkout
                  </Link>

                  <WhatsAppButton
                    label="Checkout via WhatsApp"
                    className="w-full h-12 justify-center"
                    message={whatsappMessage}
                  />
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Fast Delivery</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <RotateCcw className="w-5 h-5 text-purple-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Easy Returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
