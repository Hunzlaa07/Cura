import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ApplicantSidebar from "@/components/dashboard/ApplicantSidebar";
import { Button } from "@/components/ui/button";
import { Bell, Play, Code2, Clock, MapPin } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
interface CaseStudy {
  id: number;
  title: string;
  title_ar?: string;
  scenario: string;
  description?: string;
  instructions?: string;
  questions: string[];
  duration_minutes: number;
}

interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  duration_minutes: number;
  expiration_date: string;
  applicant_profile_picture?: string;
}

export default function CaseStudyAssessment() {
  const navigate = useNavigate();
  const { jobId, caseStudyId } = useParams<{ jobId?: string; caseStudyId?: string }>();
  const { t, i18n } = useTranslation();
  const [job, setJob] = useState<Job | null>(null);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAssessment, setIsAssessment] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const fetchJobAndCaseStudies = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;

        // Get token with priority order
        const sessionData = sessionStorage.getItem('case_study_session');
        let token = null;

        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            token = session.access_token;
            console.log("✅ Using case study access token");
          } catch (e) {
            console.error("Failed to parse session data");
          }
        }

        if (!token) {
          token = localStorage.getItem("token");
          console.log("✅ Using regular JWT token");
        }

        if (!token) {
          throw new Error(t("caseStudyAssessmentPage.errorLoading"));
        }

        console.log("🔑 Token being sent:", token.substring(0, 20) + "...");
        console.log("📍 Route params - jobId:", jobId, "caseStudyId:", caseStudyId);

        // Check if this is an assessment case study (no jobId, but has caseStudyId)
        if (caseStudyId && !jobId) {
          console.log("✅ Detected assessment case study mode");
          setIsAssessment(true);
          // Fetch case study directly
          const caseRes = await fetch(`${apiUrl}/api/case-studies/${caseStudyId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": i18n.language,
            },
          });
          
          if (!caseRes.ok) {
            const errorData = await caseRes.json();
            throw new Error(errorData.error || t("caseStudyAssessmentPage.noCaseStudies"));
          }
          
          const caseData = await caseRes.json();
          console.log("✅ Assessment case study response:", caseData);
          
          // Set as single case study
          if (caseData.caseStudy) {
            setCaseStudies([caseData.caseStudy]);
            console.log("✅ Assessment case study set");
          } else {
            setCaseStudies([]);
            console.warn("⚠️ No case study in response");
          }
          setLoading(false);
          return;
        }

        // Regular job-based flow
        if (!jobId) {
          throw new Error("No job ID or case study ID provided");
        }

        // Fetch job info
        const jobRes = await fetch(`${apiUrl}/api/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language,
          },
        });
        
        if (!jobRes.ok) {
          const errorData = await jobRes.json();
          throw new Error(errorData.error || t("caseStudyAssessmentPage.jobNotFound"));
        }
        
        const jobData = await jobRes.json();
        setJob(jobData);
        console.log("✅ Job data fetched");

        // Fetch case studies linked to this job
        const caseRes = await fetch(`${apiUrl}/api/case-studies/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language,
          },
        });
        
        if (!caseRes.ok) {
          const errorData = await caseRes.json();
          throw new Error(errorData.error || t("caseStudyAssessmentPage.noCaseStudies"));
        }
        
        const caseData = await caseRes.json();
        console.log("✅ Full case study response:", caseData);
        
        // Extract the caseStudies array from the response object
        if (caseData.success && Array.isArray(caseData.caseStudies)) {
          setCaseStudies(caseData.caseStudies);
          console.log("✅ Case studies set:", caseData.caseStudies.length);
        } else {
          // Fallback for different response format
          setCaseStudies([]);
          console.warn("⚠️ Unexpected response format:", caseData);
        }

      } catch (err: any) {
        console.error("❌ Error:", err);
        setError(err.message || t("caseStudyAssessmentPage.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndCaseStudies();
  }, [jobId, caseStudyId, i18n.language, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("caseStudyAssessmentPage.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">{t("error")}</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/case-study/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  // For assessment case studies, job can be null - only check for regular job-based case studies
  if (!isAssessment && !job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500 text-lg">{t("caseStudyAssessmentPage.jobNotFound")}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#e1e4e8' }}>
      <ApplicantSidebar activeItem="current-case" />

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-12 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-merit-dark mb-2">
              {isAssessment && caseStudies.length > 0 
                ? (i18n.language === 'ar' && caseStudies[0].title_ar 
                   ? caseStudies[0].title_ar 
                   : caseStudies[0].title)
                : job?.title || 'Case Study Assessment'}
            </h1>
            <p className="text-lg text-merit-gray">
              {t("caseStudyAssessmentPage.welcomeBack")}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="p-8 max-w-[1200px]">
          {/* Job Details Card */}
          {!isAssessment && job && (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 mb-8 flex gap-8">
            <div className="w-16 h-16 bg-merit-green rounded-2xl flex items-center justify-center">
              <Code2 className="w-8 h-8 text-merit-dark" />
            </div>

            <div className="flex-1">
              <h2 className="text-4xl font-bold text-merit-dark mb-4">{job.title}</h2>
              <div className="flex gap-8 text-base text-merit-gray mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{job.employment_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{job.location}</span>
                </div>
              </div>
              <p className="text-lg text-gray-600">{job.description}</p>
            </div>
          </div>
          )}

          {/* Case Studies - Only Title and Duration */}
          <div className="bg-white border border-gray-200 rounded-3xl p-12 space-y-8">
            {caseStudies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code2 className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg text-gray-600">{t("caseStudyAssessmentPage.noCaseStudies")}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {i18n.language === 'ar' 
                    ? 'يرجى الاتصال بمسؤول التوظيف إذا كنت تعتقد أن هذا خطأ.'
                    : 'Please contact the recruiter if you believe this is an error.'}
                </p>
              </div>
            ) : (
              caseStudies.map((cs, idx) => (
                <div key={cs.id} className="bg-gray-100 rounded-2xl p-6 border-l-8 border-merit-green">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-700">
                      {cs.title || `${i18n.language === 'ar' ? 'السيناريو' : 'Scenario'} ${idx + 1}`}
                    </h3>
                    <p className="text-sm text-merit-dark opacity-60 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {i18n.language === 'ar' 
                        ? `${cs.duration_minutes} دقيقة`
                        : `${cs.duration_minutes} Minutes`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {caseStudies.length > 0 && (
            <Button
              onClick={() => {
                if (isAssessment && caseStudies.length > 0) {
                  // For assessment case studies, use case_study_id route
                  navigate(`/assessment-start/case-study/${caseStudies[0].id}`);
                } else if (job) {
                  // Regular job-based case study
                  navigate(`/assessment-start/${job.id}`);
                }
              }}
              className="mt-8 bg-merit-green text-merit-dark hover:bg-merit-green/90 px-12 py-6 rounded-2xl gap-3 text-lg font-semibold"
            >
              <Play className="w-5 h-5" />
              {i18n.language === 'ar' ? 'ابدأ التقييم' : 'Begin Assessment'}
            </Button>
          )}
        </main>
      </div>
    </div>
  );
}