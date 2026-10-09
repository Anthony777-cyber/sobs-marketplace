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
import SellInfo from '@/pages/SellInfo';
import Signup from '@/pages/Signup';
import SellerLogin from '@/pages/SellerLogin';
import Listings from '@/pages/Listings';
import ListingDetail from '@/pages/ListingDetail';
import Browse from '@/pages/Browse';
import Directory from '@/pages/Directory';
import Confirmed from '@/pages/Confirmed';
import Manage from '@/pages/Manage';
import ManagementConsole from '@/pages/ManagementConsole';
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
import AdaptiveQuestionnaireTest from '@/pages/AdaptiveQuestionnaireTest';
import SifterMK2 from '@/pages/SifterMK2';

const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Splash />} />
      <Route path="/create" element={<CreateListing />} />
      <Route path="/sell-info" element={<SellInfo />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/seller-login" element={<SellerLogin />} />
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/browse/*" element={<Browse />} />
      <Route path="/categories" element={<Directory />} />
      <Route path="/category-test" element={<CategoryTest />} />
      <Route path="/adaptive-test" element={<AdaptiveQuestionnaireTest />} />
      <Route path="/sifter-mk2" element={<SifterMK2 />} />
      <Route path="/confirmed/:id" element={<Confirmed />} />
      <Route path="/manage" element={<Manage />} />
      <Route path="/manage-listings" element={<GlobalManagementConsole />} />
      <Route path="/manage/console" element={<ManagementConsole />} />
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