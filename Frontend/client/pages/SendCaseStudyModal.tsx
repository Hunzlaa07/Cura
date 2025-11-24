// src/components/recruiter/SendCaseStudyModal.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CaseStudy {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  status: string;
}

interface SendCaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApplicants: number[];
  jobId: number;
  onSuccess: () => void;
}

const SendCaseStudyModal: React.FC<SendCaseStudyModalProps> = ({
  isOpen,
  onClose,
  selectedApplicants,
  jobId,
  onSuccess
}) => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCaseStudies();
    }
  }, [isOpen]);

const fetchCaseStudies = async () => {
  setLoading(true);
  setError('');

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/case-studies/job/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Full response:', response.data);

    // Normalize to always be an array
    let caseStudiesData: any[] = [];

    if (Array.isArray(response.data)) {
      // Case 1: backend directly returns an array
      caseStudiesData = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Case 2: backend returns { caseStudies: [...] }
      if (Array.isArray(response.data.caseStudies)) {
        caseStudiesData = response.data.caseStudies;
      }
      // Case 3: backend returns { data: [...] }
      else if (Array.isArray(response.data.data)) {
        caseStudiesData = response.data.data;
      }
      // Case 4: backend returns a single object (your current case)
      else if (response.data.id) {
        caseStudiesData = [response.data];
      }
    }

    console.log("✅ Normalized Case Studies:", caseStudiesData);

    // Filter only published or active case studies
    const published = caseStudiesData.filter(
      (cs) => cs.status?.toLowerCase() === 'published' || cs.is_active === 1
    );

    setCaseStudies(published);

    if (published.length === 0) {
      setError('No published case studies available.');
    }
  } catch (err: any) {
    console.error('Error fetching case studies:', err);
    setError(err.response?.data?.error || 'Failed to load case studies');
  } finally {
    setLoading(false);
  }
};


  const handleSend = async () => {
    if (!selectedCaseStudy) {
      setError('Please select a case study');
      return;
    }

    if (selectedApplicants.length === 0) {
      setError('No applicants selected');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/case-study-invitations/send`,
        {
          applicant_ids: selectedApplicants,
          job_id: jobId,
          case_study_id: selectedCaseStudy
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(response.data.message);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#00A884] to-[#00856A] text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Send Case Study</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Sending to {selectedApplicants.length} selected applicant
                {selectedApplicants.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-[#E6F7F2] border border-[#00A884]/30 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-[#00A884] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[#006F57]">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A884] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading case studies...</p>
            </div>
          ) : caseStudies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Case Studies Available</h3>
              <p className="text-gray-600 mb-4">You need to create and publish a case study first.</p>
              <button
                onClick={() => window.location.href = '/recruiter/case-studies'}
                className="px-6 py-2 bg-[#00A884] text-white rounded-lg hover:bg-[#00856A] transition"
              >
                Create Case Study
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Case Study</h3>

              <div className="space-y-3 mb-6">
                {caseStudies.map((caseStudy) => (
                  <div
                    key={caseStudy.id}
                    onClick={() => setSelectedCaseStudy(caseStudy.id)}
                    className={`
                      p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${selectedCaseStudy === caseStudy.id
                        ? 'border-[#00A884] bg-[#E6F7F2] shadow-md'
                        : 'border-gray-200 hover:border-[#00A884]/50 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${selectedCaseStudy === caseStudy.id
                          ? 'border-[#00A884] bg-[#00A884]'
                          : 'border-gray-300'
                        }
                      `}>
                        {selectedCaseStudy === caseStudy.id && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{caseStudy.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{caseStudy.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {caseStudy.duration_minutes} minutes
                          </span>
                          <span className="px-2 py-1 bg-[#E6F7F2] text-[#006F57] rounded-full text-xs font-medium">
                            Published
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#E6F7F2] border border-[#00A884]/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#00A884] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-[#005C47]">
                    <p className="font-medium mb-1">What happens next:</p>
                    <ul className="list-disc list-inside space-y-1 text-[#007B63]">
                      <li>Selected applicants will receive an email with login credentials</li>
                      <li>They'll have 7 days to complete the case study</li>
                      <li>You'll be notified when they submit their responses</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {caseStudies.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t p-6 rounded-b-2xl flex gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!selectedCaseStudy || sending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A884] to-[#00856A] text-white rounded-lg font-semibold hover:from-[#00B996] hover:to-[#009975] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                `Send to ${selectedApplicants.length} Applicant${selectedApplicants.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendCaseStudyModal;