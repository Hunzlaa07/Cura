import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Briefcase, LogIn, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [userType, setUserType] = useState<'applicant' | 'recruiter'>('applicant');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const endpoint = userType === 'applicant' 
        ? `${import.meta.env.VITE_API_URL}/api/auth/applicant/login`
        : `${import.meta.env.VITE_API_URL}/api/auth/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", data.user.userType);
        if (data.user.userType === "recruiter" && data.user.planType) {
          localStorage.setItem("planType", data.user.planType);
        } else {
          localStorage.removeItem("planType");
        }

        setTimeout(() => {
          navigate(data.user.userType === "recruiter" ? "/recruiter-dashboard" : "/applicant-dashboard");
        }, 300);
      } else {
        toast({
          title: t('login.error'),
          description: data.error || t('login.signInFailed'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: t('login.error'),
        description: t('login.signInFailed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/");
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden w-screen h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ backgroundColor: "#e1e4e8" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none w-full h-full">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-[#1DBF73]/5 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1DBF73]/3 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Content Container */}
      <motion.div
        className="relative z-10 w-full h-full flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left side - Branding (hidden on smaller screens) */}
        <motion.div
          className="hidden xl:flex w-1/2 flex-col justify-center px-16 pointer-events-none"
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="max-w-md">
            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C8F55A] to-[#75A400] rounded-xl mb-4">
                <LogIn className="w-8 h-8 text-gray-900" />
              </div>
            </motion.div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t('login.welcomeBack')}</h1>
            <p className="text-xl text-gray-600 mb-6">{t('login.accessAccount')}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[#C8F55A] rounded-full flex-shrink-0"></div>
                <span>{t('login.secureAuth')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[#C8F55A] rounded-full flex-shrink-0"></div>
                <span>{t('login.personalizedDashboard')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[#C8F55A] rounded-full flex-shrink-0"></div>
                <span>{t('login.manageCaseStudies')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          className="w-full xl:w-1/2 flex items-center justify-center p-6 overflow-y-auto"
          initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.signIn')}</h2>
              <p className="text-gray-600">{t('login.chooseLoginType')}</p>
            </div>

            {/* User Type Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-8 p-1 bg-gray-100 rounded-xl border border-gray-200">
              {[
                { id: 'applicant' as const, label: t('login.applicant'), icon: User },
                { id: 'recruiter' as const, label: t('login.recruiter'), icon: Briefcase }
              ].map((type) => (
                <motion.button
                  key={type.id}
                  type="button"
                  onClick={() => setUserType(type.id)}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                    userType === type.id
                      ? 'bg-[#C8F55A] text-gray-900 shadow-lg shadow-[#C8F55A]/50'
                      : 'text-gray-600 hover:text-gray-900 bg-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              {/* Email Input */}
              <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                <Mail className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                <input
                  type="email"
                  name="email"
                  placeholder={t('login.enterEmail')}
                  onChange={handleChange}
                  required
                  className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
              </motion.div>

              {/* Password Input */}
              <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                <Lock className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={t('login.enterPassword')}
                  onChange={handleChange}
                  required
                  className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-3.5 text-gray-400 hover:text-gray-600 transition-colors ${isRTL ? 'left-4' : 'right-4'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#C8F55A] to-[#75A400] hover:from-[#B4E24C] hover:to-[#6A9500] text-gray-900 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-[#C8F55A]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <>
                    <span>{t('login.signIn')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>

            {/* Applicant Tip */}
            <AnimatePresence>
              {userType === 'applicant' && (
                <motion.div
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {t('login.applicantTip')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="text-center text-gray-600 text-sm">
              {t('login.noAccount')}{" "}
              <motion.a
                href="/signup"
                className="text-black font-semibold hover:text-[#B4E24C] transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                {t('login.signUpNow')}
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Back button */}
        <motion.button
          onClick={handleClose}
          className="absolute top-6 left-6 p-2 hover:bg-gray-200/50 rounded-lg transition-colors z-50 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline font-medium text-sm">{t('login.back')}</span>
        </motion.button>

        {/* Language Toggle */}
        <motion.button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 px-4 py-2 bg-white hover:bg-gray-100 rounded-lg transition-colors z-50 font-semibold text-sm text-gray-900 border border-gray-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {i18n.language === 'en' ? 'العربية' : 'English'}
        </motion.button>
      </motion.div>
    </div>
  );
}