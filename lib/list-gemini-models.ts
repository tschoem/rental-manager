/**
 * List available Gemini models for the provided API key
 */

interface GeminiModel {
    name: string;
    displayName: string;
    description?: string;
    supportedGenerationMethods?: string[];
    version?: string;
}

interface GeminiModelsResponse {
    models?: GeminiModel[];
}

export async function listGeminiModels(): Promise<GeminiModel[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const models: GeminiModel[] = [];
    const apiVersions = ['v1beta', 'v1'];
    
    for (const apiVersion of apiVersions) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            if (response.ok) {
                const data: GeminiModelsResponse = await response.json();
                if (data.models && data.models.length > 0) {
                    console.log(`\n✅ Found ${data.models.length} models in ${apiVersion}:`);
                    data.models.forEach(model => {
                        console.log(`  - ${model.name}`);
                        if (model.displayName) {
                            console.log(`    Display Name: ${model.displayName}`);
                        }
                        if (model.supportedGenerationMethods) {
                            console.log(`    Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
                        }
                        models.push(model);
                    });
                    return models; // Return first successful response
                }
            } else {
                const errorText = await response.text();
                console.log(`❌ ${apiVersion} returned ${response.status}: ${errorText.substring(0, 200)}`);
            }
        } catch (error: any) {
            console.log(`❌ Error checking ${apiVersion}: ${error.message}`);
        }
    }
    
    if (models.length === 0) {
        throw new Error('No models found. Please check your API key and ensure the Generative Language API is enabled.');
    }
    
    return models;
}

