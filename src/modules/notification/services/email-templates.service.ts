import { sendEmail } from "./email.service";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Send welcome email to newly registered users
 */
export async function sendWelcomeEmail(toEmail: string, userName: string, siteName: string) {
  const safeSiteName = escapeHtml(siteName);
  const subject = `Selamat Datang di ${safeSiteName}! 🎉`;
  const safeUserName = escapeHtml(userName);
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #0ea5e9; margin-bottom: 20px;">Selamat Datang, ${safeUserName}!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Terima kasih telah bergabung dengan <strong>${safeSiteName}</strong>. Akun Anda berhasil dibuat dan sekarang Anda sudah dapat mengelola situs bisnis Anda dengan lebih mudah.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="margin-top: 0; font-size: 16px;">Langkah Selanjutnya:</h3>
        <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
          <li>Lengkapi profil akun bisnis Anda.</li>
          <li>Mulai atur tema dan informasi dasar toko/situs Anda.</li>
          <li>Hubungkan custom domain agar situs terlihat lebih profesional.</li>
        </ul>
      </div>

      <p style="font-size: 16px;">Jika ada pertanyaan atau butuh bantuan, tim dukungan kami selalu siap membantu Anda dengan membalas email ini.</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} ${safeSiteName}. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Send billing/invoice success notification email
 */
export async function sendPaymentSuccessEmail({
  toEmail,
  userName,
  siteName,
  planName,
  amount,
  endDate,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  planName: string;
  amount: string;
  endDate: string;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const safePlanName = escapeHtml(planName);
  const safeAmount = escapeHtml(amount);
  const safeEndDate = escapeHtml(endDate);
  const subject = `Pembayaran Berhasil - Akun ${safePlanName.toUpperCase()} ${safeSiteName} 🎉`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #10b981; margin-bottom: 20px;">Pembayaran Berhasil!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Pembayaran Anda untuk langganan situs <strong>${safeSiteName}</strong> telah berhasil kami terima dan verifikasi.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Detail Transaksi</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 2;">
          <tr>
            <td style="color: #64748b; width: 40%;">Paket Langganan:</td>
            <td style="font-weight: bold;">${safePlanName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Jumlah Pembayaran:</td>
            <td style="font-weight: bold; color: #10b981;">${safeAmount}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Situs:</td>
            <td style="font-weight: bold;">${safeSiteName}</td>
          </tr>
          ${safeEndDate ? `
          <tr>
            <td style="color: #64748b;">Masa Aktif Hingga:</td>
            <td style="font-weight: bold;">${safeEndDate}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Fitur premium Anda telah diaktifkan secara otomatis. Terima kasih telah mempercayakan bisnis online Anda kepada kami!</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Send email to notify tenant of affiliate withdrawal request status (Approved / Rejected)
 */
export async function sendWithdrawalStatusEmail({
  toEmail,
  userName,
  amount,
  status,
  bankDetails,
}: {
  toEmail: string;
  userName: string;
  amount: string;
  status: "approved" | "rejected";
  bankDetails: string;
}) {
  const isApproved = status === "approved";
  const safeUserName = escapeHtml(userName);
  const safeAmount = escapeHtml(amount);
  const safeBankDetails = escapeHtml(bankDetails);
  const subject = isApproved
    ? "Penarikan Komisi Afiliasi Disetujui! 💸"
    : "Penarikan Komisi Afiliasi Ditolak ⚠️";

  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusLabel = isApproved ? "DISETUJUI & DITRANSFER" : "DITOLAK";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: ${statusColor}; margin-bottom: 20px;">Pemberitahuan Penarikan Dana</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">
        Kami ingin menginformasikan bahwa permintaan penarikan saldo komisi afiliasi Anda saat ini berstatus:
        <strong style="color: ${statusColor};">${statusLabel}</strong>.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0ea5e9; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Detail Penarikan</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 2;">
          <tr>
            <td style="color: #64748b; width: 40%;">Jumlah Penarikan:</td>
            <td style="font-weight: bold; color: ${statusColor};">${safeAmount}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Tujuan Transfer:</td>
            <td style="font-weight: bold;">${safeBankDetails}</td>
          </tr>
        </table>
      </div>

      ${isApproved 
        ? `<p style="font-size: 16px; line-height: 1.6;">Dana telah ditransfer ke rekening Anda. Silakan periksa mutasi rekening Anda secara berkala.</p>`
        : `<p style="font-size: 16px; line-height: 1.6;">Penarikan dana Anda ditolak. Saldo komisi telah dikembalikan secara otomatis ke balance afiliasi Anda. Jika ada pertanyaan, silakan hubungi tim support.</p>`
      }
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Send manual/automated follow-up email from administrator to tenant
 */
export async function sendFollowupEmail({
  toEmail,
  userName,
  subject,
  message,
}: {
  toEmail: string;
  userName: string;
  subject: string;
  message: string;
}) {
  const safeUserName = escapeHtml(userName);
  // Strip any existing HTML tags first, then escape remaining entities
  let formattedMessage = escapeHtml(message);

  // Convert raw URLs to clickable HTML links (if they start with http:// or https://)
  formattedMessage = formattedMessage.replace(/(https?:\/\/[^\s*_<]+)/g, '<a href="$1" style="color: #0ea5e9; text-decoration: underline;">$1</a>');

  // Convert WhatsApp markdown (*bold*, _italic_, ~strike~) to HTML
  formattedMessage = formattedMessage
    .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~([^~]+)~/g, "<del>$1</del>");

  // Convert newlines to HTML br tags for message styling
  formattedMessage = formattedMessage.replace(/\n/g, "<br />");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #0ea5e9; margin-bottom: 20px;">Pemberitahuan Penting</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; font-size: 15px; line-height: 1.6; color: #334155;">
        ${formattedMessage}
      </div>

      <p style="font-size: 15px; line-height: 1.6;">Jika Anda memiliki kendala atau ingin berkonsultasi lebih lanjut, silakan balas email ini atau kunjungi <a href="https://situsbisnis.com/contact" style="color: #0ea5e9; text-decoration: underline; font-weight: bold;">Halaman Kontak kami</a> untuk berkomunikasi langsung dengan kami.</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Notify tenant that their trial period has been extended
 */
export async function sendTrialExtendedEmail({
  toEmail,
  userName,
  siteName,
  days,
  newEndDate,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  days: number;
  newEndDate: string;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const safeNewEndDate = escapeHtml(newEndDate);
  const subject = `Masa Uji Coba (Trial) ${safeSiteName} Diperpanjang! 🎁`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #0ea5e9; margin-bottom: 20px;">Masa Uji Coba Diperpanjang!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Kabar gembira! Masa uji coba gratis (trial) untuk situs bisnis Anda <strong>${safeSiteName}</strong> telah kami perpanjang selama <strong>${days} hari</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Masa aktif uji coba baru Anda hingga:</p>
        <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #0ea5e9;">${safeNewEndDate}</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Gunakan waktu tambahan ini untuk memaksimalkan pengaturan situs bisnis Anda dan melengkapi konten penjualan Anda.</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Notify tenant that their custom domain verification succeeded
 */
export async function sendDomainVerifiedEmail({
  toEmail,
  userName,
  siteName,
  domain,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  domain: string;
}) {
  const safeDomain = escapeHtml(domain);
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const subject = `Custom Domain ${safeDomain} Telah Aktif! 🚀`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #10b981; margin-bottom: 20px;">Domain Custom Berhasil Aktif!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Pengaturan custom domain untuk situs <strong>${safeSiteName}</strong> Anda telah berhasil diverifikasi dan terhubung sepenuhnya ke jaringan kami.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Situs Anda kini dapat diakses secara profesional di:</p>
        <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">
          <a href="https://${safeDomain}" target="_blank" style="color: #0ea5e9; text-decoration: none;">https://${safeDomain}</a>
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Domain baru Anda sekarang siap digunakan untuk promosi bisnis online Anda!</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Notify tenant that their subscription has been cancelled/suspended
 */
export async function sendSubscriptionCancelledEmail({
  toEmail,
  userName,
  siteName,
  planName,
}: {
  toEmail: string;
  userName: string;
  siteName: string;
  planName: string;
}) {
  const safeSiteName = escapeHtml(siteName);
  const safeUserName = escapeHtml(userName);
  const safePlanName = escapeHtml(planName);
  const subject = `Pemberitahuan Penangguhan Langganan ${safeSiteName} ⚠️`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #ef4444; margin-bottom: 20px;">Layanan Langganan Ditangguhkan</h2>
      <p style="font-size: 16px; line-height: 1.6;">Halo <strong>${safeUserName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Kami menginformasikan bahwa langganan paket premium <strong>${safePlanName.toUpperCase()}</strong> untuk situs <strong>${safeSiteName}</strong> saat ini telah ditangguhkan atau dibatalkan.</p>
      
      <div style="background-color: #fce8e6; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; font-size: 15px; line-height: 1.6; color: #991b1b;">
        Akses Anda ke fitur premium untuk sementara dibatasi. Halaman situs Anda mungkin dialihkan atau tidak dapat diakses secara penuh oleh pelanggan Anda.
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Ayo aktifkan kembali langganan Anda segera agar situs bisnis Anda dapat kembali online dengan lancar. Anda dapat mengaktifkannya dari dashboard billing Anda.</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">© ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, html });
}
