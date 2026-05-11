import { Phone, Mail, Shield, Trash2, Lock, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { SettingsPageShell } from "@/components/settings/page-shell";
import { Section } from "@/components/settings/section";
import { SettingsRow } from "@/components/settings/settings-row";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const phoneVerified = !!user?.phone;
  const emailVerified = false;
  const twoFAEnabled  = false;

  const score = (phoneVerified ? 1 : 0) + (emailVerified ? 1 : 0) + (twoFAEnabled ? 1 : 0);
  const level = score >= 3 ? "high" : score === 2 ? "medium" : "low";
  const levelLabel = level === "high" ? t.security.statusCard.high : level === "medium" ? t.security.statusCard.medium : t.security.statusCard.low;

  const levelGradient =
    level === "high"
      ? "from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700"
      : level === "medium"
      ? "from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600"
      : "from-rose-500 to-red-500 dark:from-rose-600 dark:to-red-600";

  function comingSoon() {
    alert(t.security.soon);
  }

  return (
    <SettingsPageShell title={t.security.title} subtitle={t.security.subtitle}>
      <div className={`bg-gradient-to-br ${levelGradient} rounded-2xl p-5 shadow-sm text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-white/80">
              {t.security.statusCard.level}
            </p>
            <p className="text-2xl font-extrabold mt-0.5">{levelLabel}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${i <= score ? "bg-white" : "bg-white/25"}`}
            />
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          <StatusLine label={t.security.rows.phone.title} ok={phoneVerified} okLabel={t.security.rows.phone.verified} />
          <StatusLine label={t.security.rows.email.title} ok={emailVerified} okLabel={t.security.rows.phone.verified} />
          <StatusLine label={t.security.rows.twoFA.title} ok={twoFAEnabled} okLabel={t.common.enabled} />
        </div>
      </div>

      <Section>
        <SettingsRow
          icon={Phone}
          iconBg="hsl(160, 60%, 95%)"
          iconColor="hsl(160, 60%, 38%)"
          title={t.security.rows.phone.title}
          desc={user?.phone ?? "—"}
          onClick={emailVerified ? comingSoon : undefined}
          disabled={!emailVerified}
        />
        {!emailVerified && (
          <div className="px-4 py-2.5 bg-amber-50/40 dark:bg-amber-950/20 border-t border-amber-100/50 dark:border-amber-900/30">
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
              ⓘ {t.security.rows.changePhone.needsEmail}
            </p>
          </div>
        )}
        <SettingsRow
          icon={Mail}
          iconBg="hsl(213, 100%, 96%)"
          iconColor="hsl(221, 78%, 48%)"
          title={emailVerified ? t.security.rows.email.change : t.security.rows.email.register}
          desc={emailVerified ? "" : t.security.rows.email.desc}
          onClick={comingSoon}
        />
        <SettingsRow
          icon={Lock}
          iconBg="hsl(262, 80%, 96%)"
          iconColor="hsl(262, 80%, 54%)"
          title={t.security.rows.twoFA.title}
          desc={emailVerified ? t.security.rows.twoFA.desc : t.security.rows.twoFA.needsEmail}
          onClick={emailVerified ? comingSoon : undefined}
          disabled={!emailVerified}
        />
      </Section>

      <Section title={t.security.dangerZone} tone="danger">
        <SettingsRow
          icon={Trash2}
          iconBg="hsl(0, 84%, 95%)"
          iconColor="hsl(0, 84%, 48%)"
          title={t.security.rows.deleteAccount.title}
          desc={t.security.rows.deleteAccount.desc}
          onClick={comingSoon}
          tone="danger"
        />
      </Section>
    </SettingsPageShell>
  );
}

function StatusLine({ label, ok, okLabel }: { label: string; ok: boolean; okLabel: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-white/85">{label}</span>
      <span className="flex items-center gap-1 font-semibold">
        {ok ? (
          <>
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            {okLabel}
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="opacity-80">—</span>
          </>
        )}
      </span>
    </div>
  );
}
