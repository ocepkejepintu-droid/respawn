/**
 * Apify Webhook Handler API Route
 * Receives webhook events from Apify for actor run completions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processWebhookEvent,
  validateWebhookSignature,
  validateRequestOrigin,
  validatePayload,
} from '@/server/services/apify/webhook-handler';
import type { WebhookPayload } from '@/types/apify';
import { handleRunCompletion } from '@/server/services/apify/executor';

// ============================================================================
// Configuration
// ============================================================================

// Webhook secret for signature validation
const WEBHOOK_SECRET = process.env.APIFY_WEBHOOK_SECRET;

// Enable/disable verbose logging
const DEBUG = process.env.NODE_ENV === 'development';

// ============================================================================
// POST Handler - Receive Webhook Events
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Get request details
    const body = await request.text();
    const signature = request.headers.get('x-apify-signature');
    const contentType = request.headers.get('content-type');
    const requestIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (DEBUG) {
      console.log('[Apify Webhook] Received request:', {
        timestamp: new Date().toISOString(),
        contentType,
        hasSignature: !!signature,
        bodyLength: body.length,
      });
    }

    // Validate content type
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json' },
        { status: 400 }
      );
    }

    // Validate signature if secret is configured
    if (WEBHOOK_SECRET && signature) {
      const isValid = validateWebhookSignature(body, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[Apify Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Validate request origin (optional)
    const originCheck = await validateRequestOrigin(requestIp || undefined);
    if (!originCheck.valid && process.env.NODE_ENV === 'production') {
      console.warn('[Apify Webhook] Request from unexpected IP:', requestIp);
      // Don't fail in production, just log warning
      // In strict mode, uncomment: return NextResponse.json({ error: originCheck.reason }, { status: 403 });
    }

    // Parse payload
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('[Apify Webhook] Failed to parse JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!validatePayload(payload)) {
      console.error('[Apify Webhook] Invalid payload structure');
      return NextResponse.json(
        { error: 'Invalid webhook payload structure' },
        { status: 400 }
      );
    }

    const webhookPayload = payload as WebhookPayload;

    // Log received event
    console.log('[Apify Webhook] Processing event:', {
      eventId: webhookPayload.eventId,
      eventType: webhookPayload.eventType,
      runId: webhookPayload.data.eventData.actorRunId,
      actorId: webhookPayload.data.eventData.actorId,
    });

    // Process the webhook event
    const result = await processWebhookEvent(webhookPayload, {
      secret: WEBHOOK_SECRET || undefined,
    });

    // Return response
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log('[Apify Webhook] Processed successfully:', {
        eventId: result.eventId,
        runId: result.runId,
        duration: `${duration}ms`,
      });

      return NextResponse.json(
        {
          success: true,
          eventId: result.eventId,
          runId: result.runId,
          status: result.status,
          processedAt: result.processedAt,
        },
        { status: 200 }
      );
    } else {
      console.error('[Apify Webhook] Processing failed:', {
        eventId: result.eventId,
        error: result.error,
        duration: `${duration}ms`,
      });

      // Return 200 even on processing failure to prevent Apify retries
      // The error is logged and can be retried manually or via scheduled job
      return NextResponse.json(
        {
          success: false,
          eventId: result.eventId,
          error: result.error,
          processedAt: result.processedAt,
        },
        { status: 200 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('[Apify Webhook] Unexpected error:', {
      error: errorMessage,
      duration: `${duration}ms`,
    });

    // Return 500 for unexpected errors
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - Health Check / Status
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'Apify Webhook Handler',
      timestamp: new Date().toISOString(),
      config: {
        signatureValidation: !!WEBHOOK_SECRET,
        debugMode: DEBUG,
      },
    },
    { status: 200 }
  );
}

// ============================================================================
// Direct Run Completion Handler
// ============================================================================

/**
 * Alternative endpoint for testing or direct run status updates
 * POST /api/webhooks/apify/direct
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { runId, status } = body;

    if (!runId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle run completion directly
    await handleRunCompletion(runId, status as 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED');

    return NextResponse.json(
      { success: true, runId, status, processedAt: new Date().toISOString() },
      { status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Processing failed', message: errorMessage },
      { status: 500 }
    );
  }
}
