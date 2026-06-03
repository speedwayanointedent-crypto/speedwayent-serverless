import { collections } from "@/lib/mongodb";

export async function aggregateSales(from: string | Date, to: string | Date) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const [orderAgg, shopSales] = await Promise.all([
    collections
      .orders()
      .find({
        created_at: { $gte: fromDate, $lte: toDate },
        status: "completed",
      })
      .project({ total: 1, created_at: 1 })
      .toArray(),
    collections
      .sales()
      .find({
        created_at: { $gte: fromDate, $lte: toDate },
      })
      .project({ total: 1, quantity: 1, created_at: 1 })
      .toArray(),
  ]);

  const revenue =
    orderAgg.reduce((sum: number, o: any) => sum + (o.total || 0), 0) +
    shopSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

  const itemsSold = shopSales.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

  return { revenue, itemsSold };
}
