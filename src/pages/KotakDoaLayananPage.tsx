import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  HeartHandshake,
  Lock,
  MapPin,
  MessageCircle,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { usePrayerBox } from '../hooks/usePrayerBox';
import { PRAYER_CATEGORIES } from '../services/prayerBoxService';
import { PrayerCategory } from '../types/church';

export type KotakDoaLayananTab = 'Kotak Doa' | 'Lapor Sakit' | 'Baptis/Sidi/Nikah' | 'Kunjungan Pastoral';

const UNITS = [
  'Unit Rehoboth (Filadelfia)',
  'Unit Silo (Filadelfia)',
  'Unit Pniel (Petra)',
  'Unit Siloam (Petra)',
  'Simpatisan / Tamu',
];

const TAB_ITEMS: { id: KotakDoaLayananTab; label: string }[] = [
  { id: 'Kotak Doa', label: 'Kotak Doa' },
  { id: 'Lapor Sakit', label: 'Lapor Sakit' },
  { id: 'Baptis/Sidi/Nikah', label: 'Baptis / Sidi / Nikah' },
  { id: 'Kunjungan Pastoral', label: 'Kunjungan Pastoral' },
];

export const KotakDoaLayananPage: React.FC<{ initialTab?: KotakDoaLayananTab }> = ({
  initialTab = 'Kotak Doa',
}) => {
  const { data, updateData, logActivity } = usePortal();
  const { mySentPrayers, submitPrayer } = usePrayerBox(false);

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
      actorOverride: 'Majelis Jemaat',
      roleOverride: 'admin1',
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

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:grid-cols-4 sm:rounded-full">
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

      {activeTab === 'Kunjungan Pastoral' ? (
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
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4 dark:border-stone-800/80">
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
