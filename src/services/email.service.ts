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

export async function sendBookingReceived(data: BookingEmailData) {
  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Request Received — ${data.referenceCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Request Received</h2>
        <p>Dear ${escapeHtml(data.guestName)},</p>
        <p>Thank you for your booking request. We have received it and will review it shortly.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0; font-weight: 500;">${data.referenceCode}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-in</td><td style="padding: 8px 0;">${data.checkIn}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-out</td><td style="padding: 8px 0;">${data.checkOut}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Guests</td><td style="padding: 8px 0;">${data.numGuests}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Nights</td><td style="padding: 8px 0;">${data.numNights}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Nightly Rate</td><td style="padding: 8px 0;">€${data.nightlyRate}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Tourist Tax</td><td style="padding: 8px 0;">€${data.touristTaxTotal}</td></tr>
          <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; font-weight: 500;">Total</td><td style="padding: 8px 0; font-weight: 500;">€${data.totalPrice}</td></tr>
          <tr><td style="padding: 4px 0 8px; color: #666; font-size: 12px;">Deposit (${data.depositPercentage}%)</td><td style="padding: 4px 0 8px; color: #666; font-size: 12px;">€${data.depositAmount}</td></tr>
        </table>

        <p>You will receive a confirmation email once your booking is approved.</p>
        <p>Best regards,<br/>Sunset Villa</p>
      </div>
    `,
  });
}

export async function sendAdminBookingRequest(data: AdminBookingRequestData) {
  const adminEmail = env.ADMIN_EMAIL || env.DEFAULT_FROM_EMAIL;
  const adminUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/admin`;

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: adminEmail,
    replyTo: data.guestEmail,
    subject: `New Booking Request — ${data.referenceCode} (${data.checkIn} → ${data.checkOut})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Booking Request</h2>
        <p>A new booking request has been submitted and is awaiting your review.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0; font-weight: 500;">${data.referenceCode}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Guest</td><td style="padding: 8px 0;">${escapeHtml(data.guestName)}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${escapeHtml(data.guestEmail)}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;">${escapeHtml(data.guestPhone)}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-in</td><td style="padding: 8px 0;">${data.checkIn}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-out</td><td style="padding: 8px 0;">${data.checkOut}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Guests</td><td style="padding: 8px 0;">${data.numGuests}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Nights</td><td style="padding: 8px 0;">${data.numNights}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Nightly Rate</td><td style="padding: 8px 0;">€${data.nightlyRate}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Tourist Tax</td><td style="padding: 8px 0;">€${data.touristTaxTotal}</td></tr>
          <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; font-weight: 500;">Total</td><td style="padding: 8px 0; font-weight: 500;">€${data.totalPrice}</td></tr>
          <tr><td style="padding: 4px 0 8px; color: #666; font-size: 12px;">Deposit (${data.depositPercentage}%)</td><td style="padding: 4px 0 8px; color: #666; font-size: 12px;">€${data.depositAmount}</td></tr>
        </table>

        ${
          data.guestMessage
            ? `<div style="margin: 20px 0; padding: 12px; background: #f8f8f8; border-left: 2px solid #ddd;"><div style="color: #666; margin-bottom: 6px;">Guest message</div><div>${escapeHtml(data.guestMessage)}</div></div>`
            : ""
        }

        <p style="margin-top: 24px;">
          <a href="${adminUrl}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none;">Review in admin panel</a>
        </p>
      </div>
    `,
  });
}

export async function sendBookingConfirmed(data: BookingEmailData) {
  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Confirmed — ${data.referenceCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed</h2>
        <p>Dear ${escapeHtml(data.guestName)},</p>
        <p>Great news! Your booking has been confirmed.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0; font-weight: 500;">${data.referenceCode}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-in</td><td style="padding: 8px 0;">${data.checkIn}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Check-out</td><td style="padding: 8px 0;">${data.checkOut}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Guests</td><td style="padding: 8px 0;">${data.numGuests}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Nights</td><td style="padding: 8px 0;">${data.numNights}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Nightly Rate</td><td style="padding: 8px 0;">€${data.nightlyRate}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Tourist Tax</td><td style="padding: 8px 0;">€${data.touristTaxTotal}</td></tr>
          <tr style="border-top: 1px solid #eee;"><td style="padding: 8px 0; font-weight: 500;">Total</td><td style="padding: 8px 0; font-weight: 500;">€${data.totalPrice}</td></tr>
          <tr><td style="padding: 4px 0 8px; color: #666; font-size: 12px;">Deposit (${data.depositPercentage}%)</td><td style="padding: 4px 0 8px; color: #666; font-size: 12px;">€${data.depositAmount}</td></tr>
        </table>

        <p>We look forward to welcoming you!</p>
        <p>Best regards,<br/>Sunset Villa</p>
      </div>
    `,
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

  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: adminEmail,
    replyTo: data.email,
    subject: `Website Inquiry — ${data.subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Inquiry</h2>
        <p>A message has been submitted through the website contact form.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #666;">From</td><td style="padding: 8px 0;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${escapeHtml(data.email)}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Subject</td><td style="padding: 8px 0;">${escapeHtml(data.subject)}</td></tr>
        </table>

        <div style="margin: 20px 0; padding: 12px; background: #f8f8f8; border-left: 2px solid #ddd;">
          <div style="color: #666; margin-bottom: 6px;">Message</div>
          <div style="white-space: pre-wrap;">${escapeHtml(data.message)}</div>
        </div>
      </div>
    `,
  });
}

export async function sendBookingCancelled(
  data: Pick<BookingEmailData, "referenceCode" | "guestName" | "guestEmail" | "checkIn" | "checkOut">,
  reason: string
) {
  await transporter.sendMail({
    from: `"Sunset Villa" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Cancelled — ${data.referenceCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Cancelled</h2>
        <p>Dear ${escapeHtml(data.guestName)},</p>
        <p>We regret to inform you that your booking <strong>${escapeHtml(data.referenceCode)}</strong> for ${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)} has been cancelled.</p>

        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>

        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>Sunset Villa</p>
      </div>
    `,
  });
}
