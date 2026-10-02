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
