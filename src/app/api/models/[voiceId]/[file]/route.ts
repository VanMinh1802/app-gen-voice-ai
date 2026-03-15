/**
 * API route for serving TTS models from R2 bucket.
 * Uses Cloudflare R2 binding when deployed to Cloudflare Pages.
 * Falls back to direct URL for local development.
 *
 * Edge runtime required for Cloudflare Pages Functions.
 */

export const runtime = "edge";

import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";
import { getR2FolderForVoice } from "@/config";

const R2_BUCKET_VAR = "VIETVOICE_MODELS";

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
  "mytam2",
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
 * Read R2 public URL from environment variable.
 * In Edge runtime, use process.env directly (set via Cloudflare Dashboard).
 * For local dev: set NEXT_PUBLIC_R2_PUBLIC_URL in .env.local
 */
function getR2PublicUrlFromEnv(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
  if (fromEnv?.startsWith("http")) {
    return fromEnv.trim();
  }
  return "";
}

/**
 * Get R2 bucket from Cloudflare binding.
 * Uses getRequestContext (next-on-pages) on Cloudflare Pages; falls back to globalThis.__env or null.
 */
function getR2Bucket(): R2Bucket | null {
  try {
    const ctx = getOptionalRequestContext();
    const fromEnv = ctx?.env && (ctx.env as Record<string, R2Bucket | undefined>)[R2_BUCKET_VAR];
    if (fromEnv) return fromEnv;
  } catch {
    // not in Cloudflare request context (e.g. local dev)
  }
  const binding = (globalThis as unknown as { __env?: Record<string, R2Bucket> }).__env?.[R2_BUCKET_VAR];
  if (binding) return binding;
  return null;
}

interface R2Object {
  body: ReadableStream;
  custom?: { contentType?: string };
}

interface R2Bucket {
  get: (key: string) => Promise<R2Object | null>;
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

  // Validate file name: allow {voiceId}.onnx, {voiceId}.onnx.json, sample.wav (and legacy model.onnx, model.onnx.json)
  if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  const allowedFiles = [`${voiceId}.onnx`, `${voiceId}.onnx.json`, "sample.wav", "model.onnx", "model.onnx.json"];
  if (!allowedFiles.includes(file)) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  const r2Folder = getR2FolderForVoice(voiceId);
  const objectKey = `vi/${r2Folder}/${file}`;

  // Try R2 binding first (Cloudflare Pages)
  const r2Bucket = getR2Bucket();
  if (r2Bucket) {
    try {
      const object = await r2Bucket.get(objectKey);

      if (!object) {
        return NextResponse.json(
          { error: "File not found", key: objectKey },
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = object.body;
      if (!body || typeof (body as ReadableStream).getReader !== "function") {
        return NextResponse.json(
          { error: "Invalid R2 object body", key: objectKey },
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(body, {
        headers: {
          "Content-Type": getContentType(file),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("R2 fetch error:", msg, objectKey, error);
      return NextResponse.json(
        { error: "Failed to fetch from R2", detail: msg, key: objectKey },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Fallback: Use direct URL (local dev - R2 public bucket)
  const baseUrl =
    getR2PublicUrlFromEnv() ||
    request.headers.get("X-R2-Public-URL")?.trim();

  if (!baseUrl?.startsWith("http")) {
    return NextResponse.json(
      {
        error: "R2 public URL not configured",
        hint: "Set NEXT_PUBLIC_R2_PUBLIC_URL in .env.local for local dev, or configure R2 binding in Cloudflare Dashboard",
      },
      { status: 503 }
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/vi/${r2Folder}/${file}`;

  try {
    const response = await fetch(url, {
      headers: { "Accept": "*/*" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "File not found", url, status: response.status },
        { status: 404 }
      );
    }

    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": getContentType(file),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("R2 public fetch error:", message, url);
    return NextResponse.json(
      {
        error: "Failed to fetch file from R2",
        detail: message,
        url,
      },
      { status: 502 }
    );
  }
}
