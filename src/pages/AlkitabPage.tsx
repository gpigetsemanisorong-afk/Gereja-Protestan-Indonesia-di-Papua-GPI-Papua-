import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ShareSheetModal } from '../components/ShareSheetModal';
import {
  getVersePericopeTitle,
  resolveActivePericopeTitle,
} from '../data/biblePericopes';
import { useBibleDatabase } from '../hooks/useBibleDatabase';
import { BibleBookmark, useBibleBookmarks } from '../hooks/useBibleBookmarks';
import { buildBibleVerseSharePayload, SharePayload, triggerWebShare } from '../utils/shareUtils';

export const AlkitabPage: React.FC = () => {
  const { data, readingTextClass } = usePortal();
  const {
    books,
    currentBookMeta,
    selectedBookId,
    selectedChapter,
    chapterData,
    loadingChapter,
    chapterError,
    isFromOfflineDb,
    isOnline,
    searchResults,
    isSearchingDb,
    hasPrevChapter,
    hasNextChapter,
    selectBook,
    selectChapter,
    goToPrevChapter,
    goToNextChapter,
    refreshCurrentChapter,
    runOfflineSearch,
  } = useBibleDatabase();

  const {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    updateBookmarkNote,
    removeBookmark,
    clearAllBookmarks,
  } = useBibleBookmarks();

  const [sidebarMode, setSidebarMode] = useState<'navigator' | 'bookmarks'>('navigator');
  const [openDropdown, setOpenDropdown] = useState<'PL' | 'PB' | null>(null);
  const [bookQuery, setBookQuery] = useState('');
  const [chapterInput, setChapterInput] = useState(String(selectedChapter));
  const [verseFilterInput, setVerseFilterInput] = useState('');
  const [searchMode, setSearchMode] = useState<'chapter' | 'offline-db'>('chapter');
  const [verseQuery, setVerseQuery] = useState('');

  const [bookmarkQuery, setBookmarkQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmClearBookmarks, setConfirmClearBookmarks] = useState(false);

  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [copiedVerseNum, setCopiedVerseNum] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  const articleRef = useRef<HTMLElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Close PL/PB dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Keep chapterInput synchronized when selectedChapter changes externally
  useEffect(() => {
    setChapterInput(String(selectedChapter));
  }, [selectedBookId, selectedChapter]);

  // Scroll to highlighted verse once chapter data finishes loading
  useEffect(() => {
    if (highlightedVerse === null || loadingChapter || !chapterData) return;
    const el = verseRefs.current[highlightedVerse];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = window.setTimeout(() => setHighlightedVerse(null), 4000);
    return () => window.clearTimeout(timer);
  }, [chapterData, highlightedVerse, loadingChapter]);

  const dropdownBooks = useMemo(() => {
    if (!openDropdown) return [];
    const q = bookQuery.trim().toLowerCase();
    return books.filter((b) => {
      if (b.testament !== openDropdown) return false;
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q);
    });
  }, [bookQuery, books, openDropdown]);

  const parsedVerseHighlight = useMemo(() => {
    const raw = verseFilterInput.trim();
    if (!raw) {
      return {
        mode: 'none' as const,
        ranges: [] as Array<[number, number]>,
        label: '',
        error: null as string | null,
      };
    }

    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return {
        mode: 'none' as const,
        ranges: [] as Array<[number, number]>,
        label: '',
        error: null as string | null,
      };
    }

    const ranges: Array<[number, number]> = [];
    for (const part of parts) {
      const rangeMatch = part.match(/^(\d+)\s*(?:-|–|—|s\/?d|sampai)\s*(\d+)$/i);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (start >= 1 && end >= 1) {
          ranges.push([Math.min(start, end), Math.max(start, end)]);
          continue;
        }
      }

      // Allow incomplete trailing range separator while user is still typing (e.g. "9 - ")
      const pendingRangeMatch = part.match(/^(\d+)\s*(?:-|–|—|s\/?d|sampai)\s*$/i);
      if (pendingRangeMatch) {
        const num = Number(pendingRangeMatch[1]);
        if (num >= 1) {
          ranges.push([num, num]);
          continue;
        }
      }

      const singleMatch = part.match(/^(\d+)$/);
      if (singleMatch) {
        const num = Number(singleMatch[1]);
        if (num >= 1) {
          ranges.push([num, num]);
          continue;
        }
      }

      return {
        mode: 'invalid' as const,
        ranges: [] as Array<[number, number]>,
        label: '',
        error: 'Format ayat belum sesuai. Contoh: 9 atau 9 - 35',
      };
    }

    const label = ranges
      .map(([start, end]) => (start === end ? `${start}` : `${start} - ${end}`))
      .join(', ');

    return {
      mode: 'highlighted' as const,
      ranges,
      label,
      error: null as string | null,
    };
  }, [verseFilterInput]);

  const firstHighlightedRangeVerse = useMemo(() => {
    if (parsedVerseHighlight.mode !== 'highlighted' || parsedVerseHighlight.ranges.length === 0) {
      return null;
    }
    return parsedVerseHighlight.ranges[0][0];
  }, [parsedVerseHighlight]);

  // Smoothly scroll to the first typed verse when highlight input or chapter changes
  useEffect(() => {
    if (firstHighlightedRangeVerse === null || loadingChapter || !chapterData) return;
    const target = verseRefs.current[firstHighlightedRangeVerse];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [chapterData, firstHighlightedRangeVerse, loadingChapter]);

  const hasMatchingHighlightedVerse = useMemo(() => {
    if (parsedVerseHighlight.mode !== 'highlighted' || !chapterData) return true;
    return chapterData.verses.some((v) =>
      parsedVerseHighlight.ranges.some(([start, end]) => v.verse >= start && v.verse <= end)
    );
  }, [chapterData, parsedVerseHighlight]);

  const activeHeaderPericope = useMemo(() => {
    const targetVerse = firstHighlightedRangeVerse ?? highlightedVerse ?? 1;
    return resolveActivePericopeTitle(
      currentBookMeta.bookId,
      selectedChapter,
      targetVerse
    );
  }, [currentBookMeta.bookId, firstHighlightedRangeVerse, highlightedVerse, selectedChapter]);

  // Keep ALL verses of the selected book & chapter visible (only filter if searching keyword in "Cari Ayat")
  const visibleVerses = useMemo(() => {
    const verses = chapterData?.verses || [];
    if (searchMode !== 'chapter') return verses;
    const q = verseQuery.trim().toLowerCase();
    if (!q) return verses;
    return verses.filter(
      (v) =>
        v.text.toLowerCase().includes(q) ||
        String(v.verse) === q ||
        Boolean(
          (v.title || getVersePericopeTitle(currentBookMeta.bookId, selectedChapter, v.verse))
            ?.toLowerCase()
            .includes(q)
        )
    );
  }, [chapterData, currentBookMeta.bookId, searchMode, selectedChapter, verseQuery]);

  const filteredBookmarks = useMemo(() => {
    const q = bookmarkQuery.trim().toLowerCase();
    if (!q) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.bookName.toLowerCase().includes(q) ||
        `${b.bookName} ${b.chapter}:${b.verse}`.toLowerCase().includes(q) ||
        b.text.toLowerCase().includes(q) ||
        (b.note && b.note.toLowerCase().includes(q))
    );
  }, [bookmarkQuery, bookmarks]);

  const handleDbSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'offline-db') {
      void runOfflineSearch(verseQuery, 'Semua');
    }
  };

  const scrollToArticle = () => {
    if (articleRef.current && window.innerWidth < 1024) {
      articleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleVerseBookmark = (verseNum: number, verseText: string) => {
    const added = toggleBookmark({
      bookId: currentBookMeta.bookId,
      bookName: currentBookMeta.name,
      testament: currentBookMeta.testament,
      chapter: selectedChapter,
      verse: verseNum,
      text: verseText,
    });
    showToast(
      added
        ? `${currentBookMeta.name} ${selectedChapter}:${verseNum} disimpan ke Ayat Favorit.`
        : `${currentBookMeta.name} ${selectedChapter}:${verseNum} dihapus dari Ayat Favorit.`
    );
  };

  const handleCopyVerse = async (verseNum: number, verseText: string) => {
    const formatted = `${currentBookMeta.name} ${selectedChapter}:${verseNum} (TB)\n"${verseText}"`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedVerseNum(verseNum);
      showToast(`Ayat ${currentBookMeta.name} ${selectedChapter}:${verseNum} disalin.`);
      window.setTimeout(() => {
        setCopiedVerseNum((curr) => (curr === verseNum ? null : curr));
      }, 2000);
    } catch {
      showToast('Tidak dapat menyalin teks ke clipboard.');
    }
  };

  const handleShareVerse = async (reference: string, verseText: string) => {
    const payload = buildBibleVerseSharePayload(reference, verseText, data.profile.name);
    const outcome = await triggerWebShare(payload);
    if (outcome.status === 'shared') {
      showToast(`Ayat ${reference} berhasil dibagikan.`);
    } else if (outcome.status === 'fallback') {
      setSharePayload(payload);
    }
  };

  const handleOpenBookmark = (b: BibleBookmark) => {
    setSearchMode('chapter');
    setVerseQuery('');
    setVerseFilterInput('');
    setHighlightedVerse(b.verse);
    selectBook(b.bookId, b.chapter);
    scrollToArticle();
  };

  const handleChapterInputChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    setChapterInput(digitsOnly);
    if (!digitsOnly) return;
    const parsed = Number(digitsOnly);
    if (parsed >= 1 && parsed <= currentBookMeta.chaptersCount) {
      setHighlightedVerse(null);
      selectChapter(parsed);
    }
  };

  const handleChapterInputCommit = () => {
    const parsed = Number(chapterInput);
    if (!chapterInput || Number.isNaN(parsed) || parsed < 1) {
      setChapterInput(String(selectedChapter));
      return;
    }
    const clamped = Math.min(Math.max(1, parsed), currentBookMeta.chaptersCount);
    setChapterInput(String(clamped));
    if (clamped !== selectedChapter) {
      setHighlightedVerse(null);
      selectChapter(clamped);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification for Bookmark / Copy Actions */}
      {toastMsg && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-950 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 shrink-0 fill-current text-amber-600 dark:text-amber-400" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-amber-800 hover:opacity-70 dark:text-amber-300 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Split-screen on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr] lg:items-start">
        {/* Left Panel: Kitab/Pasal Selector OR Saved Bookmarks */}
        <aside
          ref={sidebarRef}
          className="space-y-4 rounded-[24px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] lg:sticky lg:top-20"
        >
          {/* Sidebar Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[#F4F6F9] p-1 dark:bg-[#1E232D]">
            <button
              type="button"
              onClick={() => setSidebarMode('navigator')}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors cursor-pointer ${
                sidebarMode === 'navigator'
                  ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-[#161A22] dark:text-amber-300'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Kitab & Ayat</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarMode('bookmarks')}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-colors cursor-pointer ${
                sidebarMode === 'bookmarks'
                  ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-[#161A22] dark:text-amber-300'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Favorit ({bookmarks.length})</span>
            </button>
          </div>

          {sidebarMode === 'navigator' ? (
            <>
              {/* PL (39) & PB (27) Dropdown Selectors */}
              <div ref={dropdownContainerRef} className="relative">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PL' as const, label: 'PL (39)', fullLabel: 'Perjanjian Lama' },
                    { id: 'PB' as const, label: 'PB (27)', fullLabel: 'Perjanjian Baru' },
                  ].map((tab) => {
                    const isOpen = openDropdown === tab.id;
                    const isCurrentTestament = currentBookMeta.testament === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setBookQuery('');
                          setOpenDropdown((prev) => (prev === tab.id ? null : tab.id));
                        }}
                        aria-expanded={isOpen}
                        className={`inline-flex min-h-[42px] items-center justify-between gap-2 rounded-full px-4 text-xs font-bold transition-colors cursor-pointer ${
                          isOpen || isCurrentTestament
                            ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                            : 'bg-[#F4F6F9] text-stone-700 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700'
                        }`}
                        title={`Pilih kitab ${tab.fullLabel}`}
                      >
                        <span>{tab.label}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown Panel */}
                {openDropdown && (
                  <div className="mt-2 rounded-2xl bg-[#F4F6F9] p-3 shadow-lg ring-1 ring-stone-200/80 dark:bg-[#1E232D] dark:ring-stone-700/70">
                    <div className="flex items-center justify-between gap-2 pb-2">
                      <p className="text-xs font-bold text-[#7F1D1D] dark:text-amber-300">
                        {openDropdown === 'PL' ? 'Kitab Perjanjian Lama (39)' : 'Kitab Perjanjian Baru (27)'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(null)}
                        className="rounded-full p-1 text-stone-500 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                        aria-label="Tutup daftar kitab"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="relative mb-2.5">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={bookQuery}
                        onChange={(e) => setBookQuery(e.target.value)}
                        placeholder={`Cari kitab ${openDropdown}...`}
                        className="w-full rounded-full bg-white py-1.5 pl-8 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#7F1D1D]/30 focus:outline-none dark:bg-[#161A22] dark:text-stone-100"
                      />
                    </div>

                    <div className="grid max-h-[240px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                      {dropdownBooks.map((book) => (
                        <button
                          key={book.bookId}
                          type="button"
                          onClick={() => {
                            selectBook(book.bookId, 1);
                            setChapterInput('1');
                            setVerseFilterInput('');
                            setHighlightedVerse(null);
                            setOpenDropdown(null);
                            setBookQuery('');
                          }}
                          className={`min-h-[38px] truncate rounded-xl px-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                            selectedBookId === book.bookId
                              ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                              : 'bg-white text-stone-700 hover:bg-stone-100 dark:bg-[#161A22] dark:text-stone-200 dark:hover:bg-stone-800'
                          }`}
                          title={`${book.name} (${book.chaptersCount} pasal)`}
                        >
                          {book.name}
                        </button>
                      ))}
                      {dropdownBooks.length === 0 && (
                        <p className="col-span-2 py-4 text-center text-xs text-stone-500">
                          Kitab "{bookQuery}" tidak ditemukan.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Book Badge */}
              <div className="flex items-center justify-between rounded-2xl bg-[#F4F6F9] px-3.5 py-2.5 dark:bg-[#1E232D]">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    {currentBookMeta.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'}
                  </p>
                  <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                    {currentBookMeta.name}
                  </p>
                </div>
                <span className="font-tabular shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#7F1D1D] dark:bg-[#161A22] dark:text-amber-300">
                  {currentBookMeta.chaptersCount} Pasal
                </span>
              </div>

              {/* Typed Pasal & Ayat Inputs */}
              <div className="space-y-3 border-t border-stone-100 pt-3 dark:border-stone-800/80">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="alkitab-pasal-input"
                      className="mb-1 block text-xs font-semibold text-stone-600 dark:text-stone-300"
                    >
                      Pasal <span className="font-tabular text-[11px] font-normal text-stone-400">(1–{currentBookMeta.chaptersCount})</span>
                    </label>
                    <input
                      id="alkitab-pasal-input"
                      type="text"
                      inputMode="numeric"
                      value={chapterInput}
                      onChange={(e) => handleChapterInputChange(e.target.value)}
                      onBlur={handleChapterInputCommit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleChapterInputCommit();
                          scrollToArticle();
                        }
                      }}
                      placeholder="1"
                      className="font-tabular w-full rounded-2xl bg-[#F4F6F9] px-3.5 py-2.5 text-sm font-bold text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <label
                        htmlFor="alkitab-ayat-input"
                        className="block text-xs font-semibold text-stone-600 dark:text-stone-300"
                      >
                        Sorot Ayat
                      </label>
                      {verseFilterInput && (
                        <button
                          type="button"
                          onClick={() => setVerseFilterInput('')}
                          className="text-[11px] font-semibold text-[#7F1D1D] hover:underline dark:text-amber-400 cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="alkitab-ayat-input"
                        type="text"
                        value={verseFilterInput}
                        onChange={(e) => setVerseFilterInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (firstHighlightedRangeVerse !== null) {
                              const el = verseRefs.current[firstHighlightedRangeVerse];
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                return;
                              }
                            }
                            scrollToArticle();
                          }
                        }}
                        placeholder="9 atau 9 - 35"
                        className="font-tabular w-full rounded-2xl bg-[#F4F6F9] py-2.5 pl-3.5 pr-8 text-sm font-bold text-stone-900 placeholder:text-xs placeholder:font-normal placeholder:text-stone-400 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                      />
                      {verseFilterInput && (
                        <button
                          type="button"
                          onClick={() => setVerseFilterInput('')}
                          aria-label="Hapus sorotan ayat"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {chapterInput !== '' && Number(chapterInput) > currentBookMeta.chaptersCount && (
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Kitab {currentBookMeta.name} hanya memiliki 1 sampai {currentBookMeta.chaptersCount} pasal.
                  </p>
                )}

                {parsedVerseHighlight.error ? (
                  <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
                    {parsedVerseHighlight.error}
                  </p>
                ) : parsedVerseHighlight.mode === 'highlighted' ? (
                  hasMatchingHighlightedVerse ? (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Menampilkan seluruh ayat dan menyorot{' '}
                      <span className="font-semibold text-[#7F1D1D] dark:text-amber-400">
                        Ayat {parsedVerseHighlight.label}
                      </span>{' '}
                      pada {currentBookMeta.name} {selectedChapter}.
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      Ayat {parsedVerseHighlight.label} di luar jumlah ayat pasal ini (tersedia ayat 1–{chapterData?.verses.length ?? 0}).
                    </p>
                  )
                ) : (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Seluruh ayat pasal tampil otomatis{chapterData ? ` (${chapterData.verses.length} ayat)` : ''}. Ketik{' '}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">9</span> atau{' '}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">9 - 35</span> untuk menyorot ayat pilihan.
                  </p>
                )}
              </div>

              {/* Search: Current Chapter or Full Offline Database */}
              <div className="space-y-2.5 border-t border-stone-100 pt-3 dark:border-stone-800/80">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Cari Ayat
                  </p>
                  <div className="flex gap-1 rounded-full bg-[#F4F6F9] p-0.5 text-[11px] font-semibold dark:bg-[#1E232D]">
                    <button
                      type="button"
                      onClick={() => setSearchMode('chapter')}
                      className={`rounded-full px-2.5 py-1 cursor-pointer ${
                        searchMode === 'chapter'
                          ? 'bg-white text-[#7F1D1D] shadow-2xs dark:bg-[#161A22] dark:text-amber-300'
                          : 'text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Pasal Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('offline-db')}
                      className={`rounded-full px-2.5 py-1 cursor-pointer ${
                        searchMode === 'offline-db'
                          ? 'bg-white text-[#7F1D1D] shadow-2xs dark:bg-[#161A22] dark:text-amber-300'
                          : 'text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Offline DB
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDbSearchSubmit} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={verseQuery}
                      onChange={(e) => setVerseQuery(e.target.value)}
                      placeholder={
                        searchMode === 'chapter'
                          ? 'Kata atau nomor ayat...'
                          : 'Cari kata di database offline...'
                      }
                      className="w-full rounded-full bg-[#F4F6F9] py-2 pl-10 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                    />
                  </div>
                  {searchMode === 'offline-db' && (
                    <button
                      type="submit"
                      disabled={isSearchingDb || verseQuery.trim().length < 2}
                      className="rounded-full bg-[#7F1D1D] px-4 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 dark:bg-amber-400 dark:text-stone-950 cursor-pointer"
                    >
                      Cari
                    </button>
                  )}
                </form>

                {searchMode === 'offline-db' && searchResults.length > 0 && (
                  <div className="max-h-[220px] divide-y divide-stone-100 overflow-y-auto rounded-2xl bg-[#F4F6F9] dark:divide-stone-800 dark:bg-[#1E232D]">
                    {searchResults.map((res) => (
                      <button
                        key={`${res.bookId}-${res.chapter}-${res.verse}`}
                        type="button"
                        onClick={() => {
                          setHighlightedVerse(res.verse);
                          setVerseFilterInput('');
                          selectBook(res.bookId, res.chapter);
                          setSearchMode('chapter');
                          setVerseQuery('');
                          scrollToArticle();
                        }}
                        className="block w-full p-3 text-left hover:bg-stone-200/50 dark:hover:bg-stone-700/50 cursor-pointer"
                      >
                        <p className="font-tabular text-[11px] font-bold text-[#7F1D1D] dark:text-amber-400">
                          {res.bookName} {res.chapter}:{res.verse}
                        </p>
                        {res.title && (
                          <p className="mt-0.5 text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                            {res.title}
                          </p>
                        )}
                        <p className="mt-0.5 line-clamp-2 text-xs text-stone-700 dark:text-stone-300">
                          {res.text}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Bookmarks / Ayat Favorit Sidebar View */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Ayat Tersimpan ({bookmarks.length})
                </p>
                {bookmarks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearBookmarks(true)}
                    className="text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400 cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              {bookmarks.length > 0 && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={bookmarkQuery}
                    onChange={(e) => setBookmarkQuery(e.target.value)}
                    placeholder="Cari kitab, teks, atau catatan..."
                    className="w-full rounded-full bg-[#F4F6F9] py-2 pl-10 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
                  />
                </div>
              )}

              {bookmarks.length === 0 ? (
                <div className="rounded-2xl bg-[#F4F6F9] p-5 text-center dark:bg-[#1E232D]">
                  <Bookmark className="mx-auto h-6 w-6 text-stone-400" />
                  <p className="mt-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Belum ada ayat favorit tersimpan
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Tekan ikon bookmark di samping ayat saat membaca Alkitab untuk menyimpannya di perangkat ini.
                  </p>
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                  Tidak ada ayat favorit yang cocok dengan "{bookmarkQuery}".
                </p>
              ) : (
                <div className="max-h-[460px] space-y-2.5 overflow-y-auto pr-1">
                  {filteredBookmarks.map((b) => {
                    const isEditingNote = editingNoteId === b.id;
                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl bg-[#F4F6F9] p-3.5 dark:bg-[#1E232D]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBookmark(b)}
                            className="text-left group cursor-pointer"
                          >
                            <p className="font-tabular text-xs font-bold text-[#7F1D1D] group-hover:underline dark:text-amber-400">
                              {b.bookName} {b.chapter}:{b.verse}
                            </p>
                            <p className="font-tabular text-[10px] text-stone-400">
                              Disimpan{' '}
                              {new Date(b.savedAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                void handleShareVerse(
                                  `${b.bookName} ${b.chapter}:${b.verse}`,
                                  b.text
                                )
                              }
                              title="Bagikan ayat ini ke media sosial"
                              className="rounded-full p-1.5 text-stone-500 hover:bg-white hover:text-[#7F1D1D] dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-amber-400 cursor-pointer"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(isEditingNote ? null : b.id);
                                setNoteDraft(b.note || '');
                              }}
                              title="Tambah / Ubah Catatan"
                              className="rounded-full p-1.5 text-stone-500 hover:bg-white dark:text-stone-400 dark:hover:bg-stone-700 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeBookmark(b.id);
                                showToast(`${b.bookName} ${b.chapter}:${b.verse} dihapus dari Ayat Favorit.`);
                              }}
                              title="Hapus dari Ayat Favorit"
                              className="rounded-full p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenBookmark(b)}
                          className="mt-1.5 block w-full text-left cursor-pointer"
                        >
                          <p className="line-clamp-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                            "{b.text}"
                          </p>
                        </button>

                        {b.note && !isEditingNote && (
                          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] italic text-amber-950 dark:bg-amber-950/35 dark:text-amber-200">
                            Catatan: {b.note}
                          </p>
                        )}

                        {isEditingNote && (
                          <div className="mt-2 space-y-1.5">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Tulis catatan perenungan..."
                              className="w-full rounded-xl bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none dark:bg-[#161A22] dark:text-stone-100"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="rounded-full px-3 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateBookmarkNote(b.id, noteDraft);
                                  setEditingNoteId(null);
                                  showToast('Catatan ayat favorit disimpan.');
                                }}
                                className="rounded-full bg-[#7F1D1D] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#68151B] dark:bg-amber-400 dark:text-stone-950 cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Panel: Scripture Text */}
        <article
          ref={articleRef}
          className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4 dark:border-stone-800/80">
            <div>
              <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                {currentBookMeta.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'} ·{' '}
                {isFromOfflineDb ? 'Database Offline' : 'Tersinkron ke Database'}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
                {currentBookMeta.name} {selectedChapter}
                {parsedVerseHighlight.mode === 'highlighted' && (
                  <span className="font-tabular text-[#7F1D1D] dark:text-amber-400">
                    :{parsedVerseHighlight.label}
                  </span>
                )}
              </h1>
              {activeHeaderPericope && (
                <p className="mt-1.5 text-sm font-semibold text-stone-700 dark:text-stone-200">
                  {activeHeaderPericope.title}
                  {activeHeaderPericope.isContinuation && (
                    <span className="ml-1.5 text-xs font-normal text-stone-500 dark:text-stone-400">
                      (lanjutan dari {currentBookMeta.name} {activeHeaderPericope.startChapter}:{activeHeaderPericope.startVerse})
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {parsedVerseHighlight.mode === 'highlighted' && (
                <button
                  type="button"
                  onClick={() => setVerseFilterInput('')}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#7F1D1D]/10 px-3.5 text-xs font-semibold text-[#7F1D1D] hover:bg-[#7F1D1D]/15 dark:bg-amber-400/15 dark:text-amber-300 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Hapus Sorotan</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSidebarMode('bookmarks');
                  if (sidebarRef.current && window.innerWidth < 1024) {
                    sidebarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-amber-50 px-3.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-200 cursor-pointer"
              >
                <Bookmark className="h-3.5 w-3.5 fill-current text-amber-600 dark:text-amber-400" />
                <span>Favorit ({bookmarks.length})</span>
              </button>

              {isOnline && (
                <button
                  type="button"
                  disabled={loadingChapter}
                  onClick={() => void refreshCurrentChapter()}
                  title="Muat ulang teks pasal dari server"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#F4F6F9] px-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-200/70 disabled:opacity-50 dark:bg-[#1E232D] dark:text-stone-200 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingChapter ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sinkron</span>
                </button>
              )}
            </div>
          </div>

          {chapterData?.isPartialSeed && (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-200">
              Menampilkan cuplikan ayat bawaan (offline). Hubungkan internet atau buka menu{' '}
              <strong>Pengaturan</strong> untuk mengunduh seluruh 66 kitab offline.
            </div>
          )}

          {chapterError && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-300">
              {chapterError}
            </div>
          )}

          <div
            className={`mt-6 max-w-prose space-y-2.5 font-reading text-stone-800 dark:text-stone-200 ${readingTextClass}`}
          >
            {loadingChapter && !chapterData ? (
              <div className="space-y-3 py-6">
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#F4F6F9] dark:bg-[#1E232D]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#F4F6F9] dark:bg-[#1E232D]" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#F4F6F9] dark:bg-[#1E232D]" />
                <p className="pt-2 font-sans text-xs text-stone-500">
                  Memuat {currentBookMeta.name} pasal {selectedChapter} dari database...
                </p>
              </div>
            ) : !chapterData ? (
              <div className="rounded-2xl bg-[#F4F6F9] p-5 font-sans dark:bg-[#1E232D]">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Pasal belum tersedia di penyimpanan offline.
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                  Aktifkan koneksi internet lalu tekan Sinkron, atau buka menu Pengaturan untuk mengunduh paket 66 kitab offline.
                </p>
              </div>
            ) : visibleVerses.length === 0 ? (
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                Tidak ada ayat yang cocok dengan kata kunci "{verseQuery}".
              </p>
            ) : (
              visibleVerses.map((v) => {
                const saved = isBookmarked(currentBookMeta.bookId, selectedChapter, v.verse);
                const isRangeHighlighted =
                  parsedVerseHighlight.mode === 'highlighted' &&
                  parsedVerseHighlight.ranges.some(([start, end]) => v.verse >= start && v.verse <= end);
                const isFocused = highlightedVerse === v.verse || isRangeHighlighted;
                const isCopied = copiedVerseNum === v.verse;
                const pericopeHeading =
                  v.title ||
                  getVersePericopeTitle(currentBookMeta.bookId, selectedChapter, v.verse);

                return (
                  <React.Fragment key={v.verse}>
                    {pericopeHeading && (
                      <h2 className="pt-4 first:pt-0 pb-1 font-sans text-base font-bold tracking-tight text-[#7F1D1D] dark:text-amber-300 sm:text-lg">
                        {pericopeHeading}
                      </h2>
                    )}
                    <div
                      ref={(el) => {
                        verseRefs.current[v.verse] = el;
                      }}
                      className={`group flex items-start justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                        isFocused
                          ? 'bg-amber-100/90 ring-2 ring-[#7F1D1D]/50 dark:bg-amber-500/20 dark:ring-amber-400/70'
                          : saved
                          ? 'bg-amber-50/75 dark:bg-amber-950/25'
                          : 'hover:bg-[#F4F6F9] dark:hover:bg-[#1E232D]/70'
                      }`}
                    >
                      <p className="leading-relaxed">
                        <sup className="font-tabular mr-1.5 text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                          {v.verse}
                        </sup>
                        <span>{v.text}</span>
                      </p>

                    <div className="mt-0.5 flex shrink-0 items-center gap-1 font-sans">
                      <button
                        type="button"
                        onClick={() =>
                          void handleShareVerse(
                            `${currentBookMeta.name} ${selectedChapter}:${v.verse}`,
                            v.text
                          )
                        }
                        title={`Bagikan ${currentBookMeta.name} ${selectedChapter}:${v.verse}`}
                        aria-label={`Bagikan ayat ${v.verse}`}
                        className="rounded-full p-1.5 text-stone-400 opacity-80 transition-opacity hover:bg-white hover:text-[#7F1D1D] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-700 dark:hover:text-amber-400 cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCopyVerse(v.verse, v.text)}
                        title={`Salin ${currentBookMeta.name} ${selectedChapter}:${v.verse}`}
                        aria-label={`Salin ayat ${v.verse}`}
                        className="rounded-full p-1.5 text-stone-400 opacity-80 transition-opacity hover:bg-white hover:text-stone-700 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-700 dark:hover:text-stone-200 cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleVerseBookmark(v.verse, v.text)}
                        title={saved ? 'Hapus dari Ayat Favorit' : 'Simpan ke Ayat Favorit'}
                        aria-label={saved ? `Hapus bookmark ayat ${v.verse}` : `Simpan bookmark ayat ${v.verse}`}
                        className={`rounded-full p-1.5 transition-all cursor-pointer ${
                          saved
                            ? 'text-amber-600 opacity-100 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40'
                            : 'text-stone-400 opacity-80 hover:bg-white hover:text-[#7F1D1D] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-700 dark:hover:text-amber-400'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
                );
              })
            )}
          </div>

          {/* Prev / Next Chapter Navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 dark:border-stone-800/80">
            <button
              type="button"
              disabled={!hasPrevChapter}
              onClick={() => {
                setVerseFilterInput('');
                goToPrevChapter();
                scrollToArticle();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#F4F6F9] px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200/70 disabled:opacity-40 dark:bg-[#1E232D] dark:text-stone-200 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="font-tabular text-xs font-semibold text-stone-500 dark:text-stone-400">
              {currentBookMeta.name} · {selectedChapter} / {currentBookMeta.chaptersCount}
            </span>

            <button
              type="button"
              disabled={!hasNextChapter}
              onClick={() => {
                setVerseFilterInput('');
                goToNextChapter();
                scrollToArticle();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-40 dark:bg-amber-400 dark:text-stone-950 cursor-pointer"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>

      <ConfirmDialog
        open={confirmClearBookmarks}
        title="Hapus Semua Ayat Favorit?"
        description={`Seluruh ${bookmarks.length} ayat favorit dan catatan perenungan yang tersimpan di perangkat ini akan dihapus.`}
        confirmLabel="Ya, Hapus Semua"
        destructive
        onConfirm={() => {
          clearAllBookmarks();
          setConfirmClearBookmarks(false);
          showToast('Semua ayat favorit telah dihapus.');
        }}
        onCancel={() => setConfirmClearBookmarks(false)}
      />

      <ShareSheetModal
        open={Boolean(sharePayload)}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
        onSharedOrCopied={(msg) => showToast(msg)}
      />
    </div>
  );
};
