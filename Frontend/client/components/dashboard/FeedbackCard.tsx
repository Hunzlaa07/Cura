import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackCardProps {
  title: string;
  submittedTime: string;
  score?: number;
  maxScore?: number;
  rating?: "Excellent" | "Good" | "Average";
  status: "completed" | "pending";
}

export default function FeedbackCard({
  title,
  submittedTime,
  score,
  maxScore = 100,
  rating,
  status,
}: FeedbackCardProps) {
  return (
    <div className="border-4 border-gray-300 rounded-2xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          status === "completed" ? "bg-merit-green" : "bg-merit-green"
        )}>
          {status === "completed" ? (
            <Check className="w-6 h-6 text-merit-dark" />
          ) : (
            <Clock className="w-6 h-6 text-merit-dark" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-merit-dark mb-1">
            {title}
          </h3>
          <p className="text-sm text-merit-gray">{submittedTime}</p>
        </div>
      </div>

      <div className="text-right">
        {status === "completed" && score !== undefined ? (
          <>
            <div className="text-3xl font-bold text-merit-dark mb-1">
              {score}/{maxScore}
            </div>
            {rating && (
              <div className={cn(
                "text-sm",
                rating === "Excellent" && "text-green-600",
                rating === "Good" && "text-blue-600",
                rating === "Average" && "text-yellow-600"
              )}>
                {rating}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-merit-dark opacity-40 mb-1">
              Pending
            </div>
            <div className="text-sm text-merit-dark">
              Review in progress
            </div>
          </>
        )}
      </div>
    </div>
  );
}
