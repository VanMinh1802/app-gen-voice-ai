/**
 * API route for serving TTS models from R2 bucket.
 * Uses Cloudflare R2 binding when deployed to Cloudflare Pages.
 * Falls back to direct URL for local development.
 *
 * Chạy Node.js runtime (mặc định) để process.env đọc được từ .env.local khi dev.
 * Trên Cloudflare Pages: cấu hình R2 binding + env R2_PUBLIC_URL nếu cần proxy.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { getR2FolderForVoice } from "@/config";

const R2_KEYS = ["R2_PUBLIC_URL", "NEXT_PUBLIC_R2_PUBLIC_URL"] as const;

/** Loại bỏ null bytes (file .env lưu UTF-16 đọc nhầm UTF-8 sẽ có U+0000 xen giữa). */
function stripNullBytes(s: string): string {
  return s.replace(/\u0000/g, "");
}

/** Parse một dòng .env: trả về [key, value] hoặc null. Hỗ trợ "export KEY=value" và file UTF-16. */
function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim().replace(/\r/g, "");
  if (trimmed.startsWith("#") || !trimmed.includes("=")) return null;
  const eq = trimmed.indexOf("=");
  let key = stripNullBytes(trimmed.slice(0, eq).trim());
  if (key.toLowerCase().startsWith("export ")) key = key.slice(7).trim();
  const value = stripNullBytes(
    trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim()
  );
  return [key, value];
}

/** Đọc nội dung .env.local (hoặc .env) và tìm R2 URL + thông tin debug */
function readEnvFileR2(cwd: string, fileName: string): { url: string; debug: Record<string, unknown> } {
  const envPath = join(cwd, fileName);
  const debug: Record<string, unknown> = { envPath, exists: existsSync(envPath) };
  if (!existsSync(envPath)) return { url: "", debug };

  try {
    let content = readFileSync(envPath, "utf-8");
    if (content.length && content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    const lines = content.split(/\r?\n/);
    debug.lineCount = lines.length;
    const allKeys: string[] = [];
    for (const line of lines) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      allKeys.push(key);
      if (!R2_KEYS.includes(key as (typeof R2_KEYS)[number])) continue;
      debug.foundKey = key;
      debug.valueLength = value.length;
      debug.valueStartsWithHttp = value.startsWith("http");
      if (value.startsWith("http")) {
        return { url: value, debug };
      }
      return { url: "", debug };
    }
    debug.foundKey = null;
    debug.allKeysInFile = allKeys;
  } catch (e) {
    debug.parseError = String(e);
  }
  return { url: "", debug };
}

/** Đọc R2 public URL từ process.env hoặc .env.local */
function getR2PublicUrlFromEnv(): string {
  const fromEnv =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (fromEnv?.trim().startsWith("http")) return fromEnv.trim();

  const cwd = process.cwd();
  for (const fileName of [".env.local", ".env"]) {
    const { url } = readEnvFileR2(cwd, fileName);
    if (url) return url;
  }
  return "";
}

/** Chỉ dùng trong dev: thông tin debug cho 503 */
function getR2DebugInfo(): Record<string, unknown> {
  const cwd = process.cwd();
  const envPath = join(cwd, ".env.local");
  const envFileExists = existsSync(envPath);
  const out: Record<string, unknown> = {
    cwd,
    envPath,
    envFileExists,
    hasR2InEnv: Boolean(process.env.R2_PUBLIC_URL),
    hasNextPublicInEnv: Boolean(process.env.NEXT_PUBLIC_R2_PUBLIC_URL),
  };
  if (envFileExists) {
    const { debug } = readEnvFileR2(cwd, ".env.local");
    out.envFileParse = debug;
  }
  return out;
}

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
 * Get R2 bucket from Cloudflare binding or environment.
 * In dev mode, uses direct URL construction.
 */
function getR2Bucket(): unknown {
  if (typeof process !== "undefined" && process.env && R2_BUCKET_VAR in process.env) {
    return (process.env as Record<string, unknown>)[R2_BUCKET_VAR];
  }
  return null;
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

  // Fallback: Use direct URL (local dev - R2 public bucket)
  // Nguồn: env, đọc từ .env.local, hoặc header X-R2-Public-URL
  const baseUrl =
    getR2PublicUrlFromEnv() ||
    request.headers.get("X-R2-Public-URL")?.trim();
  if (!baseUrl?.startsWith("http")) {
    const body: Record<string, unknown> = {
      error: "R2 public URL not configured",
      hint: "Tạo file .env.local ở thư mục gốc với: R2_PUBLIC_URL=<Public URL của R2 bucket>, rồi restart npm run dev",
    };
    if (process.env.NODE_ENV === "development") {
      body.debug = getR2DebugInfo();
    }
    return NextResponse.json(body, { status: 503 });
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
