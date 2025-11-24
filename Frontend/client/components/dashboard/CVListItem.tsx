import { FileText, X } from "lucide-react";

interface CVListItemProps {
  filename: string;
  onRemove?: () => void;
}

export default function CVListItem({ filename, onRemove }: CVListItemProps) {
  return (
    <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-6 py-5">
      <div className="flex items-center gap-4">
        <div className="text-red-500">
          <FileText className="w-7 h-7" />
        </div>
        <span className="text-merit-dark font-medium">{filename}</span>
      </div>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-merit-dark hover:text-red-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
