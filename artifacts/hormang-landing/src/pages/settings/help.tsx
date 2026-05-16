import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareText, ChevronDown, Mail, Send, Copy, Check,
  FileText, ScrollText, FileCheck2, Users,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { SettingsPageShell } from "@/components/settings/page-shell";
import { Section } from "@/components/settings/section";
import { SettingsRow } from "@/components/settings/settings-row";

export default function HelpSettingsPage() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  function comingSoon() {
    alert(t.help.soon);
  }

  return (
    <SettingsPageShell title={t.help.title} subtitle={t.help.subtitle}>
      <Section title={t.help.sectionFeedback}>
        <SettingsRow
          icon={MessageSquareText}
          iconBg="hsl(262, 80%, 96%)"
          iconColor="hsl(262, 80%, 54%)"
          title={t.help.feedback.title}
          desc={t.help.feedback.desc}
          onClick={() => setLocation("/feedback")}
        />
      </Section>

      <Section title={t.help.sectionFAQ}>
        {t.faq.items.map((item, i) => {
          const open = openIdx === i;
          const panelId = `faq-panel-${i}`;
          const buttonId = `faq-button-${i}`;
          return (
            <div key={i}>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-[hsl(var(--surface-2))] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-[hsl(var(--text-primary))]">
                    {item.q}
                  </p>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 -mt-1 text-xs text-gray-600 dark:text-[hsl(var(--text-secondary))] leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Section>

      <Section title={t.help.sectionContact}>
        <SettingsRow
          icon={Mail}
          iconBg="hsl(213, 100%, 96%)"
          iconColor="hsl(221, 78%, 48%)"
          title={t.help.contact.email}
          desc="support@hormang.uz"
          right={
            <button
              onClick={() => copy("support@hormang.uz", "email")}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[hsl(var(--surface-3))] text-gray-700 dark:text-gray-300 text-[11px] font-bold flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-[hsl(var(--surface-2))] transition-colors"
            >
              {copied === "email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied === "email" ? t.help.contact.copied : t.help.contact.copy}
            </button>
          }
        />
        <SettingsRow
          icon={Send}
          iconBg="hsl(199, 89%, 95%)"
          iconColor="hsl(199, 89%, 48%)"
          title={t.help.contact.telegram}
          desc="@HormangSupport"
          right={
            <button
              onClick={() => copy("@HormangSupport", "tg")}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[hsl(var(--surface-3))] text-gray-700 dark:text-gray-300 text-[11px] font-bold flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-[hsl(var(--surface-2))] transition-colors"
            >
              {copied === "tg" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied === "tg" ? t.help.contact.copied : t.help.contact.copy}
            </button>
          }
        />
      </Section>

      <Section title={t.help.sectionGuidelines}>
        {t.guidelines.items.map((item, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-[hsl(var(--text-primary))]">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-[hsl(var(--text-tertiary))] mt-0.5 leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </Section>

      <Section title={t.help.sectionLegal}>
        <SettingsRow
          icon={ScrollText}
          iconBg="hsl(215, 16%, 94%)"
          iconColor="hsl(215, 25%, 35%)"
          title={t.help.legal.terms}
          onClick={comingSoon}
        />
        <SettingsRow
          icon={FileCheck2}
          iconBg="hsl(215, 16%, 94%)"
          iconColor="hsl(215, 25%, 35%)"
          title={t.help.legal.privacy}
          onClick={comingSoon}
        />
        <SettingsRow
          icon={FileText}
          iconBg="hsl(215, 16%, 94%)"
          iconColor="hsl(215, 25%, 35%)"
          title={t.help.legal.licenses}
          onClick={comingSoon}
        />
      </Section>
    </SettingsPageShell>
  );
}
