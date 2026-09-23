import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Splash from '@/pages/Splash';
import Rules from '@/pages/Rules';
import CreateListing from '@/pages/CreateListing';
import Listings from '@/pages/Listings';
import ListingDetail from '@/pages/ListingDetail';
import Browse from '@/pages/Browse';
import Directory from '@/pages/Directory';
import Confirmed from '@/pages/Confirmed';
import Manage from '@/pages/Manage';
import CategoryTest from '@/pages/CategoryTest';

const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Splash />} />
      <Route path="/create" element={<CreateListing />} />
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/browse/*" element={<Browse />} />
      <Route path="/categories" element={<Directory />} />
      <Route path="/category-test" element={<CategoryTest />} />
      <Route path="/confirmed/:id" element={<Confirmed />} />
      <Route path="/manage" element={<Manage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
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