import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { getEuronewsFeed, CATEGORY_TABS } from '@/lib/newsFeed';
import NewsContentModal from '@/components/dashboard/NewsContentModal';

const formatRelativeTime = (isoDate) => {
  if (!isoDate) return 'Vor kurzem';
  const now = Date.now();
  const stamp = new Date(isoDate).getTime();
  if (Number.isNaN(stamp)) return 'Vor kurzem';
  const minutes = Math.max(1, Math.round((now - stamp) / 60000));
  if (minutes < 60) return `Vor ${minutes} Min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Vor ${hours} Std`;
  const days = Math.round(hours / 24);
  return `Vor ${days} Tag${days > 1 ? 'en' : ''}`;
};

const fallbackCardClass = 'bg-gradient-to-br from-[#102B49] via-[#173E67] to-[#235E8D]';

const mediaStyle = (image) => (
  image
    ? {
      backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.58) 100%), url("${image}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    : undefined
);

const NewsCard = ({ item, compact = false, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    className={`block rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-shadow ${compact ? 'h-full' : ''}`}
  >
    <div
      className={`relative ${compact ? 'h-24' : 'h-40'} ${item.image ? '' : fallbackCardClass}`}
      style={mediaStyle(item.image)}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-2.5 text-white">
        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-100/90">
          {item.category} · {formatRelativeTime(item.publishedAt)}
        </p>
        <p className={`${compact ? 'text-sm leading-tight line-clamp-2' : 'text-[28px] leading-tight line-clamp-2'} font-semibold mt-1 drop-shadow-[0_2px_8px_rgba(2,6,23,0.75)]`}>
          {item.title}
        </p>
      </div>
    </div>
    {item.summary && !compact && (
      <div className="p-2.5">
        <p className="text-[13px] text-slate-600 line-clamp-2">{item.summary}</p>
      </div>
    )}
  </button>
);

const VideoCard = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    className="block rounded-lg overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-shadow"
  >
    <div
      className={`relative h-28 ${item.image ? '' : fallbackCardClass}`}
      style={mediaStyle(item.image)}
    >
      <div className="absolute inset-0 bg-slate-900/35 flex items-center justify-center">
        <PlayCircle className="text-white/95" size={36} />
      </div>
      {item.durationLabel && (
        <span className="absolute right-2 bottom-2 text-[11px] bg-black/70 text-white px-2 py-0.5 rounded">
          {item.durationLabel}
        </span>
      )}
    </div>
    <div className="p-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-sky-700 mb-1">
        {formatRelativeTime(item.publishedAt)}
      </p>
      <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
    </div>
  </button>
);

const NewsVideoSection = () => {
  const [activeTab, setActiveTab] = useState('Top News');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feed, setFeed] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadFeed = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getEuronewsFeed();
        if (!cancelled) setFeed(data);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Feed konnte nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadFeed();
    return () => { cancelled = true; };
  }, []);

  const activeItems = useMemo(() => (
    feed?.categories?.[activeTab] || []
  ), [feed, activeTab]);

  const videoItems = useMemo(() => (
    feed?.categories?.Videos || []
  ), [feed]);

  const featured = activeItems[0] || null;
  const rightItems = activeItems.slice(1, 4);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[30px] leading-tight font-semibold text-[#0B1E33]">Nachrichten & Videos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aktuelle Nachrichten und Videos von {feed?.source || 'Euronews'}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-[0.14em]">In Zusammenarbeit mit</p>
          <p className="text-sm font-semibold text-[#0B1E33]">{feed?.source || 'Euronews'}</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-[#0B1E33] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`news-skeleton-${idx}`} className="h-40 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : activeTab === 'Videos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {videoItems.slice(0, 9).map((item) => <VideoCard key={item.id} item={item} onOpen={handleOpenItem} />)}
          {videoItems.length === 0 && (
            <p className="text-sm text-slate-500">Aktuell sind keine Videos verfügbar.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1.08fr,1fr] gap-2">
            <div>
              {featured ? (
                <NewsCard item={featured} onOpen={handleOpenItem} />
              ) : (
                <div className="h-44 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                  Keine Nachrichten in dieser Kategorie.
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {rightItems.map((item) => (
                <NewsCard key={item.id} item={item} compact onOpen={handleOpenItem} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[#0B1E33]">Videos</h4>
            <a
              href={feed?.links?.videos || 'https://www.euronews.com/video'}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              Alle Videos anzeigen
              <ExternalLink size={13} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
            {videoItems.slice(0, 5).map((item) => <VideoCard key={item.id} item={item} onOpen={handleOpenItem} />)}
            {videoItems.length === 0 && (
              <p className="text-sm text-slate-500">Aktuell sind keine Videos verfügbar.</p>
            )}
          </div>
        </>
      )}

      <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-3">
        <p>
          Die Inhalte werden von Euronews bereitgestellt. Für externe Seiten ist ausschließlich der jeweilige Anbieter verantwortlich.
        </p>
        <a
          href={feed?.links?.news || 'https://de.euronews.com'}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          Zu Euronews
          <ExternalLink size={12} />
        </a>
      </div>

      <NewsContentModal
        open={modalOpen}
        item={selectedItem}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default NewsVideoSection;
