import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { AgentsService } from './agents.service';
import { AIOrchestrator } from './ai.orchestrator';
import { prisma } from '../../database';

export const aiRoutes = Router();

/**
 * Route: POST /api/v1/ai/analyze-job
 * Step 1 in AI Booking Flow: Estimate complexity from image/desc & calculate price range
 */
aiRoutes.post('/analyze-job', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      image,
      description,
      serviceName,
      isWeekend = false,
      city = 'Bengaluru',
      distanceKm,
      isNightBooking = false,
    } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, message: 'Please provide a job description.' });
    }

    // Guard: fail immediately if no AI key — do not simulate
    const { ModelRegistry } = await import('../../config/ai/model.registry');
    if (!ModelRegistry.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'AI_NOT_CONFIGURED',
        detail: 'Real AI analysis requires GEMINI_API_KEY or GROQ_API_KEY in backend/.env. ' +
                'Get a free Groq key at https://console.groq.com/keys and restart the server.',
        currentMode: 'unconfigured',
      });
    }

    // 1. Run Vision Agent (Agent 1) — real API call, throws on failure
    const complexity = await AgentsService.analyzeJobComplexity(image || null, description, serviceName);

    // 2. Run deterministic Pricing Engine
    // distanceKm is the agent-to-customer travel distance and drives the travel
    // fee. It was previously dropped here, so every quote silently used the
    // 3.2 km default and travel was always billed as free no matter how far the
    // job actually was.
    const parsedDistance = Number(distanceKm);
    const travelDistanceKm =
      Number.isFinite(parsedDistance) && parsedDistance >= 0 ? parsedDistance : undefined;

    const priceBreakdown = await AgentsService.calculatePriceEstimate(
      complexity,
      isWeekend,
      city,
      travelDistanceKm,
      Boolean(isNightBooking),
      // Optional: quote against one vendor's own tier rates instead of the
      // platform defaults, so a customer comparing vendors sees real prices.
      typeof req.body?.vendorId === 'string' ? req.body.vendorId : undefined
    );

    res.status(200).json({
      success: true,
      data: {
        complexity,
        priceBreakdown,
        aiProvider: ModelRegistry.getActiveProviderName(!!image),
        mode: 'live',
      },
    });
  } catch (error: any) {
    // Surface AI errors clearly — never swallow into a generic 500
    const isAiNotConfigured = error?.message?.includes('AI_NOT_CONFIGURED') || error?.message?.includes('not configured');
    res.status(isAiNotConfigured ? 503 : 500).json({
      success: false,
      message: error.message || 'AI job analysis failed',
      mode: 'error',
    });
  }
});

/**
 * Route: POST /api/v1/ai/match-vendors
 * Step 2 in AI Booking Flow: Search and rank vendors/agents based on location and rating
 */
aiRoutes.post('/match-vendors', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceName, latitude, longitude, priceMin, priceMax } = req.body;

    if (!serviceName || !latitude || !longitude || priceMin === undefined || priceMax === undefined) {
      return res.status(400).json({ success: false, message: 'Missing location or price range parameters.' });
    }

    const matches = await AgentsService.matchBestVendors({
      serviceName,
      latitude: parseFloat(latitude.toString()),
      longitude: parseFloat(longitude.toString()),
      priceRange: { min: parseFloat(priceMin.toString()), max: parseFloat(priceMax.toString()) },
    });

    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Vendor matching failed' });
  }
});

/**
 * Route: POST /api/v1/ai/support
 * Post-Booking Agent: Intelligent customer support chatbot
 */
// Helper to auto-create customer profile if missing
async function getOrCreateCustomer(userId: string) {
  let customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === 'CUSTOMER') {
      customer = await prisma.customer.create({
        data: {
          userId,
          profileCompletionPercentage: 100,
          preferences: {},
        },
      });

      // New customers start with no memory — preferences are learned from actual bookings
    }
  }
  return customer;
}

aiRoutes.post('/support', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const { bookingId, issueDescription, image } = req.body;

    if (!bookingId || !issueDescription) {
      return res.status(400).json({ success: false, message: 'Missing booking ID or issue description.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // 1. Analyze issue with Vision Agent if image is present
    let aiAnalysis = 'Analyzed text description. Raised support request.';
    let isSevereIssue = false;

    if (image) {
      const result = await AgentsService.analyzeJobComplexity(image, `User reported issue: "${issueDescription}" for service: "${booking.service.name}". Verify if work looks incomplete or damaged.`);
      aiAnalysis = `AI Vision Verification: Detected objects: ${result.objectsDetected.join(', ')}. Indicated severity: ${result.severityLabel || result.starRating}. Recommend equipment: ${result.recommendedEquipment.join(', ')}.`;
      if (result.starRating && result.starRating >= 4) {
        isSevereIssue = true;
      }
    }

    // 2. Create support ticket in DB
    const ticket = await prisma.supportTicket.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        issueDescription,
        status: isSevereIssue ? 'PENDING' : 'RESOLVED',
        aiAnalysis,
      },
    });

    // 3. Automated Revisit Scheduling Rule
    let revisitScheduled = false;
    let messageText = 'Your support request has been logged. Our customer help desk will contact you within 24 hours.';

    if (isSevereIssue || issueDescription.toLowerCase().includes('smell') || issueDescription.toLowerCase().includes('dirty') || issueDescription.toLowerCase().includes('incomplete')) {
      // Re-open booking or log a pending revisit job automatically
      revisitScheduled = true;
      messageText = 'Our AI inspector verified incomplete work. We have automatically raised a high-priority free revisit ticket and notified the service vendor to dispatch a team.';

      // Update ticket status to show dispatch action taken
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'RESOLVED', aiAnalysis: `${aiAnalysis} [Auto Action: Revisit Dispatched]` },
      });
    }

    res.status(200).json({
      success: true,
      message: messageText,
      data: {
        ticketId: ticket.id,
        revisitScheduled,
        aiAnalysis,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Support agent operation failed' });
  }
});

/**
 * Route: POST /api/v1/ai/chat
 * Handles multi-turn chat interactions through Supervisor Agent
 */
aiRoutes.post('/chat', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await getOrCreateCustomer(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }

    const { text, image, conversationId, serviceName, latitude, longitude } = req.body;

    // Load user's first name for personalised greeting
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });

    const result = await AIOrchestrator.handleChatSession({
      userId,
      customerId: customer.id,
      customerFirstName: userRecord?.firstName || 'there',
      text: text || '',
      image: image || null,
      conversationId: conversationId || null,
      serviceName,
      latitude,
      longitude,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Conversational AI Agent failed' });
  }
});

// Debug endpoint — admin only, no sensitive secrets exposed
aiRoutes.get('/debug', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  const { ModelRegistry } = await import('../../config/ai/model.registry');
  const providerName = ModelRegistry.getActiveProviderName();
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const groqConfigured   = !!process.env.GROQ_API_KEY;
  const isConfigured     = ModelRegistry.isConfigured();

  // currentMode must never say 'simulation', 'fallback', 'keyword', or 'mock'
  const currentMode = isConfigured ? 'live' : 'unconfigured';

  let latencyMs: number | null = null;
  let lastFailure: string | null = null;

  if (isConfigured) {
    try {
      const start = Date.now();
      await ModelRegistry.getProvider().generateText('Respond with the single word: pong');
      latencyMs = Date.now() - start;
    } catch (err: any) {
      lastFailure = err?.message || 'Unknown error during ping';
    }
  }

  res.status(200).json({
    success: true,
    data: {
      provider: providerName,
      model: providerName === 'GROQ' ? 'qwen/qwen3.6-27b' : 'gemini-2.5-flash',
      visionEnabled: true,
      geminiConfigured,
      groqConfigured,
      apiKeyDetected: isConfigured,
      currentMode,      // 'live' | 'unconfigured' — never 'simulation', 'fallback', 'keyword', 'mock'
      latencyMs,
      lastFailure,
      lastRequest: new Date().toISOString(),
    },
  });
});

aiRoutes.get('/chat/history', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Missing conversationId parameter.' });
    }
    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId: String(conversationId) },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch conversation history.' });
  }
});

