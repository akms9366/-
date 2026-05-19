import type { Song, Session, HistoryEntry } from './types';

export interface CloudData {
  songs: Song[];
  sessions: Session[];
  entries: HistoryEntry[];
  savedAt: string;
}

const GIST_FILENAME = 'karaoke-records.json';
const GIST_DESCRIPTION = 'カラオケ記録帳データ';
const TOKEN_KEY = 'karaoke_github_token';
const GIST_ID_KEY = 'karaoke_gist_id';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getGistId(): string {
  return localStorage.getItem(GIST_ID_KEY) ?? '';
}
export function setGistId(id: string) {
  localStorage.setItem(GIST_ID_KEY, id);
}

async function ghFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function loadFromGist(): Promise<CloudData | null> {
  const gistId = getGistId();
  if (!gistId || !getToken()) return null;
  const res = await ghFetch(`/gists/${gistId}`);
  if (!res.ok) return null;
  const gist = await res.json();
  const content = gist.files?.[GIST_FILENAME]?.content;
  if (!content) return null;
  return JSON.parse(content) as CloudData;
}

export async function saveToGist(data: CloudData): Promise<string> {
  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) },
    },
  });

  const gistId = getGistId();
  if (gistId) {
    const res = await ghFetch(`/gists/${gistId}`, { method: 'PATCH', body });
    if (!res.ok) throw new Error(`Gist更新失敗: ${res.status}`);
    return gistId;
  } else {
    const res = await ghFetch('/gists', { method: 'POST', body });
    if (!res.ok) throw new Error(`Gist作成失敗: ${res.status}`);
    const gist = await res.json();
    setGistId(gist.id);
    return gist.id as string;
  }
}

export async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.ok;
}
