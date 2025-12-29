import { supabase } from "@/utils/supabase";

/**
 * Fetch the latest post with its location and agenda items.
 * @returns Post with nested location and agenda_items arrays, or null if none found.
 */
export const fetchLatestPost = async () => {
  try {
    // Fetch latest post
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select(
        "id, title, short_description, description, how_to_find_us, start_date, end_date, start_time, end_time, is_multi_day, pricing_type, cost, ticket_link, refund_policy, refund_policy_link, image_urls, tags, location_id, userId"
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (postErr) throw postErr;
    if (!post) return null;

    // Fetch location if present
    let location = null;
    if (post.location_id) {
      const { data: loc, error: locErr } = await supabase
        .from("locations")
        .select("id, name, address, city, state, latitude, longitude")
        .eq("id", post.location_id)
        .maybeSingle();
      if (!locErr && loc) location = loc;
    }

    // Fetch agenda items for this post
    const { data: agendaItems, error: agendaErr } = await supabase
      .from("agenda_items")
      .select(
        "id, day_number, scheduled_date, start_time, end_time, title, description, item_type, speaker_or_performer, capacity"
      )
      .eq("post_id", post.id)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (agendaErr)
      console.warn("Failed to load agenda items:", agendaErr.message);

    return {
      ...post,
      location,
      agenda_items: agendaItems || [],
    };
  } catch (err) {
    console.error("Error fetching latest post:", err);
    return null;
  }
};

/**
 * Fetch a specific post by ID with location and agenda items.
 */
export const fetchPostById = async (postId: string) => {
  try {
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select(
        "id, title, short_description, description, how_to_find_us, start_date, end_date, start_time, end_time, is_multi_day, pricing_type, cost, ticket_link, refund_policy, refund_policy_link, image_urls, tags, location_id, userId"
      )
      .eq("id", postId)
      .single();

    if (postErr) throw postErr;

    let location = null;
    if (post.location_id) {
      const { data: loc, error: locErr } = await supabase
        .from("locations")
        .select("id, name, address, city, state, latitude, longitude")
        .eq("id", post.location_id)
        .maybeSingle();
      if (!locErr && loc) location = loc;
    }

    const { data: agendaItems, error: agendaErr } = await supabase
      .from("agenda_items")
      .select(
        "id, day_number, scheduled_date, start_time, end_time, title, description, item_type, speaker_or_performer, capacity"
      )
      .eq("post_id", post.id)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (agendaErr)
      console.warn("Failed to load agenda items:", agendaErr.message);

    return {
      ...post,
      location,
      agenda_items: agendaItems || [],
    };
  } catch (err) {
    console.error("Error fetching post by ID:", err);
    return null;
  }
};

/**
 * Fetch posts excluding specific IDs (for discovery deck preloading).
 * Fetches all posts ordered by creation date for testing.
 * @param excludeIds Array of post IDs to exclude
 * @param limit Number of posts to fetch (default 3 for stack)
 * @returns Array of enriched posts
 */
export const fetchPostsExcluding = async (
  excludeIds: string[] = [],
  limit: number = 3
) => {
  try {
    let query = supabase
      .from("posts")
      .select(
        "id, title, short_description, description, how_to_find_us, start_date, end_date, start_time, end_time, is_multi_day, pricing_type, cost, ticket_link, refund_policy, refund_policy_link, image_urls, tags, location_id, userId"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: posts, error: postErr } = await query;

    if (postErr) {
      console.error("Error fetching posts:", postErr);
      throw postErr;
    }
    if (!posts || posts.length === 0) {
      console.log("No posts found.");
      return [];
    }

    // Enrich with location and agenda (parallel for speed)
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        let location = null;
        if (post.location_id) {
          const { data: loc } = await supabase
            .from("locations")
            .select("id, name, address, city, state, latitude, longitude")
            .eq("id", post.location_id)
            .maybeSingle();
          if (loc) location = loc;
        }

        const { data: agendaItems } = await supabase
          .from("agenda_items")
          .select(
            "id, day_number, scheduled_date, start_time, end_time, title, description, item_type, speaker_or_performer, capacity"
          )
          .eq("post_id", post.id)
          .order("scheduled_date", { ascending: true })
          .order("start_time", { ascending: true });

        return {
          ...post,
          location,
          agenda_items: agendaItems || [],
        };
      })
    );

    console.log(`✅ Preloaded ${enrichedPosts.length} upcoming posts.`);
    return enrichedPosts;
  } catch (err) {
    console.error("Error fetching posts:", err);
    return [];
  }
};
