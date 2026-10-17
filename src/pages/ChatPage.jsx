import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NavBar from '@/components/NavBar';

const buyerTokenKey = (listingId) => `sobs_chat_buyer_${listingId}`;
function getBuyerToken(listingId) {
  const key = buyerTokenKey(listingId);
  let token = localStorage.getItem(key);
  if (!token) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(key, token);
  }
  return token;
}
function sellerHeaders() {
  const globalKey = sessionStorage.getItem('sobs_global_user_key') || localStorage.getItem('sobs_global_user_key') || '';
  const sessionToken = sessionStorage.getItem('sobs_seller_session_token') || localStorage.getItem('sobs_seller_session_token') || '';
  return { 'Content-Type': 'application/json', 'X-SOBS-Global-Key': globalKey, 'X-SOBS-Seller-Session': sessionToken };
}
const panel = 'rounded-xl border border-white/20 bg-black p-4 text-white';
const field = 'w-full rounded-lg border border-white/30 bg-black px-3 py-2 text-white';
const button = 'rounded-full bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-40';

export default function ChatPage({ sellerMode = false }) {
  const { listingId: routeListingId } = useParams();
  const [listingId, setListingId] = useState(routeListingId || '');
  const [listingTitle, setListingTitle] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const token = useMemo(() => (!sellerMode && routeListingId ? getBuyerToken(routeListingId) : ''), [sellerMode, routeListingId]);

  const loadSellerInbox = useCallback(async () => {
    const response = await fetch('/api/seller/chats', { headers: sellerHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Inbox request failed (${response.status}).`);
    setConversations(data.conversations || []);
  }, []);

  const loadMessages = useCallback(async (id, quiet = false) => {
    if (!id) return;
    try {
      const response = sellerMode
        ? await fetch(`/api/seller/chats/${encodeURIComponent(id)}`, { headers: sellerHeaders() })
        : await fetch(`/api/chat/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Chat request failed (${response.status}).`);
      if (!sellerMode) setListingTitle(data.listing?.title || '');
      setMessages(data.messages || []);
      if (!quiet) setError('');
    } catch (e) { if (!quiet) setError(e.message || 'Could not load messages.'); }
  }, [sellerMode, token]);

  useEffect(() => {
    if (!sellerMode) return;
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/seller/chats', { headers: sellerHeaders() });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Inbox request failed (${response.status}).`);
        if (alive) {
          setConversations(data.conversations || []);
          if (!selectedId && data.conversations?.length) setSelectedId(data.conversations[0].conversation_id);
        }
      } catch (e) { if (alive) setError(e.message || 'Could not load seller inbox.'); }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [sellerMode, selectedId]);

  useEffect(() => {
    if (sellerMode) {
      if (selectedId) loadMessages(selectedId, true);
      return;
    }
    if (routeListingId) loadMessages(routeListingId, true);
  }, [sellerMode, selectedId, routeListingId, loadMessages]);

  useEffect(() => {
    if (sellerMode && selectedId) {
      const timer = window.setInterval(() => loadMessages(selectedId, true), 4000);
      return () => window.clearInterval(timer);
    }
    if (!sellerMode && routeListingId) {
      const timer = window.setInterval(() => loadMessages(routeListingId, true), 4000);
      return () => window.clearInterval(timer);
    }
  }, [sellerMode, selectedId, routeListingId, loadMessages]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;
    setLoading(true); setError(''); setStatus('');
    try {
      let response;
      if (sellerMode) {
        response = await fetch(`/api/seller/chats/${encodeURIComponent(selectedId)}`, {
          method: 'POST', headers: sellerHeaders(), body: JSON.stringify({ message }),
        });
      } else {
        const id = routeListingId || listingId.trim();
        if (!id) throw new Error('Enter a listing ID.');
        const buyerToken = token || getBuyerToken(id);
        response = await fetch(`/api/chat/${encodeURIComponent(id)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: buyerToken, message }),
        });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Send failed (${response.status}).`);
      setDraft('');
      if (!sellerMode && !routeListingId) {
        window.location.assign(`/chat/${encodeURIComponent(listingId.trim())}`);
        return;
      }
      await loadMessages(sellerMode ? selectedId : routeListingId, true);
      if (sellerMode) await loadSellerInbox();
      setStatus('Message sent.');
    } catch (e) { setError(e.message || 'Could not send message.'); }
    finally { setLoading(false); }
  }

  return <div className="min-h-screen bg-black text-white"><NavBar /><main className="mx-auto max-w-5xl px-4 pt-10 pb-16">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl tracking-tight">{sellerMode ? 'Chats' : 'Chat with the seller'}</h1><Link className="rounded-full border border-white/40 px-4 py-2" to={sellerMode ? '/manage-listings' : '/listings'}>{sellerMode ? 'Management Console' : 'Back to listings'}</Link></div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-500 p-3 text-red-300">{error}</p>}
    {status && <p className="mb-4 text-sm text-green-300">{status}</p>}
    {sellerMode ? <div className="grid gap-4 md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.5fr)]">
      <section className={panel}><h2 className="mb-3 text-lg">Conversations</h2>{conversations.length === 0 ? <p className="text-sm text-gray-300">No messages yet. Buyer messages for your listings will appear here.</p> : <div className="space-y-2">{conversations.map((c) => <button key={c.conversation_id} onClick={() => setSelectedId(c.conversation_id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === c.conversation_id ? 'border-red-500' : 'border-white/20'}`}><span className="block font-medium">{c.listing_title || `Listing ${c.listing_id}`}</span><span className="block text-xs text-gray-400">Listing ID: {c.listing_id}</span><span className="mt-1 block truncate text-sm text-gray-300">{c.last_sender === 'seller' ? 'You: ' : ''}{c.last_message || 'No messages yet'}</span><span className="mt-1 block text-xs text-gray-500">{c.updated_at ? new Date(c.updated_at).toLocaleString() : ''}</span></button>)}</div>}</section>
      <section className={`${panel} flex min-h-[420px] flex-col`}><h2 className="mb-3 text-lg">Messages</h2>{selectedId ? <><div className="mb-3 flex-1 space-y-3 overflow-y-auto">{messages.map((m) => <div key={m.id} className={`max-w-[90%] rounded-lg p-3 ${m.sender === 'seller' ? 'ml-auto bg-red-900/50' : 'bg-white/10'}`}><div className="mb-1 text-xs text-gray-400">{m.sender === 'seller' ? 'You' : 'Buyer'} Â· {m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div><p className="whitespace-pre-wrap break-words">{m.message}</p></div>)}</div><form onSubmit={sendMessage} className="flex gap-2"><input className={field} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} placeholder="Write a replyâ€¦" /><button className={button} disabled={loading || !draft.trim()}>Send</button></form></> : <p className="text-sm text-gray-300">Select a conversation to read and reply.</p>}</section>
    </div> : <div className="mx-auto max-w-3xl"><section className={panel}><p className="mb-1 text-sm text-gray-300">Listing</p><h2 className="mb-4 text-xl">{listingTitle || (routeListingId ? `Listing ${routeListingId}` : 'Test a listing chat')}</h2>{!routeListingId && <form onSubmit={(e) => { e.preventDefault(); if (listingId.trim()) window.location.assign(`/chat/${encodeURIComponent(listingId.trim())}`); }} className="mb-5 flex gap-2"><input className={field} value={listingId} onChange={(e) => setListingId(e.target.value)} placeholder="Enter an existing listing ID" /><button className={button}>Open</button></form>}<div className="mb-4 min-h-64 space-y-3">{messages.map((m) => <div key={m.id} className={`max-w-[90%] rounded-lg p-3 ${m.sender === 'buyer' ? 'ml-auto bg-red-900/50' : 'bg-white/10'}`}><div className="mb-1 text-xs text-gray-400">{m.sender === 'buyer' ? 'You' : 'Seller'} Â· {m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div><p className="whitespace-pre-wrap break-words">{m.message}</p></div>)}{messages.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No messages yet. Send a message to start the conversation.</p>}</div><form onSubmit={sendMessage} className="flex gap-2"><input className={field} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} placeholder="Type a message to the sellerâ€¦" /><button className={button} disabled={loading || !draft.trim()}>Send</button></form><p className="mt-3 text-xs text-gray-500">This chat is linked to this listing. Your browser keeps a random chat token so you can return to the conversation without creating an account.</p></section></div>}
  </main></div>;
}