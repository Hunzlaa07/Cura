const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const jobAppController = require('../controllers/jobApplicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const languageMiddleware = require('../middlewares/languageMiddleware'); 
const multer = require('multer');
const aiService = require('../services/aiService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // Already in your artifact_instructions
const axios = require('axios');
const cheerio = require('cheerio');
// Multer setup for resume uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'));
    }
  }
});

// ========================================
// PUBLIC ROUTES (No Authentication)
// ========================================

router.get('/public/:shareLink', languageMiddleware, jobController.getPublicJobDetails);

// Submit job application (public form)
router.post('/public/:shareLink/apply', upload.single('resume'), jobAppController.submitApplication);

// ========================================
// PROTECTED ROUTES (Authentication Required)
// ========================================

// AI job description generator
router.post("/generate", authMiddleware, jobController.generateJobDescription);

// Create job with deadline and share link
router.post("/", authMiddleware, jobController.createJobWithDeadline);

router.get("/my-jobs", authMiddleware, languageMiddleware, jobController.getMyJobsWithStats);

// Toggle job open/closed status
router.put("/:id/toggle-status", authMiddleware, jobController.toggleJobStatus);

// Extend application deadline
router.put("/:id/extend-deadline", authMiddleware, jobController.extendDeadline);

// ADD languageMiddleware
router.get("/:id/applicants", authMiddleware, languageMiddleware, jobController.getJobApplicants);

// Update application status (reviewed/shortlisted/rejected)
router.put("/applications/:id/status", authMiddleware, jobAppController.updateApplicationStatus);

// Download applicant resume
router.get("/applications/:id/resume", authMiddleware, jobAppController.downloadResume);

// ADD languageMiddleware to public jobs list
router.get('/', languageMiddleware, jobController.getJobs);

// ADD languageMiddleware
router.get('/:id', languageMiddleware, jobController.getJobById);

/**
 * EXTRACT JD FROM UPLOADED FILE
 * Supports: PDF, DOC, DOCX, TXT
 */
router.post("/extract-jd", authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    let extractedText = '';
    let jobTitle = '';
    let department = '';
    let location = '';
    let description = '';
    let keyResponsibilities = '';

    console.log(`📄 Processing file: ${req.file.originalname} (${mimeType})`);

    // Extract based on file type
    if (mimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr);
        throw new Error('Failed to parse PDF');
      }
    } else if (mimeType === 'application/msword' || 
               mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } catch (docErr) {
        console.error('DOC parse error:', docErr);
        throw new Error('Failed to parse document');
      }
    } else if (mimeType === 'text/plain') {
      extractedText = fileBuffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file type');
    }

    // Basic parsing to extract common fields
    const lines = extractedText.split('\n');
    
    // Try to find job title (usually in first few lines)
    if (lines.length > 0) {
      jobTitle = lines[0].trim();
    }

    // Try to extract location (look for common patterns)
    const locationPatterns = /location[:\s]+([^\n.]+)/i;
    const locationMatch = extractedText.match(locationPatterns);
    location = locationMatch ? locationMatch[1].trim().substring(0, 100) : '';

    // Try to extract department (look for common patterns)
    const deptPatterns = /department[:\s]+([^\n.]+)|team[:\s]+([^\n.]+)|function[:\s]+([^\n.]+)/i;
    const deptMatch = extractedText.match(deptPatterns);
    department = deptMatch ? (deptMatch[1] || deptMatch[2] || deptMatch[3]).trim().substring(0, 100) : '';

    console.log(`✅ Extracted: ${extractedText.length} characters`);
    console.log(`📝 Title: ${jobTitle}`);
    console.log(`📍 Location: ${location}`);
    console.log(`🏢 Department: ${department}`);
    console.log(`📄 Description length: ${description.length}`);
    console.log(`✓ Responsibilities length: ${keyResponsibilities.length}`);

    res.json({
      success: true,
      extracted_text: extractedText,
      job_title: jobTitle,
      location: location,
      department: department,
      description: description,
      key_responsibilities: keyResponsibilities,
      filename: req.file.originalname,
      file_size: req.file.size
    });

  } catch (err) {
    console.error("❌ File extraction error:", err);
    res.status(500).json({ 
      error: "Failed to extract from file",
      details: err.message 
    });
  }
});

/**
 * SCRAPE JD FROM WEBSITE URL
 * Extracts job description from any public job posting URL
 * Handles both static HTML and JavaScript-rendered content
 */
router.post("/scrape-jd", authMiddleware, async (req, res) => {
  const browser = require('puppeteer');
  let page = null;
  
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlErr) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    console.log(`🌐 Scraping: ${url}`);

    // Launch headless browser with better options
    const browserInstance = await browser.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling'
      ]
    });

    page = await browserInstance.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set user agent to look like a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('⏳ Navigating to page...');
    
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 20000 
      });
    } catch (navErr) {
      console.warn('⚠️ Navigation warning:', navErr.message);
      // Continue anyway, page might have loaded partially
    }

    // Wait for body content to exist
    try {
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return text && text.length > 100;
      }, { timeout: 10000 });
    } catch (waitErr) {
      console.warn('⚠️ Content load timeout');
    }

    // Add extra wait for JS rendering
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    console.log('📄 Extracting content...');

    // Extract page content
    const pageContent = await page.evaluate(() => {
      // Remove scripts and styles
      document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      
      // Get job title
      let jobTitle = '';
      const h1 = document.querySelector('h1');
      if (h1) {
        jobTitle = h1.innerText?.trim().substring(0, 200) || '';
      }
      
      if (!jobTitle) {
        jobTitle = document.title?.split('|')[0]?.trim().substring(0, 200) || '';
      }

      // Get all visible text
      const allText = document.body.innerText || '';
      
      return {
        jobTitle: jobTitle,
        fullText: allText
      };
    });

    await browserInstance.close();

    console.log(`📝 Title: ${pageContent.jobTitle}`);
    console.log(`📄 Text length: ${pageContent.fullText.length}`);

    // Clean up text
    let extractedText = (pageContent.fullText || '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (extractedText.length < 100) {
      console.warn('⚠️ Extracted text too short');
      return res.status(400).json({
        error: "Could not extract sufficient job content",
        details: "The website may block automated access",
        extracted: extractedText.substring(0, 200)
      });
    }

    // Remove navigation and UI text
    extractedText = extractedText
      .replace(/Apply Now|Share|Subscribe|Follow|Like|Comment|Download|View More|Save Job|Back to|Search Jobs|Login|Register|Sign Up|Post Job|Messages|Saved/gi, '')
      .replace(/©.*?All rights reserved/gi, '')
      .replace(/Privacy Policy|Terms of Service|Contact Us|Help|FAQ|About|Advertise/gi, '')
      .trim()
      .substring(0, 5000);

    console.log(`✅ Scraped: ${extractedText.length} characters`);
    console.log(`📝 First 300 chars: ${extractedText.substring(0, 300)}`);

    // Extract location - look for common patterns
    let locationWeb = '';
    const locationMatch = extractedText.match(/location[:\s]+([^\n]+)/i);
    if (locationMatch) {
      locationWeb = locationMatch[1].trim().substring(0, 100);
    }
    // Also try city pattern
    if (!locationWeb) {
      const cityMatch = extractedText.match(/(Islamabad|Karachi|Lahore|Remote|Hybrid|Quetta|Peshawar|Multan|Faisalabad|Gujranwala)/i);
      if (cityMatch) {
        locationWeb = cityMatch[1];
      }
    }

    // Extract department - look for specific department keywords
    let departmentWeb = '';
    const departmentKeywords = ['Digital', 'Technology', 'Analytics', 'Strategy', 'Finance', 'HR', 'Sales', 'Marketing', 'Operations', 'Engineering', 'Product', 'IT', 'Software', 'Business', 'Admin'];
    
    for (const keyword of departmentKeywords) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(extractedText)) {
        departmentWeb = keyword;
        break;
      }
    }

    // Extract description - look for job description section
    let descriptionWeb = '';
    const descPatterns = [
      /job\s+description[:\s]+([^\n]+(?:\n(?!key|requirement|about|qualif|skill|responsi).*)*)/i,
      /about\s+(?:the\s+)?role[:\s]+([^\n]+(?:\n(?!key|requirement|about|qualif|skill|responsi).*)*)/i,
      /role[:\s]+([^\n]+(?:\n(?!key|requirement|about|qualif|skill|responsi).*)*)/i
    ];
    
    for (const pattern of descPatterns) {
      const match = extractedText.match(pattern);
      if (match && match[1]) {
        descriptionWeb = match[1].trim().substring(0, 2000);
        break;
      }
    }

    // Extract key responsibilities
    let keyResponsibilitiesWeb = '';
    const respPatterns = [
      /key\s+responsibilit(?:ies|y)[:\s]+([^\n]+(?:\n(?!requirement|about|qualif|skill|department|location).*)*)/i,
      /responsibilit(?:ies|y)[:\s]+([^\n]+(?:\n(?!requirement|about|qualif|skill|department|location).*)*)/i,
      /what\s+you'll?\s+(?:be\s+)?doing[:\s]+([^\n]+(?:\n(?!requirement|about|qualif|skill|department|location).*)*)/i
    ];
    
    for (const pattern of respPatterns) {
      const match = extractedText.match(pattern);
      if (match && match[1]) {
        keyResponsibilitiesWeb = match[1].trim().substring(0, 2000);
        break;
      }
    }

    console.log(`📍 Location: ${locationWeb || 'Not found'}`);
    console.log(`🏢 Department: ${departmentWeb || 'Not found'}`);
    console.log(`📄 Description length: ${descriptionWeb.length}`);
    console.log(`✓ Responsibilities length: ${keyResponsibilitiesWeb.length}`);

    res.json({
      success: true,
      extracted_text: extractedText,
      job_title: pageContent.jobTitle,
      location: locationWeb,
      department: departmentWeb,
      description: descriptionWeb,
      key_responsibilities: keyResponsibilitiesWeb,
      source_url: url,
      domain: new URL(url).hostname
    });

  } catch (err) {
    console.error("❌ Web scraping error:", err.message);
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(400).json({ 
        error: "Cannot reach the URL",
        details: "Please check the URL and try again" 
      });
    }

    res.status(500).json({ 
      error: "Failed to scrape website",
      details: err.message 
    });
  }
});
/**
 * ENHANCE JOB DESCRIPTION WITH AI
 * Takes an existing job description and enhances it with:
 * - Better structure and formatting
 * - Missing sections (responsibilities, requirements, qualifications)
 * - Industry-specific language
 * - More detailed and professional wording
 */
router.post("/enhance", authMiddleware, async (req, res) => {
  try {
    const { jobDescription, language = 'en' } = req.body;

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ 
        error: "Job description too short",
        details: "Please provide at least 20 characters"
      });
    }

    const isArabic = language === 'ar';

    const enhancementPrompt = `
You are an expert HR professional and job description writer. Your task is to enhance an existing job description by:

1. Identifying missing key sections
2. Adding structured sections if not present
3. Expanding vague descriptions with industry-specific details
4. Improving clarity and professionalism
5. Ensuring completeness for recruitment purposes

CURRENT JOB DESCRIPTION:
${jobDescription}

ENHANCEMENT REQUIREMENTS:
1. Analyze the current description
2. Identify what sections are missing (e.g., responsibilities, requirements, qualifications, benefits, etc.)
3. For any missing sections, provide realistic enhanced content based on the job role described
4. For existing sections, improve and expand them
5. Keep the enhanced content professional and recruiter-ready

${isArabic ? 'Provide ALL output in Arabic.' : 'Provide ALL output in English.'}

Return ONLY valid JSON with NO markdown, NO explanations, NO code blocks:
{
  "original_summary": "Brief summary of what was in original description",
  "missing_sections": ["section1", "section2"],
  "description": "Enhanced overall description with better structure and detail",
  "key_responsibilities": "Comprehensive list of key responsibilities (can be bullet points or numbered)",
  "requirements": "Key requirements for the role (technical and soft skills)",
  "qualifications": "Preferred qualifications and experience level",
  "nice_to_haves": "Nice to have skills or experience",
  "enhancement_notes": "What was enhanced or added"
}`;

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🚀 AI JOB DESCRIPTION ENHANCEMENT`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`📝 Input: ${jobDescription.substring(0, 100)}...`);
    console.log(`🌍 Language: ${isArabic ? 'Arabic' : 'English'}`);

    // Try primary provider first, then fallback
    const providers = ['openai', 'groq', 'gemini'];
    let enhancedData = null;
    let usedProvider = null;

    for (const provider of providers) {
      try {
        console.log(`\n🤖 Trying provider: ${provider.toUpperCase()}`);
        
        const aiContent = await aiService.generateContent(enhancementPrompt, provider);
        console.log(`✅ Response received: ${aiContent.length} characters`);

        // Sanitize and parse
        const sanitized = sanitizeJSON(aiContent);
        if (!sanitized) {
          throw new Error('Failed to parse response');
        }

        // Validate required fields
        if (!sanitized.description || !sanitized.key_responsibilities) {
          throw new Error('Missing required fields in response');
        }

        enhancedData = sanitized;
        usedProvider = provider;
        console.log(`✅ Successfully enhanced with ${provider.toUpperCase()}`);
        break;

      } catch (err) {
        console.warn(`⚠️ ${provider.toUpperCase()} failed:`, err.message);
        if (provider === providers[providers.length - 1]) {
          throw new Error(`All AI providers failed. Last error: ${err.message}`);
        }
        continue;
      }
    }

    if (!enhancedData) {
      throw new Error('Unable to enhance job description');
    }

    console.log(`${'═'.repeat(70)}\n`);

    res.json({
      success: true,
      provider: usedProvider,
      description: enhancedData.description,
      key_responsibilities: enhancedData.key_responsibilities,
      requirements: enhancedData.requirements || '',
      qualifications: enhancedData.qualifications || '',
      nice_to_haves: enhancedData.nice_to_haves || '',
      missing_sections: enhancedData.missing_sections || [],
      enhancement_notes: enhancedData.enhancement_notes || '',
      original_summary: enhancedData.original_summary || ''
    });

  } catch (err) {
    console.error("\n❌ Job Description Enhancement Error:");
    console.error(`   ${err.message}\n`);
    res.status(500).json({ 
      error: "Failed to enhance job description",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to sanitize JSON (reuse from case-studies router)
function sanitizeJSON(jsonString) {
  try {
    if (!jsonString || typeof jsonString !== "string") {
      throw new Error("Input must be a non-empty string");
    }

    let cleaned = jsonString
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ''))
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.slice(firstBrace);
    }

    if (firstBrace === -1) {
      throw new Error("No JSON object found in response");
    }

    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }

    cleaned = cleaned
      .replace(/\\u(?![0-9a-fA-F]{4})/g, '\\u0000')
      .replace(/\\+$/g, '')
      .replace(/\\+"/g, '\\"')
      .replace(/[\t\r]/g, (match) => match === '\t' ? '\\t' : '\\r');

    let inString = false;
    let escaped = false;
    let result = '';
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (char === '\\' && !escaped) {
        escaped = true;
        result += char;
        continue;
      }
      
      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
        escaped = false;
        continue;
      }
      
      if (inString && !escaped) {
        if (char === '\n') {
          result += '\\n';
          continue;
        }
        if (char === '\r') {
          result += '\\r';
          continue;
        }
        if (char === '\t') {
          result += '\\t';
          continue;
        }
        if (char.charCodeAt(0) < 32 && char !== '\n' && char !== '\r' && char !== '\t') {
          continue;
        }
      }
      
      result += char;
      escaped = false;
    }
    
    cleaned = result;
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    const openBraces = (cleaned.match(/{/g) || []).length;
    const closeBraces = (cleaned.match(/}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/]/g) || []).length;
    
    if (openBraces > closeBraces) {
      cleaned += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      cleaned += ']'.repeat(openBrackets - closeBrackets);
    }

    try {
      return JSON.parse(cleaned);
    } catch (err1) {
      console.warn("⚠️ First parse attempt failed, trying recovery...");
      
      let lastValid = null;
      for (let i = cleaned.length; i > 0; i--) {
        try {
          const substr = cleaned.substring(0, i);
          const testStr = substr + '}'.repeat((substr.match(/{/g) || []).length - (substr.match(/}/g) || []).length);
          const parsed = JSON.parse(testStr);
          lastValid = parsed;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (lastValid) {
        console.warn("⚠️ Recovered partial JSON");
        return lastValid;
      }

      throw err1;
    }
  } catch (err) {
    console.error("❌ JSON Sanitization Error:", err.message);
    return null;
  }
}
module.exports = router;