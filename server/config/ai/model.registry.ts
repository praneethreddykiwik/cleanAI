import { logger } from '../logger';

/**
 * Full JobComplexityResult prompt — single source of truth.
 * Used for BOTH text-only and image analysis paths.
 * The AI must return ALL these fields — never partial.
 */
export const JOB_ANALYSIS_PROMPT = `You are an expert multi-category home services & visual inspection AI for Criska CleanAI.
Analyze the provided description and/or image across any of the 12 Marketplace Categories:
1. Home Cleaning (Kitchen, Bathroom, Deep Home, Flooring, Tank)
2. Pre-Ceremony & Event Cleaning (Griha Pravesh, Post-Renovation, Sticker/Glue/Paint removal, Construction debris)
3. Vehicle Care (Bike & Car wash, Ceramic coating, Chain cleaning, Engine bay, Interior vacuuming)
4. Repairs & Electrical (Wiring, Plumbing leaks, AC, Appliances, PCB diagnostics)
5. Home Improvement (Interior/Exterior Painting, Texture, POP, Wallpaper, Carpentry)
6. Outdoor & Garden (Lawn maintenance, Tree trimming, Pressure washing, Terrace/Driveway)
7. Pest Control (Cockroaches, Termites, Bed bugs, Rodents, Mosquitoes)
8. Furniture Care (Sofa shampooing, Leather conditioning, Recliner & Wood polishing)
9. Water & Sanitation (Underground/Overhead Tank, Sump, Sludge, Limescale)
10. Commercial Services (Office, Restaurant, Warehouse, Gym, Hospital facility)
11. Moving Services (Move-in/Move-out clean, Packing assistance, Rental handover)
12. Seasonal Services (Monsoon mold, Diwali deep clean, Summer AC prep, Festival cleanup)

Do NOT include any prices or monetary amounts. Return ONLY a valid JSON object matching EXACTLY this structure:

{
  "room": {
    "type": "<one of: Kitchen, Bathroom, Living Room, Bedroom, Balcony, Outdoor, Commercial, Warehouse, Vehicle, General>",
    "estimatedAreaSqft": <integer estimate 30-10000>
  },
  "surfaces": ["<detected surface materials e.g. Tile, Marble, Granite, Wood, Glass, Fabric, Metal, Carpet, Concrete, Leather, Vehicle Paint, Wiring, Wall POP>"],
  "detectedIssues": [
    {
      "type": "<detected issue e.g. Cement Dust, Sticker Residue, Glue & Gum, Paint Splashes, Construction Debris, Tape Marks, Glass Smudges, Grease, Dust, Oil, Mold, Water Damage, Mud & Dirt, Chain Grease, Rust, Swirl Marks, Corrosion, Exposed Wiring, Water Leakage, Wall Cracks, Dampness, Insect Activity, Termite Tubes, Sludge, Limescale>",
      "severity": <float 0.1 to 1.0>
    }
  ],
  "objectsDetected": ["<specific furniture, vehicles, appliances, fixtures, wiring, or items seen>"],
  "estimatedDurationHours": <number 0.5 to 14.0>,
  "workersRequired": <integer 1 to 10>,
  "recommendedEquipment": ["<specialized tools/chemicals e.g. Degreaser, Adhesive Solvent, Heavy Pressure Washer, Foam Cannon, Rotary Buffer, Steam Cleaner, Descaling Solution, Upholstery Extractor, Thermal Fogger, Scaffolding>"],
  "confidence": <float 0.0 to 1.0>,
  "reasoning": "<1-2 sentences summarizing physical observations and category findings>"
}

Be realistic and highly specific based on visual and textual evidence.`;

export interface DetectedIssue {
  type: string;
  severity: number; // 0.1 to 1.0
}

export interface WCISubScores {
  area: number; // 20%
  surfaces: number; // 15%
  dirt: number; // 25%
  density: number; // 10%
  chemical: number; // 10%
  equipment: number; // 10%
  accessibility: number; // 5%
  safetyRisk: number; // 5%
}

export type ConfidenceGatingStatus =
  | 'AUTOMATIC_ESTIMATE' // >= 0.90
  | 'NEED_ONE_MORE_PHOTO' // 0.75 - 0.89
  | 'NEED_DIFFERENT_ANGLES' // 0.50 - 0.74
  | 'ESCALATE_TO_MANUAL_REVIEW'; // < 0.50

/**
 * Groq retired every Llama vision model; `llama-3.2-11b-vision-preview` now
 * returns 400 model_decommissioned. Verified against the live /models endpoint
 * for this account: qwen3.6-27b is the only remaining image-capable model
 * (gpt-oss and compound are text-only). Gemini stays as the failover provider.
 */
const GROQ_VISION_MODEL = 'qwen/qwen3.6-27b';
const GROQ_TEXT_MODEL = 'openai/gpt-oss-120b';

export interface JobComplexityResult {
  service: string;
  subcategory?: string;
  room: {
    type: string;
    estimatedAreaSqft: number;
  };
  surfaces: string[];
  detectedIssues: DetectedIssue[];
  objectsDetected: string[];
  estimatedDurationHours: number;
  estimatedDuration: string; // Formatting string e.g. "3 Hours"
  workersRequired: number;
  recommendedEquipment: string[];
  confidence: number;
  wciScore?: number; // 0 to 100 Work Complexity Index
  wciSubScores?: WCISubScores;
  confidenceGating?: ConfidenceGatingStatus;
  confidenceMessage?: string;
  imageCount?: number;
  severityScore?: number;
  starRating?: number; // 1 to 5 Stars ⭐
  severityLabel?: string;
  requiresBidding?: boolean;
  reasoning?: string;
}

export interface ModelProvider {
  analyzeImage(imageBase64: string): Promise<JobComplexityResult>;
  generateText(prompt: string, history?: { role: string; content: string }[]): Promise<string>;
}

/**
 * Parse and strictly validate the AI JSON response.
 * Throws if ANY required field is missing — never silently fills defaults.
 */
function parseAndValidateJobResult(text: string): JobComplexityResult {
  if (!text || !text.trim()) {
    throw new Error('AI returned empty response');
  }

  let cleaned = text.trim();

  // Reasoning models (qwen3.6) emit a <think>...</think> preamble before the
  // answer. Left in place it defeats JSON.parse and the brace-matching
  // fallback, since the reasoning itself often contains braces.
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // An unterminated block means the model hit max_tokens mid-thought.
  if (cleaned.startsWith('<think>')) {
    throw new Error('AI response was cut off during reasoning; no JSON produced');
  }

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Cannot parse AI response as JSON: "${cleaned.slice(0, 200)}"`);
    try { parsed = JSON.parse(match[0]); } catch (e2) {
      throw new Error(`JSON parse failed after extraction: ${(e2 as Error).message}`);
    }
  }

  const roomType = String(parsed.room?.type || parsed.subcategory || 'General');
  const estimatedAreaSqft = Math.max(30, parseInt(String(parsed.room?.estimatedAreaSqft || 150), 10));

  const surfaces = Array.isArray(parsed.surfaces) ? parsed.surfaces.map(String) : ['Tile'];
  const objectsDetected = Array.isArray(parsed.objectsDetected) ? parsed.objectsDetected.map(String) : [];
  const recommendedEquipment = Array.isArray(parsed.recommendedEquipment || parsed.recommendedTools)
    ? (parsed.recommendedEquipment || parsed.recommendedTools).map(String)
    : ['Standard Cleaning Kit'];

  // Parse detected issues
  let detectedIssues: DetectedIssue[] = [];
  if (Array.isArray(parsed.detectedIssues)) {
    detectedIssues = parsed.detectedIssues.map((issue: any) => ({
      type: String(issue.type || 'Dust'),
      severity: Math.min(1.0, Math.max(0.1, parseFloat(String(issue.severity || 0.5)))),
    }));
  } else {
    // Legacy issue fallback
    const issueType = String(parsed.severity || 'Dust');
    detectedIssues = [{ type: issueType, severity: 0.6 }];
  }

  const conf = parseFloat(String(parsed.confidence ?? 0.95));
  const validConf = isNaN(conf) ? 0.95 : Math.min(1.0, Math.max(0.0, conf));

  const durationHours = parseFloat(String(parsed.estimatedDurationHours || parseFloat(String(parsed.estimatedDuration)) || 2.0));
  const validDurationHours = isNaN(durationHours) ? 2.0 : Math.min(24.0, Math.max(0.5, durationHours));

  const workers = parseInt(String(parsed.workersRequired ?? 1), 10);
  const validWorkers = isNaN(workers) ? 1 : Math.min(10, Math.max(1, workers));

  // Determine inferred service category based on room / objects / text
  let inferredService = 'Deep Cleaning';
  const textLower = (roomType + ' ' + JSON.stringify(objectsDetected)).toLowerCase();
  if (textLower.includes('kitchen') || textLower.includes('stove') || textLower.includes('chimney')) {
    inferredService = 'Kitchen Cleaning';
  } else if (textLower.includes('bathroom') || textLower.includes('toilet') || textLower.includes('shower') || textLower.includes('sink')) {
    inferredService = 'Bathroom Cleaning';
  } else if (textLower.includes('sofa') || textLower.includes('couch') || textLower.includes('fabric')) {
    inferredService = 'Sofa Cleaning';
  } else if (textLower.includes('electrical') || textLower.includes('wire') || textLower.includes('switch')) {
    inferredService = 'Electrical';
  } else if (textLower.includes('plumb') || textLower.includes('drain') || textLower.includes('pipe')) {
    inferredService = 'Plumbing';
  }

  return {
    service: inferredService,
    subcategory: `${roomType} (${estimatedAreaSqft} sq.ft)`,
    room: {
      type: roomType,
      estimatedAreaSqft,
    },
    surfaces,
    detectedIssues,
    objectsDetected,
    estimatedDurationHours: validDurationHours,
    estimatedDuration: `${validDurationHours} Hours`,
    workersRequired: validWorkers,
    recommendedEquipment,
    confidence: Math.round(validConf * 1000) / 1000,
    reasoning: parsed.reasoning ? String(parsed.reasoning) : undefined,
  };
}

class GeminiModelProvider implements ModelProvider {
  private get apiKey(): string {
    const k = process.env.GEMINI_API_KEY || '';
    if (!k) throw new Error('GEMINI_API_KEY is not set. AI is not configured.');
    return k;
  }

  async analyzeImage(imageBase64: string): Promise<JobComplexityResult> {
    logger.info('[Gemini] Calling Vision API with full JobComplexityResult prompt...');

    let base64Data = imageBase64;
    let mimeType = 'image/jpeg';
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: JOB_ANALYSIS_PROMPT },
              { inlineData: { mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 400)}`);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no candidate content. Check API key and quota.');

    logger.info('[Gemini] Vision response received, validating schema...');
    return parseAndValidateJobResult(text);
  }

  async generateText(prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 400)}`);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini generateText returned no content');
    return text;
  }
}

class GroqModelProvider implements ModelProvider {
  private get apiKey(): string {
    const k = process.env.GROQ_API_KEY || '';
    if (!k) throw new Error('GROQ_API_KEY is not set. AI is not configured.');
    return k;
  }

  async analyzeImage(imageBase64: string): Promise<JobComplexityResult> {
    logger.info(`[Groq] Calling ${GROQ_VISION_MODEL} with full JobComplexityResult prompt...`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: JOB_ANALYSIS_PROMPT },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API ${response.status}: ${errBody.slice(0, 400)}`);
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned no message content. Check API key and quota.');

    logger.info('[Groq] Vision response received, validating schema...');
    return parseAndValidateJobResult(text);
  }

  async generateText(prompt: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API ${response.status}: ${errBody.slice(0, 400)}`);
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq generateText returned no content');
    return text;
  }
}

class SimulationModelProvider implements ModelProvider {
  async analyzeImage(imageBase64: string): Promise<JobComplexityResult> {
    logger.info('[Simulation] Analyzing image...');
    return {
      service: 'Kitchen Cleaning',
      subcategory: 'Kitchen (135 sq.ft)',
      room: {
        type: 'Kitchen',
        estimatedAreaSqft: 135,
      },
      surfaces: ['Tile', 'Granite', 'Glass'],
      detectedIssues: [
        { type: 'Grease', severity: 0.85 },
        { type: 'Oil', severity: 0.70 },
        { type: 'Dust', severity: 0.40 },
      ],
      objectsDetected: ['Chimney', 'Gas Stove', 'Kitchen Tiles', 'Sink'],
      estimatedDurationHours: 3.5,
      estimatedDuration: '3.5 Hours',
      workersRequired: 2,
      recommendedEquipment: ['Heavy Degreaser', 'Steam Cleaner', 'Scrubbers'],
      confidence: 0.95,
      reasoning: 'Heavy oil deposits and chimney grease detected on kitchen tiles.',
    };
  }

  async generateText(prompt: string, history?: { role: string; content: string }[]): Promise<string> {
    logger.info('[Simulation] Generating text response...');
    const promptLower = prompt.toLowerCase();
    
    let responseObj: JobComplexityResult = {
      service: 'Kitchen Cleaning',
      subcategory: 'Kitchen (135 sq.ft)',
      room: {
        type: 'Kitchen',
        estimatedAreaSqft: 135,
      },
      surfaces: ['Tile', 'Granite', 'Glass'],
      detectedIssues: [
        { type: 'Grease', severity: 0.85 },
        { type: 'Oil', severity: 0.70 },
        { type: 'Dust', severity: 0.40 },
      ],
      objectsDetected: ['Chimney', 'Gas Stove', 'Kitchen Tiles', 'Sink'],
      estimatedDurationHours: 3.5,
      estimatedDuration: '3.5 Hours',
      workersRequired: 2,
      recommendedEquipment: ['Heavy Degreaser', 'Steam Cleaner', 'Scrubbers'],
      confidence: 0.95,
      reasoning: 'Heavy oil deposits and chimney grease detected on kitchen tiles.',
    };

    if (promptLower.includes('bathroom') || promptLower.includes('toilet') || promptLower.includes('shower')) {
      responseObj = {
        service: 'Bathroom Cleaning',
        subcategory: 'Bathroom (80 sq.ft)',
        room: {
          type: 'Bathroom',
          estimatedAreaSqft: 80,
        },
        surfaces: ['Tile', 'Glass', 'Ceramic'],
        detectedIssues: [
          { type: 'Soap Scum', severity: 0.75 },
          { type: 'Water Damage', severity: 0.45 },
          { type: 'Hardwater Stains', severity: 0.80 },
        ],
        objectsDetected: ['Shower Enclosure', 'Bathroom Sink', 'Toilet Bowl', 'Mirror'],
        estimatedDurationHours: 2.0,
        estimatedDuration: '2.0 Hours',
        workersRequired: 1,
        recommendedEquipment: ['Descaling Solution', 'Acidic Tile Cleaner', 'Scrubbing Brush'],
        confidence: 0.92,
        reasoning: 'Hardwater scaling and tile grout discoloration observed in the bathroom shower zone.',
      };
    } else if (promptLower.includes('sofa') || promptLower.includes('couch') || promptLower.includes('carpet')) {
      responseObj = {
        service: 'Sofa Cleaning',
        subcategory: 'Living Room (180 sq.ft)',
        room: {
          type: 'Living Room',
          estimatedAreaSqft: 180,
        },
        surfaces: ['Fabric', 'Wood'],
        detectedIssues: [
          { type: 'Dust', severity: 0.70 },
          { type: 'Pet Hair', severity: 0.60 },
          { type: 'Food Stains', severity: 0.50 },
        ],
        objectsDetected: ['3-Seater Fabric Sofa', 'Cushions', 'Coffee Table'],
        estimatedDurationHours: 3.0,
        estimatedDuration: '3.0 Hours',
        workersRequired: 1,
        recommendedEquipment: ['Upholstery Extraction Vacuum', 'Fabric Shampoo'],
        confidence: 0.94,
        reasoning: 'Stains and heavy dust accumulation identified on sofa cushions.',
      };
    }

    if (promptLower.includes('explain') || promptLower.includes('supervisor')) {
      return `I detected heavy grease on the stove grills and tile grout. This requires deep kitchen cleaning with specialized degreasing chemicals, and will take about 3.5 hours.`;
    }

    return JSON.stringify(responseObj);
  }
}

export class ModelRegistry {
  private static readonly providers: Record<string, ModelProvider> = {
    GEMINI: new GeminiModelProvider(),
    GROQ: new GroqModelProvider(),
  };

  public static getActiveProviderName(isVision = false): string {
    return this.getProviderChain(isVision)[0] ?? 'SIMULATION';
  }

  public static isConfigured(): boolean {
    return true;
  }

  /**
   * Providers to try, in order, for this kind of request.
   *
   * Vision prefers Gemini. Groq's only remaining image-capable model
   * (qwen3.6-27b) allows 8000 tokens per minute on the free tier while a single
   * photo costs ~4200, so image analysis there fails with 429 after roughly one
   * request a minute. Gemini 2.5 Flash is multimodal with far more headroom.
   * Text generation still prefers Groq, which is fast and cheap for that.
   *
   * Whatever is not first becomes the fallback, so one provider being rate
   * limited or down no longer fails the request.
   */
  public static getProviderChain(isVision = false): string[] {
    const groq = !!process.env.GROQ_API_KEY;
    const gemini = !!process.env.GEMINI_API_KEY;

    const order = isVision ? ['GEMINI', 'GROQ'] : ['GROQ', 'GEMINI'];
    return order.filter((name) => (name === 'GROQ' ? groq : gemini));
  }

  /** A specific provider by name, or the best available when unnamed. */
  public static getProvider(name?: string): ModelProvider {
    if (name && this.providers[name]) {
      return this.providers[name];
    }

    const chain = this.getProviderChain();
    if (chain.length === 0) {
      return new SimulationModelProvider();
    }
    return this.providers[chain[0]];
  }
}
