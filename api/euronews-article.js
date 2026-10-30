const CACHE_TTL_MS = 10 * 60 * 1000;

const articleCache = globalThis.__euronewsArticleCache || new Map();
globalThis.__euronewsArticleCache = articleCache;

const stripHtml = (value = '') => value
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;?/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/\s+/g, ' ')
  .trim();

const extractMeta = (html, attr, name) => {
  const regexA = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const regexB = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`, 'i');
  const match = html.match(regexA) || html.match(regexB);
  return match?.[1] || null;
};

const NOISE_PATTERNS = [
  /^advertisement$/i,
  /^share$/i,
  /^comments$/i,
  /^read more$/i,
  /^go to accessibility shortcuts$/i,
  /^news$/i,
];

const SOCIAL_NOISE = /(facebook|twitter|flipboard|reddit|linkedin|messenger|telegram|threads|whatsapp|share comments)/i;

const normalizeParagraph = (value = '') => value
  .replace(/\bCopyright AP Photo\b/gi, ' ')
  .replace(/\bPublished on\s+\d{2}\/\d{2}\/\d{4}[\s\S]*?GMT[+\-]\d\b/gi, ' ')
  .replace(/\bShare Comments\b[\s\S]*$/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const collectParagraphsFromBlock = (block = '') => [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  .map((entry) => normalizeParagraph(stripHtml(entry[1])))
  .filter((paragraph) => (
    paragraph.length >= 40
    && !NOISE_PATTERNS.some((pattern) => pattern.test(paragraph))
    && !paragraph.toLowerCase().startsWith('copyright ')
    && !SOCIAL_NOISE.test(paragraph)
  ));

const flattenJsonLd = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== 'object') return [];
  const self = [value];
  const children = Object.values(value).flatMap(flattenJsonLd);
  return [...self, ...children];
};

const splitArticleBody = (articleBody = '') => {
  const clean = normalizeParagraph(stripHtml(articleBody))
    .replace(/([.!?]["'”]?)(?=[A-Z])/g, '$1 ');
  if (!clean || clean.length < 120) return [];
  const byLines = clean.split(/\s*\n+\s*/).map((line) => line.trim()).filter(Boolean);
  const chunks = (byLines.length > 1 ? byLines : [clean]).flatMap((line) => {
    if (line.length <= 360) return [line];
    const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
    if (sentences.length <= 1) return [line];
    const grouped = [];
    let current = '';
    sentences.forEach((sentence) => {
      const next = current ? `${current} ${sentence}` : sentence;
      if (next.length > 340 && current) {
        grouped.push(current);
        current = sentence;
      } else {
        current = next;
      }
    });
    if (current) grouped.push(current);
    return grouped;
  });
  return chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 60 && !SOCIAL_NOISE.test(chunk))
    .slice(0, 20);
};

const extractJsonLdArticlePayload = (html) => {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let best = null;
  scripts.forEach((script) => {
    try {
      const raw = JSON.parse(script[1]);
      const nodes = flattenJsonLd(raw);
      nodes.forEach((node) => {
        const type = node?.['@type'];
        const isNews = type === 'NewsArticle' || (Array.isArray(type) && type.includes('NewsArticle'));
        if (!isNews) return;
        const paragraphs = splitArticleBody(node?.articleBody || '');
        if (!paragraphs.length) return;
        const candidate = {
          title: node?.headline ? normalizeParagraph(stripHtml(node.headline)) : null,
          summary: node?.description ? normalizeParagraph(stripHtml(node.description)) : null,
          image: Array.isArray(node?.image) ? node.image[0] : node?.image || null,
          publishedAt: node?.datePublished || null,
          paragraphs,
        };
        if (!best || candidate.paragraphs.length > best.paragraphs.length) {
          best = candidate;
        }
      });
    } catch {
      // ignore invalid json-ld blocks
    }
  });
  return best;
};

const toUrlValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const first = value.find(Boolean);
    return toUrlValue(first);
  }
  if (typeof value === 'object') {
    return value.url || value.contentUrl || value.embedUrl || null;
  }
  return null;
};

const extractJsonLdVideoPayload = (html) => {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let best = null;
  scripts.forEach((script) => {
    try {
      const raw = JSON.parse(script[1]);
      const nodes = flattenJsonLd(raw);
      nodes.forEach((node) => {
        const type = node?.['@type'];
        const isVideo = type === 'VideoObject' || (Array.isArray(type) && type.includes('VideoObject'));
        if (!isVideo) return;
        const playbackUrl = toUrlValue(node?.contentUrl);
        const embedUrl = toUrlValue(node?.embedUrl);
        const pageUrl = toUrlValue(node?.url);
        const title = normalizeParagraph(stripHtml(node?.name || ''));
        const description = normalizeParagraph(stripHtml(node?.description || ''));
        const thumbnailUrl = toUrlValue(node?.thumbnailUrl);
        const publishedAt = node?.uploadDate || node?.datePublished || null;
        const score = Number(Boolean(playbackUrl)) + Number(Boolean(embedUrl)) + Number(Boolean(title));
        if (!best || score > best.score) {
          best = {
            score,
            payload: {
              title: title || null,
              summary: description || null,
              image: thumbnailUrl || null,
              publishedAt,
              playbackUrl: playbackUrl || null,
              embedUrl: embedUrl || null,
              pageUrl: pageUrl || null,
            },
          };
        }
      });
    } catch {
      // ignore invalid json-ld blocks
    }
  });
  return best?.payload || null;
};

const extractParagraphs = (html) => {
  const articleBlocks = [...html.matchAll(/<article[\s\S]*?<\/article>/gi)].map((entry) => entry[0] || '');

  // Euronews pages may contain multiple article blocks (hero, related, embeds).
  // Choose the block with the richest paragraph set, then fallback to whole HTML.
  const bestArticleParagraphs = articleBlocks.reduce((best, block) => {
    const paragraphs = collectParagraphsFromBlock(block);
    return paragraphs.length > best.length ? paragraphs : best;
  }, []);

  const fallbackParagraphs = collectParagraphsFromBlock(html);
  const chosen = bestArticleParagraphs.length >= 3 ? bestArticleParagraphs : fallbackParagraphs;
  return Array.from(new Set(chosen)).slice(0, 20);
};

const fetchHtml = async (url, timeoutMs = 9000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 H68Invest Dashboard Reader/1.0' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildPayload = async (url) => {
  const html = await fetchHtml(url);
  const jsonLdPayload = extractJsonLdArticlePayload(html);
  const videoPayload = extractJsonLdVideoPayload(html);
  const title = extractMeta(html, 'property', 'og:title')
    || stripHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '')
    || 'Euronews';
  const summary = extractMeta(html, 'property', 'og:description')
    || extractMeta(html, 'name', 'description')
    || '';
  const image = extractMeta(html, 'property', 'og:image');
  const publishedAt = extractMeta(html, 'property', 'article:published_time') || null;
  const paragraphs = jsonLdPayload?.paragraphs?.length ? jsonLdPayload.paragraphs : extractParagraphs(html);
  return {
    source: 'Euronews',
    url,
    title: videoPayload?.title || jsonLdPayload?.title || stripHtml(title),
    summary: videoPayload?.summary || jsonLdPayload?.summary || stripHtml(summary),
    image: videoPayload?.image || jsonLdPayload?.image || image,
    publishedAt: videoPayload?.publishedAt || jsonLdPayload?.publishedAt || publishedAt,
    paragraphs,
    video: videoPayload,
    fetchedAt: new Date().toISOString(),
  };
};

const normalizeEuronewsUrl = (value) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const isHttp = parsed.protocol === 'https:' || parsed.protocol === 'http:';
    const isEuronewsHost = hostname === 'euronews.com' || hostname.endsWith('.euronews.com');
    if (!isHttp || !isEuronewsHost) return null;
    // Force German Euronews host and HTTPS.
    parsed.protocol = 'https:';
    parsed.hostname = 'de.euronews.com';
    return parsed.toString();
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawUrl = String(req.query?.url || '').trim();
  const forceRefresh = String(req.query?.force || '').toLowerCase() === '1';
  const url = normalizeEuronewsUrl(rawUrl);
  if (!rawUrl || !url) {
    return res.status(400).json({ error: 'Invalid article url.' });
  }

  const now = Date.now();
  const existing = articleCache.get(url);
  if (!forceRefresh && existing && existing.expiresAt > now) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json(existing.payload);
  }

  try {
    const payload = await buildPayload(url);
    articleCache.set(url, { payload, expiresAt: now + CACHE_TTL_MS });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: error?.message || 'Artikel konnte nicht geladen werden.',
    });
  }
}
