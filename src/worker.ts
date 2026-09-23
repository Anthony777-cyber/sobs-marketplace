/// <reference types="@cloudflare/workers-types" />
export interface Env {
  ASSETS: {
    fetch: (request: Request | string | URL, init?: RequestInit) => Promise<Response>;
  };
  sobs_marketplace: D1Database;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function hashTicket(ticket: string): Promise<string> {
  const data = new TextEncoder().encode(ticket);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function generateListingAlias(
  id: string,
  keyToken: string,
  db: D1Database
): Promise<string> {
  const range = 10000000000000000n;
  const max = 1n << 64n;
  const limit = (max / range) * range;

  for (let attempt = 0; attempt < 100; attempt++) {
    const data = new TextEncoder().encode(`${id}:${keyToken}:${attempt}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);

    let value = 0n;
    for (let i = 0; i < 8; i++) {
      value = (value << 8n) | BigInt(bytes[i]);
    }

    if (value >= limit) continue;

    const alias = (value % range).toString().padStart(16, '0');

    const taken = await db
      .prepare('SELECT 1 FROM listings WHERE listing_alias = ? LIMIT 1')
      .bind(alias)
      .first();

    if (!taken) return alias;
  }

  throw new Error('Could not allocate listing alias');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/entry-ticket' && request.method === 'POST') {
      const ticket = crypto.randomUUID() + crypto.randomUUID();
      const ticketHash = await hashTicket(ticket);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await env.sobs_marketplace
        .prepare(`
          INSERT INTO entry_tickets
            (id, ticket_hash, created_at, last_seen_at, status)
          VALUES (?, ?, ?, ?, 'active')
        `)
        .bind(id, ticketHash, now, now)
        .run();

      return json({ entryTicket: ticket });
    }

    if (url.pathname === '/api/entry-ticket' && request.method === 'PATCH') {
    const ticket = request.headers.get('X-SOBS-Entry-Ticket');
    if (!ticket) return json({ valid: false }, 401);

    const ticketHash = await hashTicket(ticket);
    const body = await request.json().catch(() => ({} as unknown));
    const currency = typeof body === 'object' && body !== null && 'currency' in body && typeof body.currency === 'string'
      ? body.currency.toUpperCase()
      : '';

    if (!currency) return json({ valid: false }, 400);

    const result = await env.sobs_marketplace
      .prepare('UPDATE entry_tickets SET currency = ?, last_seen_at = ? WHERE ticket_hash = ? AND status = ?')
      .bind(currency, new Date().toISOString(), ticketHash, 'active')
      .run();

    if (!result.meta.changes) return json({ valid: false }, 401);

    return json({ valid: true, currency });
  }

  if (url.pathname === '/api/entry-ticket' && request.method === 'GET') {
      const ticket = request.headers.get('X-SOBS-Entry-Ticket');

      if (!ticket) {
        return json({ valid: false }, 401);
      }

      const ticketHash = await hashTicket(ticket);

      const row = await env.sobs_marketplace
        .prepare(`
          SELECT id, status, blocked_until, currency
          FROM entry_tickets
          WHERE ticket_hash = ?
        `)
        .bind(ticketHash)
        .first<{
          id: string;
          status: string;
          blocked_until: string | null;
          currency: string | null;
        }>();

      if (!row) {
        return json({ valid: false }, 401);
      }

      const blocked =
        row.status === 'blocked' &&
        (!row.blocked_until || row.blocked_until > new Date().toISOString());

      if (blocked) {
        return json({ valid: false, blocked: true }, 403);
      }

      await env.sobs_marketplace
        .prepare('UPDATE entry_tickets SET last_seen_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), row.id)
        .run();

      return json({ valid: true, currency: row.currency || 'EUR' });
    }

    if (url.pathname === '/api/listings' && request.method === 'POST') {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;

      if (!body || typeof body !== 'object') {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const price = Number(body.price);
      const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : '';
      const categoryPath = typeof body.categoryPath === 'string' ? body.categoryPath.trim() : '';
      const months = Number(body.months);
      const paymentAmount = Number(body.paymentAmount);
      const images = Array.isArray(body.images) ? body.images.map(String) : [];

      if (!title || !Number.isFinite(price) || price <= 0 || !currency || !categoryPath || !Number.isFinite(months)) {
        return json({ error: 'Missing or invalid listing fields' }, 400);
      }

      const now = new Date();
      const expiresDate = new Date(now);
      expiresDate.setMonth(expiresDate.getMonth() + months);

      const id = crypto.randomUUID();
      const keyToken = crypto.randomUUID();
      const listingAlias = await generateListingAlias(id, keyToken, env.sobs_marketplace);

      let listingNumber = null;
      const randomRange = 100000000;
      const randomLimit = Math.floor(0x100000000 / randomRange) * randomRange;

      for (let attempt = 0; attempt < 50 && listingNumber === null; attempt++) {
        const random = new Uint32Array(1);
        crypto.getRandomValues(random);

        if (random[0] >= randomLimit) continue;

        const candidate = random[0] % randomRange;
        if (candidate === 0) continue;

        const taken = await env.sobs_marketplace
          .prepare('SELECT 1 FROM listings WHERE listing_number = ? LIMIT 1')
          .bind(candidate)
          .first();

        if (!taken) listingNumber = candidate;
      }

      if (listingNumber === null) {
        return json({ error: 'Could not allocate listing number' }, 500);
      }

      await env.sobs_marketplace
        .prepare(`
          INSERT INTO listings
            (id, listing_number, listing_alias, title, description, price, currency, images, categoryPath,
             duration_months, payment_amount, expires_date, flags, status,
             grey_zone, grey_zone_until, seller_id, key_token,
             downvote_count, downvoted_by, created_date, updated_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active',
                  0, NULL, NULL, ?, 0, '[]', ?, ?)
        `)
        .bind(
          id,
          listingNumber,
          listingAlias,
          title,
          description,
          price,
          currency,
          JSON.stringify(images),
          categoryPath,
          months,
          Number.isFinite(paymentAmount) ? paymentAmount : 0,
          expiresDate.toISOString(),
          keyToken,
          now.toISOString(),
          now.toISOString()
        )
        .run();

      return json({ success: true, listing: { id, listingNumber, listingAlias, keyToken } }, 201);
    }

    if (url.pathname === '/api/category-paths' && request.method === 'GET') {
      const nowIso = new Date().toISOString();
      const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await env.sobs_marketplace
        .prepare('DELETE FROM listings WHERE grey_zone = 1 AND grey_zone_until < ?')
        .bind(nowIso)
        .run();

      await env.sobs_marketplace
        .prepare('UPDATE listings SET grey_zone = 1, grey_zone_until = ? WHERE expires_date < ? AND grey_zone = 0')
        .bind(graceUntil, nowIso)
        .run();

      const { results } = await env.sobs_marketplace
        .prepare(`
          SELECT categoryPath, COUNT(*) AS listing_count
          FROM listings
          WHERE status = 'active'
            AND grey_zone = 0
            AND expires_date >= ?
            AND categoryPath IS NOT NULL
            AND TRIM(categoryPath) <> ''
          GROUP BY categoryPath
          ORDER BY categoryPath COLLATE NOCASE
        `)
        .bind(nowIso)
        .all();

      return json({
        paths: results.map((row) => ({
          path: String(row.categoryPath),
          listingCount: Number(row.listing_count || 0),
        })),
      });
    }

    const flagMatch = url.pathname.match(/^\/api\/listings\/([^/]+)\/flag$/);
    if (flagMatch && request.method === "POST") {
      const id = decodeURIComponent(flagMatch[1]);
      const ticket = request.headers.get("X-SOBS-Entry-Ticket");
      if (!ticket) return json({ error: "Entry ticket required" }, 401);
      const ticketHash = await hashTicket(ticket);
      const ticketRow = await env.sobs_marketplace.prepare("SELECT id FROM entry_tickets WHERE ticket_hash = ? AND status = ? LIMIT 1").bind(ticketHash, "active").first();
      if (!ticketRow) return json({ error: "Invalid entry ticket" }, 401);
      const result = await env.sobs_marketplace.prepare("INSERT OR IGNORE INTO listing_downvotes (id, listing_id, entry_ticket_id, created_at) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), id, ticketRow.id, new Date().toISOString()).run();
      if (!result.meta.changes) return json({ success: true, alreadyVoted: true, chopped: false });
      const row = await env.sobs_marketplace.prepare("SELECT COUNT(*) AS count FROM listing_downvotes WHERE listing_id = ?").bind(id).first();
      const count = Number(row?.count || 0);
      if (count >= 10) {
        await env.sobs_marketplace.prepare("DELETE FROM listings WHERE id = ?").bind(id).run();
        return json({ success: true, count, chopped: true });
      }
      await env.sobs_marketplace.prepare("UPDATE listings SET downvote_count = ?, updated_date = ? WHERE id = ?").bind(count, new Date().toISOString(), id).run();
      return json({ success: true, count, chopped: false });
    }
    const listingMatch = url.pathname.match(/^\/api\/listings\/([^/]+)$/);
    if (listingMatch && request.method === 'GET') {
      const id = decodeURIComponent(listingMatch[1]);

      const row = await env.sobs_marketplace
        .prepare('SELECT * FROM listings WHERE id = ? LIMIT 1')
        .bind(id)
        .first();

      if (!row) return json({ error: 'Listing not found' }, 404);

      return json({
        ...row,
        images: typeof row.images === 'string'
          ? JSON.parse(row.images || '[]')
          : (row.images || []),
      });
    }

    if (url.pathname === '/api/listings') {
      const nowIso = new Date().toISOString();
      const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await env.sobs_marketplace
        .prepare('DELETE FROM listings WHERE grey_zone = 1 AND grey_zone_until < ?')
        .bind(nowIso)
        .run();

      await env.sobs_marketplace
        .prepare('UPDATE listings SET grey_zone = 1, grey_zone_until = ? WHERE expires_date < ? AND grey_zone = 0')
        .bind(graceUntil, nowIso)
        .run();

      const { results } = await env.sobs_marketplace
        .prepare('SELECT * FROM listings ORDER BY created_date DESC LIMIT 200')
        .all();

      return json(results.map((row) => ({
        ...row,
        images: typeof row.images === 'string'
          ? JSON.parse(row.images || '[]')
          : (row.images || []),
      })));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  },
};
