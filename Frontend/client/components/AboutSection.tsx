import { Handshake, Globe, BarChart3 } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-white" id="about">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-merit-dark mb-6 md:mb-8">
            {t('aboutSection.title')}
          </h2>
          <p className="text-lg md:text-2xl text-merit-gray max-w-4xl mx-auto leading-relaxed">
            {t('aboutSection.description')}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* AI-Driven Matching */}
          <div className="bg-green-50 rounded-3xl p-8 md:p-12 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
              <Handshake className="w-10 h-10 text-merit-dark" />
            </div>
            <h3 className="text-xl md:text-3xl font-semibold text-merit-dark mb-4 md:mb-6">
              {t('aboutSection.aiDriven.title')}
            </h3>
            <p className="text-base md:text-xl text-merit-dark leading-relaxed">
              {t('aboutSection.aiDriven.description')}
            </p>
          </div>

          {/* Global Reach */}
          <div className="bg-blue-50 rounded-3xl p-8 md:p-12 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
              <Globe className="w-10 h-10 text-merit-dark" />
            </div>
            <h3 className="text-xl md:text-3xl font-semibold text-merit-dark mb-4 md:mb-6">
              {t('aboutSection.globalReach.title')}
            </h3>
            <p className="text-base md:text-xl text-merit-dark leading-relaxed">
              {t('aboutSection.globalReach.description')}
            </p>
          </div>

          {/* Data Analytics */}
          <div className="bg-green-50 rounded-3xl p-8 md:p-12 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
              <BarChart3 className="w-10 h-10 text-merit-dark" />
            </div>
            <h3 className="text-xl md:text-3xl font-semibold text-merit-dark mb-4 md:mb-6">
              {t('aboutSection.dataAnalytics.title')}
            </h3>
            <p className="text-base md:text-xl text-merit-dark leading-relaxed">
              {t('aboutSection.dataAnalytics.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
