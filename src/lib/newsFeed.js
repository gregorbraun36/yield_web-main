const CATEGORY_TABS = [
  'Top News',
  'Europa',
  'Wirtschaft',
  'Technologie',
  'Wissen',
  'Kultur',
  'Reisen',
  'Videos',
];

const EMPTY_CATEGORIES = CATEGORY_TABS.reduce((acc, label) => ({ ...acc, [label]: [] }), {});

export const getEuronewsFeed = async () => {
  const fetchPayload = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Feed konnte nicht geladen werden.');
    }
    return response.json();
  };

  let payload = await fetchPayload('/api/euronews-feed');
  const initialVideos = payload?.categories?.Videos;
  if (!Array.isArray(initialVideos) || initialVideos.length === 0) {
    payload = await fetchPayload('/api/euronews-feed?force=1');
  }

  return {
    source: payload?.source || 'Euronews',
    fetchedAt: payload?.fetchedAt || null,
    links: {
      news: payload?.links?.news || 'https://de.euronews.com',
      videos: payload?.links?.videos || 'https://de.euronews.com/video',
    },
    categories: {
      ...EMPTY_CATEGORIES,
      ...(payload?.categories || {}),
    },
  };
};

export { CATEGORY_TABS };
