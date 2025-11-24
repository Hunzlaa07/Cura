import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ApplicantSidebar from "@/components/dashboard/ApplicantSidebar";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertTriangle, Upload, X, FileText } from "lucide-react";

interface CaseStudy {
  id: number;
  title: string;
  description: string;
  instructions: string;
  questions: string[];
  tables?: Array<{
    id: string;
    table_id: string;
    title: string;
    columns: Array<{ key: string; label: string; type: string }>;
    rows: Array<Record<string, string>>;
  }>;
  duration_minutes: number;
}

interface AnswerData {
  type: 'text' | 'file';
  content: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
}

const getAuthToken = (): string | null => {
  const sessionData = sessionStorage.getItem('case_study_session');
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      if (session.access_token) {
        console.log("✅ Using case study access token");
        return session.access_token;
      }
    } catch (e) {
      console.error("Failed to parse session data");
    }
  }

  const jwtToken = localStorage.getItem("token");
  if (jwtToken) {
    console.log("✅ Using regular JWT token");
    return jwtToken;
  }

  return null;
};

export default function AssessmentStart() {
  const { jobId, caseStudyId } = useParams<{ jobId?: string; caseStudyId?: string }>();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const token = getAuthToken();
  // Use caseStudyId if available (for assessments), otherwise use jobId
  const identifier = caseStudyId || jobId || '';
  const storageKey = `assessment_${identifier}_timer`;
  const answersKey = `assessment_${identifier}_answers`;

  // Load saved answers from localStorage on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(answersKey);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        if (Array.isArray(parsed)) {
          setAnswers(parsed);
        }
      } catch (e) {
        console.error("Failed to load saved answers", e);
      }
    }
  }, [answersKey]);

  // Fetch case study - either by jobId or caseStudyId
  useEffect(() => {
    const fetchCaseStudy = async () => {
      try {
        setLoading(true);
        
        let res;
        let data;
        
        let caseStudyData: CaseStudy;
        
        if (caseStudyId) {
          // Fetch by case study ID (for assessment case studies)
          console.log("🔍 Fetching assessment case study:", caseStudyId);
          res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/${caseStudyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("❌ Failed to fetch case study:", res.status, errorData);
            throw new Error(errorData.error || "Failed to fetch case study");
          }
          
          data = await res.json();
          console.log("✅ Case study response:", data);
          
          if (!data.caseStudy || !data.caseStudy.id) {
            console.error("❌ Invalid case study data:", data);
            throw new Error("Case study not found");
          }
          
          caseStudyData = data.caseStudy;
          console.log("✅ Setting case study:", caseStudyData.id, caseStudyData.title);
          setCaseStudy(caseStudyData);
        } else if (jobId) {
          // Fetch by job ID (for job-based case studies)
          res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/job/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!res.ok) throw new Error("Failed to fetch case study");
          
          data = await res.json();
          
          if (!Array.isArray(data.caseStudies) || data.caseStudies.length === 0) {
            throw new Error("No case study found for this job");
          }
          
          caseStudyData = data.caseStudies[0];
          
          if (!caseStudyData.id || !caseStudyData.title) {
            throw new Error("Case study has invalid data");
          }
          
          setCaseStudy(caseStudyData);
        } else {
          throw new Error("No job ID or case study ID provided");
        }
        
        const durationMinutes = caseStudyData.duration_minutes || 0;
        
        if (durationMinutes <= 0) {
          throw new Error("Case study has invalid or missing duration");
        }
        
        const savedTimerData = localStorage.getItem(storageKey);
        
        if (savedTimerData) {
          const { startTime: savedStart, duration } = JSON.parse(savedTimerData);
          const elapsed = Math.floor((Date.now() - savedStart) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          
          if (remaining <= 0) {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(answersKey);
            
            const now = Date.now();
            const duration = durationMinutes * 60;
            
            setStartTime(now);
            setTimeLeft(duration);
            
            localStorage.setItem(storageKey, JSON.stringify({
              startTime: now,
              duration: duration
            }));
            
            setAnswers(Array(caseStudyData.questions.length).fill({ type: 'text', content: '' }));
          } else {
            setStartTime(savedStart);
            setTimeLeft(remaining);
          }
        } else {
          const now = Date.now();
          const duration = durationMinutes * 60;
          
          setStartTime(now);
          setTimeLeft(duration);
          
          localStorage.setItem(storageKey, JSON.stringify({
            startTime: now,
            duration: duration
          }));
        }
        
        if (answers.length === 0) {
          const savedAnswers = localStorage.getItem(answersKey);
          if (!savedAnswers) {
            setAnswers(Array(caseStudyData.questions.length).fill({ type: 'text', content: '' }));
          }
        }
        
      } catch (err: any) {
        console.error("❌ Error in fetchCaseStudy:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    
    if (token && (jobId || caseStudyId)) {
      fetchCaseStudy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, caseStudyId, token]);

  // ============================================
  // SECTION 1: Timer countdown with auto-submit
  // ============================================
  useEffect(() => {
    if (!startTime || submitted) return;
    
    const interval = setInterval(() => {
      const savedTimerData = localStorage.getItem(storageKey);
      if (!savedTimerData) return;
      
      const { startTime: savedStart, duration } = JSON.parse(savedTimerData);
      const elapsed = Math.floor((Date.now() - savedStart) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        console.log('⏰ Time expired - auto-submitting');
        // Get fresh answers from localStorage instead of stale state
        const savedAnswers = localStorage.getItem(answersKey);
        if (savedAnswers) {
          try {
            const currentAnswers = JSON.parse(savedAnswers);
            console.log('📝 Current answers from storage:', currentAnswers);
            submitAssessmentNow(currentAnswers);
          } catch (e) {
            console.error('Failed to parse saved answers:', e);
          }
        } else {
          console.warn('⚠️ No saved answers found');
          submitAssessmentNow(answers);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, submitted, storageKey, answersKey, answers]);

  const formatTime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = { type: 'text', content: value };
    setAnswers(updated);
    localStorage.setItem(answersKey, JSON.stringify(updated));
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, DOC, DOCX, and TXT files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadingIndex(index);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionIndex', index.toString());

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/upload-answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'File upload failed');
      }

      const { file_path, file_name, file_size } = await res.json();

      const updated = [...answers];
      updated[index] = {
        type: 'file',
        content: file_path,
        fileName: file_name,
        fileSize: file_size,
        uploadedAt: new Date().toISOString(),
      };
      setAnswers(updated);
      localStorage.setItem(answersKey, JSON.stringify(updated));
      setError('');
      
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...answers];
    updated[index] = { type: 'text', content: '' };
    setAnswers(updated);
    localStorage.setItem(answersKey, JSON.stringify(updated));
  };

  // ============================================
  // SECTION 2: Auto-submit function (for timeout)
  // ============================================
  const submitAssessmentNow = async (answersToSubmit: AnswerData[]) => {
    if (!caseStudy) return;

    try {
      setLoading(true);
      setError("");
      
      console.log('🚀 Submitting with answers:', answersToSubmit);
      
      const assessmentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobId || null, // Can be null for assessment case studies
          case_study_id: caseStudy.id,
          answers: answersToSubmit,
        }),
      });
      
      const assessmentData = await assessmentRes.json();
      
      if (!assessmentRes.ok) {
        throw new Error(assessmentData.error || "Failed to submit assessment");
      }
      
      console.log("✅ Assessment submitted successfully");
      console.log("📋 Submission ID:", assessmentData.submission_id);
      
      const submissionId = assessmentData.submission_id;

      console.log("🤖 Auto-generating assessment result...");
      
      try {
        const generateRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/assessments/generate-result/${submissionId}`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const generateData = await generateRes.json();

        if (!generateRes.ok) {
          console.warn("⚠️ Failed to auto-generate result:", generateData.error || "Unknown error");
          console.log("ℹ️ Result will be generated by recruiter manually");
        } else {
          console.log("✅ Assessment result generated automatically", {
            score: generateData.evaluation?.score,
            rating: generateData.evaluation?.rating,
            recommendation: generateData.evaluation?.final_recommendation
          });
        }
      } catch (generateErr) {
        console.warn("⚠️ Error during auto-generation:", generateErr);
        console.log("ℹ️ Continuing with submission - result can be generated later");
      }

      const sessionData = sessionStorage.getItem('case_study_session');
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          
          const completionRes = await fetch(`${import.meta.env.VITE_API_URL}/api/case-study-invitations/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              case_study_id: session.case_study_id,
              job_id: session.job_id || null, // Can be null for assessment case studies
              answers: answersToSubmit
            }),
          });
          
          const completionData = await completionRes.json();
          
          if (completionRes.ok && completionData.success) {
            console.log("✅ Case study invitation marked as completed");
            sessionStorage.removeItem('case_study_session');
          } else {
            console.warn("⚠️ Failed to mark case study as completed:", completionData.error);
          }
          
        } catch (sessionErr) {
          console.warn("⚠️ Error processing case study completion:", sessionErr);
        }
      }
      
      setSubmitted(true);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(answersKey);
      
      console.log("✅ Submission complete");
      
    } catch (err: any) {
      console.error("❌ Submission error:", err);
      setError(err.message || "Failed to submit assessment");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SECTION 3: Manual submit function (button click)
  // ============================================
  const handleSubmit = async (autoSubmit = false) => {
    if (!caseStudy) return;

    if (!autoSubmit) {
      const emptyAnswers = answers.filter(ans => 
        ans.type === 'text' && (!ans.content || ans.content.trim().length === 0 || 
        ans.content.trim().toLowerCase() === 'na' || 
        ans.content.trim().toLowerCase() === 'n/a')
      );
      
      if (emptyAnswers.length === answers.length) {
        setError('Please provide answers to at least some questions before submitting.');
        return;
      }
      
      if (emptyAnswers.length > 0) {
        const confirmed = window.confirm(
          `You have ${emptyAnswers.length} unanswered question(s). This will significantly affect your score. Do you want to submit anyway?`
        );
        if (!confirmed) return;
      }
    }

    await submitAssessmentNow(answers);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );

  if (error && !caseStudy) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-red-500 text-lg">{error}</div>
    </div>
  );

  if (!caseStudy) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-red-500 text-lg">No case study found</div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#e1e4e8' }}>
      <ApplicantSidebar activeItem="current-case" />

      <div className="flex-1 p-8 max-w-[1200px]">
        {!submitted ? (
          <>
            <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8 flex items-center justify-between rounded-lg">
              <div>
                <h1 className="text-3xl font-bold">{caseStudy.title}</h1>
                {timeLeft < 300 && timeLeft > 0 && (
                  <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Less than 5 minutes remaining!
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Bell className={`w-6 h-6 ${timeLeft < 300 ? 'text-red-500' : 'text-gray-600'}`} />
                <span className={`font-bold text-lg ${timeLeft < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </header>

            <section className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Background Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Background</h2>
                <div className="text-gray-700 leading-relaxed space-y-3 whitespace-pre-wrap break-words">
                  {caseStudy.description}
                </div>
              </div>

              {/* Scenario Section */}
              {caseStudy.instructions && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Scenario</h2>
                  <div className="text-gray-700 leading-relaxed space-y-3 whitespace-pre-wrap break-words">
                    {caseStudy.instructions}
                  </div>
                </div>
              )}

              {/* Tables Section */}
              {caseStudy.tables && caseStudy.tables.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Tables</h2>
                  <div className="space-y-6">
                    {caseStudy.tables.map((table, tableIdx) => (
                      <div key={tableIdx} className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {table.title || `Table ${tableIdx + 1}`}
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-300">
                                {table.columns && table.columns.map((col, colIdx) => (
                                  <th
                                    key={colIdx}
                                    className="px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-300 last:border-r-0"
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>

                            <tbody>
                              {table.rows && table.rows.length > 0 ? (
                                table.rows.map((row, rowIdx) => (
                                  <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                                    {table.columns && table.columns.map((col, colIdx) => (
                                      <td
                                        key={colIdx}
                                        className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0"
                                      >
                                        {row[col.key] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={table.columns?.length || 1}
                                    className="px-4 py-6 text-center text-gray-500"
                                  >
                                    No data
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                {caseStudy.questions.map((q, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <label className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {i + 1}. {q}
                    </label>

                    {answers[i]?.type === 'text' ? (
                      <>
                        <textarea
                          value={answers[i]?.content || ''}
                          onChange={(e) => handleAnswerChange(i, e.target.value)}
                          className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
                          disabled={timeLeft <= 0}
                          placeholder="Type your answer here or upload a document..."
                        />
                        <p className="text-xs text-gray-500">
                          {answers[i]?.content?.length || 0} characters • 💾 Auto-saved
                        </p>
                      </>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-800">{answers[i]?.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {answers[i]?.fileSize ? `${(answers[i].fileSize / 1024).toFixed(2)} KB` : ''} • 
                                Uploaded {answers[i]?.uploadedAt ? new Date(answers[i].uploadedAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            disabled={timeLeft <= 0}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(i, e.target.files[0]);
                            }
                          }}
                          disabled={timeLeft <= 0 || uploadingIndex === i}
                          className="hidden"
                        />
                        <Upload className="w-4 h-4" />
                        <span className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50">
                          {uploadingIndex === i ? 'Uploading...' : 'Upload Document'}
                        </span>
                      </label>
                      {answers[i]?.type === 'file' && (
                        <button
                          onClick={() => handleAnswerChange(i, '')}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Or type text answer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleSubmit(false)}
                disabled={timeLeft <= 0 || loading}
                className="bg-green-500 text-white hover:bg-green-600 px-8 py-3 rounded-lg text-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Assessment"}
              </Button>

              {timeLeft <= 0 && (
                <p className="text-red-500 font-semibold">Time's up! Your assessment has been automatically submitted.</p>
              )}
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-2xl p-12">
            <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Assessment Submitted Successfully!</h2>
            <p className="text-gray-600 text-lg text-center mb-8 max-w-md">
              Thank you for completing the case study. The recruiter will review your submission and provide feedback soon.
            </p>
            <Button
              onClick={() => navigate('/applicant-dashboard')}
              className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-3 rounded-lg"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}