import { useState } from 'react';
import { SongList } from './components/SongList';
import { SessionList } from './components/SessionList';

type Tab = 'songs' | 'sessions';

export default function App() {
  const [tab, setTab] = useState<Tab>('songs');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-pink-600 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🎤</span>
          <h1 className="text-xl font-bold tracking-wide">カラオケ記録帳</h1>
        </div>
        <nav className="max-w-2xl mx-auto px-4 flex gap-1 pb-2">
          <button
            onClick={() => setTab('songs')}
            className={`px-4 py-1.5 rounded-t text-sm font-medium transition-colors ${
              tab === 'songs'
                ? 'bg-white text-pink-600'
                : 'text-pink-100 hover:text-white'
            }`}
          >
            🎵 曲管理
          </button>
          <button
            onClick={() => setTab('sessions')}
            className={`px-4 py-1.5 rounded-t text-sm font-medium transition-colors ${
              tab === 'sessions'
                ? 'bg-white text-pink-600'
                : 'text-pink-100 hover:text-white'
            }`}
          >
            📅 セッション
          </button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'songs' ? <SongList /> : <SessionList />}
      </main>
    </div>
  );
}
