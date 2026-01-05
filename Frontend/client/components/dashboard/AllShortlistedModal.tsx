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
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";

interface ShortlistedCandidate {
  id: number;
  applicant_id?: number;
  name?: string;
  full_name?: string;
  applicant_name?: string;
  title?: string;
  score?: number;
  profile_picture?: string;
  avatar?: string;
  [key: string]: any;
}

interface AllShortlistedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortlisted: ShortlistedCandidate[];
  onRemove: (id: number) => void;
}

export default function AllShortlistedModal({
  isOpen,
  onClose,
  shortlisted,
  onRemove,
}: AllShortlistedModalProps) {
  const { i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deduplicate by id + applicant_id combination
  const uniqueShortlisted = useMemo(() => {
    const seen = new Set<string>();
    return shortlisted.filter((s) => {
      const uniqueKey = `${s.id}-${s.applicant_id || s.name}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });
  }, [shortlisted]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return uniqueShortlisted;
    const query = searchQuery.toLowerCase();
    return uniqueShortlisted.filter((s) => {
      const name = s.full_name || s.applicant_name || s.name || "";
      const title = s.title || "";
      return name.toLowerCase().includes(query) || title.toLowerCase().includes(query);
    });
  }, [uniqueShortlisted, searchQuery]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {i18n.language === "ar" ? "المرشحون المختصرون" : "Shortlisted Candidates"} ({filtered.length})
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Shortlisted List */}
        <div className="flex-1 overflow-y-auto py-4">
          {pageItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{i18n.language === "ar" ? "لم يتم العثور على مرشحين" : "No shortlisted candidates found"}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pageItems.map((s, idx) => {
                const candidateName = s.full_name || s.applicant_name || s.name || "No name";
                const profilePicture = s.profile_picture || s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidateName)}&background=random`;

                return (
                  <li
                    key={`shortlisted-${s.id}-${s.applicant_id || idx}`}
                    className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
                    style={{ backgroundColor: '#e1e4e8' }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={profilePicture}
                        alt={candidateName}
                        className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-merit-dark truncate">{candidateName}</p>
                        <p className="text-xs text-merit-gray truncate">{s.title || "No title"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      {s.score !== undefined && s.score !== null && (
                        <span className="text-merit-dark font-semibold text-sm bg-merit-green/20 px-3 py-1 rounded-lg">
                          {s.score}
                        </span>
                      )}
                      <button
                        onClick={() => onRemove(s.id || s.applicant_id!)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                        title={i18n.language === 'ar' ? 'إزالة' : 'Remove'}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
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
