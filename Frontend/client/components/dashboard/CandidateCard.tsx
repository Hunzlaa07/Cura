import { Button } from "@/components/ui/button";
import { Check, Eye, MessageCircle } from "lucide-react";

interface CandidateCardProps {
  id?: number;
  name: string;
  role: string;
  score: number;
  skills: string[];
  caseStudy: string;
  submittedTime: string;
  avatar: string;
  onShortlist?: () => void;
  onView?: () => void;
  onMessage?: () => void;
  isShortlisted?: boolean;
  isRejected?: boolean;  // ADD THIS LINE
  compact?: boolean; // compact variant for modal
}

export default function CandidateCard({
  id,
  name,
  role,
  score,
  skills,
  caseStudy,
  submittedTime,
  avatar,
  onShortlist,
  onView,
  onMessage,
  isShortlisted = false,
  isRejected = false,  // ADD THIS LINE
  compact = false,
}: CandidateCardProps) {
  return (
    <div 
      className={`rounded-3xl ${compact ? 'p-4 h-[260px]' : 'p-5 md:p-8 h-[420px]'} shadow-sm border border-gray-300 hover:shadow-md transition-shadow duration-300 relative flex flex-col`}
      style={{ backgroundColor: '#e1e4e8' }}
    >

      {/* Optional badge */}
      {isShortlisted && (
        <span className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
          Shortlisted
        </span>
      )}
      {/* Rejected badge */}
{isRejected && (
  <span className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
    Rejected
  </span>
)}

      {/* Header with Avatar and Score */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <img
            src={avatar}
            alt={name}
            className={`${compact ? 'w-10 h-10 md:w-10 md:h-10' : 'w-12 h-12 md:w-14 md:h-14'} rounded-full object-cover flex-shrink-0`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-merit-dark truncate">{name}</h3>
            <p className="text-sm text-merit-gray truncate">{role}</p>
          </div>
        </div>

        {/* AI Score */}
          <div className={`flex items-center gap-2 flex-shrink-0 ml-2 ${compact ? 'text-sm' : ''}`}>
          <div className="w-2.5 h-2.5 bg-merit-dark rounded-full"></div>
          <span className={`${compact ? 'text-lg font-semibold' : 'text-2xl font-semibold text-merit-dark'}`}>{score}</span>
        </div>
      </div>

      {/* Skills Tags - Fixed height container */}
      <div className="h-[72px] overflow-hidden mb-3">
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="bg-merit-green text-merit-dark px-3 py-1.5 rounded-full text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">
              +{skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Case Study - Fixed height */}
      <div className="flex-1 mb-4">
        <p className="text-merit-gray text-sm line-clamp-2 mb-1.5">
          Job Applied For: {caseStudy}
        </p>
        <p className="text-gray-500 text-xs">
          Submitted {submittedTime}
        </p>
      </div>

      {/* Action Buttons - Always at bottom */}
      <div className="flex gap-2 mt-auto">
        <Button
          onClick={onShortlist}
          disabled={isShortlisted || isRejected}
          className={`flex items-center gap-2 flex-1 ${compact ? 'h-8 text-sm' : 'h-9'} ${
            isShortlisted || isRejected
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-merit-green text-merit-dark hover:bg-merit-green/90"
          }`}
          title={isRejected ? "Cannot shortlist a rejected candidate" : ""}
        >
          <Check className="w-4 h-4" />
          {isShortlisted ? "Shortlisted" : isRejected ? "Rejected" : "Shortlist"}
        </Button>

        <Button
          onClick={onView}
          variant="outline"
          className={`border-gray-300 text-merit-gray hover:bg-gray-50 flex items-center gap-2 flex-1 ${compact ? 'h-8 text-sm' : 'h-9'}`}
        >
          <Eye className="w-4 h-4" />
          View
        </Button>

        <Button
          onClick={onMessage}
          variant="outline"
          className={`border-gray-300 text-merit-gray hover:bg-gray-50 px-3 ${compact ? 'h-8' : 'h-9'}`}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}