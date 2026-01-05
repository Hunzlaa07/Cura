import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  applicantName: string;
  jobTitle?: string;
  caseStudyTitle?: string;
  score?: number;
  recommendation?: string;
  aiProbability?: number | null;
  integrityScore?: number | null;
  onBack?: () => void;
}

export default function ResultsHeader({
  applicantName,
  jobTitle,
  caseStudyTitle,
  score,
  recommendation,
  aiProbability,
  integrityScore,
  onBack,
}: Props) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-merit-dark">{applicantName}</h1>
          <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
          {caseStudyTitle && <p className="text-xs text-gray-500 mt-1">{caseStudyTitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          {typeof score === 'number' && (
            <div className="text-sm text-gray-600">Overall</div>
          )}
          <div className="text-lg font-bold text-gray-900">{typeof score === 'number' ? `${score}/100` : '—'}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button>Hire</Button>
          <Button variant="outline">Interview</Button>
          <Button variant="ghost">Flag</Button>
        </div>
      </div>
    </div>
  );
}
