import React from 'react';
import { TrendingUp, Award, TrendingDown } from 'lucide-react';

interface Props {
  result: any;
  avgProb?: number | null;
}

export default function ScoreCards({ result, avgProb }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-merit-green">
        <p className="text-sm text-gray-600 mb-2 font-medium">Overall Score</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-gray-900">{result?.score ?? '—'}</span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-red-500">
        <p className="text-sm text-red-600 mb-2 font-medium flex items-center gap-2">🤖 AI Probability</p>
        <div className="text-xl font-bold text-red-900">{avgProb !== undefined && avgProb !== null ? (avgProb > 0 ? `${Number(avgProb).toFixed(1)}%` : 'No AI detected') : '—'}</div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-yellow-400">
        <p className="text-sm text-yellow-700 mb-2 font-medium">Integrity</p>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-gray-900">{result?.session?.integrityScore ?? 'N/A'}</div>
          <div className="text-xs text-gray-500">/100</div>
        </div>
      </div>
    </div>
  );
}
