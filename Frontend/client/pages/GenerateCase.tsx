import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/dashboard/Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, History, Sparkles, Loader2, RefreshCw, Upload, X, FileText, ChevronLeft, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import CaseStudyLoadingScreen from '@/components/CaseStudyLoadingScreen';

// Link icon component
const LinkIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const UploadIconComponent = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

function TopBar() {
  const { t, i18n } = useTranslation();

  return (
    <header className="h-14 md:h-16 border-b border-gray-200 bg-white px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
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

const caseStudyTypeMap = {
  'Analytical': 'analytical',
  'Scenario-Based': 'scenario',
  'Creative': 'creative',
  'Technical': 'technical'
};

const calculateTotalMinutes = (days, hours, minutes) => {
  return (days * 24 * 60) + (hours * 60) + minutes;
};

export default function GenerateCase() {
  const { jobId: urlJobId } = useParams();
  const { i18n } = useTranslation();

  const planType = (typeof window !== 'undefined' ? localStorage.getItem('planType') : null) || 'full';

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedLinks, setUploadedLinks] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [inputMode, setInputMode] = useState<"job" | "document">(planType === 'case_only' ? "document" : "job"); // default by plan
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null); // Job description document
  const [jobDescriptionText, setJobDescriptionText] = useState<string>(""); // Pasted JD text (case_only)
  const [jobTitleForAI, setJobTitleForAI] = useState<string>(""); // Minimal AI seed
  const [creatingAIJD, setCreatingAIJD] = useState<boolean>(false);
  const [enhancingAIJD, setEnhancingAIJD] = useState<boolean>(false);
  const [numCaseStudies, setNumCaseStudies] = useState(3);
  const [includeCompanyBackground, setIncludeCompanyBackground] = useState(true);

  const [formData, setFormData] = useState({
    duration: 60,
    days: 0,
    hours: 1,
    minutes: 0,
    contentLength: 'medium',
    numQuestions: 7,
    difficultyLevel: 'medium',
    instructions: "",
    caseStudyType: "Analytical",
    enablePsychometrics: false,
    psychometricTypes: {
      cognitiveAbility: false,
      personalityTraits: false,
      decisionMaking: false,
      problemSolving: false,
      leadershipPotential: false,
    }
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (planType === 'case_only') {
        setFetchingJobs(false);
        return;
      }
      try {
        setFetchingJobs(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/my-jobs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Accept-Language": i18n.language
          },
        });
        const data = await res.json();

        let jobsList = [];
        if (Array.isArray(data)) {
          jobsList = data;
        } else if (data?.jobs) {
          jobsList = data.jobs;
        } else if (data?.data) {
          jobsList = data.data;
        }

        const openJobs = jobsList.filter(job => {
          const deadline = new Date(job.application_deadline);
          const now = new Date();
          return (job.is_open === 1 || job.is_open === true) && deadline > now;
        });

        setJobs(openJobs);

        if (urlJobId) {
          setSelectedJob(urlJobId);
        }

      } catch (err) {
        console.error("Jobs fetch error:", err);
        toast({
          variant: "destructive",
          title: i18n.language === 'ar' ? "خطأ" : "Error",
          description: i18n.language === 'ar' ? "فشل تحميل الوظائف" : "Failed to load jobs",
        });
      } finally {
        setFetchingJobs(false);
      }
    };
    fetchJobs();
  }, [urlJobId, i18n.language, planType]);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "نوع ملف غير مدعوم" : "Unsupported File Type",
        description: i18n.language === 'ar' ? "يرجى تحميل ملف PDF أو Word أو PowerPoint" : "Please upload PDF, Word, or PowerPoint files",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "الملف كبير جداً" : "File Too Large",
        description: i18n.language === 'ar' ? "يجب أن يكون الملف أقل من 5MB" : "File must be less than 5MB",
      });
      return;
    }

    setUploadedFiles([...uploadedFiles, file]);

    if (e.target) {
      e.target.value = '';
    }

    toast({
      title: i18n.language === 'ar' ? "تم التحميل ✓" : "Uploaded ✓",
      description: `${file.name} ${i18n.language === 'ar' ? 'تم تحميله بنجاح' : 'uploaded successfully'}`,
    });
  };

  const handleJobDescriptionUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "نوع ملف غير مدعوم" : "Unsupported File Type",
        description: i18n.language === 'ar' ? "يرجى تحميل ملف PDF أو Word أو PowerPoint أو نص" : "Please upload PDF, Word, PowerPoint, or text files",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "الملف كبير جداً" : "File Too Large",
        description: i18n.language === 'ar' ? "يجب أن يكون الملف أقل من 5MB" : "File must be less than 5MB",
      });
      return;
    }

    setJobDescriptionFile(file);

    if (e.target) {
      e.target.value = '';
    }

    toast({
      title: i18n.language === 'ar' ? "تم التحميل ✓" : "Uploaded ✓",
      description: `${file.name} ${i18n.language === 'ar' ? 'تم تحميله بنجاح' : 'uploaded successfully'}`,
    });
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "الرجاء إدخال رابط صحيح" : "Please enter a valid URL",
      });
      return;
    }

    if (!isValidUrl(linkInput)) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "رابط غير صحيح" : "Invalid URL",
        description: i18n.language === 'ar' ? "تأكد من أن الرابط يبدأ بـ https:// أو http://" : "Make sure URL starts with https:// or http://",
      });
      return;
    }

    if (uploadedLinks?.some(link => link.url === linkInput)) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "مكرر" : "Duplicate",
        description: i18n.language === 'ar' ? "هذا الرابط مضاف بالفعل" : "This URL is already added",
      });
      return;
    }

    const linkData = {
      id: Date.now(),
      url: linkInput,
      title: new URL(linkInput).hostname,
      addedAt: new Date().toISOString()
    };

    setUploadedLinks([...uploadedLinks, linkData]);
    setLinkInput("");

    toast({
      title: i18n.language === 'ar' ? "تم الإضافة ✓" : "Added ✓",
      description: i18n.language === 'ar' ? "تم إضافة الرابط بنجاح" : "Link added successfully",
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLink();
    }
  };

  const removeLink = (linkId) => {
    setUploadedLinks(uploadedLinks.filter(link => link.id !== linkId));
  };

  const handleTogglePsychometrics = (enabled) => {
    setFormData(prev => ({
      ...prev,
      enablePsychometrics: enabled,
      psychometricTypes: enabled ? prev.psychometricTypes : {
        cognitiveAbility: false,
        personalityTraits: false,
        decisionMaking: false,
        problemSolving: false,
        leadershipPotential: false,
      }
    }));
  };

  const handleTogglePsychometricType = (typeId) => {
    setFormData(prev => ({
      ...prev,
      psychometricTypes: {
        ...prev.psychometricTypes,
        [typeId]: !prev.psychometricTypes[typeId]
      }
    }));
  };

  const handleGenerate = async () => {
    if (inputMode === "job" && !selectedJob) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "اختر وظيفة أولاً!" : "Please select a job first!",
      });
      return;
    }

    if (inputMode === "document" && !jobDescriptionFile && (!jobDescriptionText || jobDescriptionText.trim().length < 20)) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "أدخل أو حمّل وصف الوظيفة (20+ حرفاً)!" : "Please paste or upload a job description (20+ chars)!",
      });
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      if (inputMode === "job") {
        formDataToSend.append('jobId', selectedJob);
      } else {
        formDataToSend.append('isAssessment', 'true');
        if (jobDescriptionFile) {
          formDataToSend.append('jobDescription', jobDescriptionFile);
        }
        if (jobDescriptionText && jobDescriptionText.trim().length >= 20) {
          formDataToSend.append('jobDescriptionText', jobDescriptionText.trim());
        }
      }

      formDataToSend.append('duration', formData.duration.toString());
      formDataToSend.append('contentLength', formData.contentLength);
      formDataToSend.append('numQuestions', formData.numQuestions.toString());
      formDataToSend.append('difficultyLevel', formData.difficultyLevel);
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('numCaseStudies', numCaseStudies.toString());

      const apiCaseStudyType = caseStudyTypeMap[formData.caseStudyType] || 'scenario';
      formDataToSend.append('caseStudyType', apiCaseStudyType);
      formDataToSend.append('includeCompanyBackground', includeCompanyBackground ? 'true' : 'false');
      // Add psychometrics
      if (formData.enablePsychometrics) {
        const selectedPsychometrics = Object.keys(formData.psychometricTypes)
          .filter(key => formData.psychometricTypes[key]);
        formDataToSend.append('enablePsychometrics', 'true');
        formDataToSend.append('psychometricTypes', JSON.stringify(selectedPsychometrics));
      } else {
        formDataToSend.append('enablePsychometrics', 'false');
      }

      // Add links
      if (uploadedLinks.length > 0) {
        formDataToSend.append('links', JSON.stringify(uploadedLinks.map(l => l.url)));
      }

      uploadedFiles.forEach((file) => {
        formDataToSend.append('documents', file);
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Accept-Language": i18n.language
        },
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate case studies");
      }

      if (data?.generationBatch) {
        toast({
          title: i18n.language === 'ar' ? "تم الإنشاء بنجاح ✓" : "Generated Successfully ✓",
          description: i18n.language === 'ar' ? `تم إنشاء ${data.total} دراسات حالة` : `${data.total} case studies created`,
        });

        // For both job-based and assessment-based, navigate to cases page to edit/preview
        navigate(`/recruiter-dashboard/cases?batch=${data.generationBatch}`);
      } else {
        throw new Error("No generation batch returned");
      }
    } catch (err) {
      console.error("Generate error:", err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: err.message || (i18n.language === 'ar' ? "فشل الطلب" : "Request failed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedJobDetails = jobs.find(j => String(j.id) === String(selectedJob));
  const selectedPsychometricCount = Object.values(formData.psychometricTypes).filter(Boolean).length;

  if (fetchingJobs) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-[#75A400]" />
          <span className="ml-2 text-gray-600">
            {i18n.language === 'ar' ? 'جاري تحميل الوظائف...' : 'Loading jobs...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
      <CaseStudyLoadingScreen isLoading={loading} progress={0} message="" />
      <TopBar />
      <div className="flex flex-1">
        <Sidebar activeItem="cases" />

        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-merit-dark mb-4 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {i18n.language === 'ar' ? 'العودة' : 'Back'}
                </span>
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-merit-dark flex items-center gap-3 mb-2">
                    <Sparkles className="w-8 h-8 text-[#75A400]" />
                    {i18n.language === 'ar' ? 'إنشاء دراسة حالة' : 'Generate Case Study'}
                  </h1>
                  <p className="text-gray-600">
                    {i18n.language === 'ar'
                      ? 'أنشئ دراسات حالة فريدة بالذكاء الاصطناعي بخيارات مخصصة'
                      : 'Create unique AI-driven case studies with custom settings'}
                  </p>
                </div>
                <div className="h-1 w-40 bg-gradient-to-r from-[#C8F55A] to-[#75A400] rounded-full hidden md:block"></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
              <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-8">

                {/* Section 1: Job Selection or Job Description Upload */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">1</span>
                    {planType === 'case_only'
                      ? (i18n.language === 'ar' ? 'ارفع أو ألصق وصف الوظيفة' : 'Upload or Paste Job Description')
                      : (i18n.language === 'ar' ? 'اختر وظيفة' : 'Select Job')}
                  </h2>

                  {/* No toggle: plan determines mode */}

                  {inputMode === "job" && planType !== 'case_only' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        {i18n.language === 'ar' ? 'الوظيفة المطلوبة' : 'Required Job'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium"
                        disabled={!!urlJobId}
                        required
                      >
                        <option value="">{i18n.language === 'ar' ? '-- اختر وظيفة --' : '-- Select a Job --'}</option>
                        {jobs.map((job) => (
                          <option key={job.id || job._id} value={job.id || job._id}>
                            {job.title || "Untitled Job"}
                          </option>
                        ))}
                      </select>
                      {urlJobId && selectedJobDetails && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          ✓ {selectedJobDetails.title}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {i18n.language === 'ar' ? 'ألصق وصف الوظيفة' : 'Paste Job Description'}
                        </label>
                        <textarea
                          rows={6}
                          value={jobDescriptionText}
                          onChange={(e) => setJobDescriptionText(e.target.value)}
                          placeholder={i18n.language === 'ar' ? 'ألصق وصف الوظيفة هنا...' : 'Paste the job description here...'}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {i18n.language === 'ar' ? 'يمكنك أيضاً الرفع أو الإنشاء بالذكاء الاصطناعي' : 'You can also upload a file or create with AI'}
                        </p>
                      </div>

                      {/* AI Enhancement Section */}
                      <div className="mb-6 bg-gradient-to-r from-emerald-50 to-lime-50 border border-lime-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-[#75A400]" />
                          <span className="text-sm font-semibold text-gray-900">
                            {i18n.language === 'ar' ? 'تحسين وصف الوظيفة بالذكاء الاصطناعي' : 'Enhance Job Description with AI'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 mb-3">
                          {i18n.language === 'ar'
                            ? 'الذكاء الاصطناعي سيحسن الوصف الحالي بإضافة تفاصيل وهيكل أفضل'
                            : 'AI will enhance your current description with better structure and details'}
                        </p>

                        <button
                          type="button"
                          disabled={
                            enhancingAIJD ||
                            (!jobDescriptionText || jobDescriptionText.trim().length < 20)
                          }
                          onClick={async () => {
                            try {
                              setEnhancingAIJD(true);
                              const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/enhance`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                                  'Accept-Language': i18n.language
                                },
                                body: JSON.stringify({
                                  jobDescription: jobDescriptionText.trim(),
                                  language: i18n.language
                                })
                              });
                              const result = await resp.json();
                              if (!resp.ok) {
                                throw new Error(result.error || 'AI enhancement failed');
                              }

                              // Merge enhanced content with original
                              const enhancedDescription = result?.description || result?.enhanced_description || '';
                              const enhancedResponsibilities = result?.key_responsibilities || result?.responsibilities || '';

                              // Combine: keep original + add enhanced sections
                              const combined = `${jobDescriptionText.trim()}\n\n${enhancedDescription}${enhancedResponsibilities ? '\n\nKey Responsibilities:\n' + enhancedResponsibilities : ''}`.trim();

                              setJobDescriptionText(combined);

                              toast({
                                title: i18n.language === 'ar' ? 'تم التحسين ✓' : 'Enhanced ✓',
                                description: i18n.language === 'ar'
                                  ? 'تم تحسين وصف الوظيفة بنجاح'
                                  : 'Job description enhanced successfully'
                              });
                            } catch (e) {
                              toast({
                                variant: 'destructive',
                                title: i18n.language === 'ar' ? 'فشل التحسين' : 'Enhancement failed',
                                description: e?.message || (i18n.language === 'ar' ? 'تعذر تحسين الوصف' : 'Could not enhance description')
                              });
                            } finally {
                              setEnhancingAIJD(false);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all ${enhancingAIJD || (!jobDescriptionText || jobDescriptionText.trim().length < 20)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-[#C8F55A] text-merit-dark hover:bg-[#b4e24c]'
                            }`}
                        >
                          {enhancingAIJD ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {i18n.language === 'ar' ? 'جاري التحسين...' : 'Enhancing...'}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              {i18n.language === 'ar' ? 'تحسين الوصف' : 'Enhance Description'}
                            </>
                          )}
                        </button>

                        <p className="text-xs text-gray-500 mt-2">
                          {i18n.language === 'ar'
                            ? 'ستضاف التحسينات إلى الوصف الحالي في الحقل أعلاه'
                            : 'Enhancements will be added to your current description'}
                        </p>
                      </div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {i18n.language === 'ar' ? 'أو ارفع وصف الوظيفة (اختياري)' : 'Or upload a job description (optional)'}

                      </label>
                      <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C8F55A] hover:bg-lime-50/30 transition-all duration-200 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          <UploadIconComponent className="w-8 h-8 text-gray-400 mb-3" />
                          <span className="text-sm font-semibold text-gray-700 mb-1">
                            {i18n.language === 'ar' ? 'انقر لتحميل وثيقة وصف الوظيفة' : 'Click to upload job description'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {i18n.language === 'ar' ? 'أو اسحب وأفلت' : 'or drag and drop'}
                          </span>
                          <span className="text-xs text-gray-400 mt-2">
                            PDF, Word, PowerPoint, TXT - {i18n.language === 'ar' ? 'حد أقصى 5MB' : 'max 5MB'}
                          </span>
                        </div>
                        <input
                          type="file"
                          onChange={handleJobDescriptionUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        />
                      </label>
                      {jobDescriptionFile && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-lime-50 to-transparent border border-lime-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-lime-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{jobDescriptionFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(jobDescriptionFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setJobDescriptionFile(null)}
                              className="ml-2 p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Section 1b: Number of Case Studies to Generate */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">1b</span>
                    {i18n.language === 'ar' ? 'عدد دراسات الحالة' : 'Number of Case Studies'}
                  </h2>

                  <p className="text-sm text-gray-600 mb-4">
                    {i18n.language === 'ar'
                      ? 'كم عدد خيارات دراسة الحالة التي تريد إنشاءها؟ يمكنك اختيار خيار واحد أو خيارات متعددة'
                      : 'How many case study options would you like to generate? Choose 1, 2, or 3 variants to compare.'}
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumCaseStudies(num)}
                        className={`py-4 px-6 rounded-lg font-semibold transition-all duration-200 border-2 flex flex-col items-center justify-center gap-2 ${numCaseStudies === num
                            ? 'bg-[#C8F55A] border-[#75A400] text-merit-dark shadow-lg'
                            : 'border-gray-300 text-gray-700 hover:border-[#C8F55A] bg-white'
                          }`}
                      >
                        <div className="text-2xl font-bold">{num}</div>
                        <div className="text-xs opacity-75">
                          {num === 1
                            ? (i18n.language === 'ar' ? 'خيار واحد' : '1 Option')
                            : num === 2
                              ? (i18n.language === 'ar' ? 'خياران' : '2 Options')
                              : (i18n.language === 'ar' ? 'ثلاثة خيارات' : '3 Options')}
                        </div>
                        <div className="text-xs opacity-60">
                          {num === 1
                            ? (i18n.language === 'ar' ? '~ سريع' : '~ Fast')
                            : num === 2
                              ? (i18n.language === 'ar' ? '~ متوازن' : '~ Balanced')
                              : (i18n.language === 'ar' ? '~ شامل' : '~ Comprehensive')}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-gray-700">
                      <strong>{i18n.language === 'ar' ? '💡 نصيحة: ' : '💡 Tip: '}</strong>
                      {i18n.language === 'ar'
                        ? 'اختر 3 خيارات للمقارنة والاختيار من بينها، أو خيار واحد إذا كان لديك جدول زمني ضيق'
                        : 'Choose 3 options to compare and select the best, or 1 option if you\'re on a tight timeline.'}
                    </p>
                  </div>
                </div>
                {/* Section 2: Case Study Configuration */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">2</span>
                    {i18n.language === 'ar' ? 'تكوين دراسة الحالة' : 'Case Study Configuration'}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        {i18n.language === 'ar' ? 'نوع دراسة الحالة' : 'Case Study Type'}
                      </label>
                      <select
                        value={formData.caseStudyType}
                        onChange={(e) => setFormData({ ...formData, caseStudyType: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium"
                      >
                        <option value="Analytical">Analytical</option>
                        <option value="Scenario-Based">Scenario-Based</option>
                        <option value="Technical">Technical</option>
                        <option value="Creative">Creative</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {i18n.language === 'ar' ? 'المدة الإجمالية' : 'Total Duration'}
                    </label>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">
                          {i18n.language === 'ar' ? 'الأيام' : 'Days'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={formData.days}
                          onChange={(e) => {
                            const days = Number(e.target.value);
                            const totalMinutes = calculateTotalMinutes(days, formData.hours, formData.minutes);
                            setFormData({
                              ...formData,
                              days,
                              duration: totalMinutes
                            });
                          }}
                          className="w-full border-2 border-gray-300 rounded-lg px-2 py-2 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium text-center text-sm"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">
                          {i18n.language === 'ar' ? 'الساعات' : 'Hours'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={formData.hours}
                          onChange={(e) => {
                            const hours = Number(e.target.value);
                            const totalMinutes = calculateTotalMinutes(formData.days, hours, formData.minutes);
                            setFormData({
                              ...formData,
                              hours,
                              duration: totalMinutes
                            });
                          }}
                          className="w-full border-2 border-gray-300 rounded-lg px-2 py-2 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium text-center text-sm"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">
                          {i18n.language === 'ar' ? 'الدقائق' : 'Minutes'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={formData.minutes}
                          onChange={(e) => {
                            const minutes = Number(e.target.value);
                            const totalMinutes = calculateTotalMinutes(formData.days, formData.hours, minutes);
                            setFormData({
                              ...formData,
                              minutes,
                              duration: totalMinutes
                            });
                          }}
                          className="w-full border-2 border-gray-300 rounded-lg px-2 py-2 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium text-center text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Content Settings */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">3</span>
                    {i18n.language === 'ar' ? 'إعدادات المحتوى' : 'Content Settings'}
                  </h2>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {i18n.language === 'ar' ? 'طول المحتوى' : 'Content Length'}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'short', label: i18n.language === 'ar' ? 'قصير' : 'Short', words: '300-500' },
                        { key: 'medium', label: i18n.language === 'ar' ? 'متوسط' : 'Medium', words: '600-900' },
                        { key: 'long', label: i18n.language === 'ar' ? 'طويل' : 'Long', words: '1000-1500' }
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, contentLength: option.key })}
                          className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border-2 ${formData.contentLength === option.key
                              ? 'bg-[#C8F55A] border-[#75A400] text-merit-dark shadow-md'
                              : 'border-gray-300 text-gray-700 hover:border-[#C8F55A] bg-white'
                            }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-xs mt-1 opacity-75">{option.words}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {i18n.language === 'ar' ? 'عدد الأسئلة' : 'Number of Questions'}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.numQuestions}
                        onChange={(e) => setFormData({ ...formData, numQuestions: Number(e.target.value) })}
                        className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C8F55A]"
                      />
                      <div className="w-12 h-12 bg-[#C8F55A] rounded-lg flex items-center justify-center font-bold text-merit-dark text-lg shadow-md">
                        {formData.numQuestions}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1 {i18n.language === 'ar' ? 'سؤال' : 'Question'}</span>
                      <span>10 {i18n.language === 'ar' ? 'أسئلة' : 'Questions'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {i18n.language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level'}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'easy', label: i18n.language === 'ar' ? 'سهل' : 'Easy', desc: i18n.language === 'ar' ? 'واضح ومباشر' : 'Clear & straightforward' },
                        { key: 'medium', label: i18n.language === 'ar' ? 'متوسط' : 'Medium', desc: i18n.language === 'ar' ? 'متوازن وواقعي' : 'Balanced & realistic' },
                        { key: 'hard', label: i18n.language === 'ar' ? 'صعب' : 'Hard', desc: i18n.language === 'ar' ? 'معقد مع تحديات' : 'Complex & challenging' }
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, difficultyLevel: option.key })}
                          className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border-2 ${formData.difficultyLevel === option.key
                              ? 'bg-[#C8F55A] border-[#75A400] text-merit-dark shadow-md'
                              : 'border-gray-300 text-gray-700 hover:border-[#C8F55A] bg-white'
                            }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-xs mt-1 opacity-75">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4: Psychometric Assessments */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">4</span>
                    {i18n.language === 'ar' ? 'التقييمات السيكومترية' : 'Psychometric Assessments'}
                  </h2>

                  <div className="bg-gradient-to-r from-lime-50 via-white to-lime-100 border border-lime-200 rounded-xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C8F55A] flex items-center justify-center text-merit-dark">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {i18n.language === 'ar' ? 'تفعيل التقييمات السيكومترية' : 'Enable Psychometric Insights'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {i18n.language === 'ar'
                              ? 'أضف تحليلات سيكومترية لتقييم المهارات الذهنية والسلوكية'
                              : 'Add psychometric insights to evaluate cognitive and behavioural skills'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePsychometrics(!formData.enablePsychometrics)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${formData.enablePsychometrics
                            ? 'bg-merit-dark text-white hover:bg-merit-dark/90 shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-merit-dark'
                          }`}
                      >
                        {formData.enablePsychometrics
                          ? (i18n.language === 'ar' ? 'نشط' : 'Enabled')
                          : (i18n.language === 'ar' ? 'غير نشط' : 'Enable')}
                      </button>
                    </div>

                    <div className={`transition-opacity ${formData.enablePsychometrics ? 'opacity-100' : 'opacity-60'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {i18n.language === 'ar' ? 'حدد أنواع التقييم' : 'Select assessment types'}
                        </h4>
                        <span className="text-xs font-semibold text-gray-600">
                          {i18n.language === 'ar'
                            ? `${selectedPsychometricCount} من 5 خيارات`
                            : `${selectedPsychometricCount} of 5 selected`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { id: 'cognitiveAbility', label: i18n.language === 'ar' ? 'القدرات الإدراكية' : 'Cognitive Ability', desc: i18n.language === 'ar' ? 'قياس التفكير التحليلي والمنطقي' : 'Measures analytical and logical thinking' },
                          { id: 'personalityTraits', label: i18n.language === 'ar' ? 'السمات الشخصية' : 'Personality Traits', desc: i18n.language === 'ar' ? 'يكشف عن أسلوب العمل والدوافع' : 'Reveals working style and motivators' },
                          { id: 'decisionMaking', label: i18n.language === 'ar' ? 'اتخاذ القرار' : 'Decision Making', desc: i18n.language === 'ar' ? 'يقيّم الحكم في المواقف الحساسة' : 'Assesses judgement in critical scenarios' },
                          { id: 'problemSolving', label: i18n.language === 'ar' ? 'حل المشكلات' : 'Problem Solving', desc: i18n.language === 'ar' ? 'يختبر التفكير الإبداعي والاستراتيجي' : 'Tests creative and strategic thinking' },
                          { id: 'leadershipPotential', label: i18n.language === 'ar' ? 'إمكانات القيادة' : 'Leadership Potential', desc: i18n.language === 'ar' ? 'يقيّم التأثير والتوجيه' : 'Evaluates influence and direction' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleTogglePsychometricType(option.id)}
                            disabled={!formData.enablePsychometrics}
                            className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${formData.psychometricTypes[option.id]
                                ? 'border-merit-dark bg-white shadow-md'
                                : 'border-gray-200 bg-white hover:border-merit-dark/40'
                              } ${!formData.enablePsychometrics ? 'cursor-not-allowed opacity-70' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                              </div>
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${formData.psychometricTypes[option.id]
                                  ? 'bg-merit-dark text-white border-merit-dark'
                                  : 'border-gray-300 text-gray-500'
                                }`}
                              >
                                {formData.psychometricTypes[option.id] ? '✓' : ''}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {!formData.enablePsychometrics && (
                      <p className="text-xs text-gray-500">
                        {i18n.language === 'ar'
                          ? 'فعّل التقييمات السيكومترية لتخصيص هذه الخيارات وتحسين نتائج الترشيح.'
                          : 'Enable psychometrics to customise these options and enrich your shortlist outcomes.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 5: Document Upload & Links */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">5</span>
                    {i18n.language === 'ar' ? 'المستندات والروابط الإضافية' : 'Additional Documents & Links'}
                  </h2>

                  <p className="text-sm text-gray-600 mb-6">
                    {i18n.language === 'ar'
                      ? 'تحميل ملفات أو لصق روابط (موقع ويب، وصف وظيفة، مستندات) لتحسين دراسات الحالة (اختياري)'
                      : 'Upload files or paste links (websites, job descriptions, documents) to enhance case studies (optional)'}
                  </p>

                  {/* File Upload Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{i18n.language === 'ar' ? 'تحميل الملفات' : 'Upload Files'}</h3>
                    <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C8F55A] hover:bg-lime-50/30 transition-all duration-200 bg-gray-50">
                      <div className="flex flex-col items-center justify-center">
                        <UploadIconComponent className="w-8 h-8 text-gray-400 mb-3" />
                        <span className="text-sm font-semibold text-gray-700 mb-1">
                          {i18n.language === 'ar' ? 'انقر لتحميل المستندات' : 'Click to upload documents'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {i18n.language === 'ar' ? 'أو اسحب وأفلت' : 'or drag and drop'}
                        </span>
                        <span className="text-xs text-gray-400 mt-2">
                          PDF, Word, PowerPoint - {i18n.language === 'ar' ? 'حد أقصى 5MB' : 'max 5MB'}
                        </span>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        multiple
                      />
                    </label>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">
                            {i18n.language === 'ar' ? 'الملفات المحملة' : 'Uploaded Files'} ({uploadedFiles.length})
                          </p>
                        </div>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-lime-50 to-transparent border border-lime-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-lime-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Link Input Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      {i18n.language === 'ar' ? 'أضف رابط سريع' : 'Quick Link Addition'}
                    </h3>

                    <div className="flex gap-2 mb-4">
                      <input
                        type="url"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={i18n.language === 'ar'
                          ? 'https://example.com/job-description'
                          : 'https://example.com/job-description'}
                        className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-gray-900 font-medium"
                        disabled={validatingUrl}
                      />
                      <button
                        type="button"
                        onClick={handleAddLink}
                        disabled={validatingUrl || !linkInput.trim()}
                        className={`px-6 py-3 font-semibold rounded-lg flex justify-center items-center gap-2 transition-all duration-200 ${validatingUrl || !linkInput.trim()
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                          }`}
                      >
                        {validatingUrl ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {i18n.language === 'ar' ? 'جاري...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            {i18n.language === 'ar' ? 'إضافة' : 'Add'}
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 mb-4">
                      {i18n.language === 'ar'
                        ? 'اضغط Enter أو انقر على زر الإضافة. يدعم المواقع والمستندات والمدونات والصفحات العامة'
                        : 'Press Enter or click Add. Supports websites, documents, blogs, and public pages'}
                    </p>

                    {uploadedLinks && uploadedLinks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">
                          {i18n.language === 'ar' ? 'الروابط المضافة' : 'Added Links'} ({uploadedLinks.length})
                        </p>
                        {uploadedLinks.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <LinkIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {link.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {link.url}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLink(link.id)}
                              className="ml-2 p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        {i18n.language === 'ar' ? '✓ الأنواع المدعومة:' : '✓ Supported Types:'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>{i18n.language === 'ar' ? '• صفحات الويب العامة' : '• Public web pages'}</div>
                        <div>{i18n.language === 'ar' ? '• وصف الوظيفة' : '• Job descriptions'}</div>
                        <div>{i18n.language === 'ar' ? '• المدونات والمقالات' : '• Blogs & articles'}</div>
                        <div>{i18n.language === 'ar' ? '• المستندات المشاركة' : '• Shared documents'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5b: Company Background Option */}
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">5b</span>
                    {i18n.language === 'ar' ? 'خيارات إضافية' : 'Additional Options'}
                  </h2>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCompanyBackground}
                        onChange={(e) => setIncludeCompanyBackground(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-gray-300 cursor-pointer accent-[#C8F55A]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {i18n.language === 'ar' ? 'تضمين خلفية الشركة' : 'Include Company Background'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {i18n.language === 'ar'
                            ? 'استخرج وأضف معلومات خلفية عن الشركة من الوثائق والروابط'
                            : 'Extract and include company background info from documents and links'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section 6: Special Instructions */}
                <div className="pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">6</span>
                    {i18n.language === 'ar' ? 'تعليمات خاصة' : 'Special Instructions'}
                  </h2>

                  <textarea
                    rows={4}
                    placeholder={i18n.language === 'ar'
                      ? 'مثال: ركز على استراتيجية التسويق الرقمي مع التحليل المالي والعائد على الاستثمار...'
                      : "E.g., 'Focus on digital marketing strategy with financial analysis and ROI calculations...'"}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all text-gray-900 font-medium resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {i18n.language === 'ar' ? 'أضف أي متطلبات محددة أو تركيزات خاصة' : 'Add any specific requirements or focus areas'}
                  </p>
                </div>

                {/* Generate Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-all duration-200"
                  >
                    {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (inputMode === "job" && !selectedJob) ||
                      (inputMode === "document" && !jobDescriptionFile && (!jobDescriptionText || jobDescriptionText.trim().length < 20))
                    }
                    className={`flex-1 px-6 py-3 font-semibold rounded-lg flex justify-center items-center gap-2 transition-all duration-200 ${loading ||
                        (inputMode === "job" && !selectedJob) ||
                        (inputMode === "document" && !jobDescriptionFile && (!jobDescriptionText || jobDescriptionText.trim().length < 20))
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark shadow-lg hover:shadow-xl'
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        {i18n.language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {i18n.language === 'ar'
                          ? `إنشاء ${numCaseStudies} ${numCaseStudies === 1 ? 'خيار' : 'خيارات'}`
                          : `Generate ${numCaseStudies} ${numCaseStudies === 1 ? 'Option' : 'Options'}`}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {!loading && (
              <div className="mt-8 bg-gradient-to-r from-lime-50 to-amber-50 rounded-xl p-6 border border-lime-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  {i18n.language === 'ar' ? 'نصائح للحصول على أفضل النتائج' : 'Tips for Best Results'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>{i18n.language === 'ar' ? 'حمل وثائق تنظيمية فعلية أو الصق روابط لجعل دراسات الحالة أكثر واقعية' : 'Upload actual documents or paste links to make case studies more realistic'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>{i18n.language === 'ar' ? 'اختر صعوبة متوسطة إذا كنت غير متأكد - يمكنك التعديل لاحقاً' : 'Choose medium difficulty if unsure - you can adjust later'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>{i18n.language === 'ar' ? 'استخدم الروابط للحصول على السياق بسرعة بدلاً من تحميل الملفات' : 'Use links to get context quickly instead of uploading files'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>{i18n.language === 'ar' ? 'ستحصل على 3 خيارات مختلفة للاختيار من بينها' : 'You\'ll receive 3 different options to choose from'}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}