import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, DownloadCloud, X, ChevronDown, Sparkles, History, ChevronLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import Sidebar from "@/components/dashboard/Sidebar";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function TopBar() {
  const { i18n } = useTranslation();

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
        <span className="text-xl md:text-2xl font-bold text-merit-dark">Cura</span>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitcher />
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

const BulkCVMatcher = ({ activeItem = "bulk-match" }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState('upload'); // upload, processing, results
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState('');
  const [bulkJobId, setBulkJobId] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const translations = {
    en: {
      bulkCVMatcher: "Bulk CV Matcher",
      uploadCVs: "Upload CVs",
      dragDrop: "Drag & drop CVs here",
      orClick: "or click to browse",
      fileTypes: "PDF, DOCX, TXT (up to 100 files)",
      jobDescription: "Job Description",
      pasteJD: "Paste the full job description here (min 50 characters)...",
      characters: "characters",
      filesSelected: "file(s) selected",
      remove: "Remove",
      startMatching: "Start Matching",
      processingCVs: "Processing CVs",
      analyzingCVs: "Analyzing CVs against the job description...",
      complete: "% Complete",
      matchingResults: "Matching Results",
      CVsAnalyzed: "CVs analyzed",
      exportCSV: "Export CSV",
      startOver: "Start Over",
      rank: "Rank",
      cvName: "CV Name",
      matchScore: "Match Score",
      matchLevel: "Level",
      recommendation: "Recommendation",
      summary: "Summary",
      skillsMatch: "Skills Match",
      experienceMatch: "Experience Match",
      educationMatch: "Education Match",
      strengths: "Strengths",
      gaps: "Gaps",
      noFilesError: "Please upload at least one CV",
      jdError: "Job description must be at least 50 characters",
      uploadFailed: "Upload failed",
      exportFailed: "Export failed",
      processingError: "Error processing CVs",
      matchCVs: "Match CVs Against Job Description",
      useAI: "Use AI-powered matching to analyze and rank CVs instantly",
      cancel: "Cancel"
    },
    ar: {
      bulkCVMatcher: "مطابق السيرة الذاتية بالجملة",
      uploadCVs: "تحميل السير الذاتية",
      dragDrop: "اسحب وأفلت السير الذاتية هنا",
      orClick: "أو انقر للاستعراض",
      fileTypes: "PDF و DOCX و TXT (حتى 100 ملف)",
      jobDescription: "وصف الوظيفة",
      pasteJD: "الصق وصف الوظيفة الكامل هنا (50 حرف على الأقل)...",
      characters: "أحرف",
      filesSelected: "ملف(ات) محددة",
      remove: "إزالة",
      startMatching: "ابدأ المطابقة",
      processingCVs: "معالجة السير الذاتية",
      analyzingCVs: "تحليل السير الذاتية مقابل وصف الوظيفة...",
      complete: "% مكتمل",
      matchingResults: "نتائج المطابقة",
      CVsAnalyzed: "تم تحليل السير الذاتية",
      exportCSV: "تصدير CSV",
      startOver: "ابدأ من جديد",
      rank: "الترتيب",
      cvName: "اسم السيرة الذاتية",
      matchScore: "درجة المطابقة",
      matchLevel: "المستوى",
      recommendation: "التوصية",
      summary: "الملخص",
      skillsMatch: "مطابقة المهارات",
      experienceMatch: "مطابقة الخبرة",
      educationMatch: "مطابقة التعليم",
      strengths: "نقاط القوة",
      gaps: "الفجوات",
      noFilesError: "يرجى تحميل سيرة ذاتية واحدة على الأقل",
      jdError: "يجب أن يتضمن وصف الوظيفة 50 حرف على الأقل",
      uploadFailed: "فشل التحميل",
      exportFailed: "فشل التصدير",
      processingError: "خطأ في معالجة السير الذاتية",
      matchCVs: "مطابقة السير الذاتية مقابل وصف الوظيفة",
      useAI: "استخدم المطابقة المدعومة بالذكاء الاصطناعي لتحليل وترتيب السير الذاتية فوراً",
      cancel: "إلغاء"
    }
  };

  const getText = (key) => {
    return translations[i18n.language]?.[key] || translations.en[key];
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file =>
      ['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'].includes(file.type)
    );

    if (validFiles.length !== selectedFiles.length) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "تحذير" : "Warning",
        description: i18n.language === 'ar' ? "تم تخطي بعض الملفات. فقط PDF و DOCX و TXT مدعومة" : "Some files were skipped. Only PDF, DOCX, and TXT are supported."
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
    toast({
      title: i18n.language === 'ar' ? "تم التحميل ✓" : "Uploaded ✓",
      description: `${validFiles.length} ${i18n.language === 'ar' ? 'ملفات تم تحميلها' : 'files uploaded'}`,
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#75A400';
    e.currentTarget.style.backgroundColor = '#f0fdf4';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.borderColor = '#e5e7eb';
    e.currentTarget.style.backgroundColor = '#f9fafb';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#e5e7eb';
    e.currentTarget.style.backgroundColor = '#f9fafb';
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    handleFileSelect({ target: { files: droppedFiles } });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartMatching = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getText('noFilesError'),
      });
      return;
    }

    if (jd.trim().length < 50) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getText('jdError'),
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('jd', jd);
      files.forEach(file => formData.append('files', file));

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bulk-cv/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error(getText('uploadFailed'));

      const data = await response.json();
      setBulkJobId(data.bulk_job_id);
      setStep('processing');

      pollResults(data.bulk_job_id);

    } catch (err) {
      toast({
        variant: "destructive",
        title: getText('uploadFailed'),
        description: err.message,
      });
      setLoading(false);
    }
  };

  const pollResults = (jobId) => {
    const poll = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bulk-cv/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error(getText('processingError'));

        const data = await response.json();

        setProgress(data.total_files > 0
          ? Math.round((data.processed_files / data.total_files) * 100)
          : 0);

        if (data.status === 'completed') {
          setResults(data.results);
          setStep('results');
          clearInterval(pollingIntervalRef.current);
          setLoading(false);
          toast({
            title: i18n.language === 'ar' ? "تم بنجاح ✓" : "Complete ✓",
            description: i18n.language === 'ar' ? "تم تحليل جميع السير الذاتية" : "All CVs analyzed successfully",
          });
        } else if (data.status === 'error') {
          toast({
            variant: "destructive",
            title: getText('processingError'),
            description: data.error_message || 'Unknown error',
          });
          setStep('upload');
          clearInterval(pollingIntervalRef.current);
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bulk-cv/export/${bulkJobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error(getText('exportFailed'));

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-cv-results-${bulkJobId}.csv`;
      a.click();

      toast({
        title: i18n.language === 'ar' ? "تم التصدير ✓" : "Exported ✓",
        description: i18n.language === 'ar' ? "تم تحميل الملف بنجاح" : "File downloaded successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: getText('exportFailed'),
        description: err.message,
      });
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFiles([]);
    setJd('');
    setBulkJobId(null);
    setResults([]);
    setProgress(0);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation?.includes('Strong') || recommendation?.includes('تعيين قوي')) return 'bg-green-100 text-green-800';
    if (recommendation?.includes('Interview') || recommendation?.includes('مقابلة')) return 'bg-blue-100 text-blue-800';
    if (recommendation?.includes('Review') || recommendation?.includes('راجع')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (step === 'upload') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem="bulk-match" />

          <div className="flex-1 p-4 md:p-10 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-10">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-gray-600 hover:text-merit-dark mb-4 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{getText('cancel')}</span>
                </button>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-merit-dark flex items-center gap-3 mb-2">
                      <Sparkles className="w-8 h-8 text-[#C8F55A]" />
                      {getText('bulkCVMatcher')}
                    </h1>
                    <p className="text-gray-600">{getText('useAI')}</p>
                  </div>
                  <div className="h-1 w-40 bg-gradient-to-r from-[#C8F55A] to-[#75A400] rounded-full hidden md:block"></div>
                </div>
              </div>

              {/* Main Form Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">

                {/* Section 1: CV Upload */}
                <div className="pb-8 border-b border-gray-200 mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">1</span>
                    {getText('uploadCVs')}
                  </h2>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-[#C8F55A] hover:bg-lime-50 transition-all duration-200 bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto mb-4 text-gray-400" size={40} />
                    <p className="font-semibold text-gray-700 mb-2">{getText('dragDrop')}</p>
                    <p className="text-sm text-gray-500 mb-3">{getText('orClick')}</p>
                    <p className="text-xs text-gray-400">{getText('fileTypes')}</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="mt-6 bg-lime-50 rounded-2xl p-4 border border-lime-200">
                      <p className="text-sm font-semibold text-gray-700 mb-4">
                        {files.length} {getText('filesSelected')}
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-white p-3 rounded-lg border border-lime-200 hover:shadow-md transition">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText size={16} className="text-[#75A400] flex-shrink-0" />
                              <span className="truncate text-gray-700 font-medium">{file.name}</span>
                            </div>
                            <button
                              onClick={() => removeFile(idx)}
                              className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 transition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: JD Input */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#C8F55A] rounded-full flex items-center justify-center text-merit-dark font-bold text-sm">2</span>
                    {getText('jobDescription')}
                  </h2>

                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder={getText('pasteJD')}
                    className="w-full h-80 p-4 border-2 border-gray-300 rounded-2xl font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent transition-all text-gray-900"
                  />

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">
                      {jd.length} {getText('characters')}
                    </p>
                    {jd.trim().length < 50 && jd.length > 0 && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {i18n.language === 'ar' ? 'أضف المزيد من الأحرف' : 'Add more characters'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-4 pt-10 mt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-all duration-200"
                  >
                    {getText('cancel')}
                  </button>
                  <button
                    onClick={handleStartMatching}
                    disabled={files.length === 0 || jd.trim().length < 50 || loading}
                    className={`flex-1 px-6 py-3 font-semibold rounded-lg flex justify-center items-center gap-2 transition-all duration-200 ${files.length === 0 || jd.trim().length < 50 || loading
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark shadow-lg hover:shadow-xl'
                      }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        {getText('processingCVs')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {getText('startMatching')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-8 bg-gradient-to-r from-lime-50 to-amber-50 rounded-xl p-6 border border-lime-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  {i18n.language === 'ar' ? 'نصائح للحصول على أفضل النتائج' : 'Tips for Best Results'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-[#75A400]">✓</span>
                    <span>{i18n.language === 'ar' ? 'حمل 5-100 سيرة ذاتية للحصول على أفضل النتائج' : 'Upload 5-100 CVs for optimal results'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#75A400]">✓</span>
                    <span>{i18n.language === 'ar' ? 'استخدم وصف وظيفة واضح ومفصل' : 'Use a clear and detailed job description'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#75A400]">✓</span>
                    <span>{i18n.language === 'ar' ? 'ستتم معالجة الملفات في دفعات لضمان الجودة' : 'Files are processed in batches for quality assurance'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem="bulk-match" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-8">
                <Loader2 className="mx-auto w-16 h-16 text-[#C8F55A] animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-merit-dark mb-3">{getText('processingCVs')}</h2>
              <p className="text-gray-600 mb-8">{getText('analyzingCVs')}</p>

              <div className="w-96 bg-gray-200 rounded-full h-4 overflow-hidden mb-4">
                <div
                  className="bg-gradient-to-r from-[#C8F55A] to-[#75A400] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-lg font-semibold text-merit-dark">{progress}{getText('complete')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }}>
        <TopBar />
        <div className="flex flex-1">
          <Sidebar activeItem="bulk-match" />

          <div className="flex-1 p-4 md:p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-10">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-gray-600 hover:text-merit-dark mb-4 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{getText('cancel')}</span>
                </button>

                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-merit-dark mb-2">{getText('matchingResults')}</h1>
                    <p className="text-gray-600">{results.length} {getText('CVsAnalyzed')}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C8F55A] to-[#75A400] text-merit-dark rounded-xl hover:shadow-lg transition font-semibold shadow-md"
                    >
                      <DownloadCloud size={18} />
                      {getText('exportCSV')}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition font-semibold shadow-md hover:shadow-lg"
                    >
                      {getText('startOver')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead className="bg-merit-dark text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">{getText('rank')}</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">{getText('cvName')}</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">{getText('matchScore')}</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">{getText('matchLevel')}</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">{getText('recommendation')}</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">•••</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="border-t border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-bold text-merit-dark">#{idx + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium truncate max-w-xs">{result.file_name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold inline-block ${getScoreColor(result.match_score || 0)}`}>
                              {result.match_score || 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{result.match_level || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getRecommendationColor(result.recommendation)}`}>
                              {result.recommendation}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                              className="text-gray-700 hover:text-merit-dark transition"
                            >
                              <ChevronDown size={20} className={cn("transition-transform", expandedRow === idx && "rotate-180")} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {expandedRow === idx && (
                          <tr className="border-t border-gray-100 bg-gray-50">
                            <td colSpan="6" className="px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div>
                                  <h4 className="text-sm font-bold text-merit-dark mb-3">{getText('skillsMatch')}</h4>
                                  <div className="space-y-2">
                                    {(result.skills_match || []).slice(0, 5).map((skill, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${skill.found_in_cv ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-xs text-gray-700">{skill.skill_name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-merit-dark mb-3">{getText('experienceMatch')}</h4>
                                  <p className="text-3xl font-bold text-[#75A400]">{result.experience_match}%</p>
                                  <p className="text-xs text-gray-600 mt-2">{result.experience_evidence || 'N/A'}</p>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-merit-dark mb-3">{getText('educationMatch')}</h4>
                                  <p className="text-3xl font-bold text-[#75A400]">{result.education_match}%</p>
                                  <p className="text-xs text-gray-600 mt-2">{result.education_evidence || 'N/A'}</p>
                                </div>

                                <div className="lg:col-span-2">
                                  <h4 className="text-sm font-bold text-merit-dark mb-3">{getText('strengths')}</h4>
                                  <ul className="space-y-2">
                                    {(result.strengths || []).map((strength, i) => (
                                      <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                        <span className="text-green-600 font-bold mt-0.5 flex-shrink-0">+</span>
                                        <span>{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-merit-dark mb-3">{getText('gaps')}</h4>
                                  <ul className="space-y-2">
                                    {(result.gaps || []).map((gap, i) => (
                                      <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                        <span className="text-red-600 font-bold mt-0.5 flex-shrink-0">-</span>
                                        <span>{gap}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-2">{i18n.language === 'ar' ? 'أفضل تطابق' : 'Best Match'}</p>
                  <p className="text-2xl font-bold text-[#75A400]">{results[0]?.match_score || 0}%</p>
                  <p className="text-xs text-gray-600 mt-2">{results[0]?.file_name}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-2">{i18n.language === 'ar' ? 'متوسط التطابق' : 'Average Match'}</p>
                  <p className="text-2xl font-bold text-[#75A400]">
                    {Math.round(results.reduce((sum, r) => sum + (r.match_score || 0), 0) / results.length)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-2">{results.length} {getText('CVsAnalyzed')}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <p className="text-gray-600 text-sm font-semibold mb-2">{i18n.language === 'ar' ? 'المرشحون المقترحون' : 'Recommended'}</p>
                  <p className="text-2xl font-bold text-[#75A400]">
                    {results.filter(r => (r.match_score || 0) >= 60).length}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">{i18n.language === 'ar' ? 'بدرجة 60% أو أعلى' : 'with 60%+ score'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default BulkCVMatcher;