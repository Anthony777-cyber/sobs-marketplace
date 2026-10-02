import { getEntryTicket } from "@/lib/entryTicket";
export async function getListing(id) {
  const res = await fetch(`/api/listings/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Listing request failed: ${res.status}`);
  return res.json();
}

export async function getListings() {
  const res = await fetch('/api/listings');
  if (!res.ok) throw new Error(`Listings request failed: ${res.status}`);
  return res.json();
}

export async function getManageListing(keyToken) {
  const res = await fetch('/api/listings/manage', {
    method: 'POST',
    headers: {
      'X-SOBS-Listing-Key': keyToken,
    },
  });

  if (!res.ok) throw new Error(`Listing lookup failed: ${res.status}`);
  return res.json();
}

export async function updateListing(id, keyToken, data) {
  const res = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-SOBS-Listing-Key': keyToken,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Listing update failed: ${res.status}`);
  return res.json();
}

export async function deleteListing(id) {
  const res = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Listing deletion failed: ${res.status}`);
  return res.json();
}

export async function flagListing(id) {
  const ticketData = await getEntryTicket();
  const ticket = ticketData?.ticket || ticketData;

  const res = await fetch(`/api/listings/${encodeURIComponent(id)}/flag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SOBS-Entry-Ticket": ticket,
    },
  });
  if (!res.ok) throw new Error(`Flag request failed: ${res.status}`);
  return res.json();
}


export async function getSellerListings(sellerId) {
  const res = await fetch(`/api/manage/sellers/${encodeURIComponent(sellerId)}/listings`);
  if (!res.ok) throw new Error('Could not load seller listings');
  return res.json();
}

export async function getGlobalSellerListings(globalUserKey) {
  const res = await fetch('/api/manage/global/listings', {
    method: 'GET',
    headers: {
      'X-SOBS-Global-Key': globalUserKey,
    },
  });

  if (!res.ok) throw new Error(`Global listings lookup failed: ${res.status}`);
  return res.json();
}

export async function verifyGlobalListingKey(globalUserKey, listingNumber, listingKey) {
  const res = await fetch('/api/manage/global/listing-key', {
    method: 'POST',
    headers: {
      'X-SOBS-Global-Key': globalUserKey,
      'X-SOBS-Listing-Number': String(listingNumber),
      'X-SOBS-Listing-Key': listingKey,
    },
  });

  if (!res.ok) throw new Error(`Listing key verification failed: ${res.status}`);
  return res.json();
}

export async function getGlobalManageListing(globalUserKey, listingNumber) {
  const res = await fetch('/api/manage/global', {
    method: 'POST',
    headers: {
      'X-SOBS-Global-Key': globalUserKey,
      ...(listingNumber ? { 'X-SOBS-Listing-Number': String(listingNumber) } : {}),
    },
  });

  if (!res.ok) throw new Error(`Global account lookup failed: ${res.status}`);
  return res.json();
}

export async function updateGlobalListing(id, globalUserKey, data) {
  const res = await fetch(`/api/manage/global/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-SOBS-Global-Key': globalUserKey,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Global listing update failed: ${res.status}`);
  return res.json();
}


export async function deleteGlobalListing(id, globalUserKey) {
  const res = await fetch(`/api/manage/global/listings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'X-SOBS-Global-Key': globalUserKey,
    },
  });

  if (!res.ok) throw new Error(`Global listing delete failed: ${res.status}`);
  return res.json();
}
