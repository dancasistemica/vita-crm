export function getRecoveryContextFromUrl(location: Location = window.location) {
  const searchParams = new URLSearchParams(location.search);
  const rawHash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const hashIsPath = rawHash.startsWith('/');
  const hashQuery = hashIsPath ? rawHash.split('?')[1] ?? '' : rawHash;
  const hashParams = new URLSearchParams(hashQuery);

  const type = searchParams.get('type') ?? hashParams.get('type');
  const code = searchParams.get('code') ?? hashParams.get('code');
  const hasTokenHash = !hashIsPath && (hashParams.has('access_token') || hashParams.has('refresh_token'));
  const hashResetPath = rawHash.startsWith('/reset-password') ? rawHash : null;

  return {
    code,
    hasTokenHash,
    hashParams,
    hashResetPath,
    rawHash,
    searchParams,
    type,
  };
}

export function getNormalizedRecoveryRoute(location: Location = window.location): string | null {
  if (location.pathname === '/reset-password') {
    return null;
  }

  const { code, hasTokenHash, hashResetPath, type, rawHash } = getRecoveryContextFromUrl(location);

  // If hash contains /reset-password path (e.g. from HashRouter-style links)
  if (hashResetPath) {
    return hashResetPath;
  }

  if (type !== 'recovery' && !hasTokenHash) {
    return null;
  }

  // Build clean /reset-password URL, preserving tokens in hash for Supabase client
  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (type) params.set('type', type);
  const query = params.toString();

  // Keep the original hash so Supabase can process access_token/refresh_token
  const hashSuffix = hasTokenHash && location.hash ? location.hash : '';

  return `/reset-password${query ? `?${query}` : ''}${hashSuffix}`;
}
