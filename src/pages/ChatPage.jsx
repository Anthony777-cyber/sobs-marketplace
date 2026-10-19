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
const exampleConversationId = '__example_buyer_1__';
const secondExampleConversationId = '__example_buyer_2__';
const exampleConversations = [
  { id: exampleConversationId, title: 'Vintage guitar amp — Buyer 1' },
  { id: secondExampleConversationId, title: 'Vintage guitar amp — Buyer 2' },
];
const exampleMessages = {
  [exampleConversationId]: [
    { id: 'buyer-1-message-1', sender: 'buyer', buyerName: 'Buyer 1', created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(), message: 'Hi, is the amp still available? Does it work without buzzing?' },
    { id: 'buyer-1-message-2', sender: 'seller', created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(), message: 'Yes, it is available. It plays cleanly at low and medium volume; there is a slight hum when turned all the way up.' },
    { id: 'buyer-1-message-3', sender: 'buyer', buyerName: 'Buyer 1', created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), message: 'Thanks! Could you send a photo of the model number?' },
    { id: 'buyer-1-message-4', sender: 'seller', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), message: 'Sure, I will send one this afternoon.' },
  ],
  [secondExampleConversationId]: [
    { id: 'buyer-2-message-1', sender: 'buyer', buyerName: 'Buyer 2', created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(), message: 'I am interested too. Would you take 180 GBP if I can collect today?' },
    { id: 'buyer-2-message-2', sender: 'seller', created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), message: 'Thanks for asking. I could do 180 GBP for collection today.' },
  ],
};

export default function ChatPage({ sellerMode = false }) {
  const { listingId: routeListingId } = useParams();
  const [listingId, setListingId] = useState(routeListingId || '');
  const [listingTitle, setListingTitle] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(sellerMode && import.meta.env.DEV ? exampleConversationId : '');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const isExample = sellerMode && String(selectedId).startsWith('__example_buyer_');
  const selectedConversation = conversations.find((conversation) => conversation.conversation_id === selectedId);
  const selectedDisplayTitle = selectedConversation
    ? `${selectedConversation.buyer_name || 'Buyer'} ${selectedConversation.listing_title || `Listing ${selectedConversation.listing_id}`}`
    : 'Messages';
  const token = useMemo(() => (!sellerMode && routeListingId ? getBuyerToken(routeListingId) : ''), [sellerMode, routeListingId]);

  const loadSellerInbox = useCallback(async () => {
    const response = await fetch('/api/seller/chats', { headers: sellerHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Inbox request failed (${response.status}).`);
    setConversations(data.conversations || []);
  }, []);

  const loadMessages = useCallback(async (id, quiet = false) => {
    if (!id) return;
    if (sellerMode && String(id).startsWith('__example_buyer_')) {
      setMessages(exampleMessages[id] || []);
      if (!quiet) setError('');
      return;
    }
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
    if (!sellerMode || import.meta.env.DEV) return;
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/seller/chats', { headers: sellerHeaders() });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Inbox request failed (${response.status}).`);
        if (alive) {
          setConversations(data.conversations || []);
          if (!selectedId) setSelectedId(data.conversations?.[0]?.conversation_id || exampleConversationId);
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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl tracking-tight">{sellerMode ? 'Chats' : 'Chat with the seller'}</h1><Link className="rounded-full bg-red-600 px-4 py-2 transition-colors hover:bg-red-700" to={sellerMode ? '/manage-listings' : '/listings'}>{sellerMode ? 'Management Console' : 'Back to listings'}</Link></div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-500 p-3 text-red-300">{error}</p>}
    {status && <p className="mb-4 text-sm text-green-300">{status}</p>}
    {sellerMode ? <div className="grid gap-4 md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.5fr)]">
      <section className={`${panel} !border-2 !border-white`}>
  <h2 className="mb-3 text-lg">Conversations</h2>
  {conversations.length === 0 && !import.meta.env.DEV && <p className="mb-3 text-sm text-gray-300">No messages yet. Buyer messages for your listings will appear here.</p>}
  <div className="space-y-2">
    {conversations.map((c) => <button key={c.conversation_id} onClick={() => setSelectedId(c.conversation_id)} className={`w-full rounded-lg border-2 p-3 text-left ${selectedId === c.conversation_id ? 'border-white bg-black text-white' : 'border-white bg-black text-white hover:bg-gray-900'}`}><span className="block font-medium">{c.buyer_name || 'Buyer'} {c.listing_title || `Listing ${c.listing_id}`}</span><span className="mt-1 block text-xs text-gray-400">{c.updated_at ? new Date(c.updated_at).toLocaleString() : ''}</span></button>)}
    {exampleConversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-lg border-2 p-3 text-left ${selectedId === conversation.id ? 'border-white bg-black text-white' : 'border-white bg-black text-white hover:bg-gray-900'}`}><span className="block font-medium">{conversation.title}</span><span className="mt-1 block text-xs text-gray-400">{new Date(exampleMessages[conversation.id].at(-1).created_at).toLocaleString()}</span></button>)}
  </div>
</section>
      <section className={`${panel} !border-2 !border-white flex min-h-[420px] flex-col`}><h2 className="mb-3 text-lg">{isExample ? (exampleConversations.find((conversation) => conversation.id === selectedId)?.title || 'Example conversation') : selectedDisplayTitle}</h2>{isExample && <p className="mb-3 rounded-lg border border-white/20 p-2 text-xs text-gray-300">Example preview only. These messages are not saved or sent.</p>}{selectedId ? <><div className="mb-3 flex-1 space-y-3 overflow-y-auto">{messages.map((m) => <div key={m.id} className={`w-fit max-w-[80%] rounded-2xl px-3 py-2 ${m.sender === 'buyer' ? 'mr-auto rounded-bl-sm bg-red-600 text-white' : 'ml-auto rounded-br-sm bg-blue-700 text-white'}`}><div className={`mb-1 text-xs ${m.sender === 'buyer' ? 'text-black' : 'text-blue-100'}`}>{m.sender === 'seller' ? 'You' : (m.buyerName || 'Buyer')} {m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div><p className="whitespace-pre-wrap break-words">{m.message}</p></div>)}</div>{selectedId && <form onSubmit={isExample ? (event) => event.preventDefault() : sendMessage} className="flex gap-2 rounded-lg bg-black"><span className="flex min-w-0 flex-1 rounded-lg bg-white p-1"><input className="w-full rounded-lg border border-white/30 bg-black px-3 py-2 text-white placeholder:text-white" value={isExample ? "" : draft} onChange={(e) => setDraft(e.target.value)} readOnly={isExample} maxLength={4000} placeholder="Reply:" /></span><button className={button} disabled={isExample || loading || !draft.trim()}>Send</button></form>}</> : <p className="text-sm text-gray-300">Select a conversation to read and reply.</p>}</section>
    </div> : <div className="mx-auto max-w-3xl"><section className={panel}><p className="mb-1 text-sm text-gray-300">Listing</p><h2 className="mb-4 text-xl">{listingTitle || (routeListingId ? `Listing ${routeListingId}` : 'Test a listing chat')}</h2>{!routeListingId && <form onSubmit={(e) => { e.preventDefault(); if (listingId.trim()) window.location.assign(`/chat/${encodeURIComponent(listingId.trim())}`); }} className="mb-5 flex gap-2"><input className={field} value={listingId} onChange={(e) => setListingId(e.target.value)} placeholder="Enter an existing listing ID" /><button className={button}>Open</button></form>}<div className="mb-4 min-h-64 space-y-3">{messages.map((m) => <div key={m.id} className={`w-fit max-w-[80%] rounded-2xl px-3 py-2 ${m.sender === 'buyer' ? 'mr-auto rounded-bl-sm bg-red-600 text-white' : 'ml-auto rounded-br-sm bg-blue-700 text-white'}`}><div className={`mb-1 text-xs ${m.sender === 'buyer' ? 'text-red-100' : 'text-blue-100'}`}>{m.sender === 'buyer' ? 'You' : 'Seller'} {m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div><p className="whitespace-pre-wrap break-words">{m.message}</p></div>)}{messages.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No messages yet. Send a message to start the conversation.</p>}</div><form onSubmit={sendMessage} className="flex gap-2 rounded-lg bg-white p-1"><input className="w-full rounded-lg border border-white/30 bg-black px-3 py-2 text-white placeholder:text-white" value={isExample ? "" : draft} onChange={(e) => setDraft(e.target.value)} readOnly={isExample} maxLength={4000} placeholder="Type a message to the sellerâ€¦" /><button className={button} disabled={loading || !draft.trim()}>Send</button></form><p className="mt-3 text-xs text-gray-500">This chat is linked to this listing. Your browser keeps a random chat token so you can return to the conversation without creating an account.</p></section></div>}
  </main></div>;
}
