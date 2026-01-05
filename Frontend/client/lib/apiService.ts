const API_URL = import.meta.env.VITE_API_URL;
import i18n from '@/i18n';

// ============================================
// Helper to get headers with language support
// ============================================
export const getHeaders = () => {
  const token = localStorage.getItem("token");
  const language = i18n.language || 'en'; 
  
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Accept-Language": language, 
  };
};

// ============================================
// Legacy auth header (deprecated - use getHeaders instead)
// ============================================
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================
// Fetch Applicant Profile (Language-Aware)
// ============================================
export const fetchApplicantProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not logged in");

    const res = await fetch(`${API_URL}/api/applicants/profile`, {
      method: "GET",
      headers: getHeaders(), // ✅ Already includes language
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
    
    // Backend returns: { profile: {...}, language: 'en' }
    return data;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
};

// ============================================
// Fetch All Jobs (Language-Aware)
// ============================================
export const fetchJobs = async () => {
  try {
    const res = await fetch(`${API_URL}/api/jobs`, {
      method: "GET",
      headers: getHeaders(), 
      cache: "no-store",
    });

    const data = await res.json();
    console.log('fetchJobs response status:', res.status, 'data:', data);
    if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
    
    // Backend returns: { jobs: [...], language: 'en', total: 5 }
    return data.jobs || data;
  } catch (err) {
    console.error("Error fetching jobs:", err);
    return [];
  }
};

// ============================================
// Fetch Single Job by ID (Language-Aware)
// ============================================
export const fetchJobById = async (jobId: string) => {
  try {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch job");
    
    return data;
  } catch (err) {
    console.error("Error fetching job:", err);
    return null;
  }
};

// ============================================
// Fetch Public Job Details (Language-Aware)
// ============================================
export const fetchPublicJobDetails = async (shareLink: string) => {
  try {
    const res = await fetch(`${API_URL}/api/jobs/public/${shareLink}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch job");
    
    return data;
  } catch (err) {
    console.error("Error fetching public job:", err);
    return null;
  }
};

export const updateJobById = async (jobId: string, jobData: any) => {
  try {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update job");
    
    return data;
  } catch (err) {
    console.error("Error updating job:", err);
    throw err;
  }
};

// ============================================
// Fetch Feedbacks for Logged-in Applicant
// ============================================
export const fetchFeedbacks = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not logged in");

    const res = await fetch(`${API_URL}/api/feedbacks`, {
      method: "GET",
      headers: getHeaders(), 
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch feedbacks");
    return data;
  } catch (err) {
    console.error("Error fetching feedbacks:", err);
    return [];
  }
};

// ============================================
// Fetch Recruiter Profile (Language-Aware)
// ============================================
export const fetchRecruiterProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not logged in");

    const res = await fetch(`${API_URL}/api/recruiters/profile`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch recruiter profile");
    
    return data;
  } catch (err) {
    console.error("Error fetching recruiter profile:", err);
    return null;
  }
};

// ============================================
// Fetch My Case Study Invitations
// ============================================
export const fetchMyInvitations = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/case-study-invitations/my-invitations`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invitations');
  }

  const data = await response.json();
  return data.invitations || [];
};

// ============================================
// Fetch Case Studies (Language-Aware)
// ============================================
export const fetchCaseStudies = async (jobId: string) => {
  try {
    const res = await fetch(`${API_URL}/api/case-studies/job/${jobId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch case studies");
    
    return data.caseStudies || data;
  } catch (err) {
    console.error("Error fetching case studies:", err);
    return [];
  }
};

export const saveLanguagePreference = async (language: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch(`${API_URL}/api/recruiters/language-preference`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ language }),
    });
  } catch (err) {
    console.error("Error saving language preference:", err);
  }
};

// ============================================
// Pre-Built Assessments API
// ============================================

export interface PreBuiltAssessment {
  id: number;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category: string;
  sub_category?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_minutes: number;
  num_questions: number;
  skills_tested: string[];
  role_types: string[];
  industry?: string;
  times_used: number;
  avg_score?: number;
  rating?: number;
  rating_count?: number;
  is_featured: boolean;
  requires_proctoring: boolean;
  questions?: any[];
  case_study_content?: any;
}

export interface PreBuiltCategory {
  category: string;
  count: number;
  featured_count: number;
  label: { en: string; ar: string };
}

export interface PublishPreBuiltParams {
  job_id?: number;
  custom_title?: string;
  custom_duration_minutes?: number;
  custom_instructions?: string;
  custom_questions?: any[];
  antiCheating?: {
    enableFullscreen?: boolean;
    enableTabSwitch?: boolean;
    enableCopyPaste?: boolean;
    enableWebcamProctoring?: boolean;
    webcam_snapshots_interval?: number;
    maxTabSwitches?: number;
  };
  expires_at?: string;
}

export const fetchPreBuiltAssessments = async (params?: {
  category?: string;
  difficulty?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}) => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.featured) searchParams.append('featured', 'true');
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const res = await fetch(`${API_URL}/api/pre-built-assessments?${searchParams.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch assessments');
    return data;
  } catch (err) {
    console.error('Error fetching pre-built assessments:', err);
    throw err;
  }
};

export const fetchPreBuiltAssessmentById = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch assessment');
    return data.data as PreBuiltAssessment;
  } catch (err) {
    console.error('Error fetching assessment:', err);
    throw err;
  }
};

export const fetchPreBuiltCategories = async () => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data.data as PreBuiltCategory[];
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;
  }
};

export const publishPreBuiltAssessment = async (id: number, params: PublishPreBuiltParams) => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/${id}/publish`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish assessment');
    return data;
  } catch (err) {
    console.error('Error publishing assessment:', err);
    throw err;
  }
};

export const savePreBuiltAssessment = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/${id}/save`, {
      method: 'POST',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save assessment');
    return data;
  } catch (err) {
    console.error('Error saving assessment:', err);
    throw err;
  }
};

export const unsavePreBuiltAssessment = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/${id}/save`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unsave assessment');
    return data;
  } catch (err) {
    console.error('Error unsaving assessment:', err);
    throw err;
  }
};

export const fetchSavedPreBuiltAssessments = async () => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/saved`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch saved assessments');
    return data.data as PreBuiltAssessment[];
  } catch (err) {
    console.error('Error fetching saved assessments:', err);
    throw err;
  }
};

export const fetchMyPublishedPreBuiltAssessments = async () => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/published`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch published assessments');
    return data.data;
  } catch (err) {
    console.error('Error fetching published assessments:', err);
    throw err;
  }
};

export const fetchPreBuiltAssessmentByToken = async (token: string) => {
  try {
    const res = await fetch(`${API_URL}/api/pre-built-assessments/share/${token}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Assessment not found or expired');
    return data.data;
  } catch (err) {
    console.error('Error fetching assessment by token:', err);
    throw err;
  }
};