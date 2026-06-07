import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Check, Pin, Sparkles } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { getCategoryDisplayName } from "@/lib/categories";
import {
  MAX_FEATURED_PROJECTS,
  type PortfolioProject,
  type ServiceHistory,
} from "@/lib/service-history-store";

const MAX_TITLE = 80;
const MAX_DESC = 1000;

interface PortfolioProjectModalProps {
  item: ServiceHistory;
  existing?: PortfolioProject;
  /** Provider's current featured count, excluding this record. */
  featuredCount: number;
  onSave: (project: PortfolioProject) => void;
  onClose: () => void;
}

export function PortfolioProjectModal({
  item,
  existing,
  featuredCount,
  onSave,
  onClose,
}: PortfolioProjectModalProps) {
  const { t, locale } = useI18n();
  const tt = t.portfolioModal;
  const photos = item.afterPhotos ?? [];

  const [title, setTitle] = useState(
    existing?.title ?? getCategoryDisplayName(item.categoryId, locale, item.serviceTitle)
  );
  const [description, setDescription] = useState(
    existing?.description ?? item.completionNotes ?? item.serviceDescription ?? ""
  );
  const [cover, setCover] = useState<string>(existing?.coverPhoto ?? photos[0] ?? "");
  const [additional, setAdditional] = useState<string[]>(existing?.additionalPhotos ?? []);
  const [featured, setFeatured] = useState(existing?.featured ?? false);

  const featuredLocked = !featured && featuredCount >= MAX_FEATURED_PROJECTS;
  const hasPhotos = photos.length > 0;
  const canSave = hasPhotos && !!cover && title.trim().length > 0 && description.trim().length > 0;

  const additionalSet = useMemo(() => new Set(additional), [additional]);

  function toggleAdditional(url: string) {
    if (url === cover) return; // cover can't double as additional
    setAdditional((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  function selectCover(url: string) {
    setCover(url);
    setAdditional((prev) => prev.filter((u) => u !== url));
  }

  function handleSave() {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      coverPhoto: cover,
      additionalPhotos: additional,
      featured,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(10,10,30,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[81] flex justify-center"
      >
        <div
          className="bg-white w-full max-w-lg rounded-t-3xl flex flex-col max-h-[92vh]"
          style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.16)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-fuchsia-50 border border-fuchsia-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-fuchsia-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                  {existing ? tt.editTitle : tt.createTitle}
                </h3>
                <p className="text-xs text-gray-500">{tt.subtitle}</p>
              </div>
            </div>
          </div>

          {!hasPhotos ? (
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-7 h-7 text-amber-500" />
              </div>
              <p className="font-black text-gray-800 mb-1.5">{tt.noPhotosTitle}</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">{tt.noPhotosDesc}</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5 overflow-y-auto">
              {/* Title */}
              <div>
                <p className="text-sm font-black text-gray-800 mb-2">{tt.titleLabel}</p>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                  placeholder={tt.titlePlaceholder}
                  className="w-full h-12 px-3.5 rounded-2xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:border-violet-400"
                />
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-black text-gray-800 mb-2">{tt.descLabel}</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                  placeholder={tt.descPlaceholder}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-violet-400 resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{description.length}/{MAX_DESC}</p>
              </div>

              {/* Cover photo */}
              <div>
                <p className="text-sm font-black text-gray-800">{tt.coverLabel}</p>
                <p className="text-xs text-gray-400 mb-2.5">{tt.coverHint}</p>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((url, i) => {
                    const isCover = url === cover;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectCover(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                          isCover ? "border-violet-500" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {isCover && (
                          <span className="absolute inset-0 bg-violet-600/30 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional photos */}
              {photos.length > 1 && (
                <div>
                  <p className="text-sm font-black text-gray-800">{tt.additionalLabel}</p>
                  <p className="text-xs text-gray-400 mb-2.5">{tt.additionalHint}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos
                      .filter((url) => url !== cover)
                      .map((url, i) => {
                        const selected = additionalSet.has(url);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleAdditional(url)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                              selected ? "border-fuchsia-500" : "border-transparent"
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {selected && (
                              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-fuchsia-500 text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Featured */}
              <button
                type="button"
                onClick={() => !featuredLocked && setFeatured((f) => !f)}
                disabled={featuredLocked}
                className={`w-full rounded-2xl border p-4 flex items-center justify-between gap-3 transition-colors text-left ${
                  featured ? "bg-fuchsia-50 border-fuchsia-200" : "bg-white border-gray-200"
                } ${featuredLocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <Pin className={`w-5 h-5 flex-shrink-0 ${featured ? "text-fuchsia-600" : "text-gray-400"}`} />
                  <div>
                    <p className={`font-black text-sm ${featured ? "text-fuchsia-700" : "text-gray-800"}`}>
                      {tt.featuredLabel}
                    </p>
                    <p className="text-xs text-gray-500">
                      {featuredLocked ? tt.featuredLocked : tt.featuredHint}
                    </p>
                  </div>
                </div>
                <span
                  className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${
                    featured ? "bg-fuchsia-500 justify-end" : "bg-gray-200 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow" />
                </span>
              </button>
            </div>
          )}

          <div className="px-5 pt-3 pb-8 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {tt.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 h-12 rounded-2xl text-sm font-bold text-white shadow-sm transition-all active:scale-[.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)" }}
            >
              {tt.save}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
