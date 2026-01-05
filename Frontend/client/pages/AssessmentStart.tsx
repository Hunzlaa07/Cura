import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import ApplicantSidebar from "@/components/dashboard/ApplicantSidebar";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertTriangle, Upload, X, FileText, Code, Video, Play, Square, Camera, Database, FileSpreadsheet, PenTool, Brain, MessageSquare, Clock, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface CustomQuestion {
  id: number;
  question_type: string;
  question_text: string;
  question_text_ar?: string;
  options?: Array<{ id: string; text_en: string; text_ar?: string; is_correct?: boolean }>;
  correct_answers?: string[];
  keywords?: string[];
  rubric?: any;
  time_limit?: number;
  weight?: number;
  question_order: number;
  min_word_count?: number;
  max_word_count?: number;
  min_video_duration?: number;
  max_video_duration?: number;
  test_cases?: Array<{ input: any; expected: any; hidden?: boolean }>;
  starter_code?: any;
  spreadsheet_template?: any;
  expected_response?: any;
  skill_tags?: string[];
}

interface CaseStudy {
  id: number;
  title: string;
  description: string;
  instructions: string;
  questions: string[];
  tables?: Array<{
    id: string;
    table_id: string;
    title: string;
    columns: Array<{ key: string; label: string; type: string }>;
    rows: Array<Record<string, string>>;
  }>;
  customQuestions?: CustomQuestion[];
  antiCheatingSettings?: {
    fullscreen_required?: boolean;
    tab_switch_detection?: boolean;
    tab_switch_limit?: number;
    copy_paste_disabled?: boolean;
    webcam_required?: boolean;
  };
  duration_minutes: number;
}

interface AnswerData {
  type: 'text' | 'file';
  content: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
}

interface CustomQuestionAnswer {
  question_id: number;
  question_type: string;
  answer: any; // Can be string, array of selected options, code, video blob URL, etc.
  time_spent?: number; // seconds spent on this question
}

const getAuthToken = (): string | null => {
  const sessionData = sessionStorage.getItem('case_study_session');
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      if (session.access_token) {
        console.log("✅ Using case study access token");
        return session.access_token;
      }
    } catch (e) {
      console.error("Failed to parse session data");
    }
  }

  const jwtToken = localStorage.getItem("token");
  if (jwtToken) {
    console.log("✅ Using regular JWT token");
    return jwtToken;
  }

  return null;
};

// Helper to get session ID for proctoring logs
const getSessionId = (caseStudyId: number | string): number | null => {
  const sessionIdStr = sessionStorage.getItem(`assessment_session_${caseStudyId}`);
  return sessionIdStr ? parseInt(sessionIdStr, 10) : null;
};

// Helper to get job_application_id for proctoring logs
const getApplicationId = (): number | null => {
  const sessionData = sessionStorage.getItem('case_study_session');
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      if (session.job_application_id) {
        return session.job_application_id;
      }
    } catch (e) {
      console.error("Failed to parse session data for application_id");
    }
  }
  return null;
};

// Helper to get applicant_id from JWT token or session
const getApplicantId = (): number | null => {
  // First, try from localStorage token
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.applicantId) {
          console.log('✅ Got applicantId from JWT:', payload.applicantId);
          return payload.applicantId;
        }
      }
    } catch (e) {
      console.error("Failed to decode token for applicant_id:", e);
    }
  }
  
  // Fallback: return null - the server will extract from req.user.applicantId
  return null;
};

export default function AssessmentStart() {
  const { jobId, caseStudyId } = useParams<{ jobId?: string; caseStudyId?: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [customAnswers, setCustomAnswers] = useState<CustomQuestionAnswer[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const token = getAuthToken();
  // Use caseStudyId if available (for assessments), otherwise use jobId
  const identifier = caseStudyId || jobId || '';
  const storageKey = `assessment_${identifier}_timer`;
  const answersKey = `assessment_${identifier}_answers`;

  // Video recording state
  const [recordingQuestionId, setRecordingQuestionId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlobs, setVideoBlobs] = useState<Record<number, Blob>>({});
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Anti-cheating state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);
  const [antiCheatMessage, setAntiCheatMessage] = useState('');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const [antiCheatReady, setAntiCheatReady] = useState(false); // Track if anti-cheat initialization is complete
  const [showAntiCheatPreScreen, setShowAntiCheatPreScreen] = useState(false); // Pre-start screen

  // Load saved answers from localStorage on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(answersKey);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        if (Array.isArray(parsed)) {
          setAnswers(parsed);
        }
      } catch (e) {
        console.error("Failed to load saved answers", e);
      }
    }
  }, [answersKey]);

  // ============================================
  // ANTI-CHEATING: Initialize when case study loads
  // ============================================
  useEffect(() => {
    if (!caseStudy?.antiCheatingSettings || submitted) return;

    const settings = caseStudy.antiCheatingSettings;

    // Fullscreen requirement
    if (settings.fullscreen_required) {
      const enterFullscreen = async () => {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.warn('Fullscreen request denied:', err);
          setAntiCheatMessage(i18n.language === 'ar' 
            ? 'يرجى تفعيل وضع ملء الشاشة للمتابعة'
            : 'Please enable fullscreen mode to continue');
          setShowAntiCheatWarning(true);
        }
      };
      enterFullscreen();

      const handleFullscreenChange = async () => {
        const isNowFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isNowFullscreen);
        if (!isNowFullscreen && !submitted) {
          setAntiCheatMessage(i18n.language === 'ar'
            ? 'تحذير: خرجت من وضع ملء الشاشة. يرجى العودة إليه.'
            : 'Warning: You exited fullscreen mode. Please return to fullscreen.');
          setShowAntiCheatWarning(true);
          
          // Log fullscreen exit to server
          try {
            const { logProctoringEvent } = await import('@/lib/assessmentApiService');
            await logProctoringEvent({
              applicant_id: getApplicantId() ?? undefined,
              application_id: getApplicationId() ?? undefined,
              assessment_application_id: caseStudy?.id,
              session_id: caseStudy?.id ? getSessionId(caseStudy.id) : null,
              event_type: 'fullscreen_exit',
              event_data: { timestamp: Date.now() },
              severity: 'medium',
              client_timestamp: new Date().toISOString()
            });
            console.log('📋 Fullscreen exit logged to server');
          } catch (err) {
            console.error('Failed to log fullscreen exit:', err);
          }
        }
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, [caseStudy, submitted, i18n.language]);

  // Tab switch detection
  useEffect(() => {
    console.log('🔍 Tab switch detection check:', {
      hasSettings: !!caseStudy?.antiCheatingSettings,
      tab_switch_detection: caseStudy?.antiCheatingSettings?.tab_switch_detection,
      submitted
    });
    if (!caseStudy?.antiCheatingSettings?.tab_switch_detection || submitted) return;

    console.log('✅ Tab switch detection ENABLED - registering handler');
    const handleVisibilityChange = () => {
      if (!document.hidden) return;

      // Use functional update to compute the next count and avoid stale state
      setTabSwitchCount(prev => {
        const newCount = prev + 1;
        const limit = (caseStudy?.antiCheatingSettings?.tab_switch_limit ?? 3);

        if (newCount > limit) {
          // Exceeded by one additional switch -> deduct once per excess
          setAntiCheatMessage(i18n.language === 'ar'
            ? `تحذير: تم تجاوز حد تبديل التبويب (${newCount}/${limit}). سيتم تطبيق خصم لكل مرة تتجاوز فيها الحد.`
            : `Warning: Tab switch limit exceeded (${newCount}/${limit}). A deduction will be applied for each excess switch.`);
          setShowAntiCheatWarning(true);

          // Fire-and-forget: log a single excess increment. Server will multiply penalty by excessIncrement.
          (async () => {
            try {
              const { logProctoringEvent } = await import('@/lib/assessmentApiService');
              await logProctoringEvent({
                applicant_id: getApplicantId() ?? undefined,
                application_id: getApplicationId() ?? undefined,
                assessment_application_id: caseStudy?.id,
                session_id: caseStudy?.id ? getSessionId(caseStudy.id) : null,
                event_type: 'tab_switch_limit_exceeded',
                event_data: {
                  timestamp: Date.now(),
                  count: newCount,
                  excessIncrement: 1
                },
                severity: 'medium',
                client_timestamp: new Date().toISOString()
              });
              console.log('📋 Tab switch limit exceeded increment logged to server (excessIncrement=1)');
            } catch (err) {
              console.error('Failed to log tab switch limit exceeded increment:', err);
            }
          })();
        } else {
          // Gentle warning informing user of count and remaining allowance; do NOT mark as cheating yet
          setAntiCheatMessage(i18n.language === 'ar'
            ? `تحذير: تم اكتشاف تبديل التبويب (${newCount}/${limit}). هذا مسجل.`
            : `Warning: Tab switch detected (${newCount}/${limit}). This is being recorded.`);
          setShowAntiCheatWarning(true);
          // Intentionally not logging to server for every single switch to reduce noise
        }

        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [caseStudy, submitted, i18n.language, tabSwitchCount]);

  // Copy/paste prevention
  useEffect(() => {
    if (!caseStudy?.antiCheatingSettings?.copy_paste_disabled || submitted) return;

    const logCopyPasteEvent = async (eventType: string) => {
      try {
        const { logProctoringEvent } = await import('@/lib/assessmentApiService');
        await logProctoringEvent({
          applicant_id: getApplicantId() ?? undefined,
          application_id: getApplicationId() ?? undefined,
          assessment_application_id: caseStudy?.id,
          session_id: caseStudy?.id ? getSessionId(caseStudy.id) : null,
          event_type: eventType,
          event_data: { timestamp: Date.now() },
          severity: 'high',
          client_timestamp: new Date().toISOString()
        });
        console.log(`📋 ${eventType} logged to server`);
      } catch (err) {
        console.error(`Failed to log ${eventType}:`, err);
      }
    };

    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const eventType = e.type === 'copy' ? 'copy_attempt' : e.type === 'paste' ? 'paste_attempt' : 'cut_attempt';
      setAntiCheatMessage(i18n.language === 'ar'
        ? 'تحذير: النسخ واللصق معطل في هذا التقييم'
        : 'Warning: Copy and paste is disabled for this assessment');
      setShowAntiCheatWarning(true);
      logCopyPasteEvent(eventType);
    };

    // Right-click prevention
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setAntiCheatMessage(i18n.language === 'ar'
        ? 'تحذير: النقر بالزر الأيمن معطل في هذا التقييم'
        : 'Warning: Right-click is disabled for this assessment');
      setShowAntiCheatWarning(true);
    };

    // Keyboard shortcut prevention (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, F12, Ctrl+Shift+I)
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, Ctrl+Shift+I
      if (e.ctrlKey && ['c', 'v', 'x', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setAntiCheatMessage(i18n.language === 'ar'
          ? 'تحذير: اختصارات لوحة المفاتيح معطلة في هذا التقييم'
          : 'Warning: Keyboard shortcuts are disabled for this assessment');
        setShowAntiCheatWarning(true);
      }
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [caseStudy, submitted, i18n.language]);

  // Webcam monitoring + periodic screenshot capture with face detection
  useEffect(() => {
    console.log('🔍 Webcam proctoring check:', {
      hasSettings: !!caseStudy?.antiCheatingSettings,
      webcam_required: caseStudy?.antiCheatingSettings?.webcam_required,
      submitted
    });
    if (!caseStudy?.antiCheatingSettings?.webcam_required || submitted) return;

    console.log('✅ Webcam proctoring ENABLED - starting webcam');
    let snapshotInterval: NodeJS.Timeout | null = null;
    let violationTracker = { noFaceCount: 0, multipleFacesCount: 0, faceTooFarCount: 0, totalSnapshots: 0, lastEventTime: Date.now() };

    const captureAndUploadSnapshot = async () => {
      if (!webcamRef.current || !webcamRef.current.srcObject) return;
      
      try {
        const video = webcamRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Run face detection
        let faceDetectionResult = null;
        try {
          const { detectFaces, updateViolationTracker } = await import('@/lib/faceDetection');
          faceDetectionResult = await detectFaces(video, canvas);
          violationTracker = updateViolationTracker(violationTracker, faceDetectionResult);
          
          // Show warning if face issues detected
          if (faceDetectionResult.eventType === 'no_face_detected') {
            console.log('⚠️ No face detected in webcam');
            if (violationTracker.noFaceCount >= 3) {
              setAntiCheatMessage(i18n.language === 'ar'
                ? 'تحذير: لم يتم الكشف عن وجهك. يرجى البقاء أمام الكاميرا.'
                : 'Warning: Your face is not detected. Please stay in front of the camera.');
              setShowAntiCheatWarning(true);
            }
          } else if (faceDetectionResult.eventType === 'multiple_faces') {
            console.log('🚨 Multiple faces detected!');
            setAntiCheatMessage(i18n.language === 'ar'
              ? 'تنبيه: تم اكتشاف أكثر من شخص. يجب أن تكون وحدك أثناء التقييم.'
              : 'Alert: Multiple people detected. You must be alone during the assessment.');
            setShowAntiCheatWarning(true);
          }
        } catch (faceErr) {
          console.warn('Face detection skipped:', faceErr);
        }
        
        // Log proctoring event with screenshot (upload to Cloudinary via backend)
        const { logProctoringEvent } = await import('@/lib/assessmentApiService');
        // If detection reported anything unusual, log raw model detections for debugging
        if (faceDetectionResult && faceDetectionResult.eventType !== 'face_detected') {
          console.debug('📋 Proctoring debug: faceDetectionResult rawDetections:', (faceDetectionResult as any).rawDetections);
        }

        // Create annotated debug screenshot when an anomaly is detected
        let debugDataUrl: string | undefined = undefined;
        if (faceDetectionResult && faceDetectionResult.eventType !== 'face_detected') {
          try {
            const debugCanvas = document.createElement('canvas');
            debugCanvas.width = canvas.width;
            debugCanvas.height = canvas.height;
            const debugCtx = debugCanvas.getContext('2d');
            if (debugCtx) {
              debugCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const boxes = (faceDetectionResult.faces && faceDetectionResult.faces.length) ?
                faceDetectionResult.faces.map((f: any) => ({ x: f.boundingBox.x, y: f.boundingBox.y, width: f.boundingBox.width, height: f.boundingBox.height, confidence: f.confidence })) : ((faceDetectionResult as any).rawDetections || []).map((d: any) => ({ x: d.box.xMin, y: d.box.yMin, width: d.box.width, height: d.box.height, confidence: d.score || null }));
              debugCtx.strokeStyle = 'red';
              debugCtx.lineWidth = Math.max(2, Math.round(canvas.width / 200));
              debugCtx.font = `${Math.max(10, Math.round(canvas.width / 60))}px Arial`;
              debugCtx.fillStyle = 'red';
              for (const b of boxes) {
                if (!b) continue;
                debugCtx.strokeRect(b.x, b.y, b.width, b.height);
                const text = b.confidence !== null && b.confidence !== undefined ? (Math.round(b.confidence * 100) + '%') : '';
                if (text) debugCtx.fillText(text, Math.max(0, b.x), Math.max(12, b.y - 4));
              }
              debugDataUrl = debugCanvas.toDataURL('image/jpeg', 0.75);
            }
          } catch (dbgErr) {
            console.warn('Failed to create debug annotated screenshot:', dbgErr);
          }
        }

        await logProctoringEvent({
          applicant_id: getApplicantId() ?? undefined,
          application_id: getApplicationId() ?? undefined,
          assessment_application_id: caseStudy?.id,
          session_id: caseStudy?.id ? getSessionId(caseStudy.id) : null,
          event_type: faceDetectionResult?.eventType || 'periodic_screenshot',
          event_data: { 
            timestamp: Date.now(),
            violations: violationTracker
          },
          screenshot_base64: dataUrl, // Send base64 for server-side Cloudinary upload
          debug_screenshot_base64: debugDataUrl, // Annotated debug screenshot when anomalies detected
          face_detection: faceDetectionResult ? {
            faceCount: faceDetectionResult.faceCount,
            faces: faceDetectionResult.faces,
            severity: faceDetectionResult.severity,
            eventType: faceDetectionResult.eventType,
            confidence: faceDetectionResult.confidence,
            message: faceDetectionResult.message,
            rawDetections: (faceDetectionResult as any).rawDetections || undefined
          } : undefined,
          severity: faceDetectionResult?.severity || 'low',
          client_timestamp: new Date().toISOString()
        });
        console.log(`📸 Snapshot captured (faces: ${faceDetectionResult?.faceCount ?? 'unknown'}, severity: ${faceDetectionResult?.severity || 'low'})`);
      } catch (err) {
        console.error('Failed to capture/upload screenshot:', err);
      }
    };

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'user' } 
        });
        setWebcamStream(stream);
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          // Ensure video plays
          webcamRef.current.play().catch(e => console.warn('Webcam autoplay blocked:', e));
        }

        // Start periodic screenshot capture (every 30 seconds by default, or use configured interval)
        const interval = (caseStudy?.antiCheatingSettings as any)?.webcam_snapshots_interval || 30;
        if (interval > 0) {
          // Capture first screenshot after 5 seconds (allow camera to stabilize)
          setTimeout(() => {
            captureAndUploadSnapshot();
          }, 5000);
          
          snapshotInterval = setInterval(() => {
            captureAndUploadSnapshot();
          }, interval * 1000);
          console.log(`🎥 Webcam proctoring started with ${interval}s snapshot interval`);
        }
      } catch (err) {
        console.error('Webcam access denied:', err);
        
        // Log webcam denial as a HIGH severity cheating event
        try {
          const { logProctoringEvent } = await import('@/lib/assessmentApiService');
          await logProctoringEvent({
            applicant_id: getApplicantId() ?? undefined,
            application_id: getApplicationId() ?? undefined,
            assessment_application_id: caseStudy?.id,
            session_id: caseStudy?.id ? getSessionId(caseStudy.id) : null,
            event_type: 'webcam_denied',
            event_data: { 
              timestamp: Date.now(),
              error: err instanceof Error ? err.message : 'Camera access denied',
              reason: 'Candidate denied or blocked webcam access when proctoring was required'
            },
            severity: 'critical',
            client_timestamp: new Date().toISOString()
          });
          console.log('🚨 Webcam denial logged as critical cheating event');
        } catch (logErr) {
          console.error('Failed to log webcam denial:', logErr);
        }
        
        setAntiCheatMessage(i18n.language === 'ar'
          ? '⚠️ تم رفض الوصول إلى الكاميرا. سيتم تسجيل هذا كمحاولة غش وسيؤثر على درجتك.'
          : '⚠️ Webcam access denied. This has been recorded as a cheating violation and will affect your score.');
        setShowAntiCheatWarning(true);
      }
    };
    startWebcam();

    return () => {
      if (snapshotInterval) {
        clearInterval(snapshotInterval);
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [caseStudy, submitted]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      // Cleanup video URLs
      Object.values(videoUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Fetch case study - either by jobId or caseStudyId
  useEffect(() => {
    const fetchCaseStudy = async () => {
      try {
        setLoading(true);
        
        let res;
        let data;
        
        let caseStudyData: CaseStudy;
        
        if (caseStudyId) {
          // Fetch by case study ID (for assessment case studies)
          console.log("🔍 Fetching assessment case study:", caseStudyId);
          res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/${caseStudyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("❌ Failed to fetch case study:", res.status, errorData);
            throw new Error(errorData.error || "Failed to fetch case study");
          }
          
          data = await res.json();
          console.log("✅ Case study response:", data);
          
          if (!data.caseStudy || !data.caseStudy.id) {
            console.error("❌ Invalid case study data:", data);
            throw new Error("Case study not found");
          }
          
          caseStudyData = data.caseStudy;
          console.log("✅ Setting case study:", caseStudyData.id, caseStudyData.title);
          console.log("🔒 Anti-cheating settings:", JSON.stringify(caseStudyData.antiCheatingSettings));
          setCaseStudy(caseStudyData);
        } else if (jobId) {
          // Fetch by job ID (for job-based case studies)
          res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/job/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!res.ok) throw new Error("Failed to fetch case study");
          
          data = await res.json();
          
          if (!Array.isArray(data.caseStudies) || data.caseStudies.length === 0) {
            throw new Error("No case study found for this job");
          }
          
          caseStudyData = data.caseStudies[0];
          
          if (!caseStudyData.id || !caseStudyData.title) {
            throw new Error("Case study has invalid data");
          }
          
          setCaseStudy(caseStudyData);
        } else {
          throw new Error("No job ID or case study ID provided");
        }
        
        const durationMinutes = caseStudyData.duration_minutes || 0;
        
        if (durationMinutes <= 0) {
          throw new Error("Case study has invalid or missing duration");
        }
        
        const savedTimerData = localStorage.getItem(storageKey);
        
        if (savedTimerData) {
          const { startTime: savedStart, duration } = JSON.parse(savedTimerData);
          const elapsed = Math.floor((Date.now() - savedStart) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          
          if (remaining <= 0) {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(answersKey);
            
            const now = Date.now();
            const duration = durationMinutes * 60;
            
            setStartTime(now);
            setTimeLeft(duration);
            
            localStorage.setItem(storageKey, JSON.stringify({
              startTime: now,
              duration: duration
            }));
            
            setAnswers(Array(caseStudyData.questions.length).fill({ type: 'text', content: '' }));
          } else {
            setStartTime(savedStart);
            setTimeLeft(remaining);
          }
        } else {
          const now = Date.now();
          const duration = durationMinutes * 60;
          
          setStartTime(now);
          setTimeLeft(duration);
          
          localStorage.setItem(storageKey, JSON.stringify({
            startTime: now,
            duration: duration
          }));
        }
        
        if (answers.length === 0) {
          const savedAnswers = localStorage.getItem(answersKey);
          if (!savedAnswers) {
            setAnswers(Array(caseStudyData.questions.length).fill({ type: 'text', content: '' }));
          }
        }
        
        // Start assessment session for proctoring/integrity tracking
        try {
          const { startSession } = await import('@/lib/assessmentApiService');
          const sessionResult = await startSession({
            applicant_id: getApplicantId() ?? undefined,
            application_id: getApplicationId() ?? undefined,
            assessment_application_id: caseStudyData.id,
            case_study_id: caseStudyData.id,
            questions_total: caseStudyData.questions?.length || 0,
            modules_total: (caseStudyData.customQuestions && caseStudyData.customQuestions.length) ? caseStudyData.customQuestions.length : 0,
            time_remaining: durationMinutes * 60
          });
          if (sessionResult.success) {
            console.log('✅ Assessment session started:', sessionResult.data?.sessionId);
            // Store session ID for later updates
            sessionStorage.setItem(`assessment_session_${caseStudyData.id}`, String(sessionResult.data?.sessionId));
          }
        } catch (sessionErr) {
          console.warn('⚠️ Could not start assessment session (may already exist):', sessionErr);
        }
        
      } catch (err: any) {
        console.error("❌ Error in fetchCaseStudy:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    
    if (token && (jobId || caseStudyId)) {
      fetchCaseStudy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, caseStudyId, token]);

  // ============================================
  // SECTION 1: Timer countdown with auto-submit
  // ============================================
  useEffect(() => {
    if (!startTime || submitted) return;
    
    const interval = setInterval(() => {
      const savedTimerData = localStorage.getItem(storageKey);
      if (!savedTimerData) return;
      
      const { startTime: savedStart, duration } = JSON.parse(savedTimerData);
      const elapsed = Math.floor((Date.now() - savedStart) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        console.log('⏰ Time expired - auto-submitting');
        // Get fresh answers from localStorage instead of stale state
        const savedAnswers = localStorage.getItem(answersKey);
        if (savedAnswers) {
          try {
            const currentAnswers = JSON.parse(savedAnswers);
            console.log('📝 Current answers from storage:', currentAnswers);
            submitAssessmentNow(currentAnswers);
          } catch (e) {
            console.error('Failed to parse saved answers:', e);
          }
        } else {
          console.warn('⚠️ No saved answers found');
          submitAssessmentNow(answers);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, submitted, storageKey, answersKey, answers]);

  const formatTime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = { type: 'text', content: value };
    setAnswers(updated);
    localStorage.setItem(answersKey, JSON.stringify(updated));
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, DOC, DOCX, and TXT files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadingIndex(index);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionIndex', index.toString());

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/upload-answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'File upload failed');
      }

      const { file_path, file_name, file_size } = await res.json();

      const updated = [...answers];
      updated[index] = {
        type: 'file',
        content: file_path,
        fileName: file_name,
        fileSize: file_size,
        uploadedAt: new Date().toISOString(),
      };
      setAnswers(updated);
      localStorage.setItem(answersKey, JSON.stringify(updated));
      setError('');
      
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...answers];
    updated[index] = { type: 'text', content: '' };
    setAnswers(updated);
    localStorage.setItem(answersKey, JSON.stringify(updated));
  };

  // ============================================
  // VIDEO RECORDING FUNCTIONS
  // ============================================
  const startVideoRecording = async (questionId: number, maxDuration?: number) => {
    try {
      // Request both video and audio with explicit constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;
      
      // Verify audio track is present
      const audioTracks = stream.getAudioTracks();
      console.log('🎤 Audio tracks:', audioTracks.length, audioTracks.map(t => t.label));
      if (audioTracks.length === 0) {
        console.warn('⚠️ No audio track found in stream');
      }
      
      // Connect video preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true; // Mute preview to avoid feedback
        // Use play() with catch for autoplay policy
        videoPreviewRef.current.play().catch(e => console.warn('Preview autoplay blocked:', e));
      }

      // Select the best supported codec for recording with audio
      let mimeType = 'video/webm';
      const codecOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus', 
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      for (const codec of codecOptions) {
        if (MediaRecorder.isTypeSupported(codec)) {
          mimeType = codec;
          console.log('📹 Using codec:', codec);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setVideoBlobs(prev => ({ ...prev, [questionId]: blob }));
        setVideoUrls(prev => ({ ...prev, [questionId]: url }));
        
        // Save video info to custom answers
        handleCustomAnswerChange(questionId, 'videoResponse', {
          type: 'video',
          blobUrl: url,
          duration: recordingTime,
          recordedAt: new Date().toISOString()
        });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingQuestionId(questionId);
      setIsRecording(true);
      setRecordingTime(0);

      // Auto-stop at max duration
      if (maxDuration) {
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            stopVideoRecording();
          }
        }, maxDuration * 1000);
      }

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(i18n.language === 'ar' 
        ? 'فشل في الوصول إلى الكاميرا. يرجى السماح بالوصول والمحاولة مرة أخرى.'
        : 'Failed to access camera. Please allow access and try again.');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingQuestionId(null);
  };

  const deleteVideoRecording = (questionId: number) => {
    if (videoUrls[questionId]) {
      URL.revokeObjectURL(videoUrls[questionId]);
    }
    setVideoBlobs(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
    setVideoUrls(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
    handleCustomAnswerChange(questionId, 'videoResponse', '');
  };

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // ============================================
  // CUSTOM QUESTION ANSWER HANDLERS
  // ============================================
  const customAnswersKey = `assessment_${identifier}_custom_answers`;

  // Load saved custom answers
  useEffect(() => {
    const savedCustomAnswers = localStorage.getItem(customAnswersKey);
    if (savedCustomAnswers) {
      try {
        const parsed = JSON.parse(savedCustomAnswers);
        if (Array.isArray(parsed)) {
          setCustomAnswers(parsed);
        }
      } catch (e) {
        console.error("Failed to load saved custom answers", e);
      }
    }
  }, [customAnswersKey]);

  // Initialize custom answers when case study loads
  useEffect(() => {
    if (caseStudy?.customQuestions && customAnswers.length === 0) {
      const savedCustomAnswers = localStorage.getItem(customAnswersKey);
      if (!savedCustomAnswers) {
        const initialAnswers = caseStudy.customQuestions.map(q => ({
          question_id: q.id,
          question_type: q.question_type,
          // MCQ and situational with options need array, others need string
          answer: (q.question_type === 'mcq' || 
                  ((q.question_type === 'situational' || q.question_type === 'situational_judgment' || q.question_type === 'situationalJudgment') && q.options && q.options.length > 0)) 
            ? [] : '',
          time_spent: 0,
        }));
        setCustomAnswers(initialAnswers);
      }
    }
  }, [caseStudy, customAnswersKey]);

  const handleCustomAnswerChange = (questionId: number, questionType: string, value: any) => {
    setCustomAnswers(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(a => a.question_id === questionId);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], answer: value };
      } else {
        updated.push({ question_id: questionId, question_type: questionType, answer: value });
      }
      localStorage.setItem(customAnswersKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleMCQSelect = (questionId: number, optionId: string, isMultiple: boolean) => {
    setCustomAnswers(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(a => a.question_id === questionId);
      if (idx >= 0) {
        const currentAnswer = updated[idx].answer || [];
        if (isMultiple) {
          // Multi-select: toggle option
          if (currentAnswer.includes(optionId)) {
            updated[idx].answer = currentAnswer.filter((id: string) => id !== optionId);
          } else {
            updated[idx].answer = [...currentAnswer, optionId];
          }
        } else {
          // Single select: replace
          updated[idx].answer = [optionId];
        }
      } else {
        updated.push({ question_id: questionId, question_type: 'mcq', answer: [optionId] });
      }
      localStorage.setItem(customAnswersKey, JSON.stringify(updated));
      return updated;
    });
  };

  const getCustomAnswer = (questionId: number): any => {
    const ans = customAnswers.find(a => a.question_id === questionId);
    return ans?.answer ?? '';
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      mcq: MessageSquare,
      open_ended: FileText,
      openEnded: FileText,
      video_response: Video,
      videoResponse: Video,
      coding: Code,
      codingChallenge: Code,
      sql: Database,
      sqlProblem: Database,
      excel: FileSpreadsheet,
      excelTask: FileSpreadsheet,
      writing: PenTool,
      writingExercise: PenTool,
      situational_judgment: Brain,
      situationalJudgment: Brain,
      situational: Brain,
    };
    return icons[type] || FileText;
  };

  const getQuestionTypeLabel = (type: string): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      mcq: { en: 'Multiple Choice', ar: 'اختيار من متعدد' },
      open_ended: { en: 'Open-Ended', ar: 'إجابة مفتوحة' },
      openEnded: { en: 'Open-Ended', ar: 'إجابة مفتوحة' },
      video_response: { en: 'Video Response', ar: 'استجابة فيديو' },
      videoResponse: { en: 'Video Response', ar: 'استجابة فيديو' },
      coding: { en: 'Coding Challenge', ar: 'تحدي برمجي' },
      codingChallenge: { en: 'Coding Challenge', ar: 'تحدي برمجي' },
      sql: { en: 'SQL Problem', ar: 'مسألة SQL' },
      sqlProblem: { en: 'SQL Problem', ar: 'مسألة SQL' },
      excel: { en: 'Excel Task', ar: 'مهمة إكسل' },
      excelTask: { en: 'Excel Task', ar: 'مهمة إكسل' },
      writing: { en: 'Writing Exercise', ar: 'تمرين كتابة' },
      writingExercise: { en: 'Writing Exercise', ar: 'تمرين كتابة' },
      situational_judgment: { en: 'Situational Judgment', ar: 'حكم موقفي' },
      situationalJudgment: { en: 'Situational Judgment', ar: 'حكم موقفي' },
      situational: { en: 'Situational Judgment', ar: 'حكم موقفي' },
    };
    const label = labels[type] || { en: type, ar: type };
    return i18n.language === 'ar' ? label.ar : label.en;
  };

  // ============================================
  // SECTION 2: Auto-submit function (for timeout)
  // ============================================
  const submitAssessmentNow = async (answersToSubmit: AnswerData[]) => {
    if (!caseStudy) return;

    try {
      setLoading(true);
      setError("");
      
      console.log('🚀 Submitting with answers:', answersToSubmit);
      console.log('🚀 Submitting with custom answers:', customAnswers);
      console.log('🎥 Video blobs to upload:', Object.keys(videoBlobs));
      
      // Upload video blobs first and get server URLs
      const updatedCustomAnswers = [...customAnswers];
      for (const [questionIdStr, blob] of Object.entries(videoBlobs)) {
        const questionId = parseInt(questionIdStr);
        console.log(`📤 Uploading video for question ${questionId}...`);
        
        try {
          const formData = new FormData();
          formData.append('video', blob, `video_q${questionId}_${Date.now()}.webm`);
          formData.append('question_id', questionIdStr);
          
          const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/upload-video`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            console.log(`✅ Video uploaded: ${uploadData.url}`);
            
            // Update the custom answer with the server URL
            const ansIdx = updatedCustomAnswers.findIndex(a => a.question_id === questionId);
            if (ansIdx >= 0) {
              updatedCustomAnswers[ansIdx] = {
                ...updatedCustomAnswers[ansIdx],
                answer: {
                  type: 'video',
                  url: uploadData.url,
                  duration: (updatedCustomAnswers[ansIdx].answer as any)?.duration || 0,
                  recordedAt: (updatedCustomAnswers[ansIdx].answer as any)?.recordedAt || new Date().toISOString()
                }
              };
            }
          } else {
            console.warn(`⚠️ Failed to upload video for Q${questionId}`);
          }
        } catch (uploadErr) {
          console.warn(`⚠️ Error uploading video for Q${questionId}:`, uploadErr);
        }
      }
      
      console.log('🚀 Final custom answers with video URLs:', updatedCustomAnswers);
      
      // Prepare anti-cheating violation data
      const antiCheatData = {
        tab_switches: tabSwitchCount,
        fullscreen_maintained: isFullscreen || !caseStudy.antiCheatingSettings?.fullscreen_required,
        webcam_active: !!webcamStream || !caseStudy.antiCheatingSettings?.webcam_required,
        violations_detected: tabSwitchCount > 0 || (!isFullscreen && caseStudy.antiCheatingSettings?.fullscreen_required),
      };
      
      console.log('🛡️ Anti-cheating data:', antiCheatData);
      
      const assessmentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobId || null, // Can be null for assessment case studies
          case_study_id: caseStudy.id,
          answers: answersToSubmit,
          custom_answers: updatedCustomAnswers, // Use updated answers with video URLs
          anti_cheat_data: antiCheatData, // Include anti-cheating violation data
        }),
      });
      
      const assessmentData = await assessmentRes.json();
      
      if (!assessmentRes.ok) {
        throw new Error(assessmentData.error || "Failed to submit assessment");
      }
      
      console.log("✅ Assessment submitted successfully");
      console.log("📋 Submission ID:", assessmentData.submission_id);
      
      const submissionId = assessmentData.submission_id;

      console.log("🤖 Auto-generating assessment result...");
      
      try {
        const generateRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/assessments/generate-result/${submissionId}`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const generateData = await generateRes.json();

        if (!generateRes.ok) {
          console.warn("⚠️ Failed to auto-generate result:", generateData.error || "Unknown error");
          console.log("ℹ️ Result will be generated by recruiter manually");
        } else {
          console.log("✅ Assessment result generated automatically", {
            score: generateData.evaluation?.score,
            rating: generateData.evaluation?.rating,
            recommendation: generateData.evaluation?.final_recommendation
          });
        }
      } catch (generateErr) {
        console.warn("⚠️ Error during auto-generation:", generateErr);
        console.log("ℹ️ Continuing with submission - result can be generated later");
      }

      const sessionData = sessionStorage.getItem('case_study_session');
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          
          const completionRes = await fetch(`${import.meta.env.VITE_API_URL}/api/case-study-invitations/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              case_study_id: session.case_study_id,
              job_id: session.job_id || null, // Can be null for assessment case studies
              answers: answersToSubmit
            }),
          });
          
          const completionData = await completionRes.json();
          
          if (completionRes.ok && completionData.success) {
            console.log("✅ Case study invitation marked as completed");
            sessionStorage.removeItem('case_study_session');
          } else {
            console.warn("⚠️ Failed to mark case study as completed:", completionData.error);
          }
          
        } catch (sessionErr) {
          console.warn("⚠️ Error processing case study completion:", sessionErr);
        }
      }
      
      setSubmitted(true);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(answersKey);
      localStorage.removeItem(customAnswersKey);
      
      // Exit fullscreen and cleanup
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      
      console.log("✅ Submission complete");
      
    } catch (err: any) {
      console.error("❌ Submission error:", err);
      setError(err.message || "Failed to submit assessment");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SECTION 3: Manual submit function (button click)
  // ============================================
  // Helpers to detect emptiness of answers/customAnswers
  const isTextAnswerEmpty = (ans: AnswerData | undefined) => {
    if (!ans) return true;
    if (ans.type === 'text') {
      const s = String(ans.content || '').trim();
      if (!s) return true;
      const low = s.toLowerCase();
      return low === 'na' || low === 'n/a';
    }
    if (ans.type === 'file') {
      return !(ans.content && String(ans.content).trim().length > 0);
    }
    return true;
  };

  const isCustomAnswerEmpty = (c: CustomQuestionAnswer | undefined) => {
    if (!c) return true;
    const a = c.answer;
    if (a === undefined || a === null) return true;
    if (typeof a === 'string') {
      const s = a.trim();
      if (!s) return true;
      const low = s.toLowerCase();
      return low === 'na' || low === 'n/a';
    }
    if (Array.isArray(a)) return a.length === 0;
    if (typeof a === 'object') {
      // Treat non-empty objects (e.g., { url }, { type: 'video', blobUrl }) as answered
      return Object.keys(a).length === 0;
    }
    return false;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!caseStudy) return;

    if (!autoSubmit) {
      const qCount = caseStudy.questions?.length || 0;
      const mCount = caseStudy.customQuestions?.length || 0;
      const totalItems = qCount + mCount;

      // If there are no answerable items, allow submission (nothing to fill)
      if (totalItems === 0) {
        await submitAssessmentNow(answers);
        return;
      }

      // Count answered items across both legacy questions and custom modules
      const answeredTextCount = (answers || []).filter(a => !isTextAnswerEmpty(a)).length;
      const answeredCustomCount = (customAnswers || []).filter(ca => !isCustomAnswerEmpty(ca)).length;

      if (answeredTextCount + answeredCustomCount === 0) {
        setError('Please provide answers to at least some questions before submitting.');
        return;
      }

      const emptyCount = totalItems - (answeredTextCount + answeredCustomCount);
      if (emptyCount > 0) {
        const confirmed = window.confirm(
          `You have ${emptyCount} unanswered item(s). This will significantly affect your score. Do you want to submit anyway?`
        );
        if (!confirmed) return;
      }
    }

    await submitAssessmentNow(answers);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );

  if (error && !caseStudy) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-red-500 text-lg">{error}</div>
    </div>
  );

  if (!caseStudy) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-red-500 text-lg">No case study found</div>
    </div>
  );

  // Check if anti-cheating is enabled and show pre-start screen
  const hasAntiCheating = caseStudy?.antiCheatingSettings && (
    caseStudy.antiCheatingSettings.fullscreen_required ||
    caseStudy.antiCheatingSettings.tab_switch_detection ||
    caseStudy.antiCheatingSettings.copy_paste_disabled ||
    caseStudy.antiCheatingSettings.webcam_required
  );

  // Pre-start screen for anti-cheating acknowledgment
  if (hasAntiCheating && !antiCheatReady && !submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#e1e4e8' }}>
        <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-merit-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-merit-dark" />
            </div>
            <h2 className="text-2xl font-bold text-merit-dark">
              {i18n.language === 'ar' ? 'إعدادات أمان التقييم' : 'Assessment Security Settings'}
            </h2>
            <p className="text-gray-600 mt-2">
              {i18n.language === 'ar' 
                ? 'يحتوي هذا التقييم على إجراءات مكافحة الغش. يرجى قراءتها قبل المتابعة.'
                : 'This assessment has anti-cheating measures enabled. Please review before proceeding.'}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {caseStudy.antiCheatingSettings?.fullscreen_required && (
              <div className="flex items-center gap-3 p-3 bg-merit-green/10 rounded-lg border border-merit-green/20">
                <div className="w-8 h-8 bg-merit-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-merit-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {i18n.language === 'ar' ? 'وضع ملء الشاشة مطلوب' : 'Fullscreen Mode Required'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {i18n.language === 'ar' 
                      ? 'ستحتاج إلى البقاء في وضع ملء الشاشة طوال التقييم'
                      : 'You will need to stay in fullscreen mode throughout the assessment'}
                  </p>
                </div>
              </div>
            )}

            {caseStudy.antiCheatingSettings?.tab_switch_detection && (
              <div className="flex items-center gap-3 p-3 bg-merit-green/10 rounded-lg border border-merit-green/20">
                <div className="w-8 h-8 bg-merit-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-merit-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {i18n.language === 'ar' ? 'مراقبة تبديل التبويبات' : 'Tab Switch Monitoring'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {i18n.language === 'ar' 
                      ? `سيتم تسجيل أي محاولة لتبديل التبويب (الحد الأقصى: ${caseStudy.antiCheatingSettings.tab_switch_limit || 3})`
                      : `Any tab switching will be recorded (Limit: ${caseStudy.antiCheatingSettings.tab_switch_limit || 3})`}
                  </p>
                </div>
              </div>
            )}

            {caseStudy.antiCheatingSettings?.copy_paste_disabled && (
              <div className="flex items-center gap-3 p-3 bg-merit-green/10 rounded-lg border border-merit-green/20">
                <div className="w-8 h-8 bg-merit-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-merit-dark" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {i18n.language === 'ar' ? 'النسخ واللصق معطل' : 'Copy & Paste Disabled'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {i18n.language === 'ar' 
                      ? 'لن تتمكن من نسخ أو لصق أي محتوى أثناء التقييم'
                      : 'You will not be able to copy or paste any content during the assessment'}
                  </p>
                </div>
              </div>
            )}

            {caseStudy.antiCheatingSettings?.webcam_required && (
              <div className="flex items-center gap-3 p-3 bg-merit-green/10 rounded-lg border border-merit-green/20">
                <div className="w-8 h-8 bg-merit-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-merit-dark" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {i18n.language === 'ar' ? 'مراقبة الكاميرا' : 'Webcam Monitoring'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {i18n.language === 'ar' 
                      ? 'ستحتاج إلى السماح بالوصول إلى الكاميرا. سيتم أخذ لقطات دورية.'
                      : 'You will need to allow webcam access. Periodic snapshots will be taken.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              {i18n.language === 'ar' 
                ? '⚠️ بالنقر على "أنا موافق"، فإنك توافق على هذه الإجراءات الأمنية. سيتم تسجيل أي انتهاكات وقد تؤثر على نتائجك.'
                : '⚠️ By clicking "I Agree", you consent to these security measures. Any violations will be recorded and may affect your results.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1"
            >
              {i18n.language === 'ar' ? 'العودة' : 'Go Back'}
            </Button>
            <Button
              onClick={() => setAntiCheatReady(true)}
              className="flex-1 bg-merit-green text-merit-dark hover:bg-merit-green/90"
            >
              {i18n.language === 'ar' ? 'أنا موافق - ابدأ التقييم' : 'I Agree - Start Assessment'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#e1e4e8' }}>
      <ApplicantSidebar activeItem="current-case" />

      <div className="flex-1 p-8 max-w-[1200px]">
        {/* Anti-Cheating Warning Modal */}
        {showAntiCheatWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-merit-dark" />
                <h3 className="text-lg font-bold text-gray-900">
                  {i18n.language === 'ar' ? 'تحذير' : 'Warning'}
                </h3>
              </div>
              <p className="text-gray-700 mb-6">{antiCheatMessage}</p>
              <div className="flex gap-3">
                {caseStudy?.antiCheatingSettings?.fullscreen_required && !isFullscreen && (
                  <Button
                    onClick={async () => {
                      try {
                        await document.documentElement.requestFullscreen();
                        setShowAntiCheatWarning(false);
                      } catch (err) {
                        console.error('Fullscreen failed:', err);
                      }
                    }}
                    className="bg-merit-green hover:bg-merit-green/90 text-merit-dark"
                  >
                    {i18n.language === 'ar' ? 'تفعيل ملء الشاشة' : 'Enable Fullscreen'}
                  </Button>
                )}
                <Button
                  onClick={() => setShowAntiCheatWarning(false)}
                  variant="outline"
                >
                  {i18n.language === 'ar' ? 'فهمت' : 'I Understand'}
                </Button>
              </div>
              {tabSwitchCount > 0 && (
                <p className="text-xs text-merit-dark mt-4">
                  {i18n.language === 'ar' 
                    ? `تم تسجيل ${tabSwitchCount} حالة تبديل تبويب`
                    : `${tabSwitchCount} tab switch${tabSwitchCount > 1 ? 'es' : ''} recorded`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Webcam Monitor (floating) */}
        {caseStudy?.antiCheatingSettings?.webcam_required && webcamStream && !submitted && (
          <div className="fixed bottom-4 right-4 z-40">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
              <video
                ref={(el) => {
                  webcamRef.current = el;
                  // Attach stream when element is mounted
                  if (el && webcamStream && !el.srcObject) {
                    el.srcObject = webcamStream;
                    el.play().catch(e => console.warn('Webcam autoplay blocked:', e));
                  }
                }}
                autoPlay
                muted
                playsInline
                className="w-32 h-24 object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            </div>
          </div>
        )}

        {/* Anti-Cheat Status Bar */}
        {caseStudy?.antiCheatingSettings && !submitted && (
          <div className="fixed top-0 left-0 right-0 bg-merit-dark text-white px-4 py-2 flex items-center justify-center gap-6 text-xs z-30">
            {caseStudy.antiCheatingSettings.fullscreen_required && (
              <span className={`flex items-center gap-1 ${isFullscreen ? 'text-merit-green' : 'text-red-400'}`}>
                {isFullscreen ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {i18n.language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}
              </span>
            )}
            {caseStudy.antiCheatingSettings.tab_switch_detection && (
              <span className={`flex items-center gap-1 ${tabSwitchCount === 0 ? 'text-merit-green' : 'text-red-400'}`}>
                <AlertTriangle className="w-3 h-3" />
                {i18n.language === 'ar' ? `تبديل التبويب: ${tabSwitchCount}` : `Tab switches: ${tabSwitchCount}`}
              </span>
            )}
            {caseStudy.antiCheatingSettings.copy_paste_disabled && (
              <span className="text-merit-green flex items-center gap-1">
                <X className="w-3 h-3" />
                {i18n.language === 'ar' ? 'النسخ/اللصق معطل' : 'Copy/Paste disabled'}
              </span>
            )}
            {caseStudy.antiCheatingSettings.webcam_required && (
              <span className={`flex items-center gap-1 ${webcamStream ? 'text-merit-green' : 'text-red-400'}`}>
                <Camera className="w-3 h-3" />
                {i18n.language === 'ar' ? 'الكاميرا' : 'Webcam'}
              </span>
            )}
          </div>
        )}

        {!submitted ? (
          <>
            <header className={`bg-white border-b border-gray-200 px-6 py-4 mb-8 flex items-center justify-between rounded-lg ${caseStudy?.antiCheatingSettings ? 'mt-10' : ''}`}>
              <div>
                <h1 className="text-3xl font-bold">{caseStudy.title}</h1>
                {timeLeft < 300 && timeLeft > 0 && (
                  <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Less than 5 minutes remaining!
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Bell className={`w-6 h-6 ${timeLeft < 300 ? 'text-red-500' : 'text-gray-600'}`} />
                <span className={`font-bold text-lg ${timeLeft < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </header>

            <section className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Background Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Background</h2>
                <div className="text-gray-700 leading-relaxed space-y-3 whitespace-pre-wrap break-words">
                  {caseStudy.description}
                </div>
              </div>

              {/* Scenario Section */}
              {caseStudy.instructions && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Scenario</h2>
                  <div className="text-gray-700 leading-relaxed space-y-3 whitespace-pre-wrap break-words">
                    {caseStudy.instructions}
                  </div>
                </div>
              )}

              {/* Tables Section */}
              {caseStudy.tables && caseStudy.tables.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Tables</h2>
                  <div className="space-y-6">
                    {caseStudy.tables.map((table, tableIdx) => (
                      <div key={tableIdx} className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {table.title || `Table ${tableIdx + 1}`}
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-300">
                                {table.columns && table.columns.map((col, colIdx) => (
                                  <th
                                    key={colIdx}
                                    className="px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-300 last:border-r-0"
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>

                            <tbody>
                              {table.rows && table.rows.length > 0 ? (
                                table.rows.map((row, rowIdx) => (
                                  <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                                    {table.columns && table.columns.map((col, colIdx) => (
                                      <td
                                        key={colIdx}
                                        className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0"
                                      >
                                        {row[col.key] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={table.columns?.length || 1}
                                    className="px-4 py-6 text-center text-gray-500"
                                  >
                                    No data
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions Section */}
              {caseStudy.customQuestions && caseStudy.customQuestions.length > 0 ? (
                <div className="rounded-xl border-2 border-gray-200 p-4 bg-gray-50">
                  <p className="text-sm text-gray-700">
                    {i18n.language === 'ar'
                      ? 'توجد وحدات تقييم متقدمة لهذا الاختبار — تم عرضها أدناه. وحدات التقييم هي المصدر الرئيسي للأسئلة والنتائج الآن.'
                      : 'This assessment includes advanced modules below. Modules are the primary source of items and results now.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                  {caseStudy.questions.map((q, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                      <label className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">
                        {i + 1}. {q}
                      </label>

                      {answers[i]?.type === 'text' ? (
                        <>
                          <textarea
                            value={answers[i]?.content || ''}
                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            disabled={timeLeft <= 0}
                            placeholder="Type your answer here or upload a document..."
                          />
                          <p className="text-xs text-gray-500">
                            {answers[i]?.content?.length || 0} characters • 💾 Auto-saved
                          </p>
                        </>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-800">{answers[i]?.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  {answers[i]?.fileSize ? `${(answers[i].fileSize / 1024).toFixed(2)} KB` : ''} • 
                                  Uploaded {answers[i]?.uploadedAt ? new Date(answers[i].uploadedAt).toLocaleDateString() : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(i)}
                              disabled={timeLeft <= 0}
                              className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(i, e.target.files[0]);
                              }
                            }}
                            disabled={timeLeft <= 0 || uploadingIndex === i}
                            className="hidden"
                          />
                          <Upload className="w-4 h-4" />
                          <span className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50">
                            {uploadingIndex === i ? 'Uploading...' : 'Upload Document'}
                          </span>
                        </label>
                        {answers[i]?.type === 'file' && (
                          <button
                            onClick={() => handleAnswerChange(i, '')}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Or type text answer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ============================================ */}
              {/* CUSTOM QUESTIONS SECTION (Assessment Modules) */}
              {/* ============================================ */}
              {caseStudy.customQuestions && caseStudy.customQuestions.length > 0 && (
                <div className="space-y-8 border-t border-gray-200 pt-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    {i18n.language === 'ar' ? 'وحدات التقييم' : 'Assessment Modules'}
                  </h2>

                  {/* Group by type */}
                  {(() => {
                    const questionsByType = caseStudy.customQuestions.reduce((acc: Record<string, CustomQuestion[]>, q) => {
                      const type = q.question_type || 'other';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(q);
                      return acc;
                    }, {});

                    return Object.entries(questionsByType).map(([type, questions]) => {
                      const IconComponent = getQuestionTypeIcon(type);
                      const typeLabel = getQuestionTypeLabel(type);

                      return (
                        <div key={type} className="bg-gray-50 rounded-xl p-6 space-y-6">
                          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                            <IconComponent className="w-5 h-5 text-purple-600" />
                            <h3 className="font-bold text-lg text-gray-800">{typeLabel}</h3>
                            <span className="text-sm text-gray-500">({questions.length} {i18n.language === 'ar' ? 'سؤال' : 'questions'})</span>
                          </div>

                          {questions.map((q, qIdx) => (
                            <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
                              {/* Question Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                                    {qIdx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                      {i18n.language === 'ar' && q.question_text_ar ? q.question_text_ar : q.question_text}
                                    </p>
                                    {q.time_limit && (
                                      <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {q.time_limit} {i18n.language === 'ar' ? 'دقيقة' : 'min'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {q.weight !== undefined && q.weight !== null && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {q.weight}%
                                  </span>
                                )}
                              </div>

                              {/* MCQ Answer UI */}
                              {type === 'mcq' && q.options && (
                                <div className="space-y-2 mt-4">
                                  {q.options.map((opt, optIdx) => {
                                    const selectedAnswers = getCustomAnswer(q.id) || [];
                                    const isSelected = Array.isArray(selectedAnswers) && selectedAnswers.includes(opt.id);
                                    const optionText = i18n.language === 'ar' && opt.text_ar ? opt.text_ar : opt.text_en;
                                    
                                    return (
                                      <button
                                        key={opt.id}
                                        onClick={() => handleMCQSelect(q.id, opt.id, false)}
                                        disabled={timeLeft <= 0}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                          isSelected 
                                            ? 'border-purple-500 bg-purple-50' 
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                        } disabled:opacity-50`}
                                      >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                          isSelected ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="flex-1 text-gray-700">{optionText}</span>
                                        {isSelected && <Check className="w-5 h-5 text-purple-500" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Open-Ended / Writing Exercise Answer UI */}
                              {(type === 'openEnded' || type === 'open_ended' || type === 'writingExercise' || type === 'writing') && (
                                <div className="space-y-2 mt-4">
                                  <textarea
                                    value={getCustomAnswer(q.id) || ''}
                                    onChange={(e) => handleCustomAnswerChange(q.id, type, e.target.value)}
                                    disabled={timeLeft <= 0}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[150px]"
                                    placeholder={i18n.language === 'ar' ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{(getCustomAnswer(q.id) || '').length} {i18n.language === 'ar' ? 'حرف' : 'characters'}</span>
                                    {q.min_word_count && q.max_word_count && (
                                      <span>{q.min_word_count}-{q.max_word_count} {i18n.language === 'ar' ? 'كلمة مطلوبة' : 'words required'}</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Coding Challenge Answer UI */}
                              {(type === 'codingChallenge' || type === 'coding') && (
                                <div className="space-y-3 mt-4">
                                  {q.starter_code && (
                                    <div className="bg-gray-800 text-green-400 p-3 rounded-lg text-xs font-mono">
                                      <p className="text-gray-500 mb-2">{i18n.language === 'ar' ? 'الكود المبدئي:' : 'Starter Code:'}</p>
                                      <pre>{typeof q.starter_code === 'object' ? JSON.stringify(q.starter_code, null, 2) : q.starter_code}</pre>
                                    </div>
                                  )}
                                  <textarea
                                    value={getCustomAnswer(q.id) || (typeof q.starter_code === 'string' ? q.starter_code : '')}
                                    onChange={(e) => handleCustomAnswerChange(q.id, type, e.target.value)}
                                    disabled={timeLeft <= 0}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm min-h-[200px] bg-gray-900 text-green-400"
                                    placeholder={i18n.language === 'ar' ? 'اكتب الكود هنا...' : 'Write your code here...'}
                                  />
                                  {q.test_cases && q.test_cases.filter((tc: any) => !tc.hidden).length > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <p className="text-xs font-bold text-blue-700 mb-2">{i18n.language === 'ar' ? 'حالات الاختبار:' : 'Test Cases:'}</p>
                                      <div className="space-y-1 text-xs font-mono">
                                        {q.test_cases.filter((tc: any) => !tc.hidden).slice(0, 3).map((tc: any, tcIdx: number) => (
                                          <div key={tcIdx} className="bg-white p-2 rounded border">
                                            <span className="text-blue-600">Input:</span> {JSON.stringify(tc.input)} → 
                                            <span className="text-green-600 ml-2">Expected:</span> {JSON.stringify(tc.expected_output ?? tc.expected)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* SQL Problem Answer UI */}
                              {(type === 'sqlProblem' || type === 'sql') && (
                                <div className="space-y-3 mt-4">
                                  <textarea
                                    value={getCustomAnswer(q.id) || ''}
                                    onChange={(e) => handleCustomAnswerChange(q.id, type, e.target.value)}
                                    disabled={timeLeft <= 0}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm min-h-[150px] bg-gray-900 text-yellow-400"
                                    placeholder={i18n.language === 'ar' ? 'اكتب استعلام SQL هنا...' : 'Write your SQL query here...'}
                                  />
                                </div>
                              )}

                              {/* Video Response UI */}
                              {(type === 'videoResponse' || type === 'video_response') && (
                                <div className="space-y-4 mt-4">
                                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-5">
                                    {/* Video Preview / Recording Area */}
                                    <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                                      {videoUrls[q.id] && !isRecording ? (
                                        // Playback recorded video
                                        <video 
                                          src={videoUrls[q.id]} 
                                          controls 
                                          className="w-full h-full object-cover"
                                        />
                                      ) : recordingQuestionId === q.id ? (
                                        // Live recording preview
                                        <>
                                          <video 
                                            ref={(el) => {
                                              videoPreviewRef.current = el;
                                              // Attach stream when element is mounted
                                              if (el && streamRef.current && !el.srcObject) {
                                                el.srcObject = streamRef.current;
                                                el.play().catch(e => console.warn('Preview autoplay blocked:', e));
                                              }
                                            }}
                                            autoPlay 
                                            muted 
                                            playsInline
                                            className="w-full h-full object-cover mirror"
                                            style={{ transform: 'scaleX(-1)' }}
                                          />
                                          {/* Recording indicator */}
                                          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                                            <span className="w-3 h-3 bg-white rounded-full animate-ping" />
                                            REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                          </div>
                                          {q.max_video_duration && (
                                            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-xs">
                                              Max: {q.max_video_duration}s
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        // Placeholder
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                          <Camera className="w-16 h-16 mb-3" />
                                          <p className="text-sm">{i18n.language === 'ar' ? 'اضغط للتسجيل' : 'Click to start recording'}</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Duration Info */}
                                    {q.min_video_duration && q.max_video_duration && (
                                      <p className="text-xs text-pink-600 text-center mb-3">
                                        {i18n.language === 'ar' ? 'المدة المطلوبة:' : 'Required duration:'} {q.min_video_duration}s - {q.max_video_duration}s
                                      </p>
                                    )}

                                    {/* Recording Controls */}
                                    <div className="flex items-center justify-center gap-3">
                                      {!isRecording && !videoUrls[q.id] && (
                                        <Button
                                          onClick={() => startVideoRecording(q.id, q.max_video_duration)}
                                          disabled={timeLeft <= 0 || (recordingQuestionId !== null && recordingQuestionId !== q.id)}
                                          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full flex items-center gap-2"
                                        >
                                          <Camera className="w-5 h-5" />
                                          {i18n.language === 'ar' ? 'بدء التسجيل' : 'Start Recording'}
                                        </Button>
                                      )}

                                      {isRecording && recordingQuestionId === q.id && (
                                        <Button
                                          onClick={stopVideoRecording}
                                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full flex items-center gap-2 animate-pulse"
                                        >
                                          <Square className="w-5 h-5" />
                                          {i18n.language === 'ar' ? 'إيقاف التسجيل' : 'Stop Recording'}
                                        </Button>
                                      )}

                                      {videoUrls[q.id] && !isRecording && (
                                        <>
                                          <span className="text-sm text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            {i18n.language === 'ar' ? 'تم التسجيل' : 'Recorded'}
                                          </span>
                                          <Button
                                            onClick={() => deleteVideoRecording(q.id)}
                                            disabled={timeLeft <= 0}
                                            variant="outline"
                                            className="text-red-500 border-red-300 hover:bg-red-50 px-4 py-2 rounded-full flex items-center gap-2"
                                          >
                                            <X className="w-4 h-4" />
                                            {i18n.language === 'ar' ? 'إعادة التسجيل' : 'Re-record'}
                                          </Button>
                                        </>
                                      )}
                                    </div>

                                    {/* Fallback text input */}
                                    {!videoUrls[q.id] && !isRecording && (
                                      <div className="mt-4 pt-4 border-t border-pink-200">
                                        <p className="text-xs text-gray-500 mb-2 text-center">
                                          {i18n.language === 'ar' 
                                            ? 'أو اكتب إجابتك نصياً إذا لم يعمل التسجيل'
                                            : 'Or type your response if recording doesn\'t work'}
                                        </p>
                                        <textarea
                                          value={typeof getCustomAnswer(q.id) === 'string' ? getCustomAnswer(q.id) : ''}
                                          onChange={(e) => handleCustomAnswerChange(q.id, type, e.target.value)}
                                          disabled={timeLeft <= 0}
                                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                                          rows={3}
                                          placeholder={i18n.language === 'ar' ? 'اكتب إجابتك هنا...' : 'Type your response here...'}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Excel Task UI */}
                              {(type === 'excelTask' || type === 'excel') && (
                                <div className="space-y-3 mt-4">
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
                                    <p className="text-sm text-gray-600 mb-3">
                                      {i18n.language === 'ar'
                                        ? 'صف الصيغ والخطوات التي ستستخدمها'
                                        : 'Describe the formulas and steps you would use'}
                                    </p>
                                  </div>
                                  <textarea
                                    value={getCustomAnswer(q.id) || ''}
                                    onChange={(e) => handleCustomAnswerChange(q.id, type, e.target.value)}
                                    disabled={timeLeft <= 0}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[150px]"
                                    placeholder={i18n.language === 'ar' 
                                      ? 'مثال: =VLOOKUP(A2, Sheet2!A:B, 2, FALSE) للبحث عن...'
                                      : 'Example: =VLOOKUP(A2, Sheet2!A:B, 2, FALSE) to lookup...'}
                                  />
                                </div>
                              )}

                              {/* Situational Judgment UI */}
                              {(type === 'situationalJudgment' || type === 'situational_judgment' || type === 'situational') && (
                                <div className="space-y-3 mt-4">
                                  {q.options && q.options.length > 0 ? (
                                    // Options-based ranking UI
                                    <>
                                      <p className="text-sm text-gray-600 mb-2">
                                        {i18n.language === 'ar' 
                                          ? 'اختر الإجراء الأكثر ملاءمة:'
                                          : 'Select the most appropriate action:'}
                                      </p>
                                      {q.options.map((opt, optIdx) => {
                                        const selectedAnswers = getCustomAnswer(q.id) || [];
                                        const isSelected = Array.isArray(selectedAnswers) && selectedAnswers.includes(opt.id);
                                        const optionText = i18n.language === 'ar' && opt.text_ar ? opt.text_ar : opt.text_en;
                                        
                                        return (
                                          <button
                                            key={opt.id}
                                            onClick={() => handleMCQSelect(q.id, opt.id, true)}
                                            disabled={timeLeft <= 0}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                              isSelected 
                                                ? 'border-merit-green bg-merit-green/10' 
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                            } disabled:opacity-50`}
                                          >
                                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                              isSelected ? 'bg-merit-green text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                              {isSelected ? selectedAnswers.indexOf(opt.id) + 1 : String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <span className="flex-1 text-gray-700">{optionText}</span>
                                            {isSelected && <Check className="w-5 h-5 text-merit-green" />}
                                          </button>
                                        );
                                      })}
                                    </>
                                  ) : (
                                    // Text-based response UI (fallback when no options)
                                    <>
                                      <div className="bg-merit-green/10 border border-merit-green/30 rounded-lg p-4">
                                        <Brain className="w-8 h-8 text-merit-dark mb-2" />
                                        <p className="text-sm text-gray-600 mb-2">
                                          {i18n.language === 'ar'
                                            ? 'اشرح كيف ستتعامل مع هذا الموقف والإجراءات التي ستتخذها.'
                                            : 'Explain how you would handle this situation and the actions you would take.'}
                                        </p>
                                      </div>
                                      <textarea
                                        value={getCustomAnswer(q.id) || ''}
                                        onChange={(e) => handleCustomAnswerChange(q.id, type, e.target.value)}
                                        disabled={timeLeft <= 0}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-merit-green focus:border-transparent min-h-[150px]"
                                        placeholder={i18n.language === 'ar' 
                                          ? 'صف نهجك في التعامل مع هذا الموقف...'
                                          : 'Describe your approach to handling this situation...'}
                                      />
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>{(getCustomAnswer(q.id) || '').length} {i18n.language === 'ar' ? 'حرف' : 'characters'}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              <Button
                onClick={() => handleSubmit(false)}
                disabled={timeLeft <= 0 || loading}
                className="bg-green-500 text-white hover:bg-green-600 px-8 py-3 rounded-lg text-lg font-semibold disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Assessment"}
              </Button>

              {timeLeft <= 0 && (
                <p className="text-red-500 font-semibold">Time's up! Your assessment has been automatically submitted.</p>
              )}
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-2xl p-12">
            <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Assessment Submitted Successfully!</h2>
            <p className="text-gray-600 text-lg text-center mb-8 max-w-md">
              Thank you for completing the case study. The recruiter will review your submission and provide feedback soon.
            </p>
            <Button
              onClick={() => navigate('/applicant-dashboard')}
              className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-3 rounded-lg"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}