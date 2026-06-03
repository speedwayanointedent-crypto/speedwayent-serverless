export type LocalCartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

const KEY = "cart_items";

function read(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: LocalCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart_updated"));
}

export const getCart = read;

export function saveCart(items: LocalCartItem[]) {
  write(items);
}

export function addToCart(item: LocalCartItem) {
  const items = read();
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    existing.qty += item.qty || 1;
  } else {
    items.push({ ...item, qty: item.qty || 1 });
  }
  write(items);
}

export function updateQty(id: string, qty: number) {
  const items = read();
  const it = items.find((i) => i.id === id);
  if (it) {
    it.qty = Math.max(1, qty);
    write(items);
  }
}

export function removeFromCart(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function clearCart() {
  write([]);
}

export function getCartCount(): number {
  return read().reduce((sum, i) => sum + i.qty, 0);
}
