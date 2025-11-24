import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ApplicantSidebar from '@/components/dashboard/ApplicantSidebar';
import { Lock } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function ApplicantSettings() {
  const { t, i18n } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Set document direction on language change
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError(t('settingsPage.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('settingsPage.passwordMinLength'));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applicants/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t('settingsPage.passwordUpdatedSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          navigate('/applicant-dashboard');
        }, 2000);
      } else {
        setError(data.error || t('settingsPage.passwordUpdateFailed'));
      }
    } catch (err) {
      setError(t('settingsPage.passwordUpdateError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#e1e4e8' }}>
      <ApplicantSidebar activeItem="settings" />

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-12 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-merit-dark">{t('settingsPage.title')}</h1>
            <p className="text-lg text-merit-gray mt-2">{t('settingsPage.subtitle')}</p>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Content */}
        <div className="flex justify-center items-center p-12">
          <div className="w-full max-w-3xl">
          {/* Password Reset Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-merit-dark">{t('settingsPage.changePassword')}</h2>
                <p className="text-sm text-merit-gray">{t('settingsPage.changePasswordDesc')}</p>
              </div>
            </div>

            {/* Info Box for Temp Password Users */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                💡 <strong>{t('settingsPage.tempPasswordInfo')}</strong>
              </p>
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settingsPage.currentPassword')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('settingsPage.currentPasswordPlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('settingsPage.currentPasswordHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settingsPage.newPassword')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('settingsPage.newPasswordPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settingsPage.confirmNewPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('settingsPage.confirmNewPasswordPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-merit-green text-merit-dark py-4 rounded-lg font-semibold hover:bg-merit-green/90 transition disabled:opacity-50"
              >
                {loading ? t('settingsPage.updatingPassword') : t('settingsPage.updatePassword')}
              </button>
            </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}