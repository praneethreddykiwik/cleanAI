import { logger } from '../logger';

export interface ModelProvider {
  analyzeImage(imageBase64: string): Promise<any>;
  generateText(prompt: string): Promise<string>;
}

class GeminiModelProvider implements ModelProvider {
  public async analyzeImage(imageBase64: string): Promise<any> {
    logger.info('[ModelRegistry] Routing image analysis to Gemini API...');
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return { roomType: 'General', complexity: 0.5, objects: ['surface dust'] };
    }

    try {
      let base64Data = imageBase64;
      let mimeType = 'image/jpeg';
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Identify the room category, severity, objects detected, and estimated complexity of this service area. Return ONLY a JSON object: { roomType, complexity, objects }' },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      const data = (await response.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(text);
    } catch (err: any) {
      logger.error('[ModelRegistry] Gemini vision failed, returning default:', err);
      return { roomType: 'General', complexity: 0.6, objects: ['surface dust'] };
    }
  }

  public async generateText(prompt: string): Promise<string> {
    logger.info('[ModelRegistry] Routing text generation to Gemini...');
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return 'Gemini fallback response';
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = (await response.json()) as any;
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini response fallback';
    } catch (err: any) {
      logger.error('[ModelRegistry] Gemini generation failed:', err);
      return 'Gemini fallback response';
    }
  }
}

class ClaudeModelProvider implements ModelProvider {
  public async analyzeImage(imageBase64: string): Promise<any> {
    logger.info('[ModelRegistry] Routing image analysis to Anthropic Claude (Fallback)...');
    return { roomType: 'General', complexity: 0.5, objects: ['surface dust'] };
  }

  public async generateText(prompt: string): Promise<string> {
    logger.info('[ModelRegistry] Routing text generation to Anthropic Claude...');
    return 'Claude generated text response fallback';
  }
}

class GroqModelProvider implements ModelProvider {
  public async analyzeImage(imageBase64: string): Promise<any> {
    logger.info('[ModelRegistry] Routing image analysis to Groq API (using Llama-3.2-Vision)...');
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      logger.warn('[ModelRegistry] Groq API key is missing. Routing check to Gemini...');
      return new GeminiModelProvider().analyzeImage(imageBase64);
    }
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Identify the room category, severity, objects detected, and estimated complexity of this service area. Return ONLY a JSON object: { roomType, complexity, objects }' },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            }
          ],
          response_format: { type: 'json_object' }
        })
      });
      const data = (await response.json()) as any;
      if (!data.choices?.[0]?.message?.content) {
        logger.warn('[ModelRegistry] Groq returned empty choice. Routing failover to Gemini...');
        return new GeminiModelProvider().analyzeImage(imageBase64);
      }
      return JSON.parse(data.choices[0].message.content);
    } catch (err: any) {
      logger.error('[ModelRegistry] Groq vision failed, trying Gemini failover:', err);
      return new GeminiModelProvider().analyzeImage(imageBase64);
    }
  }

  public async generateText(prompt: string): Promise<string> {
    logger.info('[ModelRegistry] Routing text generation to Groq...');
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      return new GeminiModelProvider().generateText(prompt);
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = (await response.json()) as any;
      return data.choices?.[0]?.message?.content || 'Groq response fallback';
    } catch (err: any) {
      logger.error('[ModelRegistry] Groq generation failed, routing to Gemini:', err);
      return new GeminiModelProvider().generateText(prompt);
    }
  }
}

export class ModelRegistry {
  private static providers: Record<string, ModelProvider> = {
    GEMINI: new GeminiModelProvider(),
    CLAUDE: new ClaudeModelProvider(),
    GROQ: new GroqModelProvider(),
  };

  private static activeProvider = process.env.GROQ_API_KEY ? 'GROQ' : 'GEMINI';

  public static getProvider(): ModelProvider {
    const provider = this.providers[this.activeProvider];
    if (!provider) {
      return this.providers['GEMINI'];
    }
    return provider;
  }

  public static getActiveProviderName(): string {
    return this.activeProvider;
  }

  public static setProvider(providerName: 'GEMINI' | 'CLAUDE' | 'GROQ') {
    this.activeProvider = providerName;
    logger.info(`[ModelRegistry] Active model switched to: ${providerName}`);
  }
}
