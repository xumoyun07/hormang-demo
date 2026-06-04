import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ClipboardList, Search, Star, TrendingUp, Wallet, CheckCircle2,
  ChevronRight, ChevronLeft, MapPin, Repeat, BadgeCheck, MessageSquare, BarChart3,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { CategoryIcon } from "@/components/category-icon";
import { useAuth } from "@/contexts/auth-context";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { useI18n } from "@/contexts/i18n-context";
import { tFormat } from "@/lib/i18n";
import { formatDate } from "@/lib/date-utils";
import { getCategoryDisplayName } from "@/lib/categories";
import { getRequestLocation } from "@/lib/regions";
import { getReviewsForUser, type Review } from "@/lib/completion-store";
import {
  getProviderHistory,
  getProviderHistoryStats,
  type ServiceHistory,
} from "@/lib/service-history-store";

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";
const PAGE_SIZE = 20;

type Tab = "history" | "reviews" | "stats";

function StatChip({
  icon: Icon, label, value,
}: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur px-3 py-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-white/80">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-white font-black text-base leading-none">{value}</span>
    </div>
  );
}

function HistoryCard({ item, index, onOpen }: { item: ServiceHistory; index: number; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const tt = t.providerHistory;
  const location = (item.region || item.district)
    ? getRequestLocation({ location: item.locationName ?? "", region: item.region, district: item.district }, locale)
    : null;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 card-shadow p-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <CategoryIcon categoryId={item.categoryId} emoji={item.emoji} size={46} shape="square" className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-sm text-gray-900 leading-snug truncate">
              {getCategoryDisplayName(item.categoryId, locale, item.serviceTitle)}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" />
              {tt.card.completed}
            </span>
          </div>
          {item.customerName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.customerName}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(item.completedAt, { months: t.shared.months })}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
          <Wallet className="w-3 h-3 inline mr-1" />
          {Number(item.finalPrice).toLocaleString()} {tt.sumSuffix}
        </span>
        {typeof item.rating === "number" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {item.rating.toFixed(1)}
          </span>
        )}
        {item.isRepeatCustomer && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <Repeat className="w-3 h-3" />
            {tt.repeatCustomer}
          </span>
        )}
        {item.isPortfolio && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100">
            <BadgeCheck className="w-3 h-3" />
            {tt.portfolioBadge}
          </span>
        )}
        {location && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <MapPin className="w-3 h-3" />
            {location}
          </span>
        )}
      </div>
    </motion.button>
  );
}

function ReviewRow({ review, onOpen }: { review: Review; onOpen: () => void }) {
  const { t, locale } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 card-shadow p-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <StarRating rating={review.rating} />
        <span className="text-xs text-gray-400">{formatDate(review.createdAt, { months: t.shared.months })}</span>
        {review.serviceCategory && (
          <span className="ml-auto text-[11px] font-bold text-violet-600">
            {getCategoryDisplayName(review.serviceCategory, locale)}
          </span>
        )}
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-2">{review.comment}</p>
      )}
    </button>
  );
}

export default function ProviderHistoryPage() {
  useStoreRefresh();
  const { t, locale } = useI18n();
  const tt = t.providerHistory;
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const providerId = user?.id ?? "";

  const [tab, setTab] = useState<Tab>("history");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const history = useMemo(() => getProviderHistory(providerId), [providerId]);
  const stats = useMemo(() => getProviderHistoryStats(providerId), [providerId]);
  const reviews = useMemo(
    () => getReviewsForUser(providerId, "provider").sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [providerId]
  );

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of history) if (!map.has(h.categoryId)) map.set(h.categoryId, h.categoryName);
    return Array.from(map.entries());
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (categoryFilter !== "all" && h.categoryId !== categoryFilter) return false;
      if (!debounced) return true;
      const hay = [
        getCategoryDisplayName(h.categoryId, locale, h.serviceTitle),
        h.customerName ?? "",
        h.serviceDescription,
      ].join(" ").toLowerCase();
      return hay.includes(debounced);
    });
  }, [history, categoryFilter, debounced, locale]);

  useEffect(() => { setPage(1); }, [debounced, categoryFilter, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ── Header + stats ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/provider")}
            className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-gray-900 text-lg">{tt.title}</h1>
            <p className="text-xs text-gray-400">{tFormat(tt.subtitleTpl, { n: history.length })}</p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="rounded-3xl p-4 mb-4" style={{ background: VIOLET }}>
          <div className="grid grid-cols-2 gap-2.5">
            <StatChip icon={CheckCircle2} label={tt.stats.totalCompleted} value={String(stats.totalCompleted)} />
            <StatChip icon={Star} label={tt.stats.avgRating} value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"} />
            <StatChip icon={Wallet} label={tt.stats.totalEarnings} value={`${stats.totalEarnings.toLocaleString()}`} />
            <StatChip icon={TrendingUp} label={tt.stats.successRate} value={`${stats.successRate}%`} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl mb-4">
          {([
            { id: "history" as Tab, label: tt.tabs.history, icon: ClipboardList },
            { id: "reviews" as Tab, label: tt.tabs.reviews, icon: MessageSquare },
            { id: "stats" as Tab, label: tt.tabs.stats, icon: BarChart3 },
          ]).map((tabDef) => {
            const Icon = tabDef.icon;
            const active = tab === tabDef.id;
            return (
              <button
                key={tabDef.id}
                onClick={() => setTab(tabDef.id)}
                className={`flex-1 h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors ${
                  active ? "bg-white text-violet-700 shadow-sm" : "text-gray-500"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tabDef.label}
              </button>
            );
          })}
        </div>

        {/* ── History tab ── */}
        {tab === "history" && (
          <>
            {history.length > 0 && (
              <div className="space-y-2.5 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tt.search.placeholder}
                    className="w-full h-11 pl-9 pr-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-violet-400"
                  />
                </div>
                {categories.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className={`flex-shrink-0 px-3 h-8 rounded-full text-xs font-bold border transition-colors ${
                        categoryFilter === "all"
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {tt.filter.all}
                    </button>
                    {categories.map(([id, name]) => (
                      <button
                        key={id}
                        onClick={() => setCategoryFilter(id)}
                        className={`flex-shrink-0 px-3 h-8 rounded-full text-xs font-bold border transition-colors ${
                          categoryFilter === id
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {getCategoryDisplayName(id, locale, name)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {history.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="w-8 h-8 text-violet-400" />}
                title={tt.empty.title}
                desc={tt.empty.desc}
                cta={tt.empty.cta}
                onCta={() => navigate("/provider/requests")}
              />
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-400">{tt.noResults}</div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pageItems.map((item, i) => (
                      <HistoryCard
                        key={item.id}
                        item={item}
                        index={i}
                        onOpen={() => navigate(`/provider/history/${item.id}`)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-gray-600">
                      {tFormat(tt.pagination.pageTpl, { page, total: totalPages })}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-10 h-10 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Reviews tab ── */}
        {tab === "reviews" && (
          reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-violet-400" />}
              title={tt.reviewsEmpty.title}
              desc={tt.reviewsEmpty.desc}
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewRow key={review.id} review={review} onOpen={() => navigate("/provider-reviews")} />
              ))}
              <Button
                variant="outline"
                className="w-full h-11 font-bold border-violet-200 text-violet-700"
                onClick={() => navigate("/provider-reviews")}
              >
                {tt.viewAllReviews}
              </Button>
            </div>
          )
        )}

        {/* ── Stats tab ── */}
        {tab === "stats" && (
          <div className="space-y-3">
            <StatRow label={tt.stats.totalCompleted} value={String(stats.totalCompleted)} />
            <StatRow label={tt.stats.totalEarnings} value={`${stats.totalEarnings.toLocaleString()} ${tt.sumSuffix}`} />
            <StatRow label={tt.stats.thisMonth} value={`${stats.thisMonthEarnings.toLocaleString()} ${tt.sumSuffix}`} />
            <StatRow label={tt.stats.avgRating} value={stats.averageRating > 0 ? stats.averageRating.toFixed(2) : "—"} />
            <StatRow label={tt.stats.successRate} value={`${stats.successRate}%`} />
            <StatRow label={tt.stats.repeatCustomers} value={String(stats.repeatCustomers)} />
            <StatRow
              label={tt.stats.popularCategory}
              value={stats.mostPopularCategoryId
                ? getCategoryDisplayName(stats.mostPopularCategoryId, locale, stats.mostPopularCategoryName ?? "")
                : "—"}
            />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 card-shadow px-4 py-3.5 flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <span className="text-sm font-black text-gray-900 text-right">{value}</span>
    </div>
  );
}

function EmptyState({
  icon, title, desc, cta, onCta,
}: { icon: React.ReactNode; title: string; desc: string; cta?: string; onCta?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h2 className="font-black text-gray-800 text-lg mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      {cta && onCta && (
        <Button onClick={onCta} className="bg-violet-600 hover:bg-violet-700 font-bold">
          {cta}
        </Button>
      )}
    </motion.div>
  );
}
