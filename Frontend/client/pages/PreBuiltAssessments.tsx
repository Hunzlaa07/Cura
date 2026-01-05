import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  fetchPreBuiltAssessments,
  fetchPreBuiltCategories,
  fetchPreBuiltAssessmentById,
  publishPreBuiltAssessment,
  savePreBuiltAssessment,
  unsavePreBuiltAssessment,
  fetchSavedPreBuiltAssessments,
  fetchJobs,
  PreBuiltAssessment,
  PreBuiltCategory,
  PublishPreBuiltParams,
} from "@/lib/apiService";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Clock,
  Star,
  Users,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Share2,
  Shield,
  Copy,
  Check,
  Filter,
  X,
  Briefcase,
  FileText,
  Code,
  MessageSquare,
  Brain,
  Target,
  BarChart3,
  Eye,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
// Category icons mapping
const categoryIcons: Record<string, any> = {
  administrative: FileText,
  analytical: BarChart3,
  excel: FileText,
  coding: Code,
  customer_service: MessageSquare,
  communication: MessageSquare,
  behavioral: Brain,
  personality: Brain,
  situational_judgment: Target,
  job_simulation: Briefcase,
};

// Difficulty colors - using Merit green theme
const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 border-green-200",
  easy: "bg-green-100 text-green-800 border-green-200",
  intermediate: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  advanced: "bg-orange-100 text-orange-800 border-orange-200",
  hard: "bg-orange-100 text-orange-800 border-orange-200",
  expert: "bg-red-100 text-red-800 border-red-200",
};

export default function PreBuiltAssessments() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  // State
  const [assessments, setAssessments] = useState<PreBuiltAssessment[]>([]);
  const [categories, setCategories] = useState<PreBuiltCategory[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"browse" | "saved">("browse");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Detail modal state
  const [selectedAssessment, setSelectedAssessment] = useState<PreBuiltAssessment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingAssessment, setPublishingAssessment] = useState<PreBuiltAssessment | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [publishParams, setPublishParams] = useState<PublishPreBuiltParams>({
    antiCheating: {
      enableFullscreen: false,
      enableTabSwitch: false,
      enableCopyPaste: false,
      enableWebcamProctoring: false,
      webcam_snapshots_interval: 0,
      maxTabSwitches: 3,
    },
  });
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ 
    share_url: string; 
    share_link: string;
    case_study_id: number;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    loadCategories();
    loadSavedAssessments();
    loadJobs();
  }, []);

  // Fetch assessments when filters change
  useEffect(() => {
    const loadForTab = async () => {
      if (activeTab === "browse") {
        await loadAssessments();
      } else {
        // saved tab
        setLoading(true);
        try {
          const data = await fetchSavedPreBuiltAssessments();
          setAssessments(data || []);
          // reset pagination for saved view
          setPagination((p) => ({ ...p, page: 1, total: data?.length || 0, totalPages: 1 }));
        } catch (err) {
          console.error("Error loading saved assessments:", err);
          toast({ title: t("preBuilt.error", "Error"), description: t("preBuilt.loadError", "Failed to load assessments"), variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    };

    loadForTab();
  }, [selectedCategory, selectedDifficulty, searchQuery, pagination.page, activeTab]);

  const loadCategories = async () => {
    try {
      const data = await fetchPreBuiltCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetchPreBuiltAssessments({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== "all" ? selectedDifficulty : undefined,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setAssessments(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error("Error loading assessments:", error);
      toast({
        title: t("preBuilt.error", "Error"),
        description: t("preBuilt.loadError", "Failed to load assessments"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedAssessments = async () => {
    try {
      const data = await fetchSavedPreBuiltAssessments();
      setSavedIds(new Set(data.map((a: PreBuiltAssessment) => a.id)));
    } catch (error) {
      console.error("Error loading saved assessments:", error);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await fetchJobs();
      console.log('Jobs API response:', data);
      if (Array.isArray(data)) {
        console.log('Jobs with case studies:', data.filter((j: any) => j.has_case_study));
        console.log('Jobs without case studies:', data.filter((j: any) => !j.has_case_study));
        setJobs(data);
      } else {
        console.log('Jobs data is not an array:', data);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  };

  const handleViewDetails = async (assessment: PreBuiltAssessment) => {
    setDetailLoading(true);
    setSelectedAssessment(assessment);
    try {
      const fullData = await fetchPreBuiltAssessmentById(assessment.id);
      setSelectedAssessment(fullData);
    } catch (error) {
      console.error("Error loading assessment details:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (id: number) => {
    try {
      if (savedIds.has(id)) {
        await unsavePreBuiltAssessment(id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast({
          title: t("preBuilt.removed", "Removed"),
          description: t("preBuilt.removedFromSaved", "Removed from saved"),
        });
        // If we're viewing saved tab, refresh the list
        if (activeTab === "saved") {
          try {
            setLoading(true);
            const data = await fetchSavedPreBuiltAssessments();
            setAssessments(data || []);
            setPagination((p) => ({ ...p, page: 1, total: data?.length || 0, totalPages: 1 }));
          } catch (err) {
            console.error("Error refreshing saved assessments:", err);
          } finally {
            setLoading(false);
          }
        }
      } else {
        await savePreBuiltAssessment(id);
        setSavedIds((prev) => new Set(prev).add(id));
        toast({
          title: t("preBuilt.saved", "Saved"),
          description: t("preBuilt.addedToSaved", "Added to saved"),
        });
        // If we're viewing saved tab, refresh the list to include this new saved item
        if (activeTab === "saved") {
          try {
            setLoading(true);
            const data = await fetchSavedPreBuiltAssessments();
            setAssessments(data || []);
            setPagination((p) => ({ ...p, page: 1, total: data?.length || 0, totalPages: 1 }));
          } catch (err) {
            console.error("Error refreshing saved assessments:", err);
          } finally {
            setLoading(false);
          }
        }
      }
    } catch (error) {
      toast({
        title: t("preBuilt.error", "Error"),
        description: t("preBuilt.saveError", "Failed to update saved status"),
        variant: "destructive",
      });
    }
  };

  const handlePublishClick = (assessment: PreBuiltAssessment) => {
    setPublishingAssessment(assessment);
    setPublishParams({
      custom_title: assessment.title,
      custom_duration_minutes: assessment.duration_minutes,
      antiCheating: {
        enableFullscreen: false,
        enableTabSwitch: false,
        enableCopyPaste: false,
        enableWebcamProctoring: false,
        webcam_snapshots_interval: 0,
        maxTabSwitches: 3,
      },
    });
    setPublishResult(null);
    setPublishModalOpen(true);
  };

  const handlePublish = async () => {
    if (!publishingAssessment) return;

    setPublishing(true);
    try {
      const result = await publishPreBuiltAssessment(publishingAssessment.id, publishParams);
      setPublishResult(result.data);
      toast({
        title: t("preBuilt.published", "Published!"),
        description: t("preBuilt.publishSuccess", "Case study is ready to share"),
      });
    } catch (error) {
      toast({
        title: t("preBuilt.error", "Error"),
        description: t("preBuilt.publishError", "Failed to publish case study"),
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (publishResult?.share_url) {
      navigator.clipboard.writeText(publishResult.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t("preBuilt.copied", "Copied!"),
        description: t("preBuilt.linkCopied", "Link copied to clipboard"),
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.category === category);
    return cat ? (isRTL ? cat.label.ar : cat.label.en) : category;
  };

  const renderAssessmentCard = (assessment: PreBuiltAssessment) => {
    const Icon = categoryIcons[assessment.category] || BookOpen;
    const isSaved = savedIds.has(assessment.id);

    return (
      <div
        key={assessment.id}
        className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:border-[#C8F55A]/60 hover:shadow-[#C8F55A]/10 group cursor-pointer"
        onClick={() => handleViewDetails(assessment)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#C8F55A] flex items-center justify-center">
              <Icon className="w-6 h-6 text-merit-dark" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-merit-dark group-hover:text-[#C8F55A] transition-colors line-clamp-1 text-lg">
                {isRTL ? assessment.title_ar || assessment.title : assessment.title}
              </h3>
              <p className="text-sm text-gray-500">{getCategoryLabel(assessment.category)}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave(assessment.id);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5 text-[#C8F55A]" />
            ) : (
              <Bookmark className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
          {isRTL ? assessment.description_ar || assessment.description : assessment.description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Badge variant="outline" className={difficultyColors[assessment.difficulty_level] || difficultyColors.medium}>
            {t(`preBuilt.difficulty.${assessment.difficulty_level}`, assessment.difficulty_level)}
          </Badge>

          {assessment.is_featured ? (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
              <Star className="w-3 h-3 mr-1 fill-amber-500" />
              {t("preBuilt.featured", "Featured")}
            </Badge>
          ) : null}

          {/* Show rating count only if > 0 to avoid displaying a bare 0 */}
          {assessment.rating_count && Number(assessment.rating_count) > 0 ? (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
              <Star className="w-3 h-3 mr-1" />
              {assessment.rating_count}
            </Badge>
          ) : null}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 py-3 border-y border-[#C8F55A]/10">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#C8F55A]" />
            <span>{assessment.duration_minutes} {t("preBuilt.mins", "mins")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#C8F55A]" />
            <span>{assessment.num_questions} {t("preBuilt.questions", "questions")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#C8F55A]" />
            <span>{(assessment.times_used && assessment.times_used > 0) ? assessment.times_used.toLocaleString() : '-'}</span>
          </div>
        </div>

        {/* Skills */}
        {assessment.skills_tested && assessment.skills_tested.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {assessment.skills_tested.slice(0, 3).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700 font-normal">
                {skill}
              </Badge>
            ))}
            {assessment.skills_tested.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 font-normal">
                +{assessment.skills_tested.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex justify-between items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 hover:border-[#C8F55A] hover:bg-[#C8F55A] text-gray-700 hover:text-merit-dark"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(assessment);
            }}
          >
            {t("preBuilt.viewDetails", "View Details")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handlePublishClick(assessment);
            }}
          >
            <Share2 className="w-4 h-4 mr-1" />
            {t("preBuilt.useTest", "Use This")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e1e4e8' }} dir={isRTL ? "rtl" : "ltr"}>
      <TopBar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeItem="pre-built" className="hidden md:block flex-shrink-0" />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-merit-dark mb-2 flex items-center gap-3">
                    <BookOpen className="w-10 h-10 text-[#75A400]" />
                    {t("preBuilt.title", "Pre-Built Case Studies")}
                  </h1>
                  <p className="text-gray-600">
                    {t("preBuilt.subtitle", "Ready-to-use case studies across all categories")}
                  </p>
                </div>
                <div className="h-1 w-48 bg-gradient-to-r from-[#C8F55A]/30 to-[#C8F55A] rounded-full hidden lg:block"></div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "browse" | "saved")} className="mb-6">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="browse" className="flex items-center gap-2 data-[state=active]:bg-[#C8F55A] data-[state=active]:text-merit-dark">
                  <Search className="w-4 h-4" />
                  {t("preBuilt.browse", "Browse All")}
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2 data-[state=active]:bg-[#C8F55A] data-[state=active]:text-merit-dark">
                  <Bookmark className="w-4 h-4" />
                  {t("preBuilt.mySaved", "My Saved")}
                  {savedIds.size > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-gray-200">
                      {savedIds.size}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters */}
            {activeTab === "browse" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <Input
                      placeholder={t("preBuilt.searchPlaceholder", "Search case studies...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`${isRTL ? "pr-11" : "pl-11"} h-11 border-gray-300 focus:border-[#C8F55A] focus:ring-[#C8F55A]/20`}
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[220px] h-11 border-gray-300 focus:border-[#C8F55A]">
                      <Filter className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue placeholder={t("preBuilt.allCategories", "All Categories")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("preBuilt.allCategories", "All Categories")}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {isRTL ? cat.label.ar : cat.label.en} ({cat.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Difficulty Filter */}
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11 border-gray-300 focus:border-[#C8F55A]">
                      <SelectValue placeholder={t("preBuilt.allLevels", "All Levels")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("preBuilt.allLevels", "All Levels")}</SelectItem>
                      <SelectItem value="easy">{t("preBuilt.difficulty.easy", "Easy")}</SelectItem>
                      <SelectItem value="medium">{t("preBuilt.difficulty.medium", "Medium")}</SelectItem>
                      <SelectItem value="hard">{t("preBuilt.difficulty.hard", "Hard")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters */}
                {(selectedCategory !== "all" || selectedDifficulty !== "all" || searchQuery) && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#C8F55A]/10">
                    <span className="text-sm text-gray-500">{t("preBuilt.activeFilters", "Active filters")}:</span>
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-[#C8F55A] text-merit-dark">
                        {getCategoryLabel(selectedCategory)}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-[#1a9c5e]"
                          onClick={() => setSelectedCategory("all")}
                        />
                      </Badge>
                    )}
                    {selectedDifficulty !== "all" && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-[#C8F55A]/10 text-[#C8F55A]">
                        {t(`preBuilt.difficulty.${selectedDifficulty}`, selectedDifficulty)}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-[#1a9c5e]"
                          onClick={() => setSelectedDifficulty("all")}
                        />
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-[#C8F55A]/10 text-[#C8F55A]">
                        "{searchQuery}"
                        <X className="w-3 h-3 cursor-pointer hover:text-[#1a9c5e]" onClick={() => setSearchQuery("")} />
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assessments Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded mb-4" />
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-6 bg-gray-200 rounded w-16" />
                    </div>
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-merit-dark mb-2">
                  {t("preBuilt.noResults", "No case studies found")}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {t("preBuilt.tryDifferent", "Try adjusting your filters or search query")}
                </p>
                <Button
                  variant="outline"
                  className="border-[#C8F55A] text-merit-dark hover:bg-[#C8F55A]"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedDifficulty("all");
                    setSearchQuery("");
                  }}
                >
                  {t("preBuilt.clearFilters", "Clear Filters")}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assessments.map(renderAssessmentCard)}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      className="border-gray-200"
                    >
                      {t("common.previous", "Previous")}
                    </Button>
                    <span className="text-sm text-gray-500 px-4">
                      {t("common.pageOf", "Page {{current}} of {{total}}", {
                        current: pagination.page,
                        total: pagination.totalPages,
                      })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      className="border-gray-200"
                    >
                      {t("common.next", "Next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAssessment && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold">
                      {isRTL
                        ? selectedAssessment.title_ar || selectedAssessment.title
                        : selectedAssessment.title}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {getCategoryLabel(selectedAssessment.category)} •{" "}
                      {t(
                        `preBuilt.difficulty.${selectedAssessment.difficulty_level}`,
                        selectedAssessment.difficulty_level
                      )}
                    </DialogDescription>
                  </div>
                  <button
                    onClick={() => handleSave(selectedAssessment.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {savedIds.has(selectedAssessment.id) ? (
                      <BookmarkCheck className="w-5 h-5 text-[#C8F55A]" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <h4 className="font-semibold text-merit-dark mb-2">
                    {t("preBuilt.description", "Description")}
                  </h4>
                  <p className="text-gray-600">
                    {isRTL
                      ? selectedAssessment.description_ar || selectedAssessment.description
                      : selectedAssessment.description}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#C8F55A]/5 rounded-xl p-4 text-center border border-[#C8F55A]/10">
                    <Clock className="w-6 h-6 text-[#C8F55A] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-merit-dark">
                      {selectedAssessment.duration_minutes}
                    </div>
                    <div className="text-xs text-gray-500">{t("preBuilt.minutes", "Minutes")}</div>
                  </div>
                  <div className="bg-[#C8F55A]/5 rounded-xl p-4 text-center border border-[#C8F55A]/10">
                    <FileText className="w-6 h-6 text-[#C8F55A] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-merit-dark">
                      {selectedAssessment.num_questions}
                    </div>
                    <div className="text-xs text-gray-500">{t("preBuilt.questions", "Questions")}</div>
                  </div>
                  <div className="bg-[#C8F55A]/5 rounded-xl p-4 text-center border border-[#C8F55A]/10">
                    <Users className="w-6 h-6 text-[#C8F55A] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-merit-dark">
                      {selectedAssessment.times_used && selectedAssessment.times_used > 0 ? selectedAssessment.times_used.toLocaleString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500">{t("preBuilt.timesUsed", "Times Used")}</div>
                  </div>
                </div>

                {/* Skills */}
                {selectedAssessment.skills_tested && selectedAssessment.skills_tested.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-merit-dark mb-2">
                      {t("preBuilt.skillsTested", "Skills Tested")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAssessment.skills_tested.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-gray-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Role Types */}
                {selectedAssessment.role_types && selectedAssessment.role_types.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-merit-dark mb-2">
                      {t("preBuilt.suitableFor", "Suitable For")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAssessment.role_types.map((role, idx) => (
                        <Badge key={idx} variant="outline" className="bg-[#C8F55A] border-[#C8F55A]/30 text-merit-dark">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Questions Preview */}
                {selectedAssessment.questions && selectedAssessment.questions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-merit-dark mb-2">
                      {t("preBuilt.sampleQuestions", "Sample Questions")}
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                      {selectedAssessment.questions.slice(0, 2).map((q: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-700">
                          <span className="font-medium text-[#C8F55A]">{idx + 1}.</span> {q.question || q.text}
                        </div>
                      ))}
                      {selectedAssessment.questions.length > 2 && (
                        <p className="text-xs text-gray-500 italic pt-2 border-t border-gray-200">
                          +{selectedAssessment.questions.length - 2} {t("preBuilt.moreQuestions", "more questions")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6 gap-3">
                <Button variant="outline" onClick={() => setSelectedAssessment(null)} className="border-[#C8F55A]/20 hover:border-[#C8F55A]">
                  {t("common.close", "Close")}
                </Button>
                <Button
                  className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-medium"
                  onClick={() => {
                    setSelectedAssessment(null);
                    handlePublishClick(selectedAssessment);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t("preBuilt.useTest", "Use This Case Study")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish/Customize Modal */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {publishResult
                ? t("preBuilt.assessmentReady", "Case Study Ready!")
                : t("preBuilt.customizePublish", "Customize & Publish")}
            </DialogTitle>
            <DialogDescription>
              {publishResult
                ? t("preBuilt.shareWithCandidates", "Share this link with candidates")
                : t("preBuilt.customizeSettings", "Customize settings before publishing")}
            </DialogDescription>
          </DialogHeader>

          {publishResult ? (
            <div className="space-y-4 mt-4">
              <div className="bg-[#C8F55A]/10 border border-[#C8F55A]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-merit-dark mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">{t("preBuilt.published", "Published!")}</span>
                </div>
                <p className="text-sm text-[#1a9c5e]">
                  {t("preBuilt.assessmentPublished", "Your case study is now live and ready to share")}
                </p>
              </div>

              <DialogFooter className="flex-col gap-3 sm:flex-col mt-2">
                <Button 
                  onClick={() => setPublishModalOpen(false)} 
                  className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-medium w-full"
                >
                  {t("common.done", "Done")}
                </Button>
              </DialogFooter>
            </div>
          ) : ( 
            <div className="space-y-6 mt-4">
              {/* Custom Title */}
              <div>
                <Label className="text-gray-700">{t("preBuilt.customTitle", "Custom Title")} <span className="text-gray-400 text-sm">({t("common.optional", "optional")})</span></Label>
                <Input
                  value={publishParams.custom_title || ""}
                  onChange={(e) =>
                    setPublishParams((p) => ({ ...p, custom_title: e.target.value }))
                  }
                  placeholder={publishingAssessment?.title}
                  className="mt-2 border-gray-300 focus:border-[#C8F55A] focus:ring-[#C8F55A]/20"
                />
              </div>

              {/* Duration */}
              <div>
                <Label className="text-gray-700">{t("preBuilt.duration", "Duration")} ({t("preBuilt.minutes", "minutes")})</Label>
                <Input
                  type="number"
                  value={publishParams.custom_duration_minutes || ""}
                  onChange={(e) =>
                    setPublishParams((p) => ({
                      ...p,
                      custom_duration_minutes: parseInt(e.target.value) || undefined,
                    }))
                  }
                  placeholder={publishingAssessment?.duration_minutes?.toString()}
                  className="mt-2 border-gray-300 focus:border-[#C8F55A] focus:ring-[#C8F55A]/20"
                />
              </div>

              {/* Instructions */}
              <div>
                <Label className="text-gray-700">{t("preBuilt.customInstructions", "Custom Instructions")} <span className="text-gray-400 text-sm">({t("common.optional", "optional")})</span></Label>
                <Textarea
                  value={publishParams.custom_instructions || ""}
                  onChange={(e) =>
                    setPublishParams((p) => ({ ...p, custom_instructions: e.target.value }))
                  }
                  placeholder={t("preBuilt.instructionsPlaceholder", "Add any special instructions for candidates...")}
                  className="mt-2 border-gray-300 focus:border-[#C8F55A] focus:ring-[#C8F55A]/20"
                  rows={3}
                />
              </div>

              {/* Link to Job */}
              {jobs.length > 0 && (
                <div>
                  <Label className="text-gray-700">{t("preBuilt.linkToJob", "Link to Job")} <span className="text-gray-400 text-sm">({t("common.optional", "optional")})</span></Label>
                  <Select
                    value={publishParams.job_id?.toString() || "none"}
                    onValueChange={(v) =>
                      setPublishParams((p) => ({
                        ...p,
                        job_id: v === "none" ? undefined : parseInt(v),
                      }))
                    }
                  >
                    <SelectTrigger className="mt-2 border-gray-300 focus:border-[#C8F55A]">
                      <SelectValue placeholder={t("preBuilt.selectJob", "Select a job")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("preBuilt.noJob", "No job linked")}</SelectItem>
                      {jobs
                        .filter((job: any) => !job.has_case_study)
                        .map((job: any) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Anti-Cheating Settings */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#C8F55A]" />
                  <h4 className="font-semibold text-merit-dark">{t("preBuilt.antiCheating", "Anti-Cheating Settings")}</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">{t("preBuilt.fullscreenMode", "Fullscreen Mode")}</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Require fullscreen during assessment</p>
                    </div>
                    <Switch
                      checked={publishParams.antiCheating?.enableFullscreen}
                      onCheckedChange={(v) =>
                        setPublishParams((p) => ({
                          ...p,
                          antiCheating: { ...p.antiCheating, enableFullscreen: v },
                        }))
                      }
                      className="data-[state=checked]:bg-[#C8F55A]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">{t("preBuilt.tabSwitchDetection", "Tab Switch Detection")}</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Detect when candidate switches tabs</p>
                    </div>
                    <Switch
                      checked={publishParams.antiCheating?.enableTabSwitch}
                      onCheckedChange={(v) =>
                        setPublishParams((p) => ({
                          ...p,
                          antiCheating: { ...p.antiCheating, enableTabSwitch: v },
                        }))
                      }
                      className="data-[state=checked]:bg-[#C8F55A]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">{t("preBuilt.blockCopyPaste", "Block Copy/Paste")}</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Prevent copying and pasting</p>
                    </div>
                    <Switch
                      checked={publishParams.antiCheating?.enableCopyPaste}
                      onCheckedChange={(v) =>
                        setPublishParams((p) => ({
                          ...p,
                          antiCheating: { ...p.antiCheating, enableCopyPaste: v },
                        }))
                      }
                      className="data-[state=checked]:bg-[#C8F55A]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-700">{t("preBuilt.webcamProctoring", "Webcam Proctoring")}</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Monitor candidate via webcam</p>
                    </div>
                    <Switch
                      checked={publishParams.antiCheating?.enableWebcamProctoring}
                      onCheckedChange={(v) =>
                        setPublishParams((p) => ({
                          ...p,
                          antiCheating: { ...p.antiCheating, enableWebcamProctoring: v, webcam_snapshots_interval: v && !p.antiCheating?.webcam_snapshots_interval ? 30 : p.antiCheating?.webcam_snapshots_interval }
                        }))
                      }
                      className="data-[state=checked]:bg-[#C8F55A]"
                    />
                  </div>

                  {publishParams.antiCheating?.enableWebcamProctoring && (
                    <div className="pt-2 border-t border-gray-200">
                      <Label className="text-gray-700">{t("preBuilt.snapshotInterval", "Snapshot Interval (seconds)")}</Label>
                      <input
                        type="number"
                        min={5}
                        value={publishParams.antiCheating?.webcam_snapshots_interval || 30}
                        onChange={(e) => setPublishParams((p) => ({ ...p, antiCheating: { ...p.antiCheating, webcam_snapshots_interval: parseInt(e.target.value) || 30 } }))}
                        className="w-24 mt-2 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                  {publishParams.antiCheating?.enableTabSwitch && (
                    <div className="pt-2 border-t border-gray-200">
                      <Label className="text-gray-700">{t("preBuilt.maxTabSwitches", "Max Tab Switches Allowed")}</Label>
                      <Input
                        type="number"
                        value={publishParams.antiCheating?.maxTabSwitches || 3}
                        onChange={(e) =>
                          setPublishParams((p) => ({
                            ...p,
                            antiCheating: {
                              ...p.antiCheating,
                              maxTabSwitches: parseInt(e.target.value) || 3,
                            },
                          }))
                        }
                        className="mt-2 w-24 border-gray-300 focus:border-[#C8F55A] focus:ring-[#C8F55A]/20"
                        min={1}
                        max={10}
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => setPublishModalOpen(false)} className="border-gray-300 hover:border-[#C8F55A]">
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-medium"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t("preBuilt.publishing", "Publishing...")}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      {t("preBuilt.publishAssessment", "Publish Case Study")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


