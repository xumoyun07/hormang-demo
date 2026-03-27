import { useLocation } from "wouter";
import { Home, ClipboardList, Briefcase, MessageCircle, User } from "lucide-react";
import { getLatestChatId, getOffers } from "@/lib/requests-store";

const tabs = [
  { label: "Bosh sahifa", icon: Home, href: "/dashboard" },
  { label: "So'rovlarim", icon: ClipboardList, href: "/my-requests" },
  { label: "Takliflar", icon: Briefcase, href: "/offers" },
  { label: "Chat", icon: MessageCircle, href: "__chat__" },
  { label: "Profil", icon: User, href: "/profile/settings" },
];

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const pendingOffers = getOffers().filter((o) => o.status === "pending").length;

  function handleTab(href: string) {
    if (href === "__chat__") {
      const chatId = getLatestChatId();
      setLocation(chatId ? `/chat/${chatId}` : "/my-requests");
    } else {
      setLocation(href);
    }
  }

  function isActive(href: string): boolean {
    if (href === "__chat__") return location.startsWith("/chat/");
    if (href === "/dashboard") return location === "/dashboard";
    return location.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const showBadge = tab.href === "/offers" && pendingOffers > 0;
          return (
            <button
              key={tab.label}
              onClick={() => handleTab(tab.href)}
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
