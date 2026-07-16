import { prisma } from '@/database';
import { AgentsService, JobComplexityResult, PriceEstimationBreakdown } from './agents.service';
import { ModelRegistry } from '@/config/ai/model.registry';

export interface ChatSessionResponse {
  conversationId: string;
  assistantText: string;
  stage: 'GREETING' | 'NEED_IMAGE' | 'ANALYSIS_COMPLETE';
  timelineLogs?: { agentName: string; status: string; details: string }[];
  complexity?: JobComplexityResult;
  pricing?: PriceEstimationBreakdown;
  vendors?: any[];
  memoriesTriggered?: string[];
}

export class AIOrchestrator {
  private static async extractAndSavePreferences(customerId: string, text: string) {
    const textLower = text.toLowerCase();
    
    const updateMemory = async (key: string, value: string) => {
      try {
        const existing = await prisma.customerMemory.findFirst({
          where: { customerId, key }
        });
        if (existing) {
          await prisma.customerMemory.update({
            where: { id: existing.id },
            data: { value }
          });
        } else {
          await prisma.customerMemory.create({
            data: { customerId, key, value }
          });
        }
      } catch (err) {
        console.error(`[Memory Capture] Failed to update memory for key ${key}:`, err);
      }
    };

    try {
      if (textLower.includes('upi')) {
        await updateMemory('favorite_payment', 'UPI');
      } else if (textLower.includes('card') || textLower.includes('credit')) {
        await updateMemory('favorite_payment', 'Card');
      } else if (textLower.includes('cash')) {
        await updateMemory('favorite_payment', 'Cash');
      }

      if (textLower.includes('morning')) {
        await updateMemory('preferred_time', 'Morning slots (8 AM - 12 PM)');
      } else if (textLower.includes('afternoon')) {
        await updateMemory('preferred_time', 'Afternoon slots (12 PM - 4 PM)');
      } else if (textLower.includes('evening')) {
        await updateMemory('preferred_time', 'Evening slots (4 PM - 8 PM)');
      }

      if (textLower.includes('english')) {
        await updateMemory('preferred_language', 'English');
      } else if (textLower.includes('hindi')) {
        await updateMemory('preferred_language', 'Hindi');
      } else if (textLower.includes('kannada')) {
        await updateMemory('preferred_language', 'Kannada');
      }

      if (textLower.includes('apex')) {
        await updateMemory('favorite_vendor', 'Apex Pro Services');
      } else if (textLower.includes('bengaluru express') || textLower.includes('bengaluru premium')) {
        await updateMemory('favorite_vendor', 'Bengaluru Premium Services');
      }
    } catch (err) {
      console.error('[Memory Extraction Error] Failed to update customer preference memory:', err);
    }
  }

  /**
   * Processes a multi-turn chat session with history and customer memory integration
   */
  static async handleChatSession(params: {
    userId: string;
    customerId: string;
    text: string;
    image?: string | null;
    conversationId?: string | null;
    serviceName?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<ChatSessionResponse> {
    // 1. Resolve or create AIConversation
    let conversationId = params.conversationId;
    if (!conversationId) {
      const newConv = await prisma.aIConversation.create({
        data: { customerId: params.customerId },
      });
      conversationId = newConv.id;
    }

    // Save User message
    await prisma.conversationMessage.create({
      data: {
        conversationId,
        sender: 'user',
        text: params.text,
        image: params.image || null,
      },
    });

    // Auto extract and save customer preferences from prompt description
    await this.extractAndSavePreferences(params.customerId, params.text);

    // 2. Fetch Customer Memories
    const memories = await prisma.customerMemory.findMany({
      where: { customerId: params.customerId },
    });

    const memoriesTriggered: string[] = [];
    let memoryContextString = '';
    if (memories.length > 0) {
      memoryContextString = '\nCustomer Memories:\n' + memories.map(m => {
        memoriesTriggered.push(`${m.key}: ${m.value}`);
        return `- Customer has ${m.key} preference/history: ${m.value}`;
      }).join('\n');
    }

    // Retrieve full session history for context
    const historyMessages = await prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    let historyContextString = '';
    if (historyMessages.length > 0) {
      historyContextString = '\nPrevious Conversation History:\n' + historyMessages.map(m => {
        return `- ${m.sender === 'user' ? 'Customer' : 'AI'}: ${m.text}`;
      }).join('\n');
    }

    const descLower = params.text.toLowerCase();
    const hasImage = !!params.image;

    // Log supervisor initiation
    await prisma.agentExecutionLog.create({
      data: {
        agentName: 'Supervisor Agent',
        status: 'STARTED',
        details: 'Supervisor initializing conversation analysis loop.',
      },
    });

    // Check conversational stage routing
    const requiresServiceSelection = !params.serviceName && 
      !descLower.includes('clean') && 
      !descLower.includes('repair') && 
      !descLower.includes('plumb') && 
      !descLower.includes('electrical') && 
      !descLower.includes('wash');

    if (requiresServiceSelection && historyMessages.length <= 2) {
      // Stage: GREETING
      let greeting = `Hi Vivek 👋 I'm Criska AI, your home services operating system. Tell me what needs to be done today.`;
      if (memories.length > 0) {
        const lastTech = memories.find(m => m.key === 'favorite_technician');
        const lastService = memories.find(m => m.key === 'favorite_service');
        if (lastTech && lastService) {
          greeting += `\n\nI noticed your previous booking was for **${lastService.value}**. Would you like to schedule the same technician, **${lastTech.value}**?`;
        }
      }

      await prisma.conversationMessage.create({
        data: { conversationId, sender: 'assistant', text: greeting },
      });

      return {
        conversationId,
        assistantText: greeting,
        stage: 'GREETING',
        memoriesTriggered,
      };
    }

    // If description implies a cleaning service but has no image uploaded yet
    const impliesCleaning = descLower.includes('kitchen') || descLower.includes('bathroom') || descLower.includes('sofa') || descLower.includes('carpet') || descLower.includes('dirty') || descLower.includes('stain');
    if (impliesCleaning && !hasImage && !historyMessages.some(m => m.image)) {
      const askForImage = `I see you need cleaning services. Can you upload a photo of the area so my Vision Agent can check the dirt level and complexity?`;
      await prisma.conversationMessage.create({
        data: { conversationId, sender: 'assistant', text: askForImage },
      });

      return {
        conversationId,
        assistantText: askForImage,
        stage: 'NEED_IMAGE',
        memoriesTriggered,
      };
    }

    // STAGE: Running Multi-step reasoning pipeline
    const timelineLogs: { agentName: string; status: string; details: string }[] = [];

    // Log transitions
    const logStep = async (agentName: string, details: string) => {
      await prisma.agentExecutionLog.create({
        data: { agentName, status: 'COMPLETED', details },
      });
      timelineLogs.push({ agentName, status: '✓', details });
      try {
        const { default: SocketService } = await import('@/config/socket');
        SocketService.emitToRoom(`customer:${params.userId}`, 'agent.progress', {
          agentName,
          status: '✓',
          details
        });
      } catch (err) {
        // Safe logging fallback
      }
    };

    await logStep('Supervisor Agent', 'Understanding customer request details.');
    await logStep('Vision Agent', 'Analyzing cleaning area complexity bounds.');

    // 1. Run Vision Agent (Agent 1)
    const serviceName = params.serviceName || (impliesCleaning ? 'Deep Cleaning' : 'Electrical');
    const complexity = await AgentsService.analyzeJobComplexity(params.image || null, params.text, serviceName);

    await logStep('Pricing Agent', 'Calculating cost matrix and surcharges.');

    // 2. Run Pricing Engine
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    const pricing = await AgentsService.calculatePriceEstimate(complexity, isWeekend, 'Bengaluru');

    await logStep('Vendor Agent', 'Locating closest verified technicians.');

    // 3. Run Vendor Matching Agent
    // Default coordinates (Bengaluru Center)
    const matches = await AgentsService.matchBestVendors({
      serviceName: complexity.service,
      latitude: params.latitude || 12.9716,
      longitude: params.longitude || 77.5946,
      priceRange: { min: pricing.totalMin, max: pricing.totalMax },
    });

    await logStep('Booking Agent', 'Verifying calendar slot availability.');

    // Create assistant text response summary
    let assistantText = '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || '';

    if (geminiKey || groqKey) {
      const provider = ModelRegistry.getProvider();
      const explanationPrompt = `
        You are the CleanAI Supervisor Agent. Explain the reasoning for the job complexity assessment to the user.
        ${memoryContextString}
        ${historyContextString}
        User request: "${params.text}"
        Detected Service: "${complexity.service}"
        Detected Subcategory: "${complexity.subcategory}"
        Severity: "${complexity.severity}"
        Difficulty: "${complexity.difficulty}"
        Workers Suggested: ${complexity.workersRequired}
        Estimated Duration: "${complexity.estimatedDuration}"
        Objects/Issues Detected: ${JSON.stringify(complexity.objectsDetected)}
        Damage Level: "${complexity.damageLevel}"
        Recommended Tools: ${JSON.stringify(complexity.recommendedTools)}

        Write a concise, helpful explanation (2-3 sentences max) detailing why this service type and severity level was assessed, outlining any safety elements, debris levels, or specialized tools required, e.g., "I detected heavy grease on the stove grills and tile grout. This requires deep kitchen cleaning with specialized degreasing chemicals, and will take about 4 hours."
      `;
      try {
        assistantText = await provider.generateText(explanationPrompt);
      } catch (err) {
        assistantText = `I have analyzed your request for ${complexity.service}. The job is estimated as ${complexity.severity} severity, requiring ${complexity.workersRequired} technician(s) for approximately ${complexity.estimatedDuration}.`;
      }
    } else {
      // High-fidelity local simulation reasoning based on complexity results
      if (complexity.service === 'Kitchen Cleaning') {
        assistantText = `I have completed the analysis on your Kitchen! I detected oil deposits, kitchen chimney grease, and stove grill debris. This is a ${complexity.severity} severity request requiring degreasing chemicals, and is estimated to take ${complexity.estimatedDuration} with ${complexity.workersRequired} technician(s).`;
      } else if (complexity.service === 'Bathroom Cleaning') {
        assistantText = `I have completed the analysis on your Bathroom! I detected hardwater stains and limescale on the tiled walls and fixtures. This requires descaling solution and buffing pads, taking about ${complexity.estimatedDuration} with ${complexity.workersRequired} technician(s).`;
      } else if (complexity.service === 'Electrical') {
        assistantText = `I have completed the analysis on your electrical lines! I identified potential burnt wiring or a defective switch on your Power Distribution Board. Due to safety concerns, this is flagged as ${complexity.severity} severity and requires insulated tools and testing.`;
      } else if (complexity.service === 'Plumbing') {
        assistantText = `I have completed the plumbing analysis! I identified potential leakage or pipe corrosion in the drainage assembly. This will require a pipe wrench and sealant tape to repair.`;
      } else if (complexity.service === 'Sofa Cleaning') {
        assistantText = `I have completed the upholstery analysis! I identified pet hair and stain spots on the fabric upholstery. This requires fabric shampoo and an extraction vacuum.`;
      } else {
        assistantText = `I have completed the analysis! Based on the details, this job is classified under ${complexity.service} at ${complexity.severity} severity. It will take about ${complexity.estimatedDuration} with ${complexity.workersRequired} technician(s).`;
      }
    }

    await prisma.conversationMessage.create({
      data: {
        conversationId,
        sender: 'assistant',
        text: assistantText,
      },
    });

    return {
      conversationId,
      assistantText,
      stage: 'ANALYSIS_COMPLETE',
      timelineLogs,
      complexity,
      pricing,
      vendors: matches.slice(0, 2),
      memoriesTriggered,
    };
  }
}
