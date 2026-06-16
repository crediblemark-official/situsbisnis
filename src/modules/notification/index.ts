export { sendEmail } from "./services/email.service";
export type { SendEmailPayload } from "./services/email.service";
export {
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendWithdrawalStatusEmail,
  sendFollowupEmail,
  sendTrialExtendedEmail,
  sendDomainVerifiedEmail,
  sendSubscriptionCancelledEmail
} from "./services/email-templates.service";
export { followupWhatsApp, followupEmail } from "./services/followup.service";
