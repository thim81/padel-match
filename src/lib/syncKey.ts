const TOKEN_PREFIX = 'v1';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string | null {
  let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }

  try {
    const bytes = base64ToBytes(normalized);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function generateTeamSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function createSyncToken(teamName: string, teamSecret: string): string {
  return `${TOKEN_PREFIX}.${toBase64Url(teamName)}.${teamSecret}`;
}

export function parseSyncToken(syncToken: string): { teamName: string; teamSecret: string } | null {
  const parts = syncToken.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) {
    return null;
  }

  const teamName = fromBase64Url(parts[1]);
  const teamSecret = parts[2]?.trim();

  if (!teamName || !teamSecret) {
    return null;
  }

  return {
    teamName: teamName.trim(),
    teamSecret
  };
}
