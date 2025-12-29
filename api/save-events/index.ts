import { supabase } from "@/utils/supabase";

/**
 * Save an event for the current user
 */
export async function saveEvent(postId: string, notes?: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("saved_events")
      .insert({
        user_id: user.id,
        post_id: postId,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      // If already saved, ignore duplicate error
      if (error.code === "23505") {
        console.log("Event already saved");
        return { data: null, error: null };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error("Error saving event:", error);
    return { data: null, error };
  }
}

/**
 * Unsave an event for the current user
 */
export async function unsaveEvent(postId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error("Error unsaving event:", error);
    return { error };
  }
}

/**
 * Check if an event is saved by the current user
 */
export async function isEventSaved(postId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("saved_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error: any) {
    console.error("Error checking if event is saved:", error);
    return false;
  }
}

/**
 * Fetch all saved events for the current user with full post details
 */
export async function fetchSavedEvents() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("saved_events")
      .select(
        `
        id,
        saved_at,
        notes,
        post_id,
        posts (
          id,
          title,
          short_description,
          description,
          start_date,
          end_date,
          start_time,
          end_time,
          cost,
          pricing_type,
          ticket_link,
          image_urls,
          tags,
          refund_policy,
          refund_policy_link,
          how_to_find_us,
          location:locations (
            id,
            name,
            address,
            city,
            state,
            latitude,
            longitude
          ),
          agenda_items (
            id,
            title,
            description,
            start_time,
            end_time,
            item_type,
            speaker_or_performer
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("Error fetching saved events:", error);
    return { data: [], error };
  }
}

/**
 * Update notes for a saved event
 */
export async function updateSavedEventNotes(postId: string, notes: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("saved_events")
      .update({ notes })
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error updating saved event notes:", error);
    return { data: null, error };
  }
}
