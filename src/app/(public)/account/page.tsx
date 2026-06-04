"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Heart,
  Bell,
  Loader2,
  LogOut,
  Trash2,
  Plus,
  Package,
  X,
  Check,
  Mail,
  Phone,
  Home,
  Building,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete, getApiErrorMessage } from "@/lib/api";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import classNames from "classnames";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
};

type Address = {
  id: string;
  label?: string | null;
  recipient_name?: string | null;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  is_default: boolean;
};

type WishlistItem = {
  id: string;
  products: { id: string; name: string; price: number; image_url?: string | null };
};

type Notification = {
  id: string;
  title: string;
  body?: string | null;
  type?: string | null;
  read_at?: string | null;
  created_at: string;
};

type TabType = 'profile' | 'addresses' | 'wishlist' | 'notifications';

export default function AccountPage() {
  const router = useRouter();
  const { push } = useToast();
  const { isAuthenticated, clearAuth } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [addressForm, setAddressForm] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    postal_code: "",
    is_default: false
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, addressData, wishlistData, notificationsData] = await Promise.all([
        apiGet<Profile>("/api/users/me"),
        apiGet<Address[]>("/api/addresses"),
        apiGet<{ items: WishlistItem[] }>("/api/wishlist"),
        apiGet<Notification[]>("/api/notifications")
      ]);

      setProfile(profileData);
      setProfileForm({
        full_name: profileData.full_name || "",
        email: profileData.email || ""
      });
      setAddresses(addressData || []);
      setWishlist(wishlistData.items || []);
      setNotifications(notificationsData || []);
    } catch (err) {
      push(getApiErrorMessage(err), "error");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiPatch<Profile>("/api/users/me", profileForm);
      setProfile(res);
      push("Profile updated successfully", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiPost<Address>("/api/addresses", addressForm);
      setAddresses((prev) => [res, ...prev]);
      setAddressForm({
        label: "",
        recipient_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        region: "",
        postal_code: "",
        is_default: false
      });
      setShowAddressForm(false);
      push("Address saved successfully", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await apiDelete(`/api/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      push("Address removed", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const removeWishlistItem = async (id: string) => {
    try {
      await apiDelete(`/api/wishlist/items/${id}`);
      setWishlist((prev) => prev.filter((item) => item.id !== id));
      push("Removed from wishlist", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const markAllRead = async () => {
    try {
      const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
      if (ids.length === 0) return;
      await apiPost("/api/notifications/mark-read", { ids });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n))
      );
      push("All notifications marked as read", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const signOut = () => {
    clearAuth();
    push("Signed out successfully", "success");
    router.replace("/");
  };

  const unreadNotifications = notifications.filter((n) => !n.read_at).length;

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'addresses' as TabType, label: 'Addresses', icon: MapPin, count: addresses.length },
    { id: 'wishlist' as TabType, label: 'Wishlist', icon: Heart, count: wishlist.length },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell, badge: unreadNotifications }
  ];

  if (loading) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:pt-32">
          <PageLoading text="Loading your account..." />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:pt-32">
          <EmptyState
            title="Sign in required"
            description="Please sign in to access your account dashboard."
            action={
              <Link href="/login" className="btn-primary h-10 text-sm">
                Sign in
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 flex-shrink-0">
            <Card padding="sm" className="sticky top-24">
              <div className="flex items-center gap-4 p-4 border-b border-border">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl">
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>

              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={classNames(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <Badge variant="default" size="sm">{tab.count}</Badge>
                      )}
                      {tab.badge ? (
                        <Badge variant="destructive" size="sm">{tab.badge}</Badge>
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </Card>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <Card padding="lg" className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Profile Information</h2>
                    <p className="text-sm text-muted-foreground mt-1">Update your personal details</p>
                  </div>
                </div>

                <form onSubmit={updateProfile} className="space-y-5">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                      {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{profile.full_name}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <Badge variant="default" className="mt-2 capitalize">{profile.role}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4 animate-fade-in">
                <Card padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Saved Addresses</h2>
                      <p className="text-sm text-muted-foreground mt-1">Manage your delivery addresses</p>
                    </div>
                    {!showAddressForm && (
                      <Button onClick={() => setShowAddressForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    )}
                  </div>

                  {showAddressForm && (
                    <form onSubmit={addAddress} className="mb-6 p-5 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">New Address</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          placeholder="Label (e.g., Home, Office)"
                          value={addressForm.label}
                          onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                        />
                        <Input
                          placeholder="Recipient name"
                          value={addressForm.recipient_name}
                          onChange={(e) => setAddressForm((p) => ({ ...p, recipient_name: e.target.value }))}
                        />
                      </div>

                      <Input
                        placeholder="Phone number"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                      />

                      <Input
                        placeholder="Address line 1"
                        required
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm((p) => ({ ...p, address_line1: e.target.value }))}
                      />

                      <Input
                        placeholder="Address line 2 (optional)"
                        value={addressForm.address_line2}
                        onChange={(e) => setAddressForm((p) => ({ ...p, address_line2: e.target.value }))}
                      />

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Input
                          placeholder="City"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                        />
                        <Input
                          placeholder="Region"
                          value={addressForm.region}
                          onChange={(e) => setAddressForm((p) => ({ ...p, region: e.target.value }))}
                        />
                        <Input
                          placeholder="Postal code"
                          value={addressForm.postal_code}
                          onChange={(e) => setAddressForm((p) => ({ ...p, postal_code: e.target.value }))}
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm((p) => ({ ...p, is_default: e.target.checked }))}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Set as default address</span>
                      </label>

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          Save Address
                        </Button>
                        <Button variant="outline" type="button" onClick={() => setShowAddressForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No addresses saved yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => setShowAddressForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="group relative rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                {addr.label?.toLowerCase().includes('home') ? (
                                  <Home className="h-4 w-4 text-primary" />
                                ) : addr.label?.toLowerCase().includes('office') ? (
                                  <Building className="h-4 w-4 text-primary" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">{addr.label || 'Address'}</p>
                                {addr.is_default && <Badge variant="success" size="sm">Default</Badge>}
                              </div>
                            </div>
                            <button
                              onClick={() => removeAddress(addr.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                            <p>{addr.recipient_name || profile.full_name}</p>
                            <p>{addr.address_line1}</p>
                            {addr.address_line2 && <p>{addr.address_line2}</p>}
                            <p>{[addr.city, addr.region, addr.postal_code].filter(Boolean).join(', ')}</p>
                            {addr.phone && <p className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {addr.phone}
                            </p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <Card padding="lg" className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">My Wishlist</h2>
                    <p className="text-sm text-muted-foreground mt-1">{wishlist.length} saved items</p>
                  </div>
                  <Link href="/shop">
                    <Button variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Browse Products
                    </Button>
                  </Link>
                </div>

                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Your wishlist is empty</p>
                    <Link href="/shop">
                      <Button variant="outline" className="mt-4">
                        <Package className="h-4 w-4 mr-2" />
                        Start shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="group rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
                      >
                        <Link href={`/product/${item.products?.id}`} className="block">
                          <div className="aspect-square bg-muted/50">
                            {item.products?.image_url ? (
                              <img
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link href={`/product/${item.products?.id}`}>
                            <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                              {item.products?.name}
                            </h3>
                          </Link>
                          <p className="font-semibold text-lg mt-2">
                            GHS {item.products?.price?.toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Link href={`/product/${item.products?.id}`} className="flex-1">
                              <Button variant="primary" size="sm" className="w-full">
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWishlistItem(item.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Heart className="h-4 w-4 fill-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card padding="lg" className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {unreadNotifications > 0 ? `${unreadNotifications} unread` : 'All caught up'}
                    </p>
                  </div>
                  {unreadNotifications > 0 && (
                    <Button variant="outline" onClick={markAllRead}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark all as read
                    </Button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={classNames(
                          'rounded-xl border p-4 transition-all',
                          n.read_at
                            ? 'border-border bg-card'
                            : 'border-primary/20 bg-primary/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={classNames(
                            'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                            n.read_at ? 'bg-muted' : 'bg-primary/10'
                          )}>
                            <Bell className={classNames(
                              'h-5 w-5',
                              n.read_at ? 'text-muted-foreground' : 'text-primary'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{n.title}</p>
                              {!n.read_at && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            {n.body && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(n.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
