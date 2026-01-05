// src/pages/AssessmentResultsView.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle, TrendingUp, TrendingDown, Award,
  FileText, Brain, CheckCircle, XCircle, ArrowLeft, Loader2, ChevronDown, ChevronUp,
  Code, Database, Video, FileSpreadsheet, PenTool, MessageSquare, Edit3, Save, Copy, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/dashboard/Sidebar";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { History } from 'lucide-react';
import assessmentApi from '@/lib/assessmentApiService';

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

interface CustomQuestionScore {
  question_id: number;
  question_type: string;
  // Optional question text (may be provided by the API)
  question_text?: string;
  question_text_ar?: string;
  score: number;
  feedback: string;
  code_quality?: string;
  auto_scored?: boolean;
  // Optional timestamps (some API responses include created_at)
  created_at?: string | null;
  createdAt?: string | null;
}

interface CustomAnswer {
  question_id: number;
  type: string;
  answer: any;
}

interface AssessmentResult {
  id: number;
  job_id: number;
  job_application_id?: number;
  case_study_id: number;
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
  custom_question_scores: CustomQuestionScore[];
  custom_question_scores_ar: CustomQuestionScore[];
  custom_answers?: CustomAnswer[];
  result_generated: number;
  applicant_name: string;
  applicant_email: string;
  applicant_id?: number;
  status: string;
  avg_ai_probability?: number;
  session?: {
    id?: number;
    integrityScore: number;
    warnings: number;
    timeSpent?: number;
    status?: string;
  };
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

const getQuestionTypeIcon = (type: string) => {
  switch (type) {
    case 'mcq': return <CheckCircle className="w-4 h-4" />;
    case 'coding': return <Code className="w-4 h-4" />;
    case 'sql': return <Database className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
    case 'writing': return <PenTool className="w-4 h-4" />;
    case 'situational_judgment': return <Brain className="w-4 h-4" />;
    case 'open_ended': return <MessageSquare className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case 'mcq': return 'Multiple Choice';
    case 'coding': return 'Code Challenge';
    case 'sql': return 'SQL Query';
    case 'video': return 'Video Response';
    case 'video_response': return 'Video Response';
    case 'videoResponse': return 'Video Response';
    case 'excel': return 'Excel Task';
    case 'writing': return 'Writing Exercise';
    case 'situational_judgment': return 'Situational Judgment';
    case 'open_ended': return 'Open Ended';
    default: return type;
  }
};

// Helper to get video URL from custom_answers
const getVideoResponseUrl = (customAnswers: CustomAnswer[] | undefined, questionId: number): string | null => {
  console.log('🎥 getVideoResponseUrl called:', { customAnswers, questionId });
  if (!customAnswers) {
    console.log('🎥 No customAnswers provided');
    return null;
  }
  const videoAnswer = customAnswers.find(a => a.question_id === questionId);
  console.log('🎥 Found videoAnswer:', videoAnswer);
  if (!videoAnswer) return null;
  
  const answer = videoAnswer.answer;
  console.log('🎥 Answer object:', answer, 'type:', typeof answer);
  if (typeof answer === 'object' && answer?.type === 'video' && answer?.url) {
    console.log('🎥 Returning URL:', answer.url);
    return answer.url;
  }
  // Also check if the answer itself is a string URL (legacy format)
  if (typeof answer === 'string' && answer.includes('/uploads/')) {
    console.log('🎥 Returning string URL:', answer);
    return answer;
  }
  return null;
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
  const [applicantName, setApplicantName] = useState('');
  const [applicantFormEmail, setApplicantFormEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantPreviousJobTitle, setApplicantPreviousJobTitle] = useState('');
  const [applicantAppliedDate, setApplicantAppliedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  // Proctoring logs state
  const [proctoringLogs, setProctoringLogs] = useState<any[]>([]);
  const [loadingProctoring, setLoadingProctoring] = useState(false);
  const [proctoringError, setProctoringError] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Full answer modal state (Option B)
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'text' | 'code' | 'video' | null>(null);
  const [modalVideoSrc, setModalVideoSrc] = useState<string | null>(null);
  const [modalQuestion, setModalQuestion] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  type ModalOptions = { question?: string | null; feedback?: string | null; questionId?: number } | undefined;

  const openAnswerModal = (title: string, content: string | null, type: 'text' | 'code' | 'video' | null, options?: ModalOptions) => {
    console.log('🔍 openAnswerModal called', { title, type, contentLength: content ? content.length : 0, apiUrl: API_URL, options });
    setModalTitle(title || '');
    setModalContent(content);
    setModalType(type);
    setModalQuestion(options?.question || null);
    setModalFeedback(options?.feedback || null);
    setModalVideoSrc(type === 'video' && content ? (content.startsWith('http') ? content : `${API_URL}${content}`) : null);
    setShowAnswerModal(true);

    // If question text not provided, try fetching by questionId
    if ((!options?.question || (typeof options.question === 'string' && options.question.trim() === '')) && options?.questionId) {
      assessmentApi.getQuestionById(options.questionId)
        .then(res => {
          if (res && (res as any).data) {
            const q = (res as any).data;
            const fetchedQuestion = (i18n.language === 'ar' && q.question_text_ar) ? q.question_text_ar : q.question_text;
            if (fetchedQuestion) setModalQuestion(fetchedQuestion);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch question text for id', options.questionId, err);
        });
    }
  };

  const closeAnswerModal = () => {
    setShowAnswerModal(false);
    setModalContent(null);
    setModalVideoSrc(null);
    setModalType(null);
    setModalTitle('');
    setModalQuestion(null);
    setModalFeedback(null);
  }; 

  // Debug: log modal visibility changes
  useEffect(() => {
    console.log('🔔 showAnswerModal changed:', showAnswerModal, { modalTitle, modalType, modalContentLength: modalContent ? modalContent.length : 0 });
  }, [showAnswerModal, modalTitle, modalType, modalContent]);

  const copyToClipboard = async (text: string) => {
    try {
      if (!text) throw new Error('Nothing to copy');
      await navigator.clipboard.writeText(text);
      toast({ title: i18n.language === 'ar' ? 'تم النسخ' : 'Copied', description: i18n.language === 'ar' ? 'تم نسخ المحتوى إلى الحافظة' : 'Content copied to clipboard' });
    } catch (err) {
      console.error('Copy failed', err);
      toast({ variant: 'destructive', title: i18n.language === 'ar' ? 'خطأ' : 'Error', description: i18n.language === 'ar' ? 'فشل في النسخ' : 'Failed to copy' });
    }
  };

  // Manual scoring state
  const [manualScores, setManualScores] = useState<Record<number, number>>({});
  const [manualFeedback, setManualFeedback] = useState<Record<number, string>>({});
  const [editingScore, setEditingScore] = useState<number | null>(null);
  const [savingScore, setSavingScore] = useState<number | null>(null);

  // Deductions & integrity UI state
  const [showDeductions, setShowDeductions] = useState(false);

  // Penalty mapping (should mirror server-side penaltyMap)
  const penaltyMap: Record<string, { points: number; label: string }> = {
    'tab_switch': { points: 0, label: 'Tab switch' },
    'tab_switch_limit_exceeded': { points: 15, label: 'Tab switch limit exceeded' },
    'focus_lost': { points: 3, label: 'Focus lost' },
    'copy_attempt': { points: 10, label: 'Copy attempt' },
    'paste_attempt': { points: 10, label: 'Paste attempt' },
    'multiple_faces': { points: 20, label: 'Multiple faces detected' },
    'no_face_detected': { points: 15, label: 'No face detected' },
    'fullscreen_exit': { points: 5, label: 'Exited fullscreen' },
    'webcam_denied': { points: 30, label: 'Webcam access denied' },
    'webcam_disconnected': { points: 20, label: 'Webcam disconnected' },
    'face_too_far': { points: 5, label: 'Face too far from camera' }
  };

  // Derived deductions from proctoring logs
  const deductions = proctoringLogs
    .filter(log => log.event_type && penaltyMap[log.event_type])
    .map(log => ({
      eventType: log.event_type,
      label: penaltyMap[log.event_type].label,
      points: penaltyMap[log.event_type].points,
      timestamp: log.client_timestamp || log.server_timestamp || log.created_at,
      detail: log.event_data || null
    }));

  const totalDeductions = deductions.reduce((s, d) => s + (d.points || 0), 0);

  const token = localStorage.getItem('token');

  // Handle manual score submission
  const handleSaveManualScore = async (questionId: number) => {
    const score = manualScores[questionId];
    if (score === undefined || score < 0 || score > 100) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "يرجى إدخال درجة صحيحة (0-100)" : "Please enter a valid score (0-100)",
      });
      return;
    }

    try {
      setSavingScore(questionId);
      
      // Use the new endpoint that updates custom_question_scores in feedbacks table
      const res = await fetch(`${API_URL}/api/assessments/feedback/${result?.id}/question/${questionId}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: score,
          feedback: manualFeedback[questionId] || ''
        }),
      });

      if (!res.ok) throw new Error('Failed to save score');
      
      const responseData = await res.json();

      toast({
        title: i18n.language === 'ar' ? "تم الحفظ" : "Saved",
        description: i18n.language === 'ar' 
          ? `تم حفظ الدرجة بنجاح. الدرجة الإجمالية: ${responseData.data?.overall_score || score}`
          : `Score saved. New overall score: ${responseData.data?.overall_score || score}`,
      });

      setEditingScore(null);
      // Refresh data to get updated overall score
      fetchAssessmentResult();
    } catch (err) {
      console.error('Error saving manual score:', err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل في حفظ الدرجة" : "Failed to save score",
      });
    } finally {
      setSavingScore(null);
    }
  };

  useEffect(() => {
    fetchAssessmentResult();
  }, [jobId, applicantEmail]);

  useEffect(() => {
    if (result) {
      fetchJobDetails();
      fetchProctoringLogs();
      fetchApplicantDetails();
    }
  }, [result]);

  const fetchProctoringLogs = async () => {
    if (!result || !result.id) return;
    try {
      setLoadingProctoring(true);
      setProctoringError('');
      
      // Build query params - only include values that are actually present
      const queryParams: {
        applicantId?: number;
        applicationId?: number;
        sessionId?: number;
        assessmentApplicationId?: number;
        caseStudyId?: number;
      } = {};
      
      // Include applicant_id if available for stricter filtering
      if (result.applicant_id) {
        queryParams.applicantId = result.applicant_id;
        console.log('✅ Adding applicantId to query:', result.applicant_id);
      } else {
        console.warn('⚠️ No applicant_id in result object');
      }
      
      // job_application_id is the primary filter for case study submissions
      if (result.job_application_id) {
        queryParams.applicationId = result.job_application_id;
      }
      
      // Add secondary filters to narrow down further
      if (result.session?.id) {
        queryParams.sessionId = result.session.id;
      }
      
      // Use result.id (feedback id) as assessmentApplicationId
      queryParams.assessmentApplicationId = result.id;
      
      if (result.case_study_id) {
        queryParams.caseStudyId = result.case_study_id;
      }
      
      console.log('📋 Fetching proctoring logs with params:', queryParams);
      
      const res = await assessmentApi.getProctoringLogs(queryParams);
      if (!res || !res.data) {
        setProctoringLogs([]);
        console.warn('⚠️ No proctoring logs returned');
        return;
      }
      console.log('📋 Proctoring logs received:', res.data?.length || 0, 'logs');
      setProctoringLogs(res.data || []);
    } catch (err: any) {
      console.error('Failed to load proctoring logs', err);
      setProctoringError(err?.message || 'Failed to load proctoring logs');
    } finally {
      setLoadingProctoring(false);
    }
  };

  const openLogModal = (log: any) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const closeLogModal = () => {
    setSelectedLog(null);
    setShowLogModal(false);
  };

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

      // Find submission(s) by email and either job_id or case_study_id (for assessments)
      let matches: any[] = [];
      if (jobId && jobId !== 'null' && jobId !== 'undefined') {
        matches = data.filter((s: any) => s.applicant_email === decodedEmail && s.job_id === parseInt(jobId));
      } else {
        // For assessment case studies, match by email only (job_id will be null)
        matches = data.filter((s: any) => s.applicant_email === decodedEmail && !s.job_id);
      }

      // Fallback to any submission with the same email
      if (!matches || matches.length === 0) {
        matches = data.filter((s: any) => s.applicant_email === decodedEmail);
      }

      if (!matches || matches.length === 0) {
        setError('Assessment result not found');
        return;
      }

      // If multiple matches, pick the most recent by submitted_time (fallback to highest id)
      let submission = matches[0];
      if (matches.length > 1) {
        console.warn('⚠️ Multiple matching submissions found for', decodedEmail, 'matches:', matches.map(m => m.id));
        submission = matches.reduce((prev: any, cur: any) => {
          const prevTime = prev?.submitted_time ? new Date(prev.submitted_time).getTime() : (prev?.result_generated || prev?.id || 0);
          const curTime = cur?.submitted_time ? new Date(cur.submitted_time).getTime() : (cur?.result_generated || cur?.id || 0);
          return curTime > prevTime ? cur : prev;
        }, matches[0]);
        console.log('ℹ️ Selected submission id:', submission.id, 'submitted_time:', submission.submitted_time || submission.result_generated || submission.id);
      }

      // DEBUG: Log selected submission to trace video/module mapping
      console.log('📋 Submission loaded:', {
        id: submission.id,
        applicant_id: submission.applicant_id,
        job_application_id: submission.job_application_id,
        case_study_id: submission.case_study_id,
        session: submission.session,
        custom_answers: submission.custom_answers,
        custom_question_scores: submission.custom_question_scores
      });

      // Calculate average AI probability if not available - prefer custom (module) question scores
      if (!submission.avg_ai_probability) {
        const scoresSource = (submission.custom_question_scores && submission.custom_question_scores.length > 0)
          ? submission.custom_question_scores
          : (submission.question_scores || []);
        if (scoresSource.length > 0) {
          const total = scoresSource.reduce((sum: number, q: any) => {
            return sum + (parseFloat(String(q.ai_probability || 0)) || 0);
          }, 0);
          submission.avg_ai_probability = total / scoresSource.length;
        }
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

  const fetchApplicantDetails = async () => {
    try {
      if (!result?.applicant_email || !result?.job_id) return;

      const decodedEmail = decodeURIComponent(result.applicant_email);
      
      // Fetch applicants using the same endpoint as ViewApplicants: /api/jobs/{jobId}/applicants
      const res = await fetch(`${API_URL}/api/jobs/${result.job_id}/applicants`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch applicants');

      const data = await res.json();
      const applications = data.applicants || [];

      // Find the matching application by email
      const matchingApp = applications.find((app: any) => 
        app.email?.toLowerCase() === decodedEmail.toLowerCase()
      );

      if (matchingApp) {
        // Set all data from the job application form (same as ViewApplicants does)
        setApplicantName(matchingApp.full_name || '');
        setApplicantFormEmail(matchingApp.email || '');
        setApplicantPhone(matchingApp.phone || '');
        setApplicantPreviousJobTitle(matchingApp.last_job_title || '');
        setApplicantAppliedDate(matchingApp.applied_at || '');
        console.log('✅ Applicant details loaded from job applicants:', { 
          name: matchingApp.full_name, 
          email: matchingApp.email,
          phone: matchingApp.phone, 
          job_title: matchingApp.last_job_title, 
          applied_at: matchingApp.applied_at 
        });
      } else {
        console.warn('⚠️ No matching application found for email:', decodedEmail);
      }
    } catch (err: any) {
      console.error('Error fetching applicant details:', err);
      // Silently fail - data will just show as "—"
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

  const customQuestionScores = i18n.language === 'ar' && result.custom_question_scores_ar
    ? result.custom_question_scores_ar
    : result.custom_question_scores;

  let avgProb = result.avg_ai_probability;
  if ((avgProb === undefined || avgProb === null)) {
    const scoresSource = (customQuestionScores && customQuestionScores.length > 0) ? customQuestionScores : questionScores || [];
    if (scoresSource.length > 0) {
      const total = scoresSource.reduce((sum: number, q: any) => {
        return sum + (parseFloat(String(q.ai_probability || 0)) || 0);
      }, 0);
      avgProb = total / scoresSource.length;
    }
  }

  // Prepare sorted modules array (preserve creation order when available)
  const sortedModules = customQuestionScores && customQuestionScores.length > 0
    ? [...customQuestionScores].sort((a, b) => {
        const aDate = a.created_at || a.createdAt;
        const bDate = b.created_at || b.createdAt;
        if (aDate && bDate) return new Date(aDate).getTime() - new Date(bDate).getTime();
        if (aDate) return -1;
        if (bDate) return 1;
        return 0;
      })
    : [];

  // If modules exist (custom questions or answers), prefer showing modules and hide legacy question UI by default
  const hasModules = (result?.custom_question_scores && result.custom_question_scores.length > 0) || (result?.custom_answers && result.custom_answers.length > 0);


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
                  {applicantName || result.applicant_name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
                <p className="text-xs text-gray-500 mt-1">{result.case_study_title}</p>
                {result?.id && (
                  <p className="text-xs text-gray-400 mt-1">Submission #{result.id} {result.submitted_time ? `• ${new Date(result.submitted_time).toLocaleString()}` : ''}</p>
                )}
              </div>
            </div>

            {/* Image Modal */}
            {showLogModal && selectedLog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                <div className="bg-white rounded-lg max-w-3xl w-full overflow-auto max-h-[90vh] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{(selectedLog.event_type || '').replace(/_/g, ' ')}</h3>
                      <p className="text-xs text-gray-500">{new Date(selectedLog.client_timestamp || selectedLog.server_timestamp || '').toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="text-xs text-gray-600 hover:underline" href={selectedLog.screenshot_url} target="_blank" rel="noreferrer">Open in new tab</a>
                      <button onClick={closeLogModal} className="rounded px-3 py-1 bg-gray-100 text-sm">Close</button>
                    </div>
                  </div>

                  {selectedLog.screenshot_url && (
                    <div className="mb-3">
                      <img src={selectedLog.screenshot_url} alt="screenshot" className="w-full h-auto rounded" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Answer / Code / Video Modal (Option B) */}
            {showAnswerModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 p-4" style={{ zIndex: 9999 }}>
                <div className="bg-white rounded-lg max-w-4xl w-full overflow-auto max-h-[90vh] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{modalTitle}</h3>
                      <p className="text-xs text-gray-500">{modalType === 'video' ? (modalVideoSrc ? (i18n.language === 'ar' ? 'رد فيديو' : 'Video Response') : (i18n.language === 'ar' ? 'لا يوجد فيديو' : 'No video')) : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {modalType !== 'video' && modalContent && (
                        <button onClick={() => modalContent && copyToClipboard(modalContent)} className="flex items-center gap-2 text-xs text-gray-600 hover:underline">
                          <Copy className="w-3 h-3" />
                          <span>{i18n.language === 'ar' ? 'نسخ' : 'Copy'}</span>
                        </button>
                      )}
                      <button onClick={closeAnswerModal} className="rounded px-3 py-1 bg-gray-100 text-sm">{i18n.language === 'ar' ? 'إغلاق' : 'Close'}</button>
                    </div>
                  </div>

                  {/* Module label (always visible) */}
                  <div className="mb-2 text-xs text-gray-600">{i18n.language === 'ar' ? 'Module' : 'Module'}: <span className="font-semibold text-gray-800">{modalTitle}</span></div>

                  {/* Question block (show question_text when available, otherwise show fallback) */}
                  <div className="mb-3 p-3 bg-gray-50 rounded text-sm text-gray-800 border border-gray-100">
                    <div className="font-semibold text-gray-900 mb-1">{i18n.language === 'ar' ? 'السؤال' : 'Question'}</div>
                    <div className="text-sm whitespace-pre-wrap text-gray-700">
                      {modalQuestion && modalQuestion.trim().length > 0 ? modalQuestion : (
                        <span className="italic text-gray-500">{i18n.language === 'ar' ? 'لا يوجد نص للسؤال' : 'No question text available'}</span>
                      )}
                    </div>
                  </div>

                  {/* Answer heading */}
                  <div className="mb-2 font-semibold text-sm text-gray-900">{i18n.language === 'ar' ? 'الإجابة' : 'Answer'}</div>

                  {modalType === 'video' && modalVideoSrc && (
                    <div className="bg-black rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                      <video src={modalVideoSrc} controls className="w-full h-full object-contain" preload="metadata" />
                    </div>
                  )}

                  {modalType !== 'video' && modalContent && (
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">{modalContent}</pre>
                  )}

                  {/* Feedback (if available) */}
                  {modalFeedback && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-100 text-sm text-gray-800">
                      <div className="font-semibold text-gray-900 mb-1">{i18n.language === 'ar' ? 'ملاحظات' : 'Feedback'}</div>
                      <div className="text-sm whitespace-pre-wrap">{modalFeedback}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deductions Detail Modal */}
            {showDeductions && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                <div className="bg-white rounded-lg max-w-lg w-full overflow-auto max-h-[90vh] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        Integrity Report
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Assessment proctoring summary</p>
                    </div>
                    <button onClick={() => setShowDeductions(false)} className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors">
                      <XCircle className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Integrity Score Summary */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Integrity Score</span>
                      <span className={`text-3xl font-bold ${
                        (result?.session?.integrityScore ?? 100) >= 80 ? 'text-green-600' : 
                        (result?.session?.integrityScore ?? 100) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{result?.session?.integrityScore ?? 100}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          (result?.session?.integrityScore ?? 100) >= 80 ? 'bg-green-500' : 
                          (result?.session?.integrityScore ?? 100) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${result?.session?.integrityScore ?? 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {(result?.session?.integrityScore ?? 100) >= 90 
                        ? '✅ Excellent integrity - No significant issues detected during the assessment.'
                        : (result?.session?.integrityScore ?? 100) >= 70
                        ? '⚠️ Minor concerns - Some suspicious activity was detected but within acceptable limits.'
                        : (result?.session?.integrityScore ?? 100) >= 50
                        ? '🚨 Moderate concerns - Multiple violations detected. Review recommended.'
                        : '❌ Serious concerns - Significant cheating indicators. Manual review required.'}
                    </p>
                  </div>

                  {/* Total Deductions */}
                  {totalDeductions > 0 && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700">{i18n.language === 'ar' ? 'إجمالي الخصومات' : 'Total Deductions'}</span>
                      <span className="text-xl font-bold text-red-600">-{totalDeductions}%</span>
                    </div>
                  )}

                  {/* Violations List */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recorded Violations ({deductions.length})</h4>
                    {deductions.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {deductions.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                {d.eventType === 'webcam_denied' && '🚫'}
                                {d.eventType === 'tab_switch' && '↔️'}
                                {d.eventType === 'tab_switch_limit_exceeded' && '🚨'}
                                {d.eventType === 'copy_attempt' && '📋'}
                                {d.eventType === 'paste_attempt' && '📋'}
                                {d.eventType === 'fullscreen_exit' && '🖥️'}
                                {d.eventType === 'multiple_faces' && '👥'}
                                {d.eventType === 'no_face_detected' && '👤'}
                                {d.label}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {d.timestamp ? new Date(d.timestamp).toLocaleString() : 'Unknown time'}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-red-600 ml-3">-{d.points}%</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                        <p className="font-medium text-green-800">No integrity violations recorded</p>
                        <p className="text-sm text-green-600 mt-1">This candidate completed the assessment without any detected issues.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Proctoring Screenshots */}
                  {proctoringLogs.some(log => log.screenshot_url) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        📸 Proctoring Screenshots ({proctoringLogs.filter(log => log.screenshot_url).length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {proctoringLogs
                          .filter(log => log.screenshot_url)
                          .map((log, idx) => (
                            <div 
                              key={idx} 
                              className="relative cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => { setSelectedLog(log); setShowLogModal(true); setShowDeductions(false); }}
                            >
                              <img 
                                src={log.screenshot_url} 
                                alt={`Screenshot ${idx + 1}`} 
                                className="w-full h-20 object-cover rounded border border-gray-200"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 rounded-b">
                                {log.event_type?.replace(/_/g, ' ') || 'Screenshot'}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{(result?.session?.warnings || result?.session?.warnings === 0) ? result.session.warnings : '—'}</div>
                        <div className="text-xs text-gray-600 mb-1">Warnings Issued</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{proctoringLogs.length > 0 ? proctoringLogs.length : '—'}</div>
                        <div className="text-xs text-gray-600 mb-1">Events Logged</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Section */}
            {(result.ai_detected || result.score < 40) && (
              <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                      {t('viewApplicants.attentionRequired')}
                    </h3>

                    <div className="mb-2">
                      {result.ai_detected && avgProb > 0 ? (
                        <div className="flex items-baseline gap-3 mb-2">
                          <p className="text-2xl font-bold text-yellow-900">{typeof avgProb === 'number' ? avgProb.toFixed(1) + '%' : parseFloat(String(avgProb || 0)).toFixed(1) + '%'}</p>
                          <p className="text-2xl text-yellow-900 font-bold">AI Probability</p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-yellow-900 mb-2">No AI detected</p>
                      )}
                    </div>

                    <div className="space-y-2">

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

            {/* Applicant Information Card */}
            <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border-t-4 border-merit-green">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                {i18n.language === 'ar' ? 'معلومات المتقدم' : 'Applicant Information'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Full Name */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    {i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {applicantName || 'N/A'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="text-base font-bold text-gray-900 break-all">
                    {applicantFormEmail || 'N/A'}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    {i18n.language === 'ar' ? 'الهاتف' : 'Phone'}
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {applicantPhone || '—'}
                  </p>
                </div>

                {/* Previous Job Title */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    {i18n.language === 'ar' ? 'المسمى الوظيفي السابق' : 'Previous Job Title'}
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {applicantPreviousJobTitle || '—'}
                  </p>
                </div>

                {/* Applied Date */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    {i18n.language === 'ar' ? 'تاريخ التقديم' : 'Applied Date'}
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {applicantAppliedDate ? new Date(applicantAppliedDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
                  </p>
                </div>

                {/* Current Status */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    {i18n.language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                  </p>
                  <p className="text-base font-bold text-gray-900 capitalize">
                    {result.status ? result.status.replace(/_/g, ' ') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

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
              {avgProb !== undefined && avgProb !== null && (
                <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-red-500">
                  <p className="text-sm text-red-600 mb-3 font-medium flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <span>AI Probability</span>
                  </p>
                  <p className="text-5xl font-bold text-red-900 mb-4">
                    {result.ai_detected && avgProb > 0 ? (typeof avgProb === 'number' ? avgProb.toFixed(1) + '%' : parseFloat(String(avgProb || 0)).toFixed(1) + '%') : 'No AI detected'}
                  </p>
                  <div className={`w-full ${avgProb === 0 ? 'bg-white' : 'bg-red-200'} rounded-full h-2`}>
                    <div
                      className={`h-2 rounded-full ${avgProb === 0 ? 'bg-white' : 'bg-red-500'} transition-all duration-500`}
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

              {/* Integrity & Proctoring (NEW card) */}
              <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-yellow-400 md:col-span-1 lg:col-span-1">
                <p className="text-sm text-yellow-700 mb-3 font-medium">Integrity & Proctoring</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl font-bold text-gray-900">{result.session?.integrityScore ?? 'N/A'}</div>
                  <div className="text-sm text-gray-500">/100</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      (result.session?.integrityScore ?? 0) >= 80 ? 'bg-green-500' : (result.session?.integrityScore ?? 0) >= 60 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.session?.integrityScore ?? 0}%` }}
                  ></div>
                </div>
                
                {/* Integrity feedback description */}
                <p className="text-xs text-gray-600 mb-3">
                  {result.session?.integrityScore !== undefined && result.session?.integrityScore !== null
                    ? (result.session.integrityScore >= 90 
                        ? '✅ Excellent - No issues detected'
                        : result.session.integrityScore >= 70
                        ? '⚠️ Minor concerns detected'
                        : result.session.integrityScore >= 50
                        ? '🚨 Multiple violations - Review needed'
                        : '❌ Serious concerns - Manual review required')
                    : 'No session data available'}
                </p>
                
                <div className="text-xs text-gray-600 mb-3">Warnings: {(result.session?.warnings || result.session?.warnings === 0) ? result.session.warnings : '—'}</div>

                <div className="space-y-2 mb-3">
                  {deductions.slice(0,3).map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold">{d.label}</div>
                        <div className="text-xs text-gray-500">{d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}</div>
                      </div>
                      <div className="font-bold text-red-600">-{d.points}</div>
                    </div>
                  ))}
                  {deductions.length === 0 && (
                    <div className="text-xs text-gray-500">No integrity deductions recorded.</div>
                  )}
                  {deductions.length > 3 && (
                    <div className="text-xs text-gray-500">+{deductions.length - 3} more violations...</div>
                  )}
                </div>

                <button 
                  onClick={() => setShowDeductions(true)} 
                  className="w-full py-2 px-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition-colors border border-yellow-300 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  View All Details ({deductions.length} violations)
                </button>
              </div>



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

            {/* Question & Module Scores */}
            {( (!hasModules && questionScores && questionScores.length > 0) || (customQuestionScores && customQuestionScores.length > 0) ) && (
              <div className="bg-white rounded-lg p-6 shadow-sm mb-12 border-t-4 border-merit-green">
                <p className="text-sm text-gray-900 mb-4 font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-merit-green" />
                  <Code className="w-4 h-4 text-merit-green" />
                  <span>{i18n.language === 'ar' ? 'درجات الأسئلة' : 'Question Scores'}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Question scores (compact cards) - only show when modules are not present */}
                  {!hasModules && questionScores && questionScores.length > 0 && questionScores.map((q, idx) => (
                    <div key={`q-${idx}`} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-900">Question {idx + 1}</span>
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex-1 min-w-0 flex flex-col items-start overflow-hidden">
                            <span className="text-2xl font-bold text-gray-900">{q.score}</span>
                            <span className="text-sm text-gray-500">/100</span>
                          </div>
                          {q.ai_probability !== undefined && q.ai_probability !== null && q.ai_probability > 0 && (
                            <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded font-bold whitespace-nowrap flex-shrink-0">
                              🤖 {typeof q.ai_probability === 'number' ? q.ai_probability.toFixed(0) : parseFloat(String(q.ai_probability || 0)).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Modules: sort by created_at if available to preserve creation order */}
                  {sortedModules.length > 0 && sortedModules.map((cq, idx) => {
                    const moduleNumber = idx + 1;
                    const moduleLabel = (cq && cq.question_type) ? `${getQuestionTypeLabel(cq.question_type)} ${moduleNumber}` : `Module ${moduleNumber}`;

                    return (
                      <div key={`m-${cq.question_id}-${idx}`} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-semibold text-gray-900">{moduleLabel}</span>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col items-start">
                              <span className="text-2xl font-bold text-gray-900">{cq.score === null || cq.score === undefined ? '—' : cq.score}</span>
                              <span className="text-sm text-gray-500">/100</span>
                            </div>
                            {cq.auto_scored && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Auto-scored</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            )}

            {/* Skill Scores */}



            {/* Questions and Answers */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-12 border-t-4 border-merit-green">
              {!hasModules && (
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-merit-green" />
                  {i18n.language === 'ar' ? 'الأسئلة والأجوبة' : 'Questions and Answers'}
                </h2>
              )}

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
                        <div className="flex items-start justify-between gap-4 min-w-0">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">Question {index + 1}</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-12 overflow-hidden">{question}</p>
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
                              <span className={`text-sm font-bold px-3 py-1 rounded border whitespace-nowrap flex-shrink-0 ${getScoreColor(questionScore.score)}`}>
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
                              <div className="ml-auto flex items-center gap-2">
                                {answer && answer.trim().length > 0 && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(answer); }} className="text-xs text-gray-600 hover:underline flex items-center gap-1">
                                      <Copy className="w-3 h-3" />
                                      <span>{i18n.language === 'ar' ? 'نسخ' : 'Copy'}</span>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); openAnswerModal(i18n.language === 'ar' ? 'الإجابة' : 'Answer', answer, 'text', { question: question, feedback: questionScore?.feedback || null }); }} className="inline-flex items-center gap-2 px-3 py-1 bg-merit-dark text-merit-dark border border-merit-green rounded text-xs font-semibold hover:bg-merit-green/10 transition">
                                      <Eye className="w-3 h-3 " />
                                      <span>{i18n.language === 'ar' ? 'عرض كامل' : 'View full'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
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

            {/* Modules and Answers */}
            <div className="bg-white rounded-lg p-8 shadow-sm mb-8 mt-6 border-t-4 border-merit-green">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-merit-green" />
                  {i18n.language === 'ar' ? 'الأسئلة والأجوبة' : 'Questions and Answers'}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedModules && sortedModules.length > 0 ? (
                  sortedModules.map((cq, idx) => {
                    const moduleAnswer = result.custom_answers?.find(a => a.question_id === cq.question_id);
                    const needsManualReview = cq.score === null || cq.score === undefined || (cq.question_type === 'video' || cq.question_type === 'video_response' || cq.question_type === 'videoResponse');
                    const isEditing = editingScore === cq.question_id;
                    const isSaving = savingScore === cq.question_id;
                    const isVideoQuestion = cq.question_type === 'video' || cq.question_type === 'video_response' || cq.question_type === 'videoResponse';
                    const videoUrl = isVideoQuestion ? getVideoResponseUrl(result.custom_answers, cq.question_id) : null;
                    const resolvedVideoSrc = videoUrl ? (videoUrl.startsWith('http') ? videoUrl : `${API_URL}${videoUrl}`) : null;
                    const answerContent = moduleAnswer ? extractAnswerContent(moduleAnswer.answer) : '';
                    const preview = answerContent ? (answerContent.length > 200 ? answerContent.slice(0, 200) + '...' : answerContent) : '';
                    const moduleLabel = (cq && cq.question_type) ? `${getQuestionTypeLabel(cq.question_type)} ${idx + 1}` : `Module ${idx + 1}`;

                    const isExpanded = expandedModule === cq.question_id;

                    return (
                      <div key={`ma-${cq.question_id}-${idx}`} className={`p-6 bg-white rounded-lg border-2 transition-all hover:shadow-lg ${needsManualReview && !cq.score ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-merit-green/50'}`}>
                        <div className="flex flex-col justify-between mb-4 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div
                              onClick={() => setExpandedModule(isExpanded ? null : cq.question_id)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedModule(isExpanded ? null : cq.question_id); } }}
                              role="button"
                              tabIndex={0}
                              className="flex items-start gap-3 text-left w-full p-0 cursor-pointer hover:opacity-80 transition"
                              aria-expanded={isExpanded}
                            >
                              <span className="text-merit-green flex-shrink-0 text-xl">{getQuestionTypeIcon(cq.question_type)}</span>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-base mb-1">{moduleLabel}</h3>
                                <div className="text-sm text-gray-500 mb-2">{getQuestionTypeLabel(cq.question_type)}</div>
                                <div className="text-sm text-gray-600 line-clamp-2">{preview || (moduleAnswer ? (i18n.language === 'ar' ? 'تم تقديم إجابة' : 'Answer submitted') : (i18n.language === 'ar' ? 'لم يتم تقديم إجابة' : 'No answer submitted'))}</div>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {cq.auto_scored && (
                                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-medium">Auto-scored</span>
                              )}
                              {needsManualReview && !cq.score && (
                                <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-300 font-medium">⏳ {i18n.language === 'ar' ? 'مطلوب تقييم يدوي' : 'Needs Review'}</span>
                              )}
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-5 border-t border-gray-200 pt-5 space-y-4">
                                {!isVideoQuestion && moduleAnswer && moduleAnswer.answer && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <span>📝</span>
                                      {i18n.language === 'ar' ? 'الإجابة' : 'Answer'}
                                    </h4>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                      {answerContent && (
                                        <>
                                          <button 
                                            onClick={() => copyToClipboard(answerContent)} 
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition border border-gray-300"
                                          >
                                            <Copy className="w-4 h-4" />
                                            <span>{i18n.language === 'ar' ? 'نسخ' : 'Copy'}</span>
                                          </button>
                                          <button 
                                            onClick={() => openAnswerModal(moduleLabel, answerContent, cq.question_type === 'coding' ? 'code' : 'text', { question: (cq.question_text || cq.question_text_ar) ? (i18n.language === 'ar' && cq.question_text_ar ? cq.question_text_ar : cq.question_text) : undefined, feedback: cq.feedback || null, questionId: cq.question_id })} 
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-merit-green hover:bg-merit-dark text-white rounded-lg text-sm font-medium transition"
                                          >
                                            <Eye className="w-4 h-4" />
                                            <span>{i18n.language === 'ar' ? 'عرض كامل' : 'View Full'}</span>
                                          </button>
                                        </>
                                      )}
                                    </div>

                                    {/* Answer Content */}
                                    {moduleAnswer.type === 'file' || moduleAnswer.answer?.type === 'file' ? (
                                      <a href={(moduleAnswer.answer?.url || moduleAnswer.answer) || '#'} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
                                        📄 {moduleAnswer.answer?.fileName || 'Download file'}
                                      </a>
                                    ) : cq.question_type === 'coding' ? (
                                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap font-mono">{answerContent || (moduleAnswer.answer || '')}</pre>
                                    ) : (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{answerContent || (typeof moduleAnswer.answer === 'string' ? moduleAnswer.answer : JSON.stringify(moduleAnswer.answer))}</p>
                                      </div>
                                    )}
                                  </div>
                                )} 

                                {!moduleAnswer && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                    <p className="text-sm italic text-gray-500">{i18n.language === 'ar' ? 'لم يتم تقديم إجابة' : 'No answer submitted'}</p>
                                  </div>
                                )}

                                {/* Feedback Section */}
                                {cq.feedback && (
                                  <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <span>💬</span>
                                      {i18n.language === 'ar' ? 'الملاحظات' : 'Feedback'}
                                    </h4>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                      <p className="text-sm text-gray-800">{cq.feedback}</p>
                                    </div>
                                  </div>
                                )}

                                {cq.code_quality && (
                                  <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Code Quality</h4>
                                    <p className="text-sm text-gray-700">{cq.code_quality}</p>
                                  </div>
                                )}

                                {/* Video Response Player */}
                                {isVideoQuestion && resolvedVideoSrc && (
                                  <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                      <Video className="w-4 h-4 text-pink-500" />
                                      {i18n.language === 'ar' ? 'الرد بالفيديو' : 'Video Response'}
                                    </h4>
                                    <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                      <video 
                                        src={resolvedVideoSrc}
                                        controls
                                        className="w-full h-full object-contain"
                                        preload="metadata"
                                      />
                                    </div>
                                  </div>
                                )}

                                {isVideoQuestion && !videoUrl && (
                                  <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm italic text-gray-500 flex items-center gap-2">
                                      <Video className="w-4 h-4" />
                                      {i18n.language === 'ar' ? 'لم يتم تقديم رد فيديو' : 'No video response submitted'}
                                    </p>
                                  </div>
                                )}

                              </div>
                            )}

                          </div>

                          {/* Score display & manual edit */}
                          <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">{i18n.language === 'ar' ? 'الدرجة' : 'Score'}</span>
                            {isEditing ? (
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={manualScores[cq.question_id] ?? ''}
                                  onChange={(e) => setManualScores(prev => ({ ...prev, [cq.question_id]: parseInt(e.target.value) || 0 }))}
                                  className="w-20 px-3 py-2 text-lg font-bold border border-gray-300 rounded text-center"
                                  placeholder="0-100"
                                />
                                <span className="text-gray-600 font-medium">/100</span>
                                <button
                                  onClick={() => handleSaveManualScore(cq.question_id)}
                                  disabled={isSaving}
                                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                                  title={i18n.language === 'ar' ? 'حفظ' : 'Save'}
                                >
                                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                </button>
                                <button
                                  onClick={() => setEditingScore(null)}
                                  className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                                  title={i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className={`text-3xl font-bold whitespace-nowrap flex-shrink-0 ${
                                  cq.score === null || cq.score === undefined ? "text-orange-500" :
                                  cq.score >= 80 ? "text-green-600" :
                                  cq.score >= 60 ? "text-blue-600" :
                                  cq.score >= 40 ? "text-yellow-600" : "text-red-600"
                                }`}>
                                  {cq.score === null || cq.score === undefined ? '—' : cq.score}
                                </span>
                                <span className="text-gray-600 font-medium">/100</span>
                                <button
                                  onClick={() => {
                                    setEditingScore(cq.question_id);
                                    setManualScores(prev => ({ ...prev, [cq.question_id]: cq.score || 0 }));
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                  title={i18n.language === 'ar' ? 'تعديل الدرجة' : 'Edit score'}
                                >
                                  <Edit3 className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800">{i18n.language === 'ar' ? 'لا توجد وحدات' : 'No modules available'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personality Assessment */}
            {psychometricScores && psychometricScores.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8 border-l-4 border-purple-400">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  {i18n.language === 'ar' ? 'تقييم الشخصية' : 'Personality Assessment'}
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

            {/* Custom Question Scores */}
            {false && customQuestionScores && customQuestionScores.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8 border-l-4 border-merit-green">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Code className="w-5 h-5 text-merit-green" />
                  Assessment Module Scores ({customQuestionScores.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customQuestionScores.map((cq, idx) => {
                    const needsManualReview = cq.score === null || cq.score === undefined || 
                      (cq.question_type === 'video' || cq.question_type === 'video_response' || cq.question_type === 'videoResponse');
                    const isEditing = editingScore === cq.question_id;
                    const isSaving = savingScore === cq.question_id;
                    const isVideoQuestion = cq.question_type === 'video' || cq.question_type === 'video_response' || cq.question_type === 'videoResponse';
                    const videoUrl = isVideoQuestion ? getVideoResponseUrl(result.custom_answers, cq.question_id) : null;
                    // If backend returns an absolute URL, use it directly. Otherwise prepend with API_URL.
                    const resolvedVideoSrc = videoUrl ? (videoUrl.startsWith('http') ? videoUrl : `${API_URL}${videoUrl}`) : null;
                    
                    return (
                    <div key={idx} className={`p-5 border rounded-lg hover:shadow-sm transition bg-white ${
                      needsManualReview && !cq.score ? 'border-orange-300 bg-orange-50' : 'border-merit-green/30'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-merit-green">{getQuestionTypeIcon(cq.question_type)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
                              {getQuestionTypeLabel(cq.question_type)}
                            </span>
                            {cq.auto_scored && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
                                Auto-scored
                              </span>
                            )}
                            {needsManualReview && !cq.score && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                                ⏳ {i18n.language === 'ar' ? 'مطلوب تقييم يدوي' : 'Needs Manual Review'}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">Question #{cq.question_id}</h3>
                        </div>
                        
                        {/* Score display or manual input */}
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={manualScores[cq.question_id] ?? ''}
                              onChange={(e) => setManualScores(prev => ({ ...prev, [cq.question_id]: parseInt(e.target.value) || 0 }))}
                              className="w-16 px-2 py-1 text-lg font-bold border border-gray-300 rounded text-center"
                              placeholder="0-100"
                            />
                            <span className="text-gray-400">/100</span>
                            <button
                              onClick={() => handleSaveManualScore(cq.question_id)}
                              disabled={isSaving}
                              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingScore(null)}
                              className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold whitespace-nowrap flex-shrink-0 ${
                              cq.score === null || cq.score === undefined ? "text-orange-500" :
                              cq.score >= 80 ? "text-green-600" :
                              cq.score >= 60 ? "text-blue-600" :
                              cq.score >= 40 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {cq.score === null || cq.score === undefined ? '—' : cq.score}/100
                            </span>
                            <button
                              onClick={() => {
                                setEditingScore(cq.question_id);
                                setManualScores(prev => ({ ...prev, [cq.question_id]: cq.score || 0 }));
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title={i18n.language === 'ar' ? 'تعديل الدرجة' : 'Edit score'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Manual feedback input when editing */}
                      {isEditing && (
                        <div className="mb-3">
                          <label className="text-xs text-gray-600 mb-1 block">
                            {i18n.language === 'ar' ? 'ملاحظات (اختياري)' : 'Feedback (optional)'}
                          </label>
                          <textarea
                            value={manualFeedback[cq.question_id] || ''}
                            onChange={(e) => setManualFeedback(prev => ({ ...prev, [cq.question_id]: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            rows={2}
                            placeholder={i18n.language === 'ar' ? 'أضف ملاحظاتك...' : 'Add your feedback...'}
                          />
                        </div>
                      )}
                      
                      <div className={`w-full ${cq.score === null || cq.score === undefined || cq.score === 0 ? 'bg-gray-100' : 'bg-merit-green/20'} rounded-full h-2 mb-3`}>
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            cq.score === null || cq.score === undefined ? "bg-orange-300" :
                            cq.score >= 80 ? "bg-green-500" :
                            cq.score >= 60 ? "bg-blue-500" :
                            cq.score >= 40 ? "bg-yellow-500" : (cq.score > 0 ? "bg-red-500" : "bg-gray-200")
                          }`}
                          style={{ width: `${cq.score || 0}%` }}
                        ></div>
                      </div>

                      {cq.feedback && (
                        <p className="text-xs text-gray-700 border-t border-merit-green/30 pt-3 mt-3">
                          <span className="font-semibold text-gray-900">Feedback:</span> {cq.feedback}
                        </p>
                      )}
                      
                      {cq.code_quality && (
                        <p className="text-xs text-gray-700 mt-2">
                          <span className="font-semibold text-gray-900">Code Quality:</span> {cq.code_quality}
                        </p>
                      )}
                      
                      {/* Video Response Player */}
                      {isVideoQuestion && resolvedVideoSrc && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Video className="w-4 h-4 text-pink-500" />
                            {i18n.language === 'ar' ? 'الرد بالفيديو' : 'Video Response'}
                          </h4>
                          <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <video 
                              src={resolvedVideoSrc}
                              controls
                              className="w-full h-full object-contain"
                              preload="metadata"
                            />
                          </div>
                        </div>
                      )}
                      
                      {isVideoQuestion && !videoUrl && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <p className="text-xs text-gray-500 italic flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            {i18n.language === 'ar' ? 'لم يتم تقديم رد فيديو' : 'No video response submitted'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* Skill Scores */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-8 mt-6 border-l-4 border-merit-green">
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
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}