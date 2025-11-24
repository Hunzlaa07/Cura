import { Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function ForApplicantsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-gray-50" id="applicants">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left Image */}
          <div className="order-2 lg:order-1 relative">
            <div className="bg-green-50 rounded-3xl p-8 md:p-12 overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/931b30899ba701d3d1ca435de6f72e302a11c45f?width=4304"
                alt="Professional using Cura platform for job search"
                className="w-full h-auto object-cover rounded-3xl"
              />
            </div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-merit-dark mb-6 md:mb-8">
              {t('applicants.title')}
            </h2>
            <p className="text-lg md:text-2xl text-merit-dark mb-8 md:mb-12 leading-relaxed">
              {t('applicants.subtitle')}
            </p>

            {/* Feature List */}
            <div className="space-y-6 md:space-y-8">
              {/* Personalized Matching */}
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-merit-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-6 h-6 text-merit-dark" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold text-merit-dark mb-2 md:mb-3">
                    {t('applicants.personalizedMatching.title')}
                  </h3>
                  <p className="text-lg text-merit-dark leading-relaxed">
                    {t('applicants.personalizedMatching.description')}
                  </p>
                </div>
              </div>

              {/* Career Insights */}
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-merit-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-6 h-6 text-merit-dark" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold text-merit-dark mb-2 md:mb-3">
                    {t('applicants.careerInsights.title')}
                  </h3>
                  <p className="text-lg text-merit-dark leading-relaxed">
                    {t('applicants.careerInsights.description')}
                  </p>
                </div>
              </div>

              {/* Application Tracking */}
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-merit-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-6 h-6 text-merit-dark" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold text-merit-dark mb-2 md:mb-3">
                    {t('applicants.applicationTracking.title')}
                  </h3>
                  <p className="text-lg text-merit-dark leading-relaxed">
                    {t('applicants.applicationTracking.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
