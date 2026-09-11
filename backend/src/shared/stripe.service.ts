import { BadRequestException, Injectable } from '@nestjs/common';
import { Customer } from 'src/common/constants/types/types';
import * as moment from 'moment';
import { convertUSDtoCents } from 'src/common/helpers/helper';
import { ConfigService } from 'src/config/config.service';
import Stripe from 'stripe';
@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-02-25.clover',
    });
  }

  // ========================== CUSTOMERS METHOD ========================== //

  async createStripeCustomer(
    customerParams: Customer,
  ): Promise<[Error | null, Stripe.Customer | null]> {
    const { email, name } = customerParams;
    try {
      const customer = await this.stripe.customers.create({
        name,
        email,
      });
      return [null, customer];
    } catch (error) {
      return [error, null];
    }
  }

  // ========================== PAYMENT METHODS METHOD ========================== //

  async getPaymentMethods(
    customerId: string,
  ): Promise<[Error | null, any | null]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 100,
      });

      const defaultCard = await this.getDefaultCard(customerId);

      const methods = paymentMethods.data.map((method) => {
        return {
          ...method,
          ...(method.id == defaultCard && { default: true }),
        };
      });

      return [null, methods];
    } catch (error) {
      return [error, null];
    }
  }

  async getDefaultCard(customerId: string) {
    const customer = await this.stripe.customers.retrieve(customerId);

    const card = customer['invoice_settings']['default_payment_method'];

    return card;
  }

  async makeDefaultCard(customerId: string, pmId: string) {
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });
  }

  async _makeDefaultPaymentMethod(
    cus: string,
    paymentMethodId: string,
  ): Promise<[Error | null, string | null]> {
    try {
      await this.stripe.customers.update(cus, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      return [null, paymentMethodId];
    } catch (error) {
      return [error, null];
    }
  }

  async detachPaymentMethod(
    cus: string,
    paymentMethodId: string,
  ): Promise<[Error | null, Stripe.PaymentMethod | null]> {
    try {
      const customerMethods = await this.stripe.paymentMethods.list({
        customer: cus,
        type: 'card',
        limit: 100,
      });

      if (
        !customerMethods?.data?.find((method) => method.id === paymentMethodId)
      )
        return [new BadRequestException('Payment method not found!'), null];

      const defaultCard = await this.getDefaultCard(cus);
      if (defaultCard === paymentMethodId)
        return [
          new BadRequestException('Default payment method cannot be deleted!'),
          null,
        ];

      const paymentMethod =
        await this.stripe.paymentMethods.detach(paymentMethodId);
      return [null, paymentMethod];
    } catch (error) {
      return [error, null];
    }
  }

  // ========================== PAYMENT LINK METHOD ========================== //

  async createPaymentLink(params: {
    type: 'attach-card' | 'buy-domain' | 'buy-banner';
    mode?: 'subscription' | 'setup';
    cus?: string;
    domain?: string;
    bannerId?: string;
    metadata?: Record<string, string>;
    /** Copied onto the created subscription (for `invoice.paid` handling) */
    subscriptionMetadata?: Record<string, string>;
    priceId?: string;
  }): Promise<Stripe.Checkout.Session> {
    const {
      cus,
      type,
      metadata,
      subscriptionMetadata,
      priceId,
      mode,
      domain,
      bannerId,
    } = params;

    const encodedDomain = domain ? encodeURIComponent(domain) : '';
    const encodedBannerId = bannerId ? encodeURIComponent(bannerId) : '';
    const successUrls = {
      'attach-card': `${this.configService.get('WEB_HOSTED_URL')}profile-settings`,
      'buy-domain': `${this.configService.get('WEB_HOSTED_URL')}payment?success=true&type=domain&domain=${encodedDomain}`,
      'buy-banner': `${this.configService.get('WEB_HOSTED_URL')}payment?success=true&type=banner&domain=${encodedDomain}&bannerId=${bannerId}`,
    };

    const cancelUrls = {
      'attach-card': `${this.configService.get('WEB_HOSTED_URL')}profile-settings`,
      'buy-domain': `${this.configService.get('WEB_HOSTED_URL')}payment?success=false&type=domain&domain=${encodedDomain}`,
      'buy-banner': `${this.configService.get('WEB_HOSTED_URL')}payment?success=false&type=banner&domain=${encodedDomain}&bannerId=${bannerId}`,
    };

    const sessionMetadata: Record<string, string> = {
      ...(metadata ?? {}),
      type,
    };

    const form = await this.stripe.checkout.sessions.create({
      mode: mode || 'payment',
      success_url: successUrls[type],
      cancel_url: cancelUrls[type],
      payment_method_types: ['card'],
      currency: this.configService.get('STRIPE_CURRENCY'),
      ...(!!cus && { customer: cus }),
      ...(mode === 'subscription' && {
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: { ...sessionMetadata, ...(subscriptionMetadata ?? {}) },
        },
      }),

      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: sessionMetadata,
    });

    return form;
  }

  constructWebhookEvent(
    payload: Buffer | string,
    signature: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.configService.get('STRIPE_WEBHOOK_SECRET'),
    );
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async getSubscriptionInvoiceLink(
    subscriptionId: string,
  ): Promise<string | null> {
    const subscription = await this.retrieveSubscription(subscriptionId);
    const latestInvoice = subscription.latest_invoice;

    if (!latestInvoice) return null;

    const invoiceId =
      typeof latestInvoice === 'string' ? latestInvoice : latestInvoice.id;
    const invoice = await this.getLatestInvoice(invoiceId);

    return invoice.hosted_invoice_url ?? null;
  }

  /** Deactivate Stripe prices and product created for an abandoned buy-domain checkout */
  async archiveBuyDomainStripeResources(meta: {
    stripeProductId?: string;
    stripeMonthlyPriceId?: string;
    stripeYearlyPriceId?: string;
  }): Promise<void> {
    const archivePrice = async (id?: string) => {
      if (!id?.trim()) return;
      try {
        await this.stripe.prices.update(id, { active: false });
      } catch {
        /* price may already be inactive or removed */
      }
    };

    const archiveProduct = async (id?: string) => {
      if (!id?.trim()) return;
      try {
        await this.stripe.products.update(id, { active: false });
      } catch {
        /* product may already be inactive */
      }
    };

    await archivePrice(meta.stripeMonthlyPriceId);
    await archivePrice(meta.stripeYearlyPriceId);
    await archiveProduct(meta.stripeProductId);
  }

  // ========================== STRIPE PRODUCT METHOD ========================== //
  async createStripeProduct(params: { title: string }) {
    // Create a new product for the package
    const product = await this.stripe.products.create({
      name: params.title,
      type: 'service',
      active: true,
    });

    return product;
  }

  async createStripePrice(params: {
    productId: string;
    monthlyParams?: {
      amount: number;
      trialDays?: number;
      intervalCount?: number;
    };
    yearlyParams?: {
      amount: number;
      trialDays?: number;
      intervalCount?: number;
    };
    weeklyParams?: {
      amount: number;
      trialDays?: number;
      intervalCount?: number;
    };
  }) {
    let monthlyPrice: Stripe.Price | null = null;
    let yearlyPrice: Stripe.Price | null = null;
    let weeklyPrice: Stripe.Price | null = null;

    if (params.weeklyParams && Object.keys(params.weeklyParams).length > 0) {
      weeklyPrice = await this.stripe.prices.create({
        product: params.productId,
        currency: this.configService.get('STRIPE_CURRENCY'),
        unit_amount: convertUSDtoCents(params.weeklyParams.amount),
        recurring: {
          interval: 'week',
          interval_count: params.weeklyParams.intervalCount || 1,
          trial_period_days: params.weeklyParams.trialDays || 0,
        },
      });
    }

    if (params.monthlyParams && Object.keys(params.monthlyParams).length > 0) {
      monthlyPrice = await this.stripe.prices.create({
        product: params.productId,
        currency: this.configService.get('STRIPE_CURRENCY'),
        unit_amount: convertUSDtoCents(params.monthlyParams.amount),
        recurring: {
          interval: 'month',
          interval_count: params.monthlyParams.intervalCount || 1,
          trial_period_days: params.monthlyParams.trialDays || 0,
        },
      });
    }

    if (params.yearlyParams && Object.keys(params.yearlyParams).length > 0) {
      yearlyPrice = await this.stripe.prices.create({
        product: params.productId,
        currency: this.configService.get('STRIPE_CURRENCY'),
        unit_amount: convertUSDtoCents(params.yearlyParams.amount),
        recurring: {
          interval: 'year',
          interval_count: params.yearlyParams.intervalCount || 1,
          trial_period_days: params.yearlyParams.trialDays || 0,
        },
      });
    }

    return {
      monthlyPriceId: monthlyPrice?.id ?? null,
      yearlyPriceId: yearlyPrice?.id ?? null,
      weeklyPriceId: weeklyPrice?.id ?? null,
    };
  }
  async createStripeCompletePlan(params: {
    title: string;
    monthlyParams?: {
      amount: number;
      trialDays: number;
      intervalCount: number;
    };
    yearlyParams?: { amount: number; trialDays: number; intervalCount: number };
    weeklyParams?: { amount: number; trialDays: number; intervalCount: number };
  }): Promise<
    [
      Error | null,
      {
        packageId: string;
        monthlyPriceId: string;
        yearlyPriceId: string;
        weeklyPriceId: string;
      } | null,
    ]
  > {
    const { title, monthlyParams, yearlyParams, weeklyParams } = params;

    try {
      const prod = await this.createStripeProduct({ title: title });

      const price = await this.createStripePrice({
        productId: prod.id,
        monthlyParams,
        yearlyParams,
        weeklyParams,
      });

      return [
        null,
        {
          packageId: prod.id,
          monthlyPriceId: price?.monthlyPriceId as unknown as string,
          yearlyPriceId: price?.yearlyPriceId as unknown as string,
          weeklyPriceId: price?.weeklyPriceId as unknown as string,
        },
      ];
    } catch (error) {
      return [error, null];
    }
  }

  async getPriceByProductId(
    productId: string,
  ): Promise<[Error | null, Array<Stripe.Price> | null]> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
      });
      return [null, prices.data];
    } catch (error) {
      console.error('Error retrieving price:', error.message || error);
      return [error, null];
    }
  }

  // ========================== HELPER METHODS ========================== //

  async getPmIdFromSubscription(data: Stripe.Checkout.Session) {
    // For subscriptions, get payment method from subscription or invoice
    if (data.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(
        data.subscription as string,
      );
      // Get payment method from subscription's default payment method
      if (subscription.default_payment_method) {
        return subscription.default_payment_method as string;
      }
      // Fallback: get from latest invoice
      if (subscription.latest_invoice) {
        const invoice = await this.stripe.invoices.retrieve(
          subscription.latest_invoice as string,
        );
        const paymentIntentId = (invoice as any).payment_intent as
          | string
          | null;
        if (paymentIntentId) {
          const paymentIntent =
            await this.stripe.paymentIntents.retrieve(paymentIntentId);
          return (paymentIntent.payment_method as string) || null;
        }
      }
    }

    // Fallback: try to get from invoice if available
    if (data.invoice) {
      const invoice = await this.stripe.invoices.retrieve(
        data.invoice as string,
      );
      const paymentIntentId = (invoice as any).payment_intent as string | null;
      if (paymentIntentId) {
        const paymentIntent =
          await this.stripe.paymentIntents.retrieve(paymentIntentId);
        return (paymentIntent.payment_method as string) || null;
      }
    }

    return null;
  }

  async getPmIdFromSetupIntent(data: Stripe.Checkout.Session) {
    const setupIntent = await this.stripe.setupIntents.retrieve(
      data.setup_intent as string,
    );
    return setupIntent.payment_method as unknown as string;
  }

  async _makeDefaultCard(data: Stripe.Checkout.Session) {
    const customer = (data.customer as string) || data?.metadata?.customer;

    if (!customer) {
      console.warn('No customer found in checkout session');
      return;
    }

    const defaultCard = await this.getDefaultCard(customer);

    if (defaultCard) return;

    let pmId;
    switch (data.mode) {
      case 'subscription':
        pmId = (await this.getPmIdFromSubscription(data)) as unknown as string;
        break;
      case 'setup':
        pmId = (await this.getPmIdFromSetupIntent(data)) as unknown as string;
        break;
      default:
        return;
    }

    if (!pmId) return;

    await this.makeDefaultCard(customer, pmId);
  }

  // ========================== INVOICE METHOD ========================== //
  async getLatestInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    // get invoice
    const invoice = await this.stripe.invoices.retrieve(invoiceId);

    return invoice;
  }

  async getStripeInvoices(
    before: string,
    after: string,
    limit?: number,
    cus?: string,
  ) {
    const data = await this.stripe.invoices.list({
      status: 'paid',
      limit: limit || 10,
      ...(!!cus && { customer: cus }),
      ...(!!after && { starting_after: after }),
      ...(!!before && { ending_before: before }),
    });

    const invoices = data?.data.map((invoice) => {
      return {
        id: invoice.id,
        number: invoice.number,
        dueAmount: invoice.amount_due / 100,
        paidAmount: invoice.amount_paid / 100,
        collectionMethod: invoice.collection_method,
        pdfInvoice: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url,
        date: invoice.created,
        month: moment(invoice.created * 1000).format('MMMM'),
        // subscription: invoice.subscription,
        // planName: invoice?.lines?.data[0]?.plan?.nickname || 'N/A',
        status: invoice.status,
        customer: invoice.customer,
      };
    });

    return invoices;
  }

  // ========================== SUBSCRIPTION METHOD ========================== //

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: true,
        },
      );

      return [null, subscription];
    } catch (error) {
      return [error, null];
    }
  }

  async resumeSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: false,
        },
      );
      return [null, subscription];
    } catch (error) {
      return [error, null];
    }
  }

  async updateSubscription(
    subscriptionId: string,
    priceId: string,
    metadata?: Record<string, string>,
  ): Promise<[Error | null, Stripe.Subscription | null]> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription)
      return [new BadRequestException('No Active Subscription found'), null];

    if (subscription.status !== 'active')
      throw new BadRequestException(
        'Your previous subscription is not active. Please Complete it before upgrading.',
      );

    const price = await this.stripe.prices.retrieve(priceId);

    const updatedSub = await this.stripe.subscriptions.update(subscriptionId, {
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
      items: [{ id: subscription.items.data[0].id, price: price.id }],
      ...(metadata && {
        metadata: { ...subscription.metadata, ...metadata },
      }),
    });

    return [null, updatedSub];
  }
}
