import { sendEmail } from "./email.service";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&#x27;")
    .replace(/'/g, "&#x27;");
}

export async function sendTrialExpiringSoonEmail({
  toEmail,
  userName,
  siteName,
  daysLeft,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  daysLeft: number;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const subject = `Masa Uji Coba ${safeSiteName} Akan Berakhir dalam ${daysLeft} Hari`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #f59e0b; margin-bottom: 20px;">Masa Uji Coba Akan Berakhir</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Masa uji coba gratis situs <strong>${safeSiteName}</strong> akan berakhir dalam <strong>${daysLeft} hari</strong>.</p>
      <p style="font-size: 16px; line-height: 1.6;">Jangan lewatkan kesempatan untuk mempertahankan fitur premium Anda. Segera pilih paket langganan yang sesuai dengan kebutuhan bisnis Anda.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}

export async function sendTrialExpiredEmail({
  toEmail,
  userName,
  siteName,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const subject = `Masa Uji Coba ${safeSiteName} Telah Berakhir`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #ef4444; margin-bottom: 20px;">Masa Uji Coba Berakhir</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Masa uji coba gratis situs <strong>${safeSiteName}</strong> telah berakhir. Anda masih dapat mengakses situs dalam masa tenggang (grace period).</p>
      <p style="font-size: 16px; line-height: 1.6;">Segera lakukan upgrade untuk menikmati kembali fitur lengkap situs bisnis Anda.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}

export async function sendSubscriptionExpiringSoonEmail({
  toEmail,
  userName,
  siteName,
  planName,
  daysLeft,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  planName: string;
  daysLeft: number;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const safePlanName = escapeHtml(planName);
  const subject = `Langganan ${safePlanName} ${safeSiteName} Akan Berakhir dalam ${daysLeft} Hari`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #f59e0b; margin-bottom: 20px;">Langganan Akan Berakhir</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Langganan paket <strong>${safePlanName}</strong> untuk situs <strong>${safeSiteName}</strong> akan berakhir dalam <strong>${daysLeft} hari</strong>.</p>
      <p style="font-size: 16px; line-height: 1.6;">Perpanjang langganan Anda sekarang untuk menikmati layanan tanpa putus.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}

export async function sendGracePeriodEndingEmail({
  toEmail,
  userName,
  siteName,
  daysLeft,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  daysLeft: number;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const subject = `Masa Tenggang ${safeSiteName} Akan Berakhir dalam ${daysLeft} Hari`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #ef4444; margin-bottom: 20px;">Masa Tenggang Akan Berakhir</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Masa tenggang (grace period) untuk situs <strong>${safeSiteName}</strong> akan berakhir dalam <strong>${daysLeft} hari</strong>.</p>
      <p style="font-size: 16px; line-height: 1.6;">Setelah masa tenggang berakhir, situs Anda tidak akan dapat diakses. Segera perpanjang langganan untuk mengaktifkan kembali situs Anda.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}
