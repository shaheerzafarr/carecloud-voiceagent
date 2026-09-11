// EXCEPTION  INTERFACE
export interface IExceptionResponse {
  httpStatusCode: number;
  message: string[];
}

// SUBSCRIPTION TYPES

export interface ISubscriptionPlan {
  productId: string;
  priceId: string;
  couponIdId: string;
  taxId: string;
}

// PAGINATION INTERFACE
export interface IPagination {
  skip?: number;
  limit?: number;
}

// IMAGE OBJECT  INTERFACE
export interface ImageObject {
  name: string;
  length: number;
}

// EMAIL INTERFACES
export interface EmailPayload {
  name?: string;
  code?: string;
  rejectReason?: string;
  packageName?: string;
  lastDate?: string;
}

export interface EmailUser {
  email: string;
  firstName?: string;
  name?: string;
  userName?: string;
  rejectReason?: string;
}

export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: string[];
  headers?: Record<string, string>;
  replyTo?: string;
}

export interface AllowedKeys {
  name: string;
  maxCount: number;
}

export interface ILocation {
  type: string;
  coordinates: number[];
}
