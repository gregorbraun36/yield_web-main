import { supabase } from '@/lib/supabase';

const parseFileNameFromDisposition = (value) => {
  if (!value) return null;
  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const basicMatch = value.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] || null;
};

const safeFallbackName = (title = '', defaultName = 'dokument') => {
  const normalized = String(title || '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();
  return normalized || defaultName;
};

export const downloadDocumentViaProxy = async (documentRow) => {
  const documentId = documentRow?.id;
  if (!documentId) {
    throw new Error('Dokument-ID fehlt.');
  }

  const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error('Sitzung konnte nicht gelesen werden.');
  }
  const accessToken = sessionResult?.session?.access_token;
  if (!accessToken) {
    throw new Error('Bitte erneut einloggen.');
  }

  let response;
  try {
    response = await fetch(`/api/download-document?documentId=${encodeURIComponent(documentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    response = null;
  }

  let blob;
  let fileName = safeFallbackName(documentRow?.title);

  if (response?.ok) {
    blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    fileName = parseFileNameFromDisposition(disposition) || fileName;
  } else {
    let message = '';
    if (response) {
      try {
        const data = await response.json();
        if (data?.error) message = data.error;
      } catch {
        try {
          const text = await response.text();
          if (text) message = text.slice(0, 180);
        } catch {
          // ignore parse errors
        }
      }
    }

    const directUrl = String(documentRow?.file_url || '').trim();
    if (!directUrl) {
      throw new Error(message || 'Dokument konnte nicht heruntergeladen werden.');
    }

    const directResponse = await fetch(directUrl, { method: 'GET' });
    if (!directResponse.ok) {
      const statusInfo = response ? `Proxy ${response.status}` : 'Proxy nicht erreichbar';
      throw new Error(message || `Dokument konnte nicht heruntergeladen werden (${statusInfo}).`);
    }
    blob = await directResponse.blob();
    if (!fileName.includes('.') && blob.type === 'application/pdf') {
      fileName = `${fileName}.pdf`;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
