import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function ChatThread({ listingId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const token = useMemo(() => {
    if (!listingId || typeof window === 'undefined') return '';
    const key = `sobs_chat_buyer_${listingId}`;
    let value = localStorage.getItem(key);
    if (!value) {
      const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
      value = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(key, value);
    }
    return value;
  }, [listingId]);
  async function refresh() {
    if (!listingId || !token) return;
    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(listingId)}?token=${encodeURIComponent(token)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load chat.');
      setMessages(data.messages || []); setError('');
    } catch (e) { setError(e.message || 'Could not load chat.'); }
  }
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 4000); return () => window.clearInterval(timer); }, [listingId, token]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  async function send() {
    const message = input.trim(); if (!message || sending || !listingId) return;
    setSending(true); setError('');
    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(listingId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, message }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Message could not be sent.');
      setInput(''); await refresh();
    } catch (e) { setError(e.message || 'Message could not be sent.'); }
    finally { setSending(false); }
  }
  return <div className="flex flex-col rounded-xl border border-white bg-card"><div className="border-b border-white p-3 text-sm font-medium">Chat with the seller</div><div className="max-h-80 min-h-48 space-y-2 overflow-y-auto p-3">{error && <p className="text-sm text-red-400">{error}</p>}{messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Start the conversation!</p>}{messages.map((m) => <div key={m.id} className="text-sm"><span className="font-medium">{m.sender === 'seller' ? 'Seller' : 'You'}: </span><span className="text-muted-foreground">{m.message}</span></div>)}<div ref={endRef} /></div><div className="flex gap-2 border-t border-white p-3"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())} placeholder="Type a message..." maxLength={4000} className="flex-1 rounded-lg border border-white bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /><button onClick={send} disabled={sending || !input.trim()} className="rounded-lg bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">Send</button></div></div>;
}
