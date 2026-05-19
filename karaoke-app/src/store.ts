import type { Song, Session, HistoryEntry } from './types';

const KEYS = {
  songs: 'karaoke_songs',
  sessions: 'karaoke_sessions',
  entries: 'karaoke_entries',
};

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  getSongs: (): Song[] => load<Song>(KEYS.songs),
  saveSongs: (songs: Song[]) => save(KEYS.songs, songs),

  getSessions: (): Session[] => load<Session>(KEYS.sessions),
  saveSessions: (sessions: Session[]) => save(KEYS.sessions, sessions),

  getEntries: (): HistoryEntry[] => load<HistoryEntry>(KEYS.entries),
  saveEntries: (entries: HistoryEntry[]) => save(KEYS.entries, entries),
};

export function newId(): string {
  return crypto.randomUUID();
}
