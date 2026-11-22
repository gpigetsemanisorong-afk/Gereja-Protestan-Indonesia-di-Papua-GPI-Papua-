import rawPericopes from './biblePericopes.json';
import { BibleVerse } from '../types/church';

const PERICOPE_MAP: Record<string, string> = rawPericopes as Record<string, string>;

export interface ChapterPericopeEntry {
  verse: number;
  title: string;
}

export interface ResolvedPericope {
  title: string;
  startBookId: number;
  startChapter: number;
  startVerse: number;
  isContinuation: boolean;
}

// Pre-index pericopes per `${bookId}:${chapter}` for fast O(1) chapter lookups
const CHAPTER_PERICOPE_INDEX = new Map<string, ChapterPericopeEntry[]>();
const BOOK_PERICOPE_INDEX = new Map<number, Array<{ chapter: number; verse: number; title: string }>>();

for (const [key, title] of Object.entries(PERICOPE_MAP)) {
  const [bStr, cStr, vStr] = key.split(':');
  const bookId = Number(bStr);
  const chapter = Number(cStr);
  const verse = Number(vStr);
  if (!bookId || !chapter || !verse || !title) continue;

  const chKey = `${bookId}:${chapter}`;
  const chList = CHAPTER_PERICOPE_INDEX.get(chKey) || [];
  chList.push({ verse, title });
  CHAPTER_PERICOPE_INDEX.set(chKey, chList);

  const bookList = BOOK_PERICOPE_INDEX.get(bookId) || [];
  bookList.push({ chapter, verse, title });
  BOOK_PERICOPE_INDEX.set(bookId, bookList);
}

for (const list of CHAPTER_PERICOPE_INDEX.values()) {
  list.sort((a, b) => a.verse - b.verse);
}

for (const list of BOOK_PERICOPE_INDEX.values()) {
  list.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);
}

export function getVersePericopeTitle(
  bookId: number,
  chapter: number,
  verse: number
): string | undefined {
  return PERICOPE_MAP[`${bookId}:${chapter}:${verse}`];
}

export function getChapterPericopes(
  bookId: number,
  chapter: number
): ChapterPericopeEntry[] {
  return CHAPTER_PERICOPE_INDEX.get(`${bookId}:${chapter}`) || [];
}

/**
 * Resolves the active pericope title covering a specific book, chapter, and verse.
 * If the verse falls before the first pericope heading in the chapter (e.g., Kejadian 2:1-7),
 * walks backward within the same book to locate the continuing pericope title (e.g., Kejadian 1:1).
 */
export function resolveActivePericopeTitle(
  bookId: number,
  chapter: number,
  verse = 1
): ResolvedPericope | null {
  const bookPericopes = BOOK_PERICOPE_INDEX.get(bookId);
  if (!bookPericopes || bookPericopes.length === 0) return null;

  let match: { chapter: number; verse: number; title: string } | null = null;
  for (const entry of bookPericopes) {
    if (
      entry.chapter < chapter ||
      (entry.chapter === chapter && entry.verse <= verse)
    ) {
      match = entry;
    } else {
      break;
    }
  }

  if (!match) {
    // Fallback to the first pericope inside the chapter if verse < first heading
    const inChapter = getChapterPericopes(bookId, chapter);
    if (inChapter.length > 0) {
      return {
        title: inChapter[0].title,
        startBookId: bookId,
        startChapter: chapter,
        startVerse: inChapter[0].verse,
        isContinuation: false,
      };
    }
    return null;
  }

  return {
    title: match.title,
    startBookId: bookId,
    startChapter: match.chapter,
    startVerse: match.verse,
    isContinuation: match.chapter < chapter,
  };
}

export function enrichVersesWithPericopes(
  bookId: number,
  chapter: number,
  verses: BibleVerse[]
): BibleVerse[] {
  return verses.map((v) => {
    const title = v.title?.trim() || getVersePericopeTitle(bookId, chapter, v.verse);
    return title ? { ...v, title } : v;
  });
}
