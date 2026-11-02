import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGateCheckInCode } from "@/lib/security/gate-otp";
import { validateGateArrivalManifest } from "@/lib/governance";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const body = await req.json();
    const {
      action,
      gateVisitId,
      submittedCode,
      faceMatchConfirmed,
      verifiedCrewProfileIds,
      arrivingHeadcount,
      unannouncedPersonnelPresent,
      incidentReport,
    } = body;

    const visit = await prisma.gateVisit.findUnique({
      where: { id: gateVisitId },
      include: { crewMembers: true },
    });

    if (!visit || visit.jobId !== jobId) {
      return NextResponse.json(
        { error: "Gate Pass session not found for this job." },
        { status: 404 }
      );
    }

    if (action === "VERIFY_ARRIVAL") {
      const expectedCrewProfileIds = visit.crewMembers.map(
        (cm) => cm.workerProfileId
      );

      const manifestCheck = validateGateArrivalManifest({
        faceMatchConfirmed: Boolean(faceMatchConfirmed),
        expectedCrewProfileIds,
        verifiedCrewProfileIds: Array.isArray(verifiedCrewProfileIds)
          ? verifiedCrewProfileIds
          : undefined,
        arrivingHeadcount:
          arrivingHeadcount !== undefined ? Number(arrivingHeadcount) : undefined,
        unannouncedPersonnelPresent: Boolean(unannouncedPersonnelPresent),
      });

      if (!manifestCheck.allowed) {
        return NextResponse.json(
          { error: manifestCheck.reason },
          { status: 400 }
        );
      }

      if (!verifyGateCheckInCode(String(submittedCode || ""), visit.checkInCodeHash)) {
        return NextResponse.json(
          {
            error:
              "Invalid 6-digit Gate Check-In OTP. Do not open your gate until the code matches.",
          },
          { status: 403 }
        );
      }

      await prisma.gateVisit.update({
        where: { id: visit.id },
        data: {
          status: "VERIFIED_ON_SITE",
          faceMatchConfirmed: true,
          crewMatchConfirmed: true,
          arrivedAt: new Date(),
        },
      });

      await prisma.gateCrewMember.updateMany({
        where: { gateVisitId: visit.id },
        data: { verifiedAtGate: true },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "WORKER_ON_SITE" },
      });

      return NextResponse.json({
        success: true,
        verifiedHeadcount: 1 + expectedCrewProfileIds.length,
      });
    }

    if (action === "CHECK_OUT") {
      await prisma.gateVisit.update({
        where: { id: visit.id },
        data: {
          status: "CHECKED_OUT",
          departedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "REPORT_GATE_INCIDENT") {
      await prisma.gateVisit.update({
        where: { id: visit.id },
        data: {
          status: "SAFETY_INCIDENT_FLAGGED",
          incidentReport: String(
            incidentReport ||
              "Unmatched person or unvetted helper arrived at gate — homeowner refused entry."
          ),
        },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "DISPUTED" },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown gate action." }, { status: 400 });
  } catch (err) {
    console.error("Gate verification error:", err);
    return NextResponse.json(
      { error: "Failed to verify gate visit." },
      { status: 500 }
    );
  }
}
