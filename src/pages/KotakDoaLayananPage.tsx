import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { usePrayerBox } from '../hooks/usePrayerBox';
import { PRAYER_CATEGORIES } from '../services/prayerBoxService';
import {
  PrayerCategory,
  GalleryItem,
  MinistryLeaderItem,
  MinistryLeaderGroup,
} from '../types/church';

export type KotakDoaLayananTab =
  | 'Kotak Doa'
  | 'Lapor Sakit'
  | 'Baptis/Sidi/Nikah'
  | 'Kunjungan Pastoral'
  | 'Perangkat Pelayan'
  | 'Galeri Kegiatan';

const UNITS = [
  'Unit Rehoboth (Filadelfia)',
  'Unit Silo (Filadelfia)',
  'Unit Pniel (Petra)',
  'Unit Siloam (Petra)',
  'Simpatisan / Tamu',
];

const GALLERY_CATEGORIES = [
  'Semua',
  'Ibadah Minggu',
  'Persekutuan & Sektor',
  'PAR & Pemuda',
  'Diakonia & Sosial',
  'Pembangunan & Lainnya',
];

const LEADER_FILTER_TABS: { id: string; label: string }[] = [
  { id: 'Semua', label: 'Semua Perangkat' },
  { id: 'PHMJ', label: 'PHMJ' },
  { id: 'PAR', label: 'PAR' },
  { id: 'PP', label: 'PP (Pemuda)' },
  { id: 'PERWATA', label: 'PERWATA' },
  { id: 'PERPRI', label: 'PERPRI' },
  { id: 'LANSIA', label: 'LANSIA' },
  { id: 'Koordinator Sektor', label: 'Sektor & Unit' },
];

const TAB_ITEMS: { id: KotakDoaLayananTab; label: string }[] = [
  { id: 'Kotak Doa', label: 'Kotak Doa' },
  { id: 'Lapor Sakit', label: 'Lapor Sakit' },
  { id: 'Baptis/Sidi/Nikah', label: 'Baptis / Sidi / Nikah' },
  { id: 'Kunjungan Pastoral', label: 'Kunjungan Pastoral' },
  { id: 'Perangkat Pelayan', label: 'Perangkat Pelayan' },
  { id: 'Galeri Kegiatan', label: 'Galeri Kegiatan' },
];

export const KotakDoaLayananPage: React.FC<{ initialTab?: KotakDoaLayananTab }> = ({
  initialTab = 'Kotak Doa',
}) => {
  const { data, updateData, logActivity, currentUserRole, openMenuSheet } = usePortal();
  const { mySentPrayers, submitPrayer } = usePrayerBox(false);

  const canManagePastoral =
    currentUserRole === 'superuser' ||
    currentUserRole === 'admin1' ||
    currentUserRole === 'admin2';

  const [activeTab, setActiveTab] = useState<KotakDoaLayananTab>(initialTab);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('Kesembuhan');
  const [unit, setUnit] = useState(UNITS[0]);
  const [sacramentKind, setSacramentKind] = useState('Baptis Kudus Anak');
  const [detailText, setDetailText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    kind: 'prayer' | 'service';
    title: string;
    subtitle: string;
    waUrl: string;
    waButtonLabel: string;
  } | null>(null);

  // Pastoral visit form state
  const [visFamilyName, setVisFamilyName] = useState('');
  const [visSectorUnit, setVisSectorUnit] = useState(UNITS[0]);
  const [visAddress, setVisAddress] = useState('');
  const [visDate, setVisDate] = useState('');
  const [visTime, setVisTime] = useState('16.00 WIT');
  const [visMajelis, setVisMajelis] = useState('Pdt. Yosua Waromi, S.Th.');
  const [visPrayerNeed, setVisPrayerNeed] = useState('');
  const [visSuccessMsg, setVisSuccessMsg] = useState<string | null>(null);

  // Gallery state
  const [galleryFilter, setGalleryFilter] = useState<string>('Semua');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [isAddGalleryModalOpen, setIsAddGalleryModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState<'Ibadah Minggu' | 'Persekutuan & Sektor' | 'PAR & Pemuda' | 'Diakonia & Sosial' | 'Pembangunan & Lainnya'>('Ibadah Minggu');
  const [newImageUrl, setNewImageUrl] = useState('');

  const filteredGallery = useMemo(() => {
    const list = data.gallery || [];
    if (galleryFilter === 'Semua') return list;
    return list.filter((item) => (item.category || 'Pembangunan & Lainnya') === galleryFilter);
  }, [data.gallery, galleryFilter]);

  const handleAddGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCaption.trim()) return;

    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: newTitle.trim(),
      caption: newCaption.trim(),
      date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      imageUrl: newImageUrl.trim() || data.profile.logoUrl || 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=1200&q=80',
      category: newCategory,
    };

    updateData((prev) => ({
      ...prev,
      gallery: [newItem, ...prev.gallery],
    }));

    logActivity({
      category: 'Galeri',
      action: 'Tambah Foto Galeri Kegiatan',
      detail: `Foto "${newItem.title}" ditambahkan ke galeri jemaat.`,
    });

    setNewTitle('');
    setNewCaption('');
    setNewImageUrl('');
    setIsAddGalleryModalOpen(false);
  };

  // Perangkat Pelayan state
  const [leaderFilter, setLeaderFilter] = useState<string>('Semua');
  const [leaderSearch, setLeaderSearch] = useState<string>('');

  const allLeaders: MinistryLeaderItem[] = useMemo(() => {
    return data.ministryLeaders || [];
  }, [data.ministryLeaders]);

  const filteredLeaders = useMemo(() => {
    return allLeaders.filter((item) => {
      const matchCat = leaderFilter === 'Semua' || item.group === leaderFilter;
      const q = leaderSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.roleTitle.toLowerCase().includes(q) ||
        (item.titleOrStatus && item.titleOrStatus.toLowerCase().includes(q)) ||
        (item.sectorOrUnit && item.sectorOrUnit.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [allLeaders, leaderFilter, leaderSearch]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: KotakDoaLayananTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSubmittedResult(null);
    setVisSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmittedResult(null);

    const isPrayerTab = activeTab === 'Kotak Doa';

    if (isPrayerTab) {
      if (!isAnonymous && !requesterName.trim()) {
        setErrorMsg('Mohon tuliskan nama Anda atau aktifkan opsi "Kirim sebagai Anonim".');
        return;
      }
      if (detailText.trim().length < 5) {
        setErrorMsg('Mohon tuliskan isi permohonan doa minimal 5 karakter.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await submitPrayer({
          requesterName: isAnonymous ? 'Anonim' : requesterName.trim(),
          isAnonymous,
          phone: phone.trim(),
          category,
          unit,
          prayerText: detailText.trim(),
        });

        const waText = [
          `Shalom Majelis & Tim Doa ${data.profile.name},`,
          `Saya telah mengirimkan permohonan ke *Kotak Doa Portal*:`,
          `Pemohon: ${res.prayer.isAnonymous ? 'Anonim' : res.prayer.requesterName}`,
          `Kategori: ${res.prayer.category}`,
          `Unit: ${res.prayer.unit}`,
          `Isi Doa: ${res.prayer.prayerText}`,
        ].join('\n');

        const requesterLabel = res.prayer.isAnonymous ? 'Anonim' : res.prayer.requesterName;

        setSubmittedResult({
          kind: 'prayer',
          title: `Permohonan doa atas nama "${requesterLabel}" telah diterima!`,
          subtitle: res.savedToCloud
            ? 'Tersimpan langsung ke database cloud Majelis Jemaat untuk didoakan.'
            : res.warning || 'Tersimpan di perangkat dan siap ditindaklanjuti.',
          waUrl: `https://wa.me/${data.profile.whatsappSekretariat}?text=${encodeURIComponent(
            waText
          )}`,
          waButtonLabel: 'Kirim juga via WhatsApp (Opsional)',
        });

        setDetailText('');
        if (!isAnonymous) {
          setRequesterName('');
        }
        setPhone('');
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Gagal mengirim permohonan doa. Silakan coba lagi.'
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!requesterName.trim()) {
      setErrorMsg('Mohon tuliskan nama lengkap pemohon.');
      return;
    }
    if (detailText.trim().length < 5) {
      setErrorMsg('Mohon tuliskan keterangan layanan secara jelas.');
      return;
    }

    const fullDetail =
      activeTab === 'Baptis/Sidi/Nikah'
        ? `Jenis Pelayanan: ${sacramentKind}. Keterangan: ${detailText.trim()}`
        : detailText.trim();

    updateData((prev) => ({
      ...prev,
      serviceRequests: [
        {
          id: `req-${Date.now()}`,
          type: activeTab,
          requesterName: requesterName.trim(),
          phone: phone.trim() || '-',
          unit,
          detail: fullDetail,
          createdAt: new Date().toISOString(),
        },
        ...prev.serviceRequests,
      ],
    }));

    logActivity({
      category: 'Layanan',
      action: `Pengajuan ${activeTab}`,
      detail: `${requesterName.trim()} (${unit}) — ${fullDetail}`,
      actorOverride: requesterName.trim(),
      roleOverride: 'jemaat',
    });

    const waText = [
      `Shalom Sekretariat ${data.profile.name},`,
      `Mohon pelayanan *${activeTab}*:`,
      `Nama: ${requesterName.trim()}`,
      `No. HP/WA: ${phone.trim() || '-'}`,
      `Asal Unit: ${unit}`,
      activeTab === 'Baptis/Sidi/Nikah' ? `Sakramen/Peneguhan: ${sacramentKind}` : null,
      `Keterangan: ${detailText.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');

    setSubmittedResult({
      kind: 'service',
      title: `Pengajuan ${activeTab} berhasil dicatat!`,
      subtitle: 'Silakan lanjutkan konfirmasi langsung ke Sekretariat Majelis Jemaat.',
      waUrl: `https://wa.me/${data.profile.whatsappSekretariat}?text=${encodeURIComponent(waText)}`,
      waButtonLabel: 'Kirim Pengajuan ke WhatsApp Sekretariat',
    });

    setRequesterName('');
    setPhone('');
    setDetailText('');
  };

  const handleAddVisitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePastoral) {
      setErrorMsg('Hanya akun Admin dan Super Admin yang dapat menambahkan atau menjadwalkan kunjungan pastoral.');
      return;
    }
    if (!visFamilyName.trim() || !visAddress.trim() || !visDate) {
      setErrorMsg('Mohon lengkapi Nama Keluarga, Alamat, dan Tanggal Kunjungan.');
      return;
    }
    const newVis = {
      id: `vis-${Date.now()}`,
      familyName: visFamilyName.trim(),
      sectorOrUnit: visSectorUnit,
      address: visAddress.trim(),
      scheduledDate: visDate,
      time: visTime,
      status: 'Terjadwal' as const,
      assignedMajelis: visMajelis.trim(),
      prayerNeed: visPrayerNeed.trim() || 'Perlawatan pastoral & doa syafaat keluarga',
      resultReport: '',
      diakoniaAction: 'Menunggu pelaksanaan',
    };

    updateData((prev) => ({
      ...prev,
      pastoralVisitations: [newVis, ...(prev.pastoralVisitations || [])],
    }));

    logActivity({
      category: 'Kunjungan Pastoral',
      action: 'Jadwalkan Kunjungan Pastoral',
      detail: `Kunjungan ke ${visFamilyName.trim()} (${visSectorUnit}) pada ${visDate}`,
      actorOverride: currentUserRole === 'superuser' ? 'Super Admin' : 'Admin Majelis',
      roleOverride: currentUserRole || 'admin1',
    });

    setVisFamilyName('');
    setVisAddress('');
    setVisPrayerNeed('');
    setVisSuccessMsg('Jadwal Kunjungan Pastoral berhasil ditambahkan dan otomatis tersinkron ke Kalender Kegiatan.');
    setTimeout(() => setVisSuccessMsg(null), 4000);
  };

  const combinedHistory = useMemo(() => {
    const prayerHistory = mySentPrayers.map((item) => ({
      id: item.id,
      badge: item.category,
      kindLabel: 'Kotak Doa',
      text: item.prayerText,
      sender: item.isAnonymous ? 'Anonim' : item.requesterName,
      unit: item.unit,
      createdAt: item.createdAt,
    }));

    const serviceHistory = (data.serviceRequests || []).map((item) => ({
      id: item.id,
      badge: item.type,
      kindLabel: 'Layanan Pastoral',
      text: item.detail,
      sender: item.requesterName,
      unit: item.unit,
      createdAt: item.createdAt,
    }));

    return [...prayerHistory, ...serviceHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [mySentPrayers, data.serviceRequests]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
          Pelayanan Pastoral &amp; Doa Syafaat Jemaat
        </p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100 text-balance sm:text-3xl">
          Kotak Doa &amp; Layanan Jemaat
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Sampaikan pokok doa ke Kotak Doa Majelis atau ajukan layanan pastoral (Lapor Warga Sakit, Baptis, Sidi, Nikah, serta Kunjungan Pastoral) di {data.profile.name}.
        </p>
      </div>

      {/* Tombol Pintasan Akses Cepat Layanan */}
      <section
        aria-label="Pintasan Akses Cepat Layanan"
        className="rounded-[28px] bg-gradient-to-br from-[#7F1D1D]/8 via-amber-500/10 to-transparent p-4 sm:p-5 border border-[#7F1D1D]/15 dark:from-[#7F1D1D]/20 dark:via-amber-500/10 dark:border-amber-500/20"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7F1D1D] dark:text-amber-400">
              Pintasan Akses Cepat Layanan Jemaat
            </h2>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Akses langsung satu ketukan
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => handleTabChange('Perangkat Pelayan')}
            className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all cursor-pointer ${
              activeTab === 'Perangkat Pelayan'
                ? 'bg-[#7F1D1D] text-white shadow-md ring-2 ring-[#7F1D1D] dark:bg-amber-400 dark:text-stone-950 dark:ring-amber-400'
                : 'bg-white text-stone-800 shadow-xs hover:bg-stone-50 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-[#1E232D]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeTab === 'Perangkat Pelayan'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-stone-950'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
              }`}
            >
              <Users className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-bold leading-tight">Perangkat Pelayan</span>
            <span
              className={`mt-0.5 text-[10px] ${
                activeTab === 'Perangkat Pelayan'
                  ? 'text-white/80 dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              PHMJ &amp; Pengurus KSB
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Galeri Kegiatan')}
            className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all cursor-pointer ${
              activeTab === 'Galeri Kegiatan'
                ? 'bg-[#7F1D1D] text-white shadow-md ring-2 ring-[#7F1D1D] dark:bg-amber-400 dark:text-stone-950 dark:ring-amber-400'
                : 'bg-white text-stone-800 shadow-xs hover:bg-stone-50 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-[#1E232D]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeTab === 'Galeri Kegiatan'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-stone-950'
                  : 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
              }`}
            >
              <Camera className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-bold leading-tight">Galeri Kegiatan</span>
            <span
              className={`mt-0.5 text-[10px] ${
                activeTab === 'Galeri Kegiatan'
                  ? 'text-white/80 dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Foto &amp; Dokumentasi
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Kunjungan Pastoral')}
            className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all cursor-pointer ${
              activeTab === 'Kunjungan Pastoral'
                ? 'bg-[#7F1D1D] text-white shadow-md ring-2 ring-[#7F1D1D] dark:bg-amber-400 dark:text-stone-950 dark:ring-amber-400'
                : 'bg-white text-stone-800 shadow-xs hover:bg-stone-50 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-[#1E232D]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeTab === 'Kunjungan Pastoral'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-stone-950'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-bold leading-tight">Kunjungan Pastoral</span>
            <span
              className={`mt-0.5 text-[10px] ${
                activeTab === 'Kunjungan Pastoral'
                  ? 'text-white/80 dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Rencana &amp; Jadwal
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Kotak Doa')}
            className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all cursor-pointer ${
              activeTab === 'Kotak Doa'
                ? 'bg-[#7F1D1D] text-white shadow-md ring-2 ring-[#7F1D1D] dark:bg-amber-400 dark:text-stone-950 dark:ring-amber-400'
                : 'bg-white text-stone-800 shadow-xs hover:bg-stone-50 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-[#1E232D]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeTab === 'Kotak Doa'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-stone-950'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              <Heart className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-bold leading-tight">Kotak Doa</span>
            <span
              className={`mt-0.5 text-[10px] ${
                activeTab === 'Kotak Doa'
                  ? 'text-white/80 dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Permohonan Doa
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Lapor Sakit')}
            className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all cursor-pointer ${
              activeTab === 'Lapor Sakit'
                ? 'bg-[#7F1D1D] text-white shadow-md ring-2 ring-[#7F1D1D] dark:bg-amber-400 dark:text-stone-950 dark:ring-amber-400'
                : 'bg-white text-stone-800 shadow-xs hover:bg-stone-50 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-[#1E232D]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeTab === 'Lapor Sakit'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-stone-950'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-bold leading-tight">Lapor Sakit</span>
            <span
              className={`mt-0.5 text-[10px] ${
                activeTab === 'Lapor Sakit'
                  ? 'text-white/80 dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Diakonia Kasih
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('Baptis/Sidi/Nikah')}
            className={`flex flex-col items-start rounded-2xl p-3 text-left transition-all cursor-pointer ${
              activeTab === 'Baptis/Sidi/Nikah'
                ? 'bg-[#7F1D1D] text-white shadow-md ring-2 ring-[#7F1D1D] dark:bg-amber-400 dark:text-stone-950 dark:ring-amber-400'
                : 'bg-white text-stone-800 shadow-xs hover:bg-stone-50 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-[#1E232D]'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                activeTab === 'Baptis/Sidi/Nikah'
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-stone-950'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
              }`}
            >
              <FileText className="h-4 w-4" />
            </div>
            <span className="mt-2 text-xs font-bold leading-tight">Baptis/Sidi/Nikah</span>
            <span
              className={`mt-0.5 text-[10px] ${
                activeTab === 'Baptis/Sidi/Nikah'
                  ? 'text-white/80 dark:text-stone-900'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Pelayanan Sakramen
            </span>
          </button>
        </div>
      </section>

      {/* Tabs navigation */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:grid-cols-3 lg:grid-cols-6 sm:rounded-full">
        {TAB_ITEMS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`min-h-[44px] whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer sm:text-sm sm:rounded-full ${
                isSelected
                  ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                  : 'text-stone-600 hover:bg-[#F4F6F9] dark:text-stone-300 dark:hover:bg-[#1E232D]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'Galeri Kegiatan' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-stone-900 dark:text-stone-100 sm:text-2xl">
                <Camera className="h-6 w-6 text-[#7F1D1D] dark:text-amber-400" />
                <span>Galeri &amp; Dokumentasi Kegiatan Jemaat</span>
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Dokumentasi foto kegiatan ibadah, persekutuan sektor, PAR, pemuda, diakonia, dan acara kebersamaan Jemaat GPI Getsemani Sorong.
              </p>
            </div>

            {currentUserRole !== 'jemaat' && (
              <button
                type="button"
                onClick={() => setIsAddGalleryModalOpen(true)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#7F1D1D] px-5 py-2 text-xs font-bold text-white hover:bg-[#68151B] cursor-pointer shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Tambah Dokumentasi Foto</span>
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {GALLERY_CATEGORIES.map((cat) => {
              const active = galleryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryFilter(cat)}
                  className={`min-h-[38px] rounded-full px-4 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'bg-white text-stone-700 hover:bg-stone-100 dark:bg-[#161A22] dark:text-stone-300 dark:hover:bg-stone-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Gallery Grid */}
          {filteredGallery.length === 0 ? (
            <div className="rounded-[24px] bg-white p-12 text-center text-sm text-stone-500 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] dark:text-stone-400">
              Belum ada foto dalam kategori galeri ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedGalleryItem(item)}
                  className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#161A22] cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    {item.category && (
                      <span className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white">
                        {item.category}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-stone-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-3 w-3" />
                      <span>Perbesar</span>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="text-[11px] font-semibold text-[#7F1D1D] dark:text-amber-400">
                        {item.date}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#7F1D1D] dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs line-clamp-2 text-stone-600 dark:text-stone-300 leading-relaxed">
                        {item.caption}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lightbox Modal */}
          {selectedGalleryItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
              <div className="relative max-h-[90vh] max-w-4xl w-full overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#161A22] flex flex-col">
                <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-stone-800">
                  <div>
                    <span className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                      {selectedGalleryItem.category || 'Galeri Kegiatan'} · {selectedGalleryItem.date}
                    </span>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {selectedGalleryItem.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGalleryItem(null)}
                    className="rounded-full bg-stone-100 p-2 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-hidden bg-stone-950 flex items-center justify-center">
                  <img
                    src={selectedGalleryItem.imageUrl}
                    alt={selectedGalleryItem.title}
                    className="max-h-[60vh] w-auto object-contain"
                  />
                </div>

                <div className="p-6 bg-white dark:bg-[#161A22] space-y-3">
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {selectedGalleryItem.caption}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      GPI Getsemani Sorong — Dokumentasi Jemaat
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const waShare = `https://wa.me/?text=${encodeURIComponent(
                          `Dokumentasi ${selectedGalleryItem.title} - ${selectedGalleryItem.caption} (${selectedGalleryItem.date})`
                        )}`;
                        window.open(waShare, '_blank');
                      }}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      <span>Bagikan ke WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Gallery Modal */}
          {isAddGalleryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="max-w-lg w-full rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#161A22] sm:p-7 space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-stone-800">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Tambah Foto Dokumentasi Galeri
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddGalleryModalOpen(false)}
                    className="rounded-full bg-stone-100 p-2 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddGalleryItem} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Judul Kegiatan / Foto *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Perayaan HUT Pelayanan Anak & Remaja (PAR)"
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Kategori Galeri
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    >
                      <option value="Ibadah Minggu">Ibadah Minggu</option>
                      <option value="Persekutuan & Sektor">Persekutuan &amp; Sektor</option>
                      <option value="PAR & Pemuda">PAR &amp; Pemuda</option>
                      <option value="Diakonia & Sosial">Diakonia &amp; Sosial</option>
                      <option value="Pembangunan & Lainnya">Pembangunan &amp; Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      URL Gambar Foto (Opsional / Unsplash) *
                    </label>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                    <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                      Jika dikosongkan, akan otomatis menggunakan foto default gereja.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Keterangan / Caption Singkat *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      placeholder="Tuliskan cerita singkat atau suasana kegiatan..."
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] p-3.5 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setIsAddGalleryModalOpen(false)}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-[#7F1D1D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#68151B] cursor-pointer"
                    >
                      Simpan &amp; Terbitkan Foto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'Perangkat Pelayan' ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7F1D1D]/10 px-3 py-1 text-xs font-bold text-[#7F1D1D] dark:bg-amber-400/20 dark:text-amber-300">
                  <Award className="h-3.5 w-3.5" />
                  <span>Periode Pelayanan Aktif 2024 – 2027</span>
                </span>
                <h2 className="mt-2 text-xl font-bold text-stone-900 dark:text-stone-100 sm:text-2xl">
                  Struktur Organisasi &amp; Perangkat Pelayan Jemaat
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  Daftar susunan Pelaksana Harian Majelis Jemaat (PHMJ), Pengurus Inti Wadah-Wadah Kategorial (Ketua, Sekretaris, Bendahara / KSB), serta Koordinator Sektor di {data.profile.name}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl bg-[#F4F6F9] px-4 py-2.5 text-center dark:bg-[#1E232D]">
                  <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                    PHMJ
                  </p>
                  <p className="text-base font-bold text-[#7F1D1D] dark:text-amber-400">
                    6 Pejabat
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F4F6F9] px-4 py-2.5 text-center dark:bg-[#1E232D]">
                  <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                    Wadah Kategorial
                  </p>
                  <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                    5 Wadah (KSB)
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F4F6F9] px-4 py-2.5 text-center dark:bg-[#1E232D]">
                  <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                    Sektor Pelayanan
                  </p>
                  <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                    2 Sektor (4 Unit)
                  </p>
                </div>
              </div>
            </div>

            {/* Filter pills & Search input */}
            <div className="mt-6 flex flex-col gap-3.5 border-t border-stone-100 pt-5 dark:border-stone-800 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {LEADER_FILTER_TABS.map((tab) => {
                  const active = leaderFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLeaderFilter(tab.id)}
                      className={`min-h-[36px] rounded-full px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                          : 'bg-[#F4F6F9] text-stone-700 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-300 dark:hover:bg-stone-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={leaderSearch}
                  onChange={(e) => setLeaderSearch(e.target.value)}
                  placeholder="Cari nama, jabatan, atau tugas..."
                  className="w-full rounded-full bg-[#F4F6F9] py-2 pl-9 pr-8 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7F1D1D]/25 dark:bg-[#1E232D] dark:text-stone-100"
                />
                {leaderSearch && (
                  <button
                    type="button"
                    onClick={() => setLeaderSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredLeaders.length === 0 ? (
            <div className="rounded-[28px] bg-white p-12 text-center text-sm text-stone-500 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] dark:text-stone-400">
              Tidak ada data pelayan yang cocok dengan kata kunci &quot;{leaderSearch}&quot;.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group 1: PHMJ (Pelaksana Harian Majelis Jemaat) */}
              {(leaderFilter === 'Semua' || leaderFilter === 'PHMJ') && (
                <div className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-400/20 dark:text-amber-300">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
                          Pelaksana Harian Majelis Jemaat (PHMJ)
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Badan kepemimpinan dan pelayanan harian sidang jemaat GPI Getsemani Sorong
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      6 Pejabat
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredLeaders
                      .filter((l) => l.group === 'PHMJ')
                      .map((leader) => {
                        const isKmj = leader.roleTitle.toLowerCase().includes('ketua phmj');
                        return (
                          <div
                            key={leader.id}
                            className={`flex flex-col justify-between rounded-2xl p-4.5 transition-all ${
                              isKmj
                                ? 'bg-gradient-to-br from-[#7F1D1D]/8 via-[#7F1D1D]/4 to-amber-500/10 border-2 border-[#7F1D1D]/30 dark:border-amber-400/40 dark:from-[#7F1D1D]/25 dark:via-[#161A22] dark:to-transparent'
                                : 'bg-[#F4F6F9] border border-stone-200/60 dark:bg-[#1E232D] dark:border-stone-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                    isKmj
                                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                                      : 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200'
                                  }`}
                                >
                                  {leader.roleTitle}
                                </span>
                                {leader.titleOrStatus && (
                                  <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                                    {leader.titleOrStatus}
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7F1D1D] text-sm font-bold text-white shadow-xs dark:bg-amber-400 dark:text-stone-950">
                                  {leader.name
                                    .split(' ')
                                    .filter((p) => !['Pdt.', 'Pnt.', 'Dkn.', 'Vic.', 'Ny.', 'Bpk.', 'Sdri.', 'Sdr.'].includes(p))
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-stone-900 truncate dark:text-stone-100">
                                    {leader.name}
                                  </h4>
                                  <p className="text-[11px] text-[#7F1D1D] dark:text-amber-400 font-medium">
                                    GPI Getsemani Sorong
                                  </p>
                                </div>
                              </div>

                              {leader.notes && (
                                <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                                  {leader.notes}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-2">
                              {leader.phone ? (
                                <a
                                  href={`https://wa.me/${leader.phone}?text=${encodeURIComponent(
                                    `Shalom ${leader.name}, saya warga jemaat GPI Getsemani Sorong ingin berkoordinasi mengenai pelayanan...`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>Hubungi WhatsApp</span>
                                </a>
                              ) : (
                                <span className="text-xs text-stone-400">Sekretariat Jemaat</span>
                              )}

                              {leader.email && (
                                <a
                                  href={`mailto:${leader.email}`}
                                  className="rounded-full bg-stone-200 p-2 text-stone-700 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                                  title={leader.email}
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Group 2: Pengurus Inti Wadah Kategorial (KSB) */}
              {(leaderFilter === 'Semua' || ['PAR', 'PP', 'PERWATA', 'PERPRI', 'LANSIA'].includes(leaderFilter)) && (
                <div className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7 space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
                          Pengurus Inti Wadah-Wadah Kategorial (KSB)
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Ketua, Sekretaris, dan Bendahara pada 5 wadah kategorial pelayanan jemaat
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Loop across Wadah */}
                  {(['PAR', 'PP', 'PERWATA', 'PERPRI', 'LANSIA'] as MinistryLeaderGroup[])
                    .filter((g) => leaderFilter === 'Semua' || leaderFilter === g)
                    .map((groupKey) => {
                      const leadersInGroup = filteredLeaders.filter((l) => l.group === groupKey);
                      if (leadersInGroup.length === 0) return null;

                      const groupMeta = {
                        PAR: {
                          title: 'Pelayanan Anak & Remaja (PAR)',
                          desc: 'Pembinaan iman anak sekolah minggu dan remaja gereja.',
                          badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
                        },
                        PP: {
                          title: 'Persekutuan Pemuda (PP)',
                          desc: 'Pembinaan persekutuan pemuda, minat bakat, dan misi pelayanan muda.',
                          badgeColor: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
                        },
                        PERWATA: {
                          title: 'Persekutuan Wanita (PERWATA)',
                          desc: 'Persekutuan ibu-ibu jemaat, perlawatan kasih, dan pembinaan keluarga.',
                          badgeColor: 'bg-pink-100 text-pink-900 dark:bg-pink-950/60 dark:text-pink-300',
                        },
                        PERPRI: {
                          title: 'Persekutuan Pria (PERPRI)',
                          desc: 'Persekutuan bapak-bapak, kepemimpinan keluarga, dan kepedulian jemaat.',
                          badgeColor: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300',
                        },
                        LANSIA: {
                          title: 'Persekutuan Lanjut Usia (LANSIA)',
                          desc: 'Persekutuan opa-oma jemaat, doa syafaat lansia, dan perkunjungan kasih.',
                          badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
                        },
                        PHMJ: { title: '', desc: '', badgeColor: '' },
                        'Koordinator Sektor': { title: '', desc: '', badgeColor: '' },
                      }[groupKey];

                      return (
                        <div key={groupKey} className="rounded-2xl border border-stone-200/70 p-4.5 dark:border-stone-800 space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 dark:border-stone-800/80">
                            <div>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${groupMeta.badgeColor}`}>
                                {groupKey}
                              </span>
                              <h4 className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100">
                                {groupMeta.title}
                              </h4>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                {groupMeta.desc}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                              Pengurus Inti KSB
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                            {leadersInGroup.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col justify-between rounded-xl bg-[#F4F6F9] p-3.5 dark:bg-[#1E232D]"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-[#7F1D1D] dark:text-amber-400">
                                      {item.roleTitle}
                                    </span>
                                    {item.sectorOrUnit && (
                                      <span className="text-stone-500 dark:text-stone-400">
                                        {item.sectorOrUnit}
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="mt-1.5 text-sm font-bold text-stone-900 dark:text-stone-100">
                                    {item.name}
                                  </h5>
                                  {item.notes && (
                                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
                                  {item.phone && (
                                    <a
                                      href={`https://wa.me/${item.phone}?text=${encodeURIComponent(
                                        `Shalom ${item.name} (${item.roleTitle} ${groupKey}), saya jemaat GPI Getsemani ingin bertanya mengenai persekutuan...`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                                    >
                                      <MessageCircle className="h-3 w-3" />
                                      <span>Hubungi WA</span>
                                    </a>
                                  )}
                                  <span className="text-[10px] text-stone-400">
                                    {item.titleOrStatus || 'Pengurus Wadah'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Group 3: Koordinator Sektor Pelayanan */}
              {(leaderFilter === 'Semua' || leaderFilter === 'Koordinator Sektor') && (
                <div className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
                          Koordinator Sektor &amp; Unit Pelayanan
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Pendampingan pelayanan jemaat pada wilayah Sektor Filadelfia dan Sektor Petra
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredLeaders
                      .filter((l) => l.group === 'Koordinator Sektor')
                      .map((sectorLeader) => (
                        <div
                          key={sectorLeader.id}
                          className="flex flex-col justify-between rounded-2xl bg-[#F4F6F9] p-4.5 dark:bg-[#1E232D] border border-stone-200/60 dark:border-stone-800"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#7F1D1D] dark:text-amber-400">
                                {sectorLeader.roleTitle}
                              </span>
                              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                                {sectorLeader.titleOrStatus}
                              </span>
                            </div>

                            <h4 className="mt-2 text-base font-bold text-stone-900 dark:text-stone-100">
                              {sectorLeader.name}
                            </h4>
                            <p className="mt-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                              Wilayah: {sectorLeader.sectorOrUnit}
                            </p>
                            {sectorLeader.notes && (
                              <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                                {sectorLeader.notes}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
                            {sectorLeader.phone && (
                              <a
                                href={`https://wa.me/${sectorLeader.phone}?text=${encodeURIComponent(
                                  `Shalom ${sectorLeader.name}, saya warga ${sectorLeader.sectorOrUnit} ingin berkoordinasi...`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>Hubungi Koordinator</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Firman Penguatan Pelayanan */}
              <div className="rounded-[24px] bg-amber-50/90 p-5 dark:bg-amber-950/20 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  <span>Dasar Firman Pelayanan Jemaat</span>
                </div>
                <blockquote className="mt-2.5 font-reading text-sm italic leading-relaxed text-stone-800 dark:text-stone-200">
                  &ldquo;Layanilah seorang akan yang lain, sesuai dengan karunia yang telah diperoleh tiap-tiap orang sebagai pengurus yang baik dari kasih karunia Allah.&rdquo;
                </blockquote>
                <p className="mt-2 text-xs font-semibold text-stone-600 dark:text-stone-400">
                  — 1 Petrus 4:10
                </p>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'Kunjungan Pastoral' ? (
        <div className="space-y-6">
          {/* Section 1: Rencana Kerja Majelis */}
          <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4 dark:border-stone-800/80">
              <FileText className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
                  01. Rencana Kerja Majelis Jemaat — Kunjungan Pastoral
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Program perlawatan dan pembinaan rohani warga jemaat berdasarkan keputusan sidang Majelis.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {(data.pastoralWorkPlans || []).map((plan) => (
                <div key={plan.id} className="rounded-2xl bg-[#F4F6F9] p-4 dark:bg-[#1E232D] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#7F1D1D] dark:text-amber-400">{plan.quarter}</span>
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${
                      plan.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}>
                      {plan.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{plan.title}</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{plan.objective}</p>
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[11px] text-stone-500">
                    <span>{plan.sectorOrUnit}</span>
                    <span className="font-medium">{plan.targetMonth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Pelaksanaan & Jadwal Kunjungan */}
          <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 dark:border-stone-800/80">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
                    02. Pelaksanaan &amp; Jadwal Kunjungan Pastoral
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Daftar kunjungan rumah tangga, doa syafaat, dan penyerahan diakonia kasih. (Tersinkron otomatis ke Kalender)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              {(data.pastoralVisitations || []).map((vis) => (
                <div key={vis.id} className="rounded-2xl border border-stone-200/70 p-4.5 dark:border-stone-800 bg-white dark:bg-[#161A22] space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                          {vis.sectorOrUnit}
                        </span>
                        <span className="text-stone-300 dark:text-stone-700">·</span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          vis.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {vis.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {vis.familyName}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                        <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{vis.address}</span>
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1 justify-end">
                        <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                        {vis.scheduledDate} · {vis.time}
                      </p>
                      <p className="mt-1 text-stone-500 dark:text-stone-400">
                        Petugas: <strong className="text-stone-800 dark:text-stone-200">{vis.assignedMajelis}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#F4F6F9] p-3 dark:bg-[#1E232D] text-xs space-y-1.5">
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      Kebutuhan / Pergumulan Doa: <span className="font-normal text-stone-600 dark:text-stone-400">{vis.prayerNeed}</span>
                    </p>
                    {vis.resultReport ? (
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                        Hasil Laporan Kunjungan: <span className="font-normal text-stone-700 dark:text-stone-300">{vis.resultReport}</span>
                      </p>
                    ) : (
                      <p className="text-amber-700 dark:text-amber-400 italic">
                        Laporan hasil kunjungan sedang dipersiapkan oleh Majelis bertugas.
                      </p>
                    )}
                    {vis.diakoniaAction && (
                      <p className="font-medium text-[#7F1D1D] dark:text-amber-400">
                        Aksi Diakonia: {vis.diakoniaAction}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Form Jadwal Kunjungan Baru */}
          <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 dark:border-stone-800/80">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
                    03. Tambah / Jadwalkan Kunjungan Pastoral Baru
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Majelis Jemaat dapat menjadwalkan kunjungan baru yang otomatis tersinkron ke Kotak Doa dan Kalender.
                  </p>
                </div>
              </div>

              {canManagePastoral ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    Masuk sebagai {currentUserRole === 'superuser' ? 'Super Admin' : 'Admin'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Khusus Akun Admin &amp; Super Admin</span>
                </span>
              )}
            </div>

            {canManagePastoral ? (
              <form onSubmit={handleAddVisitation} className="mt-5 space-y-4">
                {visSuccessMsg && (
                  <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {visSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Nama Keluarga / Warga Jemaat *
                    </label>
                    <input
                      type="text"
                      required
                      value={visFamilyName}
                      onChange={(e) => setVisFamilyName(e.target.value)}
                      placeholder="Contoh: Kel. Bpk. Markus Rumere"
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Sektor &amp; Unit Pelayanan
                    </label>
                    <select
                      value={visSectorUnit}
                      onChange={(e) => setVisSectorUnit(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Alamat Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={visAddress}
                      onChange={(e) => setVisAddress(e.target.value)}
                      placeholder="Jl. Malanu / Perumahan..."
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Tanggal Pelaksanaan *
                    </label>
                    <input
                      type="date"
                      required
                      value={visDate}
                      onChange={(e) => setVisDate(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Waktu / Jam
                    </label>
                    <input
                      type="text"
                      value={visTime}
                      onChange={(e) => setVisTime(e.target.value)}
                      placeholder="16.00 WIT"
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Petugas Majelis / Pendeta Bertugas
                    </label>
                    <input
                      type="text"
                      value={visMajelis}
                      onChange={(e) => setVisMajelis(e.target.value)}
                      placeholder="Pdt. Yosua Waromi, S.Th. & Majelis Sektor"
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Kebutuhan / Alasan Kunjungan Pastoral
                    </label>
                    <input
                      type="text"
                      value={visPrayerNeed}
                      onChange={(e) => setVisPrayerNeed(e.target.value)}
                      placeholder="Doa pemulihan sakit / perlawatan lansia..."
                      className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#7F1D1D] text-xs font-bold text-white transition-all hover:bg-[#68151B] active:scale-[0.98] cursor-pointer sm:text-sm shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Simpan &amp; Sinkronkan Jadwal Kunjungan Pastoral</span>
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-[#F4F6F9]/80 p-6 text-center dark:border-stone-800 dark:bg-[#1E232D]/50 sm:p-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-stone-900 dark:text-stone-100 sm:text-base">
                  Akses Terbatas: Khusus Akun Admin &amp; Super Admin
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Untuk menambahkan atau menjadwalkan Kunjungan Pastoral baru Majelis Jemaat, Anda harus masuk (login) terlebih dahulu menggunakan akun <strong>Super Admin</strong> atau <strong>Admin</strong>.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => openMenuSheet(true)}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#7F1D1D] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#68151B] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>Masuk sebagai Admin / Super Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-7"
          >
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4 dark:border-stone-800/80">
              {activeTab === 'Kotak Doa' ? (
                <Heart className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
              ) : (
                <HeartHandshake className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
              )}
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {activeTab === 'Kotak Doa'
                  ? 'Formulir Kotak Doa Jemaat'
                  : `Formulir ${activeTab === 'Baptis/Sidi/Nikah' ? 'Baptis, Sidi & Nikah' : activeTab}`}
              </h2>
            </div>

            {activeTab === 'Kotak Doa' && (
              <>
                <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50/80 px-4 py-3 text-xs text-amber-950 dark:bg-amber-950/25 dark:text-amber-200">
                  <Lock className="h-4 w-4 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
                  <span>
                    <strong>Kerahasiaan Terjaga:</strong> Permohonan doa hanya dapat dibuka oleh Majelis Jemaat di Dashboard Pelayanan.
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F4F6F9] px-4 py-3 dark:bg-[#1E232D]">
                  <div>
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      Kirim sebagai Anonim (Tanpa Nama)
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Aktifkan jika Anda ingin identitas nama tetap dirahasiakan.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-stone-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#7F1D1D] peer-checked:after:translate-x-5 dark:bg-stone-700 dark:peer-checked:bg-amber-400" />
                  </label>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {activeTab === 'Kotak Doa' && isAnonymous
                    ? 'Nama Lengkap (Otomatis Anonim)'
                    : 'Nama Lengkap Pemohon *'}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  disabled={activeTab === 'Kotak Doa' && isAnonymous}
                  required={activeTab !== 'Kotak Doa' || !isAnonymous}
                  value={activeTab === 'Kotak Doa' && isAnonymous ? 'Anonim' : requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Contoh: Kel. Bpk. Yohanes Kambu"
                  className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none disabled:opacity-60 dark:bg-[#1E232D] dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  No. WhatsApp / Telepon {activeTab === 'Kotak Doa' ? '(Opsional)' : ''}
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeTab === 'Kotak Doa' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Kategori Pokok Doa
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PrayerCategory)}
                    className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                  >
                    {PRAYER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'Baptis/Sidi/Nikah' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Jenis Pelayanan Sakramen / Peneguhan
                  </label>
                  <select
                    value={sacramentKind}
                    onChange={(e) => setSacramentKind(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                  >
                    <option value="Baptis Kudus Anak">Baptis Kudus Anak</option>
                    <option value="Baptis Dewasa & Sidi">Baptis Dewasa &amp; Sidi</option>
                    <option value="Peneguhan Nikah Kudus">Peneguhan Nikah Kudus</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Asal Sektor / Unit Pelayanan
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-3 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                {activeTab === 'Kotak Doa'
                  ? 'Isi Permohonan Pokok Doa Syafaat *'
                  : activeTab === 'Lapor Sakit'
                  ? 'Keterangan Nama Jemaat Sakit & Lokasi Perawatan / Rumah *'
                  : 'Keterangan Rencana Tanggal & Catatan Pelayanan *'}
              </label>
              <textarea
                rows={4}
                required
                value={detailText}
                onChange={(e) => setDetailText(e.target.value)}
                placeholder={
                  activeTab === 'Kotak Doa'
                    ? 'Tuliskan pergumulan atau ucapan syukur Anda di sini...'
                    : activeTab === 'Lapor Sakit'
                    ? 'Contoh: Ibu Martha Kambu dirawat di RSUD Sele Be Solu Ruang Kasih No. 3...'
                    : 'Contoh: Rencana pernikahan kudus pada bulan Desember 2026...'
                }
                className="mt-1.5 w-full rounded-2xl bg-[#F4F6F9] p-3.5 text-sm text-stone-900 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
              />
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#7F1D1D] text-xs font-bold text-white transition-all hover:bg-[#68151B] active:scale-[0.98] disabled:opacity-50 cursor-pointer sm:text-sm shadow-sm"
            >
              <Send className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Mengirim Doa...'
                  : activeTab === 'Kotak Doa'
                  ? 'Kirim ke Kotak Doa'
                  : 'Siapkan Pesan WhatsApp'}
              </span>
            </button>

            {submittedResult && (
              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        {submittedResult.title}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                        {submittedResult.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={submittedResult.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{submittedResult.waButtonLabel}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          <aside className="space-y-5">
            <div className="rounded-[24px] bg-amber-50/90 p-5 dark:bg-amber-950/20 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>Janji Firman Tuhan</span>
              </div>
              <blockquote className="mt-3 font-reading text-base italic leading-relaxed text-stone-800 dark:text-stone-200">
                &ldquo;Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.&rdquo;
              </blockquote>
              <p className="mt-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
                — Filipi 4:6
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-6">
              <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3 dark:border-stone-800/80">
                <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                  <ShieldCheck className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                  <span>Terkirim dari Perangkat Ini</span>
                </h2>
                <span className="font-tabular text-xs font-semibold text-stone-500 dark:text-stone-400">
                  {combinedHistory.length}
                </span>
              </div>

              {combinedHistory.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                  Belum ada permohonan doa atau layanan yang Anda kirimkan dari perangkat ini.
                </p>
              ) : (
                <div className="mt-3 max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
                  {combinedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#F4F6F9] p-3.5 dark:bg-[#1E232D]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-[#7F1D1D] dark:text-amber-400">
                          {item.kindLabel} · {item.badge}
                        </span>
                        <span className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                        {item.text}
                      </p>
                      <p className="mt-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                        {item.sender} · {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
