import React, { useState } from 'react';
import { Check, Copy, Download, ExternalLink, MessageCircle, RefreshCw, Share2, X } from 'lucide-react';
import { SharePayload } from '../utils/shareUtils';

interface ShareSheetModalProps {
  open: boolean;
  payload: SharePayload | null;
  onClose: () => void;
  onSharedOrCopied?: (message: string) => void;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  open,
  payload,
  onClose,
  onSharedOrCopied,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);

  if (!open || !payload) return null;

  const shareUrl = payload.url || (typeof window !== 'undefined' ? window.location.origin : '');
  const fullShareText = shareUrl ? `${payload.text}\n\n${shareUrl}` : payload.text;

  const waHref = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
    payload.text
  )}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}&quote=${encodeURIComponent(payload.text)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    payload.text.slice(0, 230)
  )}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      onSharedOrCopied?.('Teks & tautan berhasil disalin ke clipboard.');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      onSharedOrCopied?.('Gagal menyalin teks ke clipboard.');
    }
  };

  const handleDownloadCardImage = async () => {
    if (!payload?.imageUrl) return;
    setDownloadingCard(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/ayat_mingguan_pokok_anggur.jpg';

      await new Promise<void>((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => {
            const fallback = new Image();
            fallback.crossOrigin = 'anonymous';
            fallback.src = payload.imageUrl!;
            fallback.onload = () => {
              img.src = fallback.src;
              resolve();
            };
            fallback.onerror = reject;
          };
        }
      });

      const width = 1200;
      const height = 675;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');

      // 1. Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Artistic overlay gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.50)');
      grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.68)');
      grad.addColorStop(1, 'rgba(10, 10, 15, 0.94)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 3. Subtle gold inner frame
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // 4. Church Header
      ctx.fillStyle = '#FCD34D';
      ctx.font = '600 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('GEREJA PROTESTAN INDONESIA DI PAPUA · GPI GETSEMANI SORONG', 76, 88);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(76, 106);
      ctx.lineTo(width - 76, 106);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '500 16px system-ui, sans-serif';
      ctx.fillText('Ayat Renungan Minggu Ini', 76, 142);

      // 5. Verse scripture quote with word wrapping
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic 32px Georgia, "Times New Roman", serif';
      const quote = `"${payload.verseText || payload.text}"`;
      const maxWidth = width - 152;
      const startY = 210;
      const lineHeight = 48;

      const words = quote.split(' ');
      let currentLine = '';
      let textY = startY;

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(currentLine.trim(), 76, textY);
          currentLine = words[n] + ' ';
          textY += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      ctx.fillText(currentLine.trim(), 76, textY);

      // 6. Scripture reference
      textY += 56;
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(`— ${payload.verseRef || payload.title} (Alkitab TB)`, 76, Math.min(textY, height - 90));

      // 7. Footer branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText('Portal Jemaat GPI Getsemani Sorong · Klasis Sorong Raya', 76, height - 56);

      // 8. Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const safeFilename = `Ayat-${(payload.verseRef || 'Mingguan').replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onSharedOrCopied?.('Gambar kartu ayat berhasil dibuat dan diunduh.');
    } catch {
      onSharedOrCopied?.('Gagal membuat gambar kartu, silakan salin teks atau bagikan ke media sosial.');
    } finally {
      setDownloadingCard(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
    >
      <div className="animate-android-sheet w-full max-w-md rounded-t-[28px] bg-white p-5 shadow-2xl dark:bg-[#161A22] sm:rounded-[28px] sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-700 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400">
              <Share2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2
                id="share-sheet-title"
                className="text-base font-bold text-stone-900 dark:text-stone-100"
              >
                Bagikan Ayat Alkitab
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Unduh gambar kartu ayat atau kirim ke media sosial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela bagikan"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F6F9] text-stone-500 hover:bg-stone-200 dark:bg-[#1E232D] dark:text-stone-300 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card or Text Preview */}
        {payload.imageUrl ? (
          <div className="mt-4 space-y-3">
            <div className="relative overflow-hidden rounded-2xl shadow-md bg-stone-900 text-white">
              <img
                src={payload.imageUrl}
                alt={payload.verseRef || 'Latar Ayat Alkitab'}
                className="h-48 sm:h-52 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/60 to-black/35 flex flex-col justify-between p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
                    GPI Papua · Getsemani Sorong
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-stone-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Ayat Minggu Ini
                  </span>
                </div>

                <div className="my-auto py-1.5">
                  <p className="font-serif italic text-xs sm:text-sm leading-relaxed text-stone-100 drop-shadow-sm line-clamp-4">
                    "{payload.verseText || payload.text}"
                  </p>
                  <p className="mt-2 text-xs font-bold text-amber-300 tracking-wide drop-shadow-sm">
                    — {payload.verseRef || payload.title}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={downloadingCard}
              onClick={handleDownloadCardImage}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-stone-950 transition-all hover:bg-amber-300 active:scale-[0.98] cursor-pointer shadow-sm"
            >
              {downloadingCard ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Membuat Gambar Kartu Ayat...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Unduh Gambar Kartu Ayat (PNG)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-[#F4F6F9] p-3.5 text-xs leading-relaxed text-stone-700 dark:bg-[#1E232D] dark:text-stone-200">
            <p className="font-bold text-[#7F1D1D] dark:text-amber-400">{payload.title}</p>
            <p className="mt-1.5 max-h-36 overflow-y-auto whitespace-pre-line">{payload.text}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka WhatsApp untuk membagikan konten.')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>

          <a
            href={tgHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka Telegram untuk membagikan konten.')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Telegram</span>
          </a>

          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka Facebook untuk membagikan konten.')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Facebook</span>
          </a>

          <a
            href={xHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka X untuk membagikan konten.')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            <ExternalLink className="h-4 w-4" />
            <span>X / Twitter</span>
          </a>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#F4F6F9] px-4 py-2 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 dark:bg-[#1E232D] dark:text-stone-100 dark:hover:bg-stone-800 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tersalin ke Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Salin Teks & Tautan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

