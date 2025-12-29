import { supabase } from "@/utils/supabase";
import { Post } from "@/types/ui-models";

export const getUserListings = async (userId: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, location:locations(*)")
    .eq("userId", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user listings:", error);
    throw error;
  }
  return data;
};

export const deleteUserListing = async (postId: string) => {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
  return true;
};

export const updateUserListing = async (
  postId: string,
  updates: Partial<Post>
) => {
  // 1. Handle Location Update if provided
  // Note: Ideally we update the locations table if location_id exists, but for now we focus on post fields
  if (updates.location) {
    const { data: currentPost } = await supabase
      .from("posts")
      .select("location_id")
      .eq("id", postId)
      .single();

    if (currentPost?.location_id) {
      const { error: locError } = await supabase
        .from("locations")
        .update({
          name: updates.location.name,
          address: updates.location.address,
          city: updates.location.city,
          state: updates.location.state,
          country: updates.location.country,
          zip_code: updates.location.postal_code,
          latitude: updates.location.latitude,
          longitude: updates.location.longitude,
        })
        .eq("id", currentPost.location_id);

      if (locError) console.error("Error updating location:", locError);
    }
  }

  // 2. Update Post
  const { data, error } = await supabase
    .from("posts")
    .update({
      title: updates.title,
      description: updates.description,
      short_description: updates.short_description,
      cost: updates.cost,
      pricing_type: updates.pricing_type,
      start_date: updates.start_date,
      end_date: updates.end_date,
      start_time: updates.start_time,
      end_time: updates.end_time,
      tags: updates.tags,
      image_urls: updates.image_urls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select();

  if (error) {
    console.error("Error updating listing:", error);
    throw error;
  }
  return data;
};
