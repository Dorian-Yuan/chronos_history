import { useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useUIStore } from "@/stores";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const setIsMobile = useUIStore((s) => s.setIsMobile);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobile]);

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-bg-primary text-text-primary noise-bg ink-wash">
      {!isMobile && <Sidebar />}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-sidebar glass-subtle animate-fade-in"
            onClick={() => useUIStore.getState().setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-header h-full w-72 animate-slide-in-left">
            <Sidebar />
          </div>
        </>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-auto ${isMobile ? "pb-16" : ""}`}>
          {children}
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
}
