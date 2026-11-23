import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortalProvider, usePortal } from './context/PortalContext';
import { AppMenuSheet, MobileBottomNav, TopNavbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/PWAComponents';
import { BerandaPage } from './pages/BerandaPage';
import { TataIbadahPage } from './pages/TataIbadahPage';
import { LiturgiUnsurPage } from './pages/LiturgiUnsurPage';
import { JadwalIbadahPage } from './pages/JadwalIbadahPage';
import { WartaJemaatPage } from './pages/WartaJemaatPage';
import { NyanyianRohaniPage } from './pages/NyanyianRohaniPage';
import { AlkitabPage } from './pages/AlkitabPage';
import { KotakDoaLayananPage } from './pages/KotakDoaLayananPage';
import { LaporanKeuanganPage } from './pages/LaporanKeuanganPage';
import { DataStatistikPage } from './pages/DataStatistikPage';
import { ProfilKontakPage } from './pages/ProfilKontakPage';
import { TentangAplikasiPage } from './pages/TentangAplikasiPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const PortalShell: React.FC = () => {
  const { route, menuOpen, openMenuSheet, closeMenuSheet } = usePortal();

  const renderPage = () => {
    switch (route) {
      case 'beranda':
        return <BerandaPage />;
      case 'tata-ibadah':
        return <TataIbadahPage />;
      case 'liturgi-unsur':
        return <LiturgiUnsurPage />;
      case 'jadwal':
        return <JadwalIbadahPage />;
      case 'warta':
        return <WartaJemaatPage />;
      case 'nyanyian':
        return <NyanyianRohaniPage />;
      case 'alkitab':
        return <AlkitabPage />;
      case 'layanan':
        return <KotakDoaLayananPage initialTab="Lapor Sakit" />;
      case 'kotak-doa':
        return <KotakDoaLayananPage initialTab="Kotak Doa" />;
      case 'keuangan':
        return <LaporanKeuanganPage />;
      case 'statistik':
        return <DataStatistikPage />;
      case 'profil':
        return <ProfilKontakPage />;
      case 'tentang':
        return <TentangAplikasiPage />;
      case 'dashboard':
        return <AdminDashboardPage />;
      default:
        return <BerandaPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-stone-900 transition-colors dark:bg-[#0D1015] dark:text-stone-100">
      <TopNavbar onOpenMenu={() => openMenuSheet(false)} />

      <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MobileBottomNav menuOpen={menuOpen} onOpenMenu={() => openMenuSheet(false)} />
      <AppMenuSheet open={menuOpen} onClose={closeMenuSheet} />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <PortalProvider>
      <PortalShell />
    </PortalProvider>
  );
}
