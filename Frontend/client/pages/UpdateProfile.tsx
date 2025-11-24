import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ApplicantSidebar from "@/components/dashboard/ApplicantSidebar";
import { User, Briefcase, MapPin, Globe, Calendar, Clock, Award, Plus, Trash2, Save, CheckCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function UpdateProfile() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    bio: "",
    location: "",
    preferred_language: "en",
    years_of_experience: 0,
    availability: "full-time",
    cv_file: null as File | null,
  });

  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<
    { skill_id: number; proficiency_level: string; years_of_experience: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Set document direction on language change
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Fetch profile data + skills
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        const [profileRes, skillsRes, userSkillsRes] = await Promise.all([
          fetch(`${apiUrl}/api/applicants/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": i18n.language,
            },
          }),
          fetch(`${apiUrl}/api/applicants/all-skills`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": i18n.language,
            },
          }),
          fetch(`${apiUrl}/api/applicants/skills`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": i18n.language,
            },
          }),
        ]);

        const [profileData, skillsData, userSkillsData] = await Promise.all([
          profileRes.json(),
          skillsRes.json(),
          userSkillsRes.json(),
        ]);

        // Populate form with existing profile data
        setFormData({
          title: profileData.title || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          preferred_language: profileData.preferred_language || "en",
          years_of_experience: profileData.years_of_experience || 0,
          availability: profileData.availability || "full-time",
          cv_file: null,
        });

        setSkills(skillsData);
        setSelectedSkills(userSkillsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [i18n.language]);

  // Form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // File change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({ ...prev, cv_file: e.target.files![0] }));
    }
  };

  // Skill change handlers
  const handleSkillChange = (index: number, field: string, value: any) => {
    const updated = [...selectedSkills];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedSkills(updated);
  };

  const addSkill = () => {
    if (skills.length === 0) {
      alert(t("updateProfilePage.noSkillsAvailable"));
      return;
    }
    setSelectedSkills([
      ...selectedSkills,
      {
        skill_id: skills[0].id,
        proficiency_level: "beginner",
        years_of_experience: 0,
      },
    ]);
  };

  const removeSkill = (index: number) => {
    setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
  };

  // Submit profile and skills
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t("updateProfilePage.notLoggedIn"));
      return;
    }

    try {
      setSaving(true);
      setSuccess(false);
      const apiUrl = import.meta.env.VITE_API_URL;

      // Step 1: Update profile
      const profileRes = await fetch(`${apiUrl}/api/applicants/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language,
        },
        body: JSON.stringify({
          title: formData.title,
          bio: formData.bio,
          location: formData.location,
          preferred_language: formData.preferred_language,
          years_of_experience: formData.years_of_experience,
          availability: formData.availability,
        }),
      });

      if (!profileRes.ok) throw new Error(t("updateProfilePage.profileUpdateFailed"));

      // Step 2: Update skills
      const skillsRes = await fetch(`${apiUrl}/api/applicants/skills`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": i18n.language,
        },
        body: JSON.stringify({ skills: selectedSkills }),
      });

      if (!skillsRes.ok) throw new Error(t("updateProfilePage.skillUpdateFailed"));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(t("updateProfilePage.errorUpdating"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <ApplicantSidebar activeItem="profile" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">{t("updateProfilePage.loadingProfile")}</div>
        </div>
      </div>
    );
  }

  const proficiencyLevels = [
    { value: "beginner", label: t("updateProfilePage.beginner") },
    { value: "intermediate", label: t("updateProfilePage.intermediate") },
    { value: "advanced", label: t("updateProfilePage.advanced") },
    { value: "expert", label: t("updateProfilePage.expert") },
  ];

  const availabilityOptions = [
    { value: "full-time", label: t("updateProfilePage.fullTime") },
    { value: "part-time", label: t("updateProfilePage.partTime") },
    { value: "contract", label: t("updateProfilePage.contract") },
    { value: "freelance", label: t("updateProfilePage.freelance") },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#e1e4e8' }}>
      <ApplicantSidebar activeItem="profile" />

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-12 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-merit-dark">
              {t("updateProfilePage.title")}
            </h1>
            <p className="text-lg text-merit-gray mt-2">
              {t("updateProfilePage.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Content */}
        <div className="p-12 max-w-5xl mx-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{t("updateProfilePage.profileUpdated")}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t("updateProfilePage.personalInformation")}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4" />
                    {t("updateProfilePage.jobTitle")}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t("updateProfilePage.jobTitlePlaceholder")}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    {t("updateProfilePage.location")}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={t("updateProfilePage.locationPlaceholder")}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4" />
                    {t("updateProfilePage.preferredLanguage")}
                  </label>
                  <select
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="en">{t("updateProfilePage.english")}</option>
                    <option value="ar">{t("updateProfilePage.arabic")}</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    {t("updateProfilePage.yearsOfExperience")}
                  </label>
                  <input
                    type="number"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4" />
                    {t("updateProfilePage.availability")}
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {availabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    {t("updateProfilePage.bio")}
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t("updateProfilePage.bioPlaceholder")}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio?.length || 0} {t("updateProfilePage.characters")}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {t("updateProfilePage.skills")}
                  </h2>
                </div>
                <Button
                  type="button"
                  onClick={addSkill}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  {t("updateProfilePage.addSkill")}
                </Button>
              </div>

              {selectedSkills.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">{t("updateProfilePage.noSkillsAdded")}</p>
                  <p className="text-sm">{t("updateProfilePage.clickToAddSkill")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100"
                    >
                      <select
                        value={skill.skill_id}
                        onChange={(e) =>
                          handleSkillChange(index, "skill_id", parseInt(e.target.value))
                        }
                        className="flex-1 min-w-[200px] border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        {skills.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.category && `(${s.category})`}
                          </option>
                        ))}
                      </select>

                      <select
                        value={skill.proficiency_level}
                        onChange={(e) =>
                          handleSkillChange(index, "proficiency_level", e.target.value)
                        }
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        {proficiencyLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          value={skill.years_of_experience}
                          onChange={(e) =>
                            handleSkillChange(
                              index,
                              "years_of_experience",
                              parseFloat(e.target.value)
                            )
                          }
                          className="border border-gray-300 p-3 rounded-lg w-24 focus:ring-2 focus:ring-purple-500"
                          placeholder="Years"
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {t("updateProfilePage.years")}
                        </span>
                      </div>

                      <Button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="bg-red-500 hover:bg-red-600 text-white p-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                onClick={() => window.history.back()}
                className="px-8 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                {t("updateProfilePage.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("updateProfilePage.saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t("updateProfilePage.saveProfile")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}