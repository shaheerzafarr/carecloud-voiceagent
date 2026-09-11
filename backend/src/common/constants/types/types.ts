// SUBSCRIPTION TYPES
export type Customer = {
  name: string;
  email: string;
};

export type AttachPaymentMethod = {
  customerId: string;
  redirectUrl?: string;
};

export type DefaultPaymentMethod = {
  customerId: string;
  paymentMethodId: string;
};

export type Tax = {
  percentage: number;
  displayName: string;
};

// will be according to the project requirements
export type SubscriptionPlanMetaData = {
  description: string;
  title: string;
};
