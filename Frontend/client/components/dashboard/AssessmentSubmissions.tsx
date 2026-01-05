import { useEffect, useState } from "react";
import { Eye, TrendingUp, TrendingDown, Award, X, AlertTriangle, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface QuestionScore {
  question_number: number;
  question_text: string;
  score: number;
  ai_suspected: boolean;
  feedback: string;
}

interface SkillScore {
  skill_name: string;
  category: string;
  score: number;
  evidence: string;
  is_required: boolean;
}

interface Submission {
  id: number;
  applicant_id: number;
  job_id: number;
  case_study_id: number;
  case_study_title: string;
  submitted_time: string;
  score: number;
  rating: string | null;
  answers: string[];
  feedback_text: string;
  feedback_text_ar: string;
  applicant_name: string;
  applicant_email: string;
  applicant_title?: string;
  job_title: string;
  questions: string[];
  ai_detected?: boolean;
  ai_confidence?: string;
  question_scores?: QuestionScore[];
  question_scores_ar?: QuestionScore[];
  skill_scores?: SkillScore[];
  skill_scores_ar?: SkillScore[];
  final_recommendation?: string;
  result_generated?: number;
}

interface AssessmentSubmissionsProps {
  showAll?: boolean;
}

// Helper hook to get the correct field based on current language
const useLocalizedField = () => {
  const { i18n } = useTranslation();
  
  const getField = (enValue: any, arValue: any) => {
    if (i18n.language === 'ar' && arValue) {
      return arValue;
    }
    return enValue;
  };

  return { getField };
};

export default function AssessmentSubmissions({ showAll = false }: AssessmentSubmissionsProps) {
  const { toast } = useToast();
  const { i18n, t } = useTranslation();
  const { getField } = useLocalizedField();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/assessments/recruiter/submissions`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) throw new Error("Failed to fetch submissions");
      
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string | null | undefined) => {
    if (!rating) return 'text-gray-600 bg-gray-50 border-gray-200';
    
    switch (rating.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case 'Hire': return 'bg-green-100 text-green-800 border-green-300';
      case 'Interview': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Review': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Reject': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (score >= 60) return <Award className="w-5 h-5 text-blue-500" />;
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerateResult = async (submissionId: number) => {
    toast({
      title: t('assessmentSubmissions.generateTitle') || "Generate AI Evaluation?",
      description: t('assessmentSubmissions.generateDescription') || "This will analyze the answers and create a detailed report.",
      variant: "default",
      action: (
        <button
          onClick={async () => {
            try {
              setGenerating(submissionId);
              
              const res = await fetch(`${API_URL}/api/assessments/generate-result/${submissionId}`, {
                method: 'POST',
                headers: { 
                  Authorization: `Bearer ${token}`,
                  "Accept-Language": i18n.language || 'en',
                }
              });

              if (!res.ok) throw new Error(t('assessmentSubmissions.generateFailed') || 'Failed to generate result');
              
              const data = await res.json();
              toast({
                title: t('assessmentSubmissions.generatedSuccess') || "✅ Evaluation Generated",
                description: `Score: ${data.evaluation.score}/100 | Rating: ${data.evaluation.rating}`,
                variant: "default",
              });
              
              await fetchSubmissions();
            } catch (err: any) {
              toast({
                variant: "destructive",
                title: t('error'),
                description: err.message,
              });
            } finally {
              setGenerating(null);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
        >
          {t('assessmentSubmissions.generate') || "Generate"}
        </button>
      ),
    });
  };

 // In your handleViewDetails function, update the answer parsing:

// Update the handleViewDetails function with proper null checks:

const handleViewDetails = (submission: Submission) => {
  let parsedAnswers: string[] = [];

  try {
    if (typeof submission.answers === "string") {
      const firstParse = JSON.parse(submission.answers);
      parsedAnswers = Array.isArray(firstParse) 
        ? firstParse.map((ans: any) => {
            // Add null coalescing operator and proper null check
            if (ans && typeof ans === 'object' && ans.content) {
              return String(ans.content ?? '');
            }
            return String(ans ?? '');
          })
        : JSON.parse(firstParse).map((a: any) => {
            if (a && typeof a === 'object' && a.content) {
              return String(a.content ?? '');
            }
            return String(a ?? '');
          });
    } else if (Array.isArray(submission.answers)) {
      parsedAnswers = (submission.answers as any[]).map((ans: any) => {
        // Add explicit type casting and null coalescing
        if (ans && typeof ans === 'object' && ans.content) {
          return String(ans.content ?? '');
        }
        return String(ans ?? '');
      });
    }
  } catch {
    parsedAnswers = [];
  }

  setSelectedSubmission({
    ...submission,
    answers: parsedAnswers,
  });
};
  const visibleSubmissions = showAll ? submissions : submissions.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-gray-600">{t('assessmentSubmissions.loading') || "Loading submissions..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 border border-red-200 rounded-lg">
        {t('error')}: {error}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">{t('assessmentSubmissions.noSubmissions') || "No assessment submissions yet"}</p>
        <p className="text-gray-400 text-sm mt-2">
          {t('assessmentSubmissions.submissionsInfo') || "Submissions will appear here once applicants complete their assessments"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {visibleSubmissions.map((submission) => (
          <div
            key={submission.id}
            className="bg-white border border-gray-300 rounded-2xl p-6 hover:shadow-lg transition-shadow" 
          >
            {/* Alert Badges */}
            {(submission.ai_detected || (submission.score && submission.score < 40)) && (
              <div className="flex gap-2 mb-3">
                {submission.ai_detected && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    <AlertTriangle className="w-3 h-3" /> {t('assessmentSubmissions.aiDetected') || "AI Detected"}
                  </span>
                )}
                {submission.score && submission.score < 40 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                    <TrendingDown className="w-3 h-3" /> {t('assessmentSubmissions.lowScore') || "Low Score"}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {submission.applicant_name}
                  </h3>
                  
                  {submission.result_generated ? (
                    <>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(submission.rating)}`}>
                        {submission.rating || t('assessmentSubmissions.notRated') || 'Not Rated'}
                      </span>
                      {submission.final_recommendation && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRecommendationColor(submission.final_recommendation)}`}>
                          {submission.final_recommendation}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-yellow-50 text-yellow-700 border-yellow-300">
                      ⏳ {t('assessmentSubmissions.pendingEvaluation') || "Pending Evaluation"}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">{t('assessmentSubmissions.email') || "Email"}:</span> {submission.applicant_email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">{t('assessmentSubmissions.job') || "Job"}:</span> {submission.job_title}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">{t('assessmentSubmissions.caseStudy') || "Case Study"}:</span> {submission.case_study_title}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    {t('assessmentSubmissions.submitted') || "Submitted"}: {formatDate(submission.submitted_time)}
                  </p>
                </div>
              </div>

              <div className="text-right ml-6">
                {submission.result_generated ? (
                  <>
                    <div className="flex items-center gap-2 justify-end mb-4">
                      {getScoreIcon(submission.score)}
                      <span className="text-3xl font-bold text-gray-900">
                        {submission.score}
                      </span>
                      <span className="text-gray-500 text-lg">/100</span>
                    </div>
                    <button
                      onClick={() => handleViewDetails(submission)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {t('assessmentSubmissions.viewDetails') || "View Details"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleGenerateResult(submission.id)}
                    disabled={generating === submission.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating === submission.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('assessmentSubmissions.generating') || "Generating..."}
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        {t('assessmentSubmissions.generateResult') || "Generating Result"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal - BILINGUAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedSubmission.applicant_name}'s {t('assessmentSubmissions.submission') || "Submission"}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-gray-600">{selectedSubmission.job_title}</p>
                  {selectedSubmission.final_recommendation && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRecommendationColor(selectedSubmission.final_recommendation)}`}>
                      {selectedSubmission.final_recommendation}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Alert Section */}
              {(selectedSubmission.ai_detected || (selectedSubmission.score && selectedSubmission.score < 40)) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">
                        {t('assessmentSubmissions.attentionRequired') || "Attention Required"}
                      </h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {selectedSubmission.ai_detected && (
                          <li>• {t('assessmentSubmissions.aiContentSuspected') || "AI-generated content suspected"} ({selectedSubmission.ai_confidence || t('assessmentSubmissions.medium') || 'Medium'} {t('assessmentSubmissions.confidence') || "confidence"})</li>
                        )}
                        {selectedSubmission.score && selectedSubmission.score < 40 && (
                          <li>• {t('assessmentSubmissions.lowScoreWarning') || "Low overall score"} ({selectedSubmission.score}/100)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{t('assessmentSubmissions.overallScore') || "Overall Score"}</p>
                <div className="flex items-center gap-3">
                  {getScoreIcon(selectedSubmission.score)}
                  <p className="text-4xl font-bold text-gray-900">{selectedSubmission.score}</p>
                  <span className="text-xl text-gray-400">/100</span>
                </div>
                <span className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-semibold border ${getRatingColor(selectedSubmission.rating)}`}>
                  {selectedSubmission.rating || t('assessmentSubmissions.notRated') || 'Not Rated'}
                </span>
              </div>

              {/* Recruiter Feedback - BILINGUAL */}
              {selectedSubmission.feedback_text && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {t('assessmentSubmissions.recruiterFeedback') || "Recruiter Feedback"}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {getField(selectedSubmission.feedback_text, selectedSubmission.feedback_text_ar)}
                  </p>
                </div>
              )}

              {/* Questions and Answers with Individual Scores - BILINGUAL */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('assessmentSubmissions.questionsAnswers') || "Questions & Answers"}
                </h3>
                {selectedSubmission.custom_question_scores && selectedSubmission.custom_question_scores.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSubmission.custom_question_scores.map((cq: any, idx: number) => {
                      const aiSuspected = cq.ai_suspected;
                      const score = cq.score;
                      const label = cq.question_type === 'coding' ? 'Code Challenge' : cq.question_type === 'video' || cq.question_type === 'video_response' ? 'Video Response' : cq.question_type;

                      return (
                        <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <p className="font-semibold text-gray-900 text-base flex-1">
                              {label} (ID: {cq.question_id})
                            </p>
                            <div className="flex items-center gap-2 ml-4">
                              {aiSuspected && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                                  {t('assessmentSubmissions.aiSuspected') || "AI Suspected"}
                                </span>
                              )}
                              {score !== null && score !== undefined && (
                                <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(score)}`}>
                                  {score}/100
                                </span>
                              )}
                            </div>
                          </div>

                          {cq.feedback && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                {t('assessmentSubmissions.feedback') || "Feedback"}:
                              </p>
                              <p className="text-sm text-gray-700 italic">
                                📝 {cq.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  selectedSubmission.questions?.map((question, index) => {
                    const answer = selectedSubmission.answers?.[index];
                    
                    const questionScores = i18n.language === 'ar' && selectedSubmission.question_scores_ar
                      ? selectedSubmission.question_scores_ar
                      : selectedSubmission.question_scores;
                    
                    const questionScore = questionScores?.[index];
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-xl p-5 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-semibold text-gray-900 text-base flex-1">
                            Q{index + 1}: {question}
                          </p>
                          <div className="flex items-center gap-2 ml-4">
                            {questionScore?.ai_suspected && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                                {t('assessmentSubmissions.aiSuspected') || "AI Suspected"}
                              </span>
                            )}
                            {questionScore && (
                              <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(questionScore.score)}`}>
                                {questionScore.score}/100
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                            {t('assessmentSubmissions.answer') || "Answer"}:
                          </p>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {answer && typeof answer === 'string' && answer.trim().length > 0 ? (
                              answer
                            ) : (
                              <span className="text-gray-400 italic">
                                {t('assessmentSubmissions.noAnswerProvided') || "No answer provided"}
                              </span>
                            )}
                          </p>
                        </div>

                        {questionScore?.feedback && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              {t('assessmentSubmissions.feedback') || "Feedback"}:
                            </p>
                            <p className="text-sm text-gray-700 italic">
                              📝 {questionScore.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Skill Scores Visualization - BILINGUAL */}
              {selectedSubmission?.skill_scores && selectedSubmission.skill_scores.length > 0 && (
                <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    {t('assessmentSubmissions.skillEvaluation') || "Skill Evaluation"}
                  </h3>

                  <div className="space-y-4">
                    {(i18n.language === 'ar' && selectedSubmission.skill_scores_ar 
                      ? selectedSubmission.skill_scores_ar 
                      : selectedSubmission.skill_scores
                    ).map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{skill.skill_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600">
                              {skill.category}
                            </span>
                            {skill.is_required && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                {t('assessmentSubmissions.required') || "Required"}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              skill.score >= 8
                                ? "text-green-600"
                                : skill.score >= 6
                                ? "text-blue-600"
                                : skill.score >= 4
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {skill.score}/10
                          </span>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              skill.score >= 8
                                ? "bg-green-500"
                                : skill.score >= 6
                                ? "bg-blue-500"
                                : skill.score >= 4
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${(skill.score / 10) * 100}%` }}
                          ></div>
                        </div>

                        {skill.evidence && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            <span className="font-medium text-gray-700">
                              {t('assessmentSubmissions.evidence') || "Evidence"}:
                            </span> {skill.evidence}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}