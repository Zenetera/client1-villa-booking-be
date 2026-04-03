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
}

export async function sendBookingReceived(data: BookingEmailData) {
  await transporter.sendMail({
    from: `"Villa Elara" <${env.DEFAULT_FROM_EMAIL}>`,
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
        </table>

        <p>You will receive a confirmation email once your booking is approved.</p>
        <p>Best regards,<br/>Villa Elara</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmed(data: BookingEmailData) {
  await transporter.sendMail({
    from: `"Villa Elara" <${env.DEFAULT_FROM_EMAIL}>`,
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
        </table>

        <p>We look forward to welcoming you!</p>
        <p>Best regards,<br/>Villa Elara</p>
      </div>
    `,
  });
}

export async function sendBookingCancelled(
  data: Pick<BookingEmailData, "referenceCode" | "guestName" | "guestEmail" | "checkIn" | "checkOut">,
  reason: string
) {
  await transporter.sendMail({
    from: `"Villa Elara" <${env.DEFAULT_FROM_EMAIL}>`,
    to: data.guestEmail,
    subject: `Booking Cancelled — ${data.referenceCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Cancelled</h2>
        <p>Dear ${escapeHtml(data.guestName)},</p>
        <p>We regret to inform you that your booking <strong>${escapeHtml(data.referenceCode)}</strong> for ${escapeHtml(data.checkIn)} — ${escapeHtml(data.checkOut)} has been cancelled.</p>

        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>

        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>Villa Elara</p>
      </div>
    `,
  });
}
