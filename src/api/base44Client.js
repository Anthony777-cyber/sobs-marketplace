// src/api/base44Client.js

// Replace this URL with your live Cloudflare Worker URL later once deployed!
const WORKER_URL = "http://localhost:8787"; 

export const base44 = {
  entities: {
    Listing: {
      // Fetch all active listings
      filter: async () => {
        const res = await fetch(`${WORKER_URL}/api/listings`);
        return await res.json();
      },
      // Fetch a single listing by its ID
      get: async (id) => {
        const res = await fetch(`${WORKER_URL}/api/listings/${id}`);
        if (!res.ok) throw new Error("Listing not found");
        return await res.json();
      },
      // Create a brand new listing
      create: async (data) => {
        const res = await fetch(`${WORKER_URL}/api/listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await res.json();
      },
      // Delete or Flag a listing
      delete: async (id) => {
        await fetch(`${WORKER_URL}/api/listings/${id}`, { method: "DELETE" });
      },
      update: async (id, data) => {
        const res = await fetch(`${WORKER_URL}/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await res.json();
      }
    },
    ChatMessage: {
      // Fetch messages for a specific listing
      filter: async ({ listing_id }) => {
        const res = await fetch(`${WORKER_URL}/api/chats/${listing_id}`);
        return await res.json();
      },
      // Send a new message
      create: async (data) => {
        const res = await fetch(`${WORKER_URL}/api/chats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await res.json();
      },
      // Fake real-time subscription (simple fallback pool)
      subscribe: (callback) => {
        // Return an empty unsubscribe function to prevent frontend crashes
        return () => {};
      }
    }
  },
  auth: {
    me: async () => ({ full_name: "Guest", email: "", role: "user" }),
    logout: () => { window.location.href = "/"; }
  }
};
