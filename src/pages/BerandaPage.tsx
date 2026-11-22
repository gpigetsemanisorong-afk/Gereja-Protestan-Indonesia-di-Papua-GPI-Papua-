import React, { useState } from 'react';
import {
  BarChart3,
  BookText,
  CalendarDays,
  Church,
  FileText,
  HeartHandshake,
  Info,
  Layers,
  Share2,
  Wallet,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { PageRoute } from '../types/church';
import { ShareSheetModal } from '../components/ShareSheetModal';
import { KalenderKegiatanWidget } from '../components/KalenderKegiatanWidget';
import heroSanctuaryImg from '../assets/images/hero_getsemani_sanctuary_1794648269013.jpg';
import {
  buildBibleVerseSharePayload,
  SharePayload,
  triggerWebShare,
} from '../utils/shareUtils';

const MENU_ITEMS: {
  id: PageRoute;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}[] = [
  {
    id: 'tata-ibadah',
    title: 'Tata Ibadah',
    icon: Church,
    accentClass: 'bg-rose-500/12 text-[#7F1D1D] dark:bg-rose-400/15 dark:text-rose-300',
  },
  {
    id: 'liturgi-unsur',
    title: 'Liturgi Wadah',
    icon: Layers,
    accentClass: 'bg-amber-500/12 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  },
  {
    id: 'jadwal',
    title: 'Jadwal',
    icon: CalendarDays,
    accentClass: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  },
  {
    id: 'warta',
    title: 'Warta',
    icon: FileText,
    accentClass: 'bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  },
  {
    id: 'kotak-doa',
    title: 'Kotak Doa & Layanan Jemaat',
    icon: HeartHandshake,
    accentClass: 'bg-teal-500/12 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  },
  {
    id: 'keuangan',
    title: 'Keuangan',
    icon: Wallet,
    accentClass: 'bg-amber-500/12 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  },
  {
    id: 'statistik',
    title: 'Statistik',
    icon: BarChart3,
    accentClass: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  },
  {
    id: 'profil',
    title: 'Profil',
    icon: Info,
    accentClass: 'bg-stone-500/12 text-stone-700 dark:bg-stone-400/15 dark:text-stone-300',
  },
  {
    id: 'tentang',
    title: 'Tentang',
    icon: BookText,
    accentClass: 'bg-slate-500/12 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
  },
];

export const BerandaPage: React.FC = () => {
  const { data, setRoute } = usePortal();
  const [heroImgError, setHeroImgError] = useState(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleQuickShare = async (payload: SharePayload, successLabel: string) => {
    const res = await triggerWebShare(payload);
    if (res.status === 'shared') {
      setShareNotice(successLabel);
      window.setTimeout(() => setShareNotice(null), 3000);
    } else if (res.status === 'fallback') {
      setSharePayload(payload);
    }
  };

  return (
    <div className="space-y-6 md:space-y-7">
      {shareNotice && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {shareNotice}
        </div>
      )}

      {/* Desktop 2-column layout (Left: Hero & 9 Fitur / Right: Kalender Kegiatan) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start lg:gap-7">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Featured Sanctuary Card (Android Material You Banner) */}
          <section className="relative overflow-hidden rounded-[28px] bg-[#5C1215] text-white shadow-sm">
            {!heroImgError ? (
              <img
                src={heroSanctuaryImg}
                alt="Ruang Ibadah GPI Getsemani Sorong"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-br from-[#68151B]/95 via-[#7F1D1D]/85 to-[#330A0C]/95" />

            <div className="relative z-10 p-5 sm:p-7">
              <p className="text-xs font-medium text-amber-300/95">
                {data.profile.synod} · {data.profile.klasis}
              </p>

              <h1 className="mt-2 max-w-xl font-display text-xl font-bold leading-snug text-white text-balance sm:text-2xl lg:text-3xl">
                {data.profile.ministryTheme}
              </h1>

              <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/20 bg-black/25 p-4 sm:p-5 backdrop-blur-xs">
                {data.profile.weeklyVerse.imageUrl && (
                  <img
                    src={data.profile.weeklyVerse.imageUrl}
                    alt="Latar Ayat Pokok Anggur"
                    className="absolute inset-0 h-full w-full object-cover opacity-20 pointer-events-none"
                  />
                )}
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-amber-300">
                    Ayat Minggu Ini · {data.profile.weeklyVerse.ref}
                  </p>
                  <p className="mt-1 font-reading text-sm leading-relaxed text-stone-100 sm:text-[15px]">
                    {data.profile.weeklyVerse.text}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    void handleQuickShare(
                      buildBibleVerseSharePayload(
                        data.profile.weeklyVerse.ref,
                        data.profile.weeklyVerse.text,
                        data.profile.name,
                        data.profile.weeklyVerse.imageUrl
                      ),
                      `Ayat ${data.profile.weeklyVerse.ref} siap dibagikan.`
                    )
                  }
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-xs font-bold text-stone-950 transition-all hover:bg-amber-300 active:scale-[0.98] sm:text-sm cursor-pointer shadow-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Bagikan Ayat Mingguan</span>
                </button>
              </div>
            </div>
          </section>

          {/* Android Launcher Grid: Menu Pelayanan */}
          <section
            aria-labelledby="menu-utama-heading"
            className="rounded-[24px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                id="menu-utama-heading"
                className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg"
              >
                Layanan Jemaat
              </h2>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {MENU_ITEMS.length} Fitur
              </span>
            </div>

            <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-4">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoute(item.id)}
                    className="group flex flex-col items-center justify-start gap-2 rounded-2xl p-1 text-center transition-transform active:scale-95 cursor-pointer"
                  >
                    <div
                      className={`flex h-13 w-13 items-center justify-center rounded-[18px] transition-transform group-hover:scale-105 ${item.accentClass}`}
                    >
                      <Icon className="h-[22px] w-[22px]" />
                    </div>
                    <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-stone-800 dark:text-stone-200 sm:text-xs">
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <aside>
          <KalenderKegiatanWidget schedules={data.schedules} />
        </aside>
      </div>

      <ShareSheetModal
        open={Boolean(sharePayload)}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
        onSharedOrCopied={(msg) => {
          setShareNotice(msg);
          window.setTimeout(() => setShareNotice(null), 3000);
        }}
      />
    </div>
  );
};
