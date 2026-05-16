import { useState } from 'react';
import type { Song, HistoryEntry } from '../types';
import { store } from '../store';
import { RankBadge } from './RankBadge';
import { SongForm } from './SongForm';
import { HistoryEntryForm } from './HistoryEntryForm';

interface Props {
  song: Song;
  onBack: () => void;
  onEdit: (updated: Song) => void;
  onDelete: () => void;
}

export function SongDetail({ song, onBack, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    store.getEntries().filter((e) => e.songId === song.id)
  );
  const sessions = store.getSessions();

  function sessionDate(sessionId: string) {
    const s = sessions.find((s) => s.id === sessionId);
    return s ? s.date : '—';
  }

  function sessionVenue(sessionId: string) {
    const s = sessions.find((s) => s.id === sessionId);
    return s?.venue || '';
  }

  function handleSaveEntry(entry: HistoryEntry) {
    const all = store.getEntries();
    const next = all.some((e) => e.id === entry.id)
      ? all.map((e) => (e.id === entry.id ? entry : e))
      : [...all, entry];
    store.saveEntries(next);
    setEntries(next.filter((e) => e.songId === song.id));
    setAddingEntry(false);
  }

  function handleDeleteEntry(id: string) {
    if (!confirm('この記録を削除しますか？')) return;
    const all = store.getEntries().filter((e) => e.id !== id);
    store.saveEntries(all);
    setEntries(all.filter((e) => e.songId === song.id));
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const da = sessionDate(a.sessionId);
    const db = sessionDate(b.sessionId);
    return db.localeCompare(da);
  });

  if (editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← 戻る
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">曲を編集</h2>
          <SongForm
            initial={song}
            onSave={(updated) => { onEdit(updated); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← 曲一覧に戻る
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{song.title}</h2>
            {song.artist && <p className="text-sm text-gray-500">{song.artist}</p>}
            <div className="mt-2">
              <RankBadge rank={song.rank} />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              編集
            </button>
            <button
              onClick={onDelete}
              className="text-xs border border-red-300 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-700 text-sm">歌った記録</h3>
          <button
            onClick={() => setAddingEntry(true)}
            className="text-xs bg-pink-600 text-white rounded-lg px-3 py-1.5 hover:bg-pink-700 transition-colors"
          >
            ＋ 記録を追加
          </button>
        </div>

        {addingEntry && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-3">
            <HistoryEntryForm
              songId={song.id}
              sessions={sessions}
              onSave={handleSaveEntry}
              onCancel={() => setAddingEntry(false)}
            />
          </div>
        )}

        {sortedEntries.length === 0 && !addingEntry && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">まだ記録がありません</p>
          </div>
        )}

        <div className="space-y-2">
          {sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700">
                    {sessionDate(entry.sessionId)}
                    {sessionVenue(entry.sessionId) && (
                      <span className="text-gray-400 font-normal ml-2">
                        {sessionVenue(entry.sessionId)}
                      </span>
                    )}
                  </p>
                  {entry.score !== null && (
                    <p className="text-sm text-pink-600 font-bold">{entry.score}点</p>
                  )}
                  {entry.memo && (
                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{entry.memo}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
