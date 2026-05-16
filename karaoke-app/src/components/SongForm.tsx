import { useState } from 'react';
import type { Song, Rank } from '../types';
import { newId } from '../store';
import { RANK_DESCRIPTIONS } from './RankBadge';

interface Props {
  initial?: Song;
  onSave: (song: Song) => void;
  onCancel: () => void;
}

export function SongForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [artist, setArtist] = useState(initial?.artist ?? '');
  const [rank, setRank] = useState<Rank>(initial?.rank ?? 'B');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: initial?.id ?? newId(),
      title: title.trim(),
      artist: artist.trim(),
      rank,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          曲名 <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 夜に駆ける"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          アーティスト
        </label>
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="例: YOASOBI"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          歌いやすさランク
        </label>
        <div className="flex gap-3">
          {(['A', 'B', 'C'] as Rank[]).map((r) => (
            <label
              key={r}
              className={`flex-1 flex flex-col items-center border rounded-lg py-2 cursor-pointer transition-colors ${
                rank === r
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <input
                type="radio"
                name="rank"
                value={r}
                checked={rank === r}
                onChange={() => setRank(r)}
                className="sr-only"
              />
              <span className="text-lg font-bold">{r}</span>
              <span className="text-xs text-gray-500">{RANK_DESCRIPTIONS[r]}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
