import { MongoClient, ObjectId, type Db, type Collection, type Document } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "speedway_anointed_ent";

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo(): Promise<Db> {
  if (db) return db;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (process.env.NODE_ENV === "development" && global._mongoDb) {
    db = global._mongoDb;
    return db;
  }

  if (!client) {
    client = process.env.NODE_ENV === "development" && global._mongoClient
      ? global._mongoClient
      : new MongoClient(MONGODB_URI, {
          maxPoolSize: 10,
          minPoolSize: 1,
          serverSelectionTimeoutMS: 5000,
        });
    if (process.env.NODE_ENV === "development") {
      global._mongoClient = client;
    }
    await client.connect();
  }

  db = client.db(DB_NAME);
  if (process.env.NODE_ENV === "development") {
    global._mongoDb = db;
  }
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("MongoDB not connected. Call connectToMongo() first.");
  }
  return db;
}

export async function getDBAsync(): Promise<Db> {
  if (db) return db;
  return await connectToMongo();
}

export function getCollection<T extends Document = any>(name: string): Collection<T> {
  return getDB().collection<T>(name);
}

export function toObjectId(id: string | ObjectId | null | undefined): ObjectId | string | null {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id !== "string") return id;
  if (/^[0-9a-f]{24}$/i.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

export const collections = {
  users: () => getCollection("users"),
  products: () => getCollection("products"),
  categories: () => getCollection("categories"),
  brands: () => getCollection("brands"),
  models: () => getCollection("models"),
  years: () => getCollection("years"),
  orders: () => getCollection("orders"),
  orderItems: () => getCollection("order_items"),
  orderStatusEvents: () => getCollection("order_status_events"),
  orderReturns: () => getCollection("order_returns"),
  coupons: () => getCollection("coupons"),
  couponRedemptions: () => getCollection("coupon_redemptions"),
  reviews: () => getCollection("reviews"),
  cart: () => getCollection("cart"),
  cartItems: () => getCollection("cart_items"),
  wishlist: () => getCollection("wishlist"),
  wishlistItems: () => getCollection("wishlist_items"),
  addresses: () => getCollection("addresses"),
  notifications: () => getCollection("notifications"),
  inventory: () => getCollection("inventory"),
  stockSubscriptions: () => getCollection("stock_subscriptions"),
  auditLogs: () => getCollection("audit_logs"),
  settings: () => getCollection("settings"),
  sales: () => getCollection("sales"),
};

export function serializeDoc<T extends Record<string, any>>(doc: T | null | undefined): (T & { id: string }) | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as any;
  return { id: _id?.toString() ?? "", ...rest } as any;
}

export function serializeDocs<T extends Record<string, any>>(docs: T[]): Array<T & { id: string }> {
  return docs.map((doc) => serializeDoc(doc) as T & { id: string });
}

export function normalizeOrder<T extends Record<string, any>>(doc: T | null | undefined): (T & { id: string; users?: { full_name?: string; email?: string } }) | null {
  if (!doc) return null;
  const { _id, user_data, ...rest } = doc as any;
  return {
    id: _id?.toString() ?? "",
    ...rest,
    users: user_data
      ? { full_name: user_data.full_name, email: user_data.email }
      : undefined,
  } as any;
}

export function normalizeOrders<T extends Record<string, any>>(docs: T[]): Array<T & { id: string; users?: { full_name?: string; email?: string } }> {
  return docs.map((doc) => normalizeOrder(doc) as T & { id: string; users?: { full_name?: string; email?: string } });
}

export function normalizeSale<T extends Record<string, any>>(doc: T | null | undefined): (T & { id: string; product_name?: string }) | null {
  if (!doc) return null;
  const { _id, product_data, ...rest } = doc as any;
  return {
    id: _id?.toString() ?? "",
    ...rest,
    product_name: rest.product_name || product_data?.name || null,
  } as any;
}

export function normalizeSales<T extends Record<string, any>>(docs: T[]): Array<T & { id: string; product_name?: string }> {
  return docs.map((doc) => normalizeSale(doc) as T & { id: string; product_name?: string });
}

export function normalizeAuditLog<T extends Record<string, any>>(doc: T | null | undefined): (T & { id: string; users?: { full_name?: string; email?: string } }) | null {
  if (!doc) return null;
  const { _id, user_data, ...rest } = doc as any;
  return {
    id: _id?.toString() ?? "",
    ...rest,
    users: user_data
      ? { full_name: user_data.full_name, email: user_data.email }
      : undefined,
  } as any;
}

export function normalizeAuditLogs<T extends Record<string, any>>(docs: T[]): Array<T & { id: string; users?: { full_name?: string; email?: string } }> {
  return docs.map((doc) => normalizeAuditLog(doc) as T & { id: string; users?: { full_name?: string; email?: string } });
}

export { ObjectId };
