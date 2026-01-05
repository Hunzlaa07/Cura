import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CandidateCard from "./CandidateCard";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Candidate {
  id: number;
  name: string;
  role: string;
  score: number;
  skills: string[];
  caseStudy: string;
  submittedTime: string;
  avatar: string;
  status?: string;
}

interface AllCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  shortlisted?: { applicant_id?: number; id?: number }[];
  onShortlist: (id: number) => void;
  onView: (id: number) => void;
}

export default function AllCandidatesModal({
  isOpen,
  onClose,
  candidates,
  shortlisted = [],
  onShortlist,
  onView,
}: AllCandidatesModalProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Deduplicate candidates by id + caseStudy combination (same applicant can apply to multiple jobs)
  const uniqueCandidates = useMemo(() => {
    const seen = new Set<string>();
    return candidates.filter((c) => {
      const uniqueKey = `${c.id}-${c.caseStudy}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });
  }, [candidates]);

  // Filter candidates by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return uniqueCandidates;
    const query = searchQuery.toLowerCase();
    return uniqueCandidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.role.toLowerCase().includes(query) ||
        c.skills.some((s) => s.toLowerCase().includes(query))
    );
  }, [uniqueCandidates, searchQuery]);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t("dashboardPage.candidatesManagement") || "All Candidates"} ({filtered.length})
          </DialogTitle>
        </DialogHeader>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-b">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={i18n.language === "ar" ? "البحث عن مرشح..." : "Search candidates..."}
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
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
            </select>
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="flex-1 overflow-y-auto py-4">
          {pageItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{i18n.language === "ar" ? "لم يتم العثور على مرشحين" : "No candidates found"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageItems.map((c, idx) => (
                <CandidateCard
                  key={`candidate-${c.id}-${c.caseStudy}-${idx}`}
                  id={c.id}
                  name={c.name}
                  role={c.role}
                  score={c.score}
                  skills={c.skills}
                  caseStudy={c.caseStudy}
                  submittedTime={c.submittedTime}
                  avatar={c.avatar}
                  isShortlisted={shortlisted.some(
                    (s) => s.applicant_id === c.id || s.id === c.id
                  )}
                  isRejected={c.status === "rejected"}
                  onShortlist={() => onShortlist(c.id)}
                  onView={() => onView(c.id)}
                  onMessage={() => {}}
                  compact
                />
              ))}
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
