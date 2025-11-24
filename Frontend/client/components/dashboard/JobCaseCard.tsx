import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface JobCaseCardProps {
  id: string | number;
  title: string;
  company: string;
  location: string;
  jobType: string;
  postedTime: string;
  startTime: string;
  endTime: string;
  status: "active" | "expired" | "submitted";
  onAction?: () => void;
  case_study_id?: number; // For assessment case studies
  job_id?: number | null; // Can be null for assessments
}

export default function JobCaseCard({
  id,
  title,
  company,
  location,
  jobType,
  postedTime,
  startTime,
  endTime,
  status,
  onAction,
  case_study_id,
  job_id,
}: JobCaseCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Format time - handles various formats from backend
  const formatTime = (time: string) => {
    if (!time) return "N/A";
    
    // If it's already a formatted string, return as-is
    if (typeof time === 'string' && time.includes(',')) {
      return time;
    }
    
    try {
      // Try parsing the date
      const date = new Date(time);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return time;
      }
      
      return date.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return time;
    }
  };

  // Map status to translation keys
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active':
        return t('applicantDashboardPage.active');
      case 'submitted':
        return i18n.language === 'ar' ? 'تم التقديم' : 'Submitted';
      case 'expired':
        return t('applicantDashboardPage.expired');
      default:
        return status;
    }
  };

  return (
    <div className="border-2 border-gray-300 rounded-xl p-6 hover:border-gray-400 transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 bg-merit-green rounded-lg flex items-center justify-center flex-shrink-0">
            <Code2 className="w-6 h-6 text-merit-dark" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-merit-dark mb-1">
              {title}
            </h3>
            <p className="text-base text-merit-gray">{company}</p>
          </div>
        </div>
        <div className="text-right text-xs text-merit-gray flex items-center gap-2">
          <span>{location}</span>
          <span className="w-1 h-1 bg-merit-gray rounded-full"></span>
          <span>{jobType}</span>
          <span className="w-1 h-1 bg-merit-gray rounded-full"></span>
          <span>{postedTime}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-12">
          <div>
            <p className="text-xs text-merit-dark opacity-40 mb-1">
              {i18n.language === 'ar' ? 'وقت البدء' : 'Start Time'}
            </p>
            <p className="text-sm font-semibold text-merit-dark">{formatTime(startTime)}</p>
          </div>
          <div>
            <p className="text-xs text-merit-dark opacity-40 mb-1">
              {i18n.language === 'ar' ? 'وقت الانتهاء' : 'End Time'}
            </p>
            <p className="text-sm font-semibold text-merit-dark">{formatTime(endTime)}</p>
          </div>
        </div>

        {status === "active" ? (
          <Button
            onClick={() => {
              // For assessment case studies (no job_id), use assessment route to CaseStudyAssessment page
              if (!job_id && case_study_id) {
                navigate(`/applicant-dashboard/case-studies/assessment/${case_study_id}`);
              } else {
                navigate(`/applicant-dashboard/case-studies/job/${id}`);
              }
            }}
            className="bg-merit-green text-merit-dark hover:bg-merit-green/90 px-8 py-2 h-auto text-sm rounded-lg"
          >
            {i18n.language === 'ar' ? 'ابدأ الآن' : 'Start Now'}
          </Button>
        ) : status === "submitted" ? (
          <Button
            disabled
            className="bg-green-600 text-white px-8 py-2 h-auto text-sm rounded-lg cursor-not-allowed opacity-100"
          >
            {getStatusLabel('submitted')}
          </Button>
        ) : (
          <Button
            disabled
            className="bg-merit-dark text-white px-8 py-2 h-auto text-sm rounded-lg cursor-not-allowed opacity-100"
          >
            {getStatusLabel('expired')}
          </Button>
        )}
      </div>
    </div>
  );
}