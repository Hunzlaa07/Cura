const { generateAdaptiveStructuredPrompt } = require('../services/universalCaseStudyGenerator');
const aiService = require('../services/aiService');
const fs = require('fs');

async function run() {
  const job = {
    title: 'Senior Backend Engineer',
    description: 'Design and implement scalable APIs, microservices, and data processing pipelines. Work closely with product and platform teams to ship reliable systems.',
    key_responsibilities: 'Lead backend service design\nEnsure high availability\nMentor junior engineers',
    company_name: 'Acme Tech'
  };

  const prompt = generateAdaptiveStructuredPrompt(job, 120, 'Include behavior and system design questions', 1, 'case_study', null, 800, 7, 'medium', [], {});
  console.log('Prompt length:', prompt.length);

  try {
    const resp = await aiService.generateContent(prompt, 'openai');
    console.log('AI response length:', resp.length);
    fs.writeFileSync('logs/repro_ai_response.json', JSON.stringify({ prompt: prompt.substring(0,2000), response: resp.substring(0,10000) }, null, 2));
    console.log('Wrote logs/repro_ai_response.json');
  } catch (e) {
    console.error('Error generating:', e.message);
  }
}

run();
