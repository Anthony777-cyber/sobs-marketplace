import { base44 } from '@/api/base44Client';

export function getSessionId() {
  let id = localStorage.getItem('junkmarket_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('junkmarket_session_id', id);
  }
  return id;
}

export async function getUserName() {
  try {
    const me = await base44.auth.me();
    return me.full_name || me.email || 'Guest';
  } catch {
    return 'Guest';
  }
}