import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

export default function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="bg-merit-green relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-24">
        <div className="grid lg:grid-cols-2 items-center gap-8">
          {/* Text block */}
          <div className="text-left">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-merit-dark leading-[1.05] mb-4 md:mb-5 max-w-xl">
              {t('cta.title')}
            </h2>

            <p className="text-sm md:text-lg text-merit-dark/80 mb-6 md:mb-8 max-w-xl leading-relaxed">
              {t('cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-merit-dark text-merit-green hover:bg-merit-dark/90 px-6 md:px-7 py-3.5 md:py-5 text-base md:text-lg font-semibold rounded-full shadow-lg shadow-black/10"
              >
                {t('cta.startTrial')}
              </Button>
              <Button
                variant="outline"
                className="bg-white text-merit-dark border-white hover:bg-gray-50 px-6 md:px-7 py-3.5 md:py-5 text-base md:text-lg font-semibold rounded-full"
              >
                {t('cta.scheduleDemo')}
              </Button>
            </div>
          </div>

          {/* Image block */}
          <div className="relative hidden lg:block">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/335750235aaa181ad7aad024b40676804f9f6fea?width=4791"
              alt="AI and technology illustration"
              className="h-[300px] xl:h-[380px] w-auto object-contain ml-auto drop-shadow-xl"
            />
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/30a82509cdbc6efbfb90f2cb419b188408457f1e?width=1332"
              alt="AI icon"
              className="absolute -top-6 right-10 w-16 xl:w-20 opacity-90"
            />
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/2eb1e99a7af5b3170933217e77f8a02a8ca0787d?width=569"
              alt="AI small icon"
              className="absolute top-6 right-0 w-8 xl:w-10 opacity-80"
            />
          </div>
        </div>
      </div>
      
      {/* Removed absolute decorative elements in favor of the right image block */}
    </section>
  );
}
