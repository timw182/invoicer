import { NextResponse } from "next/server";
import { requireAdmin, AuthError, getCurrentUser } from "@/lib/auth";
import { performBackup, listLocalBackups } from "@/lib/backup";
import { audit } from "@/lib/audit";

export async function POST() {
  try {
    const user = await requireAdmin();
    const result = await performBackup();

    await audit({
      userId: user.id,
      userName: user.name,
      action: "backup",
      entity: "backup",
      details: `Backup created: ${result.filename} (local: ${result.local}, cloud: ${result.cloud})`,
    });

    return NextResponse.json({
      success: true,
      filename: result.filename,
      local: result.local,
      cloud: result.cloud,
      message: result.cloud
        ? "Backup saved locally and uploaded to B2"
        : "Backup saved locally (cloud upload skipped — B2 not configured)",
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Backup failed:", e);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const backups = listLocalBackups();
    return NextResponse.json({ backups });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}
