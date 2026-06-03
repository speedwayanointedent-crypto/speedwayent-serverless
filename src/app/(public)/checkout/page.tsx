"use client";

import React from "react";
import { CreditCard, Mail, MapPin, Phone, User, Shield, Truck, Lock, Check, Package, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { LocalCartItem, clearCart, getCart } from "@/lib/cart";
import { useRouter, Link } from "@/lib/navigation-compat";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function CheckoutPage() {
  return <CheckoutInner />;
}

function CheckoutInner() {
  const { push } = useToast();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = React.useState<LocalCartItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [addresses, setAddresses] = React.useState<{ id: string; label?: string | null; address_line1: string; is_default?: boolean }[]>([]);
  const [addressId, setAddressId] = React.useState("");
  const [couponCode, setCouponCode] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [applyingCoupon, setApplyingCoupon] = React.useState(false);

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });

  React.useEffect(() => {
    setItems(getCart());
    async function loadAddresses() {
      try {
        const data = await apiGet<{ id: string; label?: string | null; address_line1: string; is_default?: boolean }[]>("/api/addresses");
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        const defaultAddress = list.find((a) => a.is_default);
        if (defaultAddress) setAddressId(defaultAddress.id);
      } catch {
        setAddresses([]);
      }
    }
    loadAddresses();
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      push("Your cart is empty.", "error");
      return;
    }
    if (!isAuthenticated) {
      push("Please sign in to place an order.", "error");
      router.push("/login");
      return;
    }
    if (submitting) return;

    try {
      setSubmitting(true);
      const orderItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
        price: item.price
      }));
      await apiPost("/api/orders", {
        items: orderItems,
        total: grandTotal,
        coupon_code: couponCode || null,
        delivery_address_id: addressId || null,
        shipping_fee: shipping,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        delivery_address: formData.address,
        city: formData.city,
        notes: formData.notes
      });
      clearCart();
      push("Order placed successfully!", "success");
      router.push("/orders");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode || applyingCoupon) return;
    try {
      setApplyingCoupon(true);
      const res = await apiPost<{ discount: number }>("/api/coupons/validate", { code: couponCode, total: subtotal });
      setDiscount(res.discount || 0);
      push("Coupon applied!", "success");
    } catch (err) {
      setDiscount(0);
      push(getApiErrorMessage(err), "error");
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:pt-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
            <p className="text-gray-500 dark:text-gray-400">Complete your order</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Add items before checking out</p>
            <Link href="/shop" className="px-8 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
              Browse Products
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5" /> Contact Information
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                      <input
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                      <input
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="+233 XX XXX XXXX"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Delivery Address
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  {addresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saved Addresses</label>
                      <select
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={addressId}
                        onChange={(e) => setAddressId(e.target.value)}
                      >
                        <option value="">Select an address</option>
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>{addr.label || addr.address_line1}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                    <input
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City / Region</label>
                    <input
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Accra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Notes (Optional)</label>
                    <textarea
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Payment Method
                  </h2>
                </div>
                <div className="p-6">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-200">Cash on Delivery</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Pay when you receive your order</p>
                    </div>
                    <Check className="w-5 h-5 text-green-500 ml-auto" />
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Mobile Money payment options will be presented upon order confirmation
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28 h-fit">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                  <h2 className="text-lg font-bold text-white">Order Summary</h2>
                </div>
                <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image || "https://via.placeholder.com/60"} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.qty}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">GHS {(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">GHS {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                    <span className="font-medium text-gray-900 dark:text-white">{shipping === 0 ? "Free" : `GHS ${shipping}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">Discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">-GHS {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Coupon</span>
                    <div className="flex items-center gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Code"
                        className="h-9 w-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={applyingCoupon}
                        className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {applyingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">GHS {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Your payment is secure and encrypted</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Placing Order...
                      </span>
                    ) : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
