/**
 * Stripe Webhook API Route
 * 
 * Receives and processes webhook events from Stripe.
 * Handles subscription changes, payment successes/failures,
 * and other billing-related events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeWebhookSecret, stripe } from '@/lib/stripe';
import { processStripeWebhook } from '@/server/services/billing/webhooks';
import type Stripe from 'stripe';

// ============================================================================
// Configuration
// ============================================================================

const WEBHOOK_SECRET = stripeWebhookSecret;
const DEBUG = process.env.NODE_ENV === 'development';

// ============================================================================
// POST Handler - Receive Webhook Events
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Get the raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (DEBUG) {
      console.log('[Stripe Webhook] Received request:', {
        timestamp: new Date().toISOString(),
        hasSignature: !!signature,
        bodyLength: payload.length,
      });
    }

    // Verify webhook signature
    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Construct and verify the event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Stripe Webhook] Signature verification failed: ${errorMessage}`);
      return NextResponse.json(
        { error: 'Invalid signature', message: errorMessage },
        { status: 401 }
      );
    }

    // Log received event
    console.log('[Stripe Webhook] Processing event:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Process the event
    const result = await processStripeWebhook(event);

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log('[Stripe Webhook] Processed successfully:', {
        eventId: result.eventId,
        message: result.message,
        duration: `${duration}ms`,
      });

      return NextResponse.json(
        {
          success: true,
          eventId: result.eventId,
          message: result.message,
          processedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      console.error('[Stripe Webhook] Processing failed:', {
        eventId: result.eventId,
        error: result.error,
        duration: `${duration}ms`,
      });

      // Return 200 to prevent Stripe retries for unhandled events
      // Return 500 for actual errors that should be retried
      const statusCode = result.message?.includes('Unhandled') ? 200 : 500;

      return NextResponse.json(
        {
          success: false,
          eventId: result.eventId,
          error: result.error,
          message: result.message,
          processedAt: new Date().toISOString(),
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[Stripe Webhook] Unexpected error:', {
      error: errorMessage,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - Health Check
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'Stripe Webhook Handler',
      timestamp: new Date().toISOString(),
      config: {
        webhookSecret: !!WEBHOOK_SECRET,
        debugMode: DEBUG,
      },
    },
    { status: 200 }
  );
}

// ============================================================================
// Event Replay Handler (for manual retries)
// ============================================================================

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { eventId, eventType, eventData } = body;

    if (!eventId || !eventType || !eventData) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, eventType, eventData' },
        { status: 400 }
      );
    }

    // Reconstruct the event object
    const event: Stripe.Event = {
      id: eventId,
      object: 'event',
      api_version: '2025-02-24.acacia',
      created: Date.now() / 1000,
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: eventType,
      data: {
        object: eventData,
      },
    };

    // Process the replayed event
    const result = await processStripeWebhook(event);

    return NextResponse.json(
      {
        success: result.success,
        eventId: result.eventId,
        message: result.message,
        error: result.error,
        processedAt: new Date().toISOString(),
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Replay failed', message: errorMessage },
      { status: 500 }
    );
  }
}
