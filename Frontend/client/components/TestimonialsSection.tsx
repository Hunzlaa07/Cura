import { Star } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('testimonials.sarah.name'),
      title: t('testimonials.sarah.title'),
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/fae4c70a7eab0a6caf51fc4b83638509846b241a?width=406",
      quote: t('testimonials.sarah.quote')
    },
    {
      name: t('testimonials.ahmed.name'),
      title: t('testimonials.ahmed.title'),
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/5595af9bc52193dee45ab6e11b410f0f85ff91bc?width=406",
      quote: t('testimonials.ahmed.quote')
    },
    {
      name: t('testimonials.fatima.name'),
      title: t('testimonials.fatima.title'),
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/cdd1806d7e087a65799571a9fff4b48f62296ad0?width=406",
      quote: t('testimonials.fatima.quote')
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white" id="testimonials">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-merit-dark mb-6 md:mb-8">
            {t('testimonials.title')}
          </h2>
          <p className="text-lg md:text-2xl text-merit-dark max-w-4xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-3xl p-6 md:p-8">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-base md:text-xl font-semibold text-merit-dark">
                    {testimonial.name}
                  </h3>
                  <p className="text-merit-gray italic">
                    {testimonial.title}
                  </p>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-base md:text-lg text-merit-dark leading-relaxed mb-6 md:mb-8">
                "{testimonial.quote}"
              </blockquote>

              {/* Star Rating */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
