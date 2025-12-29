import { supabase } from "@/utils/supabase";

/**
 * Fetch all posts created by the current user
 */
export async function fetchUserPosts() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        short_description,
        start_date,
        end_date,
        start_time,
        end_time,
        is_multi_day,
        pricing_type,
        cost,
        image_urls,
        location:locations(name, address),
        agenda_items(id, title, scheduled_date, start_time, end_time)
      `
      )
      .eq("userId", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("Error fetching user posts:", error);
    return { data: [], error };
  }
}

/**
 * Delete a post and all associated data (cascades to agenda_items, saved_events, viewed_events)
 */
export async function deletePost(postId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("userId")
      .eq("id", postId)
      .single();

    if (fetchError) throw fetchError;
    if (post.userId !== user.id) {
      throw new Error("Unauthorized: You can only delete your own posts");
    }

    // Delete the post (cascades to agenda_items, saved_events, viewed_events via FK constraints)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) throw deleteError;

    return { error: null };
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return { error };
  }
}

/**
 * Update a post's basic information
 */
export async function updatePost(
  postId: string,
  updates: {
    title?: string;
    short_description?: string | null;
    description?: string | null;
    how_to_find_us?: string | null;
    start_date?: string;
    end_date?: string | null;
    start_time?: string;
    end_time?: string;
    is_multi_day?: boolean;
    pricing_type?: string;
    cost?: number | null;
    ticket_link?: string | null;
    refund_policy?: string | null;
    refund_policy_link?: string | null;
    tags?: string[] | null;
    image_urls?: string[] | null;
  }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("userId")
      .eq("id", postId)
      .single();

    if (fetchError) throw fetchError;
    if (post.userId !== user.id) {
      throw new Error("Unauthorized: You can only edit your own posts");
    }

    const { data, error } = await supabase
      .from("posts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error updating post:", error);
    return { data: null, error };
  }
}

/**
 * Fetch a single post by ID with all related data for editing
 */
export async function fetchPostForEdit(postId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(
        `
        *,
        location:locations(*),
        agenda_items(*)
      `
      )
      .eq("id", postId)
      .single();

    if (postError) throw postError;

    // Verify ownership
    if (post.userId !== user.id) {
      throw new Error("Unauthorized: You can only edit your own posts");
    }

    return { data: post, error: null };
  } catch (error: any) {
    console.error("Error fetching post for edit:", error);
    return { data: null, error };
  }
}