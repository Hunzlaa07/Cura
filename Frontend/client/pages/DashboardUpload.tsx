import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import Sidebar from "@/components/dashboard/Sidebar";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Bell, History, Briefcase, MapPin, Clock, RefreshCw, Save, Check, Calendar, Edit2, X, Upload } from "lucide-react";
import { getHeaders } from "@/lib/apiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextareaAutosize from 'react-textarea-autosize';
import DateTimePicker from '@/components/DateTimePicker';
import { UploadJDTab } from "@/components/UploadJDTab";
function TopBar() {
  const { t } = useTranslation();
  
  return (
    <header className="h-14 md:h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
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
        <span className="text-xl md:text-2xl font-bold text-[#1a1a1a]">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitcher />

      </div>
    </header>
  );
}

function formatDateWithArabicMonths(gregorianDate, language) {
  const date = new Date(gregorianDate);

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (language === 'ar') {
    const monthName = arabicMonths[date.getMonth()];
    return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
  }

  const monthName = englishMonths[date.getMonth()];
  return `${monthName} ${day}, ${year}, ${hours}:${minutes}`;
}


function formatResponsibilities(responsibilities) {
  if (!responsibilities) return [];
  if (Array.isArray(responsibilities)) {
    return responsibilities;
  }
  if (typeof responsibilities === 'string' && responsibilities.startsWith('[')) {
    try {
      const arr = JSON.parse(responsibilities);
      if (Array.isArray(arr)) {
        return arr;
      }
    } catch (e) {
      // If parsing fails, treat as regular string
    }
  }
  if (typeof responsibilities === 'string') {
    return responsibilities
      .split("\n")
      .map((item) => item.trim().replace(/^[\•\-\*]\s*/, ''))
      .filter(Boolean);
  }
  return [];
}

// Edit Modal Component with Language Sync
function EditJobModal({ isOpen, onClose, aiDescription, formData, onSave, isLoading, i18n }) {
  const [editedDescription, setEditedDescription] = useState({
    description_en: "",
    description_ar: "",
    key_responsibilities_en: "",
    key_responsibilities_ar: "",
  });

  const [syncMode, setSyncMode] = useState('current'); // 'current' or 'all'

  useEffect(() => {
    if (isOpen && aiDescription) {
      setEditedDescription({
        description_en: aiDescription.description_en || "",
        description_ar: aiDescription.description_ar || "",
        key_responsibilities_en: Array.isArray(aiDescription.key_responsibilities_en)
          ? aiDescription.key_responsibilities_en.join("\n")
          : aiDescription.key_responsibilities_en || "",
        key_responsibilities_ar: Array.isArray(aiDescription.key_responsibilities_ar)
          ? aiDescription.key_responsibilities_ar.join("\n")
          : aiDescription.key_responsibilities_ar || "",
      });
      // Set sync mode based on current language
      setSyncMode('current');
    }
  }, [isOpen, aiDescription]);

  const handleDescriptionChange = (e, field) => {
    const newValue = e.target.value;

    if (syncMode === 'current') {
      // In Auto Sync mode, just update the current language field only
      // Don't try to sync - let the user confirm which version to save
      setEditedDescription(prev => ({
        ...prev,
        [field]: newValue
      }));
    } else {
      // Separate edit mode - update only the edited field
      setEditedDescription(prev => ({
        ...prev,
        [field]: newValue
      }));
    }
  };

  if (!isOpen) return null;

  const isEnglish = i18n.language === 'en';
  const currentLangSuffix = isEnglish ? '_en' : '_ar';
  const otherLangSuffix = isEnglish ? '_ar' : '_en';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between p-5 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-[#1a1a1a]">
            {i18n.language === 'ar' ? 'تحرير الوصف الوظيفي' : 'Edit Job Description'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Mode Toggle */}
        <div className="border-b border-gray-200 px-5 md:px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium text-[#1a1a1a]">
              {i18n.language === 'ar' ? 'نمط التحرير:' : 'Edit Mode:'}
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={syncMode === 'current'}
                onChange={() => setSyncMode('current')}
                className="accent-[#C8F55A]"
              />
              <span className="text-sm text-gray-700">
                {i18n.language === 'ar' ? 'لغة واحدة' : 'Current Language Only'}
              </span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={syncMode === 'all'}
                onChange={() => setSyncMode('all')}
                className="accent-[#C8F55A]"
              />
              <span className="text-sm text-gray-700">
                {i18n.language === 'ar' ? 'كلا اللغتين' : 'Both Languages'}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            {syncMode === 'current'
              ? (i18n.language === 'ar'
                ? 'تحرير اللغة الحالية فقط. تأكد من تحديث اللغة الأخرى بشكل منفصل'
                : 'Edit current language only. Make sure to update the other language separately')
              : (i18n.language === 'ar'
                ? 'قم بتحرير كلا اللغتين معاً'
                : 'Edit both languages independently')}
          </p>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          {/* Current Language Description */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              {i18n.language === 'ar' ? 'وصف الوظيفة (عربي)' : 'Job Description (English)'}
            </label>
            <TextareaAutosize
              value={isEnglish ? editedDescription.description_en : editedDescription.description_ar}
              onChange={(e) => handleDescriptionChange(e, `description${currentLangSuffix}`)}
              minRows={4}
              maxRows={10}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            />
            {syncMode === 'current' && (
              <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {i18n.language === 'ar' ? 'تحرير اللغة الحالية فقط' : 'Editing current language only'}
              </p>
            )}
          </div>

          {/* Other Language Description (only show if separate edit mode) */}
          {syncMode === 'all' && (
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                {i18n.language === 'ar' ? 'وصف الوظيفة (إنجليزي)' : 'Job Description (Arabic)'}
              </label>
              <TextareaAutosize
                value={isEnglish ? editedDescription.description_ar : editedDescription.description_en}
                onChange={(e) => handleDescriptionChange(e, `description${otherLangSuffix}`)}
                minRows={4}
                maxRows={10}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                dir={isEnglish ? 'rtl' : 'ltr'}
              />
            </div>
          )}

          {/* Current Language Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              {i18n.language === 'ar' ? 'المسؤوليات الرئيسية (عربي)' : 'Key Responsibilities (English)'}
            </label>
            <TextareaAutosize
              value={isEnglish ? editedDescription.key_responsibilities_en : editedDescription.key_responsibilities_ar}
              onChange={(e) => handleDescriptionChange(e, `key_responsibilities${currentLangSuffix}`)}
              minRows={4}
              maxRows={10}
              placeholder={i18n.language === 'ar' ? 'واحدة لكل سطر' : 'One per line'}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
            />
            {syncMode === 'current' && (
              <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {i18n.language === 'ar' ? 'تحرير اللغة الحالية فقط' : 'Editing current language only'}
              </p>
            )}
          </div>

          {/* Other Language Responsibilities (only show if separate edit mode) */}
          {syncMode === 'all' && (
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                {i18n.language === 'ar' ? 'المسؤوليات الرئيسية (إنجليزي)' : 'Key Responsibilities (Arabic)'}
              </label>
              <TextareaAutosize
                value={isEnglish ? editedDescription.key_responsibilities_ar : editedDescription.key_responsibilities_en}
                onChange={(e) => handleDescriptionChange(e, `key_responsibilities${otherLangSuffix}`)}
                minRows={4}
                maxRows={10}
                placeholder={i18n.language === 'ar' ? 'واحدة لكل سطر' : 'One per line'}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                dir={isEnglish ? 'rtl' : 'ltr'}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 flex gap-3 p-5 md:p-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium"
          >
            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => onSave(editedDescription)}
            disabled={isLoading}
            className="px-4 py-2 bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isLoading
              ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
              : (i18n.language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIJobForm() {
  const { toast } = useToast();
  const { i18n, t } = useTranslation();
  const [activeTab, setActiveTab] = useState("ai");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    skills: "",
    key_responsibilities: "",
    experience_level: "Mid Level (3-5 years)",
    department: "",
    location: "",
    employment_type: "full-time",
    application_deadline: "",
    min_experience_years: "",
    max_experience_years: "",
    custom_instructions: "",
  });

  const [manualJobData, setManualJobData] = useState({
    title: "",
    description: "",
    description_ar: "",
    key_responsibilities: "",
    key_responsibilities_ar: "",
    department: "",
    location: "",
    employment_type: "full-time",
    experience_level: "mid",
    min_experience_years: "",
    max_experience_years: "",
    status: "active",
    application_deadline: "",
    skills: [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [skillProficiency, setSkillProficiency] = useState("intermediate");
  const [skillIsRequired, setSkillIsRequired] = useState(true);

  const [aiDescription, setAiDescription] = useState({
    description_en: "",
    description_ar: "",
    key_responsibilities_en: "",
    key_responsibilities_ar: "",
    extracted_skills: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    console.log('i18n.language (DashboardUpload):', i18n.language, ' - createJobText =>', t('dashboardUploadPage.createJobText'));
  }, [i18n.language]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualChange = (e) => {
    setManualJobData({ ...manualJobData, [e.target.name]: e.target.value });
  };

  const experienceMap = {
    "Entry Level (0-2 years)": "entry",
    "Mid Level (3-5 years)": "mid",
    "Senior (6-9 years)": "senior",
    "Lead (10+ years)": "lead",
  };

  const generateJob = async () => {
    setLoading(true);
    try {
      console.log('📤 Generating job with language:', i18n.language);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...formData,
          custom_instructions: formData.custom_instructions // 🆕 Include custom instructions
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ Backend response:', data);

      if (data.description) {
        setAiDescription({
          description_en: data.description,
          description_ar: data.description_ar || data.description,
          key_responsibilities_en: Array.isArray(data.key_responsibilities)
            ? data.key_responsibilities
            : data.key_responsibilities,
          key_responsibilities_ar: Array.isArray(data.key_responsibilities_ar)
            ? data.key_responsibilities_ar
            : (data.key_responsibilities_ar || data.key_responsibilities),
          extracted_skills: data.extracted_skills || []
        });

        setFormData(prev => ({
          ...prev,
          key_responsibilities: data.key_responsibilities
        }));
        setGenerated(true);

        toast({
          title: t('dashboardUploadPage.alerts.jobGenerated') || "Success ✨",
          description: i18n.language === 'ar'
            ? "تم إنشاء وصف الوظيفة بكلتا اللغتين!"
            : "Job description generated in both languages!",
          variant: "default",
        });
      } else {
        toast({
          variant: "destructive",
          title: t('error') || "Error",
          description: t('dashboardUploadPage.alerts.jobGenerateFailed') || "Failed to generate job description",
        });
      }
    } catch (err) {
      console.error("❌ Error generating job:", err);
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: err.message || t('dashboardUploadPage.alerts.jobGenerateFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  // In your main AIJobForm component, replace the handleSaveEditedDescription function with this:

  const handleSaveEditedDescription = (editedDescription) => {
    // Convert string responsibilities to arrays - keep the original format
    const responsibilitiesEnArray = editedDescription.key_responsibilities_en
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => item.replace(/^[\•\-\*]\s*/, '')); // Remove bullet points if present

    const responsibilitiesArArray = editedDescription.key_responsibilities_ar
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => item.replace(/^[\•\-\*]\s*/, ''));

    console.log('✅ Saving edited description');
    console.log('EN Responsibilities:', responsibilitiesEnArray);
    console.log('AR Responsibilities:', responsibilitiesArArray);

    // Update state with both languages
    setAiDescription(prev => ({
      ...prev,
      description_en: editedDescription.description_en,
      description_ar: editedDescription.description_ar,
      key_responsibilities_en: responsibilitiesEnArray,
      key_responsibilities_ar: responsibilitiesArArray,
    }));

    setIsEditModalOpen(false);

    toast({
      title: t('success') || "Success",
      description: i18n.language === 'ar'
        ? "تم تحديث الوصف الوظيفي في كلا اللغتين!"
        : "Job description updated in both languages!",
      variant: "default",
    });
  };

  const saveJob = async (useAiGenerated = true) => {
    const currentData = useAiGenerated ? formData : manualJobData;

    if (!currentData.application_deadline) {
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: i18n.language === 'ar'
          ? "يرجى تحديد موعد نهائي للتقديم"
          : "Please set an application deadline",
      });
      return;
    }

    const deadlineDate = new Date(currentData.application_deadline);
    if (deadlineDate < new Date()) {
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: i18n.language === 'ar'
          ? "يجب أن يكون الموعد النهائي للتقديم في المستقبل"
          : "Application deadline must be in the future",
      });
      return;
    }

    setSaving(true);
    try {
      const jobPayload = useAiGenerated ? {
        ...formData,
        description: aiDescription.description_en,
        description_ar: aiDescription.description_ar,
        key_responsibilities: aiDescription.key_responsibilities_en,
        key_responsibilities_ar: aiDescription.key_responsibilities_ar,
        experience_level: experienceMap[formData.experience_level],
        status: "active",
        application_deadline: formData.application_deadline,
        min_experience_years: formData.min_experience_years ? parseInt(formData.min_experience_years) : 0,
        max_experience_years: formData.max_experience_years ? parseInt(formData.max_experience_years) : 0,
        extracted_skills: aiDescription.extracted_skills,
      } : {
        ...manualJobData,
        min_experience_years: manualJobData.min_experience_years ? parseInt(manualJobData.min_experience_years) : 0,
        max_experience_years: manualJobData.max_experience_years ? parseInt(manualJobData.max_experience_years) : 0,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(jobPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();

      toast({
        title: t('dashboardUploadPage.alerts.jobSaved') || "Success ✨",
        description: i18n.language === 'ar'
          ? `تم حفظ الوظيفة بنجاح!`
          : `Job saved successfully!`,
        variant: "default",
      });

      setFormData({
        title: "",
        skills: "",
        key_responsibilities: "",
        experience_level: "Mid Level (3-5 years)",
        department: "",
        location: "",
        employment_type: "full-time",
        application_deadline: "",
        min_experience_years: "",
        max_experience_years: "",
        custom_instructions: "",
      });
      setManualJobData({
        title: "",
        description: "",
        description_ar: "",
        key_responsibilities: "",
        key_responsibilities_ar: "",
        department: "",
        location: "",
        employment_type: "full-time",
        experience_level: "mid",
        min_experience_years: "",
        max_experience_years: "",
        status: "active",
        application_deadline: "",
        skills: [],
      });
      setGenerated(false);
      setAiDescription({
        description_en: "",
        description_ar: "",
        key_responsibilities_en: "",
        key_responsibilities_ar: "",
        extracted_skills: []
      });
      setActiveTab("ai");
    } catch (err) {
      console.error("❌ Error saving job:", err);
      toast({
        variant: "destructive",
        title: t('error') || "Error",
        description: err.message || t('dashboardUploadPage.alerts.jobSaveFailed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const currentDescription = i18n.language === 'ar'
    ? (aiDescription.description_ar || aiDescription.description_en)
    : aiDescription.description_en;

  const currentResponsibilities = i18n.language === 'ar'
    ? (aiDescription.key_responsibilities_ar || aiDescription.key_responsibilities_en)
    : aiDescription.key_responsibilities_en;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
      <TopBar />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <Sidebar activeItem="create" />
        </div>
        <main className="flex-1 p-6 md:p-10 lg:px-20">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-1 flex items-center gap-2">
                  <Upload className="w-8 h-8 text-[#75A400]" />
                  {t('dashboardUploadPage.createJob', 'Create Job')}
                </h1>
                <p className="text-gray-600">
                  {t('dashboardUploadPage.createJobText', 'Create a job by generating with AI, uploading a job description, or entering details, then save or export it.')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            <section className="bg-white border border-gray-200 rounded-2xl p-5">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-white rounded-lg p-2 gap-2">

                  <TabsTrigger
                    value="ai"
                    className="rounded-md border border-gray-200 bg-white text-gray-600 data-[state=active]:bg-[#C8F55A] data-[state=active]:text-black"
                  >
                    {i18n.language === 'ar' ? 'AI' : 'AI Generate'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="rounded-md border border-gray-200 bg-white text-gray-600 data-[state=active]:bg-[#C8F55A] data-[state=active]:text-black"
                  >
                    {i18n.language === 'ar' ? 'تحميل' : 'Upload'}
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="rounded-md border border-gray-200 bg-white text-gray-600 data-[state=active]:bg-[#C8F55A] data-[state=active]:text-black"
                  >
                    {i18n.language === 'ar' ? 'يدوي' : 'Manual'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-3.5 md:space-y-4">
                  <h2 className="font-semibold text-[#1a1a1a] mb-3 md:mb-4">
                    {t('dashboardUploadPage.jobDetails') || 'Job Details'}
                  </h2>

                  <div className="space-y-3.5 md:space-y-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {t('dashboardUploadPage.roleTitle') || 'Role Title'}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        placeholder={i18n.language === 'ar' ? 'مهندس برمجيات أول' : 'Senior Software Engineer'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {t('dashboardUploadPage.experienceLevel') || 'Experience Level'}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                      >
                        <option>Entry Level (0-2 years)</option>
                        <option>Mid Level (3-5 years)</option>
                        <option>Senior (6-9 years)</option>
                        <option>Lead (10+ years)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {i18n.language === 'ar' ? 'الحد الأدنى (سنوات)' : 'Min Experience (Years)'}
                        </label>
                        <input
                          type="number"
                          name="min_experience_years"
                          value={formData.min_experience_years}
                          onChange={handleChange}
                          min="0"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {i18n.language === 'ar' ? 'الحد الأقصى (سنوات)' : 'Max Experience (Years)'}
                        </label>
                        <input
                          type="number"
                          name="max_experience_years"
                          value={formData.max_experience_years}
                          onChange={handleChange}
                          min="0"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {t('dashboardUploadPage.department') || 'Department'}
                        </label>
                        <input
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder={i18n.language === 'ar' ? 'الهندسة' : 'Engineering'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {t('dashboardUploadPage.location') || 'Location'}
                        </label>
                        <select
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        >
                          <option value="">Select Location</option>
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <optgroup label="North America">
                            <option value="New York, NY, USA">New York, NY, USA</option>
                            <option value="San Francisco, CA, USA">San Francisco, CA, USA</option>
                            <option value="Los Angeles, CA, USA">Los Angeles, CA, USA</option>
                            <option value="Chicago, IL, USA">Chicago, IL, USA</option>
                            <option value="Austin, TX, USA">Austin, TX, USA</option>
                            <option value="Seattle, WA, USA">Seattle, WA, USA</option>
                            <option value="Boston, MA, USA">Boston, MA, USA</option>
                            <option value="Toronto, ON, Canada">Toronto, ON, Canada</option>
                            <option value="Vancouver, BC, Canada">Vancouver, BC, Canada</option>
                            <option value="Mexico City, Mexico">Mexico City, Mexico</option>
                          </optgroup>
                          <optgroup label="Europe">
                            <option value="London, UK">London, UK</option>
                            <option value="Berlin, Germany">Berlin, Germany</option>
                            <option value="Paris, France">Paris, France</option>
                            <option value="Amsterdam, Netherlands">Amsterdam, Netherlands</option>
                            <option value="Dublin, Ireland">Dublin, Ireland</option>
                            <option value="Stockholm, Sweden">Stockholm, Sweden</option>
                            <option value="Copenhagen, Denmark">Copenhagen, Denmark</option>
                            <option value="Madrid, Spain">Madrid, Spain</option>
                            <option value="Barcelona, Spain">Barcelona, Spain</option>
                            <option value="Rome, Italy">Rome, Italy</option>
                            <option value="Zurich, Switzerland">Zurich, Switzerland</option>
                            <option value="Vienna, Austria">Vienna, Austria</option>
                            <option value="Warsaw, Poland">Warsaw, Poland</option>
                            <option value="Prague, Czech Republic">Prague, Czech Republic</option>
                          </optgroup>
                          <optgroup label="Asia">
                            <option value="Tokyo, Japan">Tokyo, Japan</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Hong Kong">Hong Kong</option>
                            <option value="Seoul, South Korea">Seoul, South Korea</option>
                            <option value="Beijing, China">Beijing, China</option>
                            <option value="Shanghai, China">Shanghai, China</option>
                            <option value="Bangalore, India">Bangalore, India</option>
                            <option value="Mumbai, India">Mumbai, India</option>
                            <option value="Delhi, India">Delhi, India</option>
                            <option value="Hyderabad, India">Hyderabad, India</option>
                            <option value="Dubai, UAE">Dubai, UAE</option>
                            <option value="Tel Aviv, Israel">Tel Aviv, Israel</option>
                            <option value="Bangkok, Thailand">Bangkok, Thailand</option>
                            <option value="Kuala Lumpur, Malaysia">Kuala Lumpur, Malaysia</option>
                            <option value="Jakarta, Indonesia">Jakarta, Indonesia</option>
                            <option value="Manila, Philippines">Manila, Philippines</option>
                          </optgroup>
                          <optgroup label="Middle East">
                            <option value="Riyadh, Saudi Arabia">Riyadh, Saudi Arabia</option>
                            <option value="Abu Dhabi, UAE">Abu Dhabi, UAE</option>
                            <option value="Doha, Qatar">Doha, Qatar</option>
                            <option value="Kuwait City, Kuwait">Kuwait City, Kuwait</option>
                            <option value="Beirut, Lebanon">Beirut, Lebanon</option>
                            <option value="Amman, Jordan">Amman, Jordan</option>
                          </optgroup>
                          <optgroup label="Oceania">
                            <option value="Sydney, Australia">Sydney, Australia</option>
                            <option value="Melbourne, Australia">Melbourne, Australia</option>
                            <option value="Brisbane, Australia">Brisbane, Australia</option>
                            <option value="Perth, Australia">Perth, Australia</option>
                            <option value="Auckland, New Zealand">Auckland, New Zealand</option>
                            <option value="Wellington, New Zealand">Wellington, New Zealand</option>
                          </optgroup>
                          <optgroup label="South America">
                            <option value="São Paulo, Brazil">São Paulo, Brazil</option>
                            <option value="Rio de Janeiro, Brazil">Rio de Janeiro, Brazil</option>
                            <option value="Buenos Aires, Argentina">Buenos Aires, Argentina</option>
                            <option value="Santiago, Chile">Santiago, Chile</option>
                            <option value="Lima, Peru">Lima, Peru</option>
                            <option value="Bogotá, Colombia">Bogotá, Colombia</option>
                          </optgroup>
                          <optgroup label="Africa">
                            <option value="Cape Town, South Africa">Cape Town, South Africa</option>
                            <option value="Johannesburg, South Africa">Johannesburg, South Africa</option>
                            <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                            <option value="Cairo, Egypt">Cairo, Egypt</option>
                            <option value="Nairobi, Kenya">Nairobi, Kenya</option>
                            <option value="Casablanca, Morocco">Casablanca, Morocco</option>
                          </optgroup>
                          <optgroup label="South Asia">
                            <option value="Karachi, Pakistan">Karachi, Pakistan</option>
                            <option value="Lahore, Pakistan">Lahore, Pakistan</option>
                            <option value="Islamabad, Pakistan">Islamabad, Pakistan</option>
                            <option value="Rawalpindi, Pakistan">Rawalpindi, Pakistan</option>
                            <option value="Dhaka, Bangladesh">Dhaka, Bangladesh</option>
                            <option value="Colombo, Sri Lanka">Colombo, Sri Lanka</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {t('dashboardUploadPage.employmentType') || 'Employment Type'}
                      </label>
                      <select
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                      >
                        <option value="full-time">{i18n.language === 'ar' ? 'دوام كامل' : 'Full-time'}</option>
                        <option value="part-time">{i18n.language === 'ar' ? 'دوام جزئي' : 'Part-time'}</option>
                        <option value="contract">{i18n.language === 'ar' ? 'عقد' : 'Contract'}</option>
                      </select>
                    </div>
                    {/* 🆕 INSTRUCTIONS SECTION */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a]">
                          {i18n.language === 'ar' ? 'تعليمات مخصصة (اختياري)' : 'Custom Instructions (Optional)'}
                        </label>
                        <span className="text-[10px] text-gray-500">
                          {i18n.language === 'ar' ? 'لتحسين الدقة' : 'For better accuracy'}
                        </span>
                      </div>
                      <TextareaAutosize
                        name="custom_instructions"
                        value={formData.custom_instructions}
                        onChange={handleChange}
                        minRows={3}
                        maxRows={6}
                        placeholder={i18n.language === 'ar'
                          ? 'مثال: نبحث عن شخص متخصص في التكنولوجيا السحابية... أو نريد تركيزاً على القيادة والتعاون...'
                          : 'Example: We\'re looking for someone specialized in cloud technologies... Or we want emphasis on leadership and collaboration...'
                        }
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">
                        {i18n.language === 'ar'
                          ? '💡 أضف معلومات إضافية عن الشركة أو متطلبات محددة أو أولويات للدور'
                          : '💡 Add company details, specific requirements, or role priorities'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {i18n.language === 'ar' ? 'الموعد النهائي للتقديم' : 'Application Deadline'}
                        <span className="text-red-500">*</span>
                      </label>
                      <DateTimePicker
                        value={formData.application_deadline}
                        onChange={(value) => setFormData({ ...formData, application_deadline: value })}
                      />
                    </div>

                    <button
                      onClick={generateJob}
                      disabled={loading || !formData.title}
                      className="w-full bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] gap-2 h-10 md:h-11 text-sm md:text-base rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      {loading
                        ? (i18n.language === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                        : (i18n.language === 'ar' ? 'إنشاء وصف وظيفي' : 'Generate Job Description')
                      }
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="space-y-3.5 md:space-y-4">
                  <UploadJDTab
                    onExtract={(data) => {
                      // This is no longer used, but keeping for backwards compatibility
                    }}
                    i18n={i18n}
                    onSaveJob={async (uploadedFormData) => {
                      // Validate required fields
                      if (!uploadedFormData.title || !uploadedFormData.title.trim()) {
                        toast({
                          variant: "destructive",
                          title: t('error') || "Error",
                          description: i18n.language === 'ar' ? "يرجى إدخال عنوان الوظيفة" : "Please enter job title",
                        });
                        return;
                      }

                      if (!uploadedFormData.application_deadline) {
                        toast({
                          variant: "destructive",
                          title: t('error') || "Error",
                          description: i18n.language === 'ar' ? "يرجى تحديد موعد نهائي للتقديم" : "Please set application deadline",
                        });
                        return;
                      }

                      // Validate deadline is in future
                      const deadlineDate = new Date(uploadedFormData.application_deadline);
                      if (deadlineDate < new Date()) {
                        toast({
                          variant: "destructive",
                          title: t('error') || "Error",
                          description: i18n.language === 'ar'
                            ? "يجب أن يكون الموعد النهائي في المستقبل"
                            : "Application deadline must be in the future",
                        });
                        return;
                      }

                      // Map experience level
                      const experienceMap = {
                        "Entry Level (0-2 years)": "entry",
                        "Mid Level (3-5 years)": "mid",
                        "Senior (6-9 years)": "senior",
                        "Lead (10+ years)": "lead",
                      };

                      try {
                        setSaving(true);

                        const jobPayload = {
                          title: uploadedFormData.title.trim().substring(0, 255),
                          description: uploadedFormData.description?.trim().substring(0, 3000) || uploadedFormData.title,
                          description_ar: uploadedFormData.description?.trim().substring(0, 3000) || uploadedFormData.title,
                          key_responsibilities: Array.isArray(uploadedFormData.key_responsibilities)
                            ? uploadedFormData.key_responsibilities.join('\n')
                            : (uploadedFormData.key_responsibilities?.trim().substring(0, 2000) || ''),
                          key_responsibilities_ar: Array.isArray(uploadedFormData.key_responsibilities)
                            ? uploadedFormData.key_responsibilities.join('\n')
                            : (uploadedFormData.key_responsibilities?.trim().substring(0, 2000) || ''),
                          department: uploadedFormData.department?.trim().substring(0, 100) || '',
                          department_ar: uploadedFormData.department?.trim().substring(0, 100) || '',
                          location: uploadedFormData.location?.trim().substring(0, 100) || '',
                          location_ar: uploadedFormData.location?.trim().substring(0, 100) || '',
                          employment_type: uploadedFormData.employment_type || 'full-time',
                          experience_level: experienceMap[uploadedFormData.experience_level] || 'mid',
                          min_experience_years: uploadedFormData.min_experience_years ? parseInt(uploadedFormData.min_experience_years) : 0,
                          max_experience_years: uploadedFormData.max_experience_years ? parseInt(uploadedFormData.max_experience_years) : 0,
                          application_deadline: new Date(uploadedFormData.application_deadline).toISOString().slice(0, 19).replace('T', ' '),
                          status: "active",
                        };

                        console.log('📝 Job Payload:', {
                          title: jobPayload.title,
                          department: jobPayload.department,
                          location: jobPayload.location,
                          employment_type: jobPayload.employment_type,
                          experience_level: jobPayload.experience_level,
                          application_deadline: jobPayload.application_deadline
                        });

                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs`, {
                          method: "POST",
                          headers: getHeaders(),
                          body: JSON.stringify(jobPayload),
                        });

                        if (!res.ok) {
                          const errorData = await res.json();
                          console.error('❌ API Error:', errorData);
                          throw new Error(errorData.error || errorData.details || `HTTP error ${res.status}`);
                        }

                        const data = await res.json();
                        console.log('✅ Job created:', data);

                        toast({
                          title: t('dashboardUploadPage.alerts.jobSaved') || "Success ✨",
                          description: i18n.language === 'ar'
                            ? `تم حفظ الوظيفة بنجاح!`
                            : `Job saved successfully!`,
                          variant: "default",
                        });

                        // Reset and go back to AI tab
                        setActiveTab("ai");

                      } catch (err) {
                        console.error("❌ Error saving job:", err);
                        toast({
                          variant: "destructive",
                          title: t('error') || "Error",
                          description: err.message || (i18n.language === 'ar' ? "فشل حفظ الوظيفة" : "Failed to save job"),
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </TabsContent>
                <TabsContent value="manual" className="space-y-3.5 md:space-y-4">
                  <h2 className="font-semibold text-[#1a1a1a] mb-3 md:mb-4">
                    {i18n.language === 'ar' ? 'إضافة وظيفة يدويًا' : 'Add Job Manually'}
                  </h2>

                  <div className="space-y-3.5 md:space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {t('dashboardUploadPage.roleTitle') || 'Job Title'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={manualJobData.title}
                        onChange={handleManualChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        placeholder={i18n.language === 'ar' ? 'مهندس برمجيات أول' : 'Senior Software Engineer'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {i18n.language === 'ar' ? 'الوصف' : 'Description'}
                        <span className="text-red-500">*</span>
                      </label>
                      <TextareaAutosize
                        name="description"
                        value={manualJobData.description}
                        onChange={handleManualChange}
                        minRows={3}
                        maxRows={15}
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        placeholder={i18n.language === 'ar' ? 'أدخل وصف الوظيفة هنا' : 'Enter job description here'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {i18n.language === 'ar' ? 'المسؤوليات الرئيسية' : 'Key Responsibilities'}
                        <span className="text-red-500">*</span>
                      </label>
                      <TextareaAutosize
                        name="key_responsibilities"
                        value={manualJobData.key_responsibilities}
                        onChange={handleManualChange}
                        minRows={3}
                        maxRows={15}
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        placeholder={i18n.language === 'ar' ? 'أدخل المسؤوليات الرئيسية هنا' : 'Enter key responsibilities here'}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {t('dashboardUploadPage.department') || 'Department'}
                        </label>
                        <input
                          name="department"
                          value={manualJobData.department}
                          onChange={handleManualChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder={i18n.language === 'ar' ? 'الهندسة' : 'Engineering'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {t('dashboardUploadPage.location') || 'Location'}
                        </label>
                        <input
                          name="location"
                          value={manualJobData.location}
                          onChange={handleManualChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder={i18n.language === 'ar' ? 'كراتشي' : 'Karachi'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {t('dashboardUploadPage.employmentType') || 'Employment Type'}
                        </label>
                        <select
                          name="employment_type"
                          value={manualJobData.employment_type}
                          onChange={handleManualChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        >
                          <option value="full-time">{i18n.language === 'ar' ? 'دوام كامل' : 'Full-time'}</option>
                          <option value="part-time">{i18n.language === 'ar' ? 'دوام جزئي' : 'Part-time'}</option>
                          <option value="contract">{i18n.language === 'ar' ? 'عقد' : 'Contract'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {t('dashboardUploadPage.experienceLevel') || 'Experience Level'}
                        </label>
                        <select
                          name="experience_level"
                          value={manualJobData.experience_level}
                          onChange={handleManualChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                        >
                          <option value="entry">{i18n.language === 'ar' ? 'مبتدئ' : 'Entry'}</option>
                          <option value="mid">{i18n.language === 'ar' ? 'متوسط' : 'Mid'}</option>
                          <option value="senior">{i18n.language === 'ar' ? 'متقدم' : 'Senior'}</option>
                          <option value="lead">{i18n.language === 'ar' ? 'قيادي' : 'Lead'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {i18n.language === 'ar' ? 'الحد الأدنى (سنوات)' : 'Min Experience (Years)'}
                        </label>
                        <input
                          type="number"
                          name="min_experience_years"
                          value={manualJobData.min_experience_years}
                          onChange={handleManualChange}
                          min="0"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                          {i18n.language === 'ar' ? 'الحد الأقصى (سنوات)' : 'Max Experience (Years)'}
                        </label>
                        <input
                          type="number"
                          name="max_experience_years"
                          value={manualJobData.max_experience_years}
                          onChange={handleManualChange}
                          min="0"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                        {i18n.language === 'ar' ? 'الموعد النهائي للتقديم' : 'Application Deadline'}
                        <span className="text-red-500">*</span>
                      </label>
                      <DateTimePicker
                        value={formData.application_deadline}
                        onChange={(value) => setFormData({ ...formData, application_deadline: value })}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-[#1a1a1a] mb-3">
                        {i18n.language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}
                      </h4>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                              {i18n.language === 'ar' ? 'اسم المهارة' : 'Skill Name'}
                            </label>
                            <input
                              type="text"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                              placeholder={i18n.language === 'ar' ? 'مثل: React' : 'e.g., React'}
                            />
                          </div>
                          <div>
                            <label className="block text-xs md:text-sm font-medium text-[#1a1a1a] mb-1">
                              {i18n.language === 'ar' ? 'المستوى' : 'Proficiency'}
                            </label>
                            <select
                              value={skillProficiency}
                              onChange={(e) => setSkillProficiency(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                            >
                              <option value="beginner">{i18n.language === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
                              <option value="intermediate">{i18n.language === 'ar' ? 'متوسط' : 'Intermediate'}</option>
                              <option value="advanced">{i18n.language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                              <option value="expert">{i18n.language === 'ar' ? 'خبير' : 'Expert'}</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                checked={skillIsRequired}
                                onChange={(e) => setSkillIsRequired(e.target.checked)}
                                className="accent-[#C8F55A]"
                              />
                              <span className="text-xs md:text-sm text-[#1a1a1a]">
                                {i18n.language === 'ar' ? 'مطلوب ★' : 'Required ★'}
                              </span>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (skillInput.trim()) {
                              setManualJobData(prev => ({
                                ...prev,
                                skills: [...prev.skills, {
                                  skill_name: skillInput,
                                  minimum_proficiency: skillProficiency,
                                  is_required: skillIsRequired
                                }]
                              }));
                              setSkillInput("");
                              setSkillProficiency("intermediate");
                              setSkillIsRequired(true);
                            }
                          }}
                          className="w-full bg-gray-200 text-[#1a1a1a] hover:bg-gray-300 px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          {i18n.language === 'ar' ? 'إضافة مهارة' : 'Add Skill'}
                        </button>

                        {manualJobData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {manualJobData.skills.map((skill, index) => (
                              <div
                                key={index}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${skill.is_required
                                  ? 'bg-[#C8F55A] text-[#1a1a1a]'
                                  : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                <span>
                                  {skill.skill_name}
                                  {skill.is_required && <span className="ml-1">★</span>}
                                  <span className="ml-1 text-[10px] opacity-70">
                                    ({skill.minimum_proficiency})
                                  </span>
                                </span>
                                <button
                                  onClick={() => {
                                    setManualJobData(prev => ({
                                      ...prev,
                                      skills: prev.skills.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="text-xs hover:opacity-70"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => saveJob(false)}
                      disabled={saving || !manualJobData.title}
                      className="w-full bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] gap-2 h-10 md:h-11 text-sm md:text-base rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
                    >
                      <Check className={`w-4 h-4`} />
                      {saving
                        ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                        : (i18n.language === 'ar' ? 'حفظ الوظيفة' : 'Save Job')
                      }
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {activeTab === "ai" && (
              <section className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-[#1a1a1a] text-sm">
                    {i18n.language === 'ar' ? 'معاينة بواسطة الذكاء الاصطناعي' : 'AI-Generated Preview'}
                  </h2>
                  {generated && (
                    <span className="text-[11px] md:text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {i18n.language === 'ar' ? 'تم الإنشاء' : 'Generated'}
                    </span>
                  )}
                </div>

                <h3 className="text-base md:text-lg font-semibold text-[#1a1a1a] mb-2">
                  {formData.title || (i18n.language === 'ar' ? 'مهندس برمجيات أول' : 'Senior Software Engineer')}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {formData.department || (i18n.language === 'ar' ? 'الهندسة' : 'Engineering')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {formData.location || (i18n.language === 'ar' ? 'كراتشي' : 'Karachi')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {i18n.language === 'ar'
                      ? (formData.employment_type === "full-time" ? 'دوام كامل' : formData.employment_type === "part-time" ? 'دوام جزئي' : 'عقد')
                      : (formData.employment_type === "full-time" ? "Full-time" : formData.employment_type === "part-time" ? "Part-time" : "Contract")
                    }
                  </span>
                </div>

                {formData.application_deadline && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-yellow-800">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        {i18n.language === 'ar' ? 'تنتهي المواعيد:' : 'Applications close:'}
                      </span>
                      <span>
                        {formatDateWithArabicMonths(formData.application_deadline, i18n.language)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 md:space-y-4 text-[13px] md:text-sm max-h-[400px] overflow-y-auto pr-2">
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-1">
                      {i18n.language === 'ar' ? 'عن الدور' : 'About the Role'}
                    </h4>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {currentDescription || (i18n.language === 'ar'
                        ? 'قم بإنشاء وصف وظيفي لرؤية المعاينة...'
                        : 'Generate a job description to see preview...'
                      )}
                    </p>
                  </div>

                  {currentResponsibilities && (
                    <div>
                      <h4 className="font-semibold text-[#1a1a1a] mb-1">
                        {i18n.language === 'ar' ? 'المسؤوليات الرئيسية' : 'Key Responsibilities'}
                      </h4>
                      <ul className="pl-5 space-y-1 text-gray-600">
                        {formatResponsibilities(currentResponsibilities).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiDescription.extracted_skills && aiDescription.extracted_skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-[#1a1a1a] mb-2">
                        {i18n.language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiDescription.extracted_skills.map((skill, index) => (
                          <div
                            key={index}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium ${skill.is_required
                              ? 'bg-[#C8F55A] text-[#1a1a1a]'
                              : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {skill.skill_name}
                            {skill.is_required && <span className="ml-1 text-[10px]">★</span>}
                            <span className="ml-1 text-[10px] opacity-70">
                              ({skill.minimum_proficiency})
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2">
                        {i18n.language === 'ar'
                          ? '★ مهارات مطلوبة | الأخرى مفضلة'
                          : '★ Required skills | Others are preferred'
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
                  <button
                    onClick={generateJob}
                    disabled={loading}
                    className="gap-2 h-9 md:h-10 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {i18n.language === 'ar' ? 'إعادة الإنشاء' : 'Regenerate'}
                  </button>

                  {generated && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="gap-2 h-9 md:h-10 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      {i18n.language === 'ar' ? 'تحرير' : 'Edit'}
                    </button>
                  )}

                  <button
                    onClick={() => saveJob(true)}
                    disabled={saving || !generated}
                    className="gap-2 bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] h-9 md:h-10 px-4 rounded-lg flex items-center justify-center font-medium disabled:opacity-50 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    {saving
                      ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                      : (i18n.language === 'ar' ? 'الموافقة والتصدير' : 'Approve & Export')
                    }
                  </button>
                </div>
              </section>
            )}

            <EditJobModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              aiDescription={aiDescription}
              formData={formData}
              onSave={handleSaveEditedDescription}
              isLoading={saving}
              i18n={i18n}
            />
          </div>
        </main>
      </div>
    </div>
  );
}