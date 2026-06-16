export interface EventMetadata {
  eventId: string;          // UUID v7/v4
  eventName: string;
  sourceModule: string;
  timestamp: number;        // Unix ms timestamp
  correlationId: string;    // Tracing ID
  causationId?: string;     // Parent event ID (optional)
  retryCount: number;
}

export interface EventPayload<T = unknown> {
  data: T;
  metadata: EventMetadata;
}

// ─── Auth/Identity Events ───────────────────────────
export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string;
  referralCode?: string;
  referredById?: string;
}

export interface AffiliateCommissionAwardedEvent {
  transactionId: string;
  userId: string;
  amount: number;
  description: string;
}

// ─── Billing Events ─────────────────────────────────
export interface PaymentCompletedEvent {
  transactionId: string;
  siteId: string;
  amount: number;
  couponId: string | null;
}

export interface SendEmailEvent {
  template: "welcome" | "withdrawalStatus" | "followup" | "trialExtended" | "subscriptionCancelled";
  payload: any;
}

// ─── Event Map ──────────────────────────────────────
export interface EventMap {
  'user.registered': UserRegisteredEvent;
  'affiliate.commission.awarded': AffiliateCommissionAwardedEvent;
  'billing.payment.completed': PaymentCompletedEvent;
  'notification.email.send': SendEmailEvent;
}
