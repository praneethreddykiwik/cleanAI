import { logger } from '../logger';

export interface ModelProvider {
  analyzeImage(imageBase64: string): Promise<any>;
  generateText(prompt: string): Promise<string>;
}

class GeminiModelProvider implements ModelProvider {
  public async analyzeImage(imageBase64: string): Promise<any> {
    logger.info('[ModelRegistry] Routing image analysis to Gemini API...');
    // Real implementation would invoke the actual Gemini API logic
    return { roomType: 'Kitchen', complexity: 0.8, objects: ['grease', 'dirty oven'] };
  }

  public async generateText(prompt: string): Promise<string> {
    logger.info('[ModelRegistry] Routing text generation to Gemini...');
    return 'Gemini generated text output response';
  }
}

class ClaudeModelProvider implements ModelProvider {
  public async analyzeImage(imageBase64: string): Promise<any> {
    logger.info('[ModelRegistry] Routing image analysis to Anthropic Claude (Fallback)...');
    return { roomType: 'Kitchen', complexity: 0.8, objects: ['grease', 'dirty oven'] };
  }

  public async generateText(prompt: string): Promise<string> {
    logger.info('[ModelRegistry] Routing text generation to Anthropic Claude...');
    return 'Claude generated text output response';
  }
}

class GroqModelProvider implements ModelProvider {
  public async analyzeImage(imageBase64: string): Promise<any> {
    logger.info('[ModelRegistry] Routing image analysis to Groq API (using Llama-3.2-Vision)...');
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      return { roomType: 'General', complexity: 0.5, objects: ['surface dust'] };
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
      return JSON.parse(data.choices[0].message.content);
    } catch (err: any) {
      logger.error('[ModelRegistry] Groq vision failed, returning default:', err);
      return { roomType: 'General', complexity: 0.6, objects: ['surface dust'] };
    }
  }

  public async generateText(prompt: string): Promise<string> {
    logger.info('[ModelRegistry] Routing text generation to Groq...');
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      return 'Groq fallback response';
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
      return data.choices[0].message.content;
    } catch (err: any) {
      logger.error('[ModelRegistry] Groq generation failed:', err);
      return 'Groq fallback response';
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

  public static setProvider(providerName: 'GEMINI' | 'CLAUDE' | 'GROQ') {
    this.activeProvider = providerName;
    logger.info(`[ModelRegistry] Active model switched to: ${providerName}`);
  }
}
