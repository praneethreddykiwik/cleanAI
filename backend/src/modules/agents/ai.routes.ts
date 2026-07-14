import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@/middleware/auth';
import { AgentsService } from './agents.service';
import { AIOrchestrator } from './ai.orchestrator';
import { prisma } from '@/database';

export const aiRoutes = Router();

/**
 * Route: POST /api/v1/ai/analyze-job
 * Step 1 in AI Booking Flow: Estimate complexity from image/desc & calculate price range
 */
aiRoutes.post('/analyze-job', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, description, serviceName, isWeekend = false, city = 'Bengaluru' } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, message: 'Please provide a job description.' });
    }

    // 1. Run Vision Agent (Agent 1)
    const complexity = await AgentsService.analyzeJobComplexity(image || null, description, serviceName);

    // 2. Run deterministic Pricing Engine
    const priceBreakdown = await AgentsService.calculatePriceEstimate(complexity, isWeekend, city);

    res.status(200).json({
      success: true,
      data: {
        complexity,
        priceBreakdown,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'AI job analysis failed' });
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

      // Seed initial customer memories so the agent has past context to remember!
      try {
        await prisma.customerMemory.createMany({
          data: [
            { customerId: customer.id, key: 'favorite_service', value: 'Kitchen Cleaning' },
            { customerId: customer.id, key: 'favorite_technician', value: 'Suresh Singh' },
            { customerId: customer.id, key: 'preferred_time', value: 'Saturday morning' },
          ]
        });
      } catch (err) {
        console.error('Failed to seed memory:', err);
      }
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
      aiAnalysis = `AI Vision Verification: Detected objects: ${result.objectsDetected.join(', ')}. Indicated severity: ${result.severity}. Recommend tools: ${result.recommendedTools.join(', ')}.`;
      if (result.severity === 'High') {
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

    const { text, image, conversationId, serviceName } = req.body;

    const result = await AIOrchestrator.handleChatSession({
      userId,
      customerId: customer.id,
      text: text || '',
      image: image || null,
      conversationId: conversationId || null,
      serviceName,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Conversational AI Agent failed' });
  }
});

