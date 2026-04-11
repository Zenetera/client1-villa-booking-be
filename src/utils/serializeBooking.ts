import { Prisma } from "@prisma/client";

type BookingLike = {
  id: number;
  villaId: number;
  referenceCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  numGuests: number;
  numNights: number;
  nightlyRate: Prisma.Decimal;
  touristTaxTotal: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  depositAmount?: Prisma.Decimal | null;
  paymentStatus: string;
  status: string;
  adminNotes: string | null;
  guestMessage: string | null;
  cancellationReason: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  villa?: { nameEn: string; address?: string; checkInTime?: string; checkOutTime?: string } | null;
};

function toDateOnly(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function serializeBooking(b: BookingLike) {
  return {
    id: b.id,
    villaId: b.villaId,
    referenceCode: b.referenceCode,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    checkIn: toDateOnly(b.checkIn),
    checkOut: toDateOnly(b.checkOut),
    numGuests: b.numGuests,
    numNights: b.numNights,
    nightlyRate: b.nightlyRate.toFixed(2),
    touristTaxTotal: b.touristTaxTotal.toFixed(2),
    totalPrice: b.totalPrice.toFixed(2),
    depositAmount: b.depositAmount ? b.depositAmount.toFixed(2) : null,
    paymentStatus: b.paymentStatus,
    status: b.status,
    adminNotes: b.adminNotes,
    guestMessage: b.guestMessage,
    cancellationReason: b.cancellationReason,
    confirmedAt: b.confirmedAt ? b.confirmedAt.toISOString() : null,
    cancelledAt: b.cancelledAt ? b.cancelledAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    villa: b.villa
      ? {
          nameEn: b.villa.nameEn,
          address: b.villa.address,
          checkInTime: b.villa.checkInTime,
          checkOutTime: b.villa.checkOutTime,
        }
      : undefined,
  };
}
