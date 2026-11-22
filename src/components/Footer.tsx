import React from 'react';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { usePortal } from '../context/PortalContext';

export const Footer: React.FC = () => {
  const { data, setRoute, currentUserRole, currentUsername, logoutAdmin, openMenuSheet } = usePortal();

  return (
    <footer className="mt-12 hidden border-t border-stone-200/70 bg-white/70 py-7 dark:border-stone-800/80 dark:bg-[#161A22]/70 md:block">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#7F1D1D] dark:text-amber-400">
            {data.profile.name}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {data.profile.synod} · {data.profile.klasis} · {data.profile.address}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setRoute('tentang')}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
          >
            Tentang Aplikasi
          </button>
          <button
            type="button"
            onClick={() => setRoute('profil')}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
          >
            Profil & Kontak
          </button>
          {currentUserRole !== 'jemaat' && currentUserRole !== null ? (
            <>
              <button
                type="button"
                onClick={() => setRoute('dashboard')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
                <span>Dashboard</span>
              </button>
              {currentUsername && (
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700 dark:bg-[#1E232D] dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar ({currentUsername})</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => openMenuSheet(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
              <span>Login Admin</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
