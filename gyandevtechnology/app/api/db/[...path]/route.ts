import { NextRequest, NextResponse } from 'next/server';

function getTargetBaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url.replace(/\/+$/, '');
}

function getTargetKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}

async function proxyDatabaseRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const targetBase = getTargetBaseUrl();
  const targetKey = getTargetKey();

  if (!targetBase) {
    return NextResponse.json({ error: 'Database service is unconfigured.' }, { status: 503 });
  }

  const resolvedParams = await params;
  const path = (resolvedParams.path || []).join('/');
  const search = req.nextUrl.search || '';
  const targetUrl = `${targetBase}/${path}${search}`;

  // Forward incoming headers while ensuring apikey and authorization are set
  const forwardHeaders = new Headers();
  
  // Forward essential PostgREST and content headers
  const allowedHeaders = [
    'content-type',
    'accept',
    'prefer',
    'range',
    'range-unit',
    'accept-profile',
    'content-profile',
    'x-client-info',
  ];

  for (const [key, value] of req.headers.entries()) {
    if (allowedHeaders.includes(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  // Ensure database authentication headers are present on the proxied server request
  const incomingAuth = req.headers.get('authorization');
  const incomingKey = req.headers.get('apikey');

  forwardHeaders.set('apikey', incomingKey && incomingKey !== 'proxy-token' ? incomingKey : targetKey);
  forwardHeaders.set(
    'authorization',
    incomingAuth && !incomingAuth.includes('proxy-token') ? incomingAuth : `Bearer ${targetKey}`
  );

  let body: BodyInit | undefined = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.arrayBuffer();
    } catch {
      // Body empty or unreadable
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    
    // Forward essential response headers from database
    const allowedResponseHeaders = [
      'content-type',
      'content-range',
      'preference-applied',
      'content-length',
      'location',
    ];

    for (const [key, value] of upstreamRes.headers.entries()) {
      if (allowedResponseHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    // Strip any vendor-identifying headers
    responseHeaders.delete('sb-gateway-mode');
    responseHeaders.delete('cf-ray');

    // HTTP 204 (No Content) and 304 (Not Modified) responses MUST NOT include a message body or Content-Length
    if (upstreamRes.status === 204 || upstreamRes.status === 304) {
      responseHeaders.delete('content-length');
      responseHeaders.delete('content-type');
      return new NextResponse(null, {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: responseHeaders,
      });
    }

    const resData = await upstreamRes.arrayBuffer();

    return new NextResponse(resData, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    console.error('Database proxy exception:', err);
    return NextResponse.json({ error: 'Database proxy communication failure' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyDatabaseRequest(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyDatabaseRequest(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyDatabaseRequest(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyDatabaseRequest(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyDatabaseRequest(req, ctx);
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyDatabaseRequest(req, ctx);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer, range',
    },
  });
}
