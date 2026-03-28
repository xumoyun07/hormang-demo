/**
 * OfferForm — full-screen bottom sheet for provider to send an offer on a request.
 * Opens from "Javob berish" button on So'rovlar page.
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, Send, Clock, MapPin, Calendar, FileImage,
  ChevronDown, CheckCircle2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  saveOffer, createChatFromOffer, updateProviderRequestStatus, markSeen,
  getAvgResponseMinutes, setAvgResponseMinutes,
  type ProviderRequest,
} from "@/lib/provider-store";

const VIOLET = "linear-gradient(135deg, hsl(262,80%,54%) 0%, hsl(236,76%,60%) 100%)";

const COMPLETION_OPTIONS = [
  "1 kun",
  "2–3 kun",
  "1 hafta",
  "2 hafta",
  "1 oy",
  "Boshqa (kelishiladi)",
];

function formatPrice(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function urgencyLabel(u: ProviderRequest["urgency"]): { label: string; color: string } {
  if (u === "urgent") return { label: "Shoshilinch", color: "text-red-600 bg-red-50 border border-red-100" };
  if (u === "normal") return { label: "Oddiy", color: "text-blue-600 bg-blue-50 border border-blue-100" };
  return { label: "Moslashuvchan", color: "text-gray-500 bg-gray-100 border border-gray-200" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

interface Props {
  request: ProviderRequest;
  onClose: () => void;
  onSubmitted: () => void;
}

export function OfferForm({ request, onClose, onSubmitted }: Props) {
  const { toast } = useToast();

  /* Form state */
  const [priceRaw, setPriceRaw] = useState("");
  const [message, setMessage] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [termsChecked, setTermsChecked] = useState(false);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string }[]>([]);

  /* UI state */
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [editResponseTime, setEditResponseTime] = useState(false);
  const [avgMinutes, setAvgMinutes] = useState(getAvgResponseMinutes);
  const [avgInput, setAvgInput] = useState(String(getAvgResponseMinutes()));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const urg = urgencyLabel(request.urgency);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFilePreviews((prev) => [
          ...prev,
          { name: file.name, url: ev.target?.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function saveResponseTime() {
    const v = parseInt(avgInput, 10);
    if (!isNaN(v) && v > 0) {
      setAvgResponseMinutes(v);
      setAvgMinutes(v);
    }
    setEditResponseTime(false);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const numPrice = parseInt(priceRaw.replace(/\D/g, ""), 10);
    if (!priceRaw || isNaN(numPrice) || numPrice <= 0) e.price = "Taklif narxini kiriting";
    if (!message.trim() || message.trim().length < 10) e.message = "Kamida 10 ta belgi yozing";
    if (!completionTime) e.completionTime = "Muddatni tanlang";
    if (!termsChecked) e.terms = "Shartlarga roziligingizni belgilang";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    const numPrice = parseInt(priceRaw.replace(/\D/g, ""), 10);
    const priceLabel = formatPrice(String(numPrice)) + " so'm";

    const offer = saveOffer({
      requestId: request.id,
      price: numPrice,
      priceLabel,
      message: message.trim(),
      completionTime,
      startDate,
      termsAccepted: termsChecked,
      fileUrls: filePreviews.map((f) => f.url),
    });

    updateProviderRequestStatus(request.id, "responded");
    markSeen(request.id);
    createChatFromOffer(request, offer);

    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Taklif muvaffaqiyatli yuborildi!" });
      onSubmitted();
    }, 500);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="bg-white w-full max-w-lg rounded-t-3xl max-h-[96vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-extrabold text-base text-gray-900">Taklif berish</h2>
            <p className="text-xs text-gray-400">Mijozga taklif yuboring</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Customer request summary ── */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-2xl">
                {request.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-gray-900">{request.categoryName}</p>
                <p className="text-xs text-gray-500">{request.customerName} · {timeAgo(request.createdAt)}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urg.color}`}>
                {urg.label}
              </span>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-3">{request.description}</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="truncate">{request.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="font-bold text-violet-700">{request.budgetLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>{timeAgo(request.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCustomerDetail((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
            >
              {showCustomerDetail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showCustomerDetail ? "Yopish" : "Mijoz haqida batafsil ko'rish"}
            </button>

            <AnimatePresence>
              {showCustomerDetail && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-medium">Ism:</span>
                      <span className="font-semibold text-gray-700">{request.customerName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-medium">Kategoriya:</span>
                      <span className="font-semibold text-gray-700">{request.categoryName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-medium">Manzil:</span>
                      <span className="font-semibold text-gray-700">{request.location}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-medium">Byudjet:</span>
                      <span className="font-semibold text-violet-700">{request.budgetLabel}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-medium">Shoshilinchlik:</span>
                      <span className={`font-semibold ${urg.color.includes("red") ? "text-red-600" : "text-gray-700"}`}>{urg.label}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs mt-1">
                      <span className="text-gray-400 font-medium">So'rov matni:</span>
                      <p className="text-gray-700 bg-white rounded-xl px-3 py-2 border border-gray-100 leading-relaxed">
                        {request.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Provider avg response time ── */}
          <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-500" />
                <div>
                  <p className="text-xs font-bold text-violet-700">O'rtacha javob vaqti</p>
                  {!editResponseTime && (
                    <p className="text-xs text-violet-500">{avgMinutes} daqiqa</p>
                  )}
                </div>
              </div>
              {!editResponseTime ? (
                <button
                  onClick={() => { setAvgInput(String(avgMinutes)); setEditResponseTime(true); }}
                  className="text-[11px] font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-lg hover:bg-violet-200 transition-colors"
                >
                  O'zgartirish
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={avgInput}
                    onChange={(e) => setAvgInput(e.target.value)}
                    className="w-16 h-8 text-center text-sm font-bold border border-violet-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                    min={1}
                    max={999}
                  />
                  <span className="text-xs text-violet-500">daq</span>
                  <button
                    onClick={saveResponseTime}
                    className="text-[11px] font-bold text-white px-2.5 py-1 rounded-lg"
                    style={{ background: VIOLET }}
                  >
                    Saqlash
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Price ── */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Taklif narxi (so'm) <span className="text-red-500">*</span>
            </label>
            <div className={`flex items-center bg-white border-2 rounded-2xl px-4 h-12 transition-colors ${
              errors.price ? "border-red-300" : priceRaw ? "border-violet-400" : "border-gray-200 focus-within:border-violet-400"
            }`}>
              <input
                type="text"
                inputMode="numeric"
                value={formatPrice(priceRaw)}
                onChange={(e) => {
                  setPriceRaw(e.target.value.replace(/\D/g, ""));
                  if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="150 000"
                className="flex-1 bg-transparent text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
              <span className="text-xs font-bold text-gray-400 ml-2">so'm</span>
            </div>
            {errors.price && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.price}
              </p>
            )}
          </div>

          {/* ── Message ── */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Xabar / Taklif matni <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((prev) => ({ ...prev, message: "" }));
              }}
              placeholder="Salom! Sizning so'rovingizni ko'rdim. Men bu ishni bajarishga tayyorman..."
              rows={4}
              className={`w-full bg-white border-2 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none resize-none transition-colors ${
                errors.message ? "border-red-300" : message ? "border-violet-400" : "border-gray-200 focus:border-violet-400"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.message ? (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5" />{errors.message}
                </p>
              ) : <span />}
              <span className="text-[10px] text-gray-400 ml-auto">{message.length} belgi</span>
            </div>
          </div>

          {/* ── Completion time ── */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Taxminiy bajarish muddati <span className="text-red-500">*</span>
            </label>
            <div className={`relative border-2 rounded-2xl bg-white transition-colors ${
              errors.completionTime ? "border-red-300" : completionTime ? "border-violet-400" : "border-gray-200"
            }`}>
              <select
                value={completionTime}
                onChange={(e) => {
                  setCompletionTime(e.target.value);
                  if (errors.completionTime) setErrors((prev) => ({ ...prev, completionTime: "" }));
                }}
                className="w-full h-12 px-4 pr-10 text-sm font-medium text-gray-800 bg-transparent focus:outline-none appearance-none"
              >
                <option value="">Muddatni tanlang...</option>
                {COMPLETION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.completionTime && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.completionTime}
              </p>
            )}
          </div>

          {/* ── Start date ── */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Ishni boshlash sanasi
            </label>
            <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-2xl px-4 h-12 focus-within:border-violet-400 transition-colors">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* ── File upload ── */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Qo'shimcha fayllar (ixtiyoriy)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-11 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
            >
              <FileImage className="w-4 h-4" />
              Rasm yoki hujjat yuklash
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            {filePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filePreviews.map((f, idx) => (
                  <div key={idx} className="relative group">
                    {f.url.startsWith("data:image") ? (
                      <img
                        src={f.url}
                        alt={f.name}
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Terms ── */}
          <div
            onClick={() => {
              setTermsChecked((v) => !v);
              if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
            }}
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
              errors.terms
                ? "border-red-300 bg-red-50"
                : termsChecked
                ? "border-violet-300 bg-violet-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              termsChecked ? "border-violet-600 bg-violet-600" : "border-gray-300 bg-white"
            }`}>
              {termsChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-bold text-gray-800">Platforma qoidalariga roziman</span> va mijoz bilan to'g'ridan-to'g'ri aloqa qilmayman (faqat platforma orqali)
            </p>
          </div>
          {errors.terms && (
            <p className="flex items-center gap-1 text-xs text-red-500 -mt-2">
              <AlertCircle className="w-3.5 h-3.5" />{errors.terms}
            </p>
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[.98] transition-all shadow-lg disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #059669 0%, #10B981 100%)" }}
          >
            {submitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Taklifni yuborish
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
