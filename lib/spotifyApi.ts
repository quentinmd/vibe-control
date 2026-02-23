export interface SpotifyTrackResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover_url?: string;
  preview_url?: string;
  spotify_id: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

function getSpotifyCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CREDENTIALS_MISSING");
  }

  return { clientId, clientSecret };
}

function getSpotifyRedirectUri() {
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("SPOTIFY_REDIRECT_URI_MISSING");
  }
  return redirectUri;
}

export function getSpotifyAuthorizeUrl(state: string): string {
  const { clientId } = getSpotifyCredentials();
  const redirectUri = getSpotifyRedirectUri();
  const scope = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state",
    "user-read-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCodeForTokens(code: string) {
  const { clientId, clientSecret } = getSpotifyCredentials();
  const redirectUri = getSpotifyRedirectUri();

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `SPOTIFY_TOKEN_EXCHANGE_FAILED:${response.status}:${errorBody}`,
    );
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function refreshSpotifyAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getSpotifyCredentials();

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `SPOTIFY_TOKEN_REFRESH_FAILED:${response.status}:${errorBody}`,
    );
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function getSpotifyCurrentUser(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`SPOTIFY_ME_FAILED:${response.status}`);
  }

  return response.json() as Promise<{ id: string }>;
}

export async function searchSpotifyTracks(
  query: string,
  accessToken: string,
): Promise<SpotifyTrackResult[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q: query,
      type: "track",
      limit: "10",
      market: "FR",
    }).toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`SPOTIFY_SEARCH_FAILED:${response.status}:${errorBody}`);
  }

  const data = await response.json();

  const tracks = data?.tracks?.items ?? [];

  return tracks.map((track: any) => ({
    id: track.id,
    title: track.name || "Sans titre",
    artist:
      track.artists?.map((artist: any) => artist.name).join(", ") ||
      "Artiste inconnu",
    album: track.album?.name || undefined,
    cover_url: track.album?.images?.[0]?.url || undefined,
    preview_url: track.preview_url || undefined,
    spotify_id: track.id,
  }));
}
