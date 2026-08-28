import { createClient } from '@supabase/supabase-js';

const DOCUMENT_BUCKET = 'portfolio-documents';

const parseToken = (authHeader = '') => {
  if (!authHeader) return null;
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.slice(7).trim() || null;
};

const extractObjectPath = (fileUrl = '') => {
  const marker = `/${DOCUMENT_BUCKET}/`;
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;
  const raw = fileUrl.slice(index + marker.length);
  const withoutQuery = raw.split('?')[0].split('#')[0];
  const decoded = decodeURIComponent(withoutQuery || '');
  return decoded.replace(/^\/+/, '');
};

const parseDownloadFileName = (documentRow, objectPath) => {
  const pathName = String(objectPath || '').split('/').pop() || 'dokument';
  const pathExt = pathName.includes('.') ? pathName.split('.').pop() : '';
  const title = String(documentRow?.title || '').trim();
  const safeTitle = title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!safeTitle) return pathName;
  if (safeTitle.includes('.') || !pathExt) return safeTitle;
  return `${safeTitle}.${pathExt}`;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase server environment is not configured' });
  }

  const documentId = String(req.query?.documentId || req.body?.documentId || '').trim();
  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required' });
  }

  const token = parseToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: authResult, error: authError } = await userClient.auth.getUser();
    if (authError || !authResult?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const actorUserId = authResult.user.id;
    const { data: documentRow, error: documentError } = await adminClient
      .from('portfolio_documents')
      .select('id, user_id, title, mime_type, file_url')
      .eq('id', documentId)
      .maybeSingle();

    if (documentError) {
      return res.status(500).json({ error: 'Failed to load document metadata' });
    }
    if (!documentRow) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const isOwner = documentRow.user_id === actorUserId;
    let isAdmin = false;
    if (!isOwner) {
      const { data: profileRow, error: profileError } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', actorUserId)
        .maybeSingle();
      if (profileError) {
        return res.status(500).json({ error: 'Failed to verify permissions' });
      }
      isAdmin = profileRow?.role === 'admin';
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const objectPath = extractObjectPath(documentRow.file_url);
    if (!objectPath) {
      return res.status(404).json({ error: 'Document file path is invalid' });
    }

    const { data: fileBlob, error: fileError } = await adminClient
      .storage
      .from(DOCUMENT_BUCKET)
      .download(objectPath);

    if (fileError || !fileBlob) {
      return res.status(404).json({ error: 'Document file not found' });
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const downloadName = parseDownloadFileName(documentRow, objectPath);
    const contentType = documentRow.mime_type || fileBlob.type || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName.replace(/"/g, '')}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
