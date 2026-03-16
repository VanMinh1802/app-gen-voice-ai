/**
 * API route for serving TTS models from R2 bucket.
 * Uses Cloudflare R2 binding when deployed to Cloudflare Pages.
 * Falls back to direct URL for local development.
 *
 * Edge runtime required for Cloudflare Pages Functions.
 */

export const runtime = "edge";

import { NextResponse } from "next/server";
import { getR2FolderForVoice } from "@/config";

const R2_BUCKET_VAR = "VIETVOICE_MODELS";

/** next-on-pages injects request context at this Symbol (env + bindings). */
const CF_REQUEST_CONTEXT = Symbol.for("__cloudflare-request-context__");

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

/** Cloudflare Pages injects Variables/Secrets into request context env, not process.env. */
function getCloudflareEnv(): Record<string, string | undefined> | null {
  try {
    const ctx = (globalThis as unknown as Record<symbol, unknown>)[CF_REQUEST_CONTEXT];
    const env = ctx && typeof ctx === "object" && (ctx as { env?: Record<string, unknown> }).env;
    return env && typeof env === "object" ? (env as Record<string, string | undefined>) : null;
  } catch {
    return null;
  }
}

/**
 * Read R2 public URL from Cloudflare context.env (Pages Variables) or process.env.
 */
function getR2PublicUrlFromEnv(): string {
  const cfEnv = getCloudflareEnv();
  const fromCf = cfEnv?.R2_PUBLIC_URL ?? cfEnv?.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (typeof fromCf === "string" && fromCf.startsWith("http")) {
    return fromCf.trim();
  }
  const fromProcess =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
  if (fromProcess?.startsWith("http")) {
    return fromProcess.trim();
  }
  return "";
}

/**
 * Get R2 bucket from Cloudflare binding (context.env.VIETVOICE_MODELS on Pages).
 */
function getR2Bucket(): R2Bucket | null {
  try {
    const ctx = (globalThis as unknown as Record<symbol, unknown>)[CF_REQUEST_CONTEXT];
    const env = ctx && typeof ctx === "object" && (ctx as { env?: Record<string, R2Bucket | undefined> }).env;
    const bucket = env ? (env as Record<string, R2Bucket | undefined>)[R2_BUCKET_VAR] : undefined;
    if (bucket && typeof (bucket as R2Bucket).get === "function") return bucket as R2Bucket;
  } catch {
    // ignore
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

/** Required so this API response is not blocked by COEP when loaded from the same-origin page. */
const COEP_HEADERS: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

function withCoep<T extends Record<string, string>>(h: T): T & Record<string, string> {
  return { ...h, ...COEP_HEADERS };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ voiceId: string; file: string }> }
) {
  const json500 = (body: Record<string, unknown>) =>
    NextResponse.json(body, { status: 500, headers: withCoep({ "Content-Type": "application/json" }) });

  // Debug: trả JSON tĩnh. Gọi: /api/models/banmai/sample.wav?debug=1
  try {
    const u = request.url || "";
    if (u.includes("debug=1")) {
      return new Response('{"ok":true,"msg":"route-ok"}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // ignore
  }

  try {
    let resolvedParams: { voiceId?: string; file?: string };
    try {
      resolvedParams =
        params && typeof (params as Promise<unknown>).then === "function"
          ? await params
          : (params as unknown as { voiceId: string; file: string });
    } catch (e) {
      return json500({
        error: "Invalid params",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
    const voiceId = resolvedParams?.voiceId;
    const file = resolvedParams?.file;
    if (!voiceId || !file) {
      return NextResponse.json(
        { error: "Missing voiceId or file", voiceId, file },
        { status: 400, headers: withCoep({ "Content-Type": "application/json" }) }
      );
    }

    // Validate voiceId to prevent path traversal
    if (!isValidVoiceId(voiceId)) {
      return NextResponse.json({ error: "Invalid voice ID" }, { status: 404, headers: withCoep({ "Content-Type": "application/json" }) });
    }

    // Validate file name: allow {voiceId}.onnx, {voiceId}.onnx.json, sample.wav (and legacy model.onnx, model.onnx.json)
    if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400, headers: withCoep({ "Content-Type": "application/json" }) });
    }
    const allowedFiles = [`${voiceId}.onnx`, `${voiceId}.onnx.json`, "sample.wav", "model.onnx", "model.onnx.json"];
    if (!allowedFiles.includes(file)) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400, headers: withCoep({ "Content-Type": "application/json" }) });
    }

    const r2Folder = getR2FolderForVoice(voiceId);
    const objectKey = `vi/${r2Folder}/${file}`;

    const baseUrl =
      getR2PublicUrlFromEnv() ||
      request.headers.get("X-R2-Public-URL")?.trim();
    const useDirectUrl = !!baseUrl?.startsWith("http");
    const directUrl = useDirectUrl && baseUrl ? `${baseUrl.replace(/\/$/, "")}/vi/${r2Folder}/${file}` : "";

    const debug = (extra: Record<string, unknown> = {}) => ({
      key: objectKey,
      voiceId,
      file,
      r2Folder,
      useDirectUrl,
      hasBaseUrl: !!baseUrl,
      ...extra,
    });

    /** Fetch from R2 public URL. Prefer this when set to avoid 500 from R2 binding on Pages. */
    const fetchFromDirectUrl = async (): Promise<NextResponse | Response> => {
      if (!useDirectUrl || !directUrl) {
        return NextResponse.json(
          {
            error: "R2 public URL not configured",
            hint: "Set R2_PUBLIC_URL or NEXT_PUBLIC_R2_PUBLIC_URL (Cloudflare: Settings → Environment variables)",
          },
          { status: 503, headers: withCoep({ "Content-Type": "application/json" }) }
        );
      }
      try {
        const response = await fetch(directUrl, {
          headers: { Accept: "*/*" },
          cache: "no-store",
        });
        if (!response.ok) {
          return NextResponse.json(
            { error: "File not found", url: directUrl, status: response.status },
            { status: 404, headers: withCoep({ "Content-Type": "application/json" }) }
          );
        }
        const blob = await response.blob();
        return new Response(blob, {
          headers: withCoep({
            "Content-Type": getContentType(file),
            "Cache-Control": "public, max-age=31536000, immutable",
          }),
        });
      } catch (fetchError) {
        const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        return json500({
          error: "Direct fetch failed",
          detail: msg,
          ...debug({ source: "direct_fetch" }),
        });
      }
    };

    // Prefer direct R2 URL when configured (avoids 500 from binding on Cloudflare Pages)
    if (useDirectUrl) {
      return fetchFromDirectUrl();
    }

    // Otherwise use R2 binding (Cloudflare Pages)
    const r2Bucket = getR2Bucket();
    if (r2Bucket) {
      try {
        const object = await r2Bucket.get(objectKey);
        if (!object) {
          return NextResponse.json(
            { error: "File not found", key: objectKey },
            { status: 404, headers: withCoep({ "Content-Type": "application/json" }) }
          );
        }
        const body = object.body;
        if (!body || typeof (body as ReadableStream).getReader !== "function") {
          return json500({ error: "Invalid R2 object body", key: objectKey });
        }
        return new Response(body, {
          headers: withCoep({
            "Content-Type": getContentType(file),
            "Cache-Control": "public, max-age=31536000, immutable",
          }),
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return json500({
          error: "Failed to fetch from R2",
          detail: msg,
          ...debug({ source: "r2_binding" }),
          hint: "Set R2_PUBLIC_URL in Cloudflare Pages env to use direct fetch instead.",
        });
      }
    }

    // No binding and no direct URL: try direct fetch (will return 503 with message)
    const directResponse = await fetchFromDirectUrl();
    return directResponse;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json500({
      error: "Internal error",
      detail: msg,
      hint: "Set R2_PUBLIC_URL in Cloudflare Pages → Settings → Environment variables.",
    });
  }
}
