import { useState } from 'react';
import type { Session, Song, HistoryEntry, Rank } from '../types';
import { store, newId } from '../store';

interface Props {
  session: Session;
  songs: Song[];
  existingEntries: HistoryEntry[];
  onImport: (entries: HistoryEntry[]) => void;
  onClose: () => void;
}

interface ParsedRow {
  title: string;
  artist: string;
  rank: Rank;
  score: number | null;
  memo: string;
  matchedSong: Song | null;
  willCreateSong: boolean;
}

const FORMAT_HINT = `以下の形式で1行ずつ入力してください：
曲名,アーティスト,ランク(A/B/C),スコア,メモ

例：
夜に駆ける,YOASOBI,A,87,サビが難しい
Dynamite,BTS,B,,英語発音に注意
紅蓮華,LiSA,C,91`;

function parseRank(s: string): Rank {
  const r = s.trim().toUpperCase();
  if (r === 'A' || r === 'B' || r === 'C') return r;
  return 'B';
}

function parseRows(text: string, songs: Song[]): ParsedRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//'))
    .map((line) => {
      const parts = line.split(',');
      const title = (parts[0] ?? '').trim();
      const artist = (parts[1] ?? '').trim();
      const rank = parseRank(parts[2] ?? 'B');
      const scoreRaw = (parts[3] ?? '').trim();
      const score = scoreRaw ? parseInt(scoreRaw, 10) : null;
      const memo = (parts[4] ?? '').trim();

      const matchedSong =
        songs.find(
          (s) =>
            s.title === title &&
            (artist === '' || s.artist === artist)
        ) ?? null;

      return {
        title,
        artist,
        rank,
        score: score !== null && !isNaN(score) ? score : null,
        memo,
        matchedSong,
        willCreateSong: !matchedSong && title !== '',
      };
    })
    .filter((r) => r.title !== '');
}

export function ImportModal({ session, songs: initialSongs, existingEntries, onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [songs, setSongs] = useState<Song[]>(initialSongs);

  function handlePreview() {
    const rows = parseRows(text, songs);
    setPreview(rows);
  }

  function handleImport() {
    if (!preview) return;

    const allSongs = store.getSongs();
    const newSongs: Song[] = [];
    const newEntries: HistoryEntry[] = [];

    preview.forEach((row) => {
      let song = row.matchedSong;

      if (!song && row.willCreateSong) {
        song = {
          id: newId(),
          title: row.title,
          artist: row.artist,
          rank: row.rank,
          createdAt: new Date().toISOString(),
        };
        newSongs.push(song);
        allSongs.push(song);
      }

      if (song) {
        const alreadyExists = existingEntries.some((e) => e.songId === song!.id);
        if (!alreadyExists) {
          newEntries.push({
            id: newId(),
            songId: song.id,
            sessionId: session.id,
            score: row.score,
            memo: row.memo,
          });
        }
      }
    });

    if (newSongs.length > 0) {
      store.saveSongs(allSongs);
      setSongs(allSongs);
    }

    onImport(newEntries);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">テキストから取り込む</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {!preview ? (
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <p className="text-xs text-gray-500 whitespace-pre-line bg-gray-50 rounded-lg p-3 border border-gray-200">
              {FORMAT_HINT}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="ここにテキストを貼り付けてください..."
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={!text.trim()}
                className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-40 transition-colors"
              >
                プレビュー確認
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <p className="text-sm text-gray-600">
              {preview.length}件を取り込みます。新規曲は自動で登録されます。
            </p>
            <div className="space-y-2">
              {preview.map((row, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm border ${
                    row.willCreateSong
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{row.title}</span>
                    {row.artist && <span className="text-gray-500">/ {row.artist}</span>}
                    <span className="ml-auto text-xs font-bold text-gray-600">ランク{row.rank}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                    {row.score !== null && <span>{row.score}点</span>}
                    {row.memo && <span>{row.memo}</span>}
                    {row.willCreateSong && (
                      <span className="text-blue-600 font-medium">★ 新規登録</span>
                    )}
                    {row.matchedSong && (
                      <span className="text-green-600 font-medium">✓ 既存曲</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleImport}
                className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
              >
                取り込む
              </button>
              <button
                onClick={() => setPreview(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                修正する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
