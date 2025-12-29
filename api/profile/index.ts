import { supabase } from "@/utils/supabase";

/*
AI ACKNOWLEDGEMENT

Google's Gemini was used to draft the database query functions and generate the associated TypeScript interfaces. 
The primary use of the AI was in debugging complex PostgREST query errors by providing the explicit foreign key join syntax. 
The student was responsible for verifying the query logic, ensuring it targets the correct public.users and public.reviews tables, 
and validating data mapping for null safety.

*/

// --- Types for Profile Data ---
export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  rating: number; 
  location: string;
  bio: string;
  attended: number;
  created: number;
  followers: number;
  following: number;
  member_since: string;
}

export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar_url: string;
  rating: number;
  text: string;
  created_at: string;
}

// Interface for fetching core profile fields from the public.users table
interface PublicUserResponse {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  created_at: string;
}

/**
 * Interface for the data allowed when updating a user's profile.
 * All fields are optional to allow for partial updates.
 */
export interface UpdateProfileParams {
  full_name?: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
}

/**
 * Fetches the user's data from the public.users table.
 *
 * @param userId The unique ID of the user whose profile is being requested.
 * @returns The user's profile object from public.users.
 */
export const getProfile = async (userId: string): Promise<PublicUserResponse> => {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
            id,
            full_name,
            avatar_url,
            location,
            bio,
            created_at
        `,
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to fetch public profile data.");
  }

  const response: PublicUserResponse = {
    id: data.id,
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    location: data.location,
    bio: data.bio,
    created_at: data.created_at,
  };

  return response;
};

/**
 * Fetches reviews intended for a specific user from a 'reviews' table,
 * performing a JOIN on the 'users' table to retrieve reviewer details (name/avatar).
 *
 * @param reviewedUserId The ID of the user whose reviews we are fetching.
 * @returns A list of UserReview objects.
 */
export const getReviewsForUser = async (
  reviewedUserId: string,
): Promise<UserReview[]> => {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
        id,
        rating,
        text,
        created_at,
        reviewer_id,
        reviewer:users!reviews_reviewer_id_fkey(full_name, avatar_url)
      `,
    )
    .eq("reviewed_user_id", reviewedUserId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  // Map DB data to the UserReview interface
  return data.map((item: any) => {
    // PostgREST typically returns a single object for a successful foreign key lookup.
    const reviewerProfile = item.reviewer;

    // Final fallback checks
    const name =
      reviewerProfile?.full_name || "Anonymous User (RLS/Join Issue)";
    const avatar =
      reviewerProfile?.avatar_url ||
      "https://placehold.co/40x40/cccccc/000000?text=?";

    return {
      id: item.id,
      reviewer_id: item.reviewer_id,
      reviewer_name: name,
      reviewer_avatar_url: avatar,
      rating: item.rating || 0,
      text: item.text || "No review text provided.",
      created_at: item.created_at,
    };
  });
};

/**
 * Updates a user's profile data in the public.users table.
 * This function performs a partial update; only the fields provided in the
 * 'updates' object will be modified.
 *
 * @param userId The unique ID of the user whose profile is being updated.
 * @param updates An object containing the fields to update (e.g., { full_name: "New Name", avatar_url: "new_url..." }).
 * @returns The updated user profile object from the database.
 */
export const updateProfile = async (
  userId: string,
  updates: UpdateProfileParams,
) => {
  // Create an object for the update.
  // We also explicitly set 'updated_at' to track the change time,
  // as defined in the 'public.users' schema.
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message || "Failed to update profile data.");
  }

  return data;
};

export const ProfileApi = {
  getProfile,
  getReviewsForUser,
  updateProfile,
};