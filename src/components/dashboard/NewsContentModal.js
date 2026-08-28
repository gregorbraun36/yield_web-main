import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Loader2, X } from 'lucide-react';

const FRAME_TIMEOUT_MS = 5500;
const isEuronewsHost = (hostname = '') => {
  const host = hostname.toLowerCase();
  return host === 'euronews.com' || host.endsWith('.euronews.com');
};

const formatDateTime = (isoDate) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const canPlayDirectVideo = (url = '') => (
  typeof url === 'string'
  && /\.mp4($|\?)/i.test(url)
);

const NewsContentModal = ({
  open,
  item,
  onClose,
}) => {
  const [mode, setMode] = useState('loading');
  const [iframeKey, setIframeKey] = useState(0);
  const [articlePayload, setArticlePayload] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState(null);
  const lastFocusRef = useRef(null);
  const timeoutRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const isForcedFallbackHost = useMemo(() => {
    if (!item?.url) return false;
    try {
      const hostname = new URL(item.url).hostname.toLowerCase();
      return isEuronewsHost(hostname);
    } catch {
      return false;
    }
  }, [item?.url]);

  const scheduleFallbackTimeout = () => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setMode((current) => (current === 'loading' ? 'fallback' : current));
    }, FRAME_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!open || !item) return undefined;
    setArticlePayload(null);
    setArticleError(null);
    setArticleLoading(false);
    if (isForcedFallbackHost) {
      setMode('fallback');
      return undefined;
    }
    setMode('loading');
    setIframeKey((prev) => prev + 1);
    scheduleFallbackTimeout();
    return () => {
      resetTimeout();
    };
  }, [open, item?.url, isForcedFallbackHost]);

  useEffect(() => {
    if (!open || !item?.url || !isForcedFallbackHost) return undefined;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const loadArticle = async () => {
      try {
        setArticleLoading(true);
        setArticleError(null);
        const fetchPayload = async (url) => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        };
        let payload = await fetchPayload(`/api/euronews-article?url=${encodeURIComponent(item.url)}`);
        if (!Array.isArray(payload?.paragraphs) || payload.paragraphs.length === 0) {
          payload = await fetchPayload(`/api/euronews-article?url=${encodeURIComponent(item.url)}&force=1`);
        }
        setArticlePayload(payload);
      } catch (error) {
        if (controller.signal.aborted) return;
        setArticleError(error?.message || 'Artikel konnte nicht geladen werden.');
      } finally {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
          setArticleLoading(false);
        }
      }
    };

    loadArticle();
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, item?.url, isForcedFallbackHost]);

  useEffect(() => {
    if (!open) return undefined;

    lastFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (lastFocusRef.current && typeof lastFocusRef.current.focus === 'function') {
        lastFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  const modalTitle = useMemo(() => item?.title || 'Nachricht', [item?.title]);
  const isVideoItem = item?.type === 'video' || item?.url?.includes('/video/');
  const directVideoUrl = articlePayload?.video?.playbackUrl || item?.playbackUrl || null;
  const embeddedVideoUrl = articlePayload?.video?.embedUrl || item?.embedUrl || null;

  if (!open || !item) return null;

  const handleIframeLoad = () => {
    resetTimeout();
    setMode('iframe');
  };

  const handleIframeError = () => {
    resetTimeout();
    setMode('fallback');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60"
        aria-label="Modal schließen"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        className="relative w-full max-w-[1200px] h-[92vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="h-full min-h-0 flex flex-col">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-[0.14em]">Euronews</p>
              <h3 className="text-base sm:text-lg font-semibold text-[#0B1E33] truncate">{modalTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(item.publishedAt)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                Euronews öffnen
                <ExternalLink size={13} />
              </a>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Schließen"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-slate-100 relative">
            {mode === 'loading' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/90">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Inhalt wird geladen...
                </div>
              </div>
            )}

            {mode !== 'fallback' && !isForcedFallbackHost && (
              <iframe
                key={iframeKey}
                src={item.url}
                title={modalTitle}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-popups allow-same-origin allow-forms"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}

            {mode === 'fallback' && (
              <div className="h-full min-h-0 overflow-auto bg-slate-50 p-4 sm:p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                    Lesemodus aktiv
                  </div>
                  {item.image ? (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                      <img src={item.image} alt={item.title} className="w-full h-72 object-cover" />
                    </div>
                  ) : null}
                  <article className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-7">
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                      {formatDateTime(articlePayload?.publishedAt || item.publishedAt)}
                    </p>
                  {!articleLoading && isVideoItem && (directVideoUrl || embeddedVideoUrl) ? (
                    <div className="mt-5">
                      {directVideoUrl && canPlayDirectVideo(directVideoUrl) ? (
                        <video
                          controls
                          preload="metadata"
                          src={directVideoUrl}
                          className="w-full rounded-xl border border-slate-200 bg-black"
                        />
                      ) : (
                        <iframe
                          title={`${item.title} Video`}
                          src={embeddedVideoUrl || directVideoUrl}
                          className="w-full h-[380px] rounded-xl border border-slate-200 bg-black"
                          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      )}
                    </div>
                  ) : null}
                  {articleLoading ? (
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 size={14} className="animate-spin" />
                      {isVideoItem ? 'Video wird geladen...' : 'Artikel wird im Lesemodus geladen...'}
                    </div>
                  ) : null}
                  {!articleLoading && articlePayload?.paragraphs?.length ? (
                    <div className="mt-5 space-y-5 text-[17px] leading-8 text-slate-800">
                      {articlePayload.paragraphs.slice(0, 12).map((paragraph, idx) => (
                        <p key={`${idx}-${paragraph.slice(0, 24)}`} className="text-balance">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {!articleLoading && !articlePayload?.paragraphs?.length && item.summary ? (
                    <p className="text-base leading-7 text-slate-700 mt-4">{item.summary}</p>
                  ) : null}
                  {!articleLoading && articleError && !articlePayload?.paragraphs?.length ? (
                    <p className="text-xs text-slate-500 mt-2">
                      Lesemodus derzeit eingeschrankt ({articleError}).
                    </p>
                  ) : null}
                  <div className="mt-6">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-[#0B1E33] text-white px-4 py-2 text-sm hover:bg-[#102B49]"
                    >
                      Bei Euronews weiterlesen
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  </article>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsContentModal;
