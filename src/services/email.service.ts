import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_HOST_USER,
    pass: env.EMAIL_HOST_PASSWORD,
  },
});

function escapeHtml(str: string | number): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface BookingEmailData {
  referenceCode: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  numNights: number;
  nightlyRate: string;
  touristTaxTotal: string;
  totalPrice: string;
  depositAmount: string;
  depositPercentage: string;
}

interface AdminBookingRequestData extends BookingEmailData {
  guestPhone: string;
  guestMessage?: string | null;
}

const COLORS = {
  primary: "#b8682c",
  primaryDark: "#8a4d20",
  text: "#2b2118",
  textMuted: "#7a6f66",
  border: "#ece5dd",
  bgPage: "#f7f2ec",
  bgCard: "#ffffff",
  bgAccent: "#fbf6f1",
};

function layout(opts: { preheader: string; title: string; intro: string; body: string; closing?: string }): string {
  const closing = opts.closing ?? "We look forward to welcoming you.";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.bgPage}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color:${COLORS.text};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgPage}; padding:20px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:${COLORS.bgCard}; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td bgcolor="${COLORS.primary}" style="background-color:${COLORS.primary}; padding:24px 24px; text-align:center;">
              <div style="font-size:11px; letter-spacing:3px; color:#ffffff; text-transform:uppercase; margin-bottom:6px; opacity:0.9;">Sunset Villa</div>
              <div style="font-size:22px; color:#ffffff; font-weight:300; letter-spacing:0.5px;">${escapeHtml(opts.title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 4px; font-size:15px; line-height:1.6; color:${COLORS.text};">
              ${opts.intro}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              ${opts.body}
              <p style="margin:20px 0 0; font-size:15px; line-height:1.6; color:${COLORS.text};">${escapeHtml(closing)}</p>
              <p style="margin:18px 0 0; font-size:15px; line-height:1.6; color:${COLORS.text};">
                Warm regards,<br/>
                <span style="color:${COLORS.primary}; font-weight:500;">The Sunset Villa Team</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:${COLORS.bgAccent}; padding:16px 24px; text-align:center; border-top:1px solid ${COLORS.border};">
              <div style="font-size:12px; color:${COLORS.textMuted}; line-height:1.5;">
                This is an automated message from Sunset Villa.<br/>
                Please keep this email for your records.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function summaryTable(data: BookingEmailData, opts: { highlightDeposit?: boolean } = {}): string {
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 0; font-size:14px; color:${COLORS.textMuted};">${label}</td>
      <td style="padding:10px 0; font-size:14px; color:${COLORS.text}; text-align:right;">${value}</td>
    </tr>`;

  return `
    <div style="background:${COLORS.bgAccent}; border:1px solid ${COLORS.border}; border-radius:8px; padding:4px 16px; margin:8px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td colspan="2" style="padding:12px 0 8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.primary}; font-weight:600; border-bottom:1px solid ${COLORS.border};">Booking Summary</td>
        </tr>
        ${row("Reference", `<span style="font-family: 'SF Mono', Consolas, monospace; font-weight:600;">${escapeHtml(data.referenceCode)}</span>`)}
        ${row("Check-in", escapeHtml(data.checkIn))}
        ${row("Check-out", escapeHtml(data.checkOut))}
        ${row("Guests", String(data.numGuests))}
        ${row("Nights", String(data.numNights))}
        ${row("Nightly rate", `&euro;${escapeHtml(data.nightlyRate)}`)}
        ${row("Tourist tax", `&euro;${escapeHtml(data.touristTaxTotal)}`)}
        <tr>
          <td style="padding:12px 0; border-top:1px solid ${COLORS.border}; font-size:15px; color:${COLORS.text}; font-weight:600;">Total</td>
          <td style="padding:12px 0; border-top:1px solid ${COLORS.border}; font-size:15px; color:${COLORS.text}; font-weight:600; text-align:right;">&euro;${escapeHtml(data.totalPrice)}</td>
        </tr>
        <tr>
          <td style="padding:0 0 12px; font-size:13px; color:${opts.highlightDeposit ? COLORS.primary : COLORS.textMuted}; ${opts.highlightDeposit ? "font-weight:600;" : ""}">Deposit due (${escapeHtml(data.depositPercentage)}%)</td>
          <td style="padding:0 0 12px; font-size:13px; color:${opts.highlightDeposit ? COLORS.primary : COLORS.textMuted}; ${opts.highlightDeposit ? "font-weight:600;" : ""} text-align:right;">&euro;${escapeHtml(data.depositAmount)}</td>
        </tr>
      </table>
    </div>`;
}

function paymentBlock(data: BookingEmailData): string {
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:8px 0; font-size:13px; color:${COLORS.textMuted}; vertical-align:top; width:42%;">${label}</td>
      <td style="padding:8px 0; font-size:13px; color:${COLORS.text}; font-family:'SF Mono', Consolas, monospace; word-break:break-all;">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px; border:1px solid ${COLORS.primary}; border-radius:8px; border-collapse:separate;">
      <tr>
        <td bgcolor="${COLORS.primary}" style="background-color:${COLORS.primary}; padding:14px 16px; border-top-left-radius:8px; border-top-right-radius:8px;">
          <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#ffffff; margin-bottom:4px; opacity:0.9;">Deposit Required</div>
          <div style="font-size:22px; color:#ffffff; font-weight:600; line-height:1.2;">&euro;${escapeHtml(data.depositAmount)} <span style="font-size:13px; font-weight:400; opacity:0.9;">(${escapeHtml(data.depositPercentage)}% of total)</span></div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px; background-color:${COLORS.bgCard}; border-bottom-left-radius:8px; border-bottom-right-radius:8px;">
          <p style="margin:0 0 10px; font-size:14px; color:${COLORS.text}; line-height:1.5;">
            Please transfer the deposit to secure your reservation using the bank details below.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${row("IBAN", "LT34 3250 0382 2819 6291")}
            ${row("BIC / SWIFT", "REVOLT21")}
            ${row("Receiver", "Mikael Nalbandian")}
            ${row("Purpose", "Payment for Sunset")}
            ${row("Reference", `<span style="font-weight:600;">${escapeHtml(data.referenceCode)}</span>`)}
          </table>
          <p style="margin:10px 0 0; padding-top:10px; border-top:1px solid ${COLORS.border}; font-size:12px; color:${COLORS.textMuted}; line-height:1.5;">
            Please include your booking reference <strong style="color:${COLORS.text};">${escapeHtml(data.referenceCode)}</strong> in the payment description so we can match it to your reservation.
          </p>
        </td>
      </tr>
    </table>`;
}

export async function sendBookingReceived(data: BookingEmailData) {
  const intro = `
    <p style="margin:0 0 12px;">Dear ${escapeHtml(data.guestName)},</p>
    <p style="margin:0;">Thank you for your booking request. We have received the details below and will review them shortly. You will receive a confirmation email with payment instructions once your stay is approved.</p>
  `;
  const html = layout({
    preheader: `Your booking request ${data.referenceCode} has been received.`,
    title: "Booking Request Received",
    intro,
    body: summaryTable(data),
    closing: "Thank you for choosing Sunset Villa.",
  });

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Request Received — ${data.referenceCode}`,
    html,
  });
}

export async function sendAdminBookingRequest(data: AdminBookingRequestData) {
  const adminEmail = env.ADMIN_EMAIL || env.DEFAULT_FROM_EMAIL;
  const adminUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/admin`;

  const intro = `
    <p style="margin:0;">A new booking request has been submitted and is awaiting your review.</p>
  `;

  const guestRow = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 0; font-size:14px; color:${COLORS.textMuted};">${label}</td>
      <td style="padding:10px 0; font-size:14px; color:${COLORS.text}; text-align:right;">${value}</td>
    </tr>`;

  const guestDetails = `
    <div style="background:${COLORS.bgAccent}; border:1px solid ${COLORS.border}; border-radius:8px; padding:4px 16px; margin:0 0 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td colspan="2" style="padding:12px 0 8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.primary}; font-weight:600; border-bottom:1px solid ${COLORS.border};">Guest Details</td>
        </tr>
        ${guestRow("Name", escapeHtml(data.guestName))}
        ${guestRow("Email", escapeHtml(data.guestEmail))}
        ${guestRow("Phone", escapeHtml(data.guestPhone))}
      </table>
    </div>
  `;

  const message = data.guestMessage
    ? `<div style="margin:16px 0 0; padding:12px 14px; background:${COLORS.bgAccent}; border-left:3px solid ${COLORS.primary}; border-radius:4px;">
         <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.primary}; font-weight:600; margin-bottom:6px;">Guest Message</div>
         <div style="font-size:14px; color:${COLORS.text}; line-height:1.6; white-space:pre-wrap;">${escapeHtml(data.guestMessage)}</div>
       </div>`
    : "";

  const cta = `
    <div style="margin-top:20px; text-align:center;">
      <a href="${adminUrl}" style="display:inline-block; padding:12px 24px; background:${COLORS.primary}; color:#ffffff; text-decoration:none; border-radius:6px; font-size:14px; font-weight:600; letter-spacing:0.5px;">Review in Admin Panel</a>
    </div>
  `;

  const html = layout({
    preheader: `New booking request ${data.referenceCode} from ${data.guestName}.`,
    title: "New Booking Request",
    intro,
    body: guestDetails + summaryTable(data) + message + cta,
    closing: "Please review and respond at your earliest convenience.",
  });

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: adminEmail,
    replyTo: data.guestEmail,
    subject: `New Booking Request — ${data.referenceCode} (${data.checkIn} → ${data.checkOut})`,
    html,
  });
}

export async function sendBookingConfirmed(data: BookingEmailData) {
  const intro = `
    <p style="margin:0 0 12px;">Dear ${escapeHtml(data.guestName)},</p>
    <p style="margin:0;">Wonderful news — your booking has been <strong style="color:${COLORS.primary};">confirmed</strong>. To finalise your reservation, please complete the deposit payment using the details below.</p>
  `;
  const html = layout({
    preheader: `Your booking ${data.referenceCode} is confirmed. Deposit of €${data.depositAmount} required.`,
    title: "Booking Confirmed",
    intro,
    body: summaryTable(data, { highlightDeposit: true }) + paymentBlock(data),
    closing: "Once your deposit is received, your reservation is fully secured. We look forward to welcoming you.",
  });

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Confirmed — ${data.referenceCode}`,
    html,
  });
}

interface ContactInquiryData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactInquiry(data: ContactInquiryData) {
  const adminEmail = env.ADMIN_EMAIL || env.DEFAULT_FROM_EMAIL;

  const intro = `<p style="margin:0;">A new message has been submitted through the website contact form.</p>`;

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:10px 0; font-size:14px; color:${COLORS.textMuted};">${label}</td>
      <td style="padding:10px 0; font-size:14px; color:${COLORS.text}; text-align:right;">${value}</td>
    </tr>`;

  const details = `
    <div style="background:${COLORS.bgAccent}; border:1px solid ${COLORS.border}; border-radius:8px; padding:4px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td colspan="2" style="padding:12px 0 8px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.primary}; font-weight:600; border-bottom:1px solid ${COLORS.border};">Sender</td>
        </tr>
        ${row("From", escapeHtml(data.name))}
        ${row("Email", escapeHtml(data.email))}
        ${row("Subject", escapeHtml(data.subject))}
      </table>
    </div>
    <div style="margin:16px 0 0; padding:12px 14px; background:${COLORS.bgAccent}; border-left:3px solid ${COLORS.primary}; border-radius:4px;">
      <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.primary}; font-weight:600; margin-bottom:6px;">Message</div>
      <div style="font-size:14px; color:${COLORS.text}; line-height:1.6; white-space:pre-wrap;">${escapeHtml(data.message)}</div>
    </div>
  `;

  const html = layout({
    preheader: `New inquiry from ${data.name}: ${data.subject}`,
    title: "New Contact Inquiry",
    intro,
    body: details,
    closing: "Reply directly to this email to respond to the sender.",
  });

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: adminEmail,
    replyTo: data.email,
    subject: `Website Inquiry — ${data.subject}`,
    html,
  });
}

export async function sendBookingCancelled(
  data: Pick<BookingEmailData, "referenceCode" | "guestName" | "guestEmail" | "checkIn" | "checkOut">,
  reason: string
) {
  const intro = `
    <p style="margin:0 0 12px;">Dear ${escapeHtml(data.guestName)},</p>
    <p style="margin:0;">We regret to inform you that your booking <strong>${escapeHtml(data.referenceCode)}</strong> for ${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)} has been cancelled.</p>
  `;

  const body = `
    <div style="margin:4px 0 0; padding:12px 14px; background:${COLORS.bgAccent}; border-left:3px solid ${COLORS.primary}; border-radius:4px;">
      <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${COLORS.primary}; font-weight:600; margin-bottom:6px;">Reason</div>
      <div style="font-size:14px; color:${COLORS.text}; line-height:1.6; white-space:pre-wrap;">${escapeHtml(reason)}</div>
    </div>
  `;

  const html = layout({
    preheader: `Your booking ${data.referenceCode} has been cancelled.`,
    title: "Booking Cancelled",
    intro,
    body,
    closing: "If you have any questions or would like to discuss alternative dates, please don't hesitate to reach out.",
  });

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Cancelled — ${data.referenceCode}`,
    html,
  });
}
