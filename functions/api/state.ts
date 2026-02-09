interface Env {
  PADEL_MATCHES_KV: KVNamespace;
}

const STORAGE_KEY_PREFIX = 'padel-matches-state';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-auth-token',
};

const getAuthToken = (request: Request) => {
  const header = request.headers.get('Authorization');
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return request.headers.get('x-auth-token') || '';
};

const tokenEncoder = new TextEncoder();

async function deriveStorageKeyFromToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', tokenEncoder.encode(token));
  const digestArray = Array.from(new Uint8Array(digest));
  const hex = digestArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${STORAGE_KEY_PREFIX}:${hex}`;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const token = getAuthToken(request);
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const storageKey = await deriveStorageKeyFromToken(token);
  const stored = await env.PADEL_MATCHES_KV.get(storageKey);
  if (!stored) {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return new Response(stored, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const token = getAuthToken(request);
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const storageKey = await deriveStorageKeyFromToken(token);
  await env.PADEL_MATCHES_KV.put(storageKey, JSON.stringify(body));

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
