// middlewares/languageMiddleware.js
const languageMiddleware = (req, res, next) => {
  // Get language from header, query param, or user preference
  const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
               req.query.lang || 
               req.user?.preferred_language || 
               'en';
  
  req.language = ['en', 'ar'].includes(lang) ? lang : 'en';
  next();
};

module.exports = languageMiddleware;