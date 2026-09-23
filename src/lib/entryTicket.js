const STORAGE_KEY = 'sobs_entry_ticket';

function getStoredTicket() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function createTicket() {
  const res = await fetch('/api/entry-ticket', { method: 'POST' });
  if (!res.ok) throw new Error('Entry Ticket creation failed');

  const data = await res.json();
  localStorage.setItem(STORAGE_KEY, data.entryTicket);
  return data.entryTicket;
}

export async function getEntryTicket() {
  let ticket = getStoredTicket();

  if (!ticket) {
    ticket = await createTicket();
  }

  const res = await fetch('/api/entry-ticket', {
    headers: { 'X-SOBS-Entry-Ticket': ticket },
  });

  if (res.status === 401) {
    ticket = await createTicket();
    return getEntryTicket();
  }

  if (!res.ok) throw new Error('Entry Ticket validation failed');

  return {
    ticket,
    ...(await res.json()),
  };
}

export async function saveEntryCurrency(currency) {
  const ticket = getStoredTicket();
  if (!ticket) return;

  const res = await fetch('/api/entry-ticket', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-SOBS-Entry-Ticket': ticket,
    },
    body: JSON.stringify({ currency }),
  });

  if (!res.ok) throw new Error('Entry Ticket currency update failed');
}
