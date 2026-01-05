import React, { useState } from 'react';
import { Video } from 'lucide-react';

interface CustomAnswer { question_id: number; type: string; answer: any }

interface Props {
  questionScores?: any[];
  customQuestionScores?: any[];
  questions?: string[];
  answers?: any[];
  customAnswers?: CustomAnswer[];
  manualScores?: Record<number, number>;
  setManualScores?: (s: Record<number, number>) => void;
  manualFeedback?: Record<number, string>;
  setManualFeedback?: (f: Record<number, string>) => void;
  editingScore?: number | null;
  setEditingScore?: (id: number | null) => void;
  savingScore?: number | null;
  onSaveManualScore?: (questionId: number) => void;
}

const extractAnswerContent = (answer: any): string => {
  if (typeof answer === 'string') return answer;
  if (answer && typeof answer === 'object' && 'content' in answer) return answer.content || '';
  return '';
};

// Map internal question types to readable labels
const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice';
    case 'coding': return 'Code Challenge';
    case 'sql': return 'SQL Query';
    case 'video': return 'Video Response';
    case 'video_response': return 'Video Response';
    case 'excel': return 'Excel Task';
    case 'writing': return 'Writing Exercise';
    case 'situational_judgment': return 'Situational Judgment';
    case 'open_ended': return 'Open Ended';
    default: return type;
  }
};

const getVideoResponseUrl = (customAnswers: CustomAnswer[] | undefined, questionId: number): string | null => {
  if (!customAnswers) return null;
  const videoAnswer = customAnswers.find(a => a.question_id === questionId);
  if (!videoAnswer) return null;
  const answer = videoAnswer.answer;
  if (typeof answer === 'object' && answer?.type === 'video' && answer?.url) return answer.url;
  if (typeof answer === 'string' && answer.includes('/uploads/')) return answer;
  return null;
};

export default function QuestionsList({
  questionScores = [],
  customQuestionScores = [],
  questions = [],
  answers = [],
  customAnswers = [],
  manualScores,
  setManualScores,
  manualFeedback,
  setManualFeedback,
  editingScore,
  setEditingScore,
  savingScore,
  onSaveManualScore,
}: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Build a unified list: questions first, then custom modules
  const items: any[] = [];

  // Show custom modules first (modules are primary now)
  if (customQuestionScores && customQuestionScores.length > 0) {
    customQuestionScores.forEach((cq: any, idx: number) => {
      const customAns = customAnswers?.find(a => (a.question_id === cq.question_id) || ((a as any).questionId === cq.question_id));
      const answerContent = extractAnswerContent(customAns || {});
      items.push({
        type: 'custom',
        id: cq.question_id,
        title: `${getQuestionTypeLabel(cq.question_type)} ${idx + 1}`,
        text: cq.question_type,
        answer: answerContent,
        score: cq.score,
        feedback: cq.feedback,
        code_quality: cq.code_quality,
        auto_scored: cq.auto_scored,
        videoUrl: getVideoResponseUrl(customAnswers, cq.question_id),
        ai_suspected: cq.ai_suspected,
        ai_probability: cq.ai_probability,
      });
    });
  }

  if (questionScores && questionScores.length > 0) {
    questionScores.forEach((q: any, idx: number) => {
      items.push({
        type: 'question',
        id: idx,
        title: `Question ${idx + 1}`,
        text: questions?.[idx] || '',
        answer: extractAnswerContent(answers?.[idx]),
        score: q.score,
        ai_probability: q.ai_probability,
        feedback: q.feedback,
        ai_suspected: q.ai_suspected,
      });
    });
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-8 border-l-4 border-merit-green">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Assessment Questions & Modules ({items.length})</h2>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="p-4 border rounded-lg hover:shadow-sm transition bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{item.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{item.type === 'custom' ? getQuestionTypeLabel(item.text) : 'Question'}</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{item.type === 'question' ? item.text : `Type: ${getQuestionTypeLabel(item.text)}`}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-bold">{item.score === null || item.score === undefined ? '—' : `${item.score}/100`}</div>
                {item.ai_suspected && <div className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">AI Suspected</div>}
              </div>
            </div>

            {/* Expanded */}
            <div className="mt-3">
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="text-sm text-merit-green hover:underline"
              >
                {expandedIndex === idx ? 'Hide details' : 'View details'}
              </button>

              {expandedIndex === idx && (
                <div className="mt-3 bg-white p-3 border rounded">
                  {item.type === 'question' && (
                    <>
                      <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{item.answer || <span className="text-gray-400 italic">No answer provided</span>}</div>
                      {item.feedback && (
                        <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{item.feedback}</div>
                      )}
                    </>
                  )}

                  {item.type === 'custom' && (
                    <>
                      {item.videoUrl ? (
                        <div className="mt-2 bg-black rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          <video src={item.videoUrl} controls className="w-full h-full object-contain" preload="metadata" />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{item.answer || <span className="text-gray-400 italic">No answer provided</span>}</div>
                      )}

                      {item.feedback && <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded mt-2">{item.feedback}</div>}
                    </>
                  )}

                  {/* Manual scoring quick action if provided */}
                  {item.type === 'custom' && setEditingScore && typeof onSaveManualScore === 'function' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setEditingScore(item.id)}
                        className="px-3 py-1 rounded bg-merit-green text-white text-sm"
                      >
                        Edit Score
                      </button>
                      <span className="text-xs text-gray-500">(Opens inline scoring)</span>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">No questions or modules available.</div>
        )}
      </div>
    </div>
  );
}
