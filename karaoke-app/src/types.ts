export type Rank = 'A' | 'B' | 'C';

export interface Song {
  id: string;
  title: string;
  artist: string;
  rank: Rank;
  createdAt: string;
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  venue: string;
  notes: string;
}

export interface HistoryEntry {
  id: string;
  songId: string;
  sessionId: string;
  score: number | null;
  memo: string;
}
