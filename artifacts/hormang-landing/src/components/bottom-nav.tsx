import { useLocation } from "wouter";
import { Home, LayoutGrid, ClipboardList, MessageCircle, LayoutDashboard, Sparkles, List } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getOffers } from "@/lib/requests-store";
import { getTotalUnread, getUnseenRequests } from "@/lib/provider-store";
import { useToast } from "@/hooks/use-toast";

const BUYER_TABS = [
  { label: "Bosh sahifa", icon: Home, href: "/" },
  { label: "Kategoriyalar", icon: LayoutGrid, href: "/questionnaire" },
  { label: "So'rovlarim", icon: ClipboardList, href: "/my-requests" },
  { label: "Suhbatlarim", icon: MessageCircle, href: "/chat-offers" },
  { label: "Profil", icon: LayoutDashboard, href: "/dashboard" },
];

const PROVIDER_TABS = [
  { label: "Bosh sahifa", icon: Home, href: "/provider-home", disabled: false },
  { label: "So'rovlar", icon: List, href: "/provider/requests", disabled: false },
  { label: "Smart", icon: Sparkles, href: "/smart", disabled: true },
  { label: "Suhbatlar", icon: MessageCircle, href: "/provider/chats", disabled: false },
  { label: "Profil", icon: LayoutDashboard, href: "/dashboard", disabled: false },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { user, activeRole, providerProfile } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const isProvider = activeRole === "provider";
  const selectedCategories = providerProfile?.categories ?? [];

  const pendingOffers = getOffers().filter((o) => o.status === "pending").length;
  const unseenCount = isProvider ? getUnseenRequests(selectedCategories).length : 0;
  const unreadChats = isProvider ? getTotalUnread() : 0;

  function isActive(href: string): boolean {
    if (href === "/") return location === "/";
    if (href === "/provider-home") return location === "/provider-home" || location === "/";
    if (href === "/chat-offers") return location.startsWith("/chat-offers") || location.startsWith("/chat/");
    if (href === "/provider/chats") return location.startsWith("/provider/chats") || location.startsWith("/provider/chat/");
    if (href === "/provider/requests") return location.startsWith("/provider/requests");
    if (href === "/questionnaire") return location.startsWith("/questionnaire");
    if (href === "/dashboard") return location.startsWith("/dashboard");
    if (href === "/my-requests") return location.startsWith("/my-requests");
    return location.startsWith(href);
  }

  function getBadge(href: string): number {
    if (!isProvider && href === "/chat-offers") return pendingOffers;
    if (isProvider && href === "/provider/requests") return unseenCount;
    if (isProvider && href === "/provider/chats") return unreadChats;
    return 0;
  }

  const tabs = isProvider ? PROVIDER_TABS : BUYER_TABS;
  const activeColor = isProvider ? "#7C3AED" : "#2563EB";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const badge = getBadge(tab.href);
          const disabled = "disabled" in tab && tab.disabled;

          return (
            <button
              key={tab.label}
              onClick={() => {
                if (disabled) {
                  toast({ title: "Tez orada mavjud bo'ladi", description: "Smart-Hormang hozircha ishlab chiqilmoqda" });
                  return;
                }
                setLocation(tab.href);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-colors ${
                disabled
                  ? "text-gray-300 cursor-default"
                  : active
                  ? "text-[var(--tab-color)]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              style={{ "--tab-color": activeColor } as React.CSSProperties}
            >
              <div className="relative">
                <tab.icon className={`w-5 h-5 transition-all ${active && !disabled ? "scale-110" : ""}`} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active && !disabled ? "text-[var(--tab-color)]" : ""}`}
                style={{ color: active && !disabled ? activeColor : undefined }}>
                {tab.label}
              </span>
              {active && !disabled && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: activeColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
