// services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const axios = require("axios");
require("dotenv").config();

const fs = require('fs');
const path = require('path');

function ensureLogsDir() {
  const dir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeForLogging(text) {
  if (!text || typeof text !== 'string') return '';
  // Remove emails
  let s = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  // Remove sequences of digits longer than 6 (possible phone numbers or ids)
  s = s.replace(/\d{7,}/g, '[REDACTED_NUM]');
  // Collapse whitespace and truncate to 10000 chars for logs
  s = s.replace(/\s+/g, ' ').trim();
  return s.substring(0, 10000);
}

function appendLog(filename, obj) {
  try {
    const dir = ensureLogsDir();
    const p = path.join(dir, filename);
    fs.appendFileSync(p, JSON.stringify(obj) + '\n');
  } catch (e) {
    console.warn('Could not write AI log:', e.message);
  }
}

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    
    // Initialize all providers
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    
    // Model configurations with fallbacks
    this.models = {
      gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
      openai: process.env.OPENAI_MODEL || "gpt-4o",
      deepseek: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      groq: process.env.GROQ_MODEL ||  "llama-3.3-70b-versatile"
    };

    // Groq model fallback chain
    this.groqModelFallbacks = [
      "openai/gpt-oss-120b",
      "llama-3.1-8b-instant"
    ];
    this.currentGroqModelIndex = 0;
    this.rateLimitRetryAfter = 0;
  }

  /**
   * Get next available Groq model from fallback chain
   */
  getNextGroqModel() {
    const model = this.groqModelFallbacks[this.currentGroqModelIndex];
    this.currentGroqModelIndex = (this.currentGroqModelIndex + 1) % this.groqModelFallbacks.length;
    return model;
  }

  /**
   * Reset Groq model index
   */
  resetGroqModelIndex() {
    this.currentGroqModelIndex = 0;
  }

  /**
   * Generate content using the configured AI provider
   */
  async generateContent(prompt, provider = null) {
    const selectedProvider = provider || this.provider;
    
    console.log(`🤖 Using AI Provider: ${selectedProvider}`);
    
    // Validate API key is configured
    const keyValidation = this.validateProvider(selectedProvider);
    if (!keyValidation.valid) {
      console.warn(`⚠️ ${selectedProvider} not configured: ${keyValidation.error}`);
      if (selectedProvider !== 'openai') {
        console.log('🔄 Falling back to OpenAI...');
        return await this.generateWithOpenAI(prompt);
      }
      throw new Error(`OpenAI API key not configured`);
    }
    
    try {
      switch (selectedProvider) {
        case 'gemini':
          return await this.generateWithGemini(prompt);
        
        case 'openai':
          return await this.generateWithOpenAI(prompt);
        
        case 'deepseek':
          return await this.generateWithDeepSeek(prompt);
        
        case 'groq':
          return await this.generateWithGroq(prompt);
        
        default:
          throw new Error(`Unknown AI provider: ${selectedProvider}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${selectedProvider}:`, error.message);
      
      // Fallback to OpenAI if primary provider fails
      if (selectedProvider !== 'openai') {
        console.log('🔄 Falling back to OpenAI...');
        return await this.generateWithOpenAI(prompt);
      }
      
      throw error;
    }
  }

  /**
   * Validate if a provider is properly configured
   */
  validateProvider(provider) {
    const validations = {
      gemini: () => {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'undefined') {
          return { valid: false, error: 'GEMINI_API_KEY not set' };
        }
        return { valid: true };
      },
      openai: () => {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'undefined') {
          return { valid: false, error: 'OPENAI_API_KEY not set' };
        }
        return { valid: true };
      },
      deepseek: () => {
        if (!this.deepseekApiKey || this.deepseekApiKey === 'undefined') {
          return { valid: false, error: 'DEEPSEEK_API_KEY not set' };
        }
        return { valid: true };
      },
      groq: () => {
        if (!this.groqApiKey || this.groqApiKey === 'undefined') {
          return { valid: false, error: 'GROQ_API_KEY not set' };
        }
        return { valid: true };
      }
    };

    const validator = validations[provider];
    if (!validator) {
      return { valid: false, error: 'Unknown provider' };
    }

    return validator();
  }

  /**
   * Generate with Google Gemini
   */
  async generateWithGemini(prompt) {
    const sanitized = sanitizeForLogging(prompt);
    appendLog('ai_prompts.log', { provider: 'gemini', timestamp: Date.now(), prompt: sanitized });

    const model = this.gemini.getGenerativeModel({ 
      model: this.models.gemini 
    });
    
    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();
    
    // Clean markdown if present
    if (response.startsWith('```')) {
      response = response.replace(/```json|```/g, '').trim();
    }

    appendLog('ai_responses.log', { provider: 'gemini', timestamp: Date.now(), length: response.length, response: sanitizeForLogging(response) });
    return response;
  }

  /**
   * Generate with OpenAI (Premium GPT-4o)
   */
  async generateWithOpenAI(prompt) {
    // Log the sanitized prompt for debugging (no PII)
    const sanitizedPrompt = sanitizeForLogging(prompt);
    appendLog('ai_prompts.log', { provider: 'openai', timestamp: Date.now(), prompt: sanitizedPrompt });
    console.log('   📨 Prompt (sanitized, first 1000 chars):', sanitizedPrompt.substring(0, 1000));

    const completion = await this.openai.chat.completions.create({
      model: this.models.openai,
      messages: [
        {
          role: "system",
          content: "You are an expert HR analyst and technical recruiter. Return ONLY valid JSON. No markdown, no explanations. Escape all special characters properly. Use \\n for newlines inside strings, not literal newlines. Ensure both 'en' and 'ar' sections are provided and are complete translations of one another."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    let response = completion.choices[0].message.content.trim();
    
    // Clean markdown if present
    if (response.startsWith('```')) {
      response = response.replace(/```json|```/g, '').trim();
    }

    // Log the raw (sanitized) response for debugging
    appendLog('ai_responses.log', { provider: 'openai', timestamp: Date.now(), length: response.length, response: sanitizeForLogging(response) });
    console.log('   ✅ AI response received (sanitized length):', sanitizeForLogging(response).length);

    return response;
  }

  /**
   * Generate with DeepSeek
   */
  async generateWithDeepSeek(prompt) {
    const sanitizedPrompt = sanitizeForLogging(prompt);
    appendLog('ai_prompts.log', { provider: 'deepseek', timestamp: Date.now(), prompt: sanitizedPrompt });

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: this.models.deepseek,
        messages: [
          {
            role: "system",
            content: "You are an expert HR analyst and technical recruiter. Return ONLY valid JSON. No markdown, no explanations. Escape all special characters properly. Use \\n for newlines inside strings, not literal newlines. Ensure both 'en' and 'ar' sections are provided."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.deepseekApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    let text = response.data.choices[0].message.content.trim();
    
    // Clean markdown if present
    if (text.startsWith('```')) {
      text = text.replace(/```json|```/g, '').trim();
    }

    appendLog('ai_responses.log', { provider: 'deepseek', timestamp: Date.now(), length: text.length, response: sanitizeForLogging(text) });

    return text;
  }

  /**
   * Generate with Groq with automatic fallback and rate limit handling
   */
  async generateWithGroq(prompt) {
    if (!this.groqApiKey || this.groqApiKey === 'undefined') {
      throw new Error('Groq API key not configured');
    }

    // Check if we're still rate limited
    if (this.rateLimitRetryAfter > Date.now()) {
      const waitMs = Math.ceil((this.rateLimitRetryAfter - Date.now()) / 1000);
      console.warn(`⏳ Rate limited. Waiting ${waitMs}s before retrying...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    // Try each model in the fallback chain
    for (let attempt = 0; attempt < this.groqModelFallbacks.length; attempt++) {
      const currentModel = this.models.groq || this.groqModelFallbacks[0];
      const modelToUse = attempt === 0 ? currentModel : this.getNextGroqModel();
      
      try {
        console.log(`🚀 Attempting Groq with model: ${modelToUse}`);
        
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: modelToUse,
            messages: [
              {
                role: "system",
                content: "You are an expert HR analyst and technical recruiter. Return ONLY valid JSON. No markdown, no explanations. Escape all special characters properly. Use \\n for newlines inside strings, not literal newlines. Ensure all Unicode characters are properly escaped."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 8000,
            top_p: 1,
            stream: false
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        if (!response.data || !response.data.choices || !response.data.choices[0]) {
          throw new Error('Invalid response structure from Groq');
        }

        let text = response.data.choices[0].message.content.trim();
        
        // Clean markdown if present
        if (text.startsWith('```')) {
          text = text.replace(/```json|```/g, '').trim();
        }
        
        console.log(`✅ Groq (${modelToUse}) response: ${text.length} chars`);
        this.resetGroqModelIndex();
        this.rateLimitRetryAfter = 0;
        return text;

      } catch (error) {
        // Handle 429 rate limit with exponential backoff
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          const waitSeconds = parseInt(retryAfter) || 60;
          this.rateLimitRetryAfter = Date.now() + (waitSeconds * 1000);
          console.warn(`⏳ Rate limited (429). Will retry after ${waitSeconds}s. Trying next model...`);
          
          if (attempt === this.groqModelFallbacks.length - 1) {
            throw new Error(`All Groq models rate limited. Retry after ${waitSeconds}s`);
          }
          continue;
        }
        
        console.warn(`⚠️ Model ${modelToUse} failed (attempt ${attempt + 1}/${this.groqModelFallbacks.length}):`, error.message);
        
        if (attempt === this.groqModelFallbacks.length - 1) {
          if (error.response) {
            console.error('❌ All Groq models exhausted. Final error:', {
              status: error.response.status,
              data: error.response.data,
              message: error.response.data?.error?.message || 'Unknown error'
            });
            throw new Error(`All Groq models failed: ${error.response.data?.error?.message || error.response.status}`);
          }
          throw error;
        }
        
        continue;
      }
    }
  }

  /**
   * Test all providers
   */
  async testAllProviders() {
    const testPrompt = "Say 'Hello, I am working!' in JSON format: {\"message\": \"...\"}";
    const results = {};
    
    for (const provider of ['gemini', 'openai', 'deepseek', 'groq']) {
      try {
        console.log(`\n🧪 Testing ${provider}...`);
        const startTime = Date.now();
        const response = await this.generateContent(testPrompt, provider);
        const duration = Date.now() - startTime;
        
        results[provider] = {
          status: 'success',
          response: response.substring(0, 100),
          duration: `${duration}ms`
        };
        console.log(`✅ ${provider} working! (${duration}ms)`);
      } catch (error) {
        results[provider] = {
          status: 'failed',
          error: error.message
        };
        console.log(`❌ ${provider} failed: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * Get available providers and models
   */
  getAvailableProviders() {
    return {
      current: this.provider,
      available: ['gemini', 'openai', 'deepseek', 'groq'],
      models: this.models,
      groqFallbacks: this.groqModelFallbacks
    };
  }
}

module.exports = new AIService();