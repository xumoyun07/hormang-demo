/**
 * provider-badges.tsx — visual layer for the Provider Badge System.
 *
 * Exports:
 *   • BadgePill           — single compact premium pill
 *   • BadgeList           — sorted horizontal-wrap list (with optional empty state)
 *   • BadgeEmptyState     — motivational hints when no badges exist
 *   • AdminBadgeManager   — admin grant/remove UI for the user-detail modal
 *
 * Visual principle: minimal, marketplace-grade, NOT gamified. Soft gradients,
 * subtle borders, small icons, elegant typography.
 */
import { useEffect } from "react";
import {
  ShieldCheck, Star, Shield, Award, Crown, Images, BadgeCheck, Eye,
} from "lucide-react";
import {
  BADGE_META, ADMIN_BADGE_TYPES, getBadges, evaluateAutoBadges, explainAutoBadges,
  adminGrantBadge, adminRemoveBadge,
  type Badge as BadgeRecord, type BadgeType,
} from "@/lib/badge-store";
import type { SafeUser } from "@/lib/auth-client";

const ICONS = {
  ShieldCheck, Star, Shield, Award, Crown, Images, BadgeCheck, Eye,
} as const;

/* ─── Single pill ──────────────────────────────────────────────────── */

export function BadgePill({
  type,
  size = "sm",
}: {
  type: BadgeType;
  size?: "sm" | "md";
}) {
  const meta = BADGE_META[type];
  if (!meta) return null;
  const Icon = ICONS[meta.icon];

  const sz = size === "md"
    ? "px-2.5 py-1 text-[11px] gap-1.5"
    : "px-2 py-[3px] text-[10px] gap-1";
  const iconSz = size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border whitespace-nowrap leading-none ${sz} ${meta.pillBg} ${meta.pillText} ${meta.pillBorder}`}
      title={meta.description}
    >
      <Icon className={iconSz} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

/* ─── Badge row (horizontal wrap) ──────────────────────────────────── */

export function BadgeList({
  badges,
  size = "sm",
  emptyState,
  className = "",
}: {
  badges: BadgeRecord[];
  size?: "sm" | "md";
  emptyState?: React.ReactNode;
  className?: string;
}) {
  if (badges.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badges.map((b) => (
        <BadgePill key={b.type} type={b.type} size={size} />
      ))}
    </div>
  );
}

/* ─── Motivational empty state ─────────────────────────────────────── */

export function BadgeEmptyState({
  user,
  variant = "compact",
}: {
  user: SafeUser | null;
  variant?: "compact" | "full";
}) {
  // Show top-3 closest-to-earned hints based on current eligibility report.
  const hints = (user && user.role === "provider"
    ? explainAutoBadges(user).filter((r) => !r.qualified).slice(0, 3)
    : []
  ).map((r) => BADGE_META[r.type].hint);

  const fallbackHints = [
    "Profilingizni 100% to'ldiring",
    "50+ buyurtma bajaring",
    "Kuchli portfolio yarating",
  ];
  const showHints = hints.length > 0 ? hints : fallbackHints;

  if (variant === "compact") {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-3 py-2.5 text-center">
        <p className="text-[11px] font-bold text-violet-700">
          Profil nishonlarini qo'lga kiriting
        </p>
        <p className="text-[10px] text-violet-500/80 mt-0.5">
          {showHints[0]}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-50/60 to-white px-4 py-4">
      <p className="text-xs font-extrabold text-violet-800 mb-1">
        Profil nishonlarini qo'lga kiriting
      </p>
      <p className="text-[11px] text-violet-600/80 leading-relaxed mb-2.5">
        Mijozlar ishonchini oshirish uchun quyidagi shartlardan birini bajaring:
      </p>
      <ul className="space-y-1">
        {showHints.map((h, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700">
            <span className="mt-1 w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Convenience wrapper: read-and-render in one ──────────────────── */

export function ProviderBadges({
  userId,
  user,
  size = "sm",
  showEmpty = false,
  emptyVariant = "compact",
  className = "",
}: {
  userId: string;
  /** Optional — pass current user to trigger lazy auto-evaluation when self-viewing. */
  user?: SafeUser | null;
  size?: "sm" | "md";
  showEmpty?: boolean;
  emptyVariant?: "compact" | "full";
  className?: string;
}) {
  // Trigger lazy auto-evaluation in an effect (not during render) to avoid
  // emitting store-change events from a render pass.
  useEffect(() => {
    if (user && user.id === userId && user.role === "provider") {
      evaluateAutoBadges(user);
    }
  }, [user, userId]);

  const badges = getBadges(userId);
  if (badges.length === 0 && !showEmpty) return null;
  return (
    <BadgeList
      badges={badges}
      size={size}
      className={className}
      emptyState={showEmpty ? <BadgeEmptyState user={user ?? null} variant={emptyVariant} /> : undefined}
    />
  );
}

/* ─── Admin grant/remove panel ─────────────────────────────────────── */

export function AdminBadgeManager({
  targetUser,
  adminId,
  onChange,
}: {
  targetUser: {
    userId: string;
    name: string;
    role: "provider" | "customer" | "both";
  };
  adminId: string;
  onChange?: () => void;
}) {
  const stored = getBadges(targetUser.userId);

  function grant(type: BadgeType) {
    const r = adminGrantBadge(type, {
      adminId,
      targetUserId: targetUser.userId,
      targetName:   targetUser.name,
      targetRole:   targetUser.role,
    });
    if (!r.ok) alert(r.reason);
    onChange?.();
  }

  function remove(type: BadgeType) {
    const r = adminRemoveBadge(type, {
      adminId,
      targetUserId: targetUser.userId,
      targetName:   targetUser.name,
      targetRole:   targetUser.role,
    });
    if (!r.ok) alert(r.reason);
    onChange?.();
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <BadgeCheck className="w-3 h-3" /> Badge boshqaruvi
        </p>
      </div>

      {/* Current badges */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Joriy nishonlar</p>
        {stored.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">Hech qanday nishon berilmagan</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {stored.map((b) => {
              const meta = BADGE_META[b.type];
              return (
                <div key={b.type} className="flex items-center gap-1">
                  <BadgePill type={b.type} size="sm" />
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${b.source === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-200 text-gray-600"}`}>
                    {b.source === "admin" ? "ADMIN" : "AUTO"}
                  </span>
                  {b.source === "admin" && (
                    <button
                      onClick={() => remove(b.type)}
                      className="text-[9px] font-bold text-rose-600 hover:text-rose-800 px-1"
                      title={`"${meta.label}" nishonini olib tashlash`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin-grantable badges */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Admin nishonlari</p>
        <div className="space-y-1.5">
          {ADMIN_BADGE_TYPES.map((type) => {
            const meta = BADGE_META[type];
            const owns = stored.some((b) => b.type === type);
            const canGrant =
              !owns &&
              (meta.scope === "both" || targetUser.role !== "customer");
            const blockedReason =
              owns
                ? "Allaqachon berilgan"
                : meta.scope === "provider" && targetUser.role === "customer"
                  ? "Faqat ijrochilarga"
                  : null;

            return (
              <div key={type} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-100 px-2.5 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BadgePill type={type} size="sm" />
                  <span className="text-[10px] text-gray-500 truncate">{meta.description}</span>
                </div>
                <button
                  onClick={() => grant(type)}
                  disabled={!canGrant}
                  className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    canGrant
                      ? "bg-violet-600 text-white hover:bg-violet-700 active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {owns ? "Berilgan ✓" : blockedReason ?? "Berish"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Admin diagnostics: explain why each auto-badge is/not granted ── */

export function AdminBadgeDiagnostics({ user }: { user: SafeUser }) {
  if (user.role !== "provider") return null;
  const reasons = explainAutoBadges(user);
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-gray-500">Avtomatik nishon shartlari</p>
      {reasons.map((r) => {
        const meta = BADGE_META[r.type];
        return (
          <div
            key={r.type}
            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] ${
              r.qualified
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.qualified ? "bg-emerald-500" : "bg-gray-300"}`} />
              <span className="font-bold text-gray-700">{meta.label}</span>
            </div>
            <span className="text-gray-500 truncate">{r.details}</span>
          </div>
        );
      })}
    </div>
  );
}
