import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, Mail, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

interface Application {
  id: number;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
  invitation_sent: number;
  invitation_sent_at: string | null;
  otp_verified: number;
}

export default function AssessmentApplications() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);

  useEffect(() => {
    fetchApplications();
  }, [assessmentId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-study-assessments/${assessmentId}/applications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Accept-Language": i18n.language
        },
      });

      if (!res.ok) throw new Error("Failed to fetch applications");

      const data = await res.json();
      setApplications(data.applications || []);

      // Also fetch assessment details if available
      const assessmentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/assessments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Accept-Language": i18n.language
        },
      });

      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json();
        const found = assessmentData.assessments?.find((a: any) => a.id === parseInt(assessmentId || '0'));
        if (found) setAssessment(found);
      }
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: err.message || (i18n.language === 'ar' ? "فشل تحميل المتقدمين" : "Failed to load applications"),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: i18n.language === 'ar' ? 'قيد الانتظار' : 'Pending'
      },
      invited: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: i18n.language === 'ar' ? 'تمت الدعوة' : 'Invited'
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: i18n.language === 'ar' ? 'مكتمل' : 'Completed'
      },
      expired: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: i18n.language === 'ar' ? 'منتهي' : 'Expired'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem="case-study-assessments" />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#75A400]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
      <TopBar />
      <div className="flex flex-1">
        <Sidebar activeItem="case-study-assessments" />
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/recruiter-dashboard/case-study-assessments')}
                className="flex items-center gap-2 text-gray-600 hover:text-merit-dark mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {i18n.language === 'ar' ? 'العودة إلى التقييمات' : 'Back to Assessments'}
                </span>
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-merit-dark flex items-center gap-3 mb-2">
                    <Users className="w-8 h-8 text-[#75A400]" />
                    {i18n.language === 'ar' ? 'المتقدمون' : 'Applications'}
                  </h1>
                  {assessment && (
                    <p className="text-gray-600">
                      {i18n.language === 'ar' && assessment.case_study_title_ar
                        ? assessment.case_study_title_ar
                        : assessment.case_study_title || 'Case Study Assessment'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">{i18n.language === 'ar' ? 'إجمالي المتقدمين' : 'Total Applications'}</p>
                    <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">{i18n.language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.filter(a => a.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">{i18n.language === 'ar' ? 'تمت الدعوة' : 'Invited'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.filter(a => a.status === 'invited').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">{i18n.language === 'ar' ? 'مكتمل' : 'Completed'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.filter(a => a.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {i18n.language === 'ar' ? 'لا يوجد متقدمون بعد' : 'No Applications Yet'}
                  </h3>
                  <p className="text-gray-600">
                    {i18n.language === 'ar'
                      ? 'لم يتقدم أي شخص بعد. شارك الرابط لجذب المتقدمين.'
                      : 'No one has applied yet. Share the link to attract applicants.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{app.full_name}</h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{app.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {i18n.language === 'ar'
                                  ? `تم التقديم: ${new Date(app.created_at).toLocaleDateString('ar-SA')}`
                                  : `Applied: ${new Date(app.created_at).toLocaleDateString('en-US')}`}
                              </span>
                            </div>
                            {app.invitation_sent && app.invitation_sent_at && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>
                                  {i18n.language === 'ar'
                                    ? `تم إرسال الدعوة: ${new Date(app.invitation_sent_at).toLocaleDateString('ar-SA')}`
                                    : `Invited: ${new Date(app.invitation_sent_at).toLocaleDateString('en-US')}`}
                                </span>
                              </div>
                            )}
                          </div>
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
    </div>
  );
}

