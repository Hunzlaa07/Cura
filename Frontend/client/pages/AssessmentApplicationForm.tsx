import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Mail, User, Lock, Loader2, CheckCircle, ArrowRight, ClipboardCheck } from "lucide-react";

export default function AssessmentApplicationForm() {
  const { shareLink } = useParams<{ shareLink: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();

  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);

  useEffect(() => {
    fetchAssessment();
  }, [shareLink]);

  const fetchAssessment = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-studies/assessments/share/${shareLink}`);
      if (!res.ok) throw new Error("Assessment not found");
      const data = await res.json();
      setAssessment(data.assessment);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: err.message || (i18n.language === 'ar' ? "التقييم غير موجود" : "Assessment not found"),
      });
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !name.trim()) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "يرجى إدخال البريد الإلكتروني والاسم" : "Please enter email and name",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-study-assessments/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          share_link: shareLink,
          email: email.trim(),
          full_name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setStep("otp");
      toast({
        title: i18n.language === 'ar' ? "تم الإرسال" : "OTP Sent",
        description: i18n.language === 'ar' 
          ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
          : "Verification code sent to your email",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: err.message || (i18n.language === 'ar' ? "فشل إرسال رمز التحقق" : "Failed to send OTP"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: i18n.language === 'ar' ? "يرجى إدخال رمز التحقق المكون من 6 أرقام" : "Please enter a 6-digit verification code",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/case-study-assessments/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          share_link: shareLink,
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      setStep("success");
      toast({
        title: i18n.language === 'ar' ? "تم التحقق" : "Verified",
        description: i18n.language === 'ar' 
          ? "تم التحقق بنجاح. تم إرسال دعوة دراسة الحالة إلى بريدك الإلكتروني"
          : "Verification successful. Case study invitation sent to your email",
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: i18n.language === 'ar' ? "خطأ" : "Error",
        description: err.message || (i18n.language === 'ar' ? "رمز التحقق غير صحيح" : "Invalid verification code"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#C8F55A] rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-merit-dark" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {i18n.language === 'ar' ? 'التقدم لتقييم دراسة الحالة' : 'Apply for Case Study Assessment'}
            </h1>
            {assessment && (
              <p className="text-sm text-gray-600">
                {i18n.language === 'ar' && assessment.case_study_title_ar
                  ? assessment.case_study_title_ar
                  : assessment.case_study_title || 'Case Study Assessment'}
              </p>
            )}
          </div>

          {/* Step 1: Email and Name */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  {i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all"
                  placeholder={i18n.language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all"
                  placeholder={i18n.language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-semibold py-3 rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {i18n.language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {i18n.language === 'ar' ? 'إرسال رمز التحقق' : 'Send Verification Code'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {i18n.language === 'ar' 
                    ? 'أدخل رمز التحقق المكون من 6 أرقام الذي تم إرساله إلى'
                    : 'Enter the 6-digit verification code sent to'}
                </p>
                <p className="font-semibold text-gray-900">{email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {i18n.language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:border-[#C8F55A] focus:ring-2 focus:ring-[#C8F55A]/20 focus:outline-none transition-all"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {i18n.language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
                  </>
                ) : (
                  <>
                    {i18n.language === 'ar' ? 'تحقق' : 'Verify'}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                {i18n.language === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change email address'}
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {i18n.language === 'ar' ? 'تم الإرسال بنجاح!' : 'Successfully Sent!'}
                </h2>
                <p className="text-sm text-gray-600">
                  {i18n.language === 'ar' 
                    ? 'تم إرسال دعوة دراسة الحالة إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.'
                    : 'Case study invitation has been sent to your email. Please check your inbox.'}
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-[#C8F55A] hover:bg-[#b4e24c] text-merit-dark font-semibold py-3 rounded-lg"
              >
                {i18n.language === 'ar' ? 'تسجيل الدخول' : 'Go to Login'}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          {i18n.language === 'ar' 
            ? 'بالنقر على "إرسال رمز التحقق"، أنت توافق على شروط الخدمة وسياسة الخصوصية'
            : 'By clicking "Send Verification Code", you agree to our Terms of Service and Privacy Policy'}
        </p>
      </div>
    </div>
  );
}

