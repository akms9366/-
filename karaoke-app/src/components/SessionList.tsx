import { useState } from 'react';
import type { Session } from '../types';
import { store, newId } from '../store';
import { SessionDetail } from './SessionDetail';

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>(() => store.getSessions());
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newVenue, setNewVenue] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const session: Session = {
      id: newId(),
      date: newDate,
      venue: newVenue.trim(),
      notes: newNotes.trim(),
    };
    const next = [session, ...sessions].sort((a, b) => b.date.localeCompare(a.date));
    store.saveSessions(next);
    setSessions(next);
    setAdding(false);
    setNewVenue('');
    setNewNotes('');
  }

  function handleDelete(id: string) {
    if (!confirm('このセッションを削除しますか？')) return;
    const next = sessions.filter((s) => s.id !== id);
    store.saveSessions(next);
    // Remove related entries
    const entries = store.getEntries().filter((e) => e.sessionId !== id);
    store.saveEntries(entries);
    setSessions(next);
    if (selectedId === id) setSelectedId(null);
  }

  const selected = sessions.find((s) => s.id === selectedId);

  if (selected) {
    return (
      <SessionDetail
        session={selected}
        onBack={() => setSelectedId(null)}
        onDelete={() => { handleDelete(selected.id); setSelectedId(null); }}
      />
    );
  }

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setAdding(true)}
          className="bg-pink-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          ＋ セッション追加
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
        >
          <h2 className="text-sm font-bold text-gray-700">新しいセッション</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会場名</label>
            <input
              value={newVenue}
              onChange={(e) => setNewVenue(e.target.value)}
              placeholder="例: ビッグエコー渋谷店"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="例: ひとりカラオケ"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
            >
              作成
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !adding && (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-sm">セッションがまだありません</p>
          <p className="text-xs mt-1">カラオケに行ったらセッションを作成しましょう</p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((session) => {
          const count = store.getEntries().filter((e) => e.sessionId === session.id).length;
          return (
            <button
              key={session.id}
              onClick={() => setSelectedId(session.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-pink-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{session.date}</p>
                  {session.venue && (
                    <p className="text-sm text-gray-500">{session.venue}</p>
                  )}
                  {session.notes && (
                    <p className="text-xs text-gray-400">{session.notes}</p>
                  )}
                </div>
                <span className="text-xs bg-pink-100 text-pink-700 rounded-full px-2 py-0.5 shrink-0">
                  {count}曲
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
