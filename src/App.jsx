import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import React, { useEffect } from 'react';
import { sellerLogout } from '@/lib/api';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Splash from '@/pages/Splash';
import Rules from '@/pages/Rules';
import CreateListing from '@/pages/CreateListing';
import SellInfo from '@/pages/SellInfo';
import Signup from '@/pages/Signup';
import SellerLogin from '@/pages/SellerLogin';
import SellerSifterPage from '@/pages/SellerSifterPage';
import Listings from '@/pages/Listings';
import ListingDetail from '@/pages/ListingDetail';
import ChatPage from '@/pages/ChatPage';
import Browse from '@/pages/Browse';
import Directory from '@/pages/Directory';
import Confirmed from '@/pages/Confirmed';
import Manage from '@/pages/Manage';
import ManagementConsole from '@/pages/ManagementConsole';
import BulkListings from '@/pages/BulkListings';
import GlobalManagementConsole from '@/pages/GlobalManagementConsole';
import SelectEditListing from '@/pages/SelectEditListing';
import EditListingKey from '@/pages/EditListingKey';
import EditListing from '@/pages/EditListing';
import RenewListing from '@/pages/RenewListing';
import SelectRenewListing from '@/pages/SelectRenewListing';
import ViewSellerListings from '@/pages/ViewSellerListings';
import DeleteListing from '@/pages/DeleteListing';
import RenewListingKey from '@/pages/RenewListingKey';
import CategoryTest from '@/pages/CategoryTest';

// Restore the seller's existing 24-hour session after a page reload or tab restart.
// The server remains authoritative and rejects expired/revoked tokens.
if (typeof window !== 'undefined') {
  try {
    const expiry = Date.parse(localStorage.getItem('sobs_seller_session_expires_at') || '');
    if (Number.isFinite(expiry)) {
      // The global management key is tab-session-only, never restored from disk.
      localStorage.removeItem('sobs_global_user_key');
      const keys = [
        'sobs_seller_id',
        'sobs_seller_session_token',
        'sobs_seller_session_expires_at',
      ];
      if (expiry > Date.now()) {
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved && !sessionStorage.getItem(key)) sessionStorage.setItem(key, saved);
        }
      } else {
        for (const key of keys) {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }

  if (import.meta.env.DEV && !sessionStorage.getItem('sobs_seller_session_token')) {
    sessionStorage.setItem('sobs_seller_id', '0000000000000000');
    sessionStorage.setItem('sobs_global_user_key', '0000000000000000');
    sessionStorage.setItem('sobs_seller_session_token', 'local-dev-session');
    sessionStorage.setItem(
      'sobs_seller_session_expires_at',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    );
  }

  if (import.meta.env.DEV) {
    sessionStorage.setItem('sobs_global_user_key', '0000000000000000');
    sessionStorage.setItem('sobs_management_unlocked', 'true');
  }
}

const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Splash />} />
      <Route path="/create" element={<CreateListing />} />
      <Route path="/sifter-mk4" element={<SellerSifterPage />} />
      <Route path="/sell-info" element={<SellInfo />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/seller-login"
        element={import.meta.env.DEV ? <Navigate to="/" replace /> : <SellerLogin />}
      />
      {import.meta.env.DEV && (
        <>
          <Route path="/dev/seller-login-preview" element={<SellerLogin />} />
          <Route path="/dev/manage/edit-listings" element={<SelectEditListing preview />} />
          <Route path="/dev/manage/renew-listings" element={<SelectRenewListing preview />} />
        </>
      )}
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/manage/chats" element={<ChatPage sellerMode />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/browse/*" element={<Browse />} />
      <Route path="/categories" element={<Directory />} />
      <Route path="/category-test" element={<CategoryTest />} />
      <Route path="/confirmed/:id" element={<Confirmed />} />
      <Route path="/manage" element={<Manage />} />
      <Route path="/manage-listings" element={<GlobalManagementConsole />} />
      <Route path="/manage/console" element={<ManagementConsole />} />
      <Route path="/manage/bulk-upload" element={<BulkListings />} />
      <Route path="/manage/edit-listings" element={<SelectEditListing />} />
      <Route path="/manage/edit-key" element={<EditListingKey />} />
      <Route path="/manage/edit" element={<EditListing />} />
      <Route path="/manage/renew-listings" element={<SelectRenewListing />} />
<Route path="/manage/view-listings" element={<ViewSellerListings />} />
<Route path="/manage/delete-listing" element={<DeleteListing />} />
<Route path="/manage/renew-key" element={<RenewListingKey />} />
<Route path="/manage/renew" element={<RenewListing />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    const handlePageHide = () => {
      // Clear management credentials when this browser document session ends.
      // This also prevents restored tabs from reviving the management key.
      sessionStorage.removeItem('sobs_global_user_key');
      sessionStorage.removeItem('sobs_management_key');
      sessionStorage.removeItem('sobs_management_unlocked');
      void sellerLogout();
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  const enterFullscreen = () => {
    const tryFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };

    tryFullscreen();
    const timer = setInterval(() => {
      tryFullscreen();
      if (document.fullscreenElement) clearInterval(timer);
    }, 50);
  };

  return (
      <QueryClientProvider client={queryClientInstance}>
        <div onClick={enterFullscreen}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
        </div>
        <Toaster />
      </QueryClientProvider>
  )
}

export default App
