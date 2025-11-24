import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Bell, History, Download, RefreshCw, Save, ArrowRight, Check, ChevronDown, X, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { ClassicEditor, Essentials, Paragraph, Bold, Italic, Link, List, BlockQuote, Heading } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

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

const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

export default function DashboardCases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batch");

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const token = localStorage.getItem("token");
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const fetchCases = async () => {
    try {
      if (!token) return;
      setLoading(true);

      if (!batchId) {
        console.error("❌ ERROR: No batchId provided to DashboardCases!");
        throw new Error("Batch ID is required for this screen");
      }

      const url = `${import.meta.env.VITE_API_URL}/api/case-studies/batch/${batchId}`;

      console.log(`📂 Fetching batch ${batchId} with language: ${i18n.language}`);

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
      });

      if (!res.ok) {
        console.error(`❌ Failed to fetch batch ${batchId}: ${res.status}`);
        throw new Error(`Failed to fetch case studies: ${res.status}`);
      }

      const data = await res.json();
      const caseStudiesArray = data.caseStudies || [];

      console.log(`✅ Received ${caseStudiesArray.length} case studies from batch ${batchId}`);
      console.log("📊 First case data:", caseStudiesArray[0]);
      console.log("📋 Tables in first case:", caseStudiesArray[0]?.tables);

      setCases(caseStudiesArray);

      if (caseStudiesArray.length > 0 && !selectedCaseId) {
        const firstCase = caseStudiesArray[0];
        console.log("📋 Setting editData with tables:", firstCase.tables);

        setSelectedCaseId(firstCase.id);
        setEditData({
          title: firstCase.title || '',
          description: firstCase.description || '',
          instructions: firstCase.instructions || '',
          questions: firstCase.questions || [],
          tables: firstCase.tables || [],
        });
      }
    } catch (err) {
      console.error("❌ Error fetching case studies:", err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل تحميل دراسات الحالة" : "Failed to load case studies",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCase || !editData) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges =
      editData.title !== selectedCase.title ||
      editData.description !== selectedCase.description ||
      editData.instructions !== selectedCase.instructions ||
      JSON.stringify(editData.questions) !== JSON.stringify(selectedCase.questions || []) ||
      JSON.stringify(editData.tables) !== JSON.stringify(selectedCase.tables || []);

    setHasUnsavedChanges(hasChanges);
  }, [editData, selectedCase]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && selectedCase) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, selectedCase]);

  const handleNavigateWithConfirm = (path) => {
    if (hasUnsavedChanges && selectedCase) {
      setShowBackConfirm(true);
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    console.log(`🔄 useEffect triggered: batchId=${batchId}, i18n.language=${i18n.language}`);
    fetchCases();
  }, [batchId, i18n.language, token]);

  const handleSelectCase = (caseId) => {
    const caseStudy = cases.find(c => c.id === caseId);
    if (caseStudy) {
      setSelectedCaseId(caseId);
      setEditData({
        title: caseStudy.title,
        description: caseStudy.description,
        instructions: caseStudy.instructions,
        questions: caseStudy.questions || [],
        tables: caseStudy.tables || [],
      });
      setIsEditing(false);
      setActiveTab("description");
      setHasUnsavedChanges(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCaseId || !editData) return;

    try {
      const payload = {
        title: editData.title,
        description: editData.description,
        instructions: editData.instructions,
        duration_minutes: selectedCase?.duration_minutes,
        status: 'in_review',
        questions: editData.questions.map((q) => ({ question: q })),
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/${selectedCaseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update case study");

      toast({
        title: i18n.language === 'ar' ? "نجاح ✨" : "Success ✨",
        description: i18n.language === 'ar' ? "تم تحديث دراسة الحالة بنجاح!" : "Case study updated successfully!",
      });

      setHasUnsavedChanges(false);
      await fetchCases();
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving case study:", err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل حفظ التغييرات" : "Failed to save changes",
      });
    }
  };

  const handleTableRowChange = (tableIdx, rowIdx, colKey, value) => {
    const updatedTables = [...editData.tables];
    if (!updatedTables[tableIdx].rows) {
      updatedTables[tableIdx].rows = [];
    }
    if (!updatedTables[tableIdx].rows[rowIdx]) {
      updatedTables[tableIdx].rows[rowIdx] = {};
    }
    updatedTables[tableIdx].rows[rowIdx][colKey] = value;
    setEditData({ ...editData, tables: updatedTables });
  };

  const handleAddTableRow = (tableIdx) => {
    const updatedTables = [...editData.tables];
    const newRow = {};
    updatedTables[tableIdx].columns.forEach(col => {
      newRow[col.key] = '';
    });
    if (!updatedTables[tableIdx].rows) {
      updatedTables[tableIdx].rows = [];
    }
    updatedTables[tableIdx].rows.push(newRow);
    setEditData({ ...editData, tables: updatedTables });
  };

  const handleRemoveTableRow = (tableIdx, rowIdx) => {
    const updatedTables = [...editData.tables];
    updatedTables[tableIdx].rows.splice(rowIdx, 1);
    setEditData({ ...editData, tables: updatedTables });
  };

  const handleContinueToPreview = async () => {
    if (!selectedCaseId) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "اختر دراسة حالة للمتابعة" : "Please select a case study to continue",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/select/${selectedCaseId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": i18n.language
          },
        }
      );

      const data = await res.json();
      if (data?.caseStudyId) {
        setHasUnsavedChanges(false);
        navigate(`/recruiter-dashboard/cases/preview?selected=${data.caseStudyId}`);
      } else {
        toast({
          variant: "destructive",
          title: i18n.language === 'ar' ? "خطأ" : "Error",
          description: i18n.language === 'ar' ? "خطأ في اختيار دراسة الحالة" : "Error selecting case study",
        });
      }
    } catch (err) {
      console.error("Selection error:", err);
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "فشل اختيار دراسة الحالة" : "Failed to select case study",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              {i18n.language === 'ar' ? "هناك تغييرات غير محفوظة" : "Unsaved Changes"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              {i18n.language === 'ar'
                ? "لم تحفظ التغييرات على دراسة الحالة هذه. هل تريد مغادرة الصفحة دون حفظ أم الإقامة للتحرير؟"
                : "You have unsaved changes to this case study. Do you want to leave without saving or stay to edit?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBackConfirm(false)}>
              {i18n.language === 'ar' ? "البقاء والتحرير" : "Stay & Edit"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowBackConfirm(false);
                setHasUnsavedChanges(false);
                window.history.back();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {i18n.language === 'ar' ? "مغادرة دون حفظ" : "Leave Without Saving"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TopBar />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <Sidebar activeItem="cases" />
        </div>
        <main className="flex-1 p-6 md:p-12">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-gray-900 mb-3 leading-tight">
              {batchId
                ? (i18n.language === 'ar' ? 'تحرير واختيار' : 'Edit & Select')
                : (i18n.language === 'ar' ? 'تحرير دراسات الحالة' : 'Edit Case Studies')}
            </h1>
            <div className="h-1 w-16 bg-merit-green rounded-full mb-4"></div>
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl font-medium">
              {batchId
                ? (i18n.language === 'ar'
                  ? 'اختر من الخيارات الثلاثة المُنشأة، عدّلها حسب احتياجاتك، ثم انتقل إلى المعاينة'
                  : 'Select from AI-generated options, customize as needed, then preview')
                : (i18n.language === 'ar' ? 'راجع وخصص دراسات الحالة الخاصة بك' : 'Review and customize your case studies')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Case Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-7 sticky top-20">
                <h2 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-merit-green rounded-full"></span>
                  {i18n.language === 'ar' ? 'اختر دراسة' : 'Choose Case'}
                </h2>

                <div className="space-y-3">
                  {cases.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCase(c.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 font-medium text-sm border-2 ${selectedCaseId === c.id
                          ? 'bg-merit-green text-white border-merit-dark shadow-lg scale-105'
                          : 'bg-gray-50 text-gray-900 border-gray-200 hover:border-merit-green hover:bg-white hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedCaseId === c.id
                            ? 'bg-white/25'
                            : 'bg-gray-200'
                          }`}>
                          #{idx + 1}
                        </span>
                        <span className="flex-1 truncate text-sm font-semibold">{c.title}</span>
                        {selectedCaseId === c.id && (
                          <Check className="w-5 h-5 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {cases.length > 0 && (
                  <div className="mt-7 pt-7 border-t border-gray-200">
                    <Button
                      onClick={() => handleNavigateWithConfirm("/recruiter-dashboard/generate-case")}
                      variant="outline"
                      className="w-full text-sm font-semibold h-11 border-2 hover:bg-gray-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {i18n.language === 'ar' ? 'إنشاء جديد' : 'Generate New'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Content - Edit Section */}
            <div className="lg:col-span-3">
              {selectedCase && editData ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-gradient-to-r from-merit-green/12 via-merit-green/6 to-transparent px-8 py-6 border-b-2 border-gray-100 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide ${selectedCase.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : selectedCase.status === 'in_review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                        {selectedCase.status === 'draft'
                          ? (i18n.language === 'ar' ? 'مسودة' : 'Draft')
                          : selectedCase.status === 'in_review'
                            ? (i18n.language === 'ar' ? 'قيد المراجعة' : 'In Review')
                            : (i18n.language === 'ar' ? 'منشورة' : 'Published')}
                      </span>
                      {batchId && (
                        <span className="text-xs text-merit-green font-bold bg-merit-green/15 px-4 py-2 rounded-full flex items-center gap-1.5 border border-merit-green/30">
                          ✨ {i18n.language === 'ar' ? 'ذكاء اصطناعي' : 'AI Generated'}
                        </span>
                      )}
                      {selectedCase.psychometrics?.enabled && (
                        <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full flex items-center gap-1.5 border border-yellow-200">
                          🧠 {i18n.language === 'ar' ? 'سيكومتري' : 'Psychometrics'}
                        </span>
                      )}
                    </div>

                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-merit-green text-merit-dark hover:bg-merit-green/90 font-bold h-10 px-6 rounded-lg shadow-md"
                      >
                        {i18n.language === 'ar' ? 'تحرير' : 'Edit'}
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSave}
                          className="bg-merit-green text-merit-dark hover:bg-merit-green/90 font-bold h-10 px-6 rounded-lg shadow-md"
                        >
                          <Save className="w-4 h-4 mr-2" /> {i18n.language === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditData({
                              title: selectedCase.title,
                              description: selectedCase.description,
                              instructions: selectedCase.instructions,
                              questions: selectedCase.questions || [],
                              tables: selectedCase.tables || [],
                            });
                            setIsEditing(false);
                            setHasUnsavedChanges(false);
                          }}
                          variant="outline"
                          className="font-bold h-10 px-6 rounded-lg border-2"
                        >
                          {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-b-2 border-gray-100 px-8 overflow-x-auto bg-gray-50/50">
                    <div className="flex gap-10 whitespace-nowrap">
                      {[
                        { id: 'description', label: i18n.language === 'ar' ? 'السيناريو' : 'Scenario' },
                        { id: 'instructions', label: i18n.language === 'ar' ? 'التعليمات' : 'Instructions' },
                        { id: 'questions', label: i18n.language === 'ar' ? 'الأسئلة' : 'Questions' },
                        { id: 'tables', label: i18n.language === 'ar' ? 'الجداول' : 'Tables' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-4 px-2 border-b-3 font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                              ? 'border-merit-green text-merit-dark'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {/* Title */}
                    <div className="mb-8">
                      <label className="block text-base font-bold text-gray-900 mb-3">
                        {i18n.language === 'ar' ? 'عنوان دراسة الحالة' : 'Case Study Title'}
                      </label>
                      <input
                        className="w-full rounded-xl border-2 border-gray-300 px-5 py-3.5 text-base font-medium focus:ring-2 focus:ring-merit-green focus:border-merit-green transition-all placeholder:text-gray-400"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        disabled={!isEditing}
                        placeholder={i18n.language === 'ar' ? 'أدخل العنوان...' : 'Enter title...'}
                      />
                    </div>

                    {/* Description Tab */}
                    {activeTab === 'description' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-base font-bold text-gray-900 mb-2">
                            {i18n.language === 'ar' ? 'وصف السيناريو' : 'Scenario Description'}
                          </label>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                            {i18n.language === 'ar' ? 'السياق والمشاكل والتفاصيل المهمة' : 'Context, problems, and key details'}
                          </p>
                        </div>
                        {isEditing ? (
                          <div className="rounded-xl border-2 border-gray-300 overflow-hidden focus-within:border-merit-green transition-all">
                            <CKEditor
                              editor={ClassicEditor}
                              data={editData.description}
                              onChange={(event, editor) => {
                                const data = editor.getData();
                                setEditData({ ...editData, description: data });
                              }}
                              config={{
                                licenseKey: 'GPL',
                                plugins: [Essentials, Paragraph, Bold, Italic, Link, List, BlockQuote, Heading],
                                toolbar: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-base min-h-[280px] bg-gray-50 prose prose-sm max-w-none leading-relaxed font-medium ${isArabic(editData.description) ? 'rtl text-right' : 'ltr text-left'
                              }`}
                            dir={isArabic(editData.description) ? 'rtl' : 'ltr'}
                            dangerouslySetInnerHTML={{ __html: editData.description }}>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instructions Tab */}
                    {activeTab === 'instructions' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-base font-bold text-gray-900 mb-2">
                            {i18n.language === 'ar' ? 'تعليمات المرشحين' : 'Instructions for Candidates'}
                          </label>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                            {i18n.language === 'ar' ? 'شرح دور المرشح والأهداف المطلوبة' : 'Explain candidate role and objectives'}
                          </p>
                        </div>
                        {selectedCase.psychometrics?.enabled && Array.isArray(selectedCase.psychometrics?.types) && selectedCase.psychometrics.types.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-3">
                            {selectedCase.psychometrics.types.map((t, i) => (
                              <span key={i} className="text-xs font-bold bg-yellow-50 text-yellow-800 border-2 border-yellow-200 rounded-lg px-3 py-2">
                                🧠 {String(t)}
                              </span>
                            ))}
                          </div>
                        )}
                        {isEditing ? (
                          <div className="rounded-xl border-2 border-gray-300 overflow-hidden focus-within:border-merit-green transition-all">
                            <CKEditor
                              editor={ClassicEditor}
                              data={editData.instructions}
                              onChange={(event, editor) => {
                                const data = editor.getData();
                                setEditData({ ...editData, instructions: data });
                              }}
                              config={{
                                licenseKey: 'GPL',
                                plugins: [Essentials, Paragraph, Bold, Italic, Link, List, BlockQuote, Heading],
                                toolbar: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-full rounded-xl border-2 border-gray-200 px-5 py-4 text-base min-h-[280px] bg-gray-50 prose prose-sm max-w-none leading-relaxed font-medium ${isArabic(editData.instructions) ? 'rtl text-right' : 'ltr text-left'
                              }`}
                            dir={isArabic(editData.instructions) ? 'rtl' : 'ltr'}
                            dangerouslySetInnerHTML={{ __html: editData.instructions }}>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Questions Tab */}
                    {activeTab === 'questions' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-base font-bold text-gray-900 mb-2">
                            {i18n.language === 'ar' ? 'الأسئلة' : 'Questions'}
                          </label>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                            {i18n.language === 'ar' ? '6-7 أسئلة، واحد في كل سطر' : '6-7 questions, one per line'}
                          </p>
                        </div>
                        <textarea
                          className={`w-full rounded-xl border-2 border-gray-300 px-5 py-4 text-base min-h-[420px] font-mono focus:ring-2 focus:ring-merit-green focus:border-merit-green transition-all resize-none ${i18n.language === 'ar' ? 'text-right rtl' : 'text-left ltr'
                            }`}
                          dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                          value={editData.questions.join("\n")}
                          onChange={(e) => {
                            const questions = e.target.value.split("\n").filter(q => q.trim());
                            setEditData({ ...editData, questions });
                          }}
                          disabled={!isEditing}
                          placeholder={i18n.language === 'ar'
                            ? "1. السؤال الأول...\n2. السؤال الثاني..."
                            : "1. First question...\n2. Second question..."}
                        />
                        <p className="text-sm text-gray-600 font-bold">
                          {`${editData.questions.length} ${i18n.language === 'ar' ? 'أسئلة' : 'questions'}`}
                        </p>
                      </div>
                    )}

                    {/* Tables Tab */}
                    {activeTab === 'tables' && (
                      <div className="space-y-6">
                        <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                          <label className={`block text-base font-bold text-gray-900 mb-2 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {i18n.language === 'ar' ? 'الجداول' : 'Tables'}
                          </label>
                          <p className={`text-sm text-gray-600 leading-relaxed font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {i18n.language === 'ar'
                              ? 'عدّل البيانات المُنشأة بالذكاء الاصطناعي'
                              : 'Edit AI-generated table data'}
                          </p>
                        </div>

                        {editData.tables && editData.tables.length > 0 ? (
                          <div className="space-y-8">
                            {editData.tables.map((table, tableIdx) => (
                              <div key={tableIdx} className="border-2 border-gray-300 rounded-xl overflow-hidden">
                                {/* Table Header */}
                                <div className="bg-merit-green/15 px-6 py-4 border-b-2 border-gray-200" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                                  <h3 className={`text-base font-bold text-merit-dark ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {i18n.language === 'ar'
                                      ? (table.title_ar || table.title || `جدول ${tableIdx + 1}`)
                                      : (table.title || `Table ${tableIdx + 1}`)}
                                  </h3>
                                </div>

                                {/* Table Wrapper */}
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse text-sm" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                                    <thead>
                                      <tr className="bg-gray-100 border-b-2 border-gray-200">
                                        {table.columns && table.columns.map((col, colIdx) => (
                                          <th
                                            key={colIdx}
                                            className={`px-5 py-3.5 font-bold text-gray-900 border-r border-gray-200 last:border-r-0 min-w-[160px] ${i18n.language === 'ar' ? 'text-right' : 'text-left'
                                              }`}
                                          >
                                            {col.label}
                                          </th>
                                        ))}
                                        {isEditing && (
                                          <th className={`px-5 py-3.5 text-center font-bold text-gray-900 min-w-[70px] bg-gray-50 ${i18n.language === 'ar' ? 'text-right' : 'text-left'
                                            }`}>
                                            {i18n.language === 'ar' ? 'إجراء' : 'Action'}
                                          </th>
                                        )}
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {table.rows && table.rows.length > 0 ? (
                                        table.rows.map((row, rowIdx) => (
                                          <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            {table.columns && table.columns.map((col, colIdx) => (
                                              <td
                                                key={colIdx}
                                                className={`px-5 py-3.5 border-r border-gray-200 last:border-r-0 ${i18n.language === 'ar' ? 'text-right' : 'text-left'
                                                  }`}
                                              >
                                                {isEditing ? (
                                                  <input
                                                    type={col.type === 'number' ? 'number' : 'text'}
                                                    className={`w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-merit-green focus:border-merit-green transition-all ${i18n.language === 'ar' ? 'text-right rtl' : 'text-left ltr'
                                                      }`}
                                                    dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                                                    value={row[col.key] || ''}
                                                    onChange={(e) =>
                                                      handleTableRowChange(tableIdx, rowIdx, col.key, e.target.value)
                                                    }
                                                    placeholder={col.label}
                                                  />
                                                ) : (
                                                  <span className={`text-gray-900 font-medium block ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                    {row[col.key] || '-'}
                                                  </span>
                                                )}
                                              </td>
                                            ))}
                                            {isEditing && (
                                              <td className="px-5 py-3.5 text-center bg-gray-50">
                                                <button
                                                  onClick={() => handleRemoveTableRow(tableIdx, rowIdx)}
                                                  className="text-red-600 hover:text-red-800 font-bold transition-colors"
                                                  title={i18n.language === 'ar' ? 'حذف الصف' : 'Delete row'}
                                                >
                                                  <Trash2 className="w-5 h-5" />
                                                </button>
                                              </td>
                                            )}
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={(table.columns?.length || 1) + (isEditing ? 1 : 0)}
                                            className={`px-5 py-8 text-center text-gray-500 font-medium ${i18n.language === 'ar' ? 'text-right' : 'text-left'
                                              }`}
                                          >
                                            {i18n.language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Add Row Button */}
                                {isEditing && (
                                  <div className={`px-6 py-4 bg-gray-50 border-t-2 border-gray-200 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                                    <button
                                      onClick={() => handleAddTableRow(tableIdx)}
                                      className={`text-sm font-bold text-merit-green hover:text-merit-dark transition-colors flex items-center gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''
                                        }`}
                                    >
                                      <Plus className="w-5 h-5" />
                                      {i18n.language === 'ar' ? 'إضافة صف جديد' : 'Add New Row'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                            <p className="text-gray-600 font-medium text-base">
                              {i18n.language === 'ar' ? 'لم يتم العثور على جداول' : 'No tables found'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Continue Button */}
              {cases.length > 0 && batchId && (
                <div className="mt-8">
                  <Button
                    onClick={handleContinueToPreview}
                    disabled={!selectedCaseId || isEditing}
                    className="w-full bg-merit-green text-merit-dark hover:bg-merit-green/90 gap-3 py-7 text-lg font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {i18n.language === 'ar' ? 'المتابعة إلى المعاينة' : 'Continue to Preview'}
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
              <p className="text-lg text-gray-700 font-semibold">{i18n.language === 'ar' ? 'جاري تحميل دراسات الحالة...' : 'Loading case studies...'}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && cases.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200 shadow-md">
              <p className="text-2xl font-bold text-gray-900 mb-3">{i18n.language === 'ar' ? 'لم يتم العثور على دراسات حالة' : 'No case studies found'}</p>
              <p className="text-lg text-gray-600 mb-8 font-medium">{i18n.language === 'ar' ? 'أنشئ دراسات حالة جديدة للبدء' : 'Generate new case studies to get started'}</p>
              <Button
                onClick={() => navigate("/recruiter-dashboard/generate-case")}
                className="bg-merit-green text-merit-dark hover:bg-merit-green/90 font-bold py-6 px-8 text-lg rounded-xl shadow-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" /> {i18n.language === 'ar' ? 'إنشاء دراسة حالة' : 'Generate Case Study'}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}