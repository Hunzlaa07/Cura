import "./global.css";
import "./i18n"; // Import i18n configuration

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardCases from "./pages/DashboardCases";
import DashboardCasesPreview from "./pages/DashboardCasesPreview";
import DashboardUpload from "./pages/DashboardUpload";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import CaseStudyAssessment from "./pages/CaseStudyAssessment";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import UpdateProfile from "./pages/UpdateProfile";
import GenerateCase from "./pages/GenerateCase";
import AssessmentStart from "./pages/AssessmentStart";
import MyJobsDashboard from './pages/MyJobsDashboard';
import ViewApplicants from './pages/ViewApplicants';
import JobApplication from './pages/JobApplication';
import ApplicantSettings from './pages/ApplicantSettings';
import AssessmentResultsView from './pages/AssessmentResultsView';
import BulkCVMatcher from './pages/BulkCVMatcher';
import CaseStudyAssessments from './pages/CaseStudyAssessments';
import AssessmentApplicationForm from './pages/AssessmentApplicationForm';
import AssessmentApplications from './pages/AssessmentApplications';
import PreBuiltAssessments from './pages/PreBuiltAssessments';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/recruiter-dashboard" element={<Dashboard />} />
          <Route path="/recruiter-dashboard/upload" element={<DashboardUpload />} />
          <Route path="/recruiter-dashboard/cases" element={<DashboardCases />} />
          <Route path="/recruiter-dashboard/cases/preview" element={<DashboardCasesPreview />} />
          <Route path="/recruiter-dashboard/generate-case" element={<GenerateCase />} />
          
          <Route path="/recruiter-dashboard/jobs/:jobId/generate-case-study" element={<GenerateCase />} />
          <Route path="/recruiter-dashboard/jobs/:jobId/case-study-preview" element={<DashboardCasesPreview />} />
          
          <Route path="/recruiter-dashboard/my-jobs" element={<MyJobsDashboard />} />
          <Route path="/recruiter-dashboard/jobs/:id/applicants" element={<ViewApplicants />} />
          <Route path="/recruiter-dashboard/case-study-assessments/:assessmentId/applications" element={<ViewApplicants />} />
          <Route path="/apply/:shareLink" element={<JobApplication />} />
          <Route path="/applicant-dashboard" element={<ApplicantDashboard />} />
          <Route path="/applicant-dashboard/case-studies/job/:jobId" element={<CaseStudyAssessment />} />
          <Route path="/applicant-dashboard/case-studies/assessment/:caseStudyId" element={<CaseStudyAssessment />} />
          <Route path="/applicant-dashboard/settings" element={<ApplicantSettings />} />
          <Route path="/assessment-start/case-study/:caseStudyId" element={<AssessmentStart />} />
          <Route path="/assessment-start/:jobId" element={<AssessmentStart />} />
          <Route path="/profile/update" element={<UpdateProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/protected-signup" element={<Signup />} />
          <Route path="/jobs/:jobId/assessment/:applicantEmail" element={<AssessmentResultsView />} />
          <Route path="/recruiter-dashboard/case-study-preview/:caseStudyId" element={<DashboardCasesPreview />} />
          <Route path="/recruiter-dashboard/bulk-match" element={<BulkCVMatcher />} />
          <Route path="/recruiter-dashboard/case-study-assessments" element={<CaseStudyAssessments />} />
          <Route path="/recruiter-dashboard/case-study-assessments/:assessmentId/applications" element={<AssessmentApplications />} />
          <Route path="/recruiter-dashboard/pre-built-assessments" element={<PreBuiltAssessments />} />
          <Route path="/assessment/apply/:shareLink" element={<AssessmentApplicationForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);