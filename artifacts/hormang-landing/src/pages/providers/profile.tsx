import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  MapPin, CheckCircle2, Star, ChevronLeft,
  Mail, Phone, Briefcase, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProviderPublicProfile, type SafeUser, type ProviderProfile } from "@/lib/auth-client";
import { useAuth } from "@/contexts/auth-context";

function InitialsAvatar({ name, size = "lg" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : parts[0].slice(0, 2);

  const sizes = { sm: "w-10 h-10 text-sm", md: "w-14 h-14 text-xl", lg: "w-20 h-20 text-2xl" };

  return (
    <div
      className={`${sizes[size]} rounded-2xl flex items-center justify-center text-white font-black uppercase shadow-md flex-shrink-0`}
      style={{ background: "var(--brand-gradient)" }}
    >
      {initials}
    </div>
  );
}

function RatingDisplay({ rating, count }: { rating?: number; count?: number }) {
  const r = rating ?? 0;
  const filled = Math.round(r);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`w-4 h-4 ${i <= filled ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
        ))}
      </div>
      {rating ? (
        <span className="text-sm font-bold text-gray-900">{r.toFixed(1)}</span>
      ) : null}
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count} sharh)</span>
      )}
      {!rating && <span className="text-xs text-gray-400">Hali baholash yo'q</span>}
    </div>
  );
}

export default function ProviderProfilePage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const [provider, setProvider] = useState<SafeUser | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    getProviderPublicProfile(params.id)
      .then(data => {
        setProvider(data.user);
        setProfile(data.providerProfile);
      })
      .catch(() => setError("Ijrochi topilmadi"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ijrochi topilmadi</h2>
        <p className="text-gray-500 text-sm mb-6">Bunday profil mavjud emas yoki o'chirilgan.</p>
        <Button variant="outline" onClick={() => setLocation("/")} className="gap-2 border-2 font-semibold">
          <ChevronLeft className="w-4 h-4" /> Bosh sahifaga
        </Button>
      </div>
    );
  }

  const fullName = `${provider.firstName} ${provider.lastName}`;
  const isOwnProfile = currentUser?.id === provider.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 card-shadow">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-900 text-sm">Ijrochi profili</span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
            style={{ background: "var(--brand-gradient)" }}
          >
            H
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 mb-5">
            <div className="flex items-start gap-4 mb-5">
              <InitialsAvatar name={fullName} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                  {profile?.isVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Tasdiqlangan
                    </span>
                  )}
                </div>
                <RatingDisplay />
                {profile?.preferredLocation && (
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.preferredLocation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                {provider.email ? "Email tasdiqlangan" : "Telefon tasdiqlangan"}
              </div>
            </div>
          </div>

          {profile?.bio && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 mb-5"
            >
              <h2 className="font-bold text-gray-900 mb-3 text-sm">O'zi haqida</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
            </motion.div>
          )}

          {profile?.categories && profile.categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 mb-5"
            >
              <h2 className="font-bold text-gray-900 mb-3 text-sm">Ko'rsatiladigan xizmatlar</h2>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map(cat => (
                  <span key={cat} className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3 h-3" /> {cat}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-2xl border border-gray-100 card-shadow p-6 mb-5"
          >
            <h2 className="font-bold text-gray-900 mb-4 text-sm">Sharhlar</h2>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 text-gray-200" />)}
              </div>
              <p className="text-sm text-gray-500">Hali sharh yo'q</p>
              <p className="text-xs text-gray-400 mt-1">Birinchi buyurtmadan so'ng sharh qoldirishingiz mumkin</p>
            </div>
          </motion.div>

          {!isOwnProfile ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
              className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white"
            >
              <h3 className="font-bold text-lg mb-1">{fullName} bilan bog'laning</h3>
              <p className="text-blue-100 text-sm mb-5">So'rovingizni yuboring — ijrochi tez orada javob beradi</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setLocation(currentUser ? "/dashboard/buyer" : "/auth/login")}
                  className="flex-1 bg-white text-blue-700 hover:bg-blue-50 font-bold gap-2 shadow-sm"
                >
                  <Mail className="w-4 h-4" /> So'rov yuborish <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
              className="text-center"
            >
              <Button
                onClick={() => setLocation("/profile/settings")}
                variant="outline"
                className="gap-2 border-2 font-bold"
              >
                Profilni tahrirlash <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
