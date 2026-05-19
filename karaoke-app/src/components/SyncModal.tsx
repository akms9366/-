import { useState } from 'react';
import {
  getToken, setToken, getGistId, setGistId,
  verifyToken, loadFromGist, saveToGist,
} from '../gistSync';
import type { CloudData } from '../gistSync';

interface Props {
  currentData: CloudData;
  onImport: (data: CloudData) => void;
  onClose: () => void;
}

type Step = 'menu' | 'setup' | 'loading';

export function SyncModal({ currentData, onImport, onClose }: Props) {
  const [step, setStep] = useState<Step>('menu');
  const [token, setTokenInput] = useState(getToken());
  const [gistId, setGistIdInput] = useState(getGistId());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const hasToken = !!getToken();
  const hasGist = !!getGistId();

  async function handleSave() {
    setStep('loading');
    setError('');
    try {
      const ok = await verifyToken(token.trim());
      if (!ok) throw new Error('トークンが無効です。スコープ「gist」で作成してください。');
      setToken(token.trim());
      if (gistId.trim()) setGistId(gistId.trim());
      const id = await saveToGist({ ...currentData, savedAt: new Date().toISOString() });
      setStatus(`保存完了！ Gist ID: ${id}`);
      setStep('menu');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
      setStep('setup');
    }
  }

  async function handleLoad() {
    setStep('loading');
    setError('');
    try {
      const ok = await verifyToken(token.trim());
      if (!ok) throw new Error('トークンが無効です。');
      setToken(token.trim());
      if (gistId.trim()) setGistId(gistId.trim());
      const data = await loadFromGist();
      if (!data) throw new Error('Gistからデータを取得できませんでした。GistIDを確認してください。');
      onImport(data);
      setStatus(`読み込み完了！ ${data.songs.length}曲・${data.sessions.length}セッション`);
      setStep('menu');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました');
      setStep('setup');
    }
  }

  async function handleQuickSave() {
    if (!hasToken) { setStep('setup'); return; }
    setStep('loading');
    setError('');
    try {
      await saveToGist({ ...currentData, savedAt: new Date().toISOString() });
      setStatus('クラウドに保存しました');
      setStep('menu');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
      setStep('menu');
    }
  }

  async function handleQuickLoad() {
    if (!hasToken) { setStep('setup'); return; }
    setStep('loading');
    setError('');
    try {
      const data = await loadFromGist();
      if (!data) throw new Error('データがありません');
      onImport(data);
      setStatus(`読み込み完了！ ${data.songs.length}曲・${data.sessions.length}セッション`);
      setStep('menu');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました');
      setStep('menu');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">☁️ クラウド同期</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {step === 'loading' && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-3xl mb-2 animate-pulse">☁️</div>
            <p className="text-sm">通信中...</p>
          </div>
        )}

        {step === 'menu' && (
          <div className="p-4 space-y-3">
            {status && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
                {status}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleQuickSave}
                className="flex flex-col items-center bg-pink-50 border border-pink-200 rounded-xl py-4 hover:bg-pink-100 transition-colors"
              >
                <span className="text-2xl mb-1">📤</span>
                <span className="text-sm font-medium text-pink-700">クラウドに保存</span>
                <span className="text-xs text-pink-400 mt-0.5">
                  {currentData.songs.length}曲・{currentData.sessions.length}件
                </span>
              </button>
              <button
                onClick={handleQuickLoad}
                className="flex flex-col items-center bg-blue-50 border border-blue-200 rounded-xl py-4 hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl mb-1">📥</span>
                <span className="text-sm font-medium text-blue-700">クラウドから読込</span>
                <span className="text-xs text-blue-400 mt-0.5">別端末のデータも取得</span>
              </button>
            </div>

            <button
              onClick={() => { setStep('setup'); setError(''); }}
              className="w-full text-sm text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
            >
              ⚙️ {hasToken ? '設定変更' : '初回設定（必要）'}
              {!hasToken && <span className="ml-1 text-red-500 font-medium">← まずこちら</span>}
            </button>

            {hasGist && (
              <p className="text-xs text-center text-gray-400">
                Gist ID: {getGistId().slice(0, 8)}...
              </p>
            )}
          </div>
        )}

        {step === 'setup' && (
          <div className="p-4 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              <p className="font-bold">📋 GitHub トークンの取得方法</p>
              <p>1. github.com → Settings → Developer settings</p>
              <p>2. Personal access tokens → Tokens (classic)</p>
              <p>3. Generate new token → スコープ「gist」だけにチェック</p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Personal Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gist ID <span className="text-gray-400 font-normal">（2台目以降は入力）</span>
              </label>
              <input
                value={gistId}
                onChange={(e) => setGistIdInput(e.target.value)}
                placeholder="初回は空欄でOK（自動作成されます）"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSave}
                disabled={!token.trim()}
                className="bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-40 transition-colors"
              >
                保存してアップロード
              </button>
              <button
                onClick={handleLoad}
                disabled={!token.trim()}
                className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                設定してダウンロード
              </button>
            </div>
            <button
              onClick={() => { setStep('menu'); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
