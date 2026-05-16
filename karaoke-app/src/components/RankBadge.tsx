import type { Rank } from '../types';

const config: Record<Rank, { label: string; className: string }> = {
  A: { label: 'Aランク', className: 'bg-green-100 text-green-800 border-green-300' },
  B: { label: 'Bランク', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  C: { label: 'Cランク', className: 'bg-red-100 text-red-800 border-red-300' },
};

export function RankBadge({ rank }: { rank: Rank }) {
  const { label, className } = config[rank];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${className}`}>
      {label}
    </span>
  );
}

export const RANK_DESCRIPTIONS: Record<Rank, string> = {
  A: '歌いやすい',
  B: '普通',
  C: '難しい',
};
