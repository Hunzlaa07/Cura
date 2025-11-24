import { Button } from "@/components/ui/button";
import { Users, User } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-merit-green relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pt-20 pb-12 md:pt-32 md:pb-20">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-merit-dark leading-[0.95] mb-5 md:mb-6 mx-auto max-w-4xl">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-xl text-merit-dark/80 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              className="bg-merit-dark text-merit-green hover:bg-merit-dark/90 px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-semibold flex items-center gap-3 rounded-full shadow-lg shadow-black/10"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6" />
              {t('hero.forRecruiters')}
            </Button>
            <Button
              variant="outline"
              className="bg-white text-merit-dark border-white hover:bg-gray-50 px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-semibold flex items-center gap-3 rounded-full"
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
              {t('hero.forApplicants')}
            </Button>
          </div>
        </div>
      </div>

      {/* Left Side Image */}
      <div className="pointer-events-none select-none hidden lg:block absolute bottom-0 left-6 md:left-10 xl:left-16 z-0">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/2c5283a53bcabf837a6a11a4787dba0c2bb3029e?width=3707"
          alt="Professional person working"
          className="h-[320px] md:h-[380px] xl:h-[440px] max-h-[70vh] w-auto object-contain opacity-95 filter grayscale drop-shadow-xl"
        />
      </div>

      {/* Right Side Image */}
      <div className="pointer-events-none select-none hidden lg:block absolute bottom-0 right-6 md:right-10 xl:right-16 z-0">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/4f238f02dbbc81c08da87f7b40e8e1d4bd6ea2fc?width=3190"
          alt="Professional person with laptop"
          className="h-[300px] md:h-[350px] xl:h-[420px] max-h-[65vh] w-auto object-contain opacity-95 filter grayscale drop-shadow-xl"
        />
      </div>
    </section>
  );
}
