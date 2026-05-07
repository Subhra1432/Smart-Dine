// ═══════════════════════════════════════════
// DineSmart OS — Subscription & Webhook Controller
// ═══════════════════════════════════════════

import type { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { stripe } from '../../lib/stripe.js';

/**
 * Handles Stripe Webhook events
 * IMPORTANT: This route requires the raw body for signature verification
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    if (!stripe) throw new Error('Stripe is not configured');
    
    // Construct the event using the raw body buffer and the signature
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error('❌ Webhook Signature Verification Failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const { restaurantId, plan } = session.metadata;

      if (!restaurantId || !plan) {
        logger.error('❌ Webhook Error: Missing metadata in session', { sessionId: session.id });
        break;
      }

      logger.info('💰 Payment Success Webhook Received', { restaurantId, plan, sessionId: session.id });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Extend by 30 days

      try {
        await prisma.$transaction([
          // 1. Update Restaurant Plan
          prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
              plan: plan as 'STARTER' | 'PREMIUM',
              planExpiresAt: expiresAt,
              isActive: true,
            },
          }),
          // 2. Log Payment Record
          prisma.subscriptionPayment.create({
            data: {
              restaurantId: restaurantId,
              plan: plan as 'STARTER' | 'PREMIUM',
              amount: session.amount_total / 100,
              method: 'CARD (STRIPE)',
              status: 'COMPLETED',
            },
          }),
        ]);
        logger.info('✅ Restaurant subscription upgraded via webhook', { restaurantId, plan });
      } catch (dbErr: any) {
        logger.error('❌ Database update failed during webhook', { error: dbErr.message, restaurantId });
        return res.status(500).send('Internal Server Error');
      }
      break;
    }

    default:
      logger.debug('ℹ️ Unhandled Webhook Event Type', { type: event.type });
  }

  res.json({ received: true });
}
