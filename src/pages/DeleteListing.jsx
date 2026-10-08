import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { deleteGlobalListing, verifyGlobalListingKey } from '@/lib/api';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function DeleteListing() {
  const navigate = useNavigate();
  const location = useLocation();

  const globalKey = sessionStorage.getItem('sobs_global_user_key');
  const listingId = sessionStorage.getItem('sobs_global_delete_listing_id');
  const listingNumber = sessionStorage.getItem('sobs_global_delete_listing_number');

  const listing = location.state?.listing || null;

  const [stage, setStage] = useState(1);
  const [enteredId, setEnteredId] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (!globalKey || !listingId || !listingNumber) {
    navigate('/manage/view-listings', { replace: true });
    return null;
  }

  const cancel = () => {
    navigate('/manage/view-listings', { replace: true });
  };

  const checkListingId = async () => {
    setError('');
    if (attempts >= 5) return;

    try {
      await verifyGlobalListingKey(
        globalKey,
        listingNumber,
        enteredId.trim()
      );
      setStage(3);
    } catch {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setEnteredId('');
      setError(nextAttempts >= 5 ? 'Too many attempts. Restart S.O.B.S. to try again.' : 'Listing management code does not match this listing.');
    }
  };

  const permanentlyDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await deleteGlobalListing(listingId, globalKey);
      setStage(4);
    } catch {
      setError('Could not delete listing.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="mx-auto max-w-2xl px-4 pt-[25vh] pb-12">
        <button
          type="button"
          onClick={cancel}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 font-semibold hover:border-white/40"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <div className="rounded-xl border border-white/15 p-6">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-red-500" />
            <h1 className="font-display text-3xl tracking-tight">
              Delete Listing
            </h1>
          </div>

          {stage === 1 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold">
                Are you sure you want to delete this listing?
              </h2>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStage(2)}
                  className="rounded-full bg-red-600 px-6 py-3 font-semibold text-black hover:bg-red-500"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-white/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold">
                Enter the Individual Listing Management Code for this listing.
              </h2>

              <p className="mt-2 text-sm text-white/50">
                The code must match the selected listing.
              </p>

              <input
                value={enteredId}
                onChange={(event) => {
                  setEnteredId(event.target.value);
                  setError('');
                }}
                className="mt-6 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/50"
                placeholder="Individual Listing Management Code"
                autoFocus
              />

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={checkListingId}
                  disabled={attempts >= 5}
                  className="rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90"
                >
                  Continue
                </button>

                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-white/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold">Final Warning</h2>

              <div className="mt-6 space-y-4 text-white/80">
                <p>
                  Deleted listings can not be reinstated or reimbursed,
                  including listings deleted by mistake.
                </p>

                <p>
                  The listing will no longer be publicly available. S.O.B.S.
                  retains an internal historical record of the listing,
                  including its contents, images, dates, times and duration,
                  for record-keeping, security, dispute handling and lawful
                  requests.
                </p>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={permanentlyDelete}
                  className="rounded-full bg-red-600 px-6 py-3 font-semibold text-black hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Yes, permanently delete'}
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={cancel}
                  className="rounded-full border border-white/20 px-6 py-3 font-semibold hover:border-white/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold">Deleted.</h2>

              <button
                type="button"
                onClick={() => navigate('/manage/view-listings', { replace: true })}
                className="mt-8 rounded-full bg-white px-6 py-3 font-semibold text-black hover:bg-white/90"
              >
                Return to View Listings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
