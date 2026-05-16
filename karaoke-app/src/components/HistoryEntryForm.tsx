import { useState } from 'react';
import type { HistoryEntry, Session } from '../types';
import { newId } from '../store';

interface Props {
  songId: string;
  sessions: Session[];
  initial?: HistoryEntry;
  onSave: (entry: HistoryEntry) => void;
  onCancel: () => void;
}

export function HistoryEntryForm({ songId, sessions, initial, onSave, onCancel }: Props) {
  const [sessionId, setSessionId] = useState(initial?.sessionId ?? sessions[0]?.id ?? '');
  const [score, setScore] = useState(initial?.score?.toString() ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    const parsed = score.trim() ? parseInt(score, 10) : null;
    onSave({
      id: initial?.id ?? newId(),
      songId,
      sessionId,
      score: parsed !== null && !isNaN(parsed) ? parsed : null,
      memo: memo.trim(),
    });
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        先に「セッション」タブでカラオケセッションを作成してください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          セッション <span className="text-red-500">*</span>
        </label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          required
        >
          {sorted.map((s) => (
            <option key={s.id} value={s.id}>
              {s.date}{s.venue ? ` (${s.venue})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">スコア</label>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="例: 87"
          min={0}
          max={100}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="一口メモ（例: サビが高い、転調に注意）"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
        />
      </div>
      <div className="flex gap-2">
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
