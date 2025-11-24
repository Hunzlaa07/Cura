import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface InvitationInfo {
  case_study_title: string;
  job_title: string;
  applicant_name: string;
  expires_at: string;
  status: string;
}

const CaseStudyLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No access token provided. Please check your invitation email.');
        setVerifying(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/case-study-invitations/verify`, {
          params: { token }
        });

        // Check if case study is already completed
        if (response.status === 303 || response.data.completed) {
          // Redirect to normal login page with email pre-filled
          const redirectEmail = response.data.email || '';
          navigate(`/login?email=${encodeURIComponent(redirectEmail)}&message=case_study_completed`);
          return;
        }

        if (response.data.valid) {
          setInvitationInfo(response.data.invitation);
        }
      } catch (err: any) {
        // Handle completed case study from error response
        if (err.response?.status === 303 || err.response?.data?.completed) {
          const redirectEmail = err.response.data.email || '';
          navigate(`/login?email=${encodeURIComponent(redirectEmail)}&message=case_study_completed`);
          return;
        }
        
        setError(err.response?.data?.error || 'Invalid or expired invitation');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/case-study-invitations/login`, {
        email,
        password,
        token
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.session.access_token);
        sessionStorage.setItem('case_study_session', JSON.stringify({
          invitation_id: response.data.session.invitation_id,
          case_study_id: response.data.session.case_study_id,
          job_id: response.data.session.job_id,
          case_study_token: response.data.session.case_study_token
        }));

        // Navigate based on whether it's a job-based or assessment-based case study
        if (response.data.session.job_id) {
          navigate(`/applicant-dashboard/case-studies/job/${response.data.session.job_id}`);
        } else {
          // Assessment-based case study - navigate directly to case study
          navigate(`/assessment-start/case-study/${response.data.session.case_study_id}`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6f9f0] via-white to-[#d3f2e3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1DBF73] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6f9f0] via-white to-[#d3f2e3] p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Please contact the recruiter if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }
  

  // Main Login Page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6f9f0] via-white to-[#d3f2e3] p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2">

        {/* Left Side - Info */}
        <div className="bg-gradient-to-br from-[#1DBF73] to-[#17a864] p-8 text-white flex flex-col justify-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Case Study Assessment</h1>
            <p className="text-green-100">Welcome to your evaluation</p>
          </div>

          {invitationInfo && (
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Position</p>
                <p className="font-semibold">{invitationInfo.job_title}</p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Case Study</p>
                <p className="font-semibold">{invitationInfo.case_study_title}</p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-green-100 mb-1">Valid Until</p>
                <p className="font-semibold">
                  {new Date(invitationInfo.expires_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-400/20 border border-yellow-300/30 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-100">
                Use the credentials from your invitation email to log in and access your case study.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login to Continue</h2>
          <p className="text-gray-600 mb-6">Enter your credentials from the invitation email</p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DBF73] focus:border-transparent transition"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temporary Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1DBF73] focus:border-transparent transition"
                placeholder="Enter password from email"
              />
              <p className="text-xs text-gray-500 mt-1">
                Check your invitation email for the temporary password
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1DBF73] hover:bg-[#17a864] text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Access Case Study →"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Having trouble?</strong> Make sure you're using the email address you applied with and the password from your invitation email.
              If you still can't access, contact the recruiter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyLogin;