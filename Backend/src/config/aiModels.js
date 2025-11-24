// ACTUALLY WORKING FREE MODELS on OpenRouter (Verified October 2025)
// Source: https://developer.puter.com/tutorials/free-unlimited-openrouter-api/
// Note: Free models require enabling data collection in OpenRouter privacy settings
// Rate limits: 50 requests/day (or 1000/day if you've purchased $10+ credits)

const aiModelsConfig = {
  // VERIFIED WORKING FREE models (confirmed working as of Oct 2025)
  models: {
    // DeepSeek R1 models - BEST free options for coding
    deepseek_r1_70b: {
      id: 'deepseek/deepseek-r1-distill-llama-70b:free',
      name: 'DeepSeek R1 Distill Llama 70B (Free)',
      provider: 'DeepSeek',
      cost: 'free',
      speed: 'medium',
      note: 'Excellent for coding, reasoning tasks. Best free option.'
    },
    
    deepseek_r1_8b: {
      id: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      name: 'DeepSeek R1 Qwen 8B (Free)',
      provider: 'DeepSeek',
      cost: 'free',
      speed: 'fast',
      note: 'Faster alternative, good for general tasks'
    },
    
    deepseek_r1: {
      id: 'deepseek/deepseek-r1:free',
      name: 'DeepSeek R1 (Free)',
      provider: 'DeepSeek',
      cost: 'free',
      speed: 'medium',
      note: 'Base DeepSeek R1 model'
    },
    
    // Google Gemini - WORKING but has strict rate limits
    gemini_flash: {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash (Free)',
      provider: 'Google',
      cost: 'free',
      speed: 'very_fast',
      note: 'STRICT RATE LIMITS. Use sparingly. Multimodal support.'
    },
    
    gemini_flash_image: {
      id: 'google/gemini-2.5-flash-image-preview:free',
      name: 'Gemini 2.5 Flash Image (Free)',
      provider: 'Google',
      cost: 'free',
      speed: 'fast',
      note: 'For image + text tasks. Rate limited.'
    },
    
    // Google Gemma models - Smaller but reliable
    gemma_4b: {
      id: 'google/gemma-3-4b-it:free',
      name: 'Gemma 3 4B (Free)',
      provider: 'Google',
      cost: 'free',
      speed: 'very_fast',
      note: 'Small, fast model for simple tasks'
    },
    
    gemma_12b: {
      id: 'google/gemma-3-12b-it:free',
      name: 'Gemma 3 12B (Free)',
      provider: 'Google',
      cost: 'free',
      speed: 'fast',
      note: 'Balanced speed and capability'
    },
    
    gemma_27b: {
      id: 'google/gemma-3-27b-it:free',
      name: 'Gemma 3 27B (Free)',
      provider: 'Google',
      cost: 'free',
      speed: 'medium',
      note: 'Larger Gemma model, better quality'
    },
    
    // Meta Llama models - Vision capable
    llama_vision: {
      id: 'meta-llama/llama-3.2-11b-vision-instruct:free',
      name: 'Llama 3.2 11B Vision (Free)',
      provider: 'Meta',
      cost: 'free',
      speed: 'medium',
      note: 'Vision + text model'
    },
    
    // Mistral models
    mistral_small: {
      id: 'mistralai/mistral-small-3.1-24b-instruct:free',
      name: 'Mistral Small 3.1 24B (Free)',
      provider: 'Mistral',
      cost: 'free',
      speed: 'medium',
      note: 'Good for function calling and structured output'
    },
    
    // Qwen models - Strong multilingual support
    qwen_32b_vl: {
      id: 'qwen/qwen2.5-vl-32b-instruct:free',
      name: 'Qwen 2.5 VL 32B (Free)',
      provider: 'Qwen',
      cost: 'free',
      speed: 'medium',
      note: 'Vision + text, multilingual'
    },
    
    qwen_72b_vl: {
      id: 'qwen/qwen2.5-vl-72b-instruct:free',
      name: 'Qwen 2.5 VL 72B (Free)',
      provider: 'Qwen',
      cost: 'free',
      speed: 'slow',
      note: 'Largest free vision model'
    },
    
    // Nvidia Nemotron
    nvidia_nemotron: {
      id: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
      name: 'Nvidia Nemotron 70B (Free)',
      provider: 'Nvidia',
      cost: 'free',
      speed: 'medium',
      note: 'Nvidia-optimized Llama'
    },
    
    // Moonshot Kimi
    kimi_vl: {
      id: 'moonshotai/kimi-vl-a3b-thinking:free',
      name: 'Kimi VL A3B Thinking (Free)',
      provider: 'Moonshot',
      cost: 'free',
      speed: 'fast',
      note: 'Efficient vision reasoning model'
    }
  },

  // Task-specific model recommendations
  taskModels: {
    // Coding tasks - DeepSeek excels here
    case_study: ['deepseek/deepseek-r1-distill-llama-70b:free', 'deepseek/deepseek-r1:free'],
    job_description: ['deepseek/deepseek-r1-distill-llama-70b:free', 'google/gemini-2.0-flash-exp:free'],
    evaluation_critical: ['deepseek/deepseek-r1-distill-llama-70b:free', 'nvidia/llama-3.1-nemotron-70b-instruct:free'],
    
    // Fast tasks - use smaller, quicker models
    fast_tasks: ['deepseek/deepseek-r1-0528-qwen3-8b:free', 'google/gemma-3-4b-it:free'],
    
    // General purpose
    translation: ['google/gemini-2.0-flash-exp:free', 'qwen/qwen2.5-vl-32b-instruct:free'],
    skill_extraction: ['deepseek/deepseek-r1-distill-llama-70b:free', 'google/gemma-3-12b-it:free'],
    
    // Image/Vision tasks
    image_analysis: ['meta-llama/llama-3.2-11b-vision-instruct:free', 'qwen/qwen2.5-vl-32b-instruct:free'],
    
    // Structured output (JSON, function calling)
    structured_output: ['mistralai/mistral-small-3.1-24b-instruct:free', 'deepseek/deepseek-r1-distill-llama-70b:free']
  },

  // Default model hierarchy
  defaultModels: {
    primary: 'deepseek/deepseek-r1-distill-llama-70b:free',  // Best overall
    fallback: 'deepseek/deepseek-r1:free',  // Reliable backup (removed 14b model that doesn't exist)
    fastest: 'deepseek/deepseek-r1-0528-qwen3-8b:free',      // Quick responses
    alternative: 'google/gemini-2.0-flash-exp:free',         // Different provider
    structured: 'mistralai/mistral-small-3.1-24b-instruct:free', // For JSON/function calling
    vision: 'meta-llama/llama-3.2-11b-vision-instruct:free' // For image tasks
  },

  // Performance settings optimized for free tier
  performance: {
    timeout: 120000,      // 2 minutes - free models can be slower
    max_retries: 2,       // Limited retries to avoid rate limits
    max_concurrent: 1,    // Only 1 at a time - critical for free tier
    retry_delay: 5000,    // 5 seconds between retries
    rate_limit_delay: 10000, // 10 seconds after rate limit error
    daily_request_limit: 50, // Default free tier limit
    requests_per_minute: 3   // VERY conservative - free tier has strict per-minute limits
  },

  // Rate limit tracking
  rateLimits: {
    enabled: true,
    requests_today: 0,
    requests_this_minute: 0,
    last_reset: new Date().toDateString(),
    last_minute_reset: Date.now(),
    warning_threshold: 40, // Warn at 80% of daily limit
    
    // Reset counter daily
    checkReset() {
      const today = new Date().toDateString();
      if (this.last_reset !== today) {
        this.requests_today = 0;
        this.last_reset = today;
      }
      
      // Reset per-minute counter
      const now = Date.now();
      if (now - this.last_minute_reset > 60000) {
        this.requests_this_minute = 0;
        this.last_minute_reset = now;
      }
    },
    
    // Check if we can make request
    canMakeRequest() {
      this.checkReset();
      
      // Check per-minute limit (stricter)
      if (this.requests_this_minute >= aiModelsConfig.performance.requests_per_minute) {
        const waitTime = 60000 - (Date.now() - this.last_minute_reset);
        throw new Error(`Per-minute rate limit reached. Wait ${Math.ceil(waitTime/1000)} seconds.`);
      }
      
      // Check daily limit
      return this.requests_today < aiModelsConfig.performance.daily_request_limit;
    },
    
    // Increment counter
    incrementRequests() {
      this.checkReset();
      this.requests_today++;
      this.requests_this_minute++;
      
      if (this.requests_today >= this.warning_threshold) {
        console.warn(`⚠️ Approaching daily limit: ${this.requests_today}/${aiModelsConfig.performance.daily_request_limit}`);
      }
    }
  },

  // Helper methods
  getModelForTask(taskType, priority = 'standard') {
    const models = this.taskModels[taskType];
    if (!models || models.length === 0) {
      return this.defaultModels.primary;
    }
    
    // Return first model for standard priority, or second for fallback
    return priority === 'fallback' && models.length > 1 ? models[1] : models[0];
  },

  getModelsForConsensus(taskType) {
    // Return 2 different models for consensus
    const models = this.taskModels[taskType] || [
      this.defaultModels.primary, 
      this.defaultModels.fallback
    ];
    return models.slice(0, 2);
  },

  getModelInfo(modelId) {
    return Object.values(this.models).find(m => m.id === modelId) || { 
      id: modelId, 
      name: 'Unknown',
      provider: 'Unknown',
      note: 'Model not in config'
    };
  },

  getAllModels() {
    return Object.values(this.models);
  },

  // Get models avoiding rate-limited ones
  getAvailableModels() {
    // Exclude Google models if we're close to limits
    if (this.rateLimits.requests_today > 30) {
      return Object.values(this.models).filter(m => 
        !m.id.includes('google')
      );
    }
    return Object.values(this.models);
  },

  // Privacy settings warning
  privacyNotice: {
    message: '⚠️ FREE MODELS REQUIRE DATA COLLECTION: You must enable training/logging in OpenRouter privacy settings to use free models.',
    settings_url: 'https://openrouter.ai/settings/privacy',
    enabled: false,
    
    showWarning() {
      if (!this.enabled) {
        console.warn('\n' + '='.repeat(70));
        console.warn(this.message);
        console.warn('Configure at: ' + this.settings_url);
        console.warn('='.repeat(70) + '\n');
        this.enabled = true;
      }
    }
  }
};

module.exports = aiModelsConfig;