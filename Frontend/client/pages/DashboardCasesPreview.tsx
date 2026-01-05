import { Button } from "@/components/ui/button";
import Sidebar from "@/components/dashboard/Sidebar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, History, ArrowLeft, Trash2, CheckCircle2, Share2, Edit3, Save, Download, Check, Code, Video, FileText, Calculator, Database, PenTool, Brain, MessageSquare } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

export default function DashboardCasesPreview() {
  const navigate = useNavigate();
  const { jobId, caseStudyId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const selectedId = searchParams.get('selected');

  const [cases, setCases] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedForPublish, setSelectedForPublish] = useState(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showNavigationConfirm, setShowNavigationConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [nextBackPath, setNextBackPath] = useState(null);

  const token = localStorage.getItem("token");

  const isJobSpecific = !!jobId;
  const isSingleCaseStudy = !!caseStudyId;
  const hasMultipleInReview = cases.filter(c => c.status === 'in_review' || c.status === 'draft').length > 1;

  useEffect(() => {
    if (cases.length === 1 && !selectedForPublish && cases[0].status !== 'published') {
      setSelectedForPublish(cases[0].id);
    }
  }, [cases]);

  const fetchSingleCaseStudy = async () => {
    try {
      if (!token || !caseStudyId) return;
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/${caseStudyId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch case study");

      const data = await res.json();
      if (data.caseStudy) {
        setCases([data.caseStudy]);
      }
    } catch (err) {
      console.error('Error fetching case study:', err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل جلب دراسة الحالة" : "Failed to fetch case study",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      if (!token) return;
      setLoading(true);

      let url = `${import.meta.env.VITE_API_URL}/api/case-studies/my`;

      if (isJobSpecific) {
        url = `${import.meta.env.VITE_API_URL}/api/case-studies/job/${jobId}`;
      } else if (selectedId) {
        // If we have a selected ID, first fetch that case study to get its batch
        const selectedRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/case-studies/${selectedId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "Accept-Language": i18n.language
            },
          }
        );
        if (selectedRes.ok) {
          const selectedData = await selectedRes.json();
          const batchId = selectedData.caseStudy?.generation_batch;
          
          if (batchId) {
            // Fetch all case studies from the same batch
            url = `${import.meta.env.VITE_API_URL}/api/case-studies/batch/${batchId}`;
          }
        }
      }

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
      });

      if (!res.ok) throw new Error("Failed to fetch case studies");

      const data = await res.json();
      let caseStudiesArray = data.caseStudies || [];

      if (isJobSpecific) {
        setCases(caseStudiesArray);
      } else {
        // Only show draft/in_review cases
        setCases(caseStudiesArray.filter((c) => c.status === 'in_review' || c.status === 'draft'));
      }
    } catch (err) {
      console.error('Error fetching case studies:', err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل جلب دراسات الحالة" : "Failed to fetch case studies",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    if (!isJobSpecific) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/my-jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
      });
      const data = await res.json();
      const jobs = data.jobs || data;
      const currentJob = jobs.find((j) => String(j.id) === String(jobId));
      if (currentJob) setJob(currentJob);
    } catch (err) {
      console.error("Error fetching job:", err);
    }
  };

  // Prevent navigation when publishing - Browser guard only
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isPublishing) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPublishing]);

  useEffect(() => {
    if (isSingleCaseStudy) {
      fetchSingleCaseStudy();
    } else {
      fetchCases();
      if (isJobSpecific) {
        fetchJobDetails();
      }
    }
  }, [jobId, caseStudyId, selectedId, i18n.language]);

  const handlePublish = async () => {
    if (!selectedForPublish) return;
    setShowPublishDialog(false);

    try {
      setIsPublishing(true);
      setPublishing(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/publish/bulk`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language
          },
          body: JSON.stringify({ caseStudyIds: [selectedForPublish] }),
        }
      );

      if (!res.ok) throw new Error("Failed to publish case study");

      const otherCases = cases.filter(c => c.id !== selectedForPublish && (c.status === 'in_review' || c.status === 'draft'));

      for (const caseStudy of otherCases) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/case-studies/${caseStudy.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": i18n.language
            },
          }
        );
      }

      toast({
        title: i18n.language === 'ar' ? "نجاح ✨" : "Success ✨",
        description: i18n.language === 'ar' ? "تم نشر دراسة الحالة بنجاح!" : "Case study published successfully!",
        variant: "default",
      });

      // Clear states before navigating
      setSelectedForPublish(null);
      setCases([]);

      // Get planType from localStorage
      const planType = localStorage.getItem('planType') || 'full';

      // Determine navigation based on plan type
      let navigationPath = '/recruiter-dashboard/case-study-assessments';
      if (planType === 'full') {
        navigationPath = '/recruiter-dashboard/my-jobs';
      }

      // Use a small delay to ensure state updates complete
      setTimeout(() => {
        setIsPublishing(false);
        setPublishing(false);
        navigate(navigationPath, { replace: true });
      }, 100);

    } catch (err) {
      console.error("Error publishing:", err);
      setIsPublishing(false);
      setPublishing(false);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل نشر دراسة الحالة" : "Failed to publish case study",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCaseId) return;
    setShowDeleteDialog(false);

    try {
      setDeleting(selectedCaseId);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/${selectedCaseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete case study");

      toast({
        title: i18n.language === 'ar' ? "نجاح" : "Success",
        description: i18n.language === 'ar' ? "تم حذف دراسة الحالة بنجاح!" : "Case study deleted successfully!",
        variant: "default",
      });

      setCases((prev) => prev.filter((c) => c.id !== selectedCaseId));
    } catch (err) {
      console.error("Error deleting:", err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: err.message || (i18n.language === 'ar' ? "فشل حذف دراسة الحالة" : "Failed to delete case study"),
      });
    } finally {
      setDeleting(null);
    }
  };

  const getBackUrl = () => {
    if (isSingleCaseStudy) {
      return "/recruiter-dashboard/case-study-assessments";
    }
    if (isJobSpecific) {
      return "/recruiter-dashboard/my-jobs";
    }
    // Get batchId from the first case study
    const firstCase = cases.length > 0 ? cases[0] : null;
    const batchId = firstCase?.generation_batch;

    if (batchId) {
      return `/recruiter-dashboard/cases?batch=${batchId}`;
    }
    return "/recruiter-dashboard/cases";
  };

  const handleNavigateAway = (path) => {
    if (isPublishing) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "الرجاء الانتظار" : "Please Wait",
        description: i18n.language === 'ar' ? "جاري نشر دراسة الحالة..." : "Publishing case study...",
      });
      return;
    }

    // Show confirmation before going back
    setNextBackPath(path);
    setShowBackConfirm(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e1e4e8]">
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.language === 'ar' ? "نشر دراسة الحالة المختارة؟" : "Publish Selected Case Study?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.language === 'ar'
                ? "سيؤدي هذا إلى نشر دراسة الحالة المختارة وحذف جميع الخيارات الأخرى. لا يمكن التراجع عن هذا الإجراء."
                : "This will publish the selected case study and delete all other options. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.language === 'ar' ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark">
              {i18n.language === 'ar' ? "نعم، نشر" : "Yes, Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.language === 'ar' ? "حذف دراسة الحالة؟" : "Delete Case Study?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.language === 'ar'
                ? "لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد من رغبتك في حذف دراسة الحالة هذه؟"
                : "This action cannot be undone. Are you sure you want to delete this case study?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.language === 'ar' ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">
              {i18n.language === 'ar' ? "نعم، حذف" : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.language === 'ar' ? "هل تريد العودة للتحرير؟" : "Go Back to Edit?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.language === 'ar'
                ? "هل تريد العودة إلى شاشة التحرير لإجراء المزيد من التعديلات على دراسات الحالة؟"
                : "Do you want to go back to the edit screen to make more changes to the case studies?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.language === 'ar' ? "البقاء" : "Stay"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowBackConfirm(false);
                if (nextBackPath) navigate(nextBackPath);
              }}
              className="bg-merit-green text-merit-dark hover:bg-merit-green/90"
            >
              {i18n.language === 'ar' ? "نعم، العودة" : "Yes, Go Back"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPublishing} onOpenChange={() => { }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.language === 'ar' ? "جاري النشر..." : "Publishing..."}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.language === 'ar'
                ? "يرجى عدم مغادرة الصفحة أثناء النشر. هذا قد يستغرق بضع لحظات."
                : "Please don't leave the page while publishing. This may take a few moments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <TopBar />
      <div className="flex min-h-screen bg-transparent">
        <Sidebar activeItem="cases" />
        <div className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateAway(getBackUrl())}
                className="gap-2 mb-4 text-gray-600 hover:text-gray-900"
                disabled={isPublishing}
              >
                <ArrowLeft className="w-4 h-4" /> {i18n.language === 'ar' ? "رجوع" : "Back"}
              </Button>

              {hasMultipleInReview && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        {i18n.language === 'ar' ? "خيارات متعددة متاحة" : "Multiple Options Available"}
                      </h3>
                      <p className="text-sm text-blue-700">
                        {i18n.language === 'ar'
                          ? "اختر دراسة الحالة المفضلة لديك للنشر. سيتم حذف الخيارات الأخرى تلقائياً."
                          : "Select your preferred case study to publish. The other options will be automatically deleted."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {i18n.language === 'ar' ? "معاينة دراسة الحالة المولدة" : "Preview Generated Case Studies"}
              </h1>
              <p className="text-sm text-gray-600">
                {i18n.language === 'ar'
                  ? "راجع معاينة دراسة الحالة المولدة بواسطة الذكاء الاصطناعي قبل مشاركتها مع المتقدمين"
                  : "Review trusted preview of AI-generated case study before sharing with applicants"}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{i18n.language === 'ar' ? "جاري تحميل دراسات الحالة..." : "Loading case studies..."}</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">
                  {isSingleCaseStudy
                    ? (i18n.language === 'ar' ? "لم يتم العثور على دراسة الحالة" : "Case study not found")
                    : isJobSpecific
                      ? (i18n.language === 'ar' ? "لم يتم العثور على دراسة حالة لهذه الوظيفة" : "No case study found for this job")
                      : (i18n.language === 'ar' ? "لا توجد دراسات حالة جاهزة للمعاينة" : "No case studies ready for preview")}
                </p>
              </div>
            ) : (
              <>
                {cases.map((caseStudy, idx) => {
                  const isSelected = selectedForPublish === caseStudy.id;
                  const canSelect = caseStudy.status === 'in_review' || caseStudy.status === 'draft';

                  return (
                    <div
                      key={caseStudy.id}
                      className={`bg-white border-2 rounded-lg mb-6 overflow-hidden transition-all cursor-pointer ${isSelected
                        ? 'border-[#C8F55A] shadow-lg'
                        : canSelect && hasMultipleInReview
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-200'
                        }`}
                      onClick={() => {
                        if (canSelect && hasMultipleInReview) {
                          setSelectedForPublish(caseStudy.id);
                        }
                      }}
                    >
                      {/* Case Study Header */}
                      <div className="bg-[#E8F5E3] px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {hasMultipleInReview && canSelect && (
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                                ? 'border-[#C8F55A] bg-[#C8F55A]'
                                : 'border-gray-300'
                                }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-merit-dark" />}
                              </div>
                            )}
                            <div>
                              <span className="inline-block text-xs font-semibold bg-[#C8F55A] text-merit-dark rounded px-2 py-1 mb-2">
                                {i18n.language === 'ar' ? "دراسة الحالة #" : "Case Study #"}{idx + 1}
                              </span>
                              {isSelected && hasMultipleInReview && (
                                <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 rounded px-2 py-1 mb-2 ml-2">
                                  {i18n.language === 'ar' ? "مختارة للنشر" : "Selected for Publish"}
                                </span>
                              )}
                              {caseStudy.customQuestions && caseStudy.customQuestions.length > 0 && (
                                <span className="inline-block text-xs font-semibold bg-purple-100 text-purple-700 rounded px-2 py-1 mb-2 ml-2">
                                  📝 {caseStudy.customQuestions.length} {i18n.language === 'ar' ? 'تقييم' : 'assessments'}
                                </span>
                              )}
                              <h2 className="text-xl font-bold text-gray-900">{caseStudy.title}</h2>
                            </div>
                          </div>
                          {(isJobSpecific || isSingleCaseStudy) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCaseId(caseStudy.id);
                                setShowDeleteDialog(true);
                              }}
                              disabled={deleting === caseStudy.id}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Case Study Content */}
                      <div className="p-6 space-y-8">
                        {/* Background Section */}
                        {caseStudy.description && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              {i18n.language === 'ar' ? "الخلفية:" : "Background:"}
                            </h3>
                            <div className="text-gray-700 leading-relaxed space-y-3 whitespace-pre-wrap break-words">
                              {caseStudy.description}
                            </div>
                          </div>
                        )}

                        {/* Scenario Section */}
                        {caseStudy.instructions && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              {i18n.language === 'ar' ? "السيناريو:" : "Scenario:"}
                            </h3>
                            <div className="text-gray-700 leading-relaxed space-y-3 whitespace-pre-wrap break-words">
                              {caseStudy.instructions}
                            </div>
                          </div>
                        )}

                        {/* Questions Section */}
                        {caseStudy.customQuestions && caseStudy.customQuestions.length > 0 ? (
                          <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <p className="text-sm text-gray-700">
                              {i18n.language === 'ar'
                                ? 'توجد وحدات تقييم متقدمة لهذه الدراسة. تم عرض وحدات التقييم أدناه (الوحدات هي المصدر الرئيسي للأسئلة الآن).'
                                : 'This case study includes assessment modules. Modules are shown below and act as the primary source of assessment items.'}
                            </p>
                          </div>
                        ) : (
                          caseStudy.questions && caseStudy.questions.length > 0 && (
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {i18n.language === 'ar' ? "الأسئلة:" : "Questions:"}
                              </h3>
                              <div className="space-y-4">
                                {caseStudy.questions.map((q, i) => (
                                  <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 bg-merit-green text-merit-dark rounded-full flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                      </span>
                                      <p className="text-gray-700 leading-relaxed flex-1 whitespace-pre-wrap break-words">
                                        {q}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}

                        {/* Tables Section */}
                        {caseStudy.tables && caseStudy.tables.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              {i18n.language === 'ar' ? "الجداول:" : "Tables:"}
                            </h3>
                            <div className="space-y-6">
                              {caseStudy.tables.map((table, tableIdx) => (
                                <div key={tableIdx} className="border border-gray-300 rounded-lg overflow-hidden">
                                  {/* Table Header */}
                                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {table.title || `Table ${tableIdx + 1}`}
                                    </h4>
                                  </div>

                                  {/* Table Wrapper */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                      {/* Table Header Row */}
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

                                      {/* Table Body */}
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
                                              {i18n.language === 'ar' ? 'لا توجد بيانات' : 'No data'}
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

                        {/* Assessment Modules Section */}
                        {caseStudy.customQuestions && caseStudy.customQuestions.length > 0 && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              {i18n.language === 'ar' ? "وحدات التقييم:" : "Assessment Modules:"}
                            </h3>
                            
                            {(() => {
                              const questionsByType = caseStudy.customQuestions.reduce((acc, q) => {
                                const type = q.question_type || 'other';
                                if (!acc[type]) acc[type] = [];
                                acc[type].push(q);
                                return acc;
                              }, {});

                              const typeLabels = {
                                // canonical camelCase keys
                                mcq: { en: 'Multiple Choice', ar: 'اختيار من متعدد', icon: MessageSquare, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                openEnded: { en: 'Open-Ended', ar: 'أسئلة مفتوحة', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-200' },
                                videoResponse: { en: 'Video Response', ar: 'استجابة فيديو', icon: Video, color: 'bg-pink-100 text-pink-700 border-pink-200' },
                                codingChallenge: { en: 'Coding Challenge', ar: 'تحدي برمجي', icon: Code, color: 'bg-green-100 text-green-700 border-green-200' },
                                sqlProblem: { en: 'SQL Problem', ar: 'مسألة SQL', icon: Database, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                                excelTask: { en: 'Excel Task', ar: 'مهمة إكسل', icon: Calculator, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                                writingExercise: { en: 'Writing Exercise', ar: 'تمرين كتابة', icon: PenTool, color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                situationalJudgment: { en: 'Situational Judgment', ar: 'حكم موقفي', icon: Brain, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },

                                // common backend/raw variants (snake_case or short keys)
                                'video_response': { en: 'Video Response', ar: 'استجابة فيديو', icon: Video, color: 'bg-pink-100 text-pink-700 border-pink-200' },
                                'open_ended': { en: 'Open-Ended', ar: 'أسئلة مفتوحة', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-200' },
                                'coding_challenge': { en: 'Coding Challenge', ar: 'تحدي برمجي', icon: Code, color: 'bg-green-100 text-green-700 border-green-200' },
                                'sql': { en: 'SQL Problem', ar: 'مسألة SQL', icon: Database, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                                'situational_judgment': { en: 'Situational Judgment', ar: 'حكم موقفي', icon: Brain, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                                'video': { en: 'Video Response', ar: 'استجابة فيديو', icon: Video, color: 'bg-pink-100 text-pink-700 border-pink-200' }
                              };

                              // Humanize fallback for unknown types
                              function humanizeTypeLabel(type) {
                                if (!type || typeof type !== 'string') return { en: 'Unknown', ar: 'غير معروف', icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-200' };
                                const cleaned = type.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
                                return { en: cleaned, ar: cleaned, icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-200' };
                              }

                              return Object.entries(questionsByType).map(([type, questions]) => {
                                const typeInfo = typeLabels[type] || humanizeTypeLabel(type);
                                const IconComponent = typeInfo.icon;
                                const questionsArray = questions as any[];

                                return (
                                  <div key={type} className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
                                    <div className={`flex items-center gap-3 px-4 py-3 ${typeInfo.color} border-b`}>
                                      <IconComponent className="w-4 h-4" />
                                      <h4 className="font-semibold text-sm">
                                        {i18n.language === 'ar' ? typeInfo.ar : typeInfo.en}
                                      </h4>
                                      <span className="ml-auto text-xs font-medium bg-white/50 px-2 py-0.5 rounded-full">
                                        {questionsArray.length}
                                      </span>
                                    </div>
                                    
                                    <div className="divide-y divide-gray-100">
                                      {questionsArray.map((q: any, idx: number) => (
                                        <div key={q.id || idx} className="p-4 hover:bg-gray-50">
                                          <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                                              {idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm text-gray-800 mb-2">
                                                {q.question_text}
                                              </p>

                                              {/* MCQ Options */}
                                              {type === 'mcq' && q.options && (
                                                <div className="mt-2 space-y-1.5">
                                                  {(Array.isArray(q.options) ? q.options : []).map((opt: any, optIdx: number) => {
                                                    const optionText = typeof opt === 'object' 
                                                      ? (i18n.language === 'ar' ? (opt.text_ar || opt.text_en || opt.text) : (opt.text_en || opt.text_ar || opt.text))
                                                      : opt;
                                                    const isCorrect = typeof opt === 'object' ? opt.is_correct : q.correct_answers?.includes(opt);
                                                    return (
                                                      <div
                                                        key={optIdx}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                                                          isCorrect
                                                            ? 'bg-green-50 border border-green-200'
                                                            : 'bg-gray-50 border border-gray-200'
                                                        }`}
                                                      >
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                                          isCorrect
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                          {String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        <span className="text-gray-700">
                                                          {optionText}
                                                        </span>
                                                        {isCorrect && (
                                                          <Check className="w-3 h-3 text-green-600 ml-auto" />
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {/* Coding Starter Code */}
                                              {type === 'codingChallenge' && q.starter_code && (
                                                <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                                  <pre className="font-mono">
                                                    {typeof q.starter_code === 'object' ? JSON.stringify(q.starter_code, null, 2) : q.starter_code}
                                                  </pre>
                                                </div>
                                              )}

                                              {/* Meta Info */}
                                              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                                {q.time_limit && (
                                                  <span>⏱️ {q.time_limit} min</span>
                                                )}
                                                {q.weight !== undefined && q.weight !== null && (
                                                  <span>⚖️ {q.weight}%</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              });
                            })()}

                            {/* Anti-cheating settings badge */}
                            {caseStudy.antiCheatingSettings && (
                              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                                  🛡️ {i18n.language === 'ar' ? 'مكافحة الغش مفعلة' : 'Anti-Cheating Enabled'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {caseStudy.antiCheatingSettings.fullscreen_required && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {i18n.language === 'ar' ? '✓ وضع ملء الشاشة' : '✓ Fullscreen Mode'}
                                    </span>
                                  )}
                                  {caseStudy.antiCheatingSettings.tab_switch_detection && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {i18n.language === 'ar' ? '✓ كشف تبديل التبويب' : '✓ Tab Switch Detection'}
                                    </span>
                                  )}
                                  {caseStudy.antiCheatingSettings.copy_paste_disabled && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {i18n.language === 'ar' ? '✓ منع النسخ واللصق' : '✓ Block Copy/Paste'}
                                    </span>
                                  )}
                                  {caseStudy.antiCheatingSettings.webcam_required && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {i18n.language === 'ar' ? '✓ مراقبة الكاميرا' : '✓ Webcam Proctoring'}
                                    </span>
                                  )}
                                  {caseStudy.antiCheatingSettings.webcam_snapshots_interval > 0 && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {i18n.language === 'ar' 
                                        ? `✓ لقطات دورية (${caseStudy.antiCheatingSettings.webcam_snapshots_interval}ث)` 
                                        : `✓ Periodic Screenshots (${caseStudy.antiCheatingSettings.webcam_snapshots_interval}s)`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Anti-Cheating Settings (independent section) */}
                        {caseStudy.antiCheatingSettings && (!caseStudy.customQuestions || caseStudy.customQuestions.length === 0) && (
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              {i18n.language === 'ar' ? "إعدادات مكافحة الغش:" : "Anti-Cheating Settings:"}
                            </h3>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                                🛡️ {i18n.language === 'ar' ? 'مكافحة الغش مفعلة' : 'Anti-Cheating Enabled'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {caseStudy.antiCheatingSettings.fullscreen_required && (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {i18n.language === 'ar' ? '✓ وضع ملء الشاشة' : '✓ Fullscreen Mode'}
                                  </span>
                                )}
                                {caseStudy.antiCheatingSettings.tab_switch_detection && (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {i18n.language === 'ar' ? '✓ كشف تبديل التبويب' : '✓ Tab Switch Detection'}
                                  </span>
                                )}
                                {caseStudy.antiCheatingSettings.copy_paste_disabled && (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {i18n.language === 'ar' ? '✓ منع النسخ واللصق' : '✓ Block Copy/Paste'}
                                  </span>
                                )}
                                {caseStudy.antiCheatingSettings.webcam_required && (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {i18n.language === 'ar' ? '✓ مراقبة الكاميرا' : '✓ Webcam Proctoring'}
                                  </span>
                                )}
                                {caseStudy.antiCheatingSettings.webcam_snapshots_interval > 0 && (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {i18n.language === 'ar' 
                                      ? `✓ لقطات دورية (${caseStudy.antiCheatingSettings.webcam_snapshots_interval}ث)` 
                                      : `✓ Periodic Screenshots (${caseStudy.antiCheatingSettings.webcam_snapshots_interval}s)`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-6 text-sm text-gray-600 pt-6 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{i18n.language === 'ar' ? "المدة:" : "Duration:"}</span>
                            <span>
                              {caseStudy.duration_minutes < 60
                                ? `${caseStudy.duration_minutes} ${i18n.language === 'ar' ? "دقيقة" : "minutes"}`
                                : caseStudy.duration_minutes < 1440
                                  ? `${Math.floor(caseStudy.duration_minutes / 60)} ${i18n.language === 'ar' ? "ساعة" : "hour"}${Math.floor(caseStudy.duration_minutes / 60) > 1 ? 's' : ''} ${caseStudy.duration_minutes % 60 > 0 ? `${caseStudy.duration_minutes % 60} ${i18n.language === 'ar' ? "دقيقة" : "min"}` : ''}`
                                  : `${Math.floor(caseStudy.duration_minutes / 1440)} ${i18n.language === 'ar' ? "يوم" : "day"}${Math.floor(caseStudy.duration_minutes / 1440) > 1 ? 's' : ''} ${Math.floor((caseStudy.duration_minutes % 1440) / 60) > 0 ? `${Math.floor((caseStudy.duration_minutes % 1440) / 60)} ${i18n.language === 'ar' ? "ساعة" : "hr"}` : ''}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{i18n.language === 'ar' ? "الحالة:" : "Status:"}</span>
                            <span className="capitalize">
                              {caseStudy.status === 'draft'
                                ? (i18n.language === 'ar' ? "مسودة" : "Draft")
                                : caseStudy.status === 'in_review'
                                  ? (i18n.language === 'ar' ? "قيد المراجعة" : "In Review")
                                  : (i18n.language === 'ar' ? "منشورة" : "Published")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Publish and Share Section */}
                {cases.length > 0 && cases.some(c => c.status !== 'published') && (
                  <div className="mt-8 bg-merit-green text-merit-dark rounded-2xl p-8">
                    <div className="max-w-3xl mx-auto text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-merit-dark/10 flex items-center justify-center">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {hasMultipleInReview
                          ? (i18n.language === 'ar' ? "هل أنت مستعد للاختيار؟" : "Ready to Choose?")
                          : (i18n.language === 'ar' ? "هل أنت مستعد للمشاركة مع المتقدمين؟" : "Ready to Share with Applicants?")}
                      </h3>
                      <p className="text-sm opacity-90 mb-6 max-w-2xl mx-auto">
                        {hasMultipleInReview
                          ? (i18n.language === 'ar'
                            ? "اختر دراسة الحالة المفضلة لديك أعلاه، ثم انشرها. سيتم حذف الخيارات الأخرى تلقائياً."
                            : "Select your preferred case study above, then publish it. Other options will be automatically deleted.")
                          : (i18n.language === 'ar'
                            ? "انشر دراسة الحالة لإتاحتها للمرشحين. يمكنك تتبع الاستجابات وتحليل الأداء في الوقت الفعلي."
                            : "Publish this case study to make it available to your candidates. You can track responses and analyze performance in real-time.")}
                      </p>
                      <Button
                        className="bg-merit-dark text-merit-green hover:bg-merit-dark/90 gap-2"
                        onClick={() => {
                          if (hasMultipleInReview) {
                            if (!selectedForPublish) {
                              toast({
                                variant: "destructive",
                                title: i18n.language === 'ar' ? "لا يوجد اختيار" : "No Selection",
                                description: i18n.language === 'ar' ? "يرجى اختيار دراسة حالة للنشر" : "Please select a case study to publish",
                              });
                              return;
                            }
                            setShowPublishDialog(true);
                          } else {
                            const unpublishedCase = cases.find(c => c.status !== 'published');
                            if (unpublishedCase) {
                              setSelectedForPublish(unpublishedCase.id);
                              setShowPublishDialog(true);
                            }
                          }
                        }}
                        disabled={publishing || isPublishing || (hasMultipleInReview && !selectedForPublish)}
                      >
                        <Share2 className="w-4 h-4" />
                        {publishing || isPublishing
                          ? (i18n.language === 'ar' ? "جاري النشر..." : "Publishing...")
                          : (hasMultipleInReview
                            ? (i18n.language === 'ar' ? "نشر المختار" : "Publish Selected")
                            : (i18n.language === 'ar' ? "نشر والمشاركة" : "Publish & Share"))}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}