import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooterCTA } from "@/components/layout/PublicFooterCTA";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooterCTA />
    </div>
  );
}
