import { Home, Upload, FileText, Briefcase, ClipboardCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchRecruiterProfile } from "@/lib/apiService";
import ProfilePicture from "../ProfilePicture";

interface SidebarProps {
  activeItem?: string;
  className?: string;
}

export default function Sidebar({ activeItem = "home", className }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<any | null>(null);
  const planType = (typeof window !== 'undefined' ? localStorage.getItem('planType') : null) || 'full';

  // Define menu items with translation keys
  const menuItems = [
    { 
      id: "home", 
      labelKey: "home", 
      icon: Home, 
      link: "/recruiter-dashboard" 
    },
    { 
      id: "create", 
      labelKey: "createJob", 
      icon: Upload, 
      link: "/recruiter-dashboard/upload" 
    },
    { 
      id: "cases", 
      labelKey: "caseStudies", 
      icon: FileText, 
      link: "/recruiter-dashboard/generate-case" 
    },
    { 
      id: "cv-analyzer",
      labelKey: "cvAnalyzer",
      icon: FileText,
      link: "/recruiter-dashboard/bulk-match"
    },
    { 
      id: "pre-built", 
      labelKey: "preBuiltTests", 
      icon: BookOpen, 
      link: "/recruiter-dashboard/pre-built-assessments" 
    },
    { 
      id: "case-study-assessments", 
      labelKey: "caseStudyAssessments", 
      icon: ClipboardCheck, 
      link: "/recruiter-dashboard/case-study-assessments" 
    },
    { 
      id: "all-jobs", 
      labelKey: "allJobs", 
      icon: Briefcase, 
      link: "/recruiter-dashboard/my-jobs" 
    }
  ];

  useEffect(() => {
    const loadProfile = async () => {
      const data = await fetchRecruiterProfile();
      setProfile(data);
    };
    loadProfile();
  }, []);

  // Get translated label with fallback
  const getLabel = (labelKey: string) => {
    const translations: Record<string, { en: string; ar: string }> = {
      home: { en: "Home", ar: "الرئيسية" },
      createJob: { en: "Create Job", ar: "إنشاء وظيفة" },
      caseStudies: { en: "Case Studies", ar: "دراسات الحالة" },
      cvAnalyzer: { en: "CV Analyzer", ar: "محلل السير الذاتية" },
      preBuiltTests: { en: "Pre-Built Tests", ar: "الاختبارات الجاهزة" },
      caseStudyAssessments: { en: "Case Study Assessments", ar: "تقييمات دراسة الحالة" },
      allJobs: { en: "All Jobs", ar: "جميع الوظائف" }
    };

    // Try to get from i18n first, fallback to hardcoded translations
    const translationKey = `sidebar.${labelKey}`;
    const translated = t(translationKey);
    
    // If translation key not found, use hardcoded fallback
    if (translated === translationKey && translations[labelKey]) {
      return translations[labelKey][i18n.language as 'en' | 'ar'] || translations[labelKey].en;
    }
    
    return translated;
  };

  // Filter menu based on plan type
  const filteredMenuItems = menuItems.filter((item) => {
    if (planType === 'case_only' && (item.id === 'create' || item.id === 'all-jobs')) {
      return false;
    }
    if (planType === 'full' && item.id === 'case-study-assessments') {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-80 bg-white border-r border-gray-200 min-h-screen sticky top-0 flex flex-col">
      <nav className="p-6 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <li key={item.id}>
                <a
                  href={item.link}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-xl text-base font-medium transition-colors w-full",
                    isActive
                      ? "bg-merit-dark text-white"
                      : "text-merit-gray hover:bg-gray-50",
                    // RTL support: flip icon position for Arabic
                    i18n.language === 'ar' && "flex-row-reverse"
                  )}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <span className="whitespace-nowrap">{getLabel(item.labelKey)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
        <div className="bg-gray-100 rounded-2xl p-4">
          <div
            className={cn(
              "flex items-center gap-3",
              i18n.language === "ar" && "flex-row-reverse"
            )}
          >
            <ProfilePicture
              profilePicture={profile?.profile_picture}
              fullName={
                profile?.full_name ||
                (i18n.language === "ar" ? "فاخر علي" : "Fakhir Ali")
              }
              onUpdate={(url) =>
                setProfile({ ...profile, profile_picture: url })
              }
            />
            <div
              className={cn(
                "min-w-0 flex-1",
                i18n.language === "ar" && "text-right"
              )}
            >
              <p className="font-medium text-merit-dark truncate">
                {profile?.full_name ||
                  (i18n.language === "ar" ? "فاخر علي" : "Fakhir Ali")}
              </p>
              <p className="text-sm text-merit-gray truncate">
                {profile?.user_type ||
                  (i18n.language === "ar"
                    ? "مسؤول الموارد البشرية"
                    : "HR Executive")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}