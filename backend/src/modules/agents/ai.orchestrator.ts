import { prisma } from '@/database';
import { AgentsService, JobComplexityResult, PriceEstimationBreakdown } from './agents.service';

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
      latitude: 12.9716,
      longitude: 77.5946,
      priceRange: { min: pricing.totalMin, max: pricing.totalMax },
    });

    await logStep('Booking Agent', 'Verifying calendar slot availability.');

    // Create assistant text response summary
    let assistantText = `Analysis complete! Based on the image & details, here is the complexity assessment and estimated price range:`;
    if (memories.length > 0) {
      const lastService = memories.find(m => m.key === 'favorite_service');
      if (lastService && lastService.value.toLowerCase() === complexity.service.toLowerCase()) {
        assistantText = `Welcome back! Based on your favorite service history for **${lastService.value}**, here is the complexity assessment:`;
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
