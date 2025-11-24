// src/pages/AssessmentResultsView.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle, TrendingUp, TrendingDown, Award,
  FileText, Brain, CheckCircle, XCircle, ArrowLeft, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/dashboard/Sidebar";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { History } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface QuestionScore {
  question_number: number;
  question_text: string;
  score: number;
  ai_suspected: boolean;
  ai_probability?: number;
  feedback: string;
}

interface SkillScore {
  skill_name: string;
  category: string;
  score: number;
  evidence: string;
  is_required: boolean;
}
interface PsychometricScore {
  name: string;
  description: string;
  score: number;
  evidence: string;
}
interface AssessmentResult {
  id: number;
  job_id: number;
  score: number;
  rating: string;
  feedback_text: string;
  feedback_text_ar: string;
  ai_detected: boolean;
  cv_match_score: number;
  final_recommendation: string;
  submitted_time: string;
  case_study_title: string;
  questions: string[];
  answers: string[];
  question_scores: QuestionScore[];
  question_scores_ar: QuestionScore[];
  skill_scores: SkillScore[];
  skill_scores_ar: SkillScore[];
  psychometric_scores: PsychometricScore[];
  psychometric_scores_ar: PsychometricScore[];
  result_generated: number;
  applicant_name: string;
  applicant_email: string;
  status: string;
  avg_ai_probability?: number;
}

const extractAnswerContent = (answer: any): string => {
  if (typeof answer === 'string') {
    return answer;
  }
  if (answer && typeof answer === 'object' && 'content' in answer) {
    return answer.content || '';
  }
  return '';
};

const getSubmissionTypeIcon = (answer: any): string => {
  if (typeof answer === 'string') {
    return '📝';
  }
  if (answer && typeof answer === 'object') {
    if (answer.type === 'file') {
      return `📄 (${answer.fileName || 'Document'})`;
    }
    return '📝';
  }
  return '';
};

const getRatingColor = (rating: string) => {
  switch (rating?.toLowerCase()) {
    case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
    case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'poor': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-blue-600 bg-blue-50";
  if (score >= 40) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

// TopBar Component
function TopBar() {
  const { t } = useTranslation();
  
  return (
    <header className="h-14 md:h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-merit-dark rounded-lg flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 75 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8">
            <path d="M16.9671 31.0082C19.0128 36.6402 23.007 41.6008 27.6225 45.3565C32.2724 49.2127 37.8323 52.1652 43.6934 53.6806C45.7814 54.215 47.919 54.5325 50.0722 54.6282C54.1573 54.7851 58.5845 53.9818 61.8633 51.3651C65.9328 48.1145 67.0436 43.1288 65.9987 38.1557C65.343 35.04 63.9875 32.1 62.2179 29.4111C61.8523 28.8502 61.4693 28.3009 61.0695 27.7639C61.0698 27.7591 61.0714 27.7545 61.0742 27.7506C61.077 27.7467 61.0808 27.7437 61.0852 27.7419H61.0978C61.104 27.7419 61.1103 27.7419 61.1166 27.7482L62.3528 29.0189C65.3489 32.1081 67.9654 35.5441 70.1467 39.2538C71.9634 42.3695 73.3565 45.6734 74.0844 49.1185C75.2422 54.6 74.304 60.2445 69.9867 64.107C67.715 66.1401 64.7939 67.3732 61.8602 67.9819C57.7907 68.8197 53.5486 68.6973 49.4195 68.0039C47.3205 67.6525 45.2936 67.1881 43.342 66.6139C35.2594 64.2419 27.6162 60.1787 20.9299 55.0769C16.9025 52.0591 13.2347 48.5892 9.99842 44.7353C6.6945 40.8007 3.86122 36.3547 2.10729 31.5133C0.955784 28.3506 0.306296 24.8364 0.689087 21.5043C1.52683 14.2689 6.90158 10.0394 13.7855 8.76553C17.7546 8.03133 21.9245 8.18193 25.9564 8.88162C30.2491 9.63452 34.4384 10.8898 38.4378 12.6217V12.6342C38.4369 12.6372 38.4353 12.6399 38.4331 12.6421C38.431 12.6443 38.4283 12.6459 38.4253 12.6468H38.4127C35.4815 11.8565 32.441 11.5492 29.4109 11.7369C26.8788 11.8875 24.1836 12.5621 22.0155 13.7951C18.7712 15.6401 16.7757 18.3855 16.0321 22.0314C15.8208 23.1689 15.7481 24.3278 15.8156 25.4828C15.894 27.3026 16.327 29.2417 16.9671 31.0082Z" fill="url(#paint0_linear)" />
            <path d="M57.1175 23.3005C57.1202 23.3334 57.1125 23.3664 57.0955 23.3947C55.649 26.2687 54.1995 29.1428 52.7467 32.0137C51.4164 34.6399 50.4092 36.5225 49.7189 37.6614C47.1342 41.9377 43.9897 45.8493 40.3688 49.2926C40.3565 49.3044 40.341 49.3122 40.3242 49.315C40.3074 49.3178 40.2901 49.3155 40.2747 49.3083C35.338 47.316 30.8515 44.3531 27.081 40.5951C26.6417 40.1559 26.2024 39.6915 25.7632 39.1926C25.754 39.1809 25.7486 39.1667 25.7475 39.1518C25.7475 39.1361 25.7475 39.1204 25.7569 39.1079C27.3061 36.4793 29.0692 33.9827 31.0281 31.6435C33.5638 28.6344 36.4027 25.8944 39.4997 23.4668C40.7798 22.4628 43.861 20.0343 48.7557 16.1781L68.5133 0.606092L68.529 0.600586L68.5447 0.606092C68.5505 0.609805 68.5549 0.615317 68.5572 0.621781C68.5592 0.627908 68.5592 0.634479 68.5572 0.640606L57.1112 23.3005H57.1175Z" fill="#C8F55A" />
            <path d="M6.93747 75.9035C6.94375 75.9035 6.95002 75.9035 6.95316 75.8972L25.2863 61.5269C25.2945 61.5207 25.3011 61.5126 25.3055 61.5033C25.3099 61.494 25.3119 61.4838 25.3114 61.4735C25.3107 61.4632 25.3075 61.4533 25.302 61.4445C25.2965 61.4358 25.289 61.4285 25.28 61.4233C22.4655 59.659 19.7582 57.7291 17.1724 55.6438H17.1536L17.1379 55.6501C17.1324 55.6541 17.128 55.6595 17.1253 55.6658L6.91551 75.8627C6.91358 75.8688 6.91358 75.8754 6.91551 75.8815C6.91551 75.8878 6.91551 75.8941 6.92178 75.8972C6.92709 75.9015 6.93378 75.9037 6.94061 75.9035H6.93747Z" fill="#C8F55A" />
            <defs>
              <linearGradient id="paint0_linear" x1="29.2545" y1="56.4384" x2="14.4089" y2="11.0992" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDFFF8" />
                <stop offset="1" stopColor="#F0FFCC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl md:text-2xl font-bold text-merit-dark">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitcher />

      </div>
    </header>
  );
}

export default function AssessmentResultsView() {
  const { jobId, applicantEmail } = useParams<{ jobId: string; applicantEmail: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const location = useLocation();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAssessmentResult();
  }, [jobId, applicantEmail]);

  useEffect(() => {
    if (result) {
      fetchJobDetails();
    }
  }, [result]);

  const fetchAssessmentResult = async () => {
    try {
      setLoading(true);
      const decodedEmail = decodeURIComponent(applicantEmail || '');

      const res = await fetch(`${API_URL}/api/assessments/recruiter/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch assessment results');

      const data = await res.json();

      // Find submission by email and either job_id or case_study_id (for assessments)
      const submission = data.find((s: any) => {
        if (jobId && jobId !== 'null' && jobId !== 'undefined') {
          return s.applicant_email === decodedEmail && s.job_id === parseInt(jobId);
        } else {
          // For assessment case studies, match by email only (job_id will be null)
          return s.applicant_email === decodedEmail && !s.job_id;
        }
      });

      if (!submission) {
        setError('Assessment result not found');
        return;
      }

      // Calculate average AI probability if not available
      if (!submission.avg_ai_probability && submission.question_scores?.length > 0) {
        const total = submission.question_scores.reduce((sum: number, q: any) => {
          return sum + (parseFloat(String(q.ai_probability || 0)) || 0);
        }, 0);
        submission.avg_ai_probability = total / submission.question_scores.length;
      }

      setResult(submission);
    } catch (err: any) {
      console.error('Error fetching assessment:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessment results"
      });
    } finally {
      setLoading(false);
    }
  };
  // Determine active sidebar item based on current route
  const getActiveSidebarItem = () => {
    const path = location.pathname;

    // Check if this is from case study assessments (job_id will be 'null' or undefined)
    if (jobId === 'null' || jobId === undefined || !jobId) {
      return 'case-study-assessments';
    }

    // Otherwise it's from all-jobs
    return 'all-jobs';
  };
  const fetchJobDetails = async () => {
    try {
      // For assessment case studies, jobId might be null - use case study title instead
      if (!jobId || jobId === 'null' || jobId === 'undefined') {
        // Get job title from the result if available
        if (result?.case_study_title) {
          setJobTitle(result.case_study_title);
        } else {
          setJobTitle('Case Study Assessment');
        }
        return;
      }

      const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch job details');

      const data = await res.json();
      setJobTitle(data.title || 'Assessment Results');
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      // Fallback to case study title if job fetch fails
      if (result?.case_study_title) {
        setJobTitle(result.case_study_title);
      } else {
        setJobTitle('Case Study Assessment');
      }
    }
  };

  const getField = (enValue: any, arValue: any) => {
    return i18n.language === 'ar' && arValue ? arValue : enValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem={getActiveSidebarItem()} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-merit-dark animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-600">Loading assessment results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem={getActiveSidebarItem()} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-merit-dark text-white rounded-lg hover:bg-merit-dark/90"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem={getActiveSidebarItem()} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h1>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-merit-dark text-white rounded-lg hover:bg-merit-dark/90"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questionScores = i18n.language === 'ar' && result.question_scores_ar
    ? result.question_scores_ar
    : result.question_scores;

  const skillScores = i18n.language === 'ar' && result.skill_scores_ar
    ? result.skill_scores_ar
    : result.skill_scores;
  const psychometricScores = i18n.language === 'ar' && result.psychometric_scores_ar
    ? result.psychometric_scores_ar
    : result.psychometric_scores;

  let avgProb = result.avg_ai_probability;
  if ((avgProb === undefined || avgProb === null) && questionScores?.length > 0) {
    const total = questionScores.reduce((sum: number, q: any) => {
      return sum + (parseFloat(String(q.ai_probability || 0)) || 0);
    }, 0);
    avgProb = total / questionScores.length;
  }


  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
      <TopBar />
      <div className="flex flex-1">
        <Sidebar activeItem={getActiveSidebarItem()} />
        <div className="flex-1 px-6 md:px-12 lg:px-20 py-8 overflow-y-auto">
          <div className="max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-merit-dark">
                  {result.applicant_name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
                <p className="text-xs text-gray-500 mt-1">{result.case_study_title}</p>
              </div>
            </div>

            {/* Alert Section */}
            {(result.ai_detected || result.score < 40) && (
              <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                      {t('viewApplicants.attentionRequired')}
                    </h3>
                    <div className="space-y-2">
                      {result.ai_detected && (
                        <div className="text-sm text-yellow-800">
                          <p>• {t('viewApplicants.aiContentSuspected')}</p>
                          {avgProb !== undefined && avgProb !== null && (
                            <p className="mt-2 text-sm font-bold text-yellow-900 flex items-center gap-2">
                              <span>🤖</span>
                              <span>AI Probability: {typeof avgProb === 'number'
                                ? avgProb.toFixed(1)
                                : parseFloat(String(avgProb || 0)).toFixed(1)}%</span>
                            </p>
                          )}
                        </div>
                      )}
                      {result.score < 40 && (
                        <p className="text-sm text-yellow-800">
                          • {t('viewApplicants.lowScore', { score: result.score })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Overall Score */}
              <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-merit-green">
                <p className="text-sm text-gray-600 mb-3 font-medium">Overall Score</p>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-5xl font-bold text-gray-900">{result.score}</span>
                  <span className="text-xl text-gray-400 mb-1">/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${result.score >= 80 ? 'bg-green-500' :
                        result.score >= 60 ? 'bg-blue-500' :
                          result.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${result.score}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-2">
                  {result.score >= 80 ? <TrendingUp className="w-4 h-4 text-green-500" /> :
                    result.score >= 60 ? <Award className="w-4 h-4 text-blue-500" /> :
                      <TrendingDown className="w-4 h-4 text-red-500" />}
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${getRatingColor(result.rating)}`}>
                    {result.rating}
                  </span>
                </div>
              </div>

              {/* AI Probability */}
              {avgProb !== undefined && avgProb !== null && avgProb > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-red-500">
                  <p className="text-sm text-red-600 mb-3 font-medium flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <span>AI Probability</span>
                  </p>
                  <p className="text-5xl font-bold text-red-900 mb-4">
                    {typeof avgProb === 'number' ? avgProb.toFixed(1) : parseFloat(String(avgProb || 0)).toFixed(1)}%
                  </p>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all duration-500"
                      style={{ width: `${avgProb}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-merit-green">
                <p className="text-sm text-gray-600 mb-3 font-medium">Recommendation</p>
                <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border mb-4 ${result.final_recommendation === 'Hire' ? 'bg-green-100 text-green-800 border-green-300' :
                    result.final_recommendation === 'Interview' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                      result.final_recommendation === 'Review' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        'bg-red-100 text-red-800 border-red-300'
                  }`}>
                  {result.final_recommendation}
                </div>
                {result.cv_match_score && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-600 mb-1">CV Match</p>
                    <p className="text-3xl font-bold text-blue-600">{result.cv_match_score}%</p>
                  </div>
                )}
              </div>


              {/* Question Scores Summary */}
              {questionScores && questionScores.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-merit-green md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gray-900 mb-4 font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-merit-green" />
                    <span>Question Scores ({questionScores.length})</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {questionScores.map((q, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-col gap-2">
                          <span className="text-base font-bold text-gray-900">Question {idx + 1}</span>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col items-start">
                              <span className="text-2xl font-bold text-gray-900">{q.score}</span>
                              <span className="text-sm text-gray-500">/100</span>
                            </div>
                            {q.ai_probability !== undefined && q.ai_probability !== null && q.ai_probability > 0 && (
                              <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded font-bold whitespace-nowrap">
                                🤖 {typeof q.ai_probability === 'number' ? q.ai_probability.toFixed(0) : parseFloat(String(q.ai_probability || 0)).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recruiter Feedback */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8 border-l-4 border-merit-green">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-merit-green" />
                {t('viewApplicants.recruiterFeedback')}
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {getField(result.feedback_text, result.feedback_text_ar)}
              </p>
            </div>

            {/* Skill Scores */}
            {skillScores && skillScores.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8 border-l-4 border-merit-green">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-merit-green" />
                  {t('viewApplicants.skillEvaluation')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillScores.map((skill, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-merit-dark hover:shadow-sm transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{skill.skill_name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700">
                              {skill.category}
                            </span>
                            {skill.is_required && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 font-semibold">
                                {t('viewApplicants.required')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-2xl font-bold ml-3 ${skill.score >= 8 ? "text-green-600" :
                            skill.score >= 6 ? "text-blue-600" :
                              skill.score >= 4 ? "text-yellow-600" : "text-red-600"
                          }`}>
                          {skill.score}/10
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${skill.score >= 8 ? "bg-green-500" :
                              skill.score >= 6 ? "bg-blue-500" :
                                skill.score >= 4 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          style={{ width: `${(skill.score / 10) * 100}%` }}
                        ></div>
                      </div>

                      {skill.evidence && (
                        <p className="text-xs text-gray-700 italic border-t pt-3 mt-3">
                          <span className="font-semibold text-gray-900">{t('viewApplicants.evidence')}:</span> {skill.evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Psychometrics Scores */}
            {psychometricScores && psychometricScores.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8 border-l-4 border-purple-400">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Psychometrics Evaluation
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {psychometricScores.map((psycho, idx) => (
                    <div key={idx} className="p-5 border border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-sm transition bg-purple-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{psycho.name}</h3>
                          {psycho.description && (
                            <p className="text-xs text-gray-600 mb-2">{psycho.description}</p>
                          )}
                        </div>
                        <span className={`text-2xl font-bold ml-3 ${psycho.score >= 8 ? "text-green-600" :
                            psycho.score >= 6 ? "text-blue-600" :
                              psycho.score >= 4 ? "text-yellow-600" : "text-red-600"
                          }`}>
                          {psycho.score}/10
                        </span>
                      </div>

                      <div className="w-full bg-purple-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${psycho.score >= 8 ? "bg-green-500" :
                              psycho.score >= 6 ? "bg-blue-500" :
                                psycho.score >= 4 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          style={{ width: `${(psycho.score / 10) * 100}%` }}
                        ></div>
                      </div>

                      {psycho.evidence && (
                        <p className="text-xs text-gray-700 italic border-t border-purple-200 pt-3 mt-3">
                          <span className="font-semibold text-gray-900">Evidence:</span> {psycho.evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Questions and Answers */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-merit-green" />
                {t('viewApplicants.questionsAndAnswers')}
              </h2>

              <div className="space-y-4">
                {result.questions?.map((question, index) => {
                  const rawAnswer = result.answers?.[index];
                  const answer = extractAnswerContent(rawAnswer);
                  const submissionType = getSubmissionTypeIcon(rawAnswer);
                  const questionScore = questionScores?.[index];
                  const isExpanded = expandedQuestion === index;

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-merit-green hover:shadow-md transition"
                    >
                      {/* Question Header */}
                      <div
                        onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1">
                              Question {index + 1}
                            </h3>
                            <p className="text-sm text-gray-700">{question}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {/* Submission Type */}
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium whitespace-nowrap">
                              {submissionType}
                            </span>

                            {/* AI Detection */}
                            {questionScore?.ai_suspected && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                                  {t('viewApplicants.aiSuspected')}
                                </span>
                                {questionScore?.ai_probability !== undefined && questionScore?.ai_probability !== null && (
                                  <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-medium border border-red-200">
                                    {typeof questionScore.ai_probability === 'number'
                                      ? questionScore.ai_probability.toFixed(1)
                                      : parseFloat(String(questionScore.ai_probability || 0)).toFixed(1)}% AI
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Score */}
                            {questionScore && (
                              <span className={`text-sm font-bold px-3 py-1 rounded border ${getScoreColor(questionScore.score)}`}>
                                {questionScore.score}/100
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Answer & Feedback - Expanded */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-200 p-4">
                          {/* Answer */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <span>📝</span>
                              {t('viewApplicants.answer')}
                            </h4>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {answer && answer.trim().length > 0 ? (
                                  answer
                                ) : (
                                  <span className="text-gray-400 italic">{t('viewApplicants.noAnswerProvided')}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Feedback */}
                          {questionScore?.feedback && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span>💬</span>
                                {t('viewApplicants.feedback')}
                              </h4>
                              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {questionScore.feedback}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}