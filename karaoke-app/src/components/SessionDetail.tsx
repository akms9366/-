import { useState } from 'react';
import type { Session, HistoryEntry, Song } from '../types';
import { store } from '../store';
import { RankBadge } from './RankBadge';
import { ImportModal } from './ImportModal';

interface Props {
  session: Session;
  onBack: () => void;
  onDelete: () => void;
}

export function SessionDetail({ session, onBack, onDelete }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    store.getEntries().filter((e) => e.sessionId === session.id)
  );
  const [songs] = useState<Song[]>(() => store.getSongs());
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);

  function songById(id: string): Song | undefined {
    return songs.find((s) => s.id === id);
  }

  function buildExportText(): string {
    const lines: string[] = [];
    lines.push(`【カラオケ記録】${session.date}`);
    if (session.venue) lines.push(`📍 ${session.venue}`);
    if (session.notes) lines.push(`📝 ${session.notes}`);
    lines.push('');

    const sorted = [...entries].sort((a, b) => {
      const sa = songById(a.songId);
      const sb = songById(b.songId);
      if (!sa || !sb) return 0;
      return sa.rank.localeCompare(sb.rank) || sa.title.localeCompare(sb.title);
    });

    sorted.forEach((entry, i) => {
      const song = songById(entry.songId);
      if (!song) return;
      lines.push(`${i + 1}. 🎵 ${song.title}${song.artist ? ` / ${song.artist}` : ''}`);
      const details: string[] = [`ランク: ${song.rank}`];
      if (entry.score !== null) details.push(`スコア: ${entry.score}点`);
      lines.push(`   ${details.join(' | ')}`);
      if (entry.memo) lines.push(`   💬 ${entry.memo}`);
    });

    lines.push('');
    lines.push(`合計: ${sorted.length}曲`);
    return lines.join('\n');
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildExportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleImported(newEntries: HistoryEntry[]) {
    const all = store.getEntries();
    const updated = [...all, ...newEntries];
    store.saveEntries(updated);
    setEntries(updated.filter((e) => e.sessionId === session.id));
    setImporting(false);
  }

  const sorted = [...entries].sort((a, b) => {
    const sa = songById(a.songId);
    const sb = songById(b.songId);
    if (!sa || !sb) return 0;
    return sa.rank.localeCompare(sb.rank) || sa.title.localeCompare(sb.title);
  });

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← セッション一覧に戻る
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{session.date}</h2>
            {session.venue && <p className="text-sm text-gray-600">📍 {session.venue}</p>}
            {session.notes && <p className="text-xs text-gray-400 mt-0.5">{session.notes}</p>}
          </div>
          <button
            onClick={onDelete}
            className="text-xs border border-red-300 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors shrink-0"
          >
            削除
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 rounded-lg py-2 text-sm font-medium border transition-colors ${
            copied
              ? 'bg-green-50 border-green-400 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-pink-400 hover:text-pink-600'
          }`}
        >
          {copied ? '✓ コピーしました！' : '📋 テキストでコピー'}
        </button>
        <button
          onClick={() => setImporting(true)}
          className="flex-1 rounded-lg py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:border-pink-400 hover:text-pink-600 bg-white transition-colors"
        >
          📥 テキストから取り込む
        </button>
      </div>

      {importing && (
        <ImportModal
          session={session}
          songs={songs}
          existingEntries={entries}
          onImport={handleImported}
          onClose={() => setImporting(false)}
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-700 text-sm">
            歌った曲 <span className="text-gray-400">({entries.length}曲)</span>
          </h3>
        </div>

        {sorted.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">記録がありません</p>
            <p className="text-xs mt-1">曲ページから「記録を追加」するか、テキストから取り込みができます</p>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map((entry) => {
            const song = songById(entry.songId);
            if (!song) return null;
            return (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{song.title}</p>
                      <RankBadge rank={song.rank} />
                    </div>
                    {song.artist && (
                      <p className="text-sm text-gray-500">{song.artist}</p>
                    )}
                    {entry.score !== null && (
                      <p className="text-sm text-pink-600 font-bold mt-1">{entry.score}点</p>
                    )}
                    {entry.memo && (
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{entry.memo}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
