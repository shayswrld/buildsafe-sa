import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeChatMessage } from "@/lib/security/anti-leakage";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const { senderId, messageText } = await req.json();

    if (!senderId || !messageText || !String(messageText).trim()) {
      return NextResponse.json(
        { error: "Sender and message text are required." },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { milestones: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const isEscrowFunded = job.milestones.some(
      (m) =>
        m.status === "HELD_IN_ESCROW" ||
        m.status === "WORK_SUBMITTED" ||
        m.status === "RELEASED"
    );

    const sanitized = sanitizeChatMessage(String(messageText), isEscrowFunded);

    const saved = await prisma.chatMessage.create({
      data: {
        jobId,
        senderId,
        body: sanitized.sanitizedBody,
        wasRedacted: sanitized.wasRedacted,
        redactionReasonsJson: JSON.stringify(sanitized.reasons),
      },
      include: {
        sender: true,
      },
    });

    return NextResponse.json({
      message: saved,
      warningBanner: sanitized.warningBanner,
      reasons: sanitized.reasons,
    });
  } catch (err) {
    console.error("Chat message error:", err);
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 500 }
    );
  }
}
