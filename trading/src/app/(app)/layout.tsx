import { AppProvider } from "@/lib/app-context";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="pb-24">{children}</div>
      <BottomNav />
    </AppProvider>
  );
}
