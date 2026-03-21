import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, copyFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { format } from "date-fns";

const DB_PATH = join(process.cwd(), "prisma", "dev.db");
const LOCAL_BACKUP_DIR = join(process.cwd(), "backups");
const MAX_LOCAL_BACKUPS = 30;
const MAX_CLOUD_BACKUPS = 90;

function getS3Client(): S3Client | null {
  const endpoint = process.env.B2_ENDPOINT;
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const region = process.env.B2_REGION;

  if (!endpoint || !keyId || !appKey) return null;

  return new S3Client({
    endpoint,
    region: region || "eu-central-003",
    credentials: { accessKeyId: keyId, secretAccessKey: appKey },
    forcePathStyle: true,
  });
}

function ensureLocalDir() {
  if (!existsSync(LOCAL_BACKUP_DIR)) {
    mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a local backup of the SQLite database.
 */
export function createLocalBackup(): { filename: string; path: string } {
  ensureLocalDir();
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const filename = `invoicer_${timestamp}.db`;
  const backupPath = join(LOCAL_BACKUP_DIR, filename);

  copyFileSync(DB_PATH, backupPath);

  // Rotate old backups
  const files = readdirSync(LOCAL_BACKUP_DIR)
    .filter((f) => f.startsWith("invoicer_") && f.endsWith(".db"))
    .sort()
    .reverse();

  for (let i = MAX_LOCAL_BACKUPS; i < files.length; i++) {
    unlinkSync(join(LOCAL_BACKUP_DIR, files[i]));
  }

  return { filename, path: backupPath };
}

/**
 * Upload a backup to Backblaze B2 (S3-compatible).
 */
export async function uploadToCloud(localPath: string, filename: string): Promise<boolean> {
  const client = getS3Client();
  const bucket = process.env.B2_BUCKET;

  if (!client || !bucket) {
    console.warn("B2 not configured, skipping cloud upload");
    return false;
  }

  try {
    const fileContent = readFileSync(localPath);

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `backups/${filename}`,
      Body: fileContent,
      ContentType: "application/x-sqlite3",
    }));

    // Rotate old cloud backups
    const listResult = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "backups/invoicer_",
    }));

    const objects = (listResult.Contents || [])
      .filter((o) => o.Key)
      .sort((a, b) => (b.Key || "").localeCompare(a.Key || ""));

    for (let i = MAX_CLOUD_BACKUPS; i < objects.length; i++) {
      if (objects[i].Key) {
        await client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: objects[i].Key,
        }));
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to upload backup to B2:", error);
    return false;
  }
}

/**
 * Full backup: local + cloud.
 */
export async function performBackup(): Promise<{
  local: boolean;
  cloud: boolean;
  filename: string;
}> {
  const { filename, path } = createLocalBackup();
  const cloudResult = await uploadToCloud(path, filename);

  return { local: true, cloud: cloudResult, filename };
}

/**
 * List available backups.
 */
export function listLocalBackups(): Array<{ filename: string; size: number; date: string }> {
  ensureLocalDir();
  const { statSync } = require("fs");
  return readdirSync(LOCAL_BACKUP_DIR)
    .filter((f: string) => f.startsWith("invoicer_") && f.endsWith(".db"))
    .sort()
    .reverse()
    .map((f: string) => {
      const stats = statSync(join(LOCAL_BACKUP_DIR, f));
      return {
        filename: f,
        size: stats.size,
        date: stats.mtime.toISOString(),
      };
    });
}
