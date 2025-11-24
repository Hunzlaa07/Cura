import { Search, FileText, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchApplicantProfile } from "@/lib/apiService";
import ProfilePicture from "../ProfilePicture";
import { Link, useNavigate } from "react-router-dom";

interface ApplicantSidebarProps {
  activeItem?: string;
}

export default function ApplicantSidebar({ activeItem = "search" }: ApplicantSidebarProps) {
  const [profile, setProfile] = useState<any | null>(null);
  const [incompleteCaseStudy, setIncompleteCaseStudy] = useState<any | null>(null);
  const [showCompletedMessage, setShowCompletedMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadProfile = async () => {
      const data = await fetchApplicantProfile();
      setProfile(data?.profile || null);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const fetchIncompleteCaseStudy = async () => {
      try {
        console.log('🔍 === FETCHING INCOMPLETE CASE STUDY ===');
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);

        const url = `${import.meta.env.VITE_API_URL}/api/assessments/case-studies/incomplete`;
        console.log('Fetching from URL:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();

        if (!response.ok) {
          console.error('Error response:', responseText);
          throw new Error('Failed to fetch case study status');
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          throw new Error('Invalid JSON response from server');
        }

        if (data.has_incomplete) {
          console.log('✅ Setting incomplete case study:', data);
          setIncompleteCaseStudy(data);
        } else {
          console.log('❌ No incomplete case studies');
          setIncompleteCaseStudy(null);
        }
      } catch (error) {
        console.error('❌ Error in fetchIncompleteCaseStudy:', error);
        setIncompleteCaseStudy(null);
      } finally {
        setLoading(false);
      }
    };

    fetchIncompleteCaseStudy();
  }, []);

  const handleCaseStudyClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (incompleteCaseStudy?.job_id) {
      // For assessment case studies, job_id might be null - use case_study_id route
      const targetUrl = incompleteCaseStudy.job_id
        ? `/applicant-dashboard/case-studies/job/${incompleteCaseStudy.job_id}`
        : `/assessment-start/case-study/${incompleteCaseStudy.case_study_id}`;
      navigate(targetUrl);
    } else {
      setShowCompletedMessage(true);
      setTimeout(() => setShowCompletedMessage(false), 4000);
    }
  };

  const menuItems = [
    { id: "search", label: t("sidebar.applicant.caseStudies"), icon: Search, link: "/applicant-dashboard" },
    { id: "profile", label: t("sidebar.applicant.profile"), icon: User, link: "/profile/update" },
    { id: "settings", label: t("sidebar.applicant.settings"), icon: Settings, link: "/applicant-dashboard/settings" },
  ];

  return (
    <aside className="w-[270px] bg-white border-r border-gray-200 min-h-screen sticky top-0 flex flex-col">
      {/* Completed Message Toast */}
      {showCompletedMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white border-2 border-merit-green rounded-2xl shadow-2xl p-6 max-w-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-merit-green rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-merit-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-merit-dark text-lg mb-1">
                  {i18n.language === 'ar' ? 'تم الانتهاء من الكل! 🎉' : 'All Caught Up! 🎉'}
                </h3>
                <p className="text-sm text-gray-600">
                  {i18n.language === 'ar'
                    ? 'لقد أكملت جميع دراسات الحالة الخاصة بك. تحقق لاحقاً للحصول على فرص جديدة!'
                    : "You've completed all your case studies. Check back later for new opportunities!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logo Section */}
      <div className="p-8 flex items-center gap-4">
        <div className="w-[42px] h-[42px] bg-merit-dark rounded-lg flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 93 94" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.247 38.3522C23.7798 45.325 28.7248 51.4665 34.439 56.1163C40.196 60.8905 47.0795 64.5459 54.3358 66.4221C56.921 67.0836 59.5674 67.4768 62.2332 67.5953C67.2909 67.7895 72.772 66.795 76.8314 63.5553C81.8697 59.5309 83.2449 53.3583 81.9513 47.2012C81.1394 43.3439 79.4613 39.704 77.2704 36.3749C76.8177 35.6805 76.3436 35.0004 75.8486 34.3355C75.8489 34.3296 75.8509 34.3239 75.8544 34.3191C75.8578 34.3143 75.8626 34.3105 75.8681 34.3083H75.8836C75.8914 34.3083 75.8991 34.3083 75.9069 34.3161L77.4374 35.8894C81.1468 39.714 84.3862 43.9679 87.0867 48.5608C89.3359 52.4182 91.0606 56.5087 91.9619 60.774C93.3953 67.5603 92.2338 74.5487 86.8886 79.3306C84.0762 81.8478 80.4596 83.3744 76.8275 84.128C71.7892 85.1652 66.5373 85.0137 61.4252 84.1552C58.8264 83.7201 56.317 83.1452 53.9008 82.4344C43.8941 79.4976 34.4313 74.4671 26.1532 68.1508C21.1671 64.4146 16.6261 60.1186 12.6194 55.3472C8.52892 50.4759 5.02115 44.9715 2.84967 38.9776C1.42403 35.0619 0.619921 30.7112 1.09384 26.5858C2.13102 17.628 8.7853 12.3916 17.3081 10.8144C22.2221 9.90542 27.3847 10.0919 32.3763 10.9581C37.691 11.8903 42.8776 13.4444 47.8292 15.5886V15.6041C47.8281 15.6078 47.8261 15.6111 47.8234 15.6138C47.8206 15.6165 47.8173 15.6185 47.8136 15.6196H47.7981C44.169 14.6413 40.4047 14.2608 36.6533 14.4931C33.5184 14.6796 30.1815 15.5148 27.4973 17.0414C23.4807 19.3255 21.0101 22.7245 20.0894 27.2384C19.8279 28.6467 19.7379 30.0815 19.8214 31.5114C19.9185 33.7645 20.4546 36.1652 21.247 38.3522Z" fill="url(#paint0_linear_3329_167)" />
            <path d="M70.9577 28.8081C70.9611 28.8488 70.9516 28.8896 70.9305 28.9246C69.1397 32.4829 67.345 36.0411 65.5465 39.5955C63.8994 42.8469 62.6524 45.1777 61.7978 46.5878C58.5978 51.882 54.7047 56.7249 50.2218 60.9879C50.2066 61.0025 50.1873 61.0121 50.1665 61.0156C50.1457 61.019 50.1244 61.0162 50.1053 61.0073C43.9934 58.5407 38.4388 54.8725 33.7706 50.2198C33.2268 49.676 32.6829 49.1011 32.1391 48.4834C32.1278 48.4689 32.121 48.4513 32.1197 48.4329C32.1197 48.4135 32.1197 48.3941 32.1313 48.3786C34.0494 45.1242 36.2321 42.0333 38.6574 39.1372C41.7968 35.4117 45.3115 32.0194 49.1458 29.0139C50.7307 27.7709 54.5453 24.7642 60.6053 19.9901L85.0665 0.710919L85.0859 0.704102L85.1053 0.710919C85.1125 0.715515 85.1179 0.72234 85.1208 0.730342C85.1232 0.737928 85.1232 0.746063 85.1208 0.753649L70.9499 28.8081H70.9577Z" fill="#C8F55A" />
            <path d="M8.83172 93.9338C8.83948 93.9338 8.84725 93.9338 8.85114 93.926L31.5487 76.1347C31.5589 76.1271 31.5671 76.1171 31.5725 76.1055C31.5779 76.094 31.5804 76.0814 31.5798 76.0687C31.5789 76.0559 31.5749 76.0435 31.5682 76.0327C31.5614 76.0219 31.552 76.0129 31.5409 76.0065C28.0563 73.8222 24.7045 71.4328 21.5032 68.8511H21.4799L21.4605 68.8589C21.4536 68.8638 21.4483 68.8705 21.4449 68.8783L8.80452 93.8833C8.80214 93.8909 8.80214 93.899 8.80452 93.9066C8.80452 93.9144 8.80452 93.9222 8.81229 93.926C8.81887 93.9314 8.82715 93.9341 8.8356 93.9338H8.83172Z" fill="#C8F55A" />
            <defs>
              <linearGradient id="paint0_linear_3329_167" x1="36.4596" y1="69.8364" x2="18.0798" y2="13.7037" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDFFF8" />
                <stop offset="1" stopColor="#F0FFCC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-[28px] font-bold text-merit-dark">{t('appName')}</span>
      </div>

      {/* Navigation */}
      <nav className="px-8 flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.link ||
              (item.link !== "/applicant-dashboard" && location.pathname.startsWith(item.link));

            return (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-xl text-base font-medium transition-colors w-full",
                    isActive ? "bg-merit-dark text-white" : "text-merit-gray hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="whitespace-nowrap flex-shrink-0">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-6">
        <div className="bg-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <ProfilePicture
              profilePicture={profile?.profile_picture}
              fullName={profile?.full_name}
              onUpdate={(url) => setProfile({ ...profile, profile_picture: url })}
            />

            <div>
              <p className="font-medium text-merit-dark text-sm">{profile?.full_name || t("loading")}</p>
              <p className="text-xs text-gray-500">
                {profile ? (profile.user_type === "applicant" ? t("applicants.title") : t("recruiters.title")) : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}