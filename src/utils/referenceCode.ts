import prisma from "../config/database";

export async function generateReferenceCode(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `VE${yy}${mm}`;

  const latest = await prisma.booking.findFirst({
    where: { referenceCode: { startsWith: prefix } },
    orderBy: { referenceCode: "desc" },
    select: { referenceCode: true },
  });

  let seq = 1;
  if (latest) {
    const lastSeq = parseInt(latest.referenceCode.slice(6), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
