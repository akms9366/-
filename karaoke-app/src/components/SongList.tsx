import { useState } from 'react';
import type { Song } from '../types';
import { store } from '../store';
import { RankBadge } from './RankBadge';
import { SongForm } from './SongForm';
import { SongDetail } from './SongDetail';

export function SongList() {
  const [songs, setSongs] = useState<Song[]>(() => store.getSongs());
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  function handleSave(song: Song) {
    const next = songs.some((s) => s.id === song.id)
      ? songs.map((s) => (s.id === song.id ? song : s))
      : [...songs, song];
    store.saveSongs(next);
    setSongs(next);
    setAdding(false);
  }

  function handleDelete(id: string) {
    if (!confirm('この曲を削除しますか？履歴も消えます。')) return;
    const next = songs.filter((s) => s.id !== id);
    store.saveSongs(next);
    // Remove related entries
    const entries = store.getEntries().filter((e) => e.songId !== id);
    store.saveEntries(entries);
    setSongs(next);
    if (selectedId === id) setSelectedId(null);
  }

  const selected = songs.find((s) => s.id === selectedId);

  const filtered = songs
    .filter(
      (s) =>
        s.title.includes(search) ||
        s.artist.includes(search)
    )
    .sort((a, b) => a.rank.localeCompare(b.rank) || a.title.localeCompare(b.title));

  if (selected) {
    return (
      <SongDetail
        song={selected}
        onBack={() => setSelectedId(null)}
        onEdit={(updated) => handleSave(updated)}
        onDelete={() => handleDelete(selected.id)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="曲名・アーティストで検索"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          onClick={() => setAdding(true)}
          className="bg-pink-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors whitespace-nowrap"
        >
          ＋ 追加
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">新しい曲を追加</h2>
          <SongForm onSave={handleSave} onCancel={() => setAdding(false)} />
        </div>
      )}

      {filtered.length === 0 && !adding && (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-2">🎵</div>
          <p className="text-sm">曲がまだありません</p>
          <p className="text-xs mt-1">「＋ 追加」から登録しましょう</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((song) => (
          <button
            key={song.id}
            onClick={() => setSelectedId(song.id)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-pink-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{song.title}</p>
                {song.artist && (
                  <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                )}
              </div>
              <RankBadge rank={song.rank} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
