import { useLocation } from "wouter";
import { Home, LayoutGrid, ClipboardList, MessageCircle, LayoutDashboard } from "lucide-react";
import { getOffers } from "@/lib/requests-store";
import { useAuth } from "@/contexts/auth-context";

const tabs = [
  { label: "Bosh sahifa", icon: Home, href: "/landing-page" },
  { label: "Kategoriyalar", icon: LayoutGrid, href: "/questionnaire" },
  { label: "So'rovlarim", icon: ClipboardList, href: "/my-requests" },
  { label: "Suhbatlarim", icon: MessageCircle, href: "/chat-offers" },
  { label: "Profil", icon: LayoutDashboard, href: "/dashboard" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const pendingOffers = getOffers().filter((o) => o.status === "pending").length;

  function isActive(href: string): boolean {
    if (href === "/") return location === "/";
    if (href === "/chat-offers") return location.startsWith("/chat-offers") || location.startsWith("/chat/");
    if (href === "/questionnaire") return location.startsWith("/questionnaire");
    if (href === "/dashboard") return location.startsWith("/dashboard");
    return location.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const showBadge = tab.href === "/chat-offers" && pendingOffers > 0;
          return (
            <button
              key={tab.label}
              onClick={() => setLocation(tab.href)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-colors ${
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <tab.icon className={`w-5 h-5 transition-all ${active ? "scale-110" : ""}`} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingOffers > 9 ? "9+" : pendingOffers}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? "text-blue-600" : ""}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
