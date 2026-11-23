import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Church,
  Cloud,
  Database,
  Download,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Moon,
  Music,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { useBibleDatabase } from '../hooks/useBibleDatabase';
import { useKidungDatabase } from '../hooks/useKidungDatabase';
import { useGoogleSheetsSync } from '../hooks/useGoogleSheetsSync';
import { PageRoute } from '../types/church';
import { ChurchLogo } from './ChurchLogo';
import { PWAInstallButton } from './PWAComponents';

const ROUTE_TITLES: Record<PageRoute, string> = {
  beranda: 'GPI Getsemani',
  'tata-ibadah': 'Tata Ibadah',
  'liturgi-unsur': 'Liturgi Wadah',
  jadwal: 'Jadwal Ibadah',
  warta: 'Warta Jemaat',
  nyanyian: 'Kidung Pujian',
  alkitab: 'Alkitab',
  layanan: 'Kotak Doa & Layanan Jemaat',
  'kotak-doa': 'Kotak Doa & Layanan Jemaat',
  keuangan: 'Laporan Keuangan',
  statistik: 'Data & Statistik',
  profil: 'Profil & Kontak',
  tentang: 'Tentang Aplikasi',
  dashboard: 'Dashboard Majelis',
};

const DESKTOP_NAV: { id: PageRoute; label: string }[] = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tata-ibadah', label: 'Ibadah' },
  { id: 'nyanyian', label: 'Kidung' },
  { id: 'alkitab', label: 'Alkitab' },
  { id: 'warta', label: 'Warta' },
];

const MOBILE_TABS: {
  id: PageRoute | 'menu-sheet';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'tata-ibadah', label: 'Ibadah', icon: Church },
  { id: 'nyanyian', label: 'Kidung', icon: Music },
  { id: 'alkitab', label: 'Alkitab', icon: BookOpen },
  { id: 'menu-sheet', label: 'Pengaturan', icon: Settings },
];

const SettingsSheetContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    data,
    updateData,
    resetDemoData,
    logActivity,
    setRoute,
    isDark,
    toggleDark,
    fontScale,
    increaseFont,
    decreaseFont,
    currentUserRole,
    currentUsername,
    focusAdminLogin,
    loginAdmin,
    logoutAdmin,
    googleUser,
    isGoogleConnected,
    isSyncingWorkspace,
    workspaceNotice,
    clearWorkspaceNotice,
    connectGoogleWorkspace,
    disconnectGoogleWorkspace,
    syncNowToWorkspace,
  } = usePortal();

  const {
    dbStats: bibleDbStats,
    isDownloadingFull: isDownloadingBible,
    downloadProgress: bibleProgress,
    isOnline,
    downloadFullOffline: downloadBibleOffline,
    resetBibleOfflineDb,
  } = useBibleDatabase();

  const {
    stats: kidungStats,
    hymns: kidungHymns,
    isDownloading: isDownloadingKidung,
    downloadFullPack: downloadKidungPack,
  } = useKidungDatabase();

  const {
    isSyncingAll: isSyncingSheets,
    offlineCache: sheetsCache,
    syncAllConfiguredSheets,
    restoreFromOfflineCache,
  } = useGoogleSheetsSync();

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showAccountPasswords, setShowAccountPasswords] = useState(false);
  const [passAdmin1, setPassAdmin1] = useState('');
  const [passAdmin2, setPassAdmin2] = useState('');

  const [confirmBibleReset, setConfirmBibleReset] = useState(false);
  const [confirmDemoReset, setConfirmDemoReset] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (focusAdminLogin) {
      setShowLoginForm(true);
    }
  }, [focusAdminLogin]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const showToast = (msg: string) => {
    setSettingsFeedback(msg);
    window.setTimeout(() => {
      setSettingsFeedback((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const isAdminLoggedIn = currentUserRole !== null && currentUserRole !== 'jemaat';
  const isSuperUser = currentUserRole === 'superuser';
  const fontLabels = ['Kecil', 'Normal', 'Besar', 'Lansia'];
  const roleLabel =
    currentUserRole === 'superuser'
      ? 'Super User · Majelis'
      : currentUserRole === 'admin1'
      ? 'Admin 1 · Sekretaris'
      : currentUserRole === 'admin2'
      ? 'Admin 2 · Ibadah'
      : currentUsername
      ? 'Warga Jemaat'
      : 'Akses Terbuka · Umum';

  const handleNavigate = (target: PageRoute) => {
    setRoute(target);
    onClose();
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = loginAdmin(username, password);
    if (!res.ok) {
      setLoginError(res.message);
      return;
    }
    setUsername('');
    setPassword('');
    setShowLoginForm(false);
    onClose();
  };

  const handleResetAdminPassword = (targetUsername: 'admin1' | 'admin2', nextPass: string) => {
    const clean = nextPass.trim();
    if (clean.length < 4) {
      showToast('Kata sandi baru minimal 4 karakter.');
      return;
    }
    updateData((prev) => ({
      ...prev,
      adminAccounts: prev.adminAccounts.map((acc) =>
        acc.username === targetUsername ? { ...acc, password: clean } : acc
      ),
    }));
    logActivity({
      category: 'Akun',
      action: 'Reset Kata Sandi Admin',
      detail: `Kata sandi akun ${targetUsername} diperbarui melalui Pengaturan.`,
    });
    if (targetUsername === 'admin1') setPassAdmin1('');
    if (targetUsername === 'admin2') setPassAdmin2('');
    showToast(`Kata sandi ${targetUsername} berhasil diperbarui.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px] md:items-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Aplikasi"
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-[28px] bg-[#F4F6F9] px-5 pb-8 pt-3 shadow-2xl dark:bg-[#161A22] md:max-w-lg md:rounded-[28px] md:p-6 animate-android-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Grab Handle (mobile) */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-700 md:hidden" />

        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-400/15 dark:text-amber-300">
              <Settings className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Pengaturan
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Pusat kontrol akun, tampilan & data offline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200/70 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
            aria-label="Tutup pengaturan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {(settingsFeedback || workspaceNotice) && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{settingsFeedback || workspaceNotice}</span>
            </span>
            {workspaceNotice && !settingsFeedback && (
              <button
                type="button"
                onClick={clearWorkspaceNotice}
                className="text-emerald-700 hover:opacity-75 dark:text-emerald-300 cursor-pointer"
                aria-label="Tutup pemberitahuan"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* 1. PENGATURAN AKUN & LOGIN ADMIN */}
          <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Akun & Akses Admin
            </p>
            <div className="rounded-2xl bg-white p-4 dark:bg-[#1E232D]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      isAdminLoggedIn
                        ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                        : 'bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-400/15 dark:text-amber-300'
                    }`}
                  >
                    {isAdminLoggedIn ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                      {currentUsername || 'Mode Jemaat'}
                    </p>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                      {roleLabel}
                    </p>
                  </div>
                </div>

                {currentUsername ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logoutAdmin();
                    }}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-red-50 px-3.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 cursor-pointer shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Keluar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginForm((prev) => !prev);
                      setLoginError(null);
                    }}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#7F1D1D] px-4 text-xs font-semibold text-white hover:bg-[#68151B] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>{showLoginForm ? 'Tutup' : 'Login Admin'}</span>
                  </button>
                )}
              </div>

              {isAdminLoggedIn && (
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="mt-3 flex min-h-[44px] w-full items-center justify-between rounded-full bg-[#7F1D1D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#68151B] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Buka Dashboard Majelis (Edit Data)</span>
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </button>
              )}

              {/* Inline Admin Login Form */}
              {!isAdminLoggedIn && showLoginForm && (
                <form
                  onSubmit={handleAdminLoginSubmit}
                  className="mt-4 space-y-3 border-t border-stone-100 pt-4 dark:border-stone-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Masuk Pengurus / Admin Bertugas
                    </p>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      Kelola Data Pelayanan
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="settings-admin-username"
                      className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300"
                    >
                      Username
                    </label>
                    <div className="relative mt-1">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="settings-admin-username"
                        type="text"
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                        placeholder="Masukkan username admin"
                        className="h-11 w-full rounded-2xl bg-[#F4F6F9] pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7F1D1D] dark:bg-[#161A22] dark:text-stone-100 dark:focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="settings-admin-password"
                      className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300"
                    >
                      Kata Sandi
                    </label>
                    <div className="relative mt-1">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="settings-admin-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                        placeholder="Masukkan kata sandi"
                        className="h-11 w-full rounded-2xl bg-[#F4F6F9] pl-10 pr-11 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7F1D1D] dark:bg-[#161A22] dark:text-stone-100 dark:focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      <p className="font-medium leading-relaxed">{loginError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#7F1D1D] text-xs font-semibold text-white hover:bg-[#68151B] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Masuk & Buka Dashboard</span>
                  </button>
                </form>
              )}

              {/* Pengaturan Sandi Admin & Reset Data Lokal (Super User only) */}
              {isSuperUser && (
                <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAccountPasswords((p) => !p)}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F4F6F9] px-3.5 py-2.5 text-left text-xs font-semibold text-stone-800 hover:bg-stone-200/70 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                      <span>Kelola Kata Sandi Admin 1 & Admin 2</span>
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        showAccountPasswords ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {showAccountPasswords && (
                    <div className="space-y-2.5 rounded-xl bg-[#F4F6F9] p-3 dark:bg-[#161A22]">
                      {(['admin1', 'admin2'] as const).map((uname) => {
                        const val = uname === 'admin1' ? passAdmin1 : passAdmin2;
                        const setVal = uname === 'admin1' ? setPassAdmin1 : setPassAdmin2;
                        const label = uname === 'admin1' ? 'Admin 1 (Sekretaris)' : 'Admin 2 (Ibadah)';
                        return (
                          <div key={uname} className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                              {label}
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                placeholder={`Sandi baru ${uname}...`}
                                className="h-9 flex-1 rounded-xl bg-white px-3 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#7F1D1D] dark:bg-[#1E232D] dark:text-stone-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleResetAdminPassword(uname, val)}
                                className="rounded-xl bg-[#7F1D1D] px-3 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <div className="border-t border-stone-200/70 pt-2.5 dark:border-stone-800">
                        {!confirmDemoReset ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDemoReset(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline dark:text-red-400 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Pulihkan Data Awal Portal (LocalStorage)</span>
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-2.5 text-xs dark:bg-red-950/40">
                            <span className="font-medium text-red-800 dark:text-red-200">
                              Kembalikan semua data lokal ke awal?
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmDemoReset(false)}
                                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  resetDemoData();
                                  setConfirmDemoReset(false);
                                  showToast('Data awal portal berhasil dipulihkan.');
                                }}
                                className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                              >
                                Pulihkan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 2. TAMPILAN & KENYAMANAN BACA */}
          <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Tampilan & Kenyamanan Baca
            </p>
            <div className="divide-y divide-stone-100 rounded-2xl bg-white dark:divide-stone-800 dark:bg-[#1E232D]">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleDark}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-stone-50/60 dark:hover:bg-white/[0.02] rounded-t-2xl cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F6F9] text-stone-700 dark:bg-[#161A22] dark:text-amber-300">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Tema Layar
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Aktif: {isDark ? 'Mode Gelap' : 'Mode Terang'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#F4F6F9] px-3 py-1.5 text-[11px] font-semibold text-stone-700 dark:bg-[#161A22] dark:text-amber-300">
                  {isDark ? 'Ke Terang' : 'Ke Gelap'}
                </span>
              </button>

              {/* Font size control */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Ukuran Huruf Bacaan
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Alkitab, Kidung, Liturgi & Warta · <strong className="text-stone-800 dark:text-stone-200">{fontLabels[fontScale]}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={decreaseFont}
                    disabled={fontScale === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F6F9] text-xs font-bold text-stone-800 disabled:opacity-35 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer"
                    aria-label="Perkecil teks"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={increaseFont}
                    disabled={fontScale === 3}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F6F9] text-xs font-bold text-stone-800 disabled:opacity-35 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer"
                    aria-label="Perbesar teks"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. PENYIMPANAN OFFLINE & APLIKASI */}
          <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Penyimpanan Offline & Aplikasi
            </p>
            <div className="divide-y divide-stone-100 rounded-2xl bg-white dark:divide-stone-800 dark:bg-[#1E232D]">
              {/* Alkitab Offline */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Alkitab Offline (66 Kitab)
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Tersimpan {bibleDbStats.cachedChaptersCount.toLocaleString('id-ID')} /{' '}
                        {bibleDbStats.totalCanonicalChapters.toLocaleString('id-ID')} pasal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isDownloadingBible || !isOnline}
                      onClick={async () => {
                        const res = await downloadBibleOffline();
                        if (res) {
                          logActivity({
                            category: 'Sinkronisasi',
                            action: 'Unduh Database Alkitab Offline',
                            detail: `${res.chaptersSaved} pasal disimpan ke IndexedDB melalui Pengaturan.`,
                          });
                          showToast(`Alkitab offline (${res.chaptersSaved} pasal) siap digunakan.`);
                        }
                      }}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-[#7F1D1D] px-3 text-[11px] font-semibold text-white hover:bg-[#68151B] disabled:opacity-45 cursor-pointer"
                    >
                      <Download className={`h-3.5 w-3.5 ${isDownloadingBible ? 'animate-bounce' : ''}`} />
                      <span>{bibleDbStats.isFullOfflineReady ? 'Perbarui' : 'Unduh'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmBibleReset((prev) => !prev)}
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#F4F6F9] text-stone-600 hover:bg-red-50 hover:text-red-700 dark:bg-[#161A22] dark:text-stone-300 cursor-pointer"
                      title="Reset Cache Alkitab"
                      aria-label="Reset Cache Alkitab"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {bibleProgress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300">
                      <span>{bibleProgress.detail}</span>
                      <span className="font-tabular font-bold">{bibleProgress.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4F6F9] dark:bg-[#161A22]">
                      <div
                        className="h-full rounded-full bg-[#7F1D1D] dark:bg-amber-400 transition-all"
                        style={{ width: `${bibleProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {confirmBibleReset && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-2.5 text-xs dark:bg-red-950/40">
                    <span className="font-medium text-red-800 dark:text-red-200">
                      Hapus cache unduhan Alkitab?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmBibleReset(false)}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await resetBibleOfflineDb();
                          setConfirmBibleReset(false);
                          showToast('Cache offline Alkitab telah direset.');
                        }}
                        className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Kidung Pujian Offline */}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-[#7F1D1D] dark:bg-amber-400/15 dark:text-amber-300">
                    <Music className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Kidung Pujian Offline
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Tersimpan {(kidungStats?.cachedHymnsCount ?? kidungHymns.length).toLocaleString('id-ID')} lagu (KJ, PKJ, NKB, DSL, NR)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDownloadingKidung}
                  onClick={async () => {
                    const count = await downloadKidungPack();
                    if (count > 0) {
                      showToast(`${count.toLocaleString('id-ID')} lagu Kidung Pujian disimpan untuk akses offline.`);
                    }
                  }}
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-[#F4F6F9] px-3 text-[11px] font-semibold text-stone-800 hover:bg-stone-200 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer"
                >
                  <Download className={`h-3.5 w-3.5 ${isDownloadingKidung ? 'animate-bounce' : ''}`} />
                  <span>
                    {isDownloadingKidung
                      ? 'Menyimpan...'
                      : kidungStats?.isOfflineReady
                      ? 'Perbarui'
                      : 'Unduh'}
                  </span>
                </button>
              </div>

              {/* Cache Google Sheets Offline */}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Cache Lokal Data Gereja
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {sheetsCache.hymns?.data?.length || data.hymns.length} lagu ·{' '}
                      {sheetsCache.statistics?.data?.length || data.statistics.length} unit statistik
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSyncingSheets}
                  onClick={async () => {
                    if (isOnline && isGoogleConnected) {
                      const res = await syncAllConfiguredSheets();
                      showToast(
                        `Sinkronisasi selesai (${res.hymnsCount} lagu, ${res.statsCount} unit).`
                      );
                    } else {
                      const res = restoreFromOfflineCache();
                      showToast(
                        `Cache lokal dimuat (${res.hymnsCount} lagu, ${res.statsCount} unit).`
                      );
                    }
                  }}
                  className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-[#F4F6F9] px-3 text-[11px] font-semibold text-stone-800 hover:bg-stone-200 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                  <span>{isOnline && isGoogleConnected ? 'Sinkronkan' : 'Muat Cache'}</span>
                </button>
              </div>

              {/* Pasang Aplikasi (PWA) */}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Aplikasi Perangkat (PWA)
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Pasang ke layar utama untuk akses cepat
                    </p>
                  </div>
                </div>
                <PWAInstallButton compact />
              </div>
            </div>
          </section>

          {/* 4. GOOGLE DRIVE & SHEETS (KHUSUS SUPER USER) */}
          {isSuperUser && (
            <section className="space-y-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Sinkronisasi Google Workspace
              </p>
              <div className="space-y-3 rounded-2xl bg-white p-4 dark:bg-[#1E232D]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-100">
                        {isGoogleConnected ? googleUser?.email || 'Google Terhubung' : 'Google Drive & Sheets'}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {isGoogleConnected
                          ? 'Siap menyinkronkan cadangan portal'
                          : 'Hubungkan akun Google gereja'}
                      </p>
                    </div>
                  </div>

                  {isGoogleConnected ? (
                    <button
                      type="button"
                      onClick={disconnectGoogleWorkspace}
                      className="rounded-full bg-[#F4F6F9] px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-200 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer shrink-0"
                    >
                      Putuskan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={connectGoogleWorkspace}
                      disabled={isSyncingWorkspace}
                      className="rounded-full bg-[#7F1D1D] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      Hubungkan
                    </button>
                  )}
                </div>

                <label className="flex items-center justify-between gap-3 rounded-xl bg-[#F4F6F9] px-3.5 py-2.5 text-xs font-medium text-stone-800 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer">
                  <span>Sinkronisasi otomatis saat data diubah</span>
                  <input
                    type="checkbox"
                    checked={data.syncConfig.autoSyncEnabled}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        syncConfig: {
                          ...prev.syncConfig,
                          autoSyncEnabled: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 accent-[#7F1D1D]"
                  />
                </label>

                {isGoogleConnected && (
                  <button
                    type="button"
                    disabled={isSyncingWorkspace}
                    onClick={syncNowToWorkspace}
                    className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-full bg-[#F4F6F9] text-xs font-semibold text-stone-800 hover:bg-stone-200 disabled:opacity-50 dark:bg-[#161A22] dark:text-stone-200 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingWorkspace ? 'animate-spin' : ''}`} />
                    <span>{isSyncingWorkspace ? 'Menyinkronkan...' : 'Sinkronkan Sekarang ke Drive & Sheets'}</span>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export const AppMenuSheet: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;
  return <SettingsSheetContent onClose={onClose} />;
};

export const TopNavbar: React.FC<{ onOpenMenu?: () => void }> = ({ onOpenMenu }) => {
  const {
    route,
    setRoute,
    currentUserRole,
    currentUsername,
    logoutAdmin,
  } = usePortal();

  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const openMenu = onOpenMenu || (() => setInternalMenuOpen(true));

  const isSubPage = route !== 'beranda';
  const currentTitle = ROUTE_TITLES[route] || 'GPI Getsemani';
  const isAdminLoggedIn = currentUserRole !== 'jemaat' && currentUserRole !== null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#F4F6F9]/90 backdrop-blur-md dark:border-stone-800/80 dark:bg-[#0D1015]/90">
        {/* Mobile Top App Bar (Android Material 3 style, 52px) */}
        <div className="flex h-[52px] items-center justify-between gap-2 px-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            {isSubPage ? (
              <button
                type="button"
                onClick={() => setRoute('beranda')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-800 active:bg-stone-200/70 dark:text-stone-100 dark:active:bg-stone-800 cursor-pointer"
                aria-label="Kembali ke Beranda"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="pl-1">
                <ChurchLogo size="sm" />
              </div>
            )}
            <span className="truncate text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {currentTitle}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => setRoute('dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#7F1D1D] active:bg-stone-200/70 dark:text-amber-400 dark:active:bg-stone-800 cursor-pointer"
                aria-label="Dashboard Admin"
              >
                <ShieldCheck className="h-[19px] w-[19px]" />
              </button>
            )}
            <button
              type="button"
              onClick={openMenu}
              className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 active:bg-stone-200/70 dark:text-stone-300 dark:active:bg-stone-800 cursor-pointer"
              aria-label="Pengaturan"
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Desktop 3-Zone App Header */}
        <div className="mx-auto hidden h-15 max-w-[1200px] items-center justify-between gap-8 px-6 md:flex">
          {/* Zone 1: Single-line Brand */}
          <button
            type="button"
            onClick={() => setRoute('beranda')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-xl py-1 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F1D1D]"
          >
            <ChurchLogo size="sm" />
            <span className="font-display text-base font-bold tracking-tight text-[#7F1D1D] dark:text-amber-400 whitespace-nowrap shrink-0">
              GPI Getsemani
            </span>
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="flex items-center gap-6" aria-label="Navigasi Utama">
            {DESKTOP_NAV.map((item) => {
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoute(item.id)}
                  className={`relative whitespace-nowrap shrink-0 py-1.5 text-sm transition-colors cursor-pointer ${
                    active
                      ? 'font-semibold text-[#7F1D1D] dark:text-amber-400'
                      : 'font-medium text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-[15px] h-0.5 rounded-full bg-[#7F1D1D] dark:bg-amber-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Compact Action Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openMenu}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-3.5 text-xs font-semibold text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-stone-100 dark:bg-[#161A22] dark:text-stone-100 dark:hover:bg-stone-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
              <span>Pengaturan</span>
            </button>

            {isAdminLoggedIn ? (
              <button
                type="button"
                onClick={() => setRoute('dashboard')}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#7F1D1D] px-3.5 text-xs font-semibold text-white hover:bg-[#68151B] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
            ) : (
              currentUsername && (
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-stone-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-red-50 hover:text-red-700 dark:bg-[#161A22] dark:text-stone-200 dark:hover:bg-red-950/40 dark:hover:text-red-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {!onOpenMenu && (
        <AppMenuSheet
          open={internalMenuOpen}
          onClose={() => setInternalMenuOpen(false)}
        />
      )}
    </>
  );
};

export const MobileBottomNav: React.FC<{
  menuOpen?: boolean;
  onOpenMenu?: () => void;
}> = ({ menuOpen = false, onOpenMenu }) => {
  const { route, setRoute } = usePortal();
  const [internalOpen, setInternalOpen] = useState(false);

  const isDrawerOpen = onOpenMenu ? menuOpen : internalOpen;
  const triggerMenu = onOpenMenu || (() => setInternalOpen(true));

  const isSecondaryRoute =
    route !== 'beranda' &&
    route !== 'tata-ibadah' &&
    route !== 'nyanyian' &&
    route !== 'alkitab';

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/70 bg-white/95 backdrop-blur-md pb-safe dark:border-stone-800/80 dark:bg-[#161A22]/95"
        aria-label="Navigasi Bawah"
      >
        <div className="grid h-[62px] grid-cols-5 items-center px-1">
          {MOBILE_TABS.map((item) => {
            const Icon = item.icon;
            const active =
              item.id === 'menu-sheet'
                ? isDrawerOpen || isSecondaryRoute
                : !isDrawerOpen && route === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'menu-sheet') {
                    triggerMenu();
                  } else {
                    setRoute(item.id);
                  }
                }}
                className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
              >
                <span
                  className={`flex h-7 w-13 items-center justify-center rounded-full transition-colors ${
                    active
                      ? 'bg-[#7F1D1D]/12 text-[#7F1D1D] dark:bg-amber-400/18 dark:text-amber-300'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  <Icon className={`h-[19px] w-[19px] ${active ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                </span>
                <span
                  className={`text-[11px] leading-none tracking-tight ${
                    active
                      ? 'font-bold text-[#7F1D1D] dark:text-amber-300'
                      : 'font-medium text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {!onOpenMenu && (
        <AppMenuSheet
          open={internalOpen}
          onClose={() => setInternalOpen(false)}
        />
      )}
    </>
  );
};

export const ReadingToolbar: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  const { openMenuSheet } = usePortal();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22]">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-400/15 dark:text-amber-300">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => openMenuSheet(false)}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#F4F6F9] px-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700 shrink-0 cursor-pointer"
      >
        <Settings className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
        <span>Pengaturan</span>
      </button>
    </div>
  );
};
