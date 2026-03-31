/**
 * Stripe Service - Core billing operations
 * 
 * Handles Stripe customer management, subscriptions, payment methods,
 * and billing portal sessions.
 */

import { stripe } from '@/lib/stripe';
import type { BillingInterval } from '@/lib/stripe';
import type Stripe from 'stripe';

// ============================================================================
// Customer Management
// ============================================================================

export async function createStripeCustomer(params: {
  email: string;
  name?: string;
  workspaceId: string;
  userId: string;
}): Promise<Stripe.Customer> {
  const { email, name, workspaceId, userId } = params;

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      workspaceId,
      userId,
    },
  });

  return customer;
}

export async function updateStripeCustomer(
  customerId: string,
  params: {
    email?: string;
    name?: string;
    description?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.update(customerId, {
    email: params.email,
    name: params.name,
    description: params.description,
    metadata: params.metadata,
  });

  return customer;
}

export async function deleteStripeCustomer(customerId: string): Promise<void> {
  await stripe.customers.del(customerId);
}

export async function retrieveStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('[Stripe] Failed to retrieve customer:', error);
    return null;
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
  coupon?: string;
}

export async function createStripeSubscription(
  params: CreateSubscriptionParams
): Promise<Stripe.Subscription> {
  const { customerId, priceId, trialDays, metadata, coupon } = params;

  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata,
  };

  // Add trial period if specified
  if (trialDays && trialDays > 0) {
    subscriptionData.trial_period_days = trialDays;
  }

  // Apply coupon if provided
  if (coupon) {
    subscriptionData.coupon = coupon;
  }

  const subscription = await stripe.subscriptions.create(subscriptionData);

  return subscription;
}

export async function updateStripeSubscription(
  subscriptionId: string,
  params: {
    priceId?: string;
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
    cancelAtPeriodEnd?: boolean;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Subscription> {
  const updateData: Stripe.SubscriptionUpdateParams = {
    proration_behavior: params.prorationBehavior || 'create_prorations',
    cancel_at_period_end: params.cancelAtPeriodEnd,
    metadata: params.metadata,
  };

  // If changing price, update the subscription item
  if (params.priceId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;

    if (itemId) {
      updateData.items = [
        {
          id: itemId,
          price: params.priceId,
        },
      ];
    }
  }

  const updated = await stripe.subscriptions.update(subscriptionId, updateData);
  return updated;
}

export async function cancelStripeSubscription(
  subscriptionId: string,
  params?: {
    cancelImmediately?: boolean;
    invoiceNow?: boolean;
  }
): Promise<Stripe.Subscription> {
  if (params?.cancelImmediately) {
    // Cancel immediately and optionally create a final invoice
    const subscription = await stripe.subscriptions.cancel(subscriptionId, {
      invoice_now: params.invoiceNow,
      prorate: params.invoiceNow,
    });
    return subscription;
  }

  // Cancel at period end
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  return subscription;
}

export async function retrieveStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'default_payment_method'],
    });
    return subscription;
  } catch (error) {
    console.error('[Stripe] Failed to retrieve subscription:', error);
    return null;
  }
}

// ============================================================================
// Payment Methods
// ============================================================================

export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  return paymentMethod;
}

export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
  return paymentMethod;
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return customer;
}

export async function listPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const { data } = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return data;
}

// ============================================================================
// Invoices
// ============================================================================

export async function listInvoices(
  customerId: string,
  params?: {
    limit?: number;
    startingAfter?: string;
  }
): Promise<Stripe.Invoice[]> {
  const { data } = await stripe.invoices.list({
    customer: customerId,
    limit: params?.limit || 12,
    starting_after: params?.startingAfter,
  });

  return data;
}

export async function retrieveInvoice(
  invoiceId: string
): Promise<Stripe.Invoice | null> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice;
  } catch (error) {
    console.error('[Stripe] Failed to retrieve invoice:', error);
    return null;
  }
}

export async function getUpcomingInvoice(
  customerId: string,
  subscriptionId?: string
): Promise<Stripe.UpcomingInvoice | null> {
  try {
    const params: Stripe.InvoiceRetrieveUpcomingParams = {
      customer: customerId,
    };

    if (subscriptionId) {
      params.subscription = subscriptionId;
    }

    const invoice = await stripe.invoices.retrieveUpcoming(params);
    return invoice;
  } catch (error) {
    console.error('[Stripe] Failed to retrieve upcoming invoice:', error);
    return null;
  }
}

// ============================================================================
// Billing Portal
// ============================================================================

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export async function createBillingPortalConfiguration(
  params: {
    businessProfile: {
      headline?: string;
      privacyPolicyUrl: string;
      termsOfServiceUrl: string;
    };
    features?: Stripe.BillingPortal.ConfigurationCreateParams.Features;
  }
): Promise<Stripe.BillingPortal.Configuration> {
  const config = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: params.businessProfile.headline,
      privacy_policy_url: params.businessProfile.privacyPolicyUrl,
      terms_of_service_url: params.businessProfile.termsOfServiceUrl,
    },
    features: params.features,
  });

  return config;
}

// ============================================================================
// Checkout Sessions
// ============================================================================

export interface CreateCheckoutSessionParams {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
  clientReferenceId?: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    customer_email: !params.customerId ? params.customerEmail : undefined,
    mode: 'subscription',
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: params.trialDays
      ? {
          trial_period_days: params.trialDays,
          metadata: params.metadata,
        }
      : { metadata: params.metadata },
    metadata: params.metadata,
    client_reference_id: params.clientReferenceId,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  return session;
}

// ============================================================================
// Webhook Event Handling
// ============================================================================

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export function isValidWebhookEvent(event: Stripe.Event): boolean {
  const validEvents = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'invoice.created',
    'invoice.finalized',
    'customer.created',
    'customer.updated',
    'customer.deleted',
    'payment_method.attached',
    'payment_method.detached',
  ];

  return validEvents.includes(event.type);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getSubscriptionStatusColor(
  status: Stripe.Subscription.Status
): string {
  const colors: Record<string, string> = {
    active: 'green',
    canceled: 'red',
    incomplete: 'yellow',
    incomplete_expired: 'red',
    past_due: 'orange',
    paused: 'gray',
    trialing: 'blue',
    unpaid: 'red',
  };

  return colors[status] || 'gray';
}

export function formatSubscriptionInterval(interval: string): string {
  const labels: Record<string, string> = {
    month: 'Monthly',
    year: 'Yearly',
    week: 'Weekly',
    day: 'Daily',
  };

  return labels[interval] || interval;
}
