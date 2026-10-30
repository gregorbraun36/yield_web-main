const CACHE_TTL_MS = 10 * 60 * 1000;

const FEED_URLS = [
  { key: 'top', url: 'https://de.euronews.com/rss' },
  { key: 'business', url: 'https://de.euronews.com/rss?level=theme&name=business' },
];

const VIDEO_PAGE_URL = 'https://de.euronews.com/video';
const NEWS_PAGE_URL = 'https://de.euronews.com';

const CATEGORY_ALIASES = {
  top: 'Top News',
  europa: 'Europa',
  wirtschaft: 'Wirtschaft',
  welt: 'Welt',
  technologie: 'Technologie',
  wissen: 'Wissen',
  kultur: 'Kultur',
  reisen: 'Reisen',
  videos: 'Videos',
};

const inMemoryCache = globalThis.__euronewsFeedCache || { data: null, expiresAt: 0 };
globalThis.__euronewsFeedCache = inMemoryCache;

const decodeHtml = (value = '') => value
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const stripHtml = (value = '') => decodeHtml(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeToGermanEuronewsUrl = (value = '') => {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (!parsed.hostname.toLowerCase().includes('euronews.com')) return value;
    parsed.protocol = 'https:';
    parsed.hostname = 'de.euronews.com';
    return parsed.toString();
  } catch {
    return value;
  }
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const extractTag = (xml, tagName) => {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
};

const extractRssImageFromBlock = (block = '') => {
  const mediaContent = block.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const mediaThumb = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1];
  const enclosureImage = block.match(/<enclosure[^>]+type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']/i)?.[1]
    || block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i)?.[1];
  return mediaContent || mediaThumb || enclosureImage || null;
};

const inferCategory = (url = '', title = '', feedKey = 'top') => {
  const value = `${url} ${title}`.toLowerCase();
  if (value.includes('/business') || feedKey === 'business') return CATEGORY_ALIASES.wirtschaft;
  if (value.includes('/culture') || feedKey === 'culture') return CATEGORY_ALIASES.kultur;
  if (value.includes('/travel') || value.includes('/reise')) return CATEGORY_ALIASES.reisen;
  if (value.includes('/green') || value.includes('/science') || value.includes('/health') || value.includes('klima')) return CATEGORY_ALIASES.wissen;
  if (value.includes('/tech') || value.includes('/next') || value.includes('ai') || value.includes('ki')) return CATEGORY_ALIASES.technologie;
  if (value.includes('/world') || value.includes('/international')) return CATEGORY_ALIASES.welt;
  if (value.includes('/europe') || value.includes('/eu-') || value.includes('/my-europe')) return CATEGORY_ALIASES.europa;
  return CATEGORY_ALIASES.top;
};

const parseRssItems = (xml, feedKey) => {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.map((entry, index) => {
    const block = entry[1] || '';
    const title = extractTag(block, 'title');
    const url = normalizeToGermanEuronewsUrl(extractTag(block, 'link'));
    const description = extractTag(block, 'description');
    const publishedAt = safeDate(extractTag(block, 'pubDate'));
    const rssImage = extractRssImageFromBlock(block);
    const isVideo = url.includes('/video/');
    return {
      id: `${feedKey}-${index}-${url || title}`.slice(0, 220),
      title,
      summary: description,
      image: rssImage,
      publishedAt,
      category: isVideo ? CATEGORY_ALIASES.videos : inferCategory(url, title, feedKey),
      url,
      type: isVideo ? 'video' : 'news',
      source: 'Euronews',
      durationLabel: null,
    };
  }).filter((item) => item.title && item.url);
};

const fetchText = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 H68Invest Dashboard Feed Bot/1.0' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

const extractOgImage = (html = '') => {
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  const ldJsonImage = html.match(/"image"\s*:\s*"([^"]+)"/i)?.[1] || null;
  return ogMatch?.[1] || twitterMatch?.[1] || ldJsonImage || null;
};

const enrichNewsImages = async (items) => {
  const tasks = items.map(async (item) => {
    if (item.image) return item;
    try {
      const html = await fetchText(item.url, 5000);
      return { ...item, image: extractOgImage(html) };
    } catch {
      return item;
    }
  });
  const settled = await Promise.allSettled(tasks);
  const enrichedMap = new Map();
  settled.forEach((result) => {
    if (result.status === 'fulfilled' && result.value?.id) {
      enrichedMap.set(result.value.id, result.value);
    }
  });
  return items.map((item) => enrichedMap.get(item.id) || item);
};

const flattenJsonLd = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== 'object') return [];
  const self = [value];
  const children = Object.values(value).flatMap(flattenJsonLd);
  return [...self, ...children];
};

const parseDurationToLabel = (duration) => {
  if (!duration || typeof duration !== 'string' || !duration.startsWith('PT')) return null;
  const hours = Number((duration.match(/(\d+)H/) || [])[1] || 0);
  const minutes = Number((duration.match(/(\d+)M/) || [])[1] || 0);
  const seconds = Number((duration.match(/(\d+)S/) || [])[1] || 0);
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  if (!totalSeconds) return null;
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const parseVideoItems = async () => {
  try {
    const html = await fetchText(VIDEO_PAGE_URL, 8000);
    const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const allObjects = scripts.flatMap((script) => {
      try {
        const data = JSON.parse(script[1]);
        return flattenJsonLd(data);
      } catch {
        return [];
      }
    });
    const videos = allObjects
      .filter((entry) => {
        const type = entry?.['@type'];
        return Array.isArray(type) ? type.includes('VideoObject') : type === 'VideoObject';
      })
      .map((entry, index) => {
        const url = entry.url || entry.mainEntityOfPage || '';
        const thumb = Array.isArray(entry.thumbnailUrl) ? entry.thumbnailUrl[0] : entry.thumbnailUrl;
        return {
          id: `video-${index}-${url}`.slice(0, 220),
          title: stripHtml(entry.name || ''),
          summary: stripHtml(entry.description || ''),
          image: thumb || null,
          publishedAt: safeDate(entry.uploadDate || entry.datePublished),
          category: CATEGORY_ALIASES.videos,
          url,
          type: 'video',
          source: 'Euronews',
          durationLabel: parseDurationToLabel(entry.duration),
          playbackUrl: entry.contentUrl || null,
          embedUrl: entry.embedUrl || null,
        };
      })
      .filter((entry) => entry.title && entry.url);

    return videos.slice(0, 12);
  } catch {
    return [];
  }
};

const toCategories = (newsItems, videoItems) => {
  const categories = Object.values(CATEGORY_ALIASES).reduce((acc, label) => ({ ...acc, [label]: [] }), {});
  const rssVideos = newsItems.filter((item) => item.type === 'video');
  const mergedVideos = Array.from(
    new Map([...videoItems, ...rssVideos].map((item) => [item.url, item])).values(),
  );

  newsItems.forEach((item) => {
    if (item.type === 'video') return;
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
    if (item.category !== CATEGORY_ALIASES.top) {
      categories[CATEGORY_ALIASES.top].push(item);
    }
  });
  categories[CATEGORY_ALIASES.videos] = mergedVideos;
  categories[CATEGORY_ALIASES.top] = categories[CATEGORY_ALIASES.top]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 20);
  Object.keys(categories).forEach((label) => {
    if (label === CATEGORY_ALIASES.top || label === CATEGORY_ALIASES.videos) return;
    categories[label] = categories[label]
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, 16);
  });
  categories[CATEGORY_ALIASES.videos] = categories[CATEGORY_ALIASES.videos]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 12);
  return categories;
};

const buildFeedPayload = async () => {
  const feedSettled = await Promise.allSettled(FEED_URLS.map(async (feed) => {
    const xml = await fetchText(feed.url, 8000);
    return parseRssItems(xml, feed.key);
  }));

  const rawNews = feedSettled
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value || []);

  const uniqueNews = Array.from(new Map(rawNews.map((item) => [item.url, item])).values());
  const enrichedNews = await enrichNewsImages(
    uniqueNews.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)).slice(0, 40),
  );
  const videos = await parseVideoItems();

  return {
    source: 'Euronews',
    fetchedAt: new Date().toISOString(),
    links: {
      news: NEWS_PAGE_URL,
      videos: VIDEO_PAGE_URL,
    },
    categories: toCategories(enrichedNews, videos),
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    const forceRefresh = String(req.query?.force || '').toLowerCase() === '1';
    if (!forceRefresh && inMemoryCache.data && inMemoryCache.expiresAt > now) {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300');
      return res.status(200).json(inMemoryCache.data);
    }

    const payload = await buildFeedPayload();
    inMemoryCache.data = payload;
    inMemoryCache.expiresAt = now + CACHE_TTL_MS;

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch {
    const fallback = {
      source: 'Euronews',
      fetchedAt: new Date().toISOString(),
      links: { news: NEWS_PAGE_URL, videos: VIDEO_PAGE_URL },
      categories: Object.values(CATEGORY_ALIASES).reduce((acc, label) => ({ ...acc, [label]: [] }), {}),
    };
    return res.status(200).json(fallback);
  }
}
