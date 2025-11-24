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