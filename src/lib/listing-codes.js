export const PRIVATE_LISTING_CODE_LABEL = 'Individual Listing Management Code:';

export function getListingManagementCode(listing) {
  return listing?.key_token
    ?? listing?.keyToken
    ?? listing?.listing_key_token
    ?? listing?.listingKeyToken
    ?? listing?.management_code
    ?? listing?.managementCode
    ?? null;
}
