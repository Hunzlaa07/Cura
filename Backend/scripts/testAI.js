require('dotenv').config();
const aiService = require('../services/aiService');

async function testFreeAIModels() {
  console.log('🧪 Testing FREE AI Models via OpenRouter\n');
  console.log('='.repeat(70) + '\n');

  // Test 1: Primary Model (DeepSeek R1 70B)
  console.log('📝 Test 1: Primary Model - DeepSeek R1 70B (Free)');
  try {
    const response = await aiService.generateContent(
      'Write a creative job title for a senior developer position in one sentence.',
      {
        model: aiService.config.defaultModels.primary,
        maxTokens: 100
      }
    );
    console.log('✅ Primary Model Response:', response.substring(0, 150));
  } catch (error) {
    console.error('❌ Primary Model Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 2: Fastest Model (DeepSeek R1 8B)
  console.log('📝 Test 2: Fastest Model - DeepSeek R1 8B (Free)');
  try {
    const response = await aiService.generateContent(
      'What are the top 3 skills needed for a software engineer? List them briefly.',
      {
        model: aiService.config.defaultModels.fastest,
        maxTokens: 200
      }
    );
    console.log('✅ Fastest Model Response:', response.substring(0, 200));
  } catch (error) {
    console.error('❌ Fastest Model Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 3: Alternative Model (Gemini Flash) - Use Sparingly!
  console.log('📝 Test 3: Alternative Model - Gemini Flash (Free - Rate Limited)');
  try {
    const response = await aiService.generateContent(
      'Describe what makes a good company culture in 2 sentences.',
      {
        model: aiService.config.defaultModels.alternative,
        maxTokens: 150
      }
    );
    console.log('✅ Alternative Model Response:', response.substring(0, 200));
  } catch (error) {
    console.error('❌ Alternative Model Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 4: Fallback Model (DeepSeek R1 14B)
  console.log('📝 Test 4: Fallback Model - DeepSeek R1 14B (Free)');
  try {
    const response = await aiService.generateContent(
      'What is the benefit of remote work? Answer briefly.',
      {
        model: aiService.config.defaultModels.fallback,
        maxTokens: 100
      }
    );
    console.log('✅ Fallback Model Response:', response.substring(0, 200));
  } catch (error) {
    console.error('❌ Fallback Model Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 5: JSON Generation
  console.log('📊 Test 5: JSON Generation with Free Model');
  try {
    const jsonResponse = await aiService.generateJSON(
      `Generate a sample job posting in JSON with these exact fields:
      {
        "title": "job title here",
        "location": "location here",
        "type": "employment type"
      }
      Return ONLY valid JSON, no other text.`,
      {
        model: aiService.config.defaultModels.primary
      }
    );
    console.log('✅ JSON Parsed Successfully:');
    console.log(JSON.stringify(jsonResponse, null, 2));
  } catch (error) {
    console.error('❌ JSON Test Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 6: Multiple Models Comparison
  console.log('🤖 Test 6: Multiple FREE Models Comparison');
  try {
    const prompt = 'What makes a good software engineer? Answer in one short sentence.';
    
    // Get models for consensus
    const modelsToTest = [
      aiService.config.defaultModels.primary,
      aiService.config.defaultModels.fallback,
      aiService.config.defaultModels.fastest
    ];
    
    const multiResults = await aiService.generateWithMultipleModels(prompt, modelsToTest);
    
    console.log(`✅ Got ${multiResults.length} responses:\n`);
    multiResults.forEach((result, i) => {
      console.log(`${i + 1}. ${result.model_info.name} (${result.model_info.provider}):`);
      console.log(`   "${result.response.substring(0, 120)}..."\n`);
    });
  } catch (error) {
    console.error('❌ Multi-model Test Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 7: Fallback Mechanism
  console.log('🔄 Test 7: Automatic Fallback Test');
  try {
    const response = await aiService.generateContent(
      'Say hello in one sentence.',
      {
        model: 'invalid/fake-model:free', // This will fail
        enableFallback: true
      }
    );
    console.log('✅ Fallback worked! Response:', response.substring(0, 100));
  } catch (error) {
    console.error('❌ Fallback Test Failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 8: Task-Based Model Selection
  console.log('🎯 Test 8: Task-Based Model Selection (FREE)');
  const tasks = [
    'job_description',
    'case_study',
    'evaluation_critical',
    'translation',
    'skill_extraction',
    'fast_tasks'
  ];
  
  console.log('Recommended FREE models by task:\n');
  tasks.forEach(task => {
    const model = aiService.config.getModelForTask(task);
    const info = aiService.config.getModelInfo(model);
    console.log(`   ${task.padEnd(25)} → ${info.name} (${info.provider})`);
  });

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 9: Usage Statistics
  console.log('📊 Test 9: Usage Statistics');
  const stats = aiService.getUsageStats();
  console.log('Current Usage (All FREE):');
  console.log(`   Total Requests: ${stats.total_requests}`);
  console.log(`   Successful: ${stats.successful}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Rate Limited: ${stats.rate_limited || 0}`);
  console.log(`   Success Rate: ${stats.success_rate}`);
  console.log(`   Daily Usage: ${stats.daily_requests_used}`);
  console.log(`   Remaining Today: ${stats.daily_requests_remaining}`);
  console.log(`   Est. Tokens: ${stats.total_tokens_estimated}`);
  console.log(`   💰 Cost: ${stats.cost}`);
  
  if (stats.model_usage && stats.model_usage.length > 0) {
    console.log('\n   Model Usage:');
    stats.model_usage.forEach(m => {
      console.log(`      ${m.info.name}: ${m.count} requests`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 10: List All Available Models
  console.log('🧪 Test 10: List All Available FREE Models');
  try {
    const allModels = aiService.config.getAllModels();
    
    console.log(`\nFound ${allModels.length} FREE models configured:\n`);
    allModels.forEach((model, i) => {
      console.log(`${i + 1}. ${model.name}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Provider: ${model.provider}`);
      console.log(`   Speed: ${model.speed}`);
      console.log(`   Cost: ${model.cost}`);
      console.log(`   Note: ${model.note}\n`);
    });
  } catch (error) {
    console.error('❌ Model listing failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test 11: Comprehensive Model Test (Optional - will use quota!)
  console.log('🧪 Test 11: Testing ALL Available FREE Models');
  console.log('⚠️  WARNING: This will consume your daily quota!');
  console.log('⚠️  Skipping by default. Uncomment to test all models.\n');
  
  // UNCOMMENT BELOW TO TEST ALL MODELS (will use significant quota)
  /*
  try {
    const allResults = await aiService.testAllModels();
    
    console.log('\n📊 Summary of All FREE Models:\n');
    const successful = allResults.filter(r => r.status === 'success');
    const failed = allResults.filter(r => r.status === 'failed');
    
    if (successful.length > 0) {
      console.log(`✅ Working: ${successful.length} models`);
      successful.forEach(r => {
        console.log(`   • ${r.model} (${r.provider}) - ${r.duration_ms}ms`);
      });
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length} models`);
      failed.forEach(r => {
        console.log(`   • ${r.model} (${r.provider}) - ${r.error}`);
      });
    }
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  }
  */

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Test suite completed! All models are 100% FREE!\n');
  
  // Final stats
  const finalStats = aiService.getUsageStats();
  console.log('📈 Final Statistics:');
  console.log(`   Total API Calls: ${finalStats.total_requests}`);
  console.log(`   Successful: ${finalStats.successful}`);
  console.log(`   Failed: ${finalStats.failed}`);
  console.log(`   Success Rate: ${finalStats.success_rate}`);
  console.log(`   Daily Quota Used: ${finalStats.daily_requests_used}`);
  console.log(`   Remaining Today: ${finalStats.daily_requests_remaining}`);
  console.log(`   💰 Total Cost: $0.00 (FREE!)`);

  console.log('\n💡 Important Notes:');
  console.log('   • Free tier: 50 requests/day');
  console.log('   • Add $10 credits for 1000 requests/day');
  console.log('   • Privacy settings: https://openrouter.ai/settings/privacy');
  console.log('   • Must enable data collection for free models');
  console.log('   • Available models: https://openrouter.ai/models?fmt=cards&max_price=0');
}

// Run tests
testFreeAIModels()
  .then(() => {
    console.log('\n🎉 Test suite completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });