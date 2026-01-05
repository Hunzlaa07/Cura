import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Eye, Award, AlertTriangle, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Submission {
  id: number;
  applicant_id: number;
  job_id: number;
  case_study_id: number;
  case_study_title: string;
  submitted_time: string;
  score: number;
  rating: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_title?: string;
  job_title: string;
  ai_detected?: boolean;
  ai_confidence?: string;
  result_generated?: number;
}

interface AllAssessmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSubmission?: (submission: Submission) => void;
  onGenerateResult?: (submissionId: number) => Promise<void>;
}

export default function AllAssessmentsModal({
  isOpen,
  onClose,
  onViewSubmission,
  onGenerateResult,
}: AllAssessmentsModalProps) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/assessments/recruiter/submissions`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language || 'en',
        },
      });

      if (!res.ok) throw new Error("Failed to fetch submissions");
      
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: i18n.language === "ar" ? "خطأ" : "Error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Deduplicate submissions by id
  const uniqueSubmissions = useMemo(() => {
    const seen = new Set<number>();
    return submissions.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [submissions]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return uniqueSubmissions;
    const query = searchQuery.toLowerCase();
    return uniqueSubmissions.filter((s) =>
      s.applicant_name.toLowerCase().includes(query) ||
      s.case_study_title.toLowerCase().includes(query) ||
      s.job_title.toLowerCase().includes(query)
    );
  }, [uniqueSubmissions, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  // Get current page items
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  // Reset to page 1 when search changes
  useMemo(() => {
    setPage(1);
  }, [searchQuery]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleGenerateResult = async (submissionId: number) => {
    if (onGenerateResult) {
      setGenerating(submissionId);
      try {
        await onGenerateResult(submissionId);
        await fetchSubmissions(); // Refresh after generating
      } finally {
        setGenerating(null);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {i18n.language === "ar" ? "تقييمات المتقدمين" : "Assessment Submissions"} ({filtered.length})
          </DialogTitle>
        </DialogHeader>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-b">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={i18n.language === "ar" ? "البحث..." : "Search assessments..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {i18n.language === "ar" ? "لكل صفحة:" : "Per page:"}
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Assessments List */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : pageItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{i18n.language === "ar" ? "لم يتم العثور على تقييمات" : "No assessments found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "المتقدم" : "Applicant"}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "دراسة الحالة" : "Case Study"}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "الوظيفة" : "Job"}
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "النتيجة" : "Score"}
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "AI" : "AI"}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "التاريخ" : "Date"}
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      {i18n.language === "ar" ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageItems.map((submission, idx) => (
                    <tr key={`assessment-${submission.id}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-merit-dark">{submission.applicant_name}</p>
                          <p className="text-xs text-gray-500">{submission.applicant_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                        {submission.case_study_title}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">
                        {submission.job_title}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submission.result_generated ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(submission.score)}`}>
                            {submission.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submission.ai_detected && (
                          <span className="inline-flex items-center gap-1 text-amber-600" title="AI Detected">
                            <Brain className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(submission.submitted_time).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {submission.result_generated ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewSubmission?.(submission)}
                              className="h-8"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {i18n.language === "ar" ? "عرض" : "View"}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateResult(submission.id)}
                              disabled={generating === submission.id}
                              className="h-8"
                            >
                              {generating === submission.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <Award className="w-4 h-4 mr-1" />
                              )}
                              {i18n.language === "ar" ? "إنشاء" : "Generate"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              {i18n.language === "ar"
                ? `عرض ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filtered.length)} من ${filtered.length}`
                : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                {i18n.language === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="text-sm px-3">
                {i18n.language === "ar"
                  ? `${page} من ${totalPages}`
                  : `${page} of ${totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {i18n.language === "ar" ? "التالي" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
