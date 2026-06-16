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
