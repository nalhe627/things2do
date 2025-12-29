import { supabase } from "@/utils/supabase";

/**
 * Record that a user has viewed/interacted with an event
 * @param postId - The ID of the post/event
 * @param action - 'saved' or 'passed'
 */
export async function recordViewedEvent(
  postId: string,
  action: "saved" | "passed"
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("viewed_events")
      .upsert(
        {
          user_id: user.id,
          post_id: postId,
          action,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,post_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error recording viewed event:", error);
    return { data: null, error };
  }
}

/**
 * Fetch all post IDs that the user has already viewed
 * @returns Array of post IDs
 */
export async function fetchViewedEventIds(): Promise<string[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("viewed_events")
      .select("post_id")
      .eq("user_id", user.id);

    if (error) throw error;

    return data?.map((item: { post_id: string }) => item.post_id) || [];
  } catch (error: any) {
    console.error("Error fetching viewed event IDs:", error);
    return [];
  }
}

/**
 * Check if a specific event has been viewed by the user
 */
export async function isEventViewed(postId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("viewed_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error: any) {
    console.error("Error checking if event is viewed:", error);
    return false;
  }
}

/**
 * Get user's interaction history with statistics
 */
export async function fetchViewedEventsStats() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("viewed_events")
      .select("action")
      .eq("user_id", user.id);

    if (error) throw error;

    const saved =
      data?.filter((item: { action: string }) => item.action === "saved")
        .length || 0;
    const passed =
      data?.filter((item: { action: string }) => item.action === "passed")
        .length || 0;

    return {
      data: {
        total: data?.length || 0,
        saved,
        passed,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching viewed events stats:", error);
    return { data: null, error };
  }
}
