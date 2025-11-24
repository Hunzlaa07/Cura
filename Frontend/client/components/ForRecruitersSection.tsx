import { Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function ForRecruitersSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-white" id="recruiters">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-merit-dark mb-6 md:mb-8">
              {t('recruiters.title')}
            </h2>
            <p className="text-lg md:text-2xl text-merit-dark mb-8 md:mb-12 leading-relaxed">
              {t('recruiters.subtitle')}
            </p>

            {/* Feature List */}
            <div className="space-y-6 md:space-y-8">
              {/* Automated Screening */}
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-merit-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-6 h-6 text-merit-dark" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold text-merit-dark mb-2 md:mb-3">
                    {t('recruiters.automatedScreening.title')}
                  </h3>
                  <p className="text-lg text-merit-dark leading-relaxed">
                    {t('recruiters.automatedScreening.description')}
                  </p>
                </div>
              </div>

              {/* Advanced Analytics */}
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-merit-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-6 h-6 text-merit-dark" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold text-merit-dark mb-2 md:mb-3">
                    {t('recruiters.advancedAnalytics.title')}
                  </h3>
                  <p className="text-lg text-merit-dark leading-relaxed">
                    {t('recruiters.advancedAnalytics.description')}
                  </p>
                </div>
              </div>

              {/* Global Talent Pool */}
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-merit-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-6 h-6 text-merit-dark" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold text-merit-dark mb-2 md:mb-3">
                    {t('recruiters.globalTalentPool.title')}
                  </h3>
                  <p className="text-lg text-merit-dark leading-relaxed">
                    {t('recruiters.globalTalentPool.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="bg-green-50 rounded-3xl p-8 md:p-12 overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/479169cbe554b62fcd3390c47b5400821576d874?width=4460"
                alt="Professional using Cura platform for recruitment"
                className="w-full h-auto object-cover rounded-3xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
