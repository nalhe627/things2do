/**
 * This file holds any constants used in the (tabs)/create-post file.
 */

// The width margins for the content in create post
export const sideMargin = " w-16/18 ";

// maximum limit for fields in create post
export const POST_LIMITS = {
    titleCharLimit: 28,
    shortDescCharLimit: 120,
    descCharLimit: 500,
    maxImages: 6,
    maxTags: 5,
  };

// User choosable tags. Will be replaced by tags in supabase
export const AVAILABLE_TAGS = [
  "Outdoor",
  "Indoor",
  "Free",
  "Food & Drink",
  "Sports",
  "Art & Culture",
  "Music",
  "Nightlife",
  "Family Friendly",
  "Adventure",
  "Relaxation",
  "Shopping",
  "Education",
  "Social",
  "Fitness",
  "Nature",
  "Photography",
  "Gaming",
  "Tech",
  "Crafts",
];