"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { PageLoading } from "@/components/ui/LoadingSpinner";

type Receipt = {
  id: number;
  created_at: string;
  total: number;
  subtotal?: number | null;
  discount_total?: number | null;
  coupon_code?: string | null;
  users?: { full_name?: string | null; email?: string | null };
  order_items?: { id: number; quantity: number; price: number; total: number; products?: { name: string } }[];
};

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <InvoiceInner id={id} />;
}

function InvoiceInner({ id }: { id: string }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<Receipt>(`/api/orders/${id}/receipt`);
        setReceipt(data);
      } catch {
        setReceipt(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        {loading ? (
          <PageLoading text="Loading receipt..." />
        ) : !receipt ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Receipt not found.
          </div>
        ) : (
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Receipt</h1>
                <p className="text-xs text-muted-foreground">
                  Order #{receipt.id.toString().padStart(4, "0")} •{" "}
                  {new Date(receipt.created_at).toLocaleDateString()}
                </p>
              </div>
              <button className="btn-outline h-9 text-sm" onClick={() => window.print()}>
                Print / Save PDF
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide">Billed to</p>
                <p className="mt-2 text-foreground">
                  {receipt.users?.full_name || "Customer"}
                </p>
                <p>{receipt.users?.email || ""}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Summary</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>GHS {Number(receipt.subtotal || receipt.total).toLocaleString()}</span>
                  </div>
                  {receipt.discount_total ? (
                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span>- GHS {Number(receipt.discount_total).toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>Total</span>
                    <span>GHS {Number(receipt.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(receipt.order_items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.products?.name || "Item"}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right font-semibold">
                        GHS {Number(item.total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link href="/orders" className="btn-primary mt-6 h-10 text-sm">
              Back to orders
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
