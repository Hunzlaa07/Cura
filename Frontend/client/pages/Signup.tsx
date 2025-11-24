import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Building2, GitBranch, UserPlus, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Signup() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    userType: "applicant" as 'applicant' | 'recruiter',
    companyName: "",
    position: "",
    department: "",
    bio: "",
    planType: "full" as 'full' | 'case_only',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast({
          title: t('signup.successTitle'),
          description: t('signup.successDescription'),
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        toast({
          title: t('signup.error'),
          description: data.error || t('signup.signupFailed'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast({
        title: t('signup.error'),
        description: t('signup.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    window.history.back();
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={`fixed inset-0 z-50 w-screen h-screen overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #C8F55A #f0f0f0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #C8F55A;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B4E24C;
        }
      `}</style>
      
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
          className="absolute -top-40 -right-40 w-80 h-80 bg-[#C8F55A]/5 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#C8F55A]/3 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Content Container */}
      <motion.div
        className="relative z-10 w-full h-full flex max-w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left side - Branding (hidden on mobile) */}
        <motion.div
          className="hidden lg:flex w-1/2 flex-col justify-center px-16 pointer-events-none"
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
                <UserPlus className="w-8 h-8 text-gray-900" />
              </div>
            </motion.div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{t('signup.getStarted')}</h1>
            <p className="text-xl text-gray-600 mb-6">{t('signup.createAccount')}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[#C8F55A] rounded-full flex-shrink-0"></div>
                <span>{t('signup.signupAsApplicantRecruiter')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[#C8F55A] rounded-full flex-shrink-0"></div>
                <span>{t('signup.secureCreation')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-2 h-2 bg-[#C8F55A] rounded-full flex-shrink-0"></div>
                <span>{t('signup.startAccessingCaseStudies')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 overflow-x-hidden"
          initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Form Container */}
          <motion.div
            className="w-full max-w-md max-h-[90vh] flex flex-col overflow-x-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Header - Always visible */}
            <div className="text-center mb-8 flex-shrink-0 px-2">
              <motion.div
                className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#C8F55A] to-[#75A400] rounded-xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <UserPlus className="w-6 h-6 text-gray-900" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('signup.createAccountTitle')}
              </h1>
              <p className="text-gray-600">{t('signup.joinUs')}</p>
            </div>

            {/* User Type Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-8 p-1 bg-gray-100 rounded-xl border border-gray-200 flex-shrink-0 mx-2">
              {[
                { id: 'applicant' as const, label: t('signup.applicant'), icon: User },
                { id: 'recruiter' as const, label: t('signup.recruiter'), icon: Briefcase }
              ].map((type) => (
                <motion.button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: type.id })}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                    formData.userType === type.id
                      ? 'bg-[#C8F55A] text-gray-900 shadow-lg shadow-[#C8F55A]/50'
                      : 'text-gray-600 hover:text-gray-900 bg-white'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar px-2">
              {/* Full Name */}
              <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                <User className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                <input
                  type="text"
                  name="fullName"
                  placeholder={t('signup.enterFullName')}
                  onChange={handleChange}
                  required
                  className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
              </motion.div>

              {/* Email */}
              <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                <Mail className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                <input
                  type="email"
                  name="email"
                  placeholder={t('signup.enterEmail')}
                  onChange={handleChange}
                  required
                  className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
              </motion.div>

              {/* Password */}
              <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                <Lock className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={t('signup.createPassword')}
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

              {/* Recruiter Fields */}
              <AnimatePresence>
                {formData.userType === "recruiter" && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Company */}
                    <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                      <Building2 className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                      <input
                        type="text"
                        name="companyName"
                        placeholder={t('signup.companyName')}
                        onChange={handleChange}
                        required
                        className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                      />
                    </motion.div>

                    {/* Recruiter Plan Type */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="text-sm font-semibold text-gray-800 mb-3">
                        {i18n.language === 'ar' ? 'نوع الخطة' : 'Plan Type'}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <label className={`flex items-start gap-3 p-3 rounded-lg border ${formData.planType === 'full' ? 'border-[#C8F55A] bg-[#C8F55A]/10' : 'border-gray-200'}`}>
                          <input
                            type="radio"
                            name="planType"
                            value="full"
                            checked={formData.planType === 'full'}
                            onChange={(e) => setFormData({ ...formData, planType: e.target.value as 'full' | 'case_only' })}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {i18n.language === 'ar' ? 'الخطة الكاملة' : 'Full (Jobs + Case Studies)'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {i18n.language === 'ar' ? 'إنشاء وظائف ودراسات حالة وإدارة المرشحين' : 'Create jobs and case studies; manage applicants'}
                            </div>
                          </div>
                        </label>
                        <label className={`flex items-start gap-3 p-3 rounded-lg border ${formData.planType === 'case_only' ? 'border-[#C8F55A] bg-[#C8F55A]/10' : 'border-gray-200'}`}>
                          <input
                            type="radio"
                            name="planType"
                            value="case_only"
                            checked={formData.planType === 'case_only'}
                            onChange={(e) => setFormData({ ...formData, planType: e.target.value as 'full' | 'case_only' })}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {i18n.language === 'ar' ? 'دراسات الحالة فقط' : 'Case Studies Only'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {i18n.language === 'ar' ? 'إنشاء دراسات الحالة فقط بدون إنشاء وظائف' : 'Generate case studies without job creation'}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Position */}
                    <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                      <Briefcase className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                      <input
                        type="text"
                        name="position"
                        placeholder={t('signup.yourPosition')}
                        onChange={handleChange}
                        required
                        className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                      />
                    </motion.div>

                    {/* Department */}
                    <motion.div className="relative" whileHover={{ scale: 1.01 }}>
                      <GitBranch className={`absolute top-3.5 w-5 h-5 text-gray-400 pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
                      <input
                        type="text"
                        name="department"
                        placeholder={t('signup.department')}
                        onChange={handleChange}
                        required
                        className={`w-full py-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                      />
                    </motion.div>

                    {/* Bio */}
                    <textarea
                      name="bio"
                      placeholder={t('signup.tellAboutYourself')}
                      onChange={handleChange}
                      className={`w-full p-3 bg-gray-50 border border-gray-300 hover:border-gray-400 focus:border-[#C8F55A] rounded-xl text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:ring-2 focus:ring-[#C8F55A]/20 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                      rows={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="overflow-hidden rounded-xl mt-8">
                <motion.button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#C8F55A] to-[#75A400] hover:from-[#B4E24C] hover:to-[#6A9500] 
                             text-gray-900 py-3 rounded-xl font-semibold transition-all duration-300 
                             flex items-center justify-center gap-2 shadow-lg shadow-[#C8F55A]/30 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : (
                    <>
                      <span>{t('signup.createAccountButton')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>

            </div>

            {/* Footer */}
            <div className="text-center text-gray-600 text-sm mt-6 flex-shrink-0 px-2">
              {t('signup.haveAccount')}{" "}
              <motion.a
                href="/login"
                className="text-black font-semibold hover:text-[#B4E24C] transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                {t('signup.signIn')}
              </motion.a>
            </div>
          </motion.div>
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
          <span className="hidden sm:inline font-medium text-sm">{t('signup.back')}</span>
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