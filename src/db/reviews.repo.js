/**
 * GoMate Customer Reviews & Star Ratings Repository
 * Stores farmer ratings (1 to 5 stars), reviews, and owner reputation scores.
 */

// In-memory reviews store with realistic seed records for Jath machinery owners
let REVIEWS_STORE = [
  {
    id: 'REV-101',
    booking_ref: 'GM-J39Z',
    owner_phone: '+919822012345',
    customer_phone: '+919876500001',
    customer_name: 'Ramesh Patil',
    village: 'Shegaon (जत तालुका)',
    equipment_name: 'Mahindra 575 DI (45 HP) [रोटाव्हेटर]',
    rating: 5,
    comment: 'वेळेवर आले आणि रोटाव्हेटर मशागत खूप छान केली. ड्रायव्हर खूप हुशार होता.',
    created_at: '2026-08-28T14:20:00.000Z'
  },
  {
    id: 'REV-102',
    booking_ref: 'GM-O3YK',
    owner_phone: '+919822012345',
    customer_phone: '+919876500002',
    customer_name: 'Suresh Shinde',
    village: 'Sankh (जत तालुका)',
    equipment_name: 'Mahindra 575 DI (45 HP) [नांगरट]',
    rating: 5,
    comment: 'खोल नांगरट उत्तम झाली. डिझेलचा योग्य वापर केला.',
    created_at: '2026-08-27T16:45:00.000Z'
  },
  {
    id: 'REV-103',
    booking_ref: 'GM-789X',
    owner_phone: '+919822012345',
    customer_phone: '+919876500003',
    customer_name: 'Tukaram Mali',
    village: 'Umadi (जत तालुका)',
    equipment_name: 'JCB 3DX Super EcoXcellence',
    rating: 4,
    comment: 'शेततळ्याचे खोदकाम वेळेत पूर्ण केले.',
    created_at: '2026-08-26T11:30:00.000Z'
  }
];

const supabase = require('./supabase');

/**
 * Add a new farmer review and compute updated owner rating
 */
async function addReview(data) {
  const ratingNum = Math.min(5, Math.max(1, Number(data.rating) || 5));
  const newReview = {
    id: `REV-${Date.now().toString().slice(-6)}`,
    booking_ref: data.booking_ref || 'GM-XXXX',
    owner_phone: data.owner_phone || '+919822012345',
    customer_phone: data.customer_phone || '',
    customer_name: data.customer_name || 'Farmer',
    village: data.village || 'Jath',
    equipment_name: data.equipment_name || 'Tractor Unit',
    rating: ratingNum,
    comment: data.comment || (ratingNum >= 4 ? 'काम अतिशय चांगले झाले.' : 'सेवा समाधानकारक.'),
    created_at: new Date().toISOString()
  };

  try {
    const { data: dbData, error } = await supabase
      .from('reviews')
      .insert([newReview])
      .select()
      .single();
    if (!error && dbData) {
      REVIEWS_STORE.unshift(dbData);
    } else {
      REVIEWS_STORE.unshift(newReview);
    }
  } catch (err) {
    REVIEWS_STORE.unshift(newReview);
  }

  // Compute updated average rating for this owner
  const ownerReviews = REVIEWS_STORE.filter(r => r.owner_phone === newReview.owner_phone);
  const totalStars = ownerReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Math.round((totalStars / ownerReviews.length) * 10) / 10;

  return {
    review: newReview,
    ownerSummary: {
      totalReviews: ownerReviews.length,
      averageRating: avgRating,
      fiveStarCount: ownerReviews.filter(r => r.rating === 5).length
    }
  };
}

/**
 * Get reviews for an owner
 */
async function getOwnerReviews(ownerPhone) {
  const clean = String(ownerPhone).trim().replace(/[^\d+]/g, '');
  let reviews = [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('owner_phone', clean)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      reviews = data;
    }
  } catch (err) {
    // fallback
  }

  if (reviews.length === 0) {
    reviews = REVIEWS_STORE.filter(r => r.owner_phone === clean || clean.includes(r.owner_phone.slice(-10)));
  }

  const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = reviews.length > 0 ? Math.round((totalStars / reviews.length) * 10) / 10 : 4.9;

  return {
    reviews,
    averageRating: avgRating,
    totalReviews: reviews.length,
    fiveStarCount: reviews.filter(r => r.rating === 5).length
  };
}

module.exports = {
  addReview,
  getOwnerReviews
};
