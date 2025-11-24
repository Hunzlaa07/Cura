// controllers/assessmentsController.js
const db = require("../src/config/database");
const aiService = require("../services/aiService");
const axios = require("axios");
const fs = require("fs").promises;
require("dotenv").config();

const COPYLEAKS_EMAIL = process.env.COPYLEAKS_EMAIL;
const COPYLEAKS_API_KEY = process.env.COPYLEAKS_API_KEY;

// ============================================
// COPYLEAKS AI DETECTION
// ============================================
// SIMPLIFIED VERSION with better debugging
async function extractAnswerTexts(answers, uploadDir) {
  const fs = require('fs').promises;
  const path = require('path');
  
  let pdf, mammoth;
  try {
    pdf = require('pdf-parse');
    mammoth = require('mammoth');
  } catch (e) {
    console.warn('⚠️ Optional libraries not available');
  }
  
  const processedAnswers = [];
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    
    if (!answer) {
      processedAnswers.push({ type: 'text', content: '' });
      continue;
    }
    
    // Text answers - return as-is
    if (answer.type === 'text' || !answer.type) {
      const content = (answer.content && typeof answer.content === 'string') ? answer.content : '';
      console.log(`✅ Q${i + 1} TEXT: ${content.length} chars`);
      processedAnswers.push({
        type: 'text',
        content: content
      });
      continue;
    }
    
    // File answers - try to extract text
    if (answer.type === 'file' && answer.content) {
      let extractedText = '';
      let extractionSuccess = false;
      
      try {
        const filePath = answer.content;
        console.log(`\n📄 Q${i + 1} FILE: ${answer.fileName}`);
        console.log(`   Path: ${filePath}`);
        
        // Check if file exists
        let fileExists = false;
        try {
          await fs.access(filePath);
          fileExists = true;
          console.log(`   ✅ File exists`);
        } catch (accessErr) {
          console.warn(`   ❌ File not found at ${filePath}`);
          
          // Try alternative path
          const baseName = path.basename(filePath);
          const altPath = path.join(process.cwd(), 'uploads', baseName);
          try {
            await fs.access(altPath);
            console.log(`   ✅ Found at alternative path: ${altPath}`);
            filePath = altPath;
            fileExists = true;
          } catch {
            console.warn(`   ❌ Not found at alternative path either`);
          }
        }
        
        if (!fileExists) {
          console.warn(`   ⚠️ Skipping extraction - file not accessible`);
          processedAnswers.push({
            type: 'file',
            fileName: answer.fileName,
            fileSize: answer.fileSize,
            uploadedAt: answer.uploadedAt,
            content: answer.content, // Keep original content as fallback
            extractionSuccess: false
          });
          continue;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        console.log(`   📝 File type: ${ext}`);
        
        try {
          if (ext === '.pdf') {
            if (!pdf) throw new Error('pdf-parse not available');
            const fileData = await fs.readFile(filePath);
            const pdfData = await pdf(fileData);
            extractedText = (pdfData.text || '').trim();
            console.log(`   PDF extracted: ${extractedText.length} chars`);
            extractionSuccess = true;
          } 
          else if (ext === '.docx') {
            if (!mammoth) throw new Error('mammoth not available');
            const fileData = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer: fileData });
            extractedText = (result.value || '').trim();
            console.log(`   DOCX extracted: ${extractedText.length} chars`);
            extractionSuccess = true;
          } 
          else if (ext === '.doc') {
            console.log(`   🔄 Attempting DOC extraction...`);
            if (!mammoth) throw new Error('mammoth not available');
            const fileData = await fs.readFile(filePath);
            
            // Try mammoth first
            try {
              const result = await mammoth.extractRawText({ buffer: fileData });
              extractedText = (result.value || '').trim();
              if (extractedText.length > 0) {
                console.log(`   ✅ Mammoth DOC extraction: ${extractedText.length} chars`);
                extractionSuccess = true;
              } else {
                console.log(`   ⚠️ Mammoth returned empty, trying binary extraction`);
                // Fallback: basic binary extraction
                extractedText = fileData.toString('latin1')
                  .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                console.log(`   Binary extraction: ${extractedText.length} chars`);
                extractionSuccess = extractedText.length > 30;
              }
            } catch (mammothErr) {
              console.log(`   ⚠️ Mammoth failed, trying binary extraction`);
              extractedText = fileData.toString('latin1')
                .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              console.log(`   Binary extraction: ${extractedText.length} chars`);
              extractionSuccess = extractedText.length > 30;
            }
          } 
          else if (ext === '.txt') {
            const fileData = await fs.readFile(filePath, 'utf-8');
            extractedText = fileData.trim();
            console.log(`   TXT read: ${extractedText.length} chars`);
            extractionSuccess = true;
          }
          else {
            console.log(`   ⚠️ Unsupported format: ${ext}`);
          }
        } catch (extractErr) {
          console.error(`   ❌ Extraction error: ${extractErr.message}`);
          extractedText = '';
          extractionSuccess = false;
        }
        
      } catch (err) {
        console.error(`❌ Q${i + 1} file processing error:`, err.message);
        extractedText = '';
        extractionSuccess = false;
      }
      
      console.log(`   📊 Final: ${extractedText.length} chars, success: ${extractionSuccess}`);
      
      processedAnswers.push({
        type: 'file',
        fileName: answer.fileName,
        fileSize: answer.fileSize,
        uploadedAt: answer.uploadedAt,
        content: extractedText || answer.content, // Fallback to original if extraction failed
        extractionSuccess: extractionSuccess
      });
      
      continue;
    }
    
    // Fallback
    processedAnswers.push({ type: 'text', content: '' });
  }
  
  console.log('\n✅ Answer extraction complete');
  return processedAnswers;
}


const getCopyleaksToken = async () => {
  try {
    const response = await axios.post("https://id.copyleaks.com/v3/account/login/api", {
      email: COPYLEAKS_EMAIL,
      key: COPYLEAKS_API_KEY
    });

    const token =
      response.data.access_token ||
      response.data["access_token"] ||
      response.data[".access_token"];

    if (!token) throw new Error("Token not found in response");

    return token;
  } catch (error) {
    console.error("Error getting Copyleaks token:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Copyleaks");
  }
};

async function submitToCopyleaks(text, scanId, token) {
  try {
    console.log("🔍 Submitting text to Copyleaks...");

    const response = await axios.post(
      `https://api.copyleaks.com/v2/writer-detector/${scanId}/check`,
      { text, sandbox: false },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data;

    console.log("✅ Copyleaks AI Detection Result:");
    console.log(JSON.stringify(data, null, 2));

    return {
      scanId: data.scannedDocument.scanId,
      totalWords: data.scannedDocument.totalWords,
      classification: data.results[0].classification,
      probability: data.results[0].probability,
      summary: data.summary
    };
  } catch (error) {
    console.error("❌ Error submitting to Copyleaks:", error.response?.data || error.message);
    throw error;
  }
}

async function detectAIWithCopyleaks(text, questionNumber) {
  if (!text || text.trim().length === 0) {
    return { isAI: false, confidence: 0, source: "empty" };
  }

  try {
    const scanId = `q${questionNumber}_${Date.now()}`;
    const token = await getCopyleaksToken();

    console.log(`Submitting text to Copyleaks: ${scanId}`);
    const result = await submitToCopyleaks(text, scanId, token);

    const classification =
      result.classification === 2
        ? "AI"
        : result.classification === 0
        ? "Human"
        : "Mixed";

    const aiConfidence = (result.probability * 100).toFixed(2);

    return {
      isAI: classification === "AI",
      confidence: aiConfidence,
      classification,
      source: "Copyleaks",
      details: result
    };
  } catch (error) {
    console.error("Copyleaks detection error:", error.message);
    return detectAIPatterns(text);
  }
}

// IMPROVED: Advanced AI Pattern Detection
function detectAIPatterns(text) {
  if (!text || text.trim().length === 0) {
    return { isAI: false, confidence: 0, reasons: [], source: 'pattern', shortAnswer: true };
  }

  const trimmedText = text.trim();
  
  // Skip very short answers
  if (trimmedText.length < 20) {
    return { 
      isAI: false, 
      confidence: 0, 
      reasons: ['Too short to analyze'], 
      source: 'pattern',
      shortAnswer: true
    };
  }

  const reasons = [];
  let aiScore = 0;

  const lowerText = text.toLowerCase();
  const lines = text.split('\n').filter(l => l.trim());
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const sentenceCount = sentences.length;

  // ============================================
  // 1. AI PHRASES & FORMAL LANGUAGE
  // ============================================
  const aiPhrases = [
    // Explicit AI indicators
    'as an ai', 'as an artificial intelligence', 'i don\'t have personal', 'i cannot', 
    'i\'m sorry, but', 'i\'m an ai', 'as a language model', 'as a machine learning',
    'i don\'t have the ability', 'i don\'t possess', 'i\'m not able to',
    
    // Overly formal/corporate phrases
    'delve into', 'leverage', 'utilize', 'facilitate', 'implement', 'optimize',
    'synergy', 'paradigm', 'holistic', 'robust solution', 'comprehensive approach',
    'strategic framework', 'best practices', 'moving forward', 'at the end of the day',
    'in conclusion', 'in summary', 'to summarize', 'it is important to note',
    'it is worth noting', 'furthermore', 'moreover', 'in essence', 'fundamentally',
    
    // Business jargon
    'stakeholders', 'actionable insights', 'data-driven', 'innovative solution',
    'cutting-edge', 'next-generation', 'scalable approach', 'end-to-end',
    'value proposition', 'competitive advantage', 'key performance indicator',
  ];

  const foundPhrases = aiPhrases.filter(phrase => lowerText.includes(phrase));
  if (foundPhrases.length > 0) {
    const phraseCount = foundPhrases.length;
    aiScore += Math.min(phraseCount * 12, 60); // Cap at 60 points
    reasons.push(`${phraseCount} AI/formal phrases: "${foundPhrases.slice(0, 3).join('", "')}${phraseCount > 3 ? '..."' : '"'}`);
  }

  // ============================================
  // 2. NUMBERED/BULLET POINT STRUCTURE
  // ============================================
  const numberedLines = lines.filter(l => /^\d+[\.\)\-]|^[\*\-\•]\s/.test(l.trim()));
  if (numberedLines.length >= 3) {
    aiScore += 20;
    reasons.push(`${numberedLines.length} numbered/bulleted points (AI tends to over-structure)`);
  }

  // ============================================
  // 3. LACK OF CONTRACTIONS (Very typical of AI)
  // ============================================
  const contractions = /\b(don't|can't|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|shouldn't|wouldn't|couldn't|didn't|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've)\b/gi;
  const contractionCount = (text.match(contractions) || []).length;
  const hasNoContractions = contractionCount === 0;
  const hasVeryFewContractions = contractionCount <= 1 && sentenceCount >= 4 && text.length > 150;
  
  if (hasNoContractions && sentenceCount >= 4 && text.length > 150) {
    aiScore += 25;
    reasons.push('Zero contractions in long text (strong AI indicator)');
  } else if (hasVeryFewContractions) {
    aiScore += 12;
    reasons.push('Very few contractions in formal text');
  }

  // ============================================
  // 4. NO PERSONAL PRONOUNS (Major AI indicator)
  // ============================================
  const personalPronounsRegex = /\b(i|my|me|mine|we|our|us|our|yourself|myself)\b/gi;
  const personalPronounCount = (text.match(personalPronounsRegex) || []).length;
  
  if (wordCount > 80 && personalPronounCount === 0) {
    aiScore += 35; // High weight - humans typically reference themselves
    reasons.push('No personal pronouns in long response (humans usually say "I" or "my")');
  } else if (wordCount > 60 && personalPronounCount <= 1) {
    aiScore += 15;
    reasons.push('Very few personal references');
  }

  // ============================================
  // 5. PERFECT GRAMMAR & PUNCTUATION
  // ============================================
  const hasMultipleErrors = /\b[A-Z]{2,}\b/.test(text.toLowerCase()) || // All caps words
                           /\s{2,}/.test(text) || // Multiple spaces
                           /[,\.!?]{2,}/.test(text); // Multiple punctuation
  
  if (!hasMultipleErrors && sentenceCount >= 3) {
    aiScore += 10;
    reasons.push('Perfect grammar and punctuation (humans make typos)');
  }

  // ============================================
  // 6. OVERLY LONG SENTENCES
  // ============================================
  const avgWordsPerSentence = wordCount / (sentenceCount || 1);
  if (avgWordsPerSentence > 25) {
    aiScore += 15;
    reasons.push(`Average ${avgWordsPerSentence.toFixed(1)} words per sentence (AI writes longer sentences)`);
  }

  // ============================================
  // 7. GENERIC/TEMPLATE-LIKE STRUCTURE
  // ============================================
  const templateIndicators = [
    /^(based on|according to|in my opinion|i believe)/i,
    /^(the following|there are several|key points?)/i,
    /^(firstly|secondly|thirdly|finally)/i,
    /(in conclusion|in summary|to summarize|ultimately)/i
  ];
  
  const templateCount = templateIndicators.filter(regex => regex.test(text)).length;
  if (templateCount >= 2) {
    aiScore += 15;
    reasons.push(`${templateCount} template opening phrases`);
  }

  // ============================================
  // 8. LACK OF SPECIFIC DETAILS / EXAMPLES
  // ============================================
  const hasNumbers = /\d+/.test(text);
  const hasQuotes = /["']/.test(text);
  const hasSpecificExamples = /e\.g\.|for example|for instance|such as|like|specifically/i.test(text);
  
  if (!hasNumbers && !hasQuotes && !hasSpecificExamples && wordCount > 100) {
    aiScore += 10;
    reasons.push('No specific examples, numbers, or quotes (generic response)');
  }

  // ============================================
  // 9. REPETITIVE SENTENCE STRUCTURES
  // ============================================
  const sentenceStarts = sentences
    .map(s => s.trim().split(/\s+/)[0].toLowerCase())
    .filter(s => s.length > 0);
  
  const uniqueStarts = new Set(sentenceStarts);
  const repetitionRatio = 1 - (uniqueStarts.size / (sentenceCount || 1));
  
  if (repetitionRatio > 0.4 && sentenceCount >= 4) {
    aiScore += 12;
    reasons.push('Repetitive sentence structures');
  }

  // ============================================
  // 10. FILLER WORDS & HEDGING LANGUAGE
  // ============================================
  const fillerWords = /\b(actually|basically|essentially|literally|generally|clearly|obviously|definitely|certainly|perhaps|maybe|might|could|somewhat|quite|rather|fairly|relatively|comparatively)\b/gi;
  const fillerCount = (text.match(fillerWords) || []).length;
  
  if (fillerCount > 3) {
    aiScore += 10;
    reasons.push(`${fillerCount} filler/hedging words (AI overuses these)`);
  }

  // ============================================
  // BONUS: HUMAN INDICATORS (Reduce score)
  // ============================================
  const humanIndicators = [
    /\b(honestly|frankly|truthfully|i think|in my experience|from my experience|my perspective|i experienced|i learned|i discovered)\b/gi,
    /\b(unfortunately|sadly|surprisingly|interestingly|annoying|frustrating|excited|thrilled)\b/gi, // Emotions
    /\b([a-z]+ly)\s+(i|we|this|that)\b/gi, // Adverbs before pronouns (conversational)
  ];
  
  const humanCount = humanIndicators.reduce((sum, regex) => sum + (text.match(regex) || []).length, 0);
  if (humanCount > 0) {
    aiScore = Math.max(0, aiScore - (humanCount * 5));
    reasons.push(`-${humanCount * 5} pts: Found conversational/emotional language`);
  }

  // ============================================
  // CALCULATE FINAL CONFIDENCE
  // ============================================
  const isAI = aiScore >= 40;
  let confidence = Math.min(aiScore, 100);

  // Adjust confidence based on text characteristics
  if (aiScore >= 60 && hasNoContractions && personalPronounCount === 0) {
    confidence = Math.min(95, aiScore + 10); // Very high confidence
  }

  return {
    isAI: isAI,
    confidence: confidence,
    score: aiScore,
    reasons: reasons,
    source: 'pattern',
    stats: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
      personalPronounCount,
      contractionCount,
      numberedPoints: numberedLines.length
    }
  };
}

// ============================================
// ANSWER PROCESSING
// ============================================

async function processAnswers(answers) {
  const processedAnswers = [];
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    
    if (answer.type === 'file' && answer.content) {
      try {
        console.log(`📄 Processing file answer for question ${i + 1}: ${answer.fileName}`);
        
        const content = answer.content || '';
        
        processedAnswers.push({
          type: 'file',
          fileName: answer.fileName,
          fileSize: answer.fileSize,
          uploadedAt: answer.uploadedAt,
          content: content,
          filePath: answer.filePath
        });
        
        console.log(`✅ File processed: ${answer.fileName} - ${content.length} characters`);
        
      } catch (err) {
        console.error(`❌ Error processing file for question ${i + 1}:`, err.message);
        processedAnswers.push({
          type: 'file',
          fileName: answer.fileName,
          content: '[Could not extract text from file]'
        });
      }
      
    } else if (answer.type === 'text') {
      processedAnswers.push({
        type: 'text',
        content: answer.content || ''
      });
    }
  }
  
  return processedAnswers;
}

// ============================================
// MAIN CONTROLLER FUNCTIONS
// ============================================

// ============================================
// COMPLETE UPDATED FUNCTIONS
// ============================================

// ============================================
// COMPLETE UPDATED FUNCTIONS
// ============================================

// ============================================
// COMPLETE UPDATED FUNCTIONS
// ============================================

// ============================================
// ASYNC EVALUATION FUNCTION
// ============================================

async function triggerAsyncEvaluation(submissionId) {
  try {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`⏳ ASYNC EVALUATION TRIGGERED`);
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   Started: ${new Date().toISOString()}`);
    console.log(`${'═'.repeat(70)}\n`);
    
    const [submissions] = await db.query(
      `SELECT 
        f.*,
        COALESCE(u.full_name, ja.full_name) as applicant_name,
        COALESCE(u.email, ja.email) as applicant_email,
        COALESCE(ap.title, ja.last_job_title) as applicant_title,
        COALESCE(ap.bio, ja.additional_info) as applicant_bio,
        COALESCE(ap.years_of_experience, 0) as experience_years,
        j.title as job_title,
        j.description as job_description,
        j.key_responsibilities,
        j.experience_level,
        j.department,
        cs.title as case_study_title,
        cs.description as case_study_description,
        cs.enable_psychometrics,
        cs.psychometric_types
      FROM feedbacks f
      LEFT JOIN applicant_profiles ap ON f.applicant_id = ap.id
      LEFT JOIN users u ON ap.user_id = u.id
      LEFT JOIN job_applications ja ON f.job_application_id = ja.id
      LEFT JOIN jobs j ON f.job_id = j.id
      LEFT JOIN case_studies cs ON f.case_study_id = cs.id
      WHERE f.id = ?`,
      [submissionId]
    );

    if (!submissions || submissions.length === 0) {
      console.error(`❌ Submission ${submissionId} not found`);
      return;
    }

    const submission = submissions[0];

    if (submission.result_generated === 1) {
      console.log(`⚠️ Result already generated for submission ${submissionId}`);
      return;
    }

    const positionTitle = submission.job_title || submission.case_study_title || 'Case Study Assessment';
    console.log(`📋 Candidate: ${submission.applicant_name || 'Unknown'}`);
    console.log(`   Position: ${positionTitle}\n`);

    let answers = [];
    
    try {
      const parsedAnswers = typeof submission.answers === 'string' ? JSON.parse(submission.answers) : submission.answers;
      answers = parsedAnswers.map(ans => ans.content && (ans.content.includes('[Error') || ans.content.includes('[File could not')) ? '' : (ans.content || ''));
    } catch (e) {
      console.error('Error parsing answers:', e);
      return;
    }

    const [questionRows] = await db.query(
      'SELECT question FROM case_study_questions WHERE case_study_id = ? ORDER BY id',
      [submission.case_study_id]
    );
    const questions = questionRows.map(q => q.question);

    // FETCH JOB SKILLS (if job_id exists)
    console.log('🔧 Fetching job skills...');
    let requiredSkillsList = [];
    if (submission.job_id) {
      const [jobSkills] = await db.query(
        `SELECT s.id, s.name, s.category, js.is_required, js.minimum_proficiency 
         FROM job_skills js 
         JOIN skills s ON s.id = js.skill_id 
         WHERE js.job_id = ?`,
        [submission.job_id]
      );
      requiredSkillsList = jobSkills.map(skill => ({
        name: skill.name,
        category: skill.category,
        is_required: skill.is_required === 1 || skill.is_required === true,
        minimum_proficiency: skill.minimum_proficiency
      }));
      console.log(`✅ Found ${requiredSkillsList.length} job skills`);
    } else {
      console.log('⚠️ Assessment case study - no job attached, skills will be empty');
    }

    // FETCH PSYCHOMETRICS FROM CASE STUDY (THIS IS THE KEY PART!)
    console.log('🧠 Fetching psychometrics from case study...');
    let psychometricsList = [];
    let enablePsychometrics = false;
    
    if (submission.enable_psychometrics === 1 || submission.enable_psychometrics === true) {
      enablePsychometrics = true;
      try {
        // Parse the psychometric_types JSON
        const psychometricTypesRaw = submission.psychometric_types;
        let psychoTypes = [];
        
        if (typeof psychometricTypesRaw === 'string') {
          psychoTypes = JSON.parse(psychometricTypesRaw);
        } else if (Array.isArray(psychometricTypesRaw)) {
          psychoTypes = psychometricTypesRaw;
        }
        
        console.log(`✅ Psychometrics enabled: ${psychoTypes.join(', ')}`);
        
        // Map psychometric types to detailed descriptors
        const psychometricDetails = {
          cognitiveAbility: {
            name: 'Cognitive Ability',
            description: 'Analytical thinking, logical reasoning, pattern recognition',
            weight: 1
          },
          personalityTraits: {
            name: 'Personality & Behavioral Traits',
            description: 'Communication style, collaboration, interpersonal dynamics',
            weight: 1
          },
          decisionMaking: {
            name: 'Decision Making Style',
            description: 'Decision-making under pressure, risk tolerance, prioritization',
            weight: 1
          },
          problemSolving: {
            name: 'Problem Solving Approach',
            description: 'Structured methodology, creativity, root cause analysis',
            weight: 1
          },
          leadershipPotential: {
            name: 'Leadership & Strategic Thinking',
            description: 'Team management, strategic vision, delegation, organizational impact',
            weight: 1
          }
        };
        
        psychometricsList = psychoTypes
          .map(type => psychometricDetails[type])
          .filter(Boolean);
        
        console.log(`✅ Found ${psychometricsList.length} psychometrics to evaluate`);
      } catch (e) {
        console.warn('⚠️ Error parsing psychometric types:', e);
        psychometricsList = [];
      }
    } else {
      console.log('ℹ️ Psychometrics not enabled for this case study');
    }

    console.log('🔍 Running AI detection on answers...');
    const aiDetectionResults = [];
    
    for (let i = 0; i < answers.length; i++) {
      const answerText = answers[i];
      
      if (!answerText || answerText.trim().length < 50) {
        aiDetectionResults.push({ isAI: false, confidence: 0, source: "skipped" });
        continue;
      }
      
      if (answerText.trim().length < 100) {
        aiDetectionResults.push(detectAIPatterns(answerText));
        continue;
      }
      
      try {
        aiDetectionResults.push(await detectAIWithCopyleaks(answerText, i + 1));
      } catch (err) {
        console.warn(`⚠️ Q${i + 1}: Copyleaks failed, using pattern detection`);
        aiDetectionResults.push(detectAIPatterns(answerText));
      }
    }
    
    const aiDetectedCount = aiDetectionResults.filter(r => r.isAI && r.source !== 'skipped').length;
    const totalProcessedAnswers = aiDetectionResults.filter(r => r.source !== 'skipped').length;
    const avgConfidence = aiDetectionResults.filter(r => r.source !== 'skipped').reduce((sum, r) => sum + parseFloat(r.confidence || 0), 0) / (totalProcessedAnswers || 1);
    
    console.log(`✅ AI Detection Complete\n`);

    const generateEvaluation = async (language) => {
      console.log(`🌍 Generating ${language} evaluation...`);
      
      const aiDetectionSummary = aiDetectionResults
        .map((result, idx) => {
          if (result.source === 'skipped') return null;
          const prob = parseFloat(result.confidence || 0).toFixed(1);
          return `Q${idx + 1}: ${prob}% AI probability (${result.source})`;
        })
        .filter(Boolean)
        .join('\n');
      
      const hasAIDetection = aiDetectedCount > 0;
      const aiWarning = hasAIDetection 
        ? `⚠️ ALERT: ${aiDetectedCount} out of ${totalProcessedAnswers} answers flagged as AI-generated (${avgConfidence.toFixed(1)}% average confidence)`
        : '';
      
      // BUILD PSYCHOMETRICS SECTION
      const psychometricsSection = psychometricsList.length > 0 
        ? `

PSYCHOMETRICS TO EVALUATE (${psychometricsList.length} total):
${psychometricsList.map((p, idx) => `${idx + 1}. ${p.name} - ${p.description}`).join('\n')}

CRITICAL INSTRUCTIONS FOR PSYCHOMETRICS:
- You MUST evaluate ALL ${psychometricsList.length} psychometrics listed above
- For EACH psychometric, provide:
  * A score from 0-10 (0=no evidence, 5=moderate evidence, 10=exceptional evidence)
  * Specific evidence/quotes from the candidate's answers supporting this score
  * Clear explanation of WHY you assigned this score
- Even if a psychometric is not directly addressed, score based on implicit evidence in answers
- If insufficient evidence, still score (with lower score and explain why)`
        : '';

      // BUILD SKILLS SECTION
      const skillsSection = requiredSkillsList.length > 0
        ? `

TECHNICAL SKILLS TO EVALUATE (${requiredSkillsList.length} total):
${requiredSkillsList.map((s, idx) => `${idx + 1}. ${s.name} (Category: ${s.category}, Required: ${s.is_required ? 'Yes' : 'No'})`).join('\n')}

For EACH skill, provide:
- A score from 0-10 based on evidence in answers
- Specific evidence/quotes from the candidate's responses
- Assessment of proficiency level`
        : '';

      const prompt = `You are a STRICT and CRITICAL Technical Recruiter evaluating case study submissions.

CRITICAL EVALUATION STANDARDS:
- ONE-LINERS: Maximum 30/100
- VAGUE ANSWERS: Maximum 50/100
- MISSING PRIORITIZATION: -20 minimum
- NO METRICS: -15 points
- NO IMPLEMENTATION: -15 points

SCORING RUBRIC:
- 90-100: Exceptional - Detailed, strategic, prioritized, with metrics and implementation
- 75-89: Good - Comprehensive with most elements
- 60-74: Acceptable - Main points but lacks depth
- 40-59: Poor - Superficial, missing elements
- 0-39: Unacceptable - One-liners or irrelevant

⚠️ AI DETECTION RESULTS:
${aiWarning}

Detailed AI Detection per Question:
${aiDetectionSummary || 'No AI detected in any answers'}

${hasAIDetection ? `
IMPORTANT: When providing feedback, YOU MUST mention AI detection if confidence is above 60%.
For questions with high AI probability (>70%), your feedback MUST include:
- "⚠️ This answer shows high probability of AI-generated content (XX%)"
` : ''}

${psychometricsSection}

${skillsSection}

CRITICAL: ALL TEXT FEEDBACK MUST BE IN ${language}.

JOB/ASSESSMENT: ${submission.job_title || submission.case_study_title}
CANDIDATE: ${submission.applicant_name || 'Not provided'}

QUESTIONS AND ANSWERS:
${questions.map((q, i) => {
  const aiInfo = aiDetectionResults[i];
  const aiNote = aiInfo && aiInfo.source !== 'skipped' && aiInfo.confidence > 60
    ? ` [⚠️ AI Detection: ${parseFloat(aiInfo.confidence).toFixed(1)}%]`
    : '';
  return `Q${i+1}: ${q}${aiNote}\nA: ${answers[i] || 'NO ANSWER'}`;
}).join('\n\n')}

RETURN ONLY VALID JSON (no markdown, no explanations):
{
  "overall_score": <0-100>,
  "rating": "<Poor|Fair|Good|Excellent>",
  "ai_detected": ${hasAIDetection},
  "recruiter_feedback": "<Comprehensive feedback in ${language}>",
  "question_scores": [${questions.map((q, i) => {
    const aiInfo = aiDetectionResults[i] || { isAI: false, confidence: 0 };
    return `{
      "question_number": ${i+1}, 
      "score": <0-100>, 
      "feedback": "<Detailed feedback in ${language}${aiInfo.confidence > 60 ? ' - mention AI detection' : ''}>"
    }`;
  }).join(',')}],
  "skill_scores": [${requiredSkillsList.map(s => `{
    "skill_name": "${s.name}", 
    "category": "${s.category}",
    "score": <0-10>, 
    "evidence": "<Specific evidence from answers in ${language}>",
    "is_required": ${s.is_required}
  }`).join(',')}],
  "psychometric_scores": [${psychometricsList.map(p => `{
    "name": "${p.name}",
    "description": "${p.description}",
    "score": <0-10 with evidence>,
    "evidence": "<Specific evidence from answers in ${language}>"
  }`).join(',')}],
  "final_recommendation": "<Hire|Interview|Review|Reject>"
}`;

      console.log('🤖 Sending prompt to Claude API...');
      let aiResponse = await aiService.generateContent(prompt);
      aiResponse = aiResponse.replace(/^\uFEFF/, '').replace(/,(\s*[}\]])/g, '$1').trim();

      let evaluation;
      try {
        evaluation = JSON.parse(aiResponse);
      } catch {
        const match = aiResponse.match(/\{[\s\S]*\}/);
        if (match) {
          evaluation = JSON.parse(match[0]);
        } else {
          throw new Error('Failed to parse JSON response');
        }
      }

      // VALIDATE AND FIX PSYCHOMETRIC SCORES
      if (!evaluation.psychometric_scores) {
        evaluation.psychometric_scores = [];
      }

      const scoredPsychoNames = evaluation.psychometric_scores.map(p => p.name.toLowerCase());
      const missingPsychos = psychometricsList.filter(p => 
        !scoredPsychoNames.includes(p.name.toLowerCase())
      );

      if (missingPsychos.length > 0) {
        console.warn(`⚠️ Missing ${missingPsychos.length} psychometric scores, adding defaults`);
        missingPsychos.forEach(psycho => {
          evaluation.psychometric_scores.push({
            name: psycho.name,
            description: psycho.description,
            score: 0,
            evidence: `Insufficient evidence found in answers for ${psycho.name}`
          });
        });
      }

      console.log(`   📊 Psychometric Scores: ${evaluation.psychometric_scores.length}`);

      // VALIDATE AND FIX SKILL SCORES
      if (!evaluation.skill_scores) {
        evaluation.skill_scores = [];
      }

      const scoredSkillNames = evaluation.skill_scores.map(s => s.skill_name.toLowerCase());
      const missingSkills = requiredSkillsList.filter(s => 
        !scoredSkillNames.includes(s.name.toLowerCase())
      );

      if (missingSkills.length > 0) {
        console.warn(`⚠️ Missing ${missingSkills.length} skill scores, adding defaults`);
        missingSkills.forEach(skill => {
          evaluation.skill_scores.push({
            skill_name: skill.name,
            category: skill.category,
            score: 0,
            evidence: `No evidence found in answers for ${skill.name}`,
            is_required: skill.is_required
          });
        });
      }

      console.log(`   🔧 Skill Scores: ${evaluation.skill_scores.length}`);

      // VALIDATE QUESTION SCORES
      if (evaluation.question_scores && Array.isArray(evaluation.question_scores)) {
        for (let qIdx = 0; qIdx < evaluation.question_scores.length; qIdx++) {
          const qScore = evaluation.question_scores[qIdx];
          const answerLength = answers[qIdx]?.length || 0;
          const question = questions[qIdx] || '';
          const isComplexQuestion = /priorit|strateg|explain|how|why|discuss|analyze/i.test(question);
          const isOneLiner = answerLength < 100 && (answers[qIdx] || '').split('\n').length <= 2;
          
          if (isComplexQuestion && isOneLiner) {
            qScore.score = Math.min(qScore.score || 0, 35);
            qScore.feedback = (qScore.feedback || '') + '\n\n⚠️ Answer is too brief for this complex question.';
          }
          
          const aiInfo = aiDetectionResults[qIdx];
          if (aiInfo && aiInfo.confidence > 60 && !qScore.feedback.includes('AI')) {
            const aiWarningText = language === 'Arabic'
              ? `\n\n⚠️ احتمال عالي لمحتوى مُنشأ بواسطة الذكاء الاصطناعي (${parseFloat(aiInfo.confidence).toFixed(1)}%)`
              : `\n\n⚠️ High probability of AI-generated content (${parseFloat(aiInfo.confidence).toFixed(1)}%)`;
            qScore.feedback = (qScore.feedback || '') + aiWarningText;
          }
        }
      }

      // Calculate overall score from question scores
      if (evaluation.question_scores?.length > 0) {
        const avg = Math.round(
          evaluation.question_scores.reduce((sum, q) => sum + (q.score || 0), 0) / 
          evaluation.question_scores.length
        );
        evaluation.overall_score = avg;
        evaluation.rating = avg >= 85 ? 'Excellent' : avg >= 75 ? 'Good' : avg >= 55 ? 'Fair' : 'Poor';
        evaluation.final_recommendation = avg >= 75 ? 'Interview' : avg >= 60 ? 'Review' : 'Reject';
      }

      console.log(`   ✅ ${language}: ${evaluation.overall_score}/100 (${evaluation.rating})`);
      console.log(`   🧠 Psychometrics: ${evaluation.psychometric_scores?.length || 0} | 🔧 Skills: ${evaluation.skill_scores?.length || 0}`);
      return evaluation;
    };

    const evaluationEN = await generateEvaluation('English');
    const evaluationAR = await generateEvaluation('Arabic');

    // Merge AI detection
    if (evaluationEN.question_scores && Array.isArray(evaluationEN.question_scores)) {
      evaluationEN.question_scores = evaluationEN.question_scores.map((qScore, idx) => {
        const aiResult = aiDetectionResults[idx] || { isAI: false, confidence: 0, source: 'unknown' };
        return {
          ...qScore,
          ai_suspected: aiResult.isAI || false,
          ai_probability: parseFloat(aiResult.confidence || 0)
        };
      });
    }

    if (evaluationAR.question_scores && Array.isArray(evaluationAR.question_scores)) {
      evaluationAR.question_scores = evaluationAR.question_scores.map((qScore, idx) => {
        const aiResult = aiDetectionResults[idx] || { isAI: false, confidence: 0, source: 'unknown' };
        return {
          ...qScore,
          ai_suspected: aiResult.isAI || false,
          ai_probability: parseFloat(aiResult.confidence || 0)
        };
      });
    }

    const overallAIDetected = aiDetectedCount > 0;

    console.log('✅ Evaluation complete - saving to database');
    console.log(`   EN: Score ${evaluationEN.overall_score} | Psychometrics: ${evaluationEN.psychometric_scores?.length} | Skills: ${evaluationEN.skill_scores?.length}`);
    console.log(`   AR: Score ${evaluationAR.overall_score} | Psychometrics: ${evaluationAR.psychometric_scores?.length} | Skills: ${evaluationAR.skill_scores?.length}`);

    await db.query(
      `UPDATE feedbacks SET 
        score = ?, 
        rating = ?, 
        feedback_text = ?, 
        feedback_text_ar = ?, 
        ai_detected = ?, 
        question_scores = ?, 
        question_scores_ar = ?, 
        skill_scores = ?, 
        skill_scores_ar = ?, 
        psychometric_scores = ?,
        psychometric_scores_ar = ?,
        final_recommendation = ?, 
        result_generated = 1, 
        status = 'completed', 
        updated_at = NOW() 
      WHERE id = ?`,
      [
        evaluationEN.overall_score, 
        evaluationEN.rating, 
        evaluationEN.recruiter_feedback, 
        evaluationAR.recruiter_feedback, 
        overallAIDetected,
        JSON.stringify(evaluationEN.question_scores || []), 
        JSON.stringify(evaluationAR.question_scores || []), 
        JSON.stringify(evaluationEN.skill_scores || []), 
        JSON.stringify(evaluationAR.skill_scores || []),
        JSON.stringify(evaluationEN.psychometric_scores || []),
        JSON.stringify(evaluationAR.psychometric_scores || []),
        evaluationEN.final_recommendation || 'Review', 
        submissionId
      ]
    );

    console.log(`${'═'.repeat(70)}`);
    console.log(`✅ ASYNC EVALUATION COMPLETE`);
    console.log(`   Score: ${evaluationEN.overall_score}/100 | Rating: ${evaluationEN.rating}`);
    console.log(`   Psychometrics: ${evaluationEN.psychometric_scores?.length} | Skills: ${evaluationEN.skill_scores?.length}`);
    console.log(`${'═'.repeat(70)}\n`);

  } catch (err) {
    console.error(`❌ ASYNC EVALUATION ERROR:`, err.message);
  }
}

// ============================================
// MAIN CONTROLLER FUNCTIONS
// ============================================

exports.submitAssessment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log('🚀 START: submitAssessment');

    const user = req.user;
    const { case_study_id, answers, job_id } = req.body;

    let applicantId, jobApplicationId = null;

    if (user.user_type === 'case_study_applicant') {
      jobApplicationId = user.case_study_session.job_application_id;
      applicantId = jobApplicationId;
    } else {
      const [applicantProfile] = await connection.query(`SELECT ap.id FROM applicant_profiles ap WHERE ap.user_id = ?`, [user.id]);
      if (!applicantProfile?.length) {
        await connection.rollback();
        return res.status(404).json({ error: 'Applicant profile not found' });
      }
      applicantId = applicantProfile[0].id;
      
      // Handle both job-based and assessment-based case studies
      if (job_id) {
        // Job-based case study
        const [appRows] = await connection.query('SELECT id FROM job_applications WHERE user_id = ? AND job_id = ?', [user.id, job_id]);
        if (!appRows?.length) {
          await connection.rollback();
          return res.status(404).json({ error: 'Job application not found' });
        }
        jobApplicationId = appRows[0].id;
      } else {
        // Assessment-based case study - find job_application with NULL job_id linked to this case study
        const [appRows] = await connection.query(
          `SELECT ja.id FROM job_applications ja
           JOIN case_study_invitations csi ON ja.id = csi.job_application_id
           WHERE ja.user_id = ? AND ja.job_id IS NULL AND csi.case_study_id = ?`,
          [user.id, case_study_id]
        );
        if (!appRows?.length) {
          await connection.rollback();
          return res.status(404).json({ error: 'Assessment application not found' });
        }
        jobApplicationId = appRows[0].id;
      }
    }

    const [caseStudyRows] = await connection.query('SELECT * FROM case_studies WHERE id = ?', [case_study_id]);
    if (!caseStudyRows?.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Case study not found' });
    }
    const caseStudy = caseStudyRows[0];

    console.log('📄 Extracting text from files...');
    let extractedAnswers = answers;
    if (answers.some(a => a?.type === 'file')) {
      try {
        extractedAnswers = await extractAnswerTexts(answers, '/uploads');
      } catch (err) {
        console.warn('⚠️ Extraction error:', err.message);
      }
    }

    const processedAnswers = [];
    const answerValidation = [];
    
    for (let i = 0; i < extractedAnswers.length; i++) {
      const answer = extractedAnswers[i];
      if (!answer) {
        processedAnswers.push({ type: 'text', content: '' });
        answerValidation.push({ isValid: false });
        continue;
      }
      
      if (answer.type === 'text' || !answer.type) {
        const textContent = (answer.content && typeof answer.content === 'string') ? answer.content : '';
        const isValid = textContent.trim().length > 0 && !['na', 'n/a'].includes(textContent.trim().toLowerCase());
        processedAnswers.push({ type: 'text', content: textContent });
        answerValidation.push({ isValid });
      } else if (answer.type === 'file' && answer.content) {
        const isValid = answer.content.length > 50 && !answer.content.includes('[Error');
        processedAnswers.push({ type: 'file', fileName: answer.fileName, fileSize: answer.fileSize, uploadedAt: answer.uploadedAt, content: answer.content, extractionSuccess: answer.extractionSuccess });
        answerValidation.push({ isValid });
      }
    }

    if (!answerValidation.some(v => v.isValid)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Please provide answers to at least one question' });
    }

    await connection.query(`UPDATE case_study_invitations SET status = 'completed', completed_at = NOW() WHERE job_application_id = ? AND case_study_id = ?`, [jobApplicationId, case_study_id]);
    await connection.query('UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?', ['case_study_completed', jobApplicationId]);

    const answerContent = JSON.stringify(processedAnswers);
    let insertResult;
    
    if (user.user_type === 'case_study_applicant') {
      [insertResult] = await connection.query(`INSERT INTO feedbacks (job_application_id, job_id, case_study_id, title, submitted_time, answers, status, result_generated, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), ?, 'pending', 0, NOW(), NOW())`, [jobApplicationId, job_id, case_study_id, caseStudy.title, answerContent]);
    } else {
      [insertResult] = await connection.query(`INSERT INTO feedbacks (applicant_id, job_application_id, job_id, case_study_id, title, submitted_time, answers, status, result_generated, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), ?, 'pending', 0, NOW(), NOW())`, [applicantId, jobApplicationId, job_id, case_study_id, caseStudy.title, answerContent]);
    }

    await connection.commit();
    const submissionId = insertResult.insertId;

    res.json({
      message: '✅ Assessment submitted successfully!',
      submission_id: submissionId,
      note: 'Your answers have been saved.',
      answersProcessed: processedAnswers.length,
      validAnswers: answerValidation.filter(v => v.isValid).length
    });

    setImmediate(() => {
      triggerAsyncEvaluation(submissionId).catch(err => {
        console.error(`Async evaluation error:`, err.message);
      });
    });

  } catch (err) {
    await connection.rollback();
    console.error('❌ Error submitting assessment:', err);
    res.status(500).json({ error: 'Failed to submit assessment', details: err.message });
  } finally {
    connection.release();
    console.log('🔚 END: submitAssessment\n');
  }
};

exports.generateResult = async (req, res) => {
  try {
    const { submissionId } = req.params;
    res.json({ success: true, message: 'Result generation queued' });
    
    setImmediate(() => {
      triggerAsyncEvaluation(submissionId).catch(err => {
        console.error(`Manual generation error:`, err.message);
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate result', details: err.message });
  }
};

exports.getRecruiterSubmissions = async (req, res) => {
  try {
    const user = req.user;

    if (user.user_type !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can view submissions' });
    }

    const [recruiterProfile] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [user.id]
    );

    if (!recruiterProfile || recruiterProfile.length === 0) {
      return res.status(404).json({ error: 'Recruiter profile not found' });
    }

    const recruiterId = recruiterProfile[0].id;

    const [submissions] = await db.query(
      `SELECT 
        f.id,
        f.applicant_id,
        f.job_application_id,
        f.job_id,
        f.case_study_id,
        f.title as case_study_title,
        f.submitted_time,
        f.score,
        f.rating,
        f.answers,
        f.feedback_text,
        f.feedback_text_ar,
        f.ai_detected,
        f.question_scores,
        f.question_scores_ar,
        f.skill_scores,
        f.skill_scores_ar,
        f.psychometric_scores,
        f.psychometric_scores_ar,
        f.final_recommendation,
        f.status,
        f.result_generated,
        f.submission_method,
        COALESCE(u.full_name, ja.full_name) as applicant_name,
        COALESCE(u.email, ja.email) as applicant_email,
        COALESCE(ap.title, ja.last_job_title) as applicant_title,
        j.title as job_title,
        cs.title as case_study_title_fallback
      FROM feedbacks f
      LEFT JOIN applicant_profiles ap ON f.applicant_id = ap.id
      LEFT JOIN users u ON ap.user_id = u.id
      LEFT JOIN job_applications ja ON f.job_application_id = ja.id
      LEFT JOIN jobs j ON f.job_id = j.id
      LEFT JOIN case_studies cs ON f.case_study_id = cs.id
      WHERE (j.recruiter_id = ? OR (f.job_id IS NULL AND cs.user_id = ?))
      ORDER BY f.submitted_time DESC`,
      [recruiterId, user.id]
    );

    for (let submission of submissions) {
      // Use case_study_title_fallback if job_title is null (for assessments)
      if (!submission.job_title && submission.case_study_title_fallback) {
        submission.job_title = submission.case_study_title_fallback;
      }
      
      const [questions] = await db.query(
        'SELECT question FROM case_study_questions WHERE case_study_id = ? ORDER BY id',
        [submission.case_study_id]
      );
      submission.questions = questions.map(q => q.question);

      try {
        if (typeof submission.answers === "string") {
          submission.answers = JSON.parse(submission.answers);
        }
        if (typeof submission.question_scores === "string") {
          submission.question_scores = JSON.parse(submission.question_scores);
        }
        if (typeof submission.question_scores_ar === "string") {
          submission.question_scores_ar = JSON.parse(submission.question_scores_ar);
        }
        if (typeof submission.skill_scores === "string") {
          submission.skill_scores = JSON.parse(submission.skill_scores);
        }
        if (typeof submission.skill_scores_ar === "string") {
          submission.skill_scores_ar = JSON.parse(submission.skill_scores_ar);
        }
        // ADD THESE 2 LINES:
        if (typeof submission.psychometric_scores === "string") {
          submission.psychometric_scores = JSON.parse(submission.psychometric_scores);
        }
        if (typeof submission.psychometric_scores_ar === "string") {
          submission.psychometric_scores_ar = JSON.parse(submission.psychometric_scores_ar);
        }
        if (typeof submission.submission_method === "string") {
          submission.submission_method = JSON.parse(submission.submission_method);
        }
        
        // DEBUG LOGGING
        console.log(`✅ Submission ${submission.id} parsed:`, {
          hasQuestionScores: !!submission.question_scores?.length,
          hasSkillScores: !!submission.skill_scores?.length,
          hasPsychometricScores: !!submission.psychometric_scores?.length,
          psychometricCount: Array.isArray(submission.psychometric_scores) ? submission.psychometric_scores.length : 0
        });
        
      } catch (e) {
        console.error("Error parsing JSON for submission", submission.id, e);
      }

      submission.requires_attention = submission.ai_detected || submission.score < 40;
    }
    
    res.json(submissions);

  } catch (err) {
    console.error('Error fetching recruiter submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

exports.getSubmissionDetail = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.user_type !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can view submission details' });
    }

    const [submissions] = await db.query(
      `SELECT 
        f.*,
        COALESCE(u.full_name, ja.full_name) as applicant_name,
        COALESCE(u.email, ja.email) as applicant_email,
        COALESCE(ap.title, ja.last_job_title) as applicant_title,
        j.title as job_title,
        cs.title as case_study_title_fallback
      FROM feedbacks f
      LEFT JOIN applicant_profiles ap ON f.applicant_id = ap.id
      LEFT JOIN users u ON ap.user_id = u.id
      LEFT JOIN job_applications ja ON f.job_application_id = ja.id
      LEFT JOIN jobs j ON f.job_id = j.id
      LEFT JOIN case_studies cs ON f.case_study_id = cs.id
      WHERE f.id = ?`,
      [id]
    );

    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissions[0];

    // Use case_study_title_fallback if job_title is null (for assessments)
    if (!submission.job_title && submission.case_study_title_fallback) {
      submission.job_title = submission.case_study_title_fallback;
    }

    const [questions] = await db.query(
      'SELECT question FROM case_study_questions WHERE case_study_id = ? ORDER BY id',
      [submission.case_study_id]
    );
    submission.questions = questions.map(q => q.question);

    try {
      if (typeof submission.answers === "string") {
        submission.answers = JSON.parse(submission.answers);
      }
      if (typeof submission.question_scores === "string") {
        submission.question_scores = JSON.parse(submission.question_scores);
      }
      if (typeof submission.question_scores_ar === "string") {
        submission.question_scores_ar = JSON.parse(submission.question_scores_ar);
      }
      if (typeof submission.skill_scores === "string") {
        submission.skill_scores = JSON.parse(submission.skill_scores);
      }
      if (typeof submission.skill_scores_ar === "string") {
        submission.skill_scores_ar = JSON.parse(submission.skill_scores_ar);
      }
      // ADD THESE 2 LINES:
      if (typeof submission.psychometric_scores === "string") {
        submission.psychometric_scores = JSON.parse(submission.psychometric_scores);
      }
      if (typeof submission.psychometric_scores_ar === "string") {
        submission.psychometric_scores_ar = JSON.parse(submission.psychometric_scores_ar);
      }
      if (typeof submission.submission_method === "string") {
        submission.submission_method = JSON.parse(submission.submission_method);
      }
      
      console.log(`✅ Submission detail ${submission.id}:`, {
        hasPsychometricScores: !!submission.psychometric_scores?.length,
        psychometricCount: Array.isArray(submission.psychometric_scores) ? submission.psychometric_scores.length : 0
      });
      
    } catch (e) {
      console.error("Error parsing JSON for submission", submission.id, e);
    }

    res.json(submission);

  } catch (err) {
    console.error('Error fetching submission detail:', err);
    res.status(500).json({ error: 'Failed to fetch submission detail' });
  }
};

exports.getIncompleteCaseStudy = async (req, res) => {
  try {
    const user = req.user;
    
    console.log('🔍 Checking for incomplete case studies for user:', user.id);

    const [applicantProfile] = await db.query(
      'SELECT id FROM applicant_profiles WHERE user_id = ?',
      [user.id]
    );

    if (!applicantProfile || applicantProfile.length === 0) {
      return res.status(404).json({ error: 'Applicant profile not found' });
    }

    const applicantId = applicantProfile[0].id;
    console.log('✅ Applicant Profile ID:', applicantId);

    const [incompleteCaseStudies] = await db.query(
      `SELECT 
        csi.id as invitation_id,
        csi.case_study_id,
        csi.job_application_id,
        csi.job_id,
        csi.status as invitation_status,
        csi.created_at as invited_at,
        csi.last_accessed_at,
        csi.completed_at,
        csi.expires_at,
        cs.title as case_study_title,
        cs.description as case_study_description,
        j.id as job_id_from_jobs,
        j.title as job_title,
        ja.status as application_status,
        (SELECT COUNT(*) FROM feedbacks f 
         WHERE f.job_application_id = csi.job_application_id 
         AND f.case_study_id = csi.case_study_id) as has_submission
      FROM case_study_invitations csi
      INNER JOIN case_studies cs ON csi.case_study_id = cs.id
      INNER JOIN job_applications ja ON csi.job_application_id = ja.id
      LEFT JOIN jobs j ON csi.job_id = j.id
      WHERE ja.user_id = ?
        AND csi.status IN ('active', 'pending', 'accessed')
        AND csi.completed_at IS NULL
        AND ja.status = 'case_study_sent'
        AND (csi.expires_at IS NULL OR csi.expires_at > NOW())
        AND NOT EXISTS (
          SELECT 1 FROM feedbacks f 
          WHERE f.job_application_id = csi.job_application_id 
          AND f.case_study_id = csi.case_study_id
        )
      ORDER BY csi.created_at DESC
      LIMIT 1`,
      [user.id]
    );

    console.log('📋 Query result:', incompleteCaseStudies);

    if (!incompleteCaseStudies || incompleteCaseStudies.length === 0) {
      console.log('✅ No incomplete case studies found');
      return res.json({ 
        has_incomplete: false,
        message: 'All case studies completed!'
      });
    }

    const caseStudy = incompleteCaseStudies[0];
    
    console.log('✅ Found incomplete case study:', {
      job_id: caseStudy.job_id,
      case_study_id: caseStudy.case_study_id,
      invitation_status: caseStudy.invitation_status,
      application_status: caseStudy.application_status,
      has_submission: caseStudy.has_submission
    });

    res.json({
      has_incomplete: true,
      job_id: caseStudy.job_id, // Can be null for assessments
      case_study_id: caseStudy.case_study_id,
      job_application_id: caseStudy.job_application_id,
      invitation_id: caseStudy.invitation_id,
      case_study_title: caseStudy.case_study_title,
      case_study_description: caseStudy.case_study_description,
      job_title: caseStudy.job_title,
      company_name: caseStudy.company_name,
      time_limit: caseStudy.time_limit,
      invited_at: caseStudy.invited_at,
      last_accessed_at: caseStudy.last_accessed_at,
      expires_at: caseStudy.expires_at,
      status: caseStudy.invitation_status
    });

  } catch (err) {
    console.error('❌ Error fetching incomplete case study:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to fetch case study status',
      details: err.message 
    });
  }
};

module.exports = exports;