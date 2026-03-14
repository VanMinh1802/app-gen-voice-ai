/**
 * API route for serving TTS models from R2 bucket.
 * Uses Cloudflare R2 binding when deployed to Cloudflare Pages.
 * Falls back to direct URL for local development.
 */

import { NextResponse } from "next/server";

/** Run on Edge so this route works on Cloudflare Pages */
export const runtime = "edge";

const R2_BUCKET_VAR = "VIETVOICE_MODELS";
const BUCKET_NAME = "genvoice-models";

const ALLOWED_VOICE_IDS = [
  "anhkhoi",
  "banmai",
  "chieuthanh",
  "lacphi",
  "maiphuong",
  "manhdung",
  "minhkhang",
  "minhquang",
  "mytam",
  "ngochuyen",
] as const;

type VoiceId = (typeof ALLOWED_VOICE_IDS)[number];

function isValidVoiceId(voiceId: string): voiceId is VoiceId {
  return ALLOWED_VOICE_IDS.includes(voiceId as VoiceId);
}

function getContentType(file: string): string {
  if (file.endsWith(".onnx")) return "application/octet-stream";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

/**
 * Get R2 bucket from Cloudflare binding or environment.
 * In dev mode, uses direct URL construction.
 */
function getR2Bucket(): unknown {
  if (typeof process !== "undefined" && process.env && R2_BUCKET_VAR in process.env) {
    return (process.env as Record<string, unknown>)[R2_BUCKET_VAR];
  }
  return null;
}

/**
 * Build direct R2 URL for local development.
 * Assumes R2 public URL is configured in NEXT_PUBLIC_R2_PUBLIC_URL.
 */
function getDevUrl(voiceId: string, file: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${BUCKET_NAME}.r2.cloudflarestorage.com`;
  return `${baseUrl}/vi/${voiceId}/${file}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ voiceId: string; file: string }> }
) {
  const { voiceId, file } = await params;

  // Validate voiceId to prevent path traversal
  if (!isValidVoiceId(voiceId)) {
    return NextResponse.json({ error: "Invalid voice ID" }, { status: 404 });
  }

  // Validate file name to prevent path traversal
  if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const objectKey = `vi/${voiceId}/${file}`;

  // Try R2 binding first (Cloudflare Pages)
  const r2Bucket = getR2Bucket();
  if (r2Bucket) {
    try {
      const object = await (r2Bucket as { get: (key: string) => Promise<{ body: ReadableStream; custom?: { contentType?: string } } | null> }).get(objectKey);

      if (!object) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          "Content-Type": getContentType(file),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error("R2 fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch from R2" }, { status: 500 });
    }
  }

  // Fallback: Use direct URL (local dev)
  const url = getDevUrl(voiceId, file);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": getContentType(file),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
