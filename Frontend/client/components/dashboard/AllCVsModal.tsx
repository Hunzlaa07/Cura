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
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface CV {
  id: number;
  applicant_id: number;
  file_name: string;
  file_path: string;
  language: string;
  uploaded_at: string;
}

interface AllCVsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvs: CV[];
}

export default function AllCVsModal({
  isOpen,
  onClose,
  cvs,
}: AllCVsModalProps) {
  const { i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deduplicate CVs by id
  const uniqueCVs = useMemo(() => {
    const seen = new Set<number>();
    return cvs.filter((cv) => {
      if (seen.has(cv.id)) return false;
      seen.add(cv.id);
      return true;
    });
  }, [cvs]);

  // Filter CVs by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return uniqueCVs;
    const query = searchQuery.toLowerCase();
    return uniqueCVs.filter((cv) =>
      cv.file_name.toLowerCase().includes(query)
    );
  }, [uniqueCVs, searchQuery]);

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
            {i18n.language === "ar" ? "إدارة السير الذاتية" : "CV Management"} ({filtered.length})
          </DialogTitle>
        </DialogHeader>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-b">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={i18n.language === "ar" ? "البحث عن ملف..." : "Search CVs..."}
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

        {/* CVs List */}
        <div className="flex-1 overflow-y-auto py-4">
          {pageItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{i18n.language === "ar" ? "لم يتم العثور على سير ذاتية" : "No CVs found"}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pageItems.map((cv, idx) => (
                <li
                  key={`cv-${cv.id}-${idx}`}
                  className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3"
                  style={{ backgroundColor: '#e1e4e8' }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-merit-dark truncate block">{cv.file_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(cv.uploaded_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_API_URL}${cv.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-merit-green text-black text-xs font-medium px-4 py-2 rounded-md shadow-sm hover:bg-merit-green/90 transition-colors duration-200 whitespace-nowrap"
                  >
                    {i18n.language === "ar" ? "عرض السيرة الذاتية" : "View CV"}
                  </a>
                </li>
              ))}
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
