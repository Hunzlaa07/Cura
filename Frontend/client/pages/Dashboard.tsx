import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/dashboard/Sidebar";
import CandidateCard from "@/components/dashboard/CandidateCard";
import AssessmentSubmissions from "@/components/dashboard/AssessmentSubmissions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Plus, Bell, X } from "lucide-react";
import { History, Save, Check, MoreVertical, Briefcase, MapPin, Clock, Calendar, Share2, Settings, ArrowLeft } from "lucide-react";
import { FileText } from "lucide-react";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface JobData {
  title: string;
  description: string;
  description_ar: string;
  key_responsibilities: string;
  key_responsibilities_ar: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  min_experience_years: number;
  max_experience_years: number;
  status: string;
  expires_at: string;
}

interface CV {
  id: number;
  applicant_id: number;
  file_name: string;
  file_path: string;
  language: string;
  uploaded_at: string;
}

interface Candidate {
  id: number;
  name: string;
  role: string;
  score: number;
  skills: string[];
  caseStudy: string;
  submittedTime: string;
  avatar: string;
  status?: string;
}


interface ShortlistedCandidate {
  id: number;
  name: string;
  title: string;
  score?: number;
  [key: string]: any;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const planType = (typeof window !== 'undefined' ? localStorage.getItem('planType') : null) || 'full';
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobData, setJobData] = useState<JobData>({
    title: "",
    description: "",
    description_ar: "",
    key_responsibilities: "",
    key_responsibilities_ar: "",
    department: "",
    location: "",
    employment_type: "full-time",
    experience_level: "mid",
    min_experience_years: 0,
    max_experience_years: 0,
    status: "active",
    expires_at: "",
  });

  const [candidateList, setCandidateList] = useState<Candidate[]>([]);
  const [shortlisted, setShortlisted] = useState<ShortlistedCandidate[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [recruiterProfile, setRecruiterProfile] = useState<any | null>(null);
  const [minScore, setMinScore] = useState<number | "">(0);
  const [maxScore, setMaxScore] = useState<number | "">(100);

  // View All states
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showAllCVs, setShowAllCVs] = useState(false);
  const [showAllShortlisted, setShowAllShortlisted] = useState(false);
  const [showAllAssessments, setShowAllAssessments] = useState(false);

  // Update document direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const requests: Promise<Response>[] = [];
        // profile is always needed
        requests.push(fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/profile`, {
          headers: { Authorization: `Bearer ${token}`, "Accept-Language": i18n.language },
        }));
        if (planType !== 'case_only') {
          // Only fetch candidates and CVs for full plan
          requests.unshift(fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/candidates`, {
            headers: { Authorization: `Bearer ${token}`, "Accept-Language": i18n.language },
          }));
          requests.splice(1, 0, fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/shortlisted`, {
            headers: { Authorization: `Bearer ${token}`, "Accept-Language": i18n.language },
          }));
          requests.splice(2, 0, fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/cvs`, {
            headers: { Authorization: `Bearer ${token}`, "Accept-Language": i18n.language },
          }));
        } else {
          // Still fetch shortlist if available; skip candidates and CVs
          requests.unshift(fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/shortlisted`, {
            headers: { Authorization: `Bearer ${token}`, "Accept-Language": i18n.language },
          }));
        }

        const responses = await Promise.all(requests);
        // Map responses depending on planType order
        let candidatesRes: Response | null = null;
        let shortlistedRes: Response | null = null;
        let cvsRes: Response | null = null;
        let profileRes: Response | null = null;

        if (planType !== 'case_only') {
          [candidatesRes, shortlistedRes, cvsRes, profileRes] = responses as [Response, Response, Response, Response];
        } else {
          [shortlistedRes, profileRes] = responses as [Response, Response];
        }

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          setRecruiterProfile(profileData);
        }

        if (candidatesRes && candidatesRes.ok) {
          const candidatesData = await candidatesRes.json();
          console.log('Candidates data:', candidatesData);

          const mappedCandidates: Candidate[] = (candidatesData.data || []).map(
            (c: any) => ({
              id: c.id,
              name: c.full_name || c.applicant_full_name,
              role: c.title || c.last_job_title || t('noCandidatesFound') || "No Title",
              score: c.ai_score ? parseFloat(c.ai_score) : 0,
              skills: Array.isArray(c.skills) ? c.skills : [],
              caseStudy: c.job_title || "General Application",
              submittedTime: c.cv_uploaded_at || c.applied_at
                ? new Date(c.cv_uploaded_at || c.applied_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
                : "N/A",
              avatar: c.profile_picture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || c.applicant_full_name)}&background=random`,
              status: c.status,
            })
          );

          setCandidateList(mappedCandidates);
        }

        if (shortlistedRes && shortlistedRes.ok) {
          const shortlistedData = await shortlistedRes.json();
          setShortlisted(shortlistedData.data || []);
        }

        if (cvsRes && cvsRes.ok) {
          const cvsData = await cvsRes.json();
          setCvs(cvsData.data || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast({
          variant: "destructive",
          title: t('error') || "Error",
          description: t('errorLoading') || "Failed to load dashboard data",
        });
      }
    };

    fetchData();
  }, [toast, i18n.language, planType]);

  const handleJobChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setJobData({ ...jobData, [e.target.name]: e.target.value });

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
        body: JSON.stringify(jobData),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: t('dashboardPage.alerts.jobCreated') || "Success ✨",
          description: i18n.language === 'ar' ? "تم إنشاء الوظيفة بنجاح!" : "Job created successfully!",
          variant: "default",
        });
        setShowJobForm(false);
        setJobData({
          title: "",
          description: "",
          description_ar: "",
          key_responsibilities: "",
          key_responsibilities_ar: "",
          department: "",
          location: "",
          employment_type: "full-time",
          experience_level: "mid",
          min_experience_years: 0,
          max_experience_years: 0,
          status: "active",
          expires_at: "",
        });
      } else {
        toast({
          variant: "destructive",
          title: t('error') || "Error",
          description: data.error || t('dashboardPage.alerts.jobFailed') || "Failed to create job",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: i18n.language === 'ar'
          ? "حدث خطأ أثناء إنشاء الوظيفة"
          : "Something went wrong while creating the job.",
      });
    }
  };

  const optionsMap: Record<string, string[]> = {
    employment_type: ["full-time", "part-time", "contract", "freelance"],
    experience_level: ["entry", "mid", "senior", "lead"],
    status: ["active", "inactive"],
  };

  const handleShortlist = async (candidateId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiters/shortlist/${candidateId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('dashboardPage.alerts.candidateShortlisted') || "Success ✨",
          description: i18n.language === 'ar'
            ? "تمت إضافة المرشح إلى القائمة المختصرة بنجاح!"
            : "Candidate shortlisted successfully!",
          variant: "default",
        });
        const candidate = candidateList.find((c) => c.id === candidateId);
        if (candidate) {
          setShortlisted((prev) => [
            ...prev,
            {
              id: candidate.id,
              name: candidate.name,
              title: candidate.role,
              score: candidate.score,
            },
          ]);
        }
      } else {
        toast({
          variant: "destructive",
          title: t('error') || "Error",
          description: data.error || t('dashboardPage.alerts.candidateShortlistFailed') || "Failed to shortlist candidate",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: i18n.language === 'ar'
          ? "حدث خطأ أثناء إضافة المرشح إلى القائمة المختصرة"
          : "Something went wrong while shortlisting the candidate.",
      });
    }
  };

  const handleRemoveShortlist = async (applicantId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recruiters/shortlist/${applicantId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('dashboardPage.alerts.candidateRemoved') || "Success 🗑️",
          description: i18n.language === 'ar'
            ? "تمت إزالة المرشح من القائمة المختصرة!"
            : "Candidate removed from shortlist!",
          variant: "default",
        });
        setShortlisted((prev) =>
          prev.filter((s) => s.applicant_id !== applicantId)
        );
      } else {
        toast({
          variant: "destructive",
          title: t('error') || "Error",
          description: data.error || t('dashboardPage.alerts.candidateRemoveFailed') || "Failed to remove from shortlist",
        });
      }
    } catch (err) {
      console.error("Error removing from shortlist:", err);
    }
  };

  // Filter candidates by score
  const filteredCandidates = candidateList.filter((c) => {
    const score = c.score ?? 0;
    return (minScore === "" || score >= minScore) && (maxScore === "" || score <= maxScore);
  });

  // Get visible candidates based on showAllCandidates state
  const visibleCandidates = showAllCandidates ? filteredCandidates : filteredCandidates.slice(0, 5);

  // Get visible CVs based on showAllCVs state
  const visibleCVs = showAllCVs ? cvs : cvs.slice(0, 5);

  // Get visible shortlisted based on showAllShortlisted state
  const visibleShortlisted = showAllShortlisted ? shortlisted : shortlisted.slice(0, 5);

  return (
    <div className="h-screen bg-[#bfcad6] flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="h-14 md:h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0">
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


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <img
                src={
                  recruiterProfile?.profile_picture ||
                  "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(recruiterProfile?.full_name || "Recruiter")
                }
                alt="Profile"
                className="w-8 h-8 rounded-full cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                {recruiterProfile?.full_name || "Recruiter"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
              >
                {t('logout') || 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 w-full">
        <Sidebar activeItem="home" className="hidden md:block flex-shrink-0" />

        <main className="flex-1 min-w-0 overflow-y-auto bg-[#e1e4e8] px-8 md:px-16 py-12 space-y-16">
          <div className="max-w-[1600px] mx-auto w-full space-y-12">

            {/* Title & Add Job */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold text-merit-dark">
                  {t('dashboardPage.title') || 'Recruiter Dashboard'}
                </h1>
                <p className="text-base text-merit-gray">
                  {t('dashboardPage.subtitle') || 'Manage and review candidates with AI-powered insights'}
                </p>
              </div>

            </div>
          </div>



          {/* Filters */}
          {planType !== 'case_only' && (
            <div className="w-full bg-white border-2 border-gray-300 rounded-xl mb-6 overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-0 divide-x-2 divide-gray-300 min-w-[600px]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {t('dashboardPage.filterBySkill') || 'Filter by Skill'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="min-w-[120px] justify-between">
                        {i18n.language === 'ar' ? 'جميع المهارات' : 'All Skills'} <Filter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>{i18n.language === 'ar' ? 'جميع المهارات' : 'All Skills'}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {t('dashboardPage.aiScore') || 'AI Score Range'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="min-w-[120px] justify-between">
                        {i18n.language === 'ar' ? 'جميع النقاط' : 'All Scores'} <Filter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => { setMinScore(0); setMaxScore(25); }}>0-25</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMinScore(26); setMaxScore(50); }}>26-50</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMinScore(51); setMaxScore(75); }}>51-75</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMinScore(76); setMaxScore(100); }}>76-100</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setMinScore("" as any); setMaxScore("" as any); }}>
                        {i18n.language === 'ar' ? 'جميع النقاط' : 'All Scores'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {t('dashboardPage.filterByLanguages') || 'Language'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="min-w-[120px] justify-between">
                        {i18n.language === 'ar' ? 'جميع اللغات' : 'All Languages'} <Filter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>{i18n.language === 'ar' ? 'جميع اللغات' : 'All Languages'}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}

          {/* Candidates / Assessments Management Section */}
          <section className="mb-6 bg-white border-2 border-gray-300 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-merit-dark">
                {planType === 'case_only'
                  ? (t('dashboardPage.assessmentSubmissions') || 'Assessment Submissions')
                  : (t('dashboardPage.candidatesManagement') || 'Candidates Management')}
                {planType !== 'case_only' ? ` (${filteredCandidates.length})` : ''}
              </h2>
              {planType !== 'case_only' && filteredCandidates.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllCandidates(!showAllCandidates)}
                >
                  {showAllCandidates
                    ? (i18n.language === 'ar' ? 'عرض أقل' : 'View Less')
                    : (i18n.language === 'ar' ? 'عرض الكل' : 'View All')
                  }
                </Button>
              )}
            </div>

            {planType === 'case_only' ? (
              <div className="overflow-x-auto">
                <AssessmentSubmissions showAll={showAllAssessments} />
              </div>
            ) : candidateList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">{t('noCandidatesFound') || 'No candidates found'}</p>
                <p className="text-sm mt-2">
                  {t('candidatesWillAppear') || 'Candidates will appear here once they apply to your jobs'}
                </p>
              </div>
            ) : (
              <>
                {!showAllCandidates && filteredCandidates.length > 5 && (
                  <>
                    <button
                      onClick={() => {
                        const container = document.getElementById('candidates-scroll');
                        if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                      aria-label="Scroll left"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        const container = document.getElementById('candidates-scroll');
                        if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                      aria-label="Scroll right"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </>
                )}

                <div
                  id="candidates-scroll"
                  className={`${showAllCandidates ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'overflow-x-auto scroll-smooth px-8 pb-2'}`}
                >
                  <div className={showAllCandidates ? 'contents' : 'flex gap-4 min-w-max py-2'}>
                    {visibleCandidates.map((c) => (
                      <div key={c.id} className={showAllCandidates ? '' : 'flex-shrink-0 w-[380px]'}>
                        <CandidateCard
                          id={c.id}
                          name={c.name}
                          role={c.role}
                          score={c.score}
                          skills={c.skills}
                          caseStudy={c.caseStudy}
                          submittedTime={c.submittedTime}
                          avatar={c.avatar}
                          isShortlisted={shortlisted.some(s => s.applicant_id === c.id)}
                          isRejected={c.status === 'rejected'}
                          onShortlist={() => handleShortlist(c.id)}
                          onView={() => {
                            console.log('View candidate:', c.id);
                          }}
                          onMessage={() => {
                            console.log('Message candidate:', c.id);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* CV & Shortlisted */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* CVs (hidden for case_only) */}
            {planType !== 'case_only' && (
              <section className="bg-white border-2 border-gray-300 rounded-2xl p-4 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-merit-dark">
                    {t('dashboardPage.cvManagement') || 'CV Management'} ({cvs.length})
                  </h3>
                  {cvs.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllCVs(!showAllCVs)}
                    >
                      {showAllCVs
                        ? (i18n.language === 'ar' ? 'عرض أقل' : 'View Less')
                        : (i18n.language === 'ar' ? 'عرض الكل' : 'View All')
                      }
                    </Button>
                  )}
                </div>
                <ul className="space-y-3 min-w-0 gap-2">
                  {visibleCVs.map((cv) => (
                    <li
                      key={cv.id}
                      className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3"
                      style={{ backgroundColor: '#e1e4e8' }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span className="text-sm text-merit-dark truncate">{cv.file_name}</span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL}${cv.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 bg-merit-green text-black text-xs font-medium px-4 py-2 rounded-md shadow-sm hover:bg-merit-green/90 transition-colors duration-200 whitespace-nowrap"
                      >
                        {t('dashboardPage.viewCV') || 'View CV'}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Shortlisted (hidden for case_only) */}
            {planType !== 'case_only' && (
              <section className="bg-white border-2 border-gray-300 rounded-2xl p-4 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-merit-dark">
                    {t('dashboardPage.shortlistedCandidates') || 'Shortlisted Candidates'} ({shortlisted.length})
                  </h3>
                  {shortlisted.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllShortlisted(!showAllShortlisted)}
                    >
                      {showAllShortlisted
                        ? (i18n.language === 'ar' ? 'عرض أقل' : 'View Less')
                        : (i18n.language === 'ar' ? 'عرض الكل' : 'View All')
                      }
                    </Button>
                  )}
                </div>

                <ul className="space-y-3 min-w-0">
                  {visibleShortlisted.length === 0 ? (
                    <li className="text-center py-8 text-gray-500">
                      <p className="text-sm">{t('noShortlistedCandidates') || 'No shortlisted candidates yet'}</p>
                    </li>
                  ) : (
                    visibleShortlisted.map((s) => {
                      const candidateName = s.full_name || s.applicant_name || s.name || "No name";
                      const profilePicture = s.profile_picture || s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=random`;

                      return (
                        <li
                          key={`${s.id}-${s.applicant_id || s.name}`}
                          className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
                          style={{ backgroundColor: '#e1e4e8' }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={profilePicture}
                              alt={candidateName}
                              className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-merit-dark truncate">{candidateName}</p>
                              <p className="text-xs text-merit-gray truncate">{s.title || "No title"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            {s.score !== undefined && s.score !== null && (
                              <span className="text-merit-dark font-semibold text-sm bg-merit-green/20 px-3 py-1 rounded-lg">
                                {s.score}
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveShortlist(s.id || s.applicant_id!)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                              title={i18n.language === 'ar' ? 'إزالة' : 'Remove'}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            )}
          </div>

          {/* Assessment Submissions (hidden for case_only to avoid duplicate) */}
          {planType !== 'case_only' && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4 border-2 border-gray-300 rounded-xl p-4 bg-white">
                <h2 className="text-lg font-semibold text-merit-dark">
                  {t('dashboardPage.assessmentSubmissions') || 'Assessment Submissions'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllAssessments(!showAllAssessments)}
                >
                  {showAllAssessments
                    ? (i18n.language === 'ar' ? 'عرض أقل' : 'View Less')
                    : (i18n.language === 'ar' ? 'عرض الكل' : 'View All')
                  }
                </Button>
              </div>
              <div className="overflow-x-auto">
                <AssessmentSubmissions showAll={showAllAssessments} />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}