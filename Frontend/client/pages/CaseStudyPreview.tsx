import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/dashboard/Sidebar";
import {
  Bell,
  History,
  Eye,
  Edit,
  Trash2,
  Send,
  Loader2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

function TopBar() {
  const { t } = useTranslation();
  
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
        <span className="text-xl md:text-2xl font-bold text-merit-dark">{t('appName')}</span>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" /> History
        </Button>
        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5 text-merit-dark" />
          <span className="absolute -top-0.5 -right-0.5 block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}

interface CaseStudy {
  id: number;
  job_id: number;
  title: string;
  description: string;
  instructions: string;
  duration_minutes: number;
  status: string;
  is_active: number;
  questions: string[];
  created_at: string;
}

interface Job {
  id: number;
  title: string;
  department: string;
}

export default function CaseStudyPreview() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCaseStudy();
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const jobs = data.jobs || data;
      const currentJob = jobs.find((j: any) => String(j.id) === String(jobId));
      if (currentJob) setJob(currentJob);
    } catch (err) {
      console.error("Error fetching job:", err);
    }
  };

  const fetchCaseStudy = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch case studies for this job
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/job/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch case study");
      }

      const data = await res.json();

      if (!data || data.length === 0) {
        setError("No case study found for this job");
        return;
      }

      // Get the first (and should be only) case study for this job
      setCaseStudy(data[0]);

    } catch (err: any) {
      console.error("Error fetching case study:", err);
      setError(err.message || "Failed to load case study");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!caseStudy) return;
    setShowPublishDialog(false);

    try {
      setPublishing(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/publish/bulk`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ caseStudyIds: [caseStudy.id] }),
        }
      );

      if (!res.ok) throw new Error("Failed to publish case study");

      toast({
        title: "Success ✨",
        description: "Case study published successfully!",
        variant: "default",
      });
      fetchCaseStudy(); // Refresh to show updated status

    } catch (err: any) {
      console.error("Error publishing:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to publish case study",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleEdit = () => {
    if (!caseStudy) return;
    navigate(`/recruiter-dashboard/cases/edit/${caseStudy.id}`);
  };

  const handleDelete = async () => {
    if (!caseStudy) return;
    setShowDeleteDialog(false);

    try {
      setDeleting(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/case-studies/${caseStudy.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete case study");

      toast({
        title: "Success 🗑️",
        description: "Case study deleted successfully!",
        variant: "default",
      });
      navigate("/recruiter-dashboard/my-jobs");

    } catch (err: any) {
      console.error("Error deleting:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete case study",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string, isActive: number) => {
    if (status === "published" && isActive === 1) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" /> Published
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" /> Draft
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-[#75A400]" />
          <span className="ml-2 text-gray-600">Loading case study...</span>
        </div>
      </div>
    );
  }

  if (error || !caseStudy) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopBar />
        <div className="flex">
          <Sidebar activeItem="cases" />
          <div className="flex-1 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-700 mb-2">
                  {error || "Case Study Not Found"}
                </h3>
                <p className="text-red-600 mb-6">
                  No case study has been generated for this job yet.
                </p>
                <Button
                  onClick={() => navigate(`/recruiter-dashboard/jobs/${jobId}/generate-case-study`)}
                  className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark"
                >
                  Generate Case Study
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Case Study?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the case study available to applicants. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark">
              Yes, Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case Study?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this case study?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 text-white hover:bg-red-600">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TopBar />
      <div className="flex">
        <Sidebar activeItem="cases" />
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-6 h-6 text-[#75A400]" />
                    <h1 className="text-2xl font-bold text-merit-dark">
                      Case Study Preview
                    </h1>
                    {getStatusBadge(caseStudy.status, caseStudy.is_active)}
                  </div>
                  {job && (
                    <p className="text-gray-600">
                      For: <span className="font-semibold text-merit-dark">{job.title}</span>
                      {job.department && ` • ${job.department}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                {caseStudy.status !== "published" && (
                  <Button
                    onClick={() => setShowPublishDialog(true)}
                    disabled={publishing}
                    className="bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-medium"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publish Case Study
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="border-gray-300"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>

                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => navigate("/recruiter-dashboard/my-jobs")}
                  variant="outline"
                  className="ml-auto"
                >
                  Back to Jobs
                </Button>
              </div>
            </div>

            {/* Case Study Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
              {/* Title and Duration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-merit-dark">
                    {caseStudy.title}
                  </h2>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-700">
                      {caseStudy.duration_minutes} minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#75A400]" />
                  Description
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {caseStudy.description}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              {caseStudy.instructions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Instructions
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {caseStudy.instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Questions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Questions ({caseStudy.questions.length})
                </h3>
                <div className="space-y-4">
                  {caseStudy.questions.map((question, index) => (
                    <div
                      key={index}
                      className="bg-lime-50 border border-lime-200 rounded-xl p-5"
                    >
                      <p className="font-medium text-gray-900">
                        <span className="text-[#75A400] font-bold">
                          Q{index + 1}.
                        </span>{" "}
                        {question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Created: {new Date(caseStudy.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}