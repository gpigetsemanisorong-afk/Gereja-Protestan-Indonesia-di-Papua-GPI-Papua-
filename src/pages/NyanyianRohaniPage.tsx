import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  Music,
  Search,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { useKidungDatabase } from '../hooks/useKidungDatabase';
import { Hymn, HymnBook } from '../types/church';
import { ReadingToolbar } from '../components/Navbar';

const HYMN_BOOKS: HymnBook[] = ['KJ', 'PKJ', 'NKB', 'DSL', 'NR'];

const BOOK_FULL_NAMES: Record<HymnBook, string> = {
  KJ: 'Kidung Jemaat',
  PKJ: 'Pelengkap Kidung Jemaat',
  NKB: 'Nyanyian Kidung Baru',
  DSL: 'Dua Sahabat Lama',
  NR: 'Mazmur & Nyanyian Rohani',
};

interface ParsedHymnQuery {
  raw: string;
  normalized: string;
  bookPrefix: HymnBook | null;
  numberQuery: string | null;
  textQuery: string;
}

function parseHymnQuery(input: string): ParsedHymnQuery {
  const trimmed = input.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      raw: input,
      normalized: '',
      bookPrefix: null,
      numberQuery: null,
      textQuery: '',
    };
  }

  // Match patterns like "KJ 1", "KJ1", "kj. 24a", "NKB no. 188", "nr no 77"
  const bookNumMatch = normalized.match(
    /^(kj|pkj|nkb|dsl|nr)[\s.\-]*(?:no\.?\s*)?(\d+[a-z]?)?(?:\s+(.*))?$/i
  );

  if (bookNumMatch) {
    const book = bookNumMatch[1].toUpperCase() as HymnBook;
    const num = bookNumMatch[2] ? bookNumMatch[2].toLowerCase() : null;
    const restText = (bookNumMatch[3] || '').trim();
    return {
      raw: input,
      normalized,
      bookPrefix: book,
      numberQuery: num,
      textQuery: restText,
    };
  }

  // Match patterns like "no 14", "no. 14", "#14", or pure numeric/code "14", "24a"
  const numOnlyMatch = normalized.match(/^(?:no\.?\s*|#)?(\d+[a-z]?)$/i);
  if (numOnlyMatch) {
    return {
      raw: input,
      normalized,
      bookPrefix: null,
      numberQuery: numOnlyMatch[1].toLowerCase(),
      textQuery: '',
    };
  }

  return {
    raw: input,
    normalized,
    bookPrefix: null,
    numberQuery: null,
    textQuery: normalized,
  };
}

interface HymnSearchResult {
  hymn: Hymn;
  score: number;
  matchedInLyricsOnly: boolean;
}

function getHymnCodeLabel(hymn: Hymn): string {
  return hymn.codeLabel || String(hymn.number);
}

function scoreHymnMatch(
  hymn: Hymn,
  parsed: ParsedHymnQuery,
  includeLyrics: boolean
): HymnSearchResult | null {
  if (!parsed.normalized) {
    return { hymn, score: 0, matchedInLyricsOnly: false };
  }

  const codeLower = getHymnCodeLabel(hymn).toLowerCase();
  const numStr = String(hymn.number);
  const titleLower = hymn.title.toLowerCase();
  const fullCodeLower = `${hymn.book.toLowerCase()} ${codeLower}`;
  const fullCodeNoDotLower = `${hymn.book.toLowerCase()} no. ${codeLower}`;

  // Case 1: Query starts with a book code (e.g., "KJ", "KJ 64", "KJ 24A")
  if (parsed.bookPrefix) {
    if (hymn.book !== parsed.bookPrefix) return null;

    if (parsed.numberQuery) {
      if (codeLower === parsed.numberQuery || numStr === parsed.numberQuery) {
        return { hymn, score: 1000, matchedInLyricsOnly: false };
      }
      if (codeLower.startsWith(parsed.numberQuery)) {
        return { hymn, score: 850 - hymn.number * 0.001, matchedInLyricsOnly: false };
      }
      if (codeLower.includes(parsed.numberQuery)) {
        return { hymn, score: 700 - hymn.number * 0.001, matchedInLyricsOnly: false };
      }
      return null;
    }

    if (parsed.textQuery) {
      if (titleLower.startsWith(parsed.textQuery)) {
        return { hymn, score: 750, matchedInLyricsOnly: false };
      }
      if (titleLower.includes(parsed.textQuery)) {
        return { hymn, score: 650, matchedInLyricsOnly: false };
      }
      if (includeLyrics) {
        const inLyrics =
          hymn.verses.some((v) => v.text.toLowerCase().includes(parsed.textQuery)) ||
          Boolean(hymn.chorus && hymn.chorus.toLowerCase().includes(parsed.textQuery));
        if (inLyrics) {
          return { hymn, score: 350, matchedInLyricsOnly: true };
        }
      }
      return null;
    }

    return { hymn, score: 900 - hymn.number * 0.001, matchedInLyricsOnly: false };
  }

  // Case 2: Pure numeric or "#14" / "no 14" / "24a" query
  if (parsed.numberQuery) {
    if (codeLower === parsed.numberQuery || numStr === parsed.numberQuery) {
      return { hymn, score: 950, matchedInLyricsOnly: false };
    }
    if (codeLower.startsWith(parsed.numberQuery)) {
      return { hymn, score: 780 - hymn.number * 0.001, matchedInLyricsOnly: false };
    }
    if (codeLower.includes(parsed.numberQuery)) {
      return { hymn, score: 620 - hymn.number * 0.001, matchedInLyricsOnly: false };
    }
    if (titleLower.includes(parsed.numberQuery)) {
      return { hymn, score: 450, matchedInLyricsOnly: false };
    }
    return null;
  }

  // Case 3: General text query (title, code, number, or lyrics)
  const q = parsed.textQuery || parsed.normalized;

  if (titleLower === q) {
    return { hymn, score: 920, matchedInLyricsOnly: false };
  }
  if (titleLower.startsWith(q)) {
    return { hymn, score: 820, matchedInLyricsOnly: false };
  }

  const words = q.split(' ').filter(Boolean);
  const allWordsInTitle = words.every((w) => titleLower.includes(w));
  if (titleLower.includes(q)) {
    return { hymn, score: 740, matchedInLyricsOnly: false };
  }
  if (words.length > 1 && allWordsInTitle) {
    return { hymn, score: 680, matchedInLyricsOnly: false };
  }

  if (fullCodeLower.includes(q) || fullCodeNoDotLower.includes(q) || codeLower.includes(q)) {
    return { hymn, score: 560, matchedInLyricsOnly: false };
  }

  if (includeLyrics) {
    const inVerses = hymn.verses.some((v) => v.text.toLowerCase().includes(q));
    const inChorus = Boolean(hymn.chorus && hymn.chorus.toLowerCase().includes(q));
    if (inVerses || inChorus) {
      return { hymn, score: 300, matchedInLyricsOnly: true };
    }
  }

  return null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HighlightMatch: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  const q = highlight.trim();
  if (!q) return <>{text}</>;

  const tokens = Array.from(new Set(q.split(/\s+/).filter((t) => t.length >= 1)));
  if (tokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = tokens.some((token) => part.toLowerCase() === token.toLowerCase());
        return isMatch ? (
          <mark
            key={index}
            className="rounded bg-amber-200/80 px-0.5 text-stone-950 dark:bg-amber-500/35 dark:text-amber-100"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

export const NyanyianRohaniPage: React.FC = () => {
  const { readingTextClass } = usePortal();
  const {
    hymns,
    loading: loadingDb,
    stats,
  } = useKidungDatabase();

  const [selectedBook, setSelectedBook] = useState<HymnBook>('KJ');
  const [query, setQuery] = useState('');
  const [includeLyrics, setIncludeLyrics] = useState(true);
  const [selectedHymnId, setSelectedHymnId] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lyricsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hymns.length > 0 && !selectedHymnId) {
      const firstInBook = hymns.find((h) => h.book === selectedBook) || hymns[0];
      setSelectedHymnId(firstInBook.id);
    }
  }, [hymns, selectedHymnId, selectedBook]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const parsedQuery = useMemo(() => parseHymnQuery(query), [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const parsed = parseHymnQuery(value);
    if (parsed.bookPrefix && parsed.bookPrefix !== selectedBook) {
      setSelectedBook(parsed.bookPrefix);
    }
  };

  const handleSelectBookTab = (book: HymnBook) => {
    setSelectedBook(book);
    if (parsedQuery.bookPrefix && parsedQuery.bookPrefix !== book) {
      setQuery('');
    }
  };

  const allQueryMatches = useMemo(() => {
    const matched: HymnSearchResult[] = [];
    for (const hymn of hymns) {
      const result = scoreHymnMatch(hymn, parsedQuery, includeLyrics);
      if (result) {
        matched.push(result);
      }
    }

    if (parsedQuery.normalized) {
      matched.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.hymn.book !== b.hymn.book) return a.hymn.book.localeCompare(b.hymn.book);
        if (a.hymn.number !== b.hymn.number) return a.hymn.number - b.hymn.number;
        return getHymnCodeLabel(a.hymn).localeCompare(getHymnCodeLabel(b.hymn));
      });
    }

    return matched;
  }, [hymns, parsedQuery, includeLyrics]);

  const bookMatchCounts = useMemo(() => {
    const counts: Record<HymnBook, number> = {
      KJ: 0,
      PKJ: 0,
      NKB: 0,
      DSL: 0,
      NR: 0,
    };
    for (const item of allQueryMatches) {
      if (counts[item.hymn.book] !== undefined) {
        counts[item.hymn.book] += 1;
      }
    }
    return counts;
  }, [allQueryMatches]);

  const filteredResults = useMemo(
    () => allQueryMatches.filter((item) => item.hymn.book === selectedBook),
    [allQueryMatches, selectedBook]
  );

  const filteredHymns = useMemo(
    () => filteredResults.map((item) => item.hymn),
    [filteredResults]
  );

  const activeIndex = filteredHymns.findIndex((h) => h.id === selectedHymnId);
  const activeHymn =
    (activeIndex >= 0 ? filteredHymns[activeIndex] : filteredHymns[0]) || null;
  const effectiveIndex = activeHymn
    ? filteredHymns.findIndex((h) => h.id === activeHymn.id)
    : -1;

  const prevHymn = effectiveIndex > 0 ? filteredHymns[effectiveIndex - 1] : null;
  const nextHymn =
    effectiveIndex >= 0 && effectiveIndex < filteredHymns.length - 1
      ? filteredHymns[effectiveIndex + 1]
      : null;

  const highlightTextTerm = parsedQuery.bookPrefix
    ? parsedQuery.textQuery || parsedQuery.numberQuery || ''
    : parsedQuery.numberQuery || parsedQuery.textQuery || '';

  const handleSelectHymn = (id: string) => {
    setSelectedHymnId(id);
    if (window.innerWidth < 1024 && lyricsSectionRef.current) {
      lyricsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-5">
      <ReadingToolbar
        title="Kidung Pujian Jemaat"
        subtitle={`${(stats?.cachedHymnsCount ?? hymns.length).toLocaleString('id-ID')} lagu · KJ, PKJ, NKB, DSL & NR`}
      />

      {/* Main Grid: Left List + Right Lyrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Search & Hymn List */}
        <aside className="lg:col-span-5 rounded-[24px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-5">
          <div className="space-y-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Cari (cth: KJ 64, 14, Bintang, atau lirik)..."
                className="w-full rounded-full bg-[#F4F6F9] py-3 pl-11 pr-10 text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#7F1D1D]/25 focus:outline-none dark:bg-[#1E232D] dark:text-stone-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Helper Tips */}
            <div className="flex flex-wrap items-center justify-between px-1 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-[#7F1D1D] dark:text-amber-400" />
                <span>
                  Tekan{' '}
                  <kbd className="rounded bg-[#F4F6F9] px-1.5 py-0.5 font-mono text-[10px] dark:bg-[#1E232D]">
                    /
                  </kbd>{' '}
                  untuk mencari
                </span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLyrics}
                  onChange={(e) => setIncludeLyrics(e.target.checked)}
                  className="rounded border-stone-300 text-[#7F1D1D] focus:ring-[#7F1D1D]"
                />
                <span>Cari dalam Lirik</span>
              </label>
            </div>
          </div>

          {/* Book Filter Tabs: KJ, PKJ, NKB, DSL, NR */}
          <div className="mt-4 flex flex-wrap gap-1.5 pb-3.5 border-b border-stone-100 dark:border-stone-800/80">
            {HYMN_BOOKS.map((book) => {
              const count = bookMatchCounts[book];
              const isSelected = selectedBook === book;
              return (
                <button
                  key={book}
                  type="button"
                  onClick={() => handleSelectBookTab(book)}
                  className={`inline-flex min-h-[34px] items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-400 dark:text-stone-950'
                      : 'bg-[#F4F6F9] text-stone-600 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  <span>{book}</span>
                  <span
                    className={`font-tabular text-[10px] ${
                      isSelected
                        ? 'text-rose-200 dark:text-stone-900'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 max-h-[420px] divide-y divide-stone-100 overflow-y-auto pr-1 dark:divide-stone-800/80 lg:max-h-[520px]">
            {loadingDb && hymns.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-500 dark:text-stone-400">
                Memuat database Kidung Pujian...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Lagu tidak ditemukan
                  {query.trim() ? ` untuk "${query.trim()}"` : ''} di buku {selectedBook}.
                </p>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F4F6F9] px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 dark:bg-[#1E232D] dark:text-stone-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Hapus Pencarian</span>
                  </button>
                )}
              </div>
            ) : (
              filteredResults.map(({ hymn, matchedInLyricsOnly }) => {
                const isSelected = activeHymn?.id === hymn.id;
                const codeLabel = getHymnCodeLabel(hymn);
                return (
                  <button
                    key={hymn.id}
                    type="button"
                    onClick={() => handleSelectHymn(hymn.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#7F1D1D]/8 text-[#7F1D1D] dark:bg-amber-400/12 dark:text-amber-300'
                        : 'hover:bg-[#F4F6F9] dark:hover:bg-[#1E232D]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-tabular text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                          {hymn.book} No.{' '}
                          <HighlightMatch
                            text={codeLabel}
                            highlight={parsedQuery.numberQuery || ''}
                          />
                        </p>
                        {matchedInLyricsOnly && (
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            · cocok di lirik
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                        <HighlightMatch text={hymn.title} highlight={highlightTextTerm} />
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-stone-400">
                      {hymn.verses.length} bait
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Panel: Hymn Lyrics */}
        <section
          ref={lyricsSectionRef}
          className="lg:col-span-7 rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:bg-[#161A22] sm:p-8"
        >
          {activeHymn ? (
            <div>
              <div className="border-b border-stone-100 pb-5 dark:border-stone-800/80">
                <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                  {BOOK_FULL_NAMES[activeHymn.book]} ({activeHymn.book}) · Nomor{' '}
                  <span className="font-tabular">{getHymnCodeLabel(activeHymn)}</span>
                  {activeHymn.keySignature ? ` · ${activeHymn.keySignature}` : ''}
                </p>
                <h2 className="mt-1.5 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
                  <HighlightMatch text={activeHymn.title} highlight={highlightTextTerm} />
                </h2>
              </div>

              <div
                className={`mt-6 space-y-6 font-reading text-stone-800 dark:text-stone-200 ${readingTextClass}`}
              >
                {activeHymn.verses.map((verse) => (
                  <div key={verse.number} className="flex gap-3.5">
                    <span className="font-tabular pt-1 text-sm font-bold text-[#7F1D1D] dark:text-amber-400">
                      {verse.number}.
                    </span>
                    <p className="whitespace-pre-line">
                      {includeLyrics && highlightTextTerm ? (
                        <HighlightMatch text={verse.text} highlight={highlightTextTerm} />
                      ) : (
                        verse.text
                      )}
                    </p>
                  </div>
                ))}

                {activeHymn.chorus && (
                  <div className="rounded-2xl bg-amber-50/80 p-4 dark:bg-amber-950/25">
                    <p className="font-sans text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Refrein
                    </p>
                    <p className="mt-1.5 whitespace-pre-line italic text-stone-900 dark:text-stone-100">
                      {includeLyrics && highlightTextTerm ? (
                        <HighlightMatch text={activeHymn.chorus} highlight={highlightTextTerm} />
                      ) : (
                        activeHymn.chorus
                      )}
                    </p>
                  </div>
                )}
              </div>

              {(prevHymn || nextHymn) && (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 dark:border-stone-800/80">
                  {prevHymn ? (
                    <button
                      type="button"
                      onClick={() => handleSelectHymn(prevHymn.id)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#F4F6F9] px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200/70 dark:bg-[#1E232D] dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="max-w-[180px] truncate sm:max-w-xs">
                        {prevHymn.book} {getHymnCodeLabel(prevHymn)} · {prevHymn.title}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {nextHymn && (
                    <button
                      type="button"
                      onClick={() => handleSelectHymn(nextHymn.id)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                    >
                      <span className="max-w-[180px] truncate sm:max-w-xs">
                        {nextHymn.book} {getHymnCodeLabel(nextHymn)} · {nextHymn.title}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Music className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                Pilih lagu di daftar untuk membaca lirik nyanyian.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
