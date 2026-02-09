const SYNC_QUERY_PARAM = 'sync';

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string | null {
  let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }

  try {
    return atob(normalized);
  } catch {
    return null;
  }
}

export function createSyncShareLink(syncToken: string): string {
  const url = new URL(window.location.origin);
  url.searchParams.set(SYNC_QUERY_PARAM, toBase64Url(syncToken));
  return url.toString();
}

export function getSyncTokenFromUrl(urlString: string): string | null {
  const url = new URL(urlString);
  const encoded = url.searchParams.get(SYNC_QUERY_PARAM);
  if (!encoded) return null;

  const decoded = fromBase64Url(encoded);
  if (!decoded) return null;

  const trimmed = decoded.trim();
  return trimmed ? trimmed : null;
}

export function removeSyncTokenFromCurrentUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SYNC_QUERY_PARAM)) return;

  url.searchParams.delete(SYNC_QUERY_PARAM);
  const next =
    url.pathname +
    (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') +
    url.hash;

  window.history.replaceState({}, '', next);
}
