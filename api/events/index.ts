import { supabase } from '@/utils/supabase';

// Interface to represent events/posts
export interface Event {
  id: string;
  created_at: Date;
  userId: string;
  title: string;
  description: string;
  cost?: number;
  postRankId?: string;
  image_urls: string[];
  tags?: string[];
  updated_at: Date;
  location: Location;
  short_description: string;
  how_to_find_us: string;
  start_date: Date;
  end_date?: Date;
  start_time?: Date;
  end_time?: Date;
  is_multi_day: boolean;
  pricing_type: string;
  ticket_link?: string;
  refund_policy?: string;
  refund_policy_link?: string;

  // These aren't fields in the posts table, but I'm leaving it just in case
  eventType?: string;
  interestedCount?: string;
  rating?: number;

  // Keep previous placeholder fields just in case
  // title: string;
  // date: string;
  // location: string;
  // description: string;
  // priceRange: string;
  // eventType: string;
  // rating: number;
  // interestedCount: string;
  // tags: string[];
  // imageUri: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  country: string;
  latitude: number;
  longitude: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Fetches all of the user's saved events from the database.
 * 
 * @param userId string of the user's Id.
 * @returns an array of `Events` that the user has saved.
 */
export const getSavedEvents = async (userId: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('saved_events')
    .select(`
      id,
      saved_at,
      saved_event:posts!inner (
        id,
        created_at,
        userId,
        title,
        description,
        cost,
        postRankId,
        image_urls,
        tags,
        updated_at,
        location:locations!inner (*),
        short_description,
        how_to_find_us,
        start_date,
        end_date,
        start_time,
        end_time,
        is_multi_day,
        pricing_type,
        ticket_link,
        refund_policy,
        refund_policy_link
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching saved events: ' + error.message);
    return [];
  }

  return data.map((item: any): Event => {
    const savedEvent = item.saved_event;
    // const location: Location = savedEvent.location;
    
    // TODO: implement proper conversion of Supabase object into Event and Location objects
    const returnedEvent: Event = {
      id: savedEvent.id,
      created_at: new Date(savedEvent.created_at),
      userId: savedEvent.userId,
      title: savedEvent.title,
      description: savedEvent.description,
      cost: savedEvent.cost || 0,
      // postRankId: savedEvent.postRankId,
      image_urls: savedEvent.image_urls ?? [],
      tags: savedEvent.tags || [],
      updated_at: new Date(savedEvent.updated_at),
      location: savedEvent.location as Location,
      short_description: savedEvent.short_description,
      how_to_find_us: savedEvent.how_to_find_us,
      start_date: new Date(savedEvent.start_date),
      start_time: new Date(savedEvent.start_time),
      end_time: new Date(savedEvent.end_time),
      is_multi_day: savedEvent.is_multi_day,
      pricing_type: savedEvent.pricing_type,
      ticket_link: savedEvent.ticket_link ?? "",
      refund_policy: savedEvent.refund_policy ?? "",
      refund_policy_link: savedEvent.refund_policy_link ?? "",
    };

    if (savedEvent.end_date) {
      returnedEvent.end_date = new Date(savedEvent.end_date);
    }
    
    return returnedEvent;
  });
};

/**
 * Deletes the specified event from the user's list of saved events.
 * 
 * @param userId string of the user's Id.
 * @param eventId string of the event's Id.
 */
export const deleteSavedEvent = async (userId: string, eventId: string) => {
  const { error } = await supabase
    .from('saved_events')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', eventId)

  if (error) {
    throw new Error(error.message);
    // console.error('Error deleting event: ', error);
    // return error.message;
  }

  // Empty string to indicate no error occurred
  // return '';
};


// Mock data for testing
export const featuredEvent: Event = {
  id: "1",
  created_at: new Date(),
  userId: "1",
  title: 'Summer Music Festival',
  description:
    'Join thousands for an epic outdoor music experience featuring top artists from around the world. Food trucks, craft beer, and much better vibes.',
  cost: 15,
  postRankId: "1",
  image_urls: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1600'
  ],
  tags: ['Festival', 'Outdoor', 'Weekend'],
  updated_at: new Date(),
  location: {
    id: "1",
    name: "Some place",
    address: "123 Bridgeroad",
    city: "Calgary",
    state: "Alberta",
    country: "Canada",
    latitude: 1,
    longitude: 1,
    created_at: new Date(),
    updated_at: new Date()
  } as Location,
  short_description: 'None',
  how_to_find_us: 'None',
  start_date: new Date(),
  end_date: new Date(),
  start_time: new Date(),
  end_time: new Date(),
  is_multi_day: false,
  pricing_type: "None",
  ticket_link: "",
  refund_policy: "No refund policy",
  refund_policy_link: "",
  eventType: 'Music',
  rating: 4.8,
  interestedCount: '15.4k',
};
