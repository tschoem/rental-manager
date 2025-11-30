#!/usr/bin/env tsx

/**
 * Script to list available Gemini models for the current API key
 * Usage: npm run list-gemini-models
 */

import { config } from 'dotenv';
import { listGeminiModels } from '../lib/list-gemini-models';

// Load environment variables
config();

async function main() {
    console.log('🔍 Checking available Gemini models...\n');
    console.log('Using API key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('');
    
    try {
        const models = await listGeminiModels();
        
        console.log(`\n📋 Summary: Found ${models.length} model(s) available`);
        console.log('\nAvailable models for generateContent:');
        models.forEach(model => {
            const supportsGenerateContent = model.supportedGenerationMethods?.includes('generateContent') ?? false;
            if (supportsGenerateContent) {
                console.log(`  ✅ ${model.name}`);
            } else {
                console.log(`  ⚠️  ${model.name} (does not support generateContent)`);
            }
        });
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();

