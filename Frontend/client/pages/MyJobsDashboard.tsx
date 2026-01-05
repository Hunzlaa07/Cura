import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/dashboard/Sidebar";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Users, Link2, Copy, CheckCircle, XCircle, FileText, Send, Plus, Calendar as CalendarIcon, Bell, History, Eye, Clock, MapPin, Building2, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import DateTimePicker from "@/components/DateTimePicker";

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

interface Job {
  id: number;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  key_responsibilities: string;
  key_responsibilities_ar: string;
  department: string;
  department_ar: string;
  location: string;
  location_ar: string;
  employment_type: string;
  experience_level: string;
  share_link: string;
  application_deadline: string;
  is_open: number;
  job_status: "open" | "closed" | "expired";
  total_applications: number;
  pending_count: number;
  reviewed_count: number;
  case_study_id: number | null;
  case_study_title: string | null;
  case_study_sent: number;
  created_at: string;
  company_name: string;
  required_skills?: Array<{
    name: string;
    minimum_proficiency: string;
    is_required: number;
  }>;
}

// Helper hook to get the correct field based on current language
const useLocalizedField = () => {
  const { i18n } = useTranslation();

  const getField = (enValue: string, arValue: string) => {
    if (i18n.language === 'ar' && arValue) {
      return arValue;
    }
    return enValue;
  };

  return { getField };
};

const shouldShowShareLink = (job: Job) => {
  // Show share link ONLY if:
  // 1. Job is OPEN (not expired or closed)
  // 2. Job HAS a share_link
  // 3. Job is active

  const isOpen = job.job_status === 'open';
  const hasLink = job.share_link && job.share_link.trim() !== '';
  const isActive = job.is_open === 1;

  return isOpen && hasLink && isActive;
};

export default function MyJobsDashboard() {
  const { t, i18n } = useTranslation();
  const { getField } = useLocalizedField();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isExtendDeadlineOpen, setIsExtendDeadlineOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("23:59");
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<Job | null>(null);
  const { toast } = useToast();

  const token = localStorage.getItem("token");
  const [linkedInConnected, setLinkedInConnected] = useState<boolean>(false);
  const [sharingJobId, setSharingJobId] = useState<number | null>(null);

  // Update document direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    fetchMyJobs();
    checkLinkedInStatus();

    // Handle LinkedIn OAuth redirect flags
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('linkedin_connected') === '1') {
        toast({ title: 'LinkedIn connected', description: i18n.language === 'ar' ? 'تم الاتصال بـ LinkedIn' : 'LinkedIn account connected successfully' });
        setLinkedInConnected(true);
        // Clean URL
        params.delete('linkedin_connected');
        window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
      }

      const lnError = params.get('linkedin_error');
      if (lnError) {
        const desc = params.get('linkedin_error_description') || '';
        toast({ variant: 'destructive', title: i18n.language === 'ar' ? 'خطأ في LinkedIn' : 'LinkedIn error', description: desc });
        // Clean URL
        params.delete('linkedin_error');
        params.delete('linkedin_error_description');
        window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
      }
    } catch (e) {
      console.error('Failed to parse LinkedIn redirect params', e);
    }

  }, []);

  const checkLinkedInStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/linkedin/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return setLinkedInConnected(false);
      const data = await res.json();
      setLinkedInConnected(!!data.authenticated);
    } catch (err) {
      console.error('LinkedIn status check failed', err);
      setLinkedInConnected(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/linkedin/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to get LinkedIn auth URL');
      const data = await res.json();
      window.location.href = data.authUrl;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Could not connect to LinkedIn' });
    }
  };

  const handleShareToLinkedIn = async (jobId: number) => {
    try {
      setSharingJobId(jobId);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/linkedin/share-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to post to LinkedIn' }));
        throw new Error(err.error || 'Failed to post to LinkedIn');
      }
      await res.json();
      toast({ title: 'Posted to LinkedIn', description: 'Your job was posted successfully' });
      setLinkedInConnected(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSharingJobId(null);
    }
  };

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/my-jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
      });
      if (!res.ok) throw new Error(t('myJobs.errors.fetchFailed') || "Failed to fetch jobs");
      const data = await res.json();

      // DEBUG: Log first job to see all fields
      console.log('First job from API:', data.jobs[0]);

      const jobsWithStatus = data.jobs.map((job: Job) => {
        const deadline = new Date(job.application_deadline);
        const now = new Date();

        let computedStatus: "open" | "closed" | "expired";
        if (deadline < now) {
          computedStatus = "expired";
        } else if (job.is_open === 1) {
          computedStatus = "open";
        } else {
          computedStatus = "closed";
        }

        return {
          ...job,
          job_status: computedStatus
        };
      });

      setJobs(jobsWithStatus);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: number) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (job && job.job_status === 'expired') {
        toast({
          variant: "destructive",
          title: t('myJobs.errors.cannotOpenExpired') || "Cannot open expired job",
          description: i18n.language === 'ar'
            ? "يرجى تمديد الموعد النهائي أولاً قبل فتح هذه الوظيفة"
            : "Please extend the deadline first before opening this job.",
        });
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}/toggle-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
      });
      if (!res.ok) throw new Error(t('myJobs.errors.toggleFailed') || "Failed to toggle status");

      toast({
        title: t('success') || "Success",
        description: job?.is_open
          ? (i18n.language === 'ar' ? "تم إغلاق الوظيفة بنجاح" : "Job closed successfully")
          : (i18n.language === 'ar' ? "تم فتح الوظيفة بنجاح" : "Job opened successfully"),
        variant: "default",
      });

      await fetchMyJobs();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: err.message || t('myJobs.errors.toggleFailed'),
      });
    }
  };

  const openExtendDeadline = (jobId: number) => {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const deadline = new Date(job.application_deadline);
      setSelectedDate(deadline);
      const hours = String(deadline.getHours()).padStart(2, '0');
      const minutes = String(deadline.getMinutes()).padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
    }
    setIsExtendDeadlineOpen(true);
  };

  const openJobDetails = async (job: Job) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${job.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        throw new Error("Failed to fetch job details");
      }

      const data = await res.json();
      const jobDetails = data.job || data;

      setSelectedJobDetails({
        ...job,
        ...jobDetails,
        company_name: jobDetails.company_name || job.company_name
      });
      setIsJobDetailsOpen(true);
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: err.message || "Failed to load job details",
      });
    }
  };

  const extendDeadline = async () => {
    if (!selectedJobId || !selectedDate || !selectedTime) return;

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const dateTimeString = `${dateString} ${selectedTime}:00`;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${selectedJobId}/extend-deadline`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
        body: JSON.stringify({ new_deadline: dateTimeString }),
      });

      if (!res.ok) throw new Error(t('myJobs.errors.extendFailed') || "Failed to extend deadline");

      setIsExtendDeadlineOpen(false);
      setSelectedJobId(null);
      setSelectedDate(undefined);
      setSelectedTime("23:59");
      await fetchMyJobs();

      toast({
        title: t('success') || "Success",
        description: i18n.language === 'ar'
          ? "تم تمديد الموعد النهائي للوظيفة بنجاح"
          : "Job deadline extended successfully",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: err.message || t('myJobs.errors.extendFailed'),
      });
    }
  };

  const copyShareLink = (shareLink: string) => {
    const fullLink = `${window.location.origin}/apply/${shareLink}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(shareLink);
    toast({
      title: i18n.language === 'ar' ? "تم نسخ الرابط!" : "Link copied!",
      description: i18n.language === 'ar'
        ? "تم نسخ رابط التقديم إلى الحافظة"
        : "Job application link copied to clipboard",
    });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-lime-100 text-lime-700 border-lime-300";
      case "closed":
        return "bg-red-100 text-red-700 border-red-300";
      case "expired":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    if (i18n.language === 'ar') {
      return status === "open" ? "مفتوح" : status === "closed" ? "مغلق" : "منتهي";
    }
    return status === "open" ? "Open" : status === "closed" ? "Closed" : "Expired";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (i18n.language === 'ar') {
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        {i18n.language === 'ar' ? 'جاري تحميل الوظائف...' : 'Loading jobs...'}
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
      <TopBar />
      <div className="flex">
        <Sidebar activeItem="all-jobs" />
        <div className="flex-1 p-6 px-6 sm:px-10 md:px-12">
          <div className="max-w-7xl mx-auto">
            {/* Dialog for Job Details - BILINGUAL */}
            <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                  <DialogTitle className="text-2xl font-bold">
                    {getField(selectedJobDetails?.title || '', selectedJobDetails?.title_ar || '')}
                  </DialogTitle>
                  <div className="flex items-center gap-4 text-gray-600 mt-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {selectedJobDetails?.company_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {getField(selectedJobDetails?.location || '', selectedJobDetails?.location_ar || '')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {selectedJobDetails?.employment_type}
                    </div>
                  </div>
                </DialogHeader>
                <div className="p-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {i18n.language === 'ar' ? 'عن الدور' : 'About the Role'}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {getField(selectedJobDetails?.description || '', selectedJobDetails?.description_ar || '')}
                    </p>
                  </div>

                  {/* Key Responsibilities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {i18n.language === 'ar' ? 'المسؤوليات الرئيسية' : 'Key Responsibilities'}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {getField(selectedJobDetails?.key_responsibilities || '', selectedJobDetails?.key_responsibilities_ar || '')}
                    </p>
                  </div>

                  {/* Required Skills */}
                  {selectedJobDetails?.required_skills && selectedJobDetails.required_skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {i18n.language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJobDetails.required_skills.map((skill, index) => (
                          <span
                            key={index}
                            className={`px-4 py-2 rounded-full text-sm font-medium ${skill.is_required
                                ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {skill.name} ({skill.minimum_proficiency})
                            {skill.is_required ? ' *' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">
                        {i18n.language === 'ar' ? 'القسم' : 'Department'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {getField(selectedJobDetails?.department || '', selectedJobDetails?.department_ar || '')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {i18n.language === 'ar' ? 'مستوى الخبرة' : 'Experience Level'}
                      </p>
                      <p className="font-medium text-gray-900">{selectedJobDetails?.experience_level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {i18n.language === 'ar' ? 'الموعد النهائي للتقديم' : 'Application Deadline'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {selectedJobDetails ? formatDate(selectedJobDetails.application_deadline) : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {i18n.language === 'ar' ? 'إجمالي المتقدمين' : 'Total Applications'}
                      </p>
                      <p className="font-medium text-gray-900">{selectedJobDetails?.total_applications || 0}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-6 pt-0">
                  <Button variant="outline" onClick={() => setIsJobDetailsOpen(false)}>
                    {i18n.language === 'ar' ? 'إغلاق' : 'Close'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog for extending deadline */}
            <Dialog open={isExtendDeadlineOpen} onOpenChange={setIsExtendDeadlineOpen}>
              <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="text-xl font-semibold">
                    {i18n.language === 'ar' ? 'تمديد الموعد النهائي للتقديم' : 'Extend Application Deadline'}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-2">
                    {i18n.language === 'ar'
                      ? 'حدد تاريخاً ووقتاً جديداً للموعد النهائي لهذا الإعلان الوظيفي.'
                      : 'Select a new deadline date and time for this job posting.'}
                  </p>
                </DialogHeader>
                <div className="px-6 pb-6">
                  <DateTimePicker
                    value={selectedDate ? `${selectedDate.toISOString().split('T')[0]}T${selectedTime}` : ''}
                    onChange={(value) => {
                      // Parse the datetime-local format
                      const [datePart, timePart] = value.split('T');
                      const date = new Date(datePart);
                      setSelectedDate(date);
                      setSelectedTime(timePart);
                    }}
                    label={i18n.language === 'ar' ? 'اختر التاريخ والوقت' : 'Select Date and Time'}
                    i18nLanguage={i18n.language}
                    required={true}
                  />
                </div>
                <DialogFooter className="p-6 pt-0">
                  <Button variant="outline" onClick={() => setIsExtendDeadlineOpen(false)}>
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button
                    onClick={extendDeadline}
                    disabled={!selectedDate}
                    className="bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a]"
                  >
                    {i18n.language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-8 h-8 text-[#75A400]" />
                  {i18n.language === 'ar' ? 'وظائفي' : 'My Jobs'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {i18n.language === 'ar'
                    ? 'إدارة إعلاناتك الوظيفية والطلبات'
                    : 'Manage your job postings and applications'}
                </p>
              </div>
              <Link
                to="/recruiter-dashboard/upload"
                className="flex items-center gap-2 px-5 py-2.5 bg-merit-green text-merit-dark font-medium rounded-lg hover:bg-lime-600 transition"
              >
                <Plus className="w-5 h-5" />
                {i18n.language === 'ar' ? 'إضافة وظيفة' : 'Add Job'}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[
                {
                  label: i18n.language === 'ar' ? 'إجمالي الوظائف' : "Total Jobs",
                  value: jobs.length
                },
                {
                  label: i18n.language === 'ar' ? 'الوظائف المفتوحة' : "Open Jobs",
                  value: jobs.filter((j) => j.job_status === "open").length,
                },
                {
                  label: i18n.language === 'ar' ? 'الوظائف المغلقة' : "Closed Jobs",
                  value: jobs.filter((j) => j.job_status === "closed" || j.job_status === "expired").length,
                },
                {
                  label: i18n.language === 'ar' ? 'إجمالي المتقدمين' : "Total Applicants",
                  value: jobs.reduce((s, j) => s + (j.total_applications || 0), 0),
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white border-2 border-gray-300 border-l-[6px] border-l-merit-green rounded-xl p-6 flex flex-col items-start"
                >
                  <p className="text-gray-600 text-sm font-medium mb-1">{item.label}</p>
                  <p className="text-4xl font-bold text-merit-dark">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Job Cards - BILINGUAL */}
            {jobs.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                {i18n.language === 'ar'
                  ? 'لا توجد وظائف بعد — أنشئ أول إعلان وظيفي للبدء.'
                  : 'No jobs yet — create your first posting to get started.'}
              </div>
            ) : (
              <div className="space-y-5">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getField(job.title, job.title_ar)}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                              job.job_status
                            )}`}
                          >
                            {getStatusLabel(job.job_status)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">
                          {getField(job.department, job.department_ar)} · {i18n.language === 'ar' ? 'الموعد النهائي:' : 'Deadline:'}{" "}
                          {formatDate(job.application_deadline)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <Users className="inline-block w-4 h-4 mr-1" />
                          {job.total_applications || 0} {i18n.language === 'ar' ? 'طلب' : 'Applications'}
                        </p>

                        {/* Share link - ONLY show for open jobs with links */}
                        {shouldShowShareLink(job) ? (
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg mt-4 p-2.5">
                            <Link2 className="w-4 h-4 text-gray-500" />
                            <code className="flex-1 text-sm text-gray-700 truncate">
                              {window.location.origin}/apply/{job.share_link}
                            </code>
                            <button
                              onClick={() => copyShareLink(job.share_link)}
                              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md ${copiedLink === job.share_link
                                  ? "bg-lime-100 text-lime-700 border border-lime-300"
                                  : "bg-lime-500 text-white hover:bg-lime-600"
                                } transition`}
                            >
                              {copiedLink === job.share_link ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {i18n.language === 'ar' ? 'تم النسخ' : 'Copied'}
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  {i18n.language === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-gray-100 border border-gray-200 rounded-lg mt-4 p-2.5 text-xs text-gray-500 italic">
                            {job.job_status === 'expired'
                              ? (i18n.language === 'ar' ? 'الرابط غير متاح - الوظيفة منتهية الصلاحية' : 'Link unavailable - Job expired')
                              : job.job_status === 'closed'
                                ? (i18n.language === 'ar' ? 'الرابط غير متاح - الوظيفة مغلقة' : 'Link unavailable - Job closed')
                                : (i18n.language === 'ar' ? 'لا يوجد رابط مشاركة للوظيفة هذه' : 'No share link available for this job')
                            }
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 md:mt-0 md:ml-4">
                        <button
                          onClick={() => openJobDetails(job)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 text-sm font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          {i18n.language === 'ar' ? 'عرض تفاصيل الوظيفة' : 'View Job Details'}
                        </button>

                        <Link
                          to={`/recruiter-dashboard/jobs/${job.id}/applicants`}
                          className="flex items-center gap-2 px-4 py-2 bg-lime-100 text-lime-700 font-medium rounded-md border border-lime-300 hover:bg-lime-200 text-sm"
                        >
                          <Users className="w-4 h-4" />
                          {i18n.language === 'ar'
                            ? `عرض الطلبات (${job.total_applications || 0})`
                            : `View Applications (${job.total_applications || 0})`
                          }
                        </Link>

                        {!job.case_study_id ? (
                          <Link
                            to={`/recruiter-dashboard/jobs/${job.id}/generate-case-study`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            {i18n.language === 'ar' ? 'إنشاء دراسة حالة' : 'Generate Case Study'}
                          </Link>
                        ) : (
                          <Link
                            to={`/recruiter-dashboard/jobs/${job.id}/case-study-preview`}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm border border-gray-300"
                          >
                            <Eye className="w-4 h-4" />
                            {i18n.language === 'ar' ? 'معاينة دراسة الحالة' : 'Preview Case Study'}
                          </Link>
                        )}

                        <button
                          onClick={() => openExtendDeadline(job.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 text-sm"
                        >
                          <CalendarIcon className="w-4 h-4" />
                          {i18n.language === 'ar' ? 'تمديد الموعد النهائي' : 'Extend Deadline'}
                        </button>

                        <button
                          onClick={() => toggleJobStatus(job.id)}
                          disabled={job.job_status === "expired"}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${job.job_status === "expired"
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : job.is_open
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-lime-500 text-white hover:bg-lime-600"
                            } transition`}
                        >
                          {job.job_status === "expired" ? (
                            <>
                              <Clock className="w-4 h-4" />
                              {i18n.language === 'ar' ? 'منتهي' : 'Expired'}
                            </>
                          ) : job.is_open ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              {i18n.language === 'ar' ? 'إغلاق الوظيفة' : 'Close Job'}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              {i18n.language === 'ar' ? 'فتح الوظيفة' : 'Open Job'}
                            </>
                          )}
                        </button>

                        {/* LinkedIn Share Button */}
                        <button
                          onClick={() => {
                            if (!linkedInConnected) handleConnectLinkedIn();
                            else handleShareToLinkedIn(job.id);
                          }}
                          disabled={sharingJobId === job.id}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${sharingJobId === job.id ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition`}
                        >
                          <Send className="w-4 h-4" />
                          {sharingJobId === job.id ? (
                            i18n.language === 'ar' ? 'جارٍ النشر...' : 'Posting...'
                          ) : (!linkedInConnected ? (i18n.language === 'ar' ? 'اتصل بـ LinkedIn' : 'Connect LinkedIn') : (i18n.language === 'ar' ? 'نشر على LinkedIn' : 'Post to LinkedIn'))}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}