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

export class ModelRegistry {
  private static providers: Record<string, ModelProvider> = {
    GEMINI: new GeminiModelProvider(),
    CLAUDE: new ClaudeModelProvider(),
  };

  private static activeProvider = 'GEMINI';

  public static getProvider(): ModelProvider {
    const provider = this.providers[this.activeProvider];
    if (!provider) {
      return this.providers['GEMINI'];
    }
    return provider;
  }

  public static setProvider(providerName: 'GEMINI' | 'CLAUDE') {
    this.activeProvider = providerName;
    logger.info(`[ModelRegistry] Active model switched to: ${providerName}`);
  }
}
