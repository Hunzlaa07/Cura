// services/translationService.js
const translate = require('@plainheart/google-translate-api');

class TranslationService {
  constructor() {
    this.cache = new Map();
  }

  async translateToArabic(text) {
    if (!text || text.trim().length === 0) return '';
    
    const cacheKey = `en_ar_${text.substring(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = await translate(text, { from: 'en', to: 'ar' });
      this.cache.set(cacheKey, result.text);
      return result.text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async translateToEnglish(text) {
    if (!text || text.trim().length === 0) return '';
    
    const cacheKey = `ar_en_${text.substring(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = await translate(text, { from: 'ar', to: 'en' });
      this.cache.set(cacheKey, result.text);
      return result.text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new TranslationService();