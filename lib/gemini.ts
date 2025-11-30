/**
 * Gemini API integration for improving bios
 */

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

export async function improveBioWithGemini(concatenatedBios: string, ownerName?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const prompt = `You are a professional bio writer. Based on the following social media bios and information, create a polished, professional, and engaging bio for ${ownerName ? `someone named ${ownerName}` : 'this person'}. 

The bio should be:
- Professional yet personable
- Concise (2-4 sentences)
- Highlight key strengths and personality
- Suitable for an "About Us" page on a hospitality website
- Written in third person

Here are the social media bios collected:
${concatenatedBios}

Please create an improved bio:`;

    // For AI Studio API keys, try the standard endpoint with common model names
    // Based on available models from your API key, try these in order:
    // 1. gemini-pro-latest (most compatible, replaces old gemini-pro)
    // 2. gemini-2.5-flash (fast and good quality)
    // 3. gemini-2.5-pro (best quality)
    // 4. Fallback to older model names if needed
    const modelNames = [
        'gemini-pro-latest',
        'gemini-2.5-flash', 
        'gemini-2.5-pro',
        'gemini-flash-latest',
        'gemini-pro', // Fallback for older API keys
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];
    const apiVersions = ['v1beta', 'v1'];
    
    let lastError: Error | null = null;
    
    // Try each combination of model and API version
    for (const modelName of modelNames) {
        for (const apiVersion of apiVersions) {
            try {
                // All models from the API list use the 'models/' prefix
                // Construct the endpoint properly
                const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
                const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/${modelPath}:generateContent?key=${apiKey}`;
                
                const response = await fetch(endpoint,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    }
                );
                
                if (response.ok) {
                    const data: GeminiResponse = await response.json();
                    
                    if (!data.candidates || data.candidates.length === 0) {
                        continue; // Try next model
                    }
                    
                    const improvedBio = data.candidates[0].content.parts[0].text.trim();
                    return improvedBio;
                } else if (response.status !== 404) {
                    // If it's not a 404, it's a different error - get the error message
                    const errorText = await response.text();
                    lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`);
                    // Continue to try other models
                }
                // If 404, continue to next model/version combination
            } catch (error: any) {
                if (error.message && !error.message.includes('404')) {
                    lastError = error;
                }
                // Continue to next combination
            }
        }
    }
    
    // If we get here, all combinations failed
    throw new Error(
        `Gemini API: No available model found. Tried: ${modelNames.join(', ')} with API versions: ${apiVersions.join(', ')}. ` +
        `Last error: ${lastError?.message || 'All models returned 404'}. ` +
        `Please check that your API key has access to Gemini models and that the Generative Language API is enabled in your Google Cloud project.`
    );
}
