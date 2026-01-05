// FILE: services/universalCaseStudyGenerator.js
// This is the NEW service file - create this file in your services folder

/**
 * STEP 1: Intelligently analyze the job to determine context
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
 * STEP 2: Get industry-specific requirements
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

/**
 * STEP 3: Generate adaptive prompt for AI
 */
function generateAdaptiveStructuredPrompt(job, duration, instructions, variantNumber, caseStudyType, documentContext, wordCountTarget, numQuestions, difficultyLevel, selectedModules = [], moduleSettings = {}) {
  
  const jobContext = analyzeJobContext(job);
  
  // Build module summary instructions if modules are provided
  let moduleSummaryText = '';
  if (selectedModules && selectedModules.length > 0) {
    const parts = selectedModules.map(m => {
      const key = `${m}Count`;
      const cnt = (moduleSettings && (moduleSettings[key] || moduleSettings[key] === 0)) ? moduleSettings[key] : 0;
      return `${m}: ${cnt}`;
    });
    moduleSummaryText = `\n- Module Breakdown: ${parts.join(', ')}`;
    moduleSummaryText += `\n\nMODULE INSTRUCTIONS: For each selected module, generate the specified number of questions tied to the case study scenario. Annotate each question with its module type and provide module-specific metadata (e.g., MCQs must have 4 options and one correct answer; coding challenges must include test cases and sample input/output; video responses must include time limits and evaluation criteria). Ensure the overall number of questions matches the module breakdown.`;
  }
  
  // Use "Company XYZ" as default if no actual company name is provided
  const companyName = job.company_name && job.company_name.trim() ? job.company_name.trim() : 'Company XYZ';
  
  const variantFoci = {
    1: {
      angle: 'operational_challenge',
      description: 'Focus on immediate operational/execution challenges and day-to-day problem resolution'
    },
    2: {
      angle: 'strategic_initiative',
      description: 'Focus on strategic decision-making, planning, and long-term business impact'
    },
    3: {
      angle: 'problem_solving',
      description: 'Focus on creative problem-solving, innovation, and process improvements'
    }
  };

  const variantFocus = variantFoci[variantNumber] || variantFoci[1];

  const contextualInstructions = `
You are an expert case study creator. You have deep knowledge of the ${jobContext.industry} industry and ${jobContext.seniority}-level roles.

JOB ANALYSIS:
- Industry: ${jobContext.industry.toUpperCase()}
- Seniority Level: ${jobContext.seniority.toUpperCase()}
- Job Title: ${job.title}
- Key Responsibilities (${jobContext.keyResponsibilityCount} identified):
  ${job.key_responsibilities}

CRITICAL: Create a case study that is HIGHLY SPECIFIC to this actual job, not a generic template.
The candidate should immediately recognize this as relevant to their daily work.

INDUSTRY-SPECIFIC REQUIREMENTS:
${getIndustrySpecificRequirements(jobContext.industry, job)}

CASE STUDY TYPE: ${caseStudyType.toUpperCase()}
`;

  const difficultyGuide = {
    easy: 'Create straightforward scenarios with clear problems and 1-2 obvious solutions. Include helpful context and constraints.',
    medium: 'Create realistic scenarios with 3-4 interconnected challenges. Include ambiguous elements requiring judgment.',
    hard: 'Create complex scenarios with competing priorities, incomplete information, and significant trade-offs. Require strategic thinking and nuanced decision-making.'
  };

  // Compute module breakdown and question totals if modules are provided
  let moduleParts = [];
  let totalQuestionsFromModules = 0;
  if (selectedModules && selectedModules.length > 0) {
    moduleParts = selectedModules.map(m => {
      const key = `${m}Count`;
      const cnt = (moduleSettings && (typeof moduleSettings[key] !== 'undefined')) ? moduleSettings[key] : 0;
      totalQuestionsFromModules += Number(cnt || 0);
      return `${m}: ${cnt}`;
    });
  }

  // Only include module breakdown in prompts; legacy 'Questions' field removed
  const questionParamText = (moduleParts.length > 0)
    ? `- Modules: ${moduleParts.join(', ')}`
    : ``;

  const questionsChecklistText = (moduleParts.length > 0)
    ? `✓ Modules selected: ${moduleParts.join(', ')} (total ${totalQuestionsFromModules} questions). Ensure generated questions match these counts.`
    : ``;

  const promptTemplate = `
${contextualInstructions}

${instructions ? `\nRECRUITER'S CUSTOM REQUIREMENTS:\n${instructions}` : ''}

VARIANT FOCUS (${variantNumber}/3): ${variantFocus.angle.toUpperCase()}
${variantFocus.description}

CASE STUDY PARAMETERS:
- Type: ${caseStudyType}
- Difficulty: ${difficultyLevel} - ${difficultyGuide[difficultyLevel]}
- Duration: ${duration} minutes
- Target Length: ${wordCountTarget} words
${questionParamText}
${moduleSummaryText}

${documentContext ? `\nORGANIZATION CONTEXT:\n${documentContext}` : ''}

===== CRITICAL NARRATIVE SEQUENCE =====

The case study MUST follow this exact structure:

IMPORTANT: If a COMPANY BACKGROUND block is provided in the ORGANIZATION CONTEXT above, you MUST use the EXACT company name found there. The description MUST begin with the company name (for example: "Acme Corp is a ..."). Do NOT use the placeholder 'Company XYZ' when the actual company name is available in the context. If the company name cannot be determined from the provided content, do not invent one — instead start descriptions with 'The company' (avoid using 'Company XYZ' placeholder in that case).

PART 1 - BACKGROUND (description field):
1. COMPANY OVERVIEW (1-2 sentences):
   - Start with: "${companyName} is a [industry] company that..."
   - What they do, when founded, scale
   
2. COMPANY SCALE & PRESENCE (1-2 sentences):
   - Offices, employees, geographic reach
   - Growth trajectory
   
3. COMPANY EXPERTISE & CULTURE (1-2 sentences):
   - What they specialize in
   - How they work, values, mission
   
4. OPERATIONAL CONTEXT → CHALLENGE (remaining sentences):
   - Transition: "However, ${companyName} recently faced..." or "Currently, ${companyName} is dealing with..."
   - Describe the specific operational challenge/scenario
   - Include metrics and impact
   - Set up the problem for the role

PART 2 - INSTRUCTIONS (instructions field):
- Start with: "As the ${job.title} at ${companyName}, you are tasked with..."
- Your role and responsibilities in THIS scenario
- Specific objectives and success criteria
- Constraints and resources
- Stakeholder expectations
- Timeline and deliverables

===== EXACT JSON RESPONSE STRUCTURE =====

{
  "en": {
    "description": "COMPLETE BACKGROUND SECTION (${wordCountTarget} words) following EXACT sequence: Company Overview → Scale → Expertise/Culture → Operational Challenge. This is ONE cohesive narrative, NOT separate sections. DO NOT include role assignment here. Focus entirely on company context and the situation that needs addressing. Make it specific to ${job.title} in ${jobContext.industry} industry.",
    
    "instructions": "ROLE & SCENARIO SECTION (300-400 words). Start with: 'As the ${job.title} at [Company Name], you are tasked with...' Then describe: your specific objectives, what success looks like, constraints/limitations, available resources, stakeholder expectations, and timeline. Reference the specific challenges mentioned in the background section above.",
    
    "questions": [
      "Question 1 - specific to this scenario",
      "Question 2 - specific to this scenario",
      "Question 3 - specific to this scenario",
      "Question 4 - specific to this scenario",
      "Question 5 - specific to this scenario",
      "Question 6 - specific to this scenario",
      "Question 7 - specific to this scenario"
    ],
    
    "tables": [
      {
        "table_id": "primary_metrics",
        "title": "Current Metrics & Performance",
        "description": "Key performance indicators for ${job.title} role",
        "columns": [
          {"key": "metric_name", "label": "Metric", "type": "text"},
          {"key": "current_value", "label": "Current Value", "type": "text"},
          {"key": "target_value", "label": "Target", "type": "text"},
          {"key": "variance", "label": "Variance", "type": "text"},
          {"key": "trend", "label": "Trend", "type": "select", "options": ["↑ Improving", "→ Stable", "↓ Declining"]}
        ],
        "rows": [
          {"metric_name": "Example metric 1", "current_value": "45", "target_value": "60", "variance": "-25%", "trend": "↓ Declining"},
          {"metric_name": "Example metric 2", "current_value": "8.2/10", "target_value": "9.0", "variance": "-8.9%", "trend": "↑ Improving"},
          {"metric_name": "Example metric 3", "current_value": "\$125K", "target_value": "\$150K", "variance": "-16.7%", "trend": "→ Stable"}
        ]
      },
      {
        "table_id": "scenario_data",
        "title": "Situation/Context Data",
        "description": "Contextual information relevant to the scenario",
        "columns": [
          {"key": "item", "label": "Item", "type": "text"},
          {"key": "status", "label": "Status", "type": "text"},
          {"key": "impact", "label": "Impact Level", "type": "select", "options": ["Critical", "High", "Medium", "Low"]},
          {"key": "notes", "label": "Details", "type": "text"}
        ],
        "rows": [
          {"item": "Challenge/Resource 1", "status": "Active", "impact": "High", "notes": "Description of impact"},
          {"item": "Challenge/Resource 2", "status": "Pending", "impact": "Critical", "notes": "Description of impact"}
        ]
      },
      {
        "table_id": "resources_constraints",
        "title": "Available Resources & Constraints",
        "description": "What you have to work with and limitations",
        "columns": [
          {"key": "resource_type", "label": "Resource Type", "type": "text"},
          {"key": "availability", "label": "Availability", "type": "text"},
          {"key": "cost_or_effort", "label": "Cost/Effort", "type": "text"},
          {"key": "constraint", "label": "Constraint", "type": "text"}
        ],
        "rows": [
          {"resource_type": "Resource 1", "availability": "Fully available", "cost_or_effort": "Included", "constraint": "Time-bound"},
          {"resource_type": "Resource 2", "availability": "Limited", "cost_or_effort": "Additional budget needed", "constraint": "Capacity limited"}
        ]
      }
    ]
  },
  
  "ar": {
    "description": "Arabic translation of BACKGROUND SECTION only",
    "instructions": "Arabic translation of ROLE & SCENARIO SECTION only",
    "questions": ["السؤال 1 محدد لهذا السيناريو", "السؤال 2 محدد لهذا السيناريو", "السؤال 3 محدد لهذا السيناريو", "السؤال 4 محدد لهذا السيناريو", "السؤال 5 محدد لهذا السيناريو", "السؤال 6 محدد لهذا السيناريو", "السؤال 7 محدد لهذا السيناريو"],
    "tables": [{"table_id": "primary_metrics", "title": "المقاييس الحالية والأداء", "columns": [], "rows": []}]
  },
  
  "duration_minutes": ${duration || 120}
  "case_study_type": "${caseStudyType}",
  "difficulty_level": "${difficultyLevel}",
  "num_questions": ${moduleParts.length > 0 ? totalQuestionsFromModules : 0},
  "module_breakdown": ${moduleParts.length > 0 ? JSON.stringify(moduleSettings) : null},
  "module_breakdown": ${moduleParts.length > 0 ? JSON.stringify(moduleSettings) : null},
  "content_length": "${wordCountTarget}",
  "variant_number": ${variantNumber},
  "variant_focus": "${variantFocus.angle}",
  "job_title": "${job.title}",
  "industry": "${jobContext.industry}",
  "seniority_level": "${jobContext.seniority}",
  "document_context_used": ${!!documentContext}
}
===== CRITICAL REQUIREMENTS FOR QUESTIONS =====
✓ EACH QUESTION MUST BE UNIQUE TO THIS SPECIFIC SCENARIO
✓ NO TEMPLATE LANGUAGE OR PLACEHOLDER TEXT
✓ REFERENCE SPECIFIC METRICS/NUMBERS FROM THE DESCRIPTION
✓ BUILD ON SCENARIO CONTEXT - NOT GENERIC
✓ EACH QUESTION MUST BE 2-4 DETAILED SENTENCES
✓ NO DIFFICULTY LEVEL INDICATORS IN QUESTION TEXT
✓ QUESTIONS SHOULD BUILD IN DEPTH/COMPLEXITY
✓ VARIANT FOCUS IS EMBEDDED IN QUESTION DESIGN

===== VALIDATION CHECKLIST =====
✓ Description starts with company name and what they do
✓ Description builds: Company → Scale → Expertise → Challenge
✓ NO role assignment in description section
✓ Instructions starts with "As the ${job.title}..."
✓ All content is specific to ${job.title} role
✓ Industry terminology used: ${jobContext.industry}
✓ Appropriate seniority level: ${jobContext.seniority}
${questionsChecklistText}
✓ All questions reference specific scenario details
✓ Tables have realistic, industry-appropriate data
✓ Variant ${variantNumber} focus embedded in scenario
✓ Industry terminology used correctly
✓ Appropriate for ${jobContext.seniority} level
✓ Valid JSON only
✓ Both sections are cohesive and interconnected
✓ Both English and Arabic sections complete
✓ Metrics are realistic for ${jobContext.industry} industry

===== MANDATORY BILINGUAL REQUIREMENTS =====
- BOTH 'en' AND 'ar' SECTIONS MUST BE PRESENT AND FULLY POPULATED.
- The 'ar' section MUST be a proper Arabic translation of the corresponding 'en' fields (questions arrays and tables MUST match lengths and structure).
- DO NOT RETURN PARTIAL ARABIC TRANSLATIONS. If Arabic cannot be provided, include a top-level 'error' field with value 'MISSING_AR'.
- RETURN ONLY VALID JSON. NO MARKDOWN, NO EXPLANATIONS.

`;

  return promptTemplate;
}
// Export the functions
module.exports = {
  generateAdaptiveStructuredPrompt,
  analyzeJobContext,
  getIndustrySpecificRequirements
};