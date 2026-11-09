import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAction } from "@/app/actions/auth";

const SUPABASE_TARGET =
  process.env.SUPABASE_URL || "https://hipsfbtxlfykhproyqzx.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // Validate session - NO backdoor without an active authenticated session
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Authentication required. Changes and queries must be made via an active session.",
      },
      { status: 401 }
    );
  }

  const resolvedParams = await params;
  const path = resolvedParams.path ? resolvedParams.path.join("/") : "";
  const lowerPath = path.toLowerCase();

  // Role-based permission gate: block non-admins from sensitive administrative paths
  const isSuper =
    currentUser.role?.toLowerCase() === "superadmin" ||
    currentUser.position?.toLowerCase().includes("super administrator");
  const isAdmin = isSuper || currentUser.role?.toLowerCase() === "admin";

  const adminOnlyTables = ["permissions", "accounts", "email_credentials", "logs", "sessions"];
  const isTargetingAdminTable = adminOnlyTables.some((tbl) => lowerPath.includes(tbl));

  if (isTargetingAdminTable && !isAdmin) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "You do not have permission to access or modify this resource.",
      },
      { status: 403 }
    );
  }

  const targetUrl = new URL(`${SUPABASE_TARGET}/${path}${req.nextUrl.search}`);

  // Headers to forward to Supabase
  const headers = new Headers();

  // Forward safe client headers
  const forwardHeaders = [
    "content-type",
    "accept",
    "prefer",
    "range",
    "x-client-info",
  ];

  forwardHeaders.forEach((h) => {
    const val = req.headers.get(h);
    if (val) headers.set(h, val);
  });

  // Always supply apikey securely on the server-side, never exposed to client
  if (SUPABASE_ANON_KEY) {
    headers.set("apikey", SUPABASE_ANON_KEY);
    headers.set("authorization", `Bearer ${SUPABASE_ANON_KEY}`);
  }

  // Set proper host for upstream
  headers.set("Host", new URL(SUPABASE_TARGET).host);

  // Extract body if method allows
  let body: BodyInit | null = null;
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  try {
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      redirect: "follow",
    });

    const responseHeaders = new Headers();

    // Copy safe response headers (Strip all keys, auth headers, and upstream tokens)
    const allowedResponseHeaders = [
      "content-type",
      "content-range",
      "content-length",
      "etag",
      "preference-applied",
      "location",
    ];

    allowedResponseHeaders.forEach((h) => {
      const val = upstreamResponse.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set("X-Proxied-By", "SriMatrix-Gateway");
    responseHeaders.set("X-Content-Type-Options", "nosniff");

    const data = await upstreamResponse.arrayBuffer();

    return new NextResponse(data, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Supabase Proxy Error:", error);
    return NextResponse.json(
      {
        error: "Gateway Proxy Error",
        message: "Failed to route through domain gateway",
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, ctx);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "content-type, prefer, range, x-client-info",
      "Access-Control-Max-Age": "86400",
    },
  });
}
