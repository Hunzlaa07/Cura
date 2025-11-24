import { useState, useEffect } from "react";
import { Upload, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface ApplicantProfile {
  cv_file_path?: string;
  preferred_language?: "en" | "ar";
}

export default function ProfileActionsPanel() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch applicant profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/api/applicants/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        const profileData: ApplicantProfile = data.profile || data;

        setProfile(profileData);
        if (profileData.preferred_language) setLanguage(profileData.preferred_language);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [token, i18n.language, apiUrl]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle CV upload
  const handleUpload = async () => {
    if (!selectedFile || !token) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cv", selectedFile);
      formData.append("language", i18n.language);

      const res = await fetch(`${apiUrl}/api/applicants/upload-cv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload CV");
      const data = await res.json();
      
      toast({
        title: t("success"),
        description: i18n.language === 'ar' 
          ? "تم تحميل السيرة الذاتية بنجاح!" 
          : "CV uploaded successfully!",
        variant: "default",
      });
      
      setProfile({ ...profile, cv_file_path: data.filePath });
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: t("error"),
        description: err.message || (i18n.language === 'ar' 
          ? "فشل التحميل" 
          : "Upload failed"),
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-[370px] bg-white border border-gray-200 rounded-3xl p-8 h-fit">
      <h3 className="text-2xl font-semibold text-merit-dark mb-8">
        {i18n.language === 'ar' ? 'إجراءات الملف الشخصي' : 'Profile Actions'}
      </h3>

      <div className="space-y-6">
        {/* Upload CV Section */}
        <div className="border-4 border-dashed border-gray-300 rounded-2xl p-8">
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-merit-gray text-center mb-4">
              {i18n.language === 'ar' ? 'قم بتحميل سيرتك الذاتية' : 'Upload your CV'}
            </p>

            {/* File Input */}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full mb-4 text-sm text-gray-600 
             file:mr-4 file:py-2 file:px-4 
             file:rounded-md file:border-0 
             file:text-sm file:font-semibold 
             file:bg-merit-green file:text-black 
             hover:file:bg-merit-dark/80"
            />

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-merit-green text-merit-dark hover:bg-merit-green/90 py-3 text-base rounded-2xl"
            >
              {uploading 
                ? (i18n.language === 'ar' ? 'جاري التحميل...' : 'Uploading...')
                : (i18n.language === 'ar' ? 'تحميل السيرة الذاتية' : 'Upload CV')}
            </Button>

            {/* Show current CV */}
            {profile?.cv_file_path && (
              <a
                href={`${apiUrl}${profile.cv_file_path}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-2 text-merit-dark hover:underline"
              >
                <DownloadCloud className="w-5 h-5" />
                {i18n.language === 'ar' 
                  ? 'تحميل السيرة الذاتية الحالية' 
                  : 'Download Current CV'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}