const express = require("express");
const router = express.Router();
const db = require("../src/config/database");
const { v4: uuidv4 } = require('uuid'); 
const crypto = require('crypto');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
require("dotenv").config();
const authMiddleware = require("../middlewares/authMiddleware");
const languageMiddleware = require("../middlewares/languageMiddleware");
const aiService = require('../services/aiService');
const translationService = require('../services/translationService');
const fs = require('fs');
const path = require('path');
const { generateAdaptiveStructuredPrompt } = require('../services/universalCaseStudyGenerator');
const { generateAssessmentModules, MODULE_CONFIGS } = require('../services/assessmentModuleGenerator');

// Simple logging helpers for AI traces (no PII)
function ensureLogsDir() {
  const dir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function sanitizeForLogging(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  s = s.replace(/\d{7,}/g, '[REDACTED_NUM]');
  s = s.replace(/\s+/g, ' ').trim();
  return s.substring(0, 20000);
}
function appendAiLog(eventType, payload) {
  try {
    const dir = ensureLogsDir();
    const p = path.join(dir, 'ai_generation_trace.log');
    const obj = Object.assign({ eventType, ts: Date.now() }, payload);
    fs.appendFileSync(p, JSON.stringify(obj) + '\n');
  } catch (e) {
    console.warn('Could not write AI trace log:', e.message);
  }
}
// Configure multer for file uploads (5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

function parsePsychometricTypes(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw === null || raw === undefined) {
    return [];
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return parsePsychometricTypes(parsed);
    } catch (err) {
      console.warn('⚠️ Psychometric types not valid JSON, falling back to comma-separated parsing. Value:', trimmed);
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [raw];
}
function getPsychometricContext(psychometricTypes) {
  const psychometricDetails = {
    cognitiveAbility: {
      description: 'COGNITIVE ABILITY ASSESSMENT',
      focus: 'Measures analytical thinking, logical reasoning, pattern recognition, and mental processing speed. Evaluate how the candidate breaks down complex information.',
      probeAreas: ['How do you approach complex analytical problems?', 'Walk through your logical reasoning', 'How would you break down this ambiguous situation?', 'Describe your process for identifying patterns']
    },
    personalityTraits: {
      description: 'PERSONALITY & BEHAVIORAL ASSESSMENT',
      focus: 'Evaluates communication style, collaboration approach, personality strengths, and interpersonal dynamics. Assess their natural work style and team interaction patterns.',
      probeAreas: ['How do you typically interact in high-pressure situations?', 'Describe your approach to handling interpersonal conflicts', 'What is your natural communication style?', 'How do you prefer to receive feedback?']
    },
    decisionMaking: {
      description: 'DECISION MAKING STYLE ASSESSMENT',
      focus: 'Analyzes decision-making approach under pressure, risk tolerance, time management, and stakeholder consideration. Evaluate how they handle uncertainty and prioritize.',
      probeAreas: ['How would you decide with incomplete information?', 'How do you balance speed with thoroughness?', 'Describe a surprising decision outcome', 'How do you involve stakeholders in decisions?']
    },
    problemSolving: {
      description: 'PROBLEM SOLVING APPROACH ASSESSMENT',
      focus: 'Assesses structured problem-solving methodology, creativity, root cause analysis, and implementation thinking. Evaluate their systematic and creative problem-solving abilities.',
      probeAreas: ['How would you identify root causes?', 'What creative solutions complement traditional approaches?', 'How would you validate your solution assumptions?', 'Describe your problem-solving framework']
    },
    leadershipPotential: {
      description: 'LEADERSHIP & STRATEGIC THINKING ASSESSMENT',
      focus: 'Evaluates team management capability, strategic vision, delegation approach, and organizational impact thinking. Assess their leadership readiness and strategic mindset.',
      probeAreas: ['How would you lead a team through this?', 'What strategic considerations influence this?', 'How would you develop others while solving this?', 'How do you align decisions with organizational goals?']
    }
  };

  if (!psychometricTypes || psychometricTypes.length === 0) {
    return '';
  }

  let contextString = '\n\n=== PSYCHOMETRIC ASSESSMENT INTEGRATION ===\n';
  contextString += `Include psychometric evaluation elements for: ${psychometricTypes.join(', ')}\n\n`;

  psychometricTypes.forEach(type => {
    const details = psychometricDetails[type];
    if (details) {
      contextString += `${details.description}:\n`;
      contextString += `- Primary Focus: ${details.focus}\n`;
      contextString += `- Probe with: ${details.probeAreas.join(' / ')}\n\n`;
    }
  });

  contextString += 'Integration Guidelines:\n';
  contextString += '1. Embed assessment questions naturally into the case study scenarios\n';
  contextString += '2. Design responses that reveal the selected competency areas\n';
  contextString += '3. Create evaluation criteria for each assessment type\n';
  contextString += '4. Provide guidance on what strong vs weak responses look like\n';
  contextString += '5. Ensure questions measure depth beyond surface-level problem solving\n';

  return contextString;
}
async function fetchUrlContent(url) {
  try {
    console.log(`   🔗 Fetching content from: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`   ⚠️ HTTP ${response.status} from ${url}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Handle different content types
    let text = '';
    
    if (contentType.includes('application/json')) {
      // If it's JSON, convert to readable text
      const json = await response.json();
      text = JSON.stringify(json, null, 2);
    } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      text = await response.text();
    } else {
      // Try to get text anyway
      text = await response.text();
    }
    
    if (!text || text.trim().length === 0) {
      console.warn(`   ⚠️ Empty response from ${url}`);
      return null;
    }

    // Extract plain text from HTML
    const plainText = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')    // Remove styles
      .replace(/<[^>]+>/g, ' ')                                              // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')                                                  // Collapse whitespace
      .trim();

    if (plainText.length === 0) {
      console.warn(`   ⚠️ No extractable text from ${url}`);
      return null;
    }

    const extracted = plainText.substring(0, 5000); // Limit to 5000 chars per URL
    console.log(`   ✅ Extracted ${extracted.length} characters`);
    return extracted;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`   ⚠️ Timeout fetching ${url}`);
    } else {
      console.warn(`   ⚠️ Error fetching ${url}: ${err.message}`);
    }
    return null;
  }
}



/**
 * ENHANCED: Extract company information from multiple sources
 * Intelligently combines data from: JD, uploaded docs, and links
 * WITH PROPER NARRATIVE SEQUENCE FOR CASE STUDIES
 */
async function extractCompanyBackground(
  jobDescriptionText,
  job,
  documentContext,
  linkContext
) {
  try {
    // Build comprehensive context from all available sources
    let fullSourceContext = '';
    
    // Priority 1: Job Description (Core source)
    if (job && job.description) {
      fullSourceContext += `[SOURCE: Job Description]\n${job.description}\n\n`;
    }
    
    // Priority 2: Assessment Job Description Text
    if (jobDescriptionText && jobDescriptionText.length > 50) {
      fullSourceContext += `[SOURCE: Assessment Job Description]\n${jobDescriptionText}\n\n`;
    }
    
    // Priority 3: Uploaded Documents (highest quality)
    if (documentContext && documentContext.length > 100) {
      fullSourceContext += `[SOURCE: Uploaded Documents]\n${documentContext}\n\n`;
    }
    
    // Priority 4: Links/Web Content (only if substantial)
    if (linkContext && linkContext.length > 100) {
      fullSourceContext += `[SOURCE: Web Links]\n${linkContext}\n\n`;
    }

    // Check if we have enough context
    if (fullSourceContext.trim().length < 100) {
      console.warn('⚠️ Insufficient context for company background extraction');
      return null;
    }

    // Limit context to avoid token overflow
    const limitedContext = fullSourceContext.substring(0, 5000);

    const extractionPrompt = `You are an expert at extracting and structuring company background information from text.

TASK: Extract comprehensive company information and structure it for a case study.

IMPORTANT - Follow this EXACT narrative sequence:
1. FIRST: Company overview (name, what they do, when founded)
2. SECOND: Company scale (offices, team size, global presence)
3. THIRD: Expertise and core business (products, services, specialties)
4. FOURTH: Company culture, mission, and values

This sequence ensures the narrative flows naturally BEFORE introducing a role or scenario.

Extract these details in order:
- Company name (exact)
- What they do (business type/industry)
- Founded year/history
- Scale (employees, offices, countries)
- Expertise/specializations
- Main products/services
- Mission statement
- Core values
- Company culture
- Market position/achievements

Extract ONLY information explicitly mentioned. If not mentioned, skip it.

CONTEXT:
${limitedContext}

Return a comprehensive background paragraph (200-350 words) following the sequence above.
Structure: Company → Scale → Expertise → Culture.
Just return the text directly, no JSON, no markdown, no formatting.`;

    const aiService = require('../services/aiService');
    let backgroundText = null;
    
    const providers = ['openai', 'groq', 'gemini'];
    
    for (const provider of providers) {
      try {
        console.log(`   🤖 Trying ${provider.toUpperCase()} for extraction...`);
        const response = await aiService.generateContent(extractionPrompt, provider);
        backgroundText = response.trim();
        
        if (backgroundText && backgroundText.length > 100) {
          console.log(`   ✅ ${provider.toUpperCase()} extraction successful (${backgroundText.length} chars)`);
          return backgroundText;
        }
      } catch (e) {
        console.warn(`   ⚠️ ${provider.toUpperCase()} extraction failed: ${e.message}`);
        continue;
      }
    }
    
    console.warn('⚠️ Company background extraction unsuccessful - all providers failed');
    return null;

  } catch (err) {
    console.warn('⚠️ Error extracting company background:', err.message);
    return null;
  }
}


/**
 * STEP 1: Intelligently analyze the job to determine context
 * Extracts: industry, seniority level, primary responsibilities, skills needed
 */
function analyzeJobContext(job) {
  const title = job.title.toLowerCase();
  const desc = job.description.toLowerCase();
  const resp = job.key_responsibilities.toLowerCase();
  const fullText = `${title} ${desc} ${resp}`;

  // Industry detection
  const industryKeywords = {
    tech: ['developer', 'engineer', 'software', 'coding', 'programming', 'api', 'database', 'cloud', 'devops', 'architect', 'tech'],
    finance: ['accountant', 'finance', 'cfo', 'controller', 'accounting', 'auditor', 'financial', 'bookkeeper', 'analyst'],
    banking: ['banker', 'loan', 'credit', 'mortgage', 'banking', 'investment', 'trader', 'wealth'],
    sales: ['sales', 'account executive', 'business development', 'sales rep', 'closing', 'pipeline', 'customer acquisition'],
    marketing: ['marketing', 'brand', 'campaign', 'seo', 'social media', 'content', 'growth', 'acquisition'],
    support: ['customer support', 'call center', 'support specialist', 'ticket', 'helpdesk', 'customer service'],
    management: ['manager', 'director', 'head of', 'lead', 'supervisor', 'team lead', 'management'],
    hr: ['hr', 'human resources', 'recruiter', 'talent', 'recruitment', 'employee'],
    operations: ['operations', 'logistics', 'supply chain', 'process', 'efficiency', 'optimization'],
    qa: ['qa', 'quality assurance', 'tester', 'testing', 'automation', 'bugs', 'validation'],
    data: ['data analyst', 'data scientist', 'bi', 'analytics', 'reporting', 'sql', 'python', 'data engineer'],
    design: ['designer', 'ux', 'ui', 'product design', 'figma', 'wireframe', 'prototyping']
  };

  let detectedIndustry = 'general';
  let industryScore = 0;

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const score = keywords.filter(kw => fullText.includes(kw)).length;
    if (score > industryScore) {
      industryScore = score;
      detectedIndustry = industry;
    }
  }

  // Seniority detection
  let seniority = 'mid-level';
  if (fullText.match(/senior|lead|manager|director|head of|principal|architect/i)) {
    seniority = 'senior';
  } else if (fullText.match(/junior|entry|graduate|intern|associate/i)) {
    seniority = 'junior';
  }

  // Key responsibility count
  const respCount = job.key_responsibilities.split('\n').filter(r => r.trim().length > 0).length;

  return {
    industry: detectedIndustry,
    seniority,
    industryScore,
    keyResponsibilityCount: respCount,
    fullJobText: fullText
  };
}

/**
 * STEP 2: Generate industry-specific, scenario-based questions
 * Questions are UNIQUE to each scenario and highly detailed
 */
function generateScenarioSpecificQuestions(job, caseStudyDescription, scenarioContext, numQuestions, difficultyLevel, variantNumber) {
  
  const jobContext = analyzeJobContext(job);
  
  // Extract key metrics and challenges from the description
  const extractMetricsAndChallenges = (desc) => {
    const metrics = desc.match(/(\d+%?|\$\d+[KMB]?|[\d.]+\s*(?:units?|items?|customers?|hours?|days?))/gi) || [];
    const challenges = desc.match(/(?:challenge|issue|problem|concern|obstacle|declining|dropped|decreased)/gi) || [];
    return { metrics: metrics.slice(0, 5), challenges: challenges.length };
  };

  const { metrics, challenges } = extractMetricsAndChallenges(caseStudyDescription);

  // Generate questions based on industry, difficulty, and scenario
  const questionGenerators = {
    tech: generateTechQuestions,
    finance: generateFinanceQuestions,
    banking: generateBankingQuestions,
    sales: generateSalesQuestions,
    marketing: generateMarketingQuestions,
    support: generateSupportQuestions,
    management: generateManagementQuestions,
    operations: generateOperationsQuestions,
    qa: generateQAQuestions,
    data: generateDataQuestions,
    design: generateDesignQuestions,
    hr: generateHRQuestions,
    general: generateGeneralQuestions
  };

  const generator = questionGenerators[jobContext.industry] || questionGenerators.general;
  return generator(job, caseStudyDescription, numQuestions, difficultyLevel, variantNumber, metrics, challenges);
}

// TECH-SPECIFIC QUESTIONS
function generateTechQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `The system is experiencing performance degradation. Walk through your diagnostic approach to identify whether this is a code-level issue, infrastructure problem, or third-party service failure. What tools would you use and what metrics would you monitor first?`,
      medium: `The application is experiencing intermittent failures affecting 15% of users during peak hours. Describe your systematic approach to root cause analysis considering it could be related to auto-scaling issues, database connection pooling, cache invalidation, or a recent deployment. How would you prioritize investigation areas and involve other teams?`,
      hard: `You've discovered a subtle bug that only occurs under specific data conditions and affects approximately 2% of transactions. However, fixing it requires refactoring a critical component that could introduce performance regressions. Detail your approach to: (1) fully understanding the issue's scope and business impact, (2) designing a solution that minimizes risk, (3) creating a comprehensive testing strategy, and (4) planning a safe rollout with monitoring and rollback capabilities.`
    },
    {
      easy: `A team member proposes a new technology for the project. Explain the factors you'd consider in evaluating it and how you'd recommend proceeding.`,
      medium: `You need to refactor a major module that has accumulated technical debt over 2 years. Balance the need to reduce complexity with maintaining system stability. Describe how you'd plan this work, manage scope, and ensure no regressions while keeping the team productive on feature work.`,
      hard: `Your microservices architecture is scaling but creating operational complexity. Service communication failures are increasing, and debugging across services is becoming difficult. You have limited resources for infrastructure improvements. Analyze trade-offs between adding more observability tools, implementing circuit breakers, restructuring services, or changing communication patterns. How would you prioritize and justify your recommendations?`
    },
    {
      easy: `A critical production bug is reported. Describe your process for investigating, fixing, and deploying the fix safely.`,
      medium: `Performance has degraded over the past quarter with P99 latency increasing by 40%. Describe a comprehensive approach to identifying whether this is due to code changes, data growth, infrastructure capacity, or external factors. How would you communicate findings and create an improvement plan?`,
      hard: `You're implementing a feature that requires coordination across 4 backend services, 2 frontend teams, and infrastructure changes. There are competing priorities and resource constraints. Detail your approach to: (1) breaking down the work, (2) managing dependencies, (3) handling integration testing across teams, (4) coordinating rollout, and (5) ensuring all teams can independently verify their components work correctly.`
    },
    {
      easy: `Design a testing strategy for a new critical feature. What types of tests would you include?`,
      medium: `Your team's productivity has declined due to frequent test failures and flaky tests. Design a comprehensive plan to improve test reliability, reduce test execution time, and increase developer confidence in the test suite.`,
      hard: `You're managing CI/CD for a large system where deployment failures are causing business impact. Current process takes 45 minutes and has no automated rollback. Design a new pipeline architecture that: (1) reduces deployment time, (2) includes progressive rollout capabilities, (3) implements intelligent rollback detection, (4) maintains safety for the critical system, and (5) provides visibility to multiple stakeholders.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// FINANCE-SPECIFIC QUESTIONS
function generateFinanceQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `The accounts receivable aging report shows 35% of invoices are overdue by more than 30 days. What steps would you take to investigate and address this issue?`,
      medium: `Month-end closing is taking 8 business days, with significant variance in the reconciliation process. Some cost centers consistently have adjustments while others don't. Analyze potential root causes, identify which could be process-related versus data quality issues, and design solutions prioritizing the highest impact areas.`,
      hard: `Your organization's quarterly financial close process has become a bottleneck with multiple reconciliation errors discovered post-close. Audit findings have increased 25% year-over-year. Design a comprehensive improvement program addressing: (1) identifying the true root causes of errors, (2) implementing preventive controls, (3) streamlining the close process, (4) improving data quality upstream, (5) training and change management, and (6) measurement of success.`
    },
    {
      easy: `Explain the steps you would take to reconcile a variance of $50,000 between budgeted and actual spending.`,
      medium: `Three departments consistently exceed their budgets by 10-15% while others come in under. Investigate potential causes including department behaviors, budget setting accuracy, and allocation methodology. Recommend whether budget reallocation, enhanced monitoring, process changes, or training would be most effective.`,
      hard: `Your organization's forecasting accuracy has declined to 68%, impacting business planning and cash flow management. Multiple departments use different forecasting methods with varying rigor. Design a centralized forecasting governance framework that: (1) standardizes methodology, (2) integrates with business planning, (3) incorporates leading indicators, (4) enables scenario analysis, (5) includes accountability measures, and (6) drives continuous improvement.`
    },
    {
      easy: `An invoice from a vendor doesn't match the purchase order. How would you handle this discrepancy?`,
      medium: `Your accounts payable process has 200+ vendor disputes in backlog. Payment timing is becoming unpredictable affecting vendor relationships and potentially supply chain. Analyze the root causes of disputes, design a resolution strategy, and propose process improvements to prevent recurrence.`,
      hard: `Your organization recently acquired a company with different accounting systems and processes. You need to integrate their financials into your consolidated statements while ensuring audit readiness within 2 months. Outline: (1) initial assessment approach, (2) integration sequencing, (3) data validation strategy, (4) reconciliation methodology, (5) control implementation, (6) change management, and (7) audit preparation.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// BANKING-SPECIFIC QUESTIONS
function generateBankingQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `A customer applies for a $200,000 loan with a debt-to-income ratio of 45%. Walk through your analysis and decision process.`,
      medium: `Your loan portfolio's default rate has increased to 8.5% compared to the 5% benchmark. Analyze whether this indicates stricter underwriting is needed, portfolio composition issues, economic changes, or servicing problems. Recommend specific actions with timelines.`,
      hard: `You're reviewing a $5M commercial loan proposal from a long-time customer in a declining industry sector. While the financial metrics are adequate, market trends and competitive pressures raise concerns. Detail your analysis including: (1) scenario analysis under different economic conditions, (2) risk mitigation strategies, (3) collateral evaluation, (4) covenant recommendations, (5) pricing considerations, and (6) your recommendation with rationale.`
    },
    {
      easy: `Explain how you would evaluate a customer's creditworthiness before approving a mortgage.`,
      medium: `Customer complaints about loan servicing have increased 40% in the past quarter. Common issues include billing errors, escrow account discrepancies, and communication delays. Design a comprehensive improvement plan addressing root causes and prevention.`,
      hard: `Your institution is facing significant regulatory scrutiny on fair lending practices. Recent analysis suggests disparate impact in approval rates across demographic groups. Design a comprehensive remediation program including: (1) root cause analysis, (2) process audit, (3) data-driven improvements, (4) staff training, (5) enhanced monitoring systems, (6) stakeholder communication, and (7) measurement of compliance.`
    },
    {
      easy: `A customer disputes a transaction on their account. How would you investigate and resolve this?`,
      medium: `AML/KYC compliance findings from the audit have increased, with several close calls that could have triggered regulatory action. Current processes are manual and inconsistent. Design a compliance enhancement program balancing rigor with operational efficiency.`,
      hard: `Your loan portfolio has significant concentration risk with 30% exposure to a single industry. Economic indicators suggest this sector faces headwinds. Design a comprehensive risk mitigation strategy including: (1) portfolio analysis by sub-segment, (2) stress testing, (3) diversification options, (4) early warning systems, (5) customer communication plans, and (6) pricing adjustments.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// SALES-SPECIFIC QUESTIONS
function generateSalesQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `You're tracking three deals worth $50K, $120K, and $75K at different pipeline stages. One is in negotiation phase and likely to close this month. How would you prioritize your time and activities?`,
      medium: `Your pipeline for Q3 is $500K but your quota is $750K. It's mid-quarter and you have limited new prospect activity. Analyze your situation: which existing deals can you accelerate, what's needed to increase probability, where should new business efforts focus, and what's a realistic forecast?`,
      hard: `You've had a challenging quarter with 3 major deals lost to competitors. Upon analysis, you notice a pattern: larger enterprise deals where you weren't brought in until late stages. Design a comprehensive strategy to: (1) understand why you're losing these deals, (2) develop a territory strategy for enterprise accounts, (3) build a systematic prospecting approach, (4) create an account planning methodology, (5) identify skill gaps, and (6) project how this would impact annual quota.`
    },
    {
      easy: `A prospect goes silent after initial interest. What would be your follow-up strategy?`,
      medium: `Your deals are closing slower than industry benchmarks. Average sales cycle is 6 months vs. 4 months for competitors. Analyze potential causes and design a plan to reduce cycle time while maintaining deal quality and pricing discipline.`,
      hard: `You're transitioning into a new territory with no existing relationships. You need to generate $500K in revenue in your first 12 months. Design your complete go-to-market strategy including: (1) market research and target account selection, (2) prospecting methodology, (3) account planning approach, (4) solution positioning, (5) competitive intelligence gathering, (6) partnership opportunities, (7) monthly progression plan, and (8) contingency strategies.`
    },
    {
      easy: `A customer is considering three vendors including you. How would you differentiate your solution?`,
      medium: `Customer retention is declining with 25% of customers not renewing. Analyze patterns in customer satisfaction, product usage, and competitive alternatives. Design a win-back and retention program.`,
      hard: `Your largest account representing 18% of annual revenue is consolidating vendors and your contract is up for renewal. While you have a strong relationship, competitors are aggressively pursuing this opportunity. Design your comprehensive renewal strategy including: (1) relationship mapping, (2) value documentation, (3) business case for expansion, (4) competitive defense plan, (5) executive alignment, (6) proposal strategy, and (7) negotiation approach.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// MARKETING-SPECIFIC QUESTIONS
function generateMarketingQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `Your email campaign had a 2.5% open rate and 0.8% click rate. Analyze whether these are good results and what you might test to improve performance.`,
      medium: `Your customer acquisition cost is $450 but customer lifetime value is $2,200. However, acquisition costs are increasing 15% quarter-over-quarter. Analyze drivers of increased CAC, identify which channels are most efficient, and design a strategy to optimize spend while maintaining growth.`,
      hard: `Your brand awareness campaign achieved high impressions but lead generation and conversion are below targets. You have 3 months and a $200K budget to drive qualified leads. Design a comprehensive multi-channel strategy including: (1) audience segmentation and targeting, (2) channel selection with rationale, (3) messaging framework, (4) creative strategy, (5) budget allocation, (6) success metrics, (7) testing plan, and (8) optimization approach.`
    },
    {
      easy: `Compare the performance of your top 3 social media channels and explain what might drive differences.`,
      medium: `Content marketing efforts are generating engagement but not converting to leads. Your blog gets 5K monthly visitors but lead captures are only 50. Analyze the funnel, identify breakpoints, and design an improvement strategy.`,
      hard: `You're launching a new product to a new market segment. You have limited budget and uncertain product-market fit. Design your marketing strategy including: (1) market research approach, (2) customer segmentation, (3) positioning strategy, (4) go-to-market channels, (5) messaging hierarchy, (6) launch timeline, (7) demand generation approach, (8) measurement framework, and (9) adaptation strategy if initial response is weak.`
    },
    {
      easy: `A campaign had a $2,000 spend and generated 50 leads. Calculate the CAC and assess whether this is acceptable.`,
      medium: `Marketing qualified leads (MQLs) are not converting to sales qualified leads (SQLs) at expected rates. Sales says the leads aren't qualified; marketing says they're being rejected unfairly. Investigate this dynamic and design a resolution.`,
      hard: `Your product receives poor online reviews with an average rating of 2.8/5 stars, impacting acquisition. Design a comprehensive reputation and demand generation recovery program including: (1) root cause analysis of negative feedback, (2) product/process improvements needed, (3) reputation management strategy, (4) customer advocacy program, (5) content strategy addressing concerns, (6) paid and organic channel approach, (7) partnership opportunities, and (8) measurement of recovery.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// SUPPORT-SPECIFIC QUESTIONS
function generateSupportQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `You have 45 open tickets and 30 new ones coming in daily. Your target is 24-hour resolution. How would you manage this workload?`,
      medium: `Your first contact resolution rate is 58% but industry benchmark is 75%. Average resolution time is 4 days when it should be 2 days. Analyze root causes and design an improvement program including training, process changes, and tools.`,
      hard: `Your support team is experiencing high burnout with turnover at 35% annually. Customer satisfaction has declined to 3.5/5 stars. Quality issues are increasing. Design a comprehensive team improvement program including: (1) root cause analysis of issues, (2) workload analysis and optimization, (3) training and development plan, (4) process improvements, (5) tool evaluation, (6) knowledge management system, (7) career path and incentives, and (8) customer communication strategy.`
    },
    {
      easy: `A customer is very upset about a recurring issue. Walk through how you would handle this interaction.`,
      medium: `Escalations have increased 40% in the past quarter. The escalation rate is 15% vs. 8% target. Determine whether this indicates staff capability issues, process problems, product quality issues, or customer selection. Recommend specific actions.`,
      hard: `You're implementing a self-service portal to reduce support volume. You need to move 40% of tickets to self-service within 6 months. Design implementation including: (1) content strategy and prioritization, (2) user experience approach, (3) knowledge base structure, (4) training approach, (5) quality assurance processes, (6) team transitions, (7) success metrics, and (8) contingency planning.`
    },
    {
      easy: `A customer is having trouble with a common feature. How would you guide them to resolution?`,
      medium: `Average handle time has increased from 12 minutes to 18 minutes. Investigate causes: is it product complexity, training gaps, system issues, or customer selection? Design specific improvements.`,
      hard: `Your support organization is being measured on cost reduction while maintaining quality. You need to reduce support spend by 20% while keeping customer satisfaction above 4.0 stars. Analyze options including: (1) process automation and scripting, (2) knowledge management improvements, (3) workforce optimization, (4) outsourcing options, (5) tiered support model, (6) customer segmentation, and (7) technology investments with ROI.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// MANAGEMENT-SPECIFIC QUESTIONS
function generateManagementQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `One of your team members is underperforming and missing deadlines. How would you approach this conversation?`,
      medium: `Your team's productivity has declined 15% over the past quarter. Turnover is at 22% annually. Morale seems low. Diagnose the root causes and design a comprehensive improvement plan with specific initiatives and timelines.`,
      hard: `You're taking over a struggling team with high turnover (32%), low engagement scores (2.1/5), and missed commitments. Hiring is frozen for 3 months. Design your comprehensive turnaround strategy including: (1) rapid assessment approach, (2) high-impact early wins, (3) engagement and morale improvements, (4) capability assessment, (5) career development plans, (6) process improvements, (7) stakeholder management, (8) milestone roadmap, and (9) contingency plans.`
    },
    {
      easy: `You need your team to take on a significant new project while maintaining current commitments. How do you approach this?`,
      medium: `Cross-functional dependencies are causing project delays. Your team frequently waits on other teams for decisions and deliverables. Design a collaboration framework and communication approach to reduce friction and accelerate delivery.`,
      hard: `Your organization is implementing a major restructuring. You need to reorganize your team structure while minimizing disruption and retaining key talent. Design the change management approach including: (1) organizational design, (2) role transitions, (3) talent retention strategies, (4) communication plan, (5) capability gaps and solutions, (6) performance metrics during transition, and (7) stakeholder alignment.`
    },
    {
      easy: `How do you provide constructive feedback to a team member on a project that didn't go well?`,
      medium: `Your team's performance ratings show high variability in evaluation standards. Some managers rate everyone high; others are harsh. This is affecting talent decisions and compensation. Design a calibration and consistency improvement program.`,
      hard: `You're managing a matrix team across multiple departments with different incentives and priorities. Collaboration is poor and accountability is unclear. Design a governance model including: (1) decision-making framework, (2) accountability assignment, (3) conflict resolution process, (4) incentive alignment, (5) communication cadence, (6) performance metrics, and (7) stakeholder engagement.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// OPERATIONS-SPECIFIC QUESTIONS
function generateOperationsQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `Your process has a bottleneck causing 40% delay in overall cycle time. How would you identify and address it?`,
      medium: `Process efficiency has declined 12% over two quarters. Cost per unit has increased 8%. Inventory is up. Design a comprehensive operational improvement program including root cause analysis and specific initiatives.`,
      hard: `Your supply chain is fragmented with multiple vendors, manual coordination, and quality inconsistencies. Costs are 15% above market and lead time is unpredictable. Design a comprehensive supply chain transformation including: (1) vendor consolidation strategy, (2) process automation roadmap, (3) quality improvement program, (4) inventory optimization, (5) technology selection, (6) change management, and (7) expected outcomes.`
    },
    {
      easy: `Explain how you would measure and improve process efficiency in your area.`,
      medium: `Quality issues have increased 25%. Rework rate is 18%. This is impacting customer satisfaction and costs. Investigate root causes and design a quality improvement initiative.`,
      hard: `You're implementing continuous improvement culture in an organization that historically resists change. Design your program including: (1) training approach, (2) improvement methodology framework, (3) team structure and governance, (4) metrics and measurement system, (5) incentive alignment, (6) technology support, (7) change management, and (8) progression roadmap.`
    },
    {
      easy: `How would you approach planning capacity for an expected 30% volume increase?`,
      medium: `Facility utilization is at 45% while labor costs are 35% above budget. Design an optimization strategy addressing capacity, staffing, and efficiency.`,
      hard: `You need to expand operations to a new location while maintaining service levels at current location. Design implementation including: (1) site selection and setup, (2) process standardization, (3) staffing and training, (4) technology infrastructure, (5) transition approach, (6) quality assurance, (7) cost management, and (8) risk mitigation.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// QA-SPECIFIC QUESTIONS
function generateQAQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `A critical bug was found in production that testing should have caught. How would you investigate what happened and prevent recurrence?`,
      medium: `Your test automation coverage is only 25% and test execution takes 8 hours. Critical bugs are reaching production at a rate of 3-4 per month. Design a comprehensive testing strategy improvement program with priorities and timelines.`,
      hard: `Your organization is releasing to production every 2 weeks with high defect escape rates (8-12 bugs per release reaching production). Testing is a bottleneck delaying releases. Design a comprehensive quality transformation including: (1) process redesign, (2) automation strategy, (3) testing methodology, (4) tool selection, (5) team restructuring, (6) metrics and dashboards, (7) continuous integration/deployment approach, and (8) risk mitigation.`
    },
    {
      easy: `How would you test a new payment feature to ensure it handles various scenarios correctly?`,
      medium: `Defect detection rate is declining despite more testing effort. Many defects escape to production. Analyze testing effectiveness and design improvements to detection ratio and process efficiency.`,
      hard: `You're testing a complex microservices architecture with 25+ services, multiple integrations, and asynchronous workflows. Current testing is fragmented across teams. Design comprehensive testing strategy including: (1) test pyramid approach, (2) integration testing framework, (3) environment management, (4) test data strategy, (5) automation priorities, (6) performance and load testing, (7) team coordination, and (8) CI/CD integration.`
    },
    {
      easy: `A test you wrote passes locally but fails in the CI pipeline. How would you troubleshoot this?`,
      medium: `Flaky tests are affecting team confidence in test suite. Test execution time is increasing causing pipeline delays. Design a plan to improve reliability and speed of testing.`,
      hard: `Your test environment is unstable, making testing difficult and unreliable. Tests are slow, environment setup is manual, and troubleshooting is time-consuming. Design infrastructure and process improvements including: (1) environment automation, (2) data management, (3) performance optimization, (4) monitoring, (5) scalability, (6) documentation, and (7) team enablement.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// DATA-SPECIFIC QUESTIONS
function generateDataQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `You discover that a key metric used by executives has a 10% variance from what you calculated. How would you investigate and resolve this?`,
      medium: `Data quality score is 72% with inconsistent definitions across departments. Reporting delays average 3 days when stakeholders expect real-time. Design a data governance and quality improvement program.`,
      hard: `Your data infrastructure is fragmented with multiple siloed systems and manual processes. Data latency is 48 hours. Data quality is poor affecting decision-making. Design a comprehensive data transformation including: (1) architecture redesign, (2) integration approach, (3) data governance framework, (4) quality management system, (5) analytics capability building, (6) technology selection, (7) team structure, and (8) phased implementation roadmap.`
    },
    {
      easy: `A stakeholder asks about a trend in data. Walk through how you would analyze and explain it.`,
      medium: `Dashboard adoption is low despite significant development effort. Users find reports difficult to navigate and metrics are unclear. Design improvements to analytics usability and value.`,
      hard: `You're building predictive analytics to forecast customer churn. You have 5 years of historical data but quality varies. Design approach including: (1) data exploration and validation, (2) feature engineering, (3) model selection and evaluation, (4) validation methodology, (5) implementation and monitoring, (6) stakeholder communication, and (7) business application strategy.`
    },
    {
      easy: `Explain your approach to analyzing a dataset you're unfamiliar with to identify key insights.`,
      medium: `Report creation is manual and time-consuming. Stakeholders request ad-hoc analyses frequently disrupting planned work. Design a self-service analytics approach balancing governance and flexibility.`,
      hard: `Your organization needs to consolidate data from a recent acquisition. Systems are incompatible, data definitions differ, and quality is unknown. Design integration including: (1) data mapping and transformation, (2) quality assessment and remediation, (3) governance model, (4) technical architecture, (5) timeline and sequencing, (6) stakeholder management, and (7) ongoing data stewardship.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// DESIGN-SPECIFIC QUESTIONS
function generateDesignQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `You've completed a design but user testing reveals users don't understand a key feature. How would you address this?`,
      medium: `Design handoffs to development are inconsistent, leading to implementation divergence from designs. Developers report specifications are unclear. Design a process improvement approach for communication and collaboration.`,
      hard: `You're redesigning a core product interface affecting 500K users. Current experience has 3.2/5 satisfaction. You need to balance modern design with backwards compatibility while minimizing user disruption. Design your approach including: (1) user research, (2) design strategy, (3) prototyping and testing, (4) accessibility approach, (5) implementation sequencing, (6) change management, and (7) success metrics.`
    },
    {
      easy: `How would you approach designing an interface for a feature you're unfamiliar with?`,
      medium: `Design iteration cycles are lengthy causing feature delays. Design system exists but adoption is low with custom implementations everywhere. Improve design system value and adoption strategy.`,
      hard: `You're scaling from desktop to mobile, tablet, and emerging platforms. Maintaining consistent experience while optimizing for each platform is challenging. Design your multi-platform strategy including: (1) platform-specific research and insights, (2) responsive design approach, (3) feature prioritization by platform, (4) design system expansion, (5) testing and validation methodology, (6) developer handoff process, (7) performance considerations, and (8) analytics and measurement.`
    },
    {
      easy: `A stakeholder requests a feature you believe hurts usability. How would you handle this conversation?`,
      medium: `Accessibility compliance is required but adoption is low. Current designs have WCAG violations affecting 15% of users. Design an accessibility improvement program across the product.`,
      hard: `Your design team is bottlenecked with 40+ feature requests backlogged. You need to scale design capacity and process. Design a strategy including: (1) design system enhancement, (2) design process automation, (3) team structure and roles, (4) stakeholder management, (5) prioritization framework, (6) collaboration tools, (7) design quality metrics, and (8) team capability development.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// HR-SPECIFIC QUESTIONS
function generateHRQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `A manager reports performance issues with an employee. Walk through your approach to this situation including investigation and next steps.`,
      medium: `Your turnover rate is 24% annually with highest turnover in first 12 months (35%). Exit interview data shows limited career growth and unclear expectations. Design a retention and onboarding improvement program.`,
      hard: `Your organization is experiencing high turnover in critical roles (35%), affecting business continuity. Exit feedback indicates limited growth opportunities and ineffective management. Design comprehensive talent retention and development strategy including: (1) stay interview program, (2) career pathing framework, (3) management effectiveness improvement, (4) compensation analysis, (5) culture enhancement, (6) succession planning, and (7) measurement approach.`
    },
    {
      easy: `You need to hire 5 people in a competitive market. Outline your recruiting strategy and timeline.`,
      medium: `Your hiring process takes 8 weeks and candidates frequently accept competing offers. Cost per hire is high while quality is inconsistent. Design process improvements for speed, quality, and cost efficiency.`,
      hard: `You're supporting rapid scaling from 150 to 300 employees in 18 months. Current recruiting, onboarding, and culture processes can't scale. Design comprehensive people operation infrastructure including: (1) recruiting process redesign, (2) employer branding strategy, (3) onboarding program, (4) culture framework, (5) performance management system, (6) compensation approach, (7) organizational design, and (8) capability building for managers.`
    },
    {
      easy: `How would you handle a conflict between two employees?`,
      medium: `Employee engagement scores are 2.8/5 with particular dissatisfaction about communication and career development. Design an engagement improvement program.`,
      hard: `Your organization completed a major acquisition and is integrating 200 new employees. Different cultures, compensation approaches, and systems are creating friction and attrition. Design integration approach including: (1) cultural assessment, (2) harmonization strategy, (3) communication plan, (4) change management, (5) retention strategy for key talent, (6) system integration, (7) organizational design, and (8) success metrics.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// GENERAL FALLBACK QUESTIONS
function generateGeneralQuestions(job, desc, numQuestions, difficulty, variant, metrics, challenges) {
  const baseQuestions = [
    {
      easy: `Describe a challenge mentioned in the scenario and how you would approach resolving it.`,
      medium: `Analyze the key problems presented in this scenario. Which would you address first and why? How would you prioritize your approach?`,
      hard: `This scenario involves multiple interconnected challenges with competing stakeholder interests and resource constraints. Design a comprehensive approach to: (1) fully understand all issues, (2) identify root causes, (3) develop prioritized solutions, (4) manage stakeholder expectations, (5) implement changes, and (6) measure success.`
    },
    {
      easy: `What metrics or indicators would you monitor to track progress on this situation?`,
      medium: `Design a measurement framework to track success for the key initiatives needed in this scenario. How would you communicate progress to stakeholders?`,
      hard: `Create a detailed performance dashboard for this scenario including: (1) leading indicators of progress, (2) lagging indicators of outcomes, (3) key risks to monitor, (4) stakeholder-specific views, and (5) decision-making triggers.`
    },
    {
      easy: `Who are the key stakeholders involved and how would you communicate with them?`,
      medium: `Map out the stakeholder landscape for this scenario including their interests, influence, and potential conflicts. Design a stakeholder management strategy.`,
      hard: `Design a comprehensive stakeholder engagement and change management plan including: (1) stakeholder analysis, (2) communication strategy, (3) buy-in building approach, (4) conflict resolution approach, (5) resistance management, (6) ongoing engagement, and (7) success measurement.`
    },
    {
      easy: `What resources or support would you need to be successful in this situation?`,
      medium: `Identify skill gaps and resource constraints. Design an approach to address them while moving forward on initiatives.`,
      hard: `Design a resource and capability optimization plan including: (1) skills assessment, (2) training and development, (3) hiring or staffing, (4) tool and technology needs, (5) budget requirements, (6) timeline and sequencing, and (7) ROI analysis.`
    }
  ];

  return selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant);
}

// Helper function to select and adapt questions based on difficulty
function selectAndAdaptQuestions(baseQuestions, job, numQuestions, difficulty, variant) {
  const questions = [];
  const selectedIndexes = new Set();

  // Ensure we have enough questions
  const availableQuestions = baseQuestions.length;
  const questionsToSelect = Math.min(numQuestions, availableQuestions);

  // Select questions, biasing toward earlier ones but adding variety
  for (let i = 0; i < questionsToSelect; i++) {
    let index;
    if (i < 2) {
      // First 2 questions from earlier in array
      index = i;
    } else {
      // Remaining questions spread across available options
      index = Math.floor((i * availableQuestions) / numQuestions) % availableQuestions;
    }
    
    if (!selectedIndexes.has(index)) {
      selectedIndexes.add(index);
      const questionSet = baseQuestions[index];
      
      // Select appropriate difficulty level
      let question = questionSet[difficulty] || questionSet.medium;
      
      // Add variant-specific context
      if (variant === 1) {
        question = `[OPERATIONAL FOCUS] ${question}`;
      } else if (variant === 2) {
        question = `[STRATEGIC FOCUS] ${question}`;
      } else if (variant === 3) {
        question = `[INNOVATIVE APPROACH] ${question}`;
      }
      
      questions.push(question);
    }
  }

  // If we couldn't get enough unique questions, add more from selected set
  while (questions.length < numQuestions && selectedIndexes.size < availableQuestions) {
    for (let i = 0; i < availableQuestions && questions.length < numQuestions; i++) {
      if (!selectedIndexes.has(i)) {
        selectedIndexes.add(i);
        const questionSet = baseQuestions[i];
        let question = questionSet[difficulty] || questionSet.medium;
        
        if (variant === 1) {
          question = `[OPERATIONAL FOCUS] ${question}`;
        } else if (variant === 2) {
          question = `[STRATEGIC FOCUS] ${question}`;
        } else if (variant === 3) {
          question = `[INNOVATIVE APPROACH] ${question}`;
        }
        
        questions.push(question);
      }
    }
  }

  return questions;
}


/**
 * STEP 4: Provide industry-specific guidance to AI
 * Ensures generated content matches the industry context
 */
function getIndustrySpecificRequirements(industry, job) {
  const requirements = {
    tech: `
TECH INDUSTRY SPECIFICS:
- Use terminology: sprints, CI/CD, code review, deployment, scaling, uptime, latency, throughput
- Metrics: velocity points, test coverage %, deployment frequency, incident response time, system availability %
- Scenarios: system outages, performance degradation, technical debt, infrastructure scaling, team collaboration
- Tools/Frameworks: mention relevant tech stack (Cloud platforms, programming languages, tools)
- Success: code quality, system reliability, performance metrics, developer productivity
    `,
    finance: `
FINANCE INDUSTRY SPECIFICS:
- Use terminology: reconciliation, compliance, audit trail, regulatory requirements, risk assessment, financial reporting
- Metrics: processing accuracy %, reconciliation time, audit findings, financial variance %, compliance score
- Scenarios: month-end closing, budget vs actual variance, audit preparation, cash flow forecasting, fraud detection
- Tools: accounting software, ERP systems, reporting platforms
- Success: accuracy, timeliness, compliance, audit-readiness, financial accuracy
    `,
    banking: `
BANKING INDUSTRY SPECIFICS:
- Use terminology: loan approval, credit analysis, risk management, customer onboarding, AML/KYC, interest rates
- Metrics: loan approval rate, default rate, customer satisfaction, processing time, risk rating
- Scenarios: credit assessment, customer disputes, regulatory compliance, market rate changes, portfolio management
- Tools: banking systems, risk analytics platforms, compliance tools
- Success: risk mitigation, customer satisfaction, compliance, profitability, portfolio quality
    `,
    sales: `
SALES INDUSTRY SPECIFICS:
- Use terminology: pipeline, close rate, deal size, quota, prospect, qualification, forecasting, CRM
- Metrics: conversion rate %, deal size avg, sales cycle length, quota achievement %, customer acquisition cost
- Scenarios: pipeline management, deal closure challenges, competitive threats, customer retention, territory planning
- Tools: CRM systems, sales analytics platforms
- Success: quota achievement, customer acquisition, deal closure, revenue targets, retention
    `,
    marketing: `
MARKETING INDUSTRY SPECIFICS:
- Use terminology: campaign ROI, brand awareness, engagement, conversion funnel, attribution, CAC, LTV
- Metrics: CTR %, conversion rate %, cost per lead, ROI %, engagement rate, reach/impressions
- Scenarios: campaign performance analysis, budget allocation, channel optimization, brand positioning, audience targeting
- Tools: marketing automation, analytics platforms, social media tools
- Success: campaign ROI, lead generation, brand awareness, cost efficiency, conversion optimization
    `,
    support: `
CUSTOMER SUPPORT INDUSTRY SPECIFICS:
- Use terminology: ticket, resolution, first contact resolution (FCR), escalation, CSAT, NPS, SLA
- Metrics: average resolution time, CSAT score, first contact resolution %, ticket volume, customer effort score
- Scenarios: high volume periods, complex issue resolution, customer escalation, knowledge base gaps, process improvements
- Tools: ticketing systems, knowledge base platforms, communication tools
- Success: customer satisfaction, resolution efficiency, response time, cost per ticket
    `,
    management: `
MANAGEMENT/LEADERSHIP SPECIFICS:
- Use terminology: performance management, strategic planning, resource allocation, stakeholder management, organizational alignment
- Metrics: team performance score, employee engagement, retention rate %, goal achievement %, team productivity
- Scenarios: team performance issues, organizational restructuring, talent development, cross-functional collaboration, change management
- Success: team engagement, goal achievement, talent retention, organizational growth, strategic alignment
    `,
    operations: `
OPERATIONS INDUSTRY SPECIFICS:
- Use terminology: process optimization, efficiency, capacity planning, supply chain, SLA, KPI, bottleneck
- Metrics: process efficiency %, cost per unit, cycle time, capacity utilization %, waste reduction %
- Scenarios: process bottlenecks, cost reduction initiatives, capacity planning, vendor management, continuous improvement
- Success: efficiency gains, cost reduction, improved throughput, quality improvements
    `,
    qa: `
QA/TESTING INDUSTRY SPECIFICS:
- Use terminology: test coverage, defect rate, regression testing, automation, test cases, UAT, release readiness
- Metrics: defect detection rate, test coverage %, escape rate %, automation ratio %, testing efficiency
- Scenarios: release quality concerns, testing bottlenecks, automation strategy, bug prioritization, resource constraints
- Success: quality improvement, test coverage increase, defect reduction, faster release cycles
    `,
    data: `
DATA ANALYTICS/SCIENCE INDUSTRY SPECIFICS:
- Use terminology: data quality, statistical significance, model accuracy, data pipeline, ETL, SQL, Python, visualization
- Metrics: data quality score, model accuracy %, data completeness %, query performance, data freshness
- Scenarios: data quality issues, model performance degradation, reporting delays, stakeholder insights requests, data governance
- Success: data quality improvement, faster insights delivery, accurate analysis, stakeholder confidence
    `,
    design: `
DESIGN INDUSTRY SPECIFICS:
- Use terminology: user research, usability testing, design system, wireframes, prototypes, accessibility, user flows
- Metrics: user satisfaction score, task completion rate, time on task, design consistency %, user engagement
- Scenarios: design iteration challenges, user research findings, design system implementation, accessibility concerns, user feedback
- Success: improved user satisfaction, better usability, design efficiency, consistency
    `,
    hr: `
HR/RECRUITMENT INDUSTRY SPECIFICS:
- Use terminology: talent acquisition, onboarding, performance management, employee engagement, retention, compensation
- Metrics: time to hire, cost per hire, employee retention %, engagement score, offer acceptance rate
- Scenarios: high turnover, recruitment challenges, onboarding gaps, talent development, compensation analysis
- Success: talent retention, hiring efficiency, employee engagement, organizational growth
    `,
    general: `
GENERAL BUSINESS SPECIFICS:
- Use terminology: KPI, performance metrics, stakeholders, resources, constraints, timeline, quality
- Metrics: general business metrics relevant to the role
- Scenarios: realistic business challenges with multiple dimensions
- Success: objective achievement, stakeholder satisfaction, efficiency improvements
    `
  };

  return requirements[industry] || requirements.general;
}

// Extract text from uploaded files
async function extractTextFromFile(file) {
  try {
    if (file.mimetype === 'application/pdf') {
      const data = await pdf(file.buffer);
      return data.text;
    } else if (
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } else if (file.mimetype === 'text/plain') {
      return file.buffer.toString('utf-8');
    }
    return '';
  } catch (err) {
    console.error(`Error extracting text from ${file.originalname}:`, err);
    return '';
  }
}

// Process all uploaded documents
async function processUploadedDocuments(files) {
  if (!files || files.length === 0) {
    return '';
  }

  const extractedTexts = [];
  
  for (const file of files) {
    console.log(`📄 Processing file: ${file.originalname}`);
    const text = await extractTextFromFile(file);
    if (text) {
      extractedTexts.push(`--- From: ${file.originalname} ---\n${text}`);
    }
  }

  return extractedTexts.join('\n\n');
}

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

    // Find the first opening brace
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.slice(firstBrace);
    }

    if (firstBrace === -1) {
      throw new Error("No JSON object found in response");
    }

    // Remove any trailing content after the last closing brace
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }

    // Fix common escape sequence issues
    cleaned = cleaned
      // Fix bad unicode escapes like \uXXX that aren't valid hex
      .replace(/\\u(?![0-9a-fA-F]{4})/g, '\\u0000')
      // Fix incomplete escapes at end of strings
      .replace(/\\+$/g, '')
      // Fix lone backslashes before quotes
      .replace(/\\+"/g, '\\"')
      // Fix tabs and control characters inside strings
      .replace(/[\t\r]/g, (match) => match === '\t' ? '\\t' : '\\r');

    // Handle newlines inside strings more carefully
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
        // Skip control characters
        if (char.charCodeAt(0) < 32 && char !== '\n' && char !== '\r' && char !== '\t') {
          continue;
        }
      }
      
      result += char;
      escaped = false;
    }
    
    cleaned = result;

    // Remove any trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    // Auto-close unclosed braces/brackets
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

    // Try to parse
    try {
      return JSON.parse(cleaned);
    } catch (err1) {
      console.warn("⚠️  First parse attempt failed, trying aggressive cleanup...");
      
      // Find the last valid JSON object
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
        console.warn("⚠️  Recovered partial JSON from position", lastValid);
        return lastValid;
      }

      throw err1;
    }
  } catch (err) {
    console.error("❌ JSON Sanitization Error:", err.message);
    console.error("   First 200 chars:", jsonString?.substring(0, 200));
    console.error("   Last 200 chars:", jsonString?.substring(jsonString.length - 200));
    return null;
  }
}


// Main generate endpoint
router.post("/generate", authMiddleware, upload.fields([
  { name: 'documents', maxCount: 5 },
  { name: 'jobDescription', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = req.user;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can create case studies" });
    }

    let { 
      jobId, 
      duration, 
      instructions, 
      caseStudyType, 
      contentLength, 
      numQuestions, 
      difficultyLevel, 
      links,
      // NEW: Psychometrics
      enablePsychometrics,
      psychometricTypes,
      // NEW: Assessment mode
      isAssessment,
      numCaseStudies,
      includeCompanyBackground,
      // NEW: Assessment Modules
      enableAssessmentModules,
      assessmentModules,
      moduleSettings,
      antiCheating
    } = req.body;

    // Normalize inputs
    const typeNormalization = {
      'analytical': 'analytical',
      'Analytical': 'analytical',
      'scenario': 'scenario',
      'Scenario-Based': 'scenario',
      'scenario-based': 'scenario',
      'creative': 'creative',
      'Creative': 'creative',
      'technical': 'technical',
      'Technical': 'technical'
    };
    
    const normalizedType = typeNormalization[caseStudyType] || 'scenario';
    const validTypes = ['scenario', 'technical', 'creative', 'analytical'];
    const finalCaseStudyType = validTypes.includes(normalizedType) ? normalizedType : 'scenario';
    
    const lengthMap = {
      'short': { words: '300-500', minutes: 30 },
      'medium': { words: '600-900', minutes: 60 },
      'long': { words: '1000-1500', minutes: 120 }
    };
    
    const contentLengthNormalized = contentLength || 'medium';
    const lengthConfig = lengthMap[contentLengthNormalized] || lengthMap.medium;
    
    // numQuestionsInt will be derived from assessment modules when provided; fallback to legacy slider value otherwise. Declare here and set after parsing modules.
    let numQuestionsInt = null;
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    const finalDifficultyLevel = validDifficulties.includes(difficultyLevel) ? difficultyLevel : 'medium';
    
    // Parse psychometrics
    let selectedPsychometrics = [];
    if (enablePsychometrics === 'true' || enablePsychometrics === true) {
      try {
        selectedPsychometrics = typeof psychometricTypes === 'string' 
          ? JSON.parse(psychometricTypes) 
          : (Array.isArray(psychometricTypes) ? psychometricTypes : []);
      } catch (e) {
        console.warn('Error parsing psychometric types:', e);
        selectedPsychometrics = [];
      }
    }

    // Parse assessment modules
    let selectedAssessmentModules = [];
    let parsedModuleSettings = {};
    let parsedAntiCheating = {};

    // If modules are expected, parse robustly and log input for debugging
    if (enableAssessmentModules === 'true' || enableAssessmentModules === true) {
      try {
        console.log('Raw assessmentModules input:', assessmentModules);

        // helper to parse various shapes (stringified JSON, quoted JSON, arrays)
        const tryParseItem = (item) => {
          if (typeof item !== 'string') return item;
          let cur = item.trim();
          // strip wrapping single/double quotes
          if ((cur.startsWith('"') && cur.endsWith('"')) || (cur.startsWith("'") && cur.endsWith("'"))) {
            cur = cur.slice(1, -1);
          }
          // try JSON parse
          try {
            return JSON.parse(cur);
          } catch (err) {
            // last attempt: try parsing original item
            try {
              return JSON.parse(item);
            } catch (err2) {
              return item;
            }
          }
        };

        if (typeof assessmentModules === 'string') {
          const parsed = tryParseItem(assessmentModules);
          selectedAssessmentModules = Array.isArray(parsed) ? parsed : [parsed];
        } else if (Array.isArray(assessmentModules)) {
          selectedAssessmentModules = assessmentModules.flatMap(item => {
            const parsed = tryParseItem(item);
            return Array.isArray(parsed) ? parsed : [parsed];
          });
        } else {
          selectedAssessmentModules = [];
        }

        // Normalize: filter falsy and dedupe
        selectedAssessmentModules = Array.from(new Set(selectedAssessmentModules.filter(Boolean)));

        // Parse moduleSettings which might be an object, stringified object, or array of stringified objects
        let moduleSettingsObj = {};
        if (typeof moduleSettings === 'string') {
          const parsed = tryParseItem(moduleSettings);
          moduleSettingsObj = (parsed && typeof parsed === 'object') ? parsed : {};
        } else if (Array.isArray(moduleSettings)) {
          // prefer first object that parses correctly, otherwise merge all
          const parsedList = moduleSettings.map(it => tryParseItem(it)).filter(Boolean);
          for (const p of parsedList) {
            if (p && typeof p === 'object') {
              moduleSettingsObj = Object.assign(moduleSettingsObj, p);
            }
          }
        } else if (moduleSettings && typeof moduleSettings === 'object') {
          moduleSettingsObj = moduleSettings;
        }

        // Normalize counts to integers
        Object.keys(moduleSettingsObj || {}).forEach(k => {
          const v = moduleSettingsObj[k];
          if (typeof v === 'string') {
            const n = parseInt(v, 10);
            moduleSettingsObj[k] = Number.isFinite(n) ? n : v;
          }
        });

        parsedModuleSettings = moduleSettingsObj;

        console.log('Parsed assessment modules:', selectedAssessmentModules);
        console.log('Parsed moduleSettings:', parsedModuleSettings);

      } catch (e) {
        console.warn('Error parsing assessment modules:', e);
        selectedAssessmentModules = [];
      }
    } else {
      // If modules are no longer optional in this flow, enforce selection
      console.warn('Assessment modules are disabled by request; modules are required.');
    }
    
    // Parse anti-cheating settings independently (not dependent on enableAssessmentModules)
    try {
      parsedAntiCheating = typeof antiCheating === 'string'
        ? JSON.parse(antiCheating)
        : (antiCheating || {});
    } catch (e) {
      console.warn('Error parsing anti-cheating settings:', e);
      parsedAntiCheating = {};
    }

    const numCaseStudiesInt = Math.min(Math.max(parseInt(numCaseStudies) || 3, 1), 3);
if (![1, 2, 3].includes(numCaseStudiesInt)) {
  return res.status(400).json({ error: "numCaseStudies must be 1, 2, or 3" });
}

    console.log(`📊 Number of case studies to generate: ${numCaseStudiesInt}`);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📊 CASE STUDY GENERATION INITIATED`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`📋 Configuration:`);
    console.log(`   Include Company Background: ${includeCompanyBackground === 'true' || includeCompanyBackground === true ? 'YES' : 'NO'}`);
    console.log(`   Type: ${finalCaseStudyType.toUpperCase()}`);
    console.log(`   Length: ${contentLengthNormalized} (${lengthConfig.words} words)`);
    // Debug: log raw incoming module fields to aid debugging of module parsing issues
    console.log('Incoming raw assessmentModules (from form):', assessmentModules);
    console.log('Incoming raw moduleSettings (from form):', moduleSettings);
    console.log('Incoming raw numQuestions (legacy slider):', numQuestions);
    // Determine number of questions from modules only. Questions slider is deprecated and no longer used.
    let moduleDerivedTotal = 0;
    if (selectedAssessmentModules && selectedAssessmentModules.length > 0) {
      selectedAssessmentModules.forEach(mod => {
        const key = `${mod}Count`;
        let val = parsedModuleSettings && (parsedModuleSettings[key] || parsedModuleSettings[key] === 0) ? parsedModuleSettings[key] : 0;
        if (typeof val === 'string') val = parseInt(val) || 0;
        moduleDerivedTotal += (Number.isFinite(val) ? val : 0);
      });

      // Require at least one positive module count
      if (moduleDerivedTotal > 0) {
        numQuestionsInt = Math.min(Math.max(moduleDerivedTotal, 1), 50); // cap to 50
        console.log(`   Modules selected with total questions: ${numQuestionsInt} (breakdown: ${selectedAssessmentModules.map(m => `${m}:${parsedModuleSettings[`${m}Count`]||0}`).join(', ')})`);
      } else {
        console.warn('No positive module counts provided; must specify positive counts for selected modules. Parsed modules:', selectedAssessmentModules, 'Parsed moduleSettings:', parsedModuleSettings);
        return res.status(400).json({ error: 'Select at least one assessment module and specify positive question counts for it.', parsedAssessmentModules: selectedAssessmentModules, parsedModuleSettings });
      }
    } else {
      console.warn('No assessment modules selected; modules are required for generation. Raw input:', assessmentModules, 'moduleSettings:', moduleSettings);
      return res.status(400).json({ error: 'Select at least one assessment module (e.g., mcq, openEnded) and specify question counts.', rawAssessmentModules: assessmentModules, rawModuleSettings: moduleSettings });
    }

    console.log(`   Difficulty: ${finalDifficultyLevel.toUpperCase()}`);
    console.log(`   Duration: ${duration || 120} minutes`);
    console.log(`   Psychometrics: ${selectedPsychometrics.length > 0 ? selectedPsychometrics.join(', ') : 'None'}`);
    console.log(`   Assessment Modules: ${selectedAssessmentModules.length > 0 ? selectedAssessmentModules.join(', ') : 'None'}`);
    // DEBUG: log raw inputs to help diagnose module vs questions behavior
    console.log(`   Raw assessmentModules input:`, assessmentModules);
    console.log(`   Parsed assessment modules:`, selectedAssessmentModules);
    console.log(`   Parsed moduleSettings:`, parsedModuleSettings);
    console.log(`   Assessment Mode: ${isAssessment === 'true' || isAssessment === true ? 'YES' : 'NO'}`);

    let job = null;
    let jobIdToUse = null;
    let jobDescriptionText = '';
    let assessmentId = null;
    let assessmentShareLink = null;

    // Handle assessment mode (job description text or document) vs normal mode (job selection)
    if (isAssessment === 'true' || isAssessment === true) {
      // Assessment mode can accept a pasted text OR an uploaded file
      // Accept multiple possible field names to be robust
      const rawPasted =
        (req.body && typeof req.body.jobDescriptionText === 'string' && req.body.jobDescriptionText) ||
        (req.body && typeof req.body.job_description_text === 'string' && req.body.job_description_text) ||
        (req.body && typeof req.body.jdText === 'string' && req.body.jdText) ||
        '';
      const pastedText = String(rawPasted || '').trim();

      if (pastedText && pastedText.length >= 20) {
        jobDescriptionText = pastedText;
        console.log(`📝 Using pasted job description text (${jobDescriptionText.length} chars)`);
      } else {
        // Fallback to file processing
        const jobDescFile = req.files && req.files.jobDescription ? req.files.jobDescription[0] : null;
        if (!jobDescFile) {
          return res.status(400).json({ error: "Provide a job description text or upload a document for assessment mode" });
        }

        console.log(`\n📄 Processing job description document: ${jobDescFile.originalname}`);
        jobDescriptionText = await extractTextFromFile(jobDescFile);
        
        if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
          return res.status(400).json({ error: "Failed to extract text from job description document" });
        }
      }

      console.log(`✅ Extracted ${jobDescriptionText.length} characters from job description`);

      // Create synthetic job object from extracted text
      // Try to extract job title and key responsibilities from the text
      const titleMatch = jobDescriptionText.match(/(?:job title|position|role)[\s:]+([^\n]{5,100})/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Case Study Assessment';
      
      // Extract key responsibilities (look for common patterns)
      const responsibilitiesMatch = jobDescriptionText.match(/(?:responsibilities|key responsibilities|duties)[\s:]*(.+?)(?:\n\n|\n[A-Z]|$)/is);
      const responsibilities = responsibilitiesMatch ? responsibilitiesMatch[1].trim() : jobDescriptionText.substring(0, 500);

      job = {
        id: null,
        title: title,
        description: jobDescriptionText,
        key_responsibilities: responsibilities
      };

      // Get recruiter profile ID
      const [recruiterRows] = await db.query(
        `SELECT id FROM recruiter_profiles WHERE user_id = ?`,
        [user.id]
      );
      
      if (!recruiterRows || recruiterRows.length === 0) {
        return res.status(404).json({ error: "Recruiter profile not found" });
      }
      
      const recruiterId = recruiterRows[0].id;

      // Create assessment record with shareable link
      assessmentShareLink = crypto.randomBytes(16).toString('hex');
      const [assessmentResult] = await db.query(
        `INSERT INTO case_study_assessments 
         (recruiter_id, user_id, job_description_text, share_link, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
          recruiterId,
          user.id,
          jobDescriptionText,
          assessmentShareLink
        ]
      );
      assessmentId = assessmentResult.insertId;
      console.log(`✅ Created assessment record with ID: ${assessmentId}, share link: ${assessmentShareLink}`);
      
    } else {
      // Normal mode: Fetch job from database
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required when not in assessment mode" });
      }

      const [jobRows] = await db.query(
        `SELECT j.id, j.title, j.description, j.key_responsibilities
         FROM jobs j
         INNER JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
         WHERE j.id = ? AND rp.user_id = ?`,
        [jobId, user.id]
      );

      if (!jobRows || jobRows.length === 0) {
        return res.status(404).json({ error: "Job not found or unauthorized" });
      }

      job = jobRows[0];
      jobIdToUse = job.id;
    }

    const generationBatch = uuidv4();
    const generatedCaseStudies = [];
    const errors = [];

    // Process uploaded documents (additional documents, not job description)
    let documentContext = '';
    const additionalFiles = req.files && req.files.documents ? req.files.documents : [];
    if (additionalFiles && additionalFiles.length > 0) {
      console.log(`\n📂 Processing ${additionalFiles.length} additional document(s)...`);
      documentContext = await processUploadedDocuments(additionalFiles);
      console.log(`✅ Extracted ${documentContext.length} characters from documents`);
    }

    // Process links
    let linkContext = '';
    if (links) {
      try {
        const urlList = JSON.parse(links);
        console.log(`\n🔗 Processing ${urlList.length} link(s)...`);
        
        for (const url of urlList) {
          try {
            const linkContent = await fetchUrlContent(url);
            if (linkContent) {
              linkContext += `\n--- From: ${url} ---\n${linkContent}\n`;
            }
          } catch (linkErr) {
            console.warn(`   ⚠️ Failed to fetch ${url}:`, linkErr.message);
          }
        }
        
        console.log(`✅ Extracted ${linkContext.length} characters from links`);
      } catch (parseErr) {
        console.warn('⚠️ Error parsing links:', parseErr.message);
      }
    }

    // Combine contexts (include job description text for assessments)
    let combinedContext = documentContext + linkContext;
    if (isAssessment === 'true' || isAssessment === true) {
      combinedContext = jobDescriptionText + '\n\n' + combinedContext;
    }
// NEW: Extract company background from ALL sources and add to context
    let companyBackgroundText = '';
    
    if (includeCompanyBackground === 'true' || includeCompanyBackground === true) {
      console.log(`\n🏢 Extracting company background from all sources...`);
      console.log(`   ↳ Job Description: ${job && job.description ? '✓' : '✗'}`);
      console.log(`   ↳ Uploaded Documents: ${documentContext.length > 0 ? '✓' : '✗'}`);
      console.log(`   ↳ Web Links: ${linkContext.length > 0 ? '✓' : '✗'}`);
      
      const extracted = await extractCompanyBackground(
        jobDescriptionText,
        job,
        documentContext,
        linkContext
      );
      
      if (extracted) {
        // Add company background to the context that will be passed to AI
        companyBackgroundText = `\n\n=== COMPANY BACKGROUND ===\n${extracted}\n=== END COMPANY BACKGROUND ===\n`;

        // Try to parse a company name from the extracted background if job.company_name is not already set
        try {
          if (!job.company_name) {
            const nameMatch = extracted.match(/^(.*?)(?:\s(?:is|was|founded|established)\b)/i);
            if (nameMatch && nameMatch[1]) {
              const parsedName = nameMatch[1].replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '').trim();
              if (parsedName.length > 1 && parsedName.length < 100) {
                job.company_name = parsedName;
                console.log(`✅ Parsed company name from background: ${job.company_name}`);
              }
            }
          }
        } catch (parseErr) {
          console.warn('⚠️ Failed to parse company name from background:', parseErr.message);
        }

        console.log(`✅ Company background extracted and will be included in case study`);
      }
    }
    // Generate psychometric context
    const psychometricContext = getPsychometricContext(selectedPsychometrics);
// Combine all contexts - NOW INCLUDES COMPANY BACKGROUND
    const fullContextForAI = combinedContext + companyBackgroundText + psychometricContext;
    const PRIMARY_PROVIDER = 'openai';
    const FALLBACK_PROVIDERS = ['groq', 'gemini'];

    console.log(`\n🎓 GENERATING ${numCaseStudiesInt} CASE STUDY VARIANT${numCaseStudiesInt > 1 ? 'S' : ''}`);
    console.log(`📋 Job: ${job ? job.title : 'Assessment Mode'}`);
    console.log(`👤 Recruiter: ${user.id}`);
    console.log(`📄 Documents: ${additionalFiles ? additionalFiles.length : 0} | 🔗 Links: ${links ? JSON.parse(links).length : 0}`);
    console.log(`🧠 Psychometrics: ${selectedPsychometrics.length > 0 ? selectedPsychometrics.join(', ') : 'None'}`);
    console.log(`🤖 Provider Strategy: ${PRIMARY_PROVIDER.toUpperCase()} (primary) → ${FALLBACK_PROVIDERS.map(p => p.toUpperCase()).join(' → ')} (fallback)`);
    console.log(`🤖 Provider Strategy: ${PRIMARY_PROVIDER.toUpperCase()} (primary) → ${FALLBACK_PROVIDERS.map(p => p.toUpperCase()).join(' → ')} (fallback)`);
    if (assessmentId) {
      console.log(`🔗 Assessment Share Link: ${assessmentShareLink}`);
    }
    console.log(`${'═'.repeat(70)}\n`);


    // 🗑️ CLEANUP: Delete old draft case studies for this job before generating new ones
    // This prevents old unpublished case studies from showing up in preview
    if (jobIdToUse) {
      try {
        console.log(`\n🗑️ Cleaning up old draft case studies for job ${jobIdToUse}...`);
        
        // First, get the IDs of draft case studies to delete
        const [draftCaseStudies] = await db.query(
          `SELECT id FROM case_studies 
           WHERE job_id = ? 
           AND status = 'draft' 
           AND is_selected = 0`,
          [jobIdToUse]
        );
        
        if (draftCaseStudies && draftCaseStudies.length > 0) {
          const caseStudyIds = draftCaseStudies.map(cs => cs.id);
          console.log(`   Found ${caseStudyIds.length} draft case studies to delete: ${caseStudyIds.join(', ')}`);
          
          // Delete associated questions
          await db.query(
            `DELETE FROM case_study_questions 
             WHERE case_study_id IN (?)`,
            [caseStudyIds]
          );
          
          // Delete associated tables
          await db.query(
            `DELETE FROM case_study_tables 
             WHERE case_study_id IN (?)`,
            [caseStudyIds]
          );
          
          // Delete the case studies themselves
          await db.query(
            `DELETE FROM case_studies 
             WHERE id IN (?)`,
            [caseStudyIds]
          );
          
          console.log(`   ✅ Deleted ${caseStudyIds.length} old draft case studies and their associated data`);
        } else {
          console.log(`   ℹ️ No old draft case studies found to clean up`);
        }
      } catch (cleanupErr) {
        console.warn(`   ⚠️ Error during cleanup (non-critical):`, cleanupErr.message);
        // Don't fail the entire request if cleanup fails
      }
    }

    // Generate 3 variants
    for (let i = 1; i <= numCaseStudiesInt; i++) {
      let caseStudyGenerated = false;
      let lastError = null;
      const providersToTry = [PRIMARY_PROVIDER, ...FALLBACK_PROVIDERS];
      let selectedProvider = PRIMARY_PROVIDER;

      for (const provider of providersToTry) {
        try {
          if (caseStudyGenerated) break;

          const prompt = generateAdaptiveStructuredPrompt(
            job,
            duration,
            instructions,
            i,
            finalCaseStudyType,
            fullContextForAI,
            lengthConfig.words,
            numQuestionsInt,
            finalDifficultyLevel,
            selectedAssessmentModules,
            parsedModuleSettings
          );

          // Prepare a friendly modules summary for logs if modules are selected
          let moduleLogParts = [];
          let moduleTotalForLog = 0;
          if (selectedAssessmentModules && selectedAssessmentModules.length > 0) {
            moduleLogParts = selectedAssessmentModules.map(m => {
              const key = `${m}Count`;
              const cnt = (parsedModuleSettings && (typeof parsedModuleSettings[key] !== 'undefined')) ? parsedModuleSettings[key] : 0;
              moduleTotalForLog += Number(cnt || 0);
              return `${m}: ${cnt}`;
            });
          }

          console.log(`${'─'.repeat(70)}`);
          console.log(`🔄 VARIANT ${i}/3: Generating case study...`);
          if (moduleLogParts.length > 0) {
            console.log(`   Type: ${finalCaseStudyType} | Difficulty: ${finalDifficultyLevel} | Modules: ${moduleLogParts.join(', ')} (total ${moduleTotalForLog})`);
          } else {
            console.log(`   Type: ${finalCaseStudyType} | Difficulty: ${finalDifficultyLevel} | Questions: ${numQuestionsInt}`);
          }
          console.log(`   🤖 Provider: ${provider.toUpperCase()}`);
          if (selectedPsychometrics.length > 0) {
            console.log(`   🧠 Psychometrics: ${selectedPsychometrics.join(', ')}`);
          }
          
          // Remove any legacy 'Questions:' lines from the prompt before logging or sending
          const sanitizedPromptForSend = String(prompt).replace(/(^|\n)\s*-?\s*Questions:.*$/gmi, '');

          appendAiLog('prompt', { jobId: job.id || null, variant: i, provider, prompt: sanitizeForLogging(sanitizedPromptForSend).substring(0, 4000) });

          let aiContent = await aiService.generateContent(sanitizedPromptForSend, provider);
          console.log(`✅ AI response received from ${provider.toUpperCase()}: ${aiContent.length} characters`);

          appendAiLog('response', { jobId: job.id || null, variant: i, provider, response: sanitizeForLogging(aiContent).substring(0, 4000), length: aiContent.length });

          console.log(`🔧 Sanitizing and parsing JSON...`);
          const caseStudyData = sanitizeJSON(aiContent);

          if (!caseStudyData) {
            appendAiLog('parse_error', { jobId: job.id || null, variant: i, provider, reason: 'invalid_json', raw: sanitizeForLogging(aiContent).substring(0, 2000) });
            throw new Error('Failed to parse AI response - invalid JSON returned');
          }

          // If we have a parsed company name, replace any generic 'Company XYZ' placeholders in AI output
          try {
            const parsedName = job && job.company_name ? String(job.company_name).trim() : null;
            if (parsedName && parsedName.length > 1) {
              const replacePlaceholders = (text) => {
                if (!text || typeof text !== 'string') return text;
                return text.replace(/Company XYZ/g, parsedName).replace(/Company\s+XYZ/g, parsedName);
              };

              if (caseStudyData.en) {
                caseStudyData.en.description = replacePlaceholders(caseStudyData.en.description);
                caseStudyData.en.instructions = replacePlaceholders(caseStudyData.en.instructions);
                if (Array.isArray(caseStudyData.en.questions)) {
                  caseStudyData.en.questions = caseStudyData.en.questions.map(q => replacePlaceholders(q));
                }
              }

              if (caseStudyData.ar) {
                // Try to replace an Arabic literal placeholder if present (best-effort)
                caseStudyData.ar.description = caseStudyData.ar.description ? caseStudyData.ar.description.replace(/Company XYZ/g, parsedName) : caseStudyData.ar.description;
                caseStudyData.ar.instructions = caseStudyData.ar.instructions ? caseStudyData.ar.instructions.replace(/Company XYZ/g, parsedName) : caseStudyData.ar.instructions;
                if (Array.isArray(caseStudyData.ar.questions)) {
                  caseStudyData.ar.questions = caseStudyData.ar.questions.map(q => (typeof q === 'string' ? q.replace(/Company XYZ/g, parsedName) : q));
                }
              }

            }
          } catch (replaceErr) {
            console.warn('⚠️ Failed to replace Company XYZ placeholder:', replaceErr.message);
          }

          // If Arabic content missing or incomplete, attempt targeted regeneration/translation before failing
          async function attemptRecoverArabic(caseStudyDataObj) {
            try {
              appendAiLog('recovery_attempt', { jobId: job.id || null, variant: i, provider, step: 'starting_recovery' });

              // 1) Ask AI to produce ONLY the Arabic section given the English section
              const recoveryPrompt = `Translate the following JSON 'en' section into Arabic. RETURN ONLY VALID JSON with top-level key 'ar' that contains 'description', 'instructions', 'questions', and 'tables' matching the same structure and counts as the provided 'en'.\n\nENGLISH_JSON:\n${JSON.stringify({ en: caseStudyDataObj.en })}`;

              appendAiLog('recovery_prompt', { jobId: job.id || null, variant: i, provider, prompt: sanitizeForLogging(recoveryPrompt).substring(0, 4000) });

              try {
                const recoveryResp = await aiService.generateContent(recoveryPrompt, provider);
                appendAiLog('recovery_response', { jobId: job.id || null, variant: i, provider, response: sanitizeForLogging(recoveryResp).substring(0, 4000) });
                const recovered = sanitizeJSON(recoveryResp);
                if (recovered && recovered.ar && recovered.ar.description && recovered.ar.instructions && Array.isArray(recovered.ar.questions) && recovered.ar.questions.length === (caseStudyDataObj.en.questions || []).length) {
                  caseStudyDataObj.ar = recovered.ar;
                  appendAiLog('recovery_success', { jobId: job.id || null, variant: i, provider });
                  return true;
                }
              } catch (recErr) {
                appendAiLog('recovery_failed_ai', { jobId: job.id || null, variant: i, provider, error: recErr.message });
              }

              // 2) Fallback to deterministic translation for critical fields (safe fallback)
              try {
                const translated = {};
                translated.description = await translationService.translateToArabic(caseStudyDataObj.en.description || '');
                translated.instructions = await translationService.translateToArabic(caseStudyDataObj.en.instructions || '');
                translated.questions = [];
                for (const q of (caseStudyDataObj.en.questions || [])) {
                  translated.questions.push(await translationService.translateToArabic(q));
                }
                translated.tables = (caseStudyDataObj.en.tables || []).map(t => {
                  const rows = (t.rows || []).map(r => {
                    const newRow = {};
                    Object.keys(r).forEach(k => {
                      newRow[k] = r[k] ? translationService.translateToArabic(String(r[k])) : '';
                    });
                    return newRow;
                  });
                  return Object.assign({}, t, { title: translationService.translateToArabic(t.title || ''), rows });
                });

                // Wait for any pending translations to resolve
                const resolvedTranslated = {
                  description: await translated.description,
                  instructions: await translated.instructions,
                  questions: await Promise.all(translated.questions),
                  tables: await Promise.all(translated.tables.map(async t => {
                    // t.title may be a promise
                    const title = await t.title;
                    const rows = await Promise.all((t.rows || []).map(async r => {
                      const newR = {};
                      for (const k of Object.keys(r)) {
                        newR[k] = await r[k];
                      }
                      return newR;
                    }));
                    return Object.assign({}, t, { title, rows });
                  }))
                };

                caseStudyDataObj.ar = resolvedTranslated;
                appendAiLog('recovery_success_translation', { jobId: job.id || null, variant: i, provider });
                return true;
              } catch (transErr) {
                appendAiLog('recovery_failed_translation', { jobId: job.id || null, variant: i, provider, error: transErr.message });
              }

            } catch (e) {
              appendAiLog('recovery_failed', { jobId: job.id || null, variant: i, provider, error: e.message });
            }
            return false;
          }

          // If en or ar section missing, try recovery path instead of failing immediately
          if (!caseStudyData.en || !caseStudyData.ar) {
            appendAiLog('missing_sections', { jobId: job.id || null, variant: i, provider, details: { has_en: !!caseStudyData.en, has_ar: !!caseStudyData.ar } });
            const recovered = await attemptRecoverArabic(caseStudyData);
            if (!recovered) {
              throw new Error('Missing English or Arabic sections in AI response and recovery failed');
            }
          }

          const requiredFields = ['description', 'instructions', 'questions'];
          for (const field of requiredFields) {
            if (!caseStudyData.en[field]) {
              appendAiLog('missing_field', { jobId: job.id || null, variant: i, provider, section: 'en', field });
              throw new Error(`Missing ${field} in English section`);
            }
            if (!caseStudyData.ar[field]) {
              appendAiLog('missing_field', { jobId: job.id || null, variant: i, provider, section: 'ar', field });
              // Try to recover the single missing field
              const singleFieldRecovered = await attemptRecoverArabic(caseStudyData);
              if (!singleFieldRecovered) {
                throw new Error(`Missing ${field} in Arabic section and recovery failed`);
              }
            }
          }

          console.log(`🔧 Generating relevant titles for case study...`);

          const titleGenerationPrompt = `
You are an expert at creating concise, relevant case study titles.

Based on this case study focus area and content, generate 2 titles:
1. An English title (max 80 characters, compelling and specific)
2. An Arabic title (max 80 characters, compelling and specific)

CONTEXT:
Job: ${job.title}
Case Study Type: ${finalCaseStudyType}
${selectedPsychometrics.length > 0 ? `Psychometric Focus: ${selectedPsychometrics.join(', ')}` : ''}
Description Summary: ${caseStudyData.en.description.substring(0, 300)}...

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "title_en": "English title here",
  "title_ar": "العنوان بالعربية هنا"
}
`;

          let titleData = { title_en: '', title_ar: '' };
          try {
            const titleResponse = await aiService.generateContent(titleGenerationPrompt, provider);
            const titleJSON = sanitizeJSON(titleResponse);
            if (titleJSON && titleJSON.title_en && titleJSON.title_ar) {
              titleData = {
                title_en: titleJSON.title_en.substring(0, 80),
                title_ar: titleJSON.title_ar.substring(0, 80)
              };
              console.log(`✅ Generated titles:`);
              console.log(`   EN: ${titleData.title_en}`);
              console.log(`   AR: ${titleData.title_ar}`);
            }
          } catch (titleErr) {
            console.warn(`⚠️ Failed to generate titles, using fallback:`, titleErr.message);
            titleData = {
              title_en: `${job.title} - Case Study`,
              title_ar: `${job.title} - دراسة الحالة`
            };
          }

          // Insert into database
          const [insertResult] = await db.query(
            `INSERT INTO case_studies 
              (job_id, user_id, title, title_ar, description, description_ar, 
               instructions, instructions_ar, duration_minutes, 
               generation_batch, is_selected, is_active, status, case_study_type,
               content_length, num_questions, difficulty_level,
               tabular_data_en, tabular_data_ar, ai_provider,
               enable_psychometrics, psychometric_types,
               created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              jobIdToUse, // Will be NULL for assessments
              user.id,
              titleData.title_en,
              titleData.title_ar,
              caseStudyData.en.description,
              caseStudyData.ar.description,
              caseStudyData.en.instructions,
              caseStudyData.ar.instructions,
              caseStudyData.duration_minutes || duration || 120,
              generationBatch,
              finalCaseStudyType,
              contentLengthNormalized,
              numQuestionsInt,
              finalDifficultyLevel,
              JSON.stringify(caseStudyData.en.tables || []),
              JSON.stringify(caseStudyData.ar.tables || []),
              provider,
              selectedPsychometrics.length > 0 ? 1 : 0,
              JSON.stringify(selectedPsychometrics)
            ]
          );

          const caseStudyId = insertResult.insertId;
          console.log(`📝 Case study inserted with ID: ${caseStudyId}`);

          // Insert questions (legacy simple questions) ONLY if there are NO assessment modules selected
          if ((!selectedAssessmentModules || selectedAssessmentModules.length === 0) && Array.isArray(caseStudyData.en.questions) && Array.isArray(caseStudyData.ar.questions)) {
            const questionsToInsert = Math.min(
              numQuestionsInt,
              caseStudyData.en.questions.length,
              caseStudyData.ar.questions.length
            );
            
            for (let qIndex = 0; qIndex < questionsToInsert; qIndex++) {
              await db.query(
                "INSERT INTO case_study_questions (case_study_id, question, question_ar) VALUES (?, ?, ?)",
                [
                  caseStudyId,
                  caseStudyData.en.questions[qIndex],
                  caseStudyData.ar.questions[qIndex]
                ]
              );
            }
            console.log(`❓ Inserted ${questionsToInsert} legacy questions`);
          } else if (selectedAssessmentModules && selectedAssessmentModules.length > 0) {
            console.log(`ℹ️ Skipping legacy question insertion because assessment modules are used`);
          }
          
          // Insert tables
          if (Array.isArray(caseStudyData.en.tables)) {
            for (const table of caseStudyData.en.tables) {
              await db.query(
                `INSERT INTO case_study_tables 
                 (case_study_id, table_id, table_title, table_title_ar, column_definitions, rows_data, language)
                 VALUES (?, ?, ?, ?, ?, ?, 'en')`,
                [
                  caseStudyId,
                  table.table_id || uuidv4(),
                  table.title || '',
                  table.title_ar || table.title || '',
                  JSON.stringify(table.columns || []),
                  JSON.stringify(table.rows || [])
                ]
              );
            }
            console.log(`📊 Inserted ${caseStudyData.en.tables.length} English tables`);
          }

          if (Array.isArray(caseStudyData.ar.tables)) {
            for (const table of caseStudyData.ar.tables) {
              await db.query(
                `INSERT INTO case_study_tables 
                 (case_study_id, table_id, table_title, table_title_ar, column_definitions, rows_data, language)
                 VALUES (?, ?, ?, ?, ?, ?, 'ar')`,
                [
                  caseStudyId,
                  table.table_id || uuidv4(),
                  table.title || '',
                  table.title_ar || table.title || '',
                  JSON.stringify(table.columns || []),
                  JSON.stringify(table.rows || [])
                ]
              );
            }
            console.log(`📊 Inserted ${caseStudyData.ar.tables.length} Arabic tables`);
          }

          // NEW: Generate and store assessment modules if enabled
          let generatedModules = null;
          if (selectedAssessmentModules.length > 0) {
            console.log(`\n🎯 Generating assessment modules for case study ${caseStudyId}...`);

            // Build a concise case-study context (description + table summaries) to ensure modules reference scenario context
            let caseStudyContextForModules = '';
            try {
              const parts = [];
              if (caseStudyData && caseStudyData.en && caseStudyData.en.description) {
                parts.push(`CASE STUDY DESCRIPTION:\n${caseStudyData.en.description}`);
              }

              if (caseStudyData && caseStudyData.en && Array.isArray(caseStudyData.en.tables) && caseStudyData.en.tables.length > 0) {
                const tblSummaries = [];
                for (const tbl of caseStudyData.en.tables) {
                  const cols = (tbl.columns || []).map(c => (c.label || c.key || c)).join(' | ');
                  const sampleRows = (tbl.rows || []).slice(0,3).map(r => JSON.stringify(r)).join(' ; ');
                  tblSummaries.push(`- ${tbl.title || tbl.table_id || 'table'}: columns: ${cols}${sampleRows ? `. sample_rows: ${sampleRows}` : ''}`);
                }
                parts.push(`TABLE SUMMARIES:\n${tblSummaries.join('\n')}`);
              }

              if (parts.length > 0) {
                caseStudyContextForModules = parts.join('\n\n');
              }
            } catch (ctxErr) {
              console.warn('⚠️ Failed to build caseStudyContextForModules:', ctxErr.message);
            }

            // Append the original full context as fallback and provide an explicit instruction to use the case study context
            const modulePromptContext = `CONTEXT USAGE INSTRUCTION: Use the CASE STUDY DESCRIPTION and TABLE SUMMARIES below as the primary source when generating module questions; reference specific metrics, table titles, and named entities when relevant.\n\n${caseStudyContextForModules}\n\nFALLBACK CONTEXT:\n${fullContextForAI}`;

            appendAiLog('module_context', { caseStudyId, variant: i, provider, context: sanitizeForLogging(caseStudyContextForModules).substring(0,2000) });
            
            const moduleGenResult = await generateAssessmentModules(
              job,
              selectedAssessmentModules,
              parsedModuleSettings,
              finalDifficultyLevel,
              modulePromptContext,
              provider,
              selectedPsychometrics // Pass psychometric types to module generator
            );
            
            generatedModules = moduleGenResult.results;

            // Attach a truncated context summary for traceability
            try {
              moduleGenResult.context_summary = sanitizeForLogging(caseStudyContextForModules).substring(0,2000);
              appendAiLog('module_generation_result', { caseStudyId, variant: i, provider, summary: moduleGenResult.context_summary, module_counts: moduleLogParts || null });
            } catch (attachErr) {
              console.warn('⚠️ Failed to attach module context summary:', attachErr.message);
            }
            
            // Store MCQ questions
            if (generatedModules.mcq && generatedModules.mcq.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.mcq.length; qIdx++) {
                const mcq = generatedModules.mcq[qIdx];
                const correctAnswer = mcq.options.find(o => o.is_correct)?.id || 'A';
                const [insertedQ] = await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar, 
                    options, correct_answers, time_limit, weight, question_order, created_at)
                   VALUES (?, 'mcq', ?, ?, ?, ?, ?, 1.0, ?, NOW())`,
                  [
                    caseStudyId,
                    mcq.question_en,
                    mcq.question_ar,
                    JSON.stringify(mcq.options),
                    JSON.stringify([correctAnswer]),
                    null,
                    qIdx
                  ]
                );
                
                // Store scoring rule
                await db.query(
                  `INSERT INTO scoring_rules 
                   (question_id, rule_name, rule_type, rule_config, points_awarded, created_at)
                   VALUES (?, 'MCQ Exact Match', 'exact_match', ?, 10, NOW())`,
                  [insertedQ.insertId, JSON.stringify({ explanation_en: mcq.explanation_en, explanation_ar: mcq.explanation_ar })]
                );
              }
              console.log(`📝 Stored ${generatedModules.mcq.length} MCQ questions`);
            }
            
            // Store open-ended questions
            if (generatedModules.openEnded && generatedModules.openEnded.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.openEnded.length; qIdx++) {
                const openQ = generatedModules.openEnded[qIdx];
                const [insertedQ] = await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar,
                    keywords, time_limit, weight, min_word_count, max_word_count, question_order, created_at)
                   VALUES (?, 'open_ended', ?, ?, ?, ?, 1.0, ?, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    openQ.question_en,
                    openQ.question_ar,
                    JSON.stringify(openQ.expected_keywords || []),
                    null,
                    openQ.min_word_count || 50,
                    openQ.max_word_count || 500,
                    qIdx
                  ]
                );
                
                // Store scoring rule with keywords
                await db.query(
                  `INSERT INTO scoring_rules 
                   (question_id, rule_name, rule_type, rule_config, points_awarded, created_at)
                   VALUES (?, 'Keyword Match', 'keyword_match', ?, 10, NOW())`,
                  [insertedQ.insertId, JSON.stringify({
                    keywords: openQ.expected_keywords,
                    match_type: 'any',
                    case_sensitive: false,
                    scoring_criteria_en: openQ.scoring_criteria_en,
                    scoring_criteria_ar: openQ.scoring_criteria_ar,
                    sample_strong_response_en: openQ.sample_strong_response_en,
                    sample_strong_response_ar: openQ.sample_strong_response_ar,
                    min_word_count: openQ.min_word_count,
                    max_word_count: openQ.max_word_count
                  })]
                );
              }
              console.log(`📝 Stored ${generatedModules.openEnded.length} open-ended questions`);
            }
            
            // Store video response questions
            if (generatedModules.videoResponse && generatedModules.videoResponse.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.videoResponse.length; qIdx++) {
                const videoQ = generatedModules.videoResponse[qIdx];
                await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar,
                    time_limit, min_video_duration, max_video_duration, weight, question_order, rubric, created_at)
                   VALUES (?, 'video_response', ?, ?, ?, ?, ?, 1.0, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    videoQ.question_en,
                    videoQ.question_ar,
                    null,
                    videoQ.preparation_time_seconds || 30,
                    videoQ.max_response_time_seconds || 180,
                    qIdx,
                    JSON.stringify({
                      evaluation_criteria_en: videoQ.evaluation_criteria_en,
                      evaluation_criteria_ar: videoQ.evaluation_criteria_ar,
                      tips_for_candidate_en: videoQ.tips_for_candidate_en,
                      tips_for_candidate_ar: videoQ.tips_for_candidate_ar
                    })
                  ]
                );
              }
              console.log(`🎥 Stored ${generatedModules.videoResponse.length} video response questions`);
            }
            
            // Store coding challenges
            if (generatedModules.codingChallenge && generatedModules.codingChallenge.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.codingChallenge.length; qIdx++) {
                const coding = generatedModules.codingChallenge[qIdx];
                const [insertedQ] = await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar,
                    time_limit, weight, question_order, test_cases, starter_code, skill_tags, created_at)
                   VALUES (?, 'coding', ?, ?, ?, 2.0, ?, ?, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    coding.problem_statement_en,
                    coding.problem_statement_ar,
                    null,
                    qIdx,
                    JSON.stringify(coding.test_cases || []),
                    JSON.stringify(coding.starter_code || {}),
                    JSON.stringify(coding.tags || [])
                  ]
                );
                
                // Store test cases as scoring rule
                if (coding.test_cases && coding.test_cases.length > 0) {
                  await db.query(
                    `INSERT INTO scoring_rules 
                     (question_id, rule_name, rule_type, rule_config, points_awarded, created_at)
                     VALUES (?, 'Code Test Cases', 'test_case', ?, 100, NOW())`,
                    [insertedQ.insertId, JSON.stringify({ 
                      test_cases: coding.test_cases,
                      timeout_ms: 5000,
                      input_format_en: coding.input_format_en,
                      output_format_en: coding.output_format_en,
                      constraints_en: coding.constraints_en,
                      examples: coding.examples
                    })]
                  );
                }
              }
              console.log(`💻 Stored ${generatedModules.codingChallenge.length} coding challenges`);
            }
            
            // Store SQL problems
            if (generatedModules.sqlProblem && generatedModules.sqlProblem.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.sqlProblem.length; qIdx++) {
                const sql = generatedModules.sqlProblem[qIdx];
                const [insertedQ] = await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar,
                    time_limit, weight, question_order, expected_response, skill_tags, created_at)
                   VALUES (?, 'sql', ?, ?, ?, 2.0, ?, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    sql.task_en,
                    sql.task_ar,
                    null,
                    qIdx,
                    sql.solution_query || '',
                    JSON.stringify(sql.concepts || [])
                  ]
                );
                
                // Store schema and expected output as scoring rule
                await db.query(
                  `INSERT INTO scoring_rules 
                   (question_id, rule_name, rule_type, rule_config, points_awarded, created_at)
                   VALUES (?, 'SQL Output Match', 'code_output', ?, 100, NOW())`,
                  [insertedQ.insertId, JSON.stringify({ 
                    expected_output: sql.expected_output,
                    solution_query: sql.solution_query,
                    schema: sql.schema,
                    hints_en: sql.hints_en,
                    hints_ar: sql.hints_ar,
                    concepts: sql.concepts
                  })]
                );
              }
              console.log(`🗄️ Stored ${generatedModules.sqlProblem.length} SQL problems`);
            }
            
            // Store Excel tasks
            if (generatedModules.excelTask && generatedModules.excelTask.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.excelTask.length; qIdx++) {
                const excel = generatedModules.excelTask[qIdx];
                await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar,
                    time_limit, weight, question_order, spreadsheet_template, spreadsheet_solution, skill_tags, created_at)
                   VALUES (?, 'excel', ?, ?, ?, 2.0, ?, ?, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    excel.scenario_en,
                    excel.scenario_ar,
                    null,
                    qIdx,
                    JSON.stringify(excel.starter_data || {}),
                    JSON.stringify(excel.expected_outputs || []),
                    JSON.stringify(excel.skills || [])
                  ]
                );
              }
              console.log(`📊 Stored ${generatedModules.excelTask.length} Excel tasks`);
            }
            
            // Store writing exercises
            if (generatedModules.writingExercise && generatedModules.writingExercise.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.writingExercise.length; qIdx++) {
                const writing = generatedModules.writingExercise[qIdx];
                await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar,
                    time_limit, weight, question_order, min_word_count, max_word_count, rubric, created_at)
                   VALUES (?, 'writing', ?, ?, ?, 1.0, ?, ?, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    writing.scenario_en,
                    writing.scenario_ar,
                    null,
                    qIdx,
                    writing.word_count_min || 200,
                    writing.word_count_max || 500,
                    JSON.stringify(writing.rubric || {})
                  ]
                );
              }
              console.log(`📄 Stored ${generatedModules.writingExercise.length} writing exercises`);
            }
            
            // Store situational judgment tests
            if (generatedModules.situationalJudgment && generatedModules.situationalJudgment.length > 0) {
              for (let qIdx = 0; qIdx < generatedModules.situationalJudgment.length; qIdx++) {
                const sjt = generatedModules.situationalJudgment[qIdx];
                await db.query(
                  `INSERT INTO custom_questions 
                   (case_study_id, question_type, question_text, question_text_ar, options,
                    time_limit, weight, question_order, skill_tags, created_at)
                   VALUES (?, 'situational', ?, ?, ?, ?, 1.0, ?, ?, NOW())`,
                  [
                    caseStudyId,
                    sjt.scenario_en + '\n\n' + sjt.question_en,
                    sjt.scenario_ar + '\n\n' + sjt.question_ar,
                    JSON.stringify(sjt.options),
                    null,
                    qIdx,
                    JSON.stringify(sjt.competencies_assessed || [])
                  ]
                );
              }
              console.log(`🎯 Stored ${generatedModules.situationalJudgment.length} situational judgment tests`);
            }
            
            console.log(`✅ Assessment modules generation complete for case study ${caseStudyId}`);
          }

          // Store anti-cheating settings independently (outside assessment modules block)
          if (Object.keys(parsedAntiCheating).length > 0) {
            await db.query(
              `INSERT INTO anti_cheating_settings 
               (case_study_id, prevent_tab_switch, disable_copy_paste, 
                webcam_snapshots_interval, require_webcam, require_fullscreen, tab_switch_limit, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                caseStudyId,
                parsedAntiCheating.enableTabSwitch ? 1 : 0,
                parsedAntiCheating.enableCopyPaste ? 1 : 0,
                (typeof parsedAntiCheating.webcam_snapshots_interval !== 'undefined' ? parsedAntiCheating.webcam_snapshots_interval : (parsedAntiCheating.enableWebcamProctoring ? 30 : 0)),
                parsedAntiCheating.enableWebcamProctoring ? 1 : 0,
                parsedAntiCheating.enableFullscreen ? 1 : 0,
                parsedAntiCheating.maxTabSwitches || 3
              ]
            );
            console.log(`🔒 Stored anti-cheating settings`);
          }

          generatedCaseStudies.push({
            id: caseStudyId,
            variant: i,
            title: titleData.title_en,
            title_ar: titleData.title_ar,
            ai_provider: provider,
            case_study_type: finalCaseStudyType,
            content_length: contentLengthNormalized,
            difficulty_level: finalDifficultyLevel,
            num_questions: (selectedAssessmentModules && selectedAssessmentModules.length > 0) ? Object.keys(parsedModuleSettings || {}).reduce((sum, key) => key.endsWith('Count') ? sum + Number(parsedModuleSettings[key] || 0) : sum, 0) : numQuestionsInt,
            duration: caseStudyData.duration_minutes || duration || 120,
            enable_psychometrics: selectedPsychometrics.length > 0,
            psychometric_types: selectedPsychometrics,
            // NEW: Assessment modules info
            enable_assessment_modules: selectedAssessmentModules.length > 0,
            assessment_modules: selectedAssessmentModules,
            module_settings: parsedModuleSettings,
            anti_cheating: parsedAntiCheating,
            generated_modules_summary: generatedModules ? {
              mcq: generatedModules.mcq?.length || 0,
              openEnded: generatedModules.openEnded?.length || 0,
              videoResponse: generatedModules.videoResponse?.length || 0,
              codingChallenge: generatedModules.codingChallenge?.length || 0,
              sqlProblem: generatedModules.sqlProblem?.length || 0,
              excelTask: generatedModules.excelTask?.length || 0,
              writingExercise: generatedModules.writingExercise?.length || 0,
              situationalJudgment: generatedModules.situationalJudgment?.length || 0
            } : null
          });

          // If assessment mode, link case study to assessment
          if (assessmentId && i === 1) {
            // Update assessment with the first case study ID
            await db.query(
              `UPDATE case_study_assessments 
               SET case_study_id = ?, updated_at = NOW()
               WHERE id = ?`,
              [caseStudyId, assessmentId]
            );
          }

          console.log(`✅ VARIANT ${i} COMPLETE`);
          console.log(`${'─'.repeat(70)}\n`);

          caseStudyGenerated = true;
          selectedProvider = provider;

        } catch (err) {
          lastError = err;
          console.warn(`\n⚠️ VARIANT ${i} - Provider ${provider.toUpperCase()} failed:`, err.message);
          
          if (provider === providersToTry[providersToTry.length - 1]) {
            console.error(`\n❌ ERROR - VARIANT ${i}: ALL PROVIDERS FAILED`);
            errors.push({
              variant: i,
              ai_providers_tried: providersToTry,
              error: err.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    console.log(`${'═'.repeat(70)}`);
    console.log(`🎉 GENERATION COMPLETE`);
    console.log(`   ✅ Success: ${generatedCaseStudies.length}/3`);
    console.log(`   ❌ Failed: ${errors.length}/3`);
    console.log(`${'═'.repeat(70)}\n`);

    if (generatedCaseStudies.length === 0) {
      return res.status(500).json({ 
        error: "Failed to generate all case studies", 
        errors,
        details: "No case studies were successfully created"
      });
    }

    // If assessment mode, update response with assessment info
    const responseData = {
  success: true,
  message: `✅ Generated ${generatedCaseStudies.length}/${numCaseStudiesInt} case studies successfully`,
  generationBatch,
  caseStudies: generatedCaseStudies,
  summary: {
    caseStudyType: finalCaseStudyType,
    contentLength: contentLengthNormalized,
    difficultyLevel: finalDifficultyLevel,
    numQuestions: (selectedAssessmentModules && selectedAssessmentModules.length > 0) ? Object.keys(parsedModuleSettings || {}).reduce((sum, key) => key.endsWith('Count') ? sum + Number(parsedModuleSettings[key] || 0) : sum, 0) : numQuestionsInt,
    numCaseStudies: numCaseStudiesInt,
    duration: duration || 120,
    enablePsychometrics: selectedPsychometrics.length > 0,
    psychometricTypes: selectedPsychometrics,
    // NEW: Assessment modules summary
    enableAssessmentModules: selectedAssessmentModules.length > 0,
    assessmentModules: selectedAssessmentModules,
    moduleSettings: parsedModuleSettings,
    antiCheating: parsedAntiCheating,
    jobId: jobIdToUse || jobId,
    jobTitle: job ? job.title : 'Case Study Assessment'
  },
  total: generatedCaseStudies.length,
  documentsProcessed: additionalFiles ? additionalFiles.length : 0,
  linksProcessed: links ? JSON.parse(links).length : 0,
  errors: errors.length > 0 ? errors : null,
  generatedAt: new Date().toISOString()
};

    // Add assessment info if in assessment mode
    if (assessmentId) {
      responseData.assessmentId = assessmentId;
      responseData.assessmentShareLink = assessmentShareLink;
    }

    res.json(responseData);

  } catch (err) {
    console.error("\n❌ CRITICAL ERROR IN GENERATION:");
    console.error(`   Message: ${err.message}`);
    console.error(`   Stack: ${err.stack}\n`);
    res.status(500).json({ 
      error: "Failed to generate case studies", 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// UPDATE GET ENDPOINTS TO INCLUDE PSYCHOMETRICS
// ============================================
// Route 1: /assessments (MUST be before /:id)
router.get("/assessments", authMiddleware, languageMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can view assessments" });
    }

    // Get recruiter profile ID
    const [recruiterRows] = await db.query(
      `SELECT id FROM recruiter_profiles WHERE user_id = ?`,
      [user.id]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    // Get assessments with case study info
    const [assessments] = await db.query(
      `SELECT 
        csa.id,
        csa.share_link,
        csa.status,
        csa.created_at,
        csa.updated_at,
        csa.case_study_id,
        cs.title as case_study_title,
        cs.title_ar as case_study_title_ar,
        COALESCE(COUNT(DISTINCT ja.id), 0) as total_applications,
        COALESCE(COUNT(DISTINCT CASE WHEN ja.status = 'case_study_completed' THEN ja.id END), 0) as completed_count,
        COALESCE(COUNT(DISTINCT csi.id), 0) as invited_count
      FROM case_study_assessments csa
      LEFT JOIN case_studies cs ON csa.case_study_id = cs.id
      LEFT JOIN case_study_invitations csi ON csi.case_study_id = cs.id
      LEFT JOIN job_applications ja ON ja.id = csi.job_application_id
      WHERE csa.recruiter_id = ?
      GROUP BY csa.id, csa.share_link, csa.status, csa.created_at, csa.updated_at, csa.case_study_id, cs.title, cs.title_ar
      ORDER BY csa.created_at DESC`,
      [recruiterId]
    );

    res.json({
      success: true,
      assessments: assessments || []
    });
  } catch (err) {
    console.error("❌ Error fetching assessments:", err);
    res.status(500).json({ error: "Failed to fetch assessments", details: err.message });
  }
});
// Route 2: /assessments/share/:shareLink (public, no auth)
router.get("/assessments/share/:shareLink", async (req, res) => {
  try {
    const { shareLink } = req.params;

    const [assessments] = await db.query(
      `SELECT 
        csa.id,
        csa.share_link,
        csa.status,
        csa.case_study_id,
        cs.title as case_study_title,
        cs.title_ar as case_study_title_ar
      FROM case_study_assessments csa
      LEFT JOIN case_studies cs ON csa.case_study_id = cs.id
      WHERE csa.share_link = ? AND csa.status = 'active'`,
      [shareLink]
    );

    if (!assessments || assessments.length === 0) {
      return res.status(404).json({ error: "Assessment not found or inactive" });
    }

    res.json({
      success: true,
      assessment: assessments[0]
    });
  } catch (err) {
    console.error("❌ Error fetching assessment by share link:", err);
    res.status(500).json({ error: "Failed to fetch assessment", details: err.message });
  }
});

// Update job endpoint - FIXED
router.get("/job/:jobId", authMiddleware, languageMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;
    const lang = req.language || 'en';

    if (!['applicant', 'recruiter'].includes(user.user_type)) {
      return res.status(403).json({ 
        error: 'Access denied. Only applicants and recruiters can view case studies.' 
      });
    }

    const [caseStudies] = await db.query(
      `SELECT 
        cs.id, cs.job_id, cs.user_id,
        ${lang === 'ar' ? 'COALESCE(cs.title_ar, cs.title)' : 'cs.title'} as title,
        ${lang === 'ar' ? 'COALESCE(cs.description_ar, cs.description)' : 'cs.description'} as description,
        ${lang === 'ar' ? 'COALESCE(cs.instructions_ar, cs.instructions)' : 'cs.instructions'} as instructions,
        cs.duration_minutes, cs.is_active, cs.status, 
        cs.enable_psychometrics, cs.psychometric_types,
        cs.created_at
      FROM case_studies cs
      WHERE cs.job_id = ? AND cs.is_active = 1 AND cs.status = 'published' AND cs.is_selected = 1 
      ORDER BY cs.created_at DESC`,
      [jobId]
    );

    for (let cs of caseStudies) {
      const [questions] = await db.query(
        `SELECT ${lang === 'ar' ? 'COALESCE(question_ar, question)' : 'question'} as question, weight 
         FROM case_study_questions WHERE case_study_id = ? ORDER BY id`,
        [cs.id]
      );
      cs.questions = questions.map((q) => q.question);
      cs.questionWeights = questions.map((q) => parseFloat(q.weight) || 1.0);

      const [tables] = await db.query(
        `SELECT * FROM case_study_tables WHERE case_study_id = ? AND language = ?`,
        [cs.id, lang]
      );
      cs.tables = tables.map(t => {
        const cols = typeof t.column_definitions === 'string' 
          ? JSON.parse(t.column_definitions) 
          : t.column_definitions;
        const rows = typeof t.rows_data === 'string' 
          ? JSON.parse(t.rows_data) 
          : t.rows_data;
        
        return {
          id: t.id,
          table_id: t.table_id,
          title: t.table_title,
          columns: cols,
          rows: rows
        };
      });

      // FIXED: Add psychometrics data with proper null handling
      cs.psychometrics = {
        enabled: cs.enable_psychometrics === 1,
        types: parsePsychometricTypes(cs.psychometric_types)
      };

      // NEW: Fetch custom questions (assessment modules) for job-based case studies
      const [customQuestions] = await db.query(
        `SELECT 
          id, question_type, 
          ${lang === 'ar' ? 'COALESCE(question_text_ar, question_text)' : 'question_text'} as question_text,
          question_text as question_text_en,
          question_text_ar,
          options, correct_answers, keywords, rubric,
          time_limit, weight, question_order,
          min_word_count, max_word_count, min_video_duration, max_video_duration,
          test_cases, starter_code, spreadsheet_template, spreadsheet_solution,
          expected_response, skill_tags
        FROM custom_questions 
        WHERE case_study_id = ? AND is_active = 1
        ORDER BY question_order ASC`,
        [cs.id]
      );

      cs.customQuestions = customQuestions.map(q => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
        correct_answers: q.correct_answers ? (typeof q.correct_answers === 'string' ? JSON.parse(q.correct_answers) : q.correct_answers) : null,
        keywords: q.keywords ? (typeof q.keywords === 'string' ? JSON.parse(q.keywords) : q.keywords) : null,
        rubric: q.rubric ? (typeof q.rubric === 'string' ? JSON.parse(q.rubric) : q.rubric) : null,
        test_cases: q.test_cases ? (typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases) : null,
        starter_code: q.starter_code ? (typeof q.starter_code === 'string' ? JSON.parse(q.starter_code) : q.starter_code) : null,
        spreadsheet_template: q.spreadsheet_template ? (typeof q.spreadsheet_template === 'string' ? JSON.parse(q.spreadsheet_template) : q.spreadsheet_template) : null,
        spreadsheet_solution: q.spreadsheet_solution ? (typeof q.spreadsheet_solution === 'string' ? JSON.parse(q.spreadsheet_solution) : q.spreadsheet_solution) : null,
        skill_tags: q.skill_tags ? (typeof q.skill_tags === 'string' ? JSON.parse(q.skill_tags) : q.skill_tags) : null,
      }));

      // Fetch anti-cheating settings and map to frontend-expected field names
      const [antiCheatingResults] = await db.query(
        `SELECT * FROM anti_cheating_settings WHERE case_study_id = ? LIMIT 1`,
        [cs.id]
      );
      
      if (antiCheatingResults.length > 0) {
        const raw = antiCheatingResults[0];
        cs.antiCheatingSettings = {
          ...raw,
          fullscreen_required: raw.require_fullscreen === 1 || raw.require_fullscreen === true,
          tab_switch_detection: raw.prevent_tab_switch === 1 || raw.prevent_tab_switch === true,
          copy_paste_disabled: raw.disable_copy_paste === 1 || raw.disable_copy_paste === true,
          webcam_required: raw.require_webcam === 1 || raw.require_webcam === true,
          tab_switch_limit: raw.tab_switch_limit || 3,
          tab_switch_action: raw.tab_switch_action || 'flag',
        };
      } else {
        cs.antiCheatingSettings = null;
      }
    }

    res.status(200).json({ 
      success: true,
      caseStudies, 
      language: lang,
      total: caseStudies.length 
    });

  } catch (err) {
    console.error("❌ Error fetching case studies:", err);
    res.status(500).json({ 
      error: "Server error",
      details: err.message 
    });
  }
});

// ALSO UPDATE: batch endpoint - FIXED
router.get("/batch/:batchId", authMiddleware, languageMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { batchId } = req.params;
    const lang = req.language || 'en';

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can view case studies" });
    }

    const [caseStudies] = await db.query(
      `SELECT 
        id, job_id, user_id,
        ${lang === 'ar' ? 'COALESCE(title_ar, title)' : 'title'} as title,
        ${lang === 'ar' ? 'COALESCE(description_ar, description)' : 'description'} as description,
        ${lang === 'ar' ? 'COALESCE(instructions_ar, instructions)' : 'instructions'} as instructions,
        duration_minutes, generation_batch, is_selected, is_active, status, 
        enable_psychometrics, psychometric_types,
        created_at, updated_at
      FROM case_studies 
      WHERE generation_batch = ? AND user_id = ? AND status IN ('draft', 'in_review')
      ORDER BY created_at DESC`,
      [batchId, user.id]
    );

    for (let cs of caseStudies) {
      const [questions] = await db.query(
        `SELECT ${lang === 'ar' ? 'COALESCE(question_ar, question)' : 'question'} as question, weight 
         FROM case_study_questions WHERE case_study_id = ? ORDER BY id`,
        [cs.id]
      );
      cs.questions = questions.map((q) => q.question);
      cs.questionWeights = questions.map((q) => parseFloat(q.weight) || 1.0);

      const [tables] = await db.query(
        `SELECT 
          id, table_id, table_title, table_title_ar, 
          column_definitions, rows_data, language
        FROM case_study_tables 
        WHERE case_study_id = ? AND language = ?
        ORDER BY id`,
        [cs.id, lang]
      );

      cs.tables = tables.map(t => {
        const cols = typeof t.column_definitions === 'string' 
          ? JSON.parse(t.column_definitions) 
          : t.column_definitions;
        const rows = typeof t.rows_data === 'string' 
          ? JSON.parse(t.rows_data) 
          : t.rows_data;
        
        return {
          id: t.id,
          table_id: t.table_id,
          title: t.table_title,
          title_ar: t.table_title_ar,
          columns: cols,
          rows: rows,
          language: t.language
        };
      });

      // FIXED: Add psychometrics data with proper null handling
      cs.psychometrics = {
        enabled: cs.enable_psychometrics === 1,
        types: parsePsychometricTypes(cs.psychometric_types)
      };

      // NEW: Fetch custom questions (assessment modules)
      const [customQuestions] = await db.query(
        `SELECT 
          id, question_type, 
          ${lang === 'ar' ? 'COALESCE(question_text_ar, question_text)' : 'question_text'} as question_text,
          question_text as question_text_en,
          question_text_ar,
          options, correct_answers, keywords, rubric,
          time_limit, weight, question_order,
          min_word_count, max_word_count, min_video_duration, max_video_duration,
          test_cases, starter_code, spreadsheet_template, spreadsheet_solution,
          expected_response, skill_tags
        FROM custom_questions 
        WHERE case_study_id = ? AND is_active = 1
        ORDER BY question_order ASC`,
        [cs.id]
      );

      cs.customQuestions = customQuestions.map(q => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
        correct_answers: q.correct_answers ? (typeof q.correct_answers === 'string' ? JSON.parse(q.correct_answers) : q.correct_answers) : null,
        keywords: q.keywords ? (typeof q.keywords === 'string' ? JSON.parse(q.keywords) : q.keywords) : null,
        rubric: q.rubric ? (typeof q.rubric === 'string' ? JSON.parse(q.rubric) : q.rubric) : null,
        test_cases: q.test_cases ? (typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases) : null,
        starter_code: q.starter_code ? (typeof q.starter_code === 'string' ? JSON.parse(q.starter_code) : q.starter_code) : null,
        spreadsheet_template: q.spreadsheet_template ? (typeof q.spreadsheet_template === 'string' ? JSON.parse(q.spreadsheet_template) : q.spreadsheet_template) : null,
        spreadsheet_solution: q.spreadsheet_solution ? (typeof q.spreadsheet_solution === 'string' ? JSON.parse(q.spreadsheet_solution) : q.spreadsheet_solution) : null,
        skill_tags: q.skill_tags ? (typeof q.skill_tags === 'string' ? JSON.parse(q.skill_tags) : q.skill_tags) : null,
      }));

      // Fetch anti-cheating settings for this case study and map to frontend names
      const [antiCheatingResults] = await db.query(
        `SELECT * FROM anti_cheating_settings WHERE case_study_id = ? LIMIT 1`,
        [cs.id]
      );
      
      if (antiCheatingResults.length > 0) {
        const raw = antiCheatingResults[0];
        cs.antiCheatingSettings = {
          ...raw,
          fullscreen_required: raw.require_fullscreen === 1 || raw.require_fullscreen === true,
          tab_switch_detection: raw.prevent_tab_switch === 1 || raw.prevent_tab_switch === true,
          copy_paste_disabled: raw.disable_copy_paste === 1 || raw.disable_copy_paste === true,
          webcam_required: raw.require_webcam === 1 || raw.require_webcam === true,
          tab_switch_limit: raw.tab_switch_limit || 3,
          tab_switch_action: raw.tab_switch_action || 'flag',
        };
      } else {
        cs.antiCheatingSettings = null;
      }
    }

    res.json({ 
      success: true,
      caseStudies, 
      language: lang,
      total: caseStudies.length,
      batchId: batchId
    });
  } catch (err) {
    console.error("❌ Error fetching batch case studies:", err);
    res.status(500).json({ error: "Failed to fetch case studies", details: err.message });
  }
});
// Close Assessment
router.put("/:id/close", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const [assessment] = await db.query(
      `SELECT recruiter_id FROM case_study_assessments WHERE id = ?`,
      [id]
    );

    if (!assessment || assessment.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const [recruiter] = await db.query(
      `SELECT user_id FROM recruiter_profiles WHERE id = ?`,
      [assessment[0].recruiter_id]
    );

    if (!recruiter || recruiter[0].user_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.query(
      `UPDATE case_study_assessments SET status = 'closed', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    res.json({ 
      success: true,
      message: "Assessment closed successfully" 
    });
  } catch (err) {
    console.error("Error closing assessment:", err);
    res.status(500).json({ error: "Failed to close assessment" });
  }
});

// Open/Reopen Assessment
router.put("/assessments/:id/open", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can manage assessments" });
    }

    const [assessment] = await db.query(
      `SELECT csa.id, csa.recruiter_id, rp.user_id
       FROM case_study_assessments csa
       LEFT JOIN recruiter_profiles rp ON csa.recruiter_id = rp.id
       WHERE csa.id = ?`,
      [id]
    );

    if (!assessment || assessment.length === 0) {
      return res.status(404).json({ 
        error: "Assessment not found",
        details: `No assessment found with ID: ${id}`
      });
    }

    // Verify ownership
    if (assessment[0].user_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized - you do not own this assessment" });
    }

    const result = await db.query(
      `UPDATE case_study_assessments 
       SET status = 'active', updated_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    if (result[0].affectedRows === 0) {
      return res.status(500).json({ error: "Failed to update assessment status" });
    }

    res.json({ 
      success: true,
      message: "✅ Assessment reopened successfully",
      assessmentId: id
    });
  } catch (err) {
    console.error("❌ Error opening assessment:", err);
    res.status(500).json({ 
      error: "Failed to open assessment",
      details: err.message 
    });
  }
});
// ALSO UPDATE: /my endpoint - FIXED
router.get("/my", authMiddleware, languageMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const lang = req.language || 'en';

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can view their case studies" });
    }

    const [caseStudies] = await db.query(
      `SELECT 
        id, job_id, user_id,
        ${lang === 'ar' ? 'COALESCE(title_ar, title)' : 'title'} as title,
        ${lang === 'ar' ? 'COALESCE(description_ar, description)' : 'description'} as description,
        ${lang === 'ar' ? 'COALESCE(instructions_ar, instructions)' : 'instructions'} as instructions,
        duration_minutes, generation_batch, is_selected, is_active, status, 
        enable_psychometrics, psychometric_types,
        created_at, updated_at
      FROM case_studies 
      WHERE user_id = ? AND is_selected = 1
      ORDER BY created_at DESC`,
      [user.id]
    );

    for (let cs of caseStudies) {
      const [questions] = await db.query(
        `SELECT ${lang === 'ar' ? 'COALESCE(question_ar, question)' : 'question'} as question, weight 
         FROM case_study_questions WHERE case_study_id = ? ORDER BY id`,
        [cs.id]
      );
      cs.questions = questions.map((q) => q.question);
      cs.questionWeights = questions.map((q) => parseFloat(q.weight) || 1.0);

      const [tables] = await db.query(
        `SELECT * FROM case_study_tables WHERE case_study_id = ? AND language = ?`,
        [cs.id, lang]
      );
      cs.tables = tables.map(t => {
        const cols = typeof t.column_definitions === 'string' 
          ? JSON.parse(t.column_definitions) 
          : t.column_definitions;
        const rows = typeof t.rows_data === 'string' 
          ? JSON.parse(t.rows_data) 
          : t.rows_data;
        
        return {
          id: t.id,
          table_id: t.table_id,
          title: t.table_title,
          columns: cols,
          rows: rows
        };
      });

      // FIXED: Add psychometrics data with proper null handling
      cs.psychometrics = {
        enabled: cs.enable_psychometrics === 1,
        types: parsePsychometricTypes(cs.psychometric_types)
      };
    }

    res.json({ 
      success: true,
      caseStudies, 
      language: lang,
      total: caseStudies.length 
    });
  } catch (err) {
    console.error("❌ Error fetching recruiter case studies:", err);
    res.status(500).json({ error: "Failed to fetch case studies", details: err.message });
  }
});
// ALSO UPDATE: Generic GET by ID - FIXED
router.get("/:id", authMiddleware, languageMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const lang = req.language || "en";

    // Check if user has access to this case study
    // Either through ownership (recruiter) or through invitation (applicant - for both job-based and assessment-based)
    const [caseStudies] = await db.query(
      `SELECT 
        cs.id, cs.job_id, cs.user_id,
        ${lang === "ar" ? "COALESCE(cs.title_ar, cs.title)" : "cs.title"} as title,
        ${lang === "ar" ? "COALESCE(cs.description_ar, cs.description)" : "cs.description"} as description,
        ${lang === "ar" ? "COALESCE(cs.instructions_ar, cs.instructions)" : "cs.instructions"} as instructions,
        cs.duration_minutes, cs.generation_batch, cs.is_selected, cs.is_active, cs.status, 
        cs.enable_psychometrics, cs.psychometric_types,
        cs.created_at, cs.updated_at
      FROM case_studies cs
      WHERE cs.id = ?
      AND (
        cs.user_id = ? 
        OR EXISTS (
          SELECT 1 FROM case_study_invitations csi
          JOIN job_applications ja ON csi.job_application_id = ja.id
          WHERE csi.case_study_id = cs.id 
          AND (ja.user_id = ? OR ja.email = ?)
        )
      )`,
      [id, user.id, user.id, user.email || '']
    );

    if (!caseStudies || caseStudies.length === 0) {
      return res.status(404).json({ error: "Case study not found or access denied" });
    }

    const cs = caseStudies[0];

    // Get questions with weights
    const [questions] = await db.query(
      `SELECT ${lang === "ar" ? "COALESCE(question_ar, question)" : "question"} as question, weight 
       FROM case_study_questions WHERE case_study_id = ? ORDER BY id`,
      [cs.id]
    );
    cs.questions = questions.map((q) => q.question);
    cs.questionWeights = questions.map((q) => parseFloat(q.weight) || 1.0);

    // Get tables
    const [tables] = await db.query(
      `SELECT * FROM case_study_tables WHERE case_study_id = ? AND language = ?`,
      [cs.id, lang]
    );
    cs.tables = tables.map(t => {
      const cols = typeof t.column_definitions === 'string' 
        ? JSON.parse(t.column_definitions) 
        : t.column_definitions;
      const rows = typeof t.rows_data === 'string' 
        ? JSON.parse(t.rows_data) 
        : t.rows_data;
      
      return {
        id: t.id,
        table_id: t.table_id,
        title: t.table_title,
        columns: cols,
        rows: rows
      };
    });

    // FIXED: Add psychometrics data with proper null handling
    cs.psychometrics = {
      enabled: cs.enable_psychometrics === 1,
      types: parsePsychometricTypes(cs.psychometric_types)
    };

    // NEW: Fetch custom questions (assessment modules)
    const [customQuestions] = await db.query(
      `SELECT 
        id, question_type, 
        ${lang === 'ar' ? 'COALESCE(question_text_ar, question_text)' : 'question_text'} as question_text,
        question_text as question_text_en,
        question_text_ar,
        options, correct_answers, keywords, rubric,
        time_limit, weight, question_order,
        min_word_count, max_word_count, min_video_duration, max_video_duration,
        test_cases, starter_code, spreadsheet_template, spreadsheet_solution,
        expected_response, skill_tags
      FROM custom_questions 
      WHERE case_study_id = ? AND is_active = 1
      ORDER BY question_order ASC`,
      [cs.id]
    );

    cs.customQuestions = customQuestions.map(q => ({
      ...q,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      correct_answers: q.correct_answers ? (typeof q.correct_answers === 'string' ? JSON.parse(q.correct_answers) : q.correct_answers) : null,
      keywords: q.keywords ? (typeof q.keywords === 'string' ? JSON.parse(q.keywords) : q.keywords) : null,
      rubric: q.rubric ? (typeof q.rubric === 'string' ? JSON.parse(q.rubric) : q.rubric) : null,
      test_cases: q.test_cases ? (typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases) : null,
      starter_code: q.starter_code ? (typeof q.starter_code === 'string' ? JSON.parse(q.starter_code) : q.starter_code) : null,
      spreadsheet_template: q.spreadsheet_template ? (typeof q.spreadsheet_template === 'string' ? JSON.parse(q.spreadsheet_template) : q.spreadsheet_template) : null,
      spreadsheet_solution: q.spreadsheet_solution ? (typeof q.spreadsheet_solution === 'string' ? JSON.parse(q.spreadsheet_solution) : q.spreadsheet_solution) : null,
      skill_tags: q.skill_tags ? (typeof q.skill_tags === 'string' ? JSON.parse(q.skill_tags) : q.skill_tags) : null,
    }));

    // Fetch anti-cheating settings and map to frontend-expected field names
    const [antiCheatingResults] = await db.query(
      `SELECT * FROM anti_cheating_settings WHERE case_study_id = ? LIMIT 1`,
      [cs.id]
    );
    
    if (antiCheatingResults.length > 0) {
      const raw = antiCheatingResults[0];
      // Map database column names to frontend-expected names
      cs.antiCheatingSettings = {
        ...raw,
        // Frontend expects these specific field names:
        fullscreen_required: raw.require_fullscreen === 1 || raw.require_fullscreen === true,
        tab_switch_detection: raw.prevent_tab_switch === 1 || raw.prevent_tab_switch === true,
        copy_paste_disabled: raw.disable_copy_paste === 1 || raw.disable_copy_paste === true,
        webcam_required: raw.require_webcam === 1 || raw.require_webcam === true,
        tab_switch_limit: raw.tab_switch_limit || 3,
        tab_switch_action: raw.tab_switch_action || 'flag',
      };
      console.log('📋 Anti-cheating settings loaded:', cs.antiCheatingSettings);
    } else {
      cs.antiCheatingSettings = null;
    }

    res.status(200).json({
      success: true,
      caseStudy: cs
    });

  } catch (err) {
    console.error("❌ Error fetching case study:", err);
    res.status(500).json({ error: "Failed to fetch case study" });
  }
});


// Select a Case Study
router.post("/select/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can select case studies" });
    }

    const [caseStudy] = await db.query(
      "SELECT * FROM case_studies WHERE id = ? AND user_id = ?",
      [id, user.id]
    );

    if (!caseStudy || caseStudy.length === 0) {
      return res.status(404).json({ error: "Case study not found" });
    }

    const generationBatch = caseStudy[0].generation_batch;

    await db.query(
      "UPDATE case_studies SET is_selected = 1, status = 'in_review', updated_at = NOW() WHERE id = ?",
      [id]
    );

    // If this case study is linked to an assessment, update the assessment's case_study_id
    // Find assessments for this user that either have this case study or don't have one yet
    // Match by checking if any case study in the same batch belongs to an assessment
    const [assessments] = await db.query(
      `SELECT csa.id 
       FROM case_study_assessments csa
       WHERE csa.user_id = ?
       AND (csa.case_study_id IS NULL OR csa.case_study_id IN (
         SELECT id FROM case_studies WHERE generation_batch = ?
       ))
       ORDER BY csa.created_at DESC
       LIMIT 1`,
      [user.id, generationBatch]
    );
    
    if (assessments.length > 0) {
      // Update the assessment with the selected case study
      await db.query(
        `UPDATE case_study_assessments 
         SET case_study_id = ?, updated_at = NOW()
         WHERE id = ?`,
        [id, assessments[0].id]
      );
      console.log(`✅ Linked case study ${id} to assessment ${assessments[0].id}`);
    } else {
      // Also check if this case study's job_id is NULL (assessment case study)
      // and find assessments without a case_study_id
      const [caseStudyCheck] = await db.query(
        `SELECT job_id FROM case_studies WHERE id = ?`,
        [id]
      );
      
      if (caseStudyCheck.length > 0 && caseStudyCheck[0].job_id === null) {
        // This is an assessment case study - find assessments without a case_study_id
        const [orphanAssessments] = await db.query(
          `SELECT id FROM case_study_assessments 
           WHERE user_id = ? AND case_study_id IS NULL
           ORDER BY created_at DESC
           LIMIT 1`,
          [user.id]
        );
        
        if (orphanAssessments.length > 0) {
          await db.query(
            `UPDATE case_study_assessments 
             SET case_study_id = ?, updated_at = NOW()
             WHERE id = ?`,
            [id, orphanAssessments[0].id]
          );
          console.log(`✅ Linked assessment case study ${id} to assessment ${orphanAssessments[0].id}`);
        }
      }
    }

    await db.query(
      "DELETE FROM case_studies WHERE generation_batch = ? AND id != ? AND is_selected = 0",
      [generationBatch, id]
    );

    res.json({ 
      success: true,
      message: "✅ Case study selected successfully",
      caseStudyId: id 
    });

  } catch (err) {
    console.error("Error selecting case study:", err);
    res.status(500).json({ error: "Failed to select case study" });
  }
});

// ============================================
// IMPORTANT: Place specific routes BEFORE generic /:id route
// ============================================





// Get Case Study Tables
router.get("/:caseStudyId/tables", authMiddleware, languageMiddleware, async (req, res) => {
  try {
    const { caseStudyId } = req.params;
    const lang = req.language || 'en';

    const [tables] = await db.query(
      `SELECT * FROM case_study_tables 
       WHERE case_study_id = ? AND language = ? 
       ORDER BY id`,
      [caseStudyId, lang]
    );

    res.json({
      success: true,
      tables: tables.map(t => {
        const cols = typeof t.column_definitions === 'string' 
          ? JSON.parse(t.column_definitions) 
          : t.column_definitions;
        const rows = typeof t.rows_data === 'string' 
          ? JSON.parse(t.rows_data) 
          : t.rows_data;
        
        return {
          id: t.id,
          table_id: t.table_id,
          title: t.table_title,
          columns: cols,
          rows: rows
        };
      }),
      language: lang,
      total: tables.length
    });
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// ============================================
// ASSESSMENT ROUTES (MUST BE BEFORE /:id)
// ============================================

// NOTE: The main GET /:id route is defined above (after /batch/:batchId)
// with full customQuestions, psychometrics, and antiCheatingSettings support

// Update Case Study
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { 
      title, title_ar, description, description_ar,
      instructions, instructions_ar, duration_minutes, status, questions,
      customQuestionWeights, // Array of {id, weight} for custom questions
      antiCheatingSettings // NEW: Anti-cheating settings object
    } = req.body;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can update case studies" });
    }

    const [caseStudy] = await db.query(
      "SELECT * FROM case_studies WHERE id = ? AND user_id = ?",
      [id, user.id]
    );

    if (!caseStudy || caseStudy.length === 0) {
      return res.status(404).json({ error: "Case study not found or unauthorized" });
    }

    await db.query(
      `UPDATE case_studies 
       SET title = ?, title_ar = ?, description = ?, description_ar = ?, 
           instructions = ?, instructions_ar = ?, duration_minutes = ?, 
           status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title, title_ar || title, description, description_ar || description, 
        instructions, instructions_ar || instructions, duration_minutes, 
        status || 'in_review', id
      ]
    );

    // Handle case study questions with weights
    if (Array.isArray(questions)) {
      await db.query("DELETE FROM case_study_questions WHERE case_study_id = ?", [id]);
      
      for (const q of questions) {
        const questionText = q.question || q;
        const questionWeight = q.weight || 1.0;
        await db.query(
          "INSERT INTO case_study_questions (case_study_id, question, question_ar, weight) VALUES (?, ?, ?, ?)",
          [id, questionText, q.question_ar || '', questionWeight]
        );
      }
      console.log(`✅ Updated ${questions.length} case study questions with weights`);
    }

    // Handle custom question weights
    if (Array.isArray(customQuestionWeights) && customQuestionWeights.length > 0) {
      for (const cqw of customQuestionWeights) {
        if (cqw.id && cqw.weight !== undefined) {
          await db.query(
            "UPDATE custom_questions SET weight = ? WHERE id = ? AND case_study_id = ?",
            [cqw.weight, cqw.id, id]
          );
        }
      }
      console.log(`✅ Updated weights for ${customQuestionWeights.length} custom questions`);
    }

    // Handle anti-cheating settings update
    if (antiCheatingSettings && typeof antiCheatingSettings === 'object') {
      // Check if settings exist
      const [existingSettings] = await db.query(
        'SELECT id FROM anti_cheating_settings WHERE case_study_id = ?',
        [id]
      );

      if (existingSettings.length > 0) {
        // Update existing settings
        await db.query(
          `UPDATE anti_cheating_settings SET
            require_fullscreen = ?,
            prevent_tab_switch = ?,
            disable_copy_paste = ?,
            require_webcam = ?,
            tab_switch_limit = ?,
            updated_at = NOW()
          WHERE case_study_id = ?`,
          [
            antiCheatingSettings.enableFullscreen || antiCheatingSettings.fullscreen_required ? 1 : 0,
            antiCheatingSettings.enableTabSwitch || antiCheatingSettings.tab_switch_detection ? 1 : 0,
            antiCheatingSettings.enableCopyPaste || antiCheatingSettings.copy_paste_disabled ? 1 : 0,
            antiCheatingSettings.enableWebcamProctoring || antiCheatingSettings.webcam_required ? 1 : 0,
            antiCheatingSettings.maxTabSwitches || antiCheatingSettings.tab_switch_limit || 3,
            id
          ]
        );
        console.log(`✅ Updated anti-cheating settings for case study ${id}`);
      } else {
        // Insert new settings
        await db.query(
          `INSERT INTO anti_cheating_settings 
           (case_study_id, require_fullscreen, prevent_tab_switch, disable_copy_paste, require_webcam, tab_switch_limit, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            id,
            antiCheatingSettings.enableFullscreen || antiCheatingSettings.fullscreen_required ? 1 : 0,
            antiCheatingSettings.enableTabSwitch || antiCheatingSettings.tab_switch_detection ? 1 : 0,
            antiCheatingSettings.enableCopyPaste || antiCheatingSettings.copy_paste_disabled ? 1 : 0,
            antiCheatingSettings.enableWebcamProctoring || antiCheatingSettings.webcam_required ? 1 : 0,
            antiCheatingSettings.maxTabSwitches || antiCheatingSettings.tab_switch_limit || 3
          ]
        );
        console.log(`✅ Created anti-cheating settings for case study ${id}`);
      }
    }

    res.json({ 
      success: true,
      message: "✅ Case study updated successfully" 
    });
  } catch (err) {
    console.error("Error updating case study:", err);
    res.status(500).json({ error: "Failed to update case study" });
  }
});


// Update Specific Table Data
router.put("/:caseStudyId/tables/:tableId", authMiddleware, async (req, res) => {
  try {
    const { caseStudyId, tableId } = req.params;
    const { rows_data } = req.body;
    const user = req.user;

    // Verify ownership
    const [caseStudy] = await db.query(
      "SELECT user_id FROM case_studies WHERE id = ?",
      [caseStudyId]
    );

    if (!caseStudy || caseStudy[0].user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.query(
      `UPDATE case_study_tables 
       SET rows_data = ? 
       WHERE case_study_id = ? AND id = ?`,
      [JSON.stringify(rows_data), caseStudyId, tableId]
    );

    res.json({ success: true, message: 'Table updated successfully' });
  } catch (err) {
    console.error('Error updating table:', err);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// Export Tables as CSV
router.get("/:caseStudyId/tables/export/csv", authMiddleware, async (req, res) => {
  try {
    const { caseStudyId } = req.params;
    const lang = req.query.lang || 'en';

    const [tables] = await db.query(
      `SELECT * FROM case_study_tables WHERE case_study_id = ? AND language = ?`,
      [caseStudyId, lang]
    );

    let csv = '';
    for (const table of tables) {
      csv += `\n${table.table_title}\n`;
      const columns = JSON.parse(table.column_definitions);
      csv += columns.map(c => c.label).join(',') + '\n';
      
      const rows = JSON.parse(table.rows_data);
      rows.forEach(row => {
        csv += Object.values(row).join(',') + '\n';
      });
      csv += '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="case-study-${caseStudyId}-${lang}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Error exporting tables:', err);
    res.status(500).json({ error: 'Failed to export tables' });
  }
});

// Export Tables as JSON
router.get("/:caseStudyId/tables/export/json", authMiddleware, async (req, res) => {
  try {
    const { caseStudyId } = req.params;
    const lang = req.query.lang || 'en';

    const [tables] = await db.query(
      `SELECT * FROM case_study_tables WHERE case_study_id = ? AND language = ?`,
      [caseStudyId, lang]
    );

    const tableData = tables.map(t => ({
      table_id: t.table_id,
      title: t.table_title,
      columns: JSON.parse(t.column_definitions),
      rows: JSON.parse(t.rows_data)
    }));

    res.json({
      success: true,
      caseStudyId,
      language: lang,
      tables: tableData
    });
  } catch (err) {
    console.error('Error exporting tables:', err);
    res.status(500).json({ error: 'Failed to export tables' });
  }
});

// Publish Case Studies
router.put("/publish/bulk", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { caseStudyIds } = req.body;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can publish case studies" });
    }

    if (!Array.isArray(caseStudyIds) || caseStudyIds.length === 0) {
      return res.status(400).json({ error: "No case studies provided" });
    }

    await db.query(
      `UPDATE case_studies 
       SET status = 'published', is_active = 1, updated_at = NOW()
       WHERE id IN (?) AND user_id = ? AND is_selected = 1`,
      [caseStudyIds, user.id]
    );

    // Update assessments linked to these case studies
    for (const caseStudyId of caseStudyIds) {
      // Check if this is an assessment case study (job_id is NULL)
      const [caseStudyCheck] = await db.query(
        `SELECT job_id FROM case_studies WHERE id = ? AND user_id = ?`,
        [caseStudyId, user.id]
      );
      
      if (caseStudyCheck.length > 0 && caseStudyCheck[0].job_id === null) {
        // This is an assessment case study - update assessments without a case_study_id
        await db.query(
          `UPDATE case_study_assessments 
           SET case_study_id = ?, updated_at = NOW()
           WHERE user_id = ? AND case_study_id IS NULL
           ORDER BY created_at DESC
           LIMIT 1`,
          [caseStudyId, user.id]
        );
      } else {
        // Regular job-based case study - update if already linked or not linked
        await db.query(
          `UPDATE case_study_assessments 
           SET case_study_id = ?, updated_at = NOW()
           WHERE user_id = ? AND (case_study_id IS NULL OR case_study_id = ?)`,
          [caseStudyId, user.id, caseStudyId]
        );
      }

      // --- NEW: Also create a pre-built assessment entry so published case studies appear in Pre-Built Tests ---
      try {
        // Fetch case study details
        const [caseRows] = await db.query(
          `SELECT id, title, title_ar, description, description_ar, instructions, instructions_ar, duration_minutes, difficulty_level FROM case_studies WHERE id = ? AND user_id = ?`,
          [caseStudyId, user.id]
        );

        if (caseRows.length === 0) continue; // skip if not found or not authorized

        const cs = caseRows[0];

        // Gather questions (simple case study questions)
        const [questionsRows] = await db.query(
          `SELECT question as question, question_ar as question_ar, weight as weight FROM case_study_questions WHERE case_study_id = ? ORDER BY id`,
          [caseStudyId]
        );

        const simpleQuestions = questionsRows.map(q => ({ question: q.question, question_ar: q.question_ar, weight: q.weight || 1 }));

        // Gather advanced/custom questions (assessment modules) and include them too
        const [customQRows] = await db.query(
          `SELECT id, question_type, question_text as question, question_text_ar as question_ar, options, correct_answers, keywords, rubric, time_limit, weight, question_order, test_cases, starter_code, spreadsheet_template, spreadsheet_solution, expected_response, skill_tags
           FROM custom_questions WHERE case_study_id = ? AND is_active = 1 ORDER BY question_order ASC`,
          [caseStudyId]
        );

        const customQuestions = customQRows.map(q => ({
          question_type: q.question_type,
          question: q.question,
          question_ar: q.question_ar,
          options: (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) || null,
          correct_answers: (typeof q.correct_answers === 'string' ? JSON.parse(q.correct_answers) : q.correct_answers) || null,
          keywords: (typeof q.keywords === 'string' ? JSON.parse(q.keywords) : q.keywords) || null,
          rubric: (typeof q.rubric === 'string' ? JSON.parse(q.rubric) : q.rubric) || null,
          time_limit: q.time_limit || null,
          weight: q.weight || 1,
          question_order: q.question_order || null,
          test_cases: (typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases) || null,
          starter_code: (typeof q.starter_code === 'string' ? JSON.parse(q.starter_code) : q.starter_code) || null,
          spreadsheet_template: (typeof q.spreadsheet_template === 'string' ? JSON.parse(q.spreadsheet_template) : q.spreadsheet_template) || null,
          spreadsheet_solution: (typeof q.spreadsheet_solution === 'string' ? JSON.parse(q.spreadsheet_solution) : q.spreadsheet_solution) || null,
          expected_response: (typeof q.expected_response === 'string' ? JSON.parse(q.expected_response) : q.expected_response) || null,
          skill_tags: (typeof q.skill_tags === 'string' ? JSON.parse(q.skill_tags) : q.skill_tags) || null
        }));

        // Combined questions: include simple questions and custom modules (module-first supported)
        // We store both simple and custom/module questions in the pre-built 'questions' field so the pre-built copy
        // correctly reflects the total question count and can be published/copied later.
        let questions = [...simpleQuestions];
        let preBuiltNumQuestions = simpleQuestions.length;

        if (customQuestions && customQuestions.length > 0) {
          // Include serialized custom/module questions in the pre-built record
          questions = questions.concat(customQuestions);
          preBuiltNumQuestions += customQuestions.length;
        }

        // Gather tables
        const [tablesRows] = await db.query(
          `SELECT table_id, table_title, table_title_ar, column_definitions, rows_data FROM case_study_tables WHERE case_study_id = ?`,
          [caseStudyId]
        );

        const tables = tablesRows.map(t => ({ table_id: t.table_id, title: t.table_title, title_ar: t.table_title_ar, columns: (typeof t.column_definitions === 'string' ? JSON.parse(t.column_definitions) : (t.column_definitions || [])), rows: (typeof t.rows_data === 'string' ? JSON.parse(t.rows_data) : (t.rows_data || [])) }));

        // Build case study content JSON and include source id to avoid duplicates
        const caseStudyContent = {
          source_case_study_id: caseStudyId,
          background: cs.description || '',
          background_ar: cs.description_ar || '',
          instructions: cs.instructions || '',
          instructions_ar: cs.instructions_ar || '',
          tables,
        };

        // Map difficulty back to pre-built difficulty levels if possible
        const difficultyMapRev = {
          'beginner': 'easy',
          'intermediate': 'medium',
          'advanced': 'hard'
        };
        const preBuiltDifficulty = difficultyMapRev[cs.difficulty_level] || 'medium';

        // Check for existing pre-built entry referencing this case study
        const [existing] = await db.query(
          `SELECT id FROM pre_built_assessments WHERE JSON_EXTRACT(case_study_content, '$.source_case_study_id') = ? LIMIT 1`,
          [caseStudyId]
        );

        if (!existing || existing.length === 0) {
          // Insert new pre-built assessment
          const [insertResult] = await db.query(
            `INSERT INTO pre_built_assessments (title, title_ar, description, description_ar, category, difficulty_level, duration_minutes, num_questions, questions, case_study_content, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
              cs.title || `Case Study #${caseStudyId}`,
              cs.title_ar || cs.title || `Case Study #${caseStudyId}`,
              cs.description || '',
              cs.description_ar || cs.description || '',
              'job_simulation',
              preBuiltDifficulty,
              cs.duration_minutes || 30,
              preBuiltNumQuestions,
              JSON.stringify(questions),
              JSON.stringify(caseStudyContent)
            ]
          );

          const newPreBuiltId = insertResult.insertId;
          console.log(`✅ Created pre-built assessment from case study ${caseStudyId} (pre_built_assessments.id=${newPreBuiltId})`);

          // Link case study back to newly created pre-built assessment
          await db.query(
            `UPDATE case_studies SET pre_built_assessment_id = ? WHERE id = ?`,
            [newPreBuiltId, caseStudyId]
          );
        } else {
          console.log(`ℹ️ Pre-built assessment already exists for case study ${caseStudyId}`);
        }
      } catch (err) {
        console.error(`Error creating pre-built assessment for case study ${caseStudyId}:`, err.message);
        // Do not abort the whole publish operation for a single pre-built creation error
      }
    }

    res.json({ 
      success: true,
      message: "✅ Case studies published successfully",
      publishedCount: caseStudyIds.length 
    });
  } catch (err) {
    console.error("Error publishing case studies:", err);
    res.status(500).json({ error: "Failed to publish case studies" });
  }
});

// Delete Case Study
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can delete case studies" });
    }

    const [caseStudy] = await db.query(
      "SELECT * FROM case_studies WHERE id = ? AND user_id = ?",
      [id, user.id]
    );

    if (!caseStudy || caseStudy.length === 0) {
      return res.status(404).json({ error: "Case study not found or unauthorized" });
    }

    await db.query("DELETE FROM case_study_questions WHERE case_study_id = ?", [id]);
    await db.query("DELETE FROM case_study_tables WHERE case_study_id = ?", [id]);
    await db.query("DELETE FROM case_studies WHERE id = ?", [id]);

    res.json({ 
      success: true,
      message: "✅ Case study deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting case study:", err);
    res.status(500).json({ error: "Failed to delete case study" });
  }
});

// Archive old case studies (not selected ones)
router.post("/archive-batch/:batchId", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { batchId } = req.params;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can archive case studies" });
    }

    const result = await db.query(
      "UPDATE case_studies SET status = 'archived', updated_at = NOW() WHERE generation_batch = ? AND user_id = ? AND is_selected = 0",
      [batchId, user.id]
    );

    res.json({ 
      success: true,
      message: "✅ Unselected case studies archived",
      archivedCount: result[0].affectedRows
    });
  } catch (err) {
    console.error("Error archiving case studies:", err);
    res.status(500).json({ error: "Failed to archive case studies" });
  }
});

// Bulk delete unselected variants from a batch
router.delete("/batch/:batchId/unselected", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { batchId } = req.params;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can delete case studies" });
    }

    // Get all unselected case studies from batch
    const [caseStudies] = await db.query(
      "SELECT id FROM case_studies WHERE generation_batch = ? AND user_id = ? AND is_selected = 0",
      [batchId, user.id]
    );

    if (caseStudies.length === 0) {
      return res.status(404).json({ error: "No unselected case studies found" });
    }

    const caseStudyIds = caseStudies.map(cs => cs.id);

    // Delete questions
    await db.query(
      "DELETE FROM case_study_questions WHERE case_study_id IN (?)",
      [caseStudyIds]
    );

    // Delete tables
    await db.query(
      "DELETE FROM case_study_tables WHERE case_study_id IN (?)",
      [caseStudyIds]
    );

    // Delete case studies
    const result = await db.query(
      "DELETE FROM case_studies WHERE generation_batch = ? AND user_id = ? AND is_selected = 0",
      [batchId, user.id]
    );

    res.json({
      success: true,
      message: "✅ Unselected variants deleted successfully",
      deletedCount: result[0].affectedRows
    });
  } catch (err) {
    console.error("Error deleting batch variants:", err);
    res.status(500).json({ error: "Failed to delete case studies" });
  }
});

// Get case study statistics for dashboard
router.get("/stats/overview", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can view stats" });
    }

    const [stats] = await db.query(
      `SELECT 
        COUNT(DISTINCT generation_batch) as total_generations,
        COUNT(CASE WHEN is_selected = 1 THEN 1 END) as selected_cases,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_cases,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_cases,
        COUNT(CASE WHEN status = 'in_review' THEN 1 END) as review_cases,
        SUM(CASE WHEN is_selected = 1 THEN 1 ELSE 0 END) as total_active
      FROM case_studies 
      WHERE user_id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

module.exports = router;