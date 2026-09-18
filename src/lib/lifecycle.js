import { base44 } from '@/api/base44Client';

// Grey-Zone lifecycle: when a listing's paid time runs out it is NOT
// instantly purged. It moves into a hidden "Grey Zone" state for 7 days,
// after which it is hard-deleted.
export async function runLifecycle() {
  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Hard-delete listings whose 7-day grey-zone grace window has elapsed
  try {
    await base44.entities.Listing.deleteMany({
      grey_zone: true,
      grey_zone_until: { $lt: nowIso },
    });
  } catch (e) {
    console.error('grey-zone purge failed', e);
  }

  // 2. Move newly-expired listings into the grey zone (7-day grace)
  try {
    const graceUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await base44.entities.Listing.updateMany(
      { expires_date: { $lt: nowIso }, grey_zone: false },
      { $set: { grey_zone: true, grey_zone_until: graceUntil } }
    );
  } catch (e) {
    console.error('grey-zone transition failed', e);
  }
}