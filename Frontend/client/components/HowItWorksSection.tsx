import { UserPlus, Sparkles, Handshake } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-gray-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20">
          <div className="relative inline-block">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-merit-dark mb-6 md:mb-8">
              {t('howItWorks.title')}
            </h2>
            {/* Green highlight accent */}
            <div className="absolute -top-2 -right-4 w-16 h-8 bg-merit-green rounded-lg -z-10"></div>
          </div>
          <p className="text-lg md:text-2xl text-merit-dark max-w-4xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="text-3xl md:text-5xl font-bold text-merit-dark mb-4 md:mb-6">
              01
            </div>
            <h3 className="text-xl md:text-3xl font-semibold text-merit-dark mb-4 md:mb-6">
              {t('howItWorks.step1.title')}
            </h3>
            <p className="text-base md:text-lg text-merit-dark leading-relaxed mb-6 md:mb-8">
              {t('howItWorks.step1.description')}
            </p>
            <div className="w-16 h-16 bg-merit-green rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-merit-dark" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="text-3xl md:text-5xl font-bold text-merit-dark mb-4 md:mb-6">
              02
            </div>
            <h3 className="text-xl md:text-3xl font-semibold text-merit-dark mb-4 md:mb-6">
              {t('howItWorks.step2.title')}
            </h3>
            <p className="text-base md:text-lg text-merit-dark leading-relaxed mb-6 md:mb-8">
              {t('howItWorks.step2.description')}
            </p>
            <div className="w-16 h-16 bg-merit-green rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-merit-dark" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="text-3xl md:text-5xl font-bold text-merit-dark mb-4 md:mb-6">
              03
            </div>
            <h3 className="text-xl md:text-3xl font-semibold text-merit-dark mb-4 md:mb-6">
              {t('howItWorks.step3.title')}
            </h3>
            <p className="text-base md:text-lg text-merit-dark leading-relaxed mb-6 md:mb-8">
              {t('howItWorks.step3.description')}
            </p>
            <div className="w-16 h-16 bg-merit-green rounded-full flex items-center justify-center">
              <Handshake className="w-8 h-8 text-merit-dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
