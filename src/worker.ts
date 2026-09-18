interface Env {
  ASSETS: Fetcher;
  SOBS_LISTINGS: KVNamespace;
  SOBS_CHATS: KVNamespace;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerName?: string;
  images: string[];
  createdAt: string;
  expiresAt?: string;
}

interface ChatMessage {
  id: string;
  listingId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}

function jsonWithCors(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      ...corsHeaders(),
    },
  });
}

function generateId(): string {
  return crypto.randomUUID();
}

function getPathParts(request: Request): string[] {
  const url = new URL(request.url);

  return url.pathname
    .split("/")
    .filter(Boolean);
}

async function handleListings(
  request: Request,
  env: Env,
  parts: string[],
): Promise<Response> {
  const method = request.method;

  // GET /api/listings
  if (method === "GET" && parts.length === 2) {
    const listingIds = await env.SOBS_LISTINGS.list();

    const listings = await Promise.all(
      listingIds.keys.map(async (key) => {
        const listing = await env.SOBS_LISTINGS.get<Listing>(
          key.name,
          "json",
        );

        return listing;
      }),
    );

    return jsonWithCors(listings.filter(Boolean));
  }

  // GET /api/listings/:id
  if (method === "GET" && parts.length === 3) {
    const id = parts[2];

    const listing = await env.SOBS_LISTINGS.get<Listing>(
      `listing:${id}`,
      "json",
    );

    if (!listing) {
      return jsonWithCors(
        { error: "Listing not found" },
        404,
      );
    }

    return jsonWithCors(listing);
  }

  // POST /api/listings
  if (method === "POST" && parts.length === 2) {
    let body: Partial<Listing>;

    try {
      body = await request.json();
    } catch {
      return jsonWithCors(
        { error: "Invalid JSON" },
        400,
      );
    }

    if (!body.title || !body.description) {
      return jsonWithCors(
        {
          error: "Title and description are required",
        },
        400,
      );
    }

    const id = generateId();

    const listing: Listing = {
      id,
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      price: Number(body.price || 0),
      sellerName: body.sellerName
        ? String(body.sellerName).trim()
        : undefined,
      images: Array.isArray(body.images)
        ? body.images.map(String)
        : [],
      createdAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
    };

    await env.SOBS_LISTINGS.put(
      `listing:${id}`,
      JSON.stringify(listing),
    );

    return jsonWithCors(
      {
        success: true,
        listing,
      },
      201,
    );
  }

  return jsonWithCors(
    { error: "Not found" },
    404,
  );
}

async function handleChat(
  request: Request,
  env: Env,
  parts: string[],
): Promise<Response> {
  const method = request.method;

  /*
   * GET /api/chat/:listingId
   *
   * Returns the messages associated with a listing.
   */
  if (method === "GET" && parts.length === 3) {
    const listingId = parts[2];

    const messages =
      await env.SOBS_CHATS.get<ChatMessage[]>(
        `chat:${listingId}`,
        "json",
      );

    return jsonWithCors(messages || []);
  }

  /*
   * POST /api/chat/:listingId
   *
   * Creates a chat message.
   */
  if (method === "POST" && parts.length === 3) {
    const listingId = parts[2];

    let body: {
      senderId?: string;
      message?: string;
    };

    try {
      body = await request.json();
    } catch {
      return jsonWithCors(
        { error: "Invalid JSON" },
        400,
      );
    }

    if (!body.message) {
      return jsonWithCors(
        { error: "Message is required" },
        400,
      );
    }

    const existing =
      (await env.SOBS_CHATS.get<ChatMessage[]>(
        `chat:${listingId}`,
        "json",
      )) || [];

    const chatMessage: ChatMessage = {
      id: generateId(),
      listingId,
      senderId: body.senderId || generateId(),
      message: String(body.message).trim(),
      createdAt: new Date().toISOString(),
    };

    existing.push(chatMessage);

    await env.SOBS_CHATS.put(
      `chat:${listingId}`,
      JSON.stringify(existing),
    );

    return jsonWithCors(
      {
        success: true,
        message: chatMessage,
      },
      201,
    );
  }

  return jsonWithCors(
    { error: "Not found" },
    404,
  );
}

async function handleApi(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const parts = getPathParts(request);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (url.pathname === "/api/health") {
    return jsonWithCors({
      ok: true,
      service: "sobs-marketplace",
      timestamp: new Date().toISOString(),
    });
  }

  if (parts[1] === "listings") {
    return handleListings(request, env, parts);
  }

  if (parts[1] === "chat") {
    return handleChat(request, env, parts);
  }

  return jsonWithCors(
    { error: "API endpoint not found" },
    404,
  );
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
