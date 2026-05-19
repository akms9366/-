import { useState } from 'react';
import { SongList } from './components/SongList';
import { SessionList } from './components/SessionList';
import { SyncModal } from './components/SyncModal';
import { store } from './store';
import type { CloudData } from './gistSync';

type Tab = 'songs' | 'sessions';

export default function App() {
  const [tab, setTab] = useState<Tab>('songs');
  const [showSync, setShowSync] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  function getCurrentData(): CloudData {
    return {
      songs: store.getSongs(),
      sessions: store.getSessions(),
      entries: store.getEntries(),
      savedAt: new Date().toISOString(),
    };
  }

  function handleImport(data: CloudData) {
    store.saveSongs(data.songs);
    store.saveSessions(data.sessions);
    store.saveEntries(data.entries);
    setDataVersion((v) => v + 1);
    setShowSync(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-pink-600 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎤</span>
            <h1 className="text-xl font-bold tracking-wide">カラオケ記録帳</h1>
          </div>
          <button
            onClick={() => setShowSync(true)}
            className="text-pink-100 hover:text-white text-sm flex items-center gap-1 transition-colors"
            title="クラウド同期"
          >
            <span className="text-lg">☁️</span>
          </button>
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

      <main key={dataVersion} className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'songs' ? <SongList /> : <SessionList />}
      </main>

      {showSync && (
        <SyncModal
          currentData={getCurrentData()}
          onImport={handleImport}
          onClose={() => setShowSync(false)}
        />
      )}
    </div>
  );
}
