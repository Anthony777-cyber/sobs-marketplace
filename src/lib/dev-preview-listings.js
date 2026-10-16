const previewTitles = [
  'Vintage Leather Shoulder Bag',
  'Handmade Ceramic Vase',
  'Classic Denim Jacket',
  'Oak Coffee Table',
  'Retro Film Camera',
  'Wool Winter Coat',
  'Brass Desk Lamp',
  'Canvas Weekend Bag',
  'Vinyl Record Collection',
  'Woven Dining Chairs',
  'Silver Pendant Necklace',
  'Mountain Bike',
  'Linen Tablecloth',
  'Portable Record Player',
  'Leather Ankle Boots',
  'Glass Pendant Light',
  'Wooden Bookcase',
  'Hand-Knitted Scarf',
  'Vintage Wall Clock',
  'Ceramic Dinner Set',
];

const previewPrices = [48, 32, 65, 120, 85, 74, 39, 42, 55, 90, 28, 180, 24, 110, 58, 67, 145, 22, 36, 62];

export const DEV_PREVIEW_LISTINGS = previewTitles.map((title, index) => {
  const listingNumber = 1001 + index;

  return {
    id: `dev-preview-${String(index + 1).padStart(3, '0')}`,
    listing_number: listingNumber,
    listing_alias: String(listingNumber).padStart(16, '0'),
    key_token: `DEV-${String(listingNumber).padStart(4, '0')}`,
    title,
    price: previewPrices[index],
    currency: 'EUR',
    images: [],
  };
});
