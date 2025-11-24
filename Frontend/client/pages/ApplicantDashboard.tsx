import { useEffect, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ApplicantSidebar from "@/components/dashboard/ApplicantSidebar";
import JobCaseCard from "@/components/dashboard/JobCaseCard";
import ProfileActionsPanel from "@/components/dashboard/ProfileActionsPanel";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ApplicantDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch data with language header
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept-Language': i18n.language,
        };
        
        const apiUrl = import.meta.env.VITE_API_URL;
        
        // Fetch invitations and profile with language support
        const [invitationsRes, profileRes] = await Promise.all([
          fetch(`${apiUrl}/api/case-study-invitations/my-invitations`, { headers }),
          fetch(`${apiUrl}/api/applicants/profile`, { headers })
        ]);
        
        if (!invitationsRes.ok) {
          console.error('Failed to fetch invitations:', invitationsRes.status);
          throw new Error(`Failed to fetch invitations: ${invitationsRes.status}`);
        }
        
        const invitationsData = await invitationsRes.json();
        const profileData = await profileRes.json();
        
        console.log('📋 My invitations (with language):', invitationsData);
        console.log('🌍 Current language:', i18n.language);
        
        // Handle response format - invitations array or direct array
        const jobsArray = invitationsData.invitations || invitationsData;
        
        // ✅ FIX: Log the exact data being passed to JobCaseCard
        if (Array.isArray(jobsArray) && jobsArray.length > 0) {
          console.log('📊 First job object:', jobsArray[0]);
          console.log('   expires_at:', jobsArray[0].expires_at);
          console.log('   end_time:', jobsArray[0].end_time);
          console.log('   invited_at:', jobsArray[0].invited_at);
          console.log('   start_time:', jobsArray[0].start_time);
        }
        
        setJobs(Array.isArray(jobsArray) ? jobsArray : []);
        setProfile(profileData?.profile || null);

      } catch (err) {
        setError(t("applicantDashboardPage.errorLoading"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [t, i18n.language]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">{t("applicantDashboardPage.loading")}</div>;
  if (error) return <div className="text-red-500 flex items-center justify-center min-h-screen">{error}</div>;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#e1e4e8' }}>
      {/* Sidebar */}
      <ApplicantSidebar activeItem="search" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-12 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-merit-dark mb-2">
                {t("applicantDashboardPage.title")}
              </h1>
              <p className="text-lg text-merit-gray">
                  {t("applicantDashboardPage.welcomeBack")}
                  {profile?.full_name ? `, ${profile.full_name}` : ""}!
                  {" "}
                  {t("applicantDashboardPage.subtitle")}
              </p>

            </div>

            {/* Right Section */}
            <div className="flex items-center gap-6 relative">
              {/* Language Switcher */}
              <LanguageSwitcher />

              <div className="w-px h-8 bg-gray-300"></div>

              {/* Profile with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  {profile?.profile_picture ? (
                     <img
              src={profile.profile_picture}
                     alt={profile?.full_name || "User"}
                 className="w-12 h-12 rounded-full object-cover"
                />
) : (
               <div className="w-12 h-12 rounded-full bg-merit-green flex items-center justify-center">
                <span className="text-merit-dark text-lg font-semibold">
                 {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                   </span>
                    </div>
                    )}
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-12">
          <div className="flex gap-8">
            {/* Main Column */}
            <div className="flex-1 space-y-8">
              {/* AI-Powered Job Matches Banner */}
              <div className="bg-merit-green rounded-3xl p-8">
                <h2 className="text-3xl font-bold text-merit-dark mb-2">
                  {t("applicantDashboardPage.aiPoweredMatches")}
                </h2>
                <p className="text-lg text-merit-dark">
                  {t("applicantDashboardPage.basedOnSkills")}
                </p>
              </div>

              {/* Case Studies Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-semibold text-merit-dark">
                    {t("applicantDashboardPage.caseStudies")}
                  </h2>
                  <div className="flex items-center gap-4">
                    <select className="px-6 py-3 border-2 border-gray-300 rounded-lg text-base bg-white">
                      <option>{t("applicantDashboardPage.all")}</option>
                      <option>{t("applicantDashboardPage.active")}</option>
                      <option>{t("applicantDashboardPage.expired")}</option>
                    </select>
                    <Button className="bg-merit-green text-merit-dark hover:bg-merit-green/90 px-8 py-3 h-auto text-base rounded-lg gap-2">
                      {t("applicantDashboardPage.search")}
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 space-y-6">
                  {Array.isArray(jobs) && jobs.length > 0 ? (
                    jobs.map((job) => {
                      console.log('🔍 Job data:', job);
                      console.log('📝 Job title:', job.title);
                      console.log('🌍 Language:', i18n.language);
                      const displayStatus = job.status || 'active';
                    
                      return (
                        <JobCaseCard
                          key={job.invitation_id || job.id}
                          id={job.job_id || job.case_study_id || job.id}
                          title={job.title || t("applicantDashboardPage.noJobs")}
                          company={job.company || 'Company Name'}
                          location={job.location || 'Location'}
                          jobType={job.employment_type || 'Full-time'}
                          postedTime={job.posted_time || 'Recently'}
                          // ✅ FIX: Use correct fields from API response
                          startTime={job.invited_at || job.start_time || 'N/A'}
                          endTime={job.expires_at || job.end_time || 'N/A'}
                          status={displayStatus}
                          case_study_id={job.case_study_id}
                          job_id={job.job_id}
                        />
                      );
                    })
                  ) : (
                    <p className="text-merit-gray">{t("applicantDashboardPage.noJobs")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Actions Sidebar */}
            <ProfileActionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}