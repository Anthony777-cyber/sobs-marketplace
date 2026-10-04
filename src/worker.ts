/// <reference types="@cloudflare/workers-types" />
export interface Env {
  ASSETS: {
    fetch: (request: Request | string | URL, init?: RequestInit) => Promise<Response>;
  };
  sobs_marketplace: D1Database;
  SOBS_LISTING_HISTORY: R2Bucket;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function hashTicket(ticket: string): Promise<string> {
  return hashSha256(ticket);
}

async function generateSellerId(db: D1Database): Promise<string> {
  const range = 10000000000000000n;
  const max = 1n << 64n;
  const limit = (max / range) * range;

  for (let attempt = 0; attempt < 100; attempt++) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));

    let value = 0n;
    for (const byte of bytes) {
      value = (value << 8n) | BigInt(byte);
    }

    if (value >= limit) continue;

    const sellerId = (value % range).toString().padStart(16, '0');

    const taken = await db
      .prepare('SELECT 1 FROM sellers WHERE global_user_key = ? LIMIT 1')
      .bind(sellerId)
      .first();

    if (!taken) return sellerId;
  }

  throw new Error('Could not allocate seller ID');
}

function generateSellerSecret(): string {
  const digits = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(digits, (byte) => String(byte % 10)).join('');
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

async function hashSha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function listingSnapshot(row: Record<string, unknown>) {
  return {
    id: row.id ?? null,
    listing_number: row.listing_number ?? null,
    listing_alias: row.listing_alias ?? null,
    key_token: row.key_token ?? null,
    title: row.title ?? '',
    description: row.description ?? '',
    price: row.price ?? null,
    currency: row.currency ?? null,
    images: row.images ?? '[]',
    categoryPath: row.categoryPath ?? null,
    duration_months: row.duration_months ?? null,
    payment_amount: row.payment_amount ?? null,
    expires_date: row.expires_date ?? null,
    flags: row.flags ?? null,
    status: row.status ?? null,
    grey_zone: row.grey_zone ?? null,
    grey_zone_until: row.grey_zone_until ?? null,
    seller_id: row.seller_id ?? null,
    created_date: row.created_date ?? null,
    updated_date: row.updated_date ?? null,
  };
}

async function prepareListingHistoryInsert(
  env: Env,
  row: Record<string, unknown>,
  eventType: string,
  eventAt: string,
  forcedHistoryId?: string
) {
  const db = env.sobs_marketplace;
  const snapshotJson = JSON.stringify(listingSnapshot(row));
  const snapshotSha256 = await hashSha256(snapshotJson);
  const historyId = forcedHistoryId ?? crypto.randomUUID();
  const year = new Date(eventAt).getUTCFullYear();
  const listingId = String(row.id ?? '');

  const r2ObjectKey =
    `${year}/listings/${listingId}/${eventType}-${historyId}.json`;

  await env.SOBS_LISTING_HISTORY.put(
    r2ObjectKey,
    snapshotJson,
    {
      httpMetadata: {
        contentType: 'application/json',
      },
    }
  );

  return db.prepare(`
    INSERT OR IGNORE INTO listing_history
      (history_id, listing_id, seller_id, listing_number, listing_alias,
       listing_key_token, event_type, event_at, r2_object_key, snapshot_sha256)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    historyId,
    listingId,
    row.seller_id ?? null,
    row.listing_number ?? null,
    row.listing_alias ?? null,
    row.key_token ?? null,
    eventType,
    eventAt,
    r2ObjectKey,
    snapshotSha256
  );
}

async function archiveExpiredListings(env: Env, nowIso: string) {
  const db = env.sobs_marketplace;

  const { results } = await db
    .prepare(`
      SELECT *
      FROM listings
      WHERE grey_zone = 1
        AND grey_zone_until < ?
    `)
    .bind(nowIso)
    .all();

  if (!results.length) return;

  const historyStatements = [];

  for (const row of results) {
    const listingId = String((row as Record<string, unknown>).id ?? '');
    const greyZoneUntil = String(
      (row as Record<string, unknown>).grey_zone_until ?? ''
    );

    historyStatements.push(
      await prepareListingHistoryInsert(
        env,
        row as Record<string, unknown>,
        'expired',
        nowIso,
        `expired-${listingId}-${greyZoneUntil}`
      )
    );
  }

  await db.batch(historyStatements);

  await db
    .prepare(`
      DELETE FROM listings
      WHERE grey_zone = 1
        AND grey_zone_until < ?
    `)
    .bind(nowIso)
    .run();
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

    if (url.pathname === '/api/seller/signup' && request.method === 'POST') {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;

      if (!body || typeof body !== 'object') {
        return json({ error: 'Invalid signup data' }, 400);
      }

      const required = [
        'fullName',
        'country',
        'street',
        'houseNumber',
        'town',
        'region',
        'postcode',
        'phone',
        'email',
        'idDocumentType',
      ];

      const getString = (field: string): string => {
        const value = body[field];
        return typeof value === 'string' ? value.trim() : '';
      };

      for (const field of required) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
          return json({ error: `Missing ${field}` }, 400);
        }
      }

      const sellerId = crypto.randomUUID();
      const globalUserKey = await generateSellerId(env.sobs_marketplace);
      const loginSecret = generateSellerSecret();
      const loginSecretHash = await hashTicket(loginSecret);
      const now = new Date().toISOString();

      await env.sobs_marketplace
        .prepare(`
          INSERT INTO sellers
            (
              id,
              anonymous_tag,
              identity_ciphertext,
              identity_key_version,
              verification_status,
              created_at,
              updated_at,
              global_user_key,
              login_secret_hash
            )
          VALUES (?, ?, ?, 1, 'verified', ?, ?, ?, ?)
        `)
        .bind(
          sellerId,
          `SELLER-${globalUserKey}`,
          JSON.stringify({
            fullName: getString('fullName'),
            country: getString('country'),
            street: getString('street'),
            houseNumber: getString('houseNumber'),
            town: getString('town'),
            region: getString('region'),
            postcode: getString('postcode'),
            phone: getString('phone'),
            email: getString('email'),
            idDocumentType: getString('idDocumentType'),
          }),
          now,
          now,
          globalUserKey,
          loginSecretHash
        )
        .run();

      return json({
        success: true,
        seller: {
          id: globalUserKey,
          loginSecret,
        },
      }, 201);
    }

    if (url.pathname === '/api/seller/login' && request.method === 'POST') {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null;

      const globalUserKey =
        typeof body?.sellerId === 'string' ? body.sellerId.trim() : '';
      const loginSecret =
        typeof body?.loginSecret === 'string' ? body.loginSecret.trim() : '';

      if (!/^\d{16}$/.test(globalUserKey) || !/^\d{16}$/.test(loginSecret)) {
        return json({ error: 'Invalid S.O.B.S ID or login secret' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id, global_user_key, login_secret_hash
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalUserKey)
        .first() as {
          id: string;
          global_user_key: string;
          login_secret_hash: string | null;
        } | null;

      if (!seller?.login_secret_hash) {
        return json({ error: 'Invalid S.O.B.S ID or login secret' }, 401);
      }

      const suppliedHash = await hashTicket(loginSecret);

      if (suppliedHash !== seller.login_secret_hash) {
        return json({ error: 'Invalid S.O.B.S ID or login secret' }, 401);
      }

      const sessionTokenBytes = crypto.getRandomValues(new Uint8Array(32));
      const sessionToken = Array.from(
        sessionTokenBytes,
        (byte) => byte.toString(16).padStart(2, '0')
      ).join('');

      const sessionTokenHash = await hashTicket(sessionToken);
      const sessionId = crypto.randomUUID();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

      await env.sobs_marketplace
        .prepare(`
          INSERT INTO seller_sessions
            (id, seller_id, token_hash, created_at, expires_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          sessionId,
          seller.id,
          sessionTokenHash,
          createdAt.toISOString(),
          expiresAt.toISOString()
        )
        .run();

      return json({
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
      });
    }

    const sellerListingsMatch = url.pathname.match(/^\/api\/manage\/sellers\/([^/]+)\/listings$/);
    if (sellerListingsMatch && request.method === 'GET') {
      const sellerId = decodeURIComponent(sellerListingsMatch[1]);

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id, anonymous_tag, verification_status
          FROM sellers
          WHERE id = ?
          LIMIT 1
        `)
        .bind(sellerId)
        .first();

      if (!seller) {
        return json({ error: 'Seller not found' }, 404);
      }

      const { results } = await env.sobs_marketplace
        .prepare(`
          SELECT
            id,
            listing_number,
            listing_alias,
            title,
            description,
            price,
            currency,
            expires_date,
            status,
            created_date,
            updated_date
          FROM listings
          WHERE seller_id = ?
          ORDER BY created_date DESC
        `)
        .bind(sellerId)
        .all();

      return json({
        seller,
        listings: results,
      });
    }

    if (url.pathname === '/api/seller/me' && request.method === 'GET') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Global user key required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Verified seller not found' }, 401);
      }

      return json({ sellerId: seller.id });
    }

    if (url.pathname === '/api/manage/global/verify' && request.method === 'POST') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Global user key required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Invalid global user key' }, 401);
      }

      return json({ verified: true });
    }

    if (url.pathname === '/api/manage/global/listings' && request.method === 'GET') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Global user key required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Invalid global user key' }, 401);
      }

      const { results } = await env.sobs_marketplace
        .prepare(`
          SELECT
            id,
            listing_number,
            listing_alias,
            title,
            description,
            price,
            currency,
            images,
            expires_date,
            status,
            created_date,
            updated_date
          FROM listings
          WHERE seller_id = ?
          ORDER BY created_date DESC
        `)
        .bind(seller.id)
        .all();

      return json({
        listings: results.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            ...item,
            images: typeof item.images === 'string'
              ? JSON.parse(item.images || '[]')
              : (item.images || []),
          };
        }),
      });
    }

    if (url.pathname === '/api/manage/global/listing-key' && request.method === 'POST') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();
      const listingNumber = request.headers.get('X-SOBS-Listing-Number')?.trim();
      const listingKey = request.headers.get('X-SOBS-Listing-Key')?.trim();

      if (!globalKey || !listingNumber || !listingKey) {
        return json({ error: 'Required credentials missing' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Invalid global user key' }, 401);
      }

      const listing = await env.sobs_marketplace
        .prepare(`
          SELECT id, listing_number
          FROM listings
          WHERE seller_id = ?
            AND listing_number = ?
            AND key_token = ?
          LIMIT 1
        `)
        .bind(seller.id, listingNumber, listingKey)
        .first();

      if (!listing) {
        return json({ error: 'Invalid listing key' }, 401);
      }

      return json({
        verified: true,
        id: listing.id,
        listing_number: listing.listing_number,
      });
    }

    if (url.pathname === '/api/manage/global' && request.method === 'POST') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Global user key required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Invalid global user key' }, 401);
      }

      const listingNumber = request.headers.get('X-SOBS-Listing-Number')?.trim();

      if (!listingNumber) {
        return json({ error: 'Listing number required' }, 400);
      }

      const row = await env.sobs_marketplace
        .prepare(`
          SELECT
            id,
            listing_number,
            listing_alias,
            title,
            description,
            price,
            currency,
            images,
            expires_date,
            status,
            created_date,
            updated_date,
            CASE WHEN status = 'active' THEN 1 ELSE 0 END AS active
          FROM listings
          WHERE seller_id = ?
            AND listing_number = ?
          LIMIT 1
        `)
        .bind(seller.id, listingNumber)
        .first();

      if (!row) {
        return json({ error: 'No listing attached to this account' }, 404);
      }

      const publicRow = row as Record<string, unknown>;

      return json({
        ...publicRow,
        images: typeof publicRow.images === 'string'
          ? JSON.parse(publicRow.images || '[]')
          : (publicRow.images || []),
      });
    }

    if (url.pathname.startsWith('/api/manage/global/listings/') && request.method === 'DELETE') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Global user key required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Invalid global user key' }, 401);
      }

      const id = decodeURIComponent(url.pathname.split('/').pop() || '');

      const owned = await env.sobs_marketplace
        .prepare(`
          SELECT *
          FROM listings
          WHERE id = ? AND seller_id = ?
          LIMIT 1
        `)
        .bind(id, seller.id)
        .first();

      if (!owned) {
        return json({ error: 'Listing not found or not owned by account' }, 404);
      }

      const deletedAt = new Date().toISOString();
      const historyInsert = await prepareListingHistoryInsert(
        env,
        owned as Record<string, unknown>,
        'deleted',
        deletedAt
      );

      await env.sobs_marketplace.batch([
        historyInsert,
        env.sobs_marketplace
          .prepare(`
            DELETE FROM listings
            WHERE id = ? AND seller_id = ?
          `)
          .bind(id, seller.id),
      ]);

      return json({ deleted: true });
    }

    if (url.pathname.startsWith('/api/manage/global/listings/') && request.method === 'PATCH') {
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Global user key required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Invalid global user key' }, 401);
      }

      const id = decodeURIComponent(url.pathname.split('/').pop() || '');

      const owned = await env.sobs_marketplace
        .prepare(`
          SELECT *
          FROM listings
          WHERE id = ?
            AND seller_id = ?
          LIMIT 1
        `)
        .bind(id, seller.id)
        .first();

      if (!owned) {
        return json({ error: 'Listing not owned by account' }, 401);
      }

      const body = await request.json().catch(() => null) as Record<string, unknown> | null;

      if (!body || typeof body !== 'object') {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const price = Number(body.price);
      const currency = typeof body.currency === 'string'
        ? body.currency.toUpperCase().trim()
        : '';
      const images = Array.isArray(body.images) ? body.images.map(String) : [];

      if (!title || !Number.isFinite(price) || price <= 0 || !currency) {
        return json({ error: 'Invalid listing fields' }, 400);
      }

      const updatedAt = new Date().toISOString();
      const updatedHistoryRow = {
        ...(owned as Record<string, unknown>),
        title,
        description,
        price,
        currency,
        images: JSON.stringify(images),
        updated_date: updatedAt,
      };

      await env.sobs_marketplace.batch([
        env.sobs_marketplace
          .prepare(`
            UPDATE listings
            SET title = ?, description = ?, price = ?, currency = ?, images = ?, updated_date = ?
            WHERE id = ? AND seller_id = ?
          `)
          .bind(
            title,
            description,
            price,
            currency,
            JSON.stringify(images),
            updatedAt,
            id,
            seller.id
          ),
        await prepareListingHistoryInsert(
          env,
          updatedHistoryRow,
          'edited',
          updatedAt
        ),
      ]);

      const updated = await env.sobs_marketplace
        .prepare(`
          SELECT
            id,
            listing_number,
            listing_alias,
            title,
            description,
            price,
            currency,
            images,
            expires_date,
            status,
            created_date,
            updated_date,
            CASE WHEN status = 'active' THEN 1 ELSE 0 END AS active
          FROM listings
          WHERE id = ? AND seller_id = ?
          LIMIT 1
        `)
        .bind(id, seller.id)
        .first();

      if (!updated) {
        return json({ error: 'Listing not found after update' }, 404);
      }

      const updatedRow = updated as Record<string, unknown>;

      return json({
        ...updatedRow,
        images: typeof updatedRow.images === 'string'
          ? JSON.parse(updatedRow.images || '[]')
          : (updatedRow.images || []),
      });
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
      const globalKey = request.headers.get('X-SOBS-Global-Key')?.trim();

      if (!globalKey) {
        return json({ error: 'Verified seller authentication required' }, 401);
      }

      const seller = await env.sobs_marketplace
        .prepare(`
          SELECT id
          FROM sellers
          WHERE global_user_key = ?
            AND verification_status = 'verified'
          LIMIT 1
        `)
        .bind(globalKey)
        .first();

      if (!seller) {
        return json({ error: 'Verified seller authentication required' }, 401);
      }

      if (!title || !Number.isFinite(price) || price <= 0 || !currency || !categoryPath || !Number.isFinite(months)) {
        return json({ error: 'Missing or invalid listing fields' }, 400);
      }

      const now = new Date();
      const expiresDate = new Date(now);
      expiresDate.setMonth(expiresDate.getMonth() + months);

      const id = crypto.randomUUID();
      const keyToken = crypto.randomUUID();
      let listingAlias: string;
    try {
      listingAlias = await generateListingAlias(id, keyToken, env.sobs_marketplace);
    } catch (error) {
      console.error("ALIAS_GENERATION_FAILED", error);
      return json({ error: "alias generation failed" }, 500);
    }

      let listingNumber = null;
      const randomRange = 100000000;
      const randomLimit = Math.floor(0x100000000 / randomRange) * randomRange;

      for (let attempt = 0; attempt < 50 && listingNumber === null; attempt++) {
        const random = new Uint32Array(1);
        crypto.getRandomValues(random);

        if (random[0] >= randomLimit) continue;

        const candidate = random[0] % randomRange;
        if (candidate === 0) continue;

        let taken;
        try {
          taken = await env.sobs_marketplace
            .prepare('SELECT 1 FROM listings WHERE listing_number = ? LIMIT 1')
            .bind(candidate)
            .first();
        } catch (error) {
          console.error("LISTING_NUMBER_QUERY_FAILED", error);
          return json({ error: "listing number query failed" }, 500);
        }

        if (!taken) listingNumber = candidate;
      }

      if (listingNumber === null) {
        return json({ error: 'Could not allocate listing number' }, 500);
      }

      try {
        const createdAt = now.toISOString();
        const createdRow = {
          id,
          listing_number: listingNumber,
          listing_alias: listingAlias,
          key_token: keyToken,
          title,
          description,
          price,
          currency,
          images: JSON.stringify(images),
          categoryPath,
          duration_months: months,
          payment_amount: Number.isFinite(paymentAmount) ? paymentAmount : 0,
          expires_date: expiresDate.toISOString(),
          flags: 0,
          status: 'active',
          grey_zone: 0,
          grey_zone_until: null,
          seller_id: seller.id,
          created_date: createdAt,
          updated_date: createdAt,
        };

        await env.sobs_marketplace.batch([
          env.sobs_marketplace
            .prepare(`
              INSERT INTO listings
                (id, listing_number, listing_alias, title, description, price, currency, images, categoryPath,
                 duration_months, payment_amount, expires_date, flags, status,
                 grey_zone, grey_zone_until, seller_id, key_token,
                 downvote_count, downvoted_by, created_date, updated_date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active',
                      0, NULL, ?, ?, 0, '[]', ?, ?)
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
              seller.id,
              keyToken,
              createdAt,
              createdAt
            ),
          await prepareListingHistoryInsert(
            env,
            createdRow,
            'created',
            createdAt
          ),
        ]);
      } catch (error) {
        console.error("LISTING_INSERT_FAILED", error);
        return json({ error: String(error) }, 500);
      }

      return json({ success: true, listing: { id, listingNumber, listingAlias, keyToken } }, 201);
    }

    if (url.pathname === '/api/category-paths' && request.method === 'GET') {
      const nowIso = new Date().toISOString();
      const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await archiveExpiredListings(env, nowIso);

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
        const owned = await env.sobs_marketplace
          .prepare('SELECT * FROM listings WHERE id = ? LIMIT 1')
          .bind(id)
          .first();

        if (owned) {
          const choppedAt = new Date().toISOString();

          const historyInsert = await prepareListingHistoryInsert(
            env,
            owned as Record<string, unknown>,
            'downvote_deleted',
            choppedAt,
            `downvote_deleted-${id}`
          );

          await env.sobs_marketplace.batch([
            historyInsert,
            env.sobs_marketplace
              .prepare('DELETE FROM listings WHERE id = ?')
              .bind(id),
          ]);
        }

        return json({ success: true, count, chopped: true });
      }
      await env.sobs_marketplace.prepare("UPDATE listings SET downvote_count = ?, updated_date = ? WHERE id = ?").bind(count, new Date().toISOString(), id).run();
      return json({ success: true, count, chopped: false });
    }
    const listingMatch = url.pathname.match(/^\/api\/listings\/([^/]+)$/);
    if (url.pathname === '/api/listings/manage' && request.method === 'POST') {
      const keyToken = request.headers.get('X-SOBS-Listing-Key')?.trim();

      if (!keyToken) {
        return json({ error: 'Listing key required' }, 401);
      }

      const row = await env.sobs_marketplace
        .prepare('SELECT * FROM listings WHERE key_token = ? LIMIT 1')
        .bind(keyToken)
        .first();

      if (!row) {
        return json({ error: 'No listing matches that key code' }, 404);
      }

      const { key_token: _keyToken, ...publicRow } = row as Record<string, unknown>;

      return json({
        ...publicRow,
        images: typeof publicRow.images === 'string'
          ? JSON.parse(publicRow.images || '[]')
          : (publicRow.images || []),
      });
    }

    if (listingMatch && request.method === 'PATCH') {
      const id = decodeURIComponent(listingMatch[1]);
      const keyToken = request.headers.get('X-SOBS-Listing-Key')?.trim();

      if (!keyToken) {
        return json({ error: 'Listing key required' }, 401);
      }

      const owned = await env.sobs_marketplace
        .prepare('SELECT * FROM listings WHERE id = ? AND key_token = ? LIMIT 1')
        .bind(id, keyToken)
        .first();

      if (!owned) {
        return json({ error: 'Invalid listing key' }, 401);
      }

      const body = await request.json().catch(() => null) as Record<string, unknown> | null;

      if (!body || typeof body !== 'object') {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const price = Number(body.price);
      const currency = typeof body.currency === 'string' ? body.currency.toUpperCase().trim() : '';

      if (!title || !Number.isFinite(price) || price <= 0 || !currency) {
        return json({ error: 'Invalid listing fields' }, 400);
      }

      const updatedAt = new Date().toISOString();
      const updatedHistoryRow = {
        ...(owned as Record<string, unknown>),
        title,
        description,
        price,
        currency,
        updated_date: updatedAt,
      };

      await env.sobs_marketplace.batch([
        env.sobs_marketplace
          .prepare(`
            UPDATE listings
            SET title = ?, description = ?, price = ?, currency = ?, updated_date = ?
            WHERE id = ? AND key_token = ?
          `)
          .bind(
            title,
            description,
            price,
            currency,
            updatedAt,
            id,
            keyToken
          ),
        await prepareListingHistoryInsert(
          env,
          updatedHistoryRow,
          'edited',
          updatedAt
        ),
      ]);

      const row = await env.sobs_marketplace
        .prepare('SELECT * FROM listings WHERE id = ? AND key_token = ? LIMIT 1')
        .bind(id, keyToken)
        .first();

      if (!row) {
        return json({ error: 'Listing not found' }, 404);
      }

      const { key_token: _keyToken, ...publicRow } = row as Record<string, unknown>;

      return json({
        ...publicRow,
        images: typeof publicRow.images === 'string'
          ? JSON.parse(publicRow.images || '[]')
          : (publicRow.images || []),
      });
    }

    if (listingMatch && request.method === 'GET') {
      const id = decodeURIComponent(listingMatch[1]);

      const row = await env.sobs_marketplace
        .prepare('SELECT * FROM listings WHERE id = ? LIMIT 1')
        .bind(id)
        .first();

      if (!row) return json({ error: 'Listing not found' }, 404);

      const { key_token: _keyToken, ...publicRow } = row as Record<string, unknown>;

      return json({
        ...publicRow,
        images: typeof publicRow.images === 'string'
          ? JSON.parse(publicRow.images || '[]')
          : (publicRow.images || []),
      });
    }

    if (url.pathname === '/api/listings') {
      const nowIso = new Date().toISOString();
      const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await archiveExpiredListings(env, nowIso);

      await env.sobs_marketplace
        .prepare('UPDATE listings SET grey_zone = 1, grey_zone_until = ? WHERE expires_date < ? AND grey_zone = 0')
        .bind(graceUntil, nowIso)
        .run();

      const { results } = await env.sobs_marketplace
        .prepare('SELECT * FROM listings ORDER BY created_date DESC LIMIT 200')
        .all();

      return json(results.map((row) => {
        const { key_token: _keyToken, ...publicRow } = row as Record<string, unknown>;

        return {
          ...publicRow,
          images: typeof publicRow.images === 'string'
            ? JSON.parse(publicRow.images || '[]')
            : (publicRow.images || []),
        };
      }));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.ok) return assetResponse;

    return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  },
};
