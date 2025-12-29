/**
 * UI-specific types for forms and display components.
 * These are NOT auto-generated; they represent data shapes used in the UI layer.
 */

// UI-level representation of a Post for forms and screens
export interface Post {
  userId: string;
  title: string;
  description: string;
  short_description?: string;
  image_urls?: string[];
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  pricing_type?: PricingType;
  cost?: number;
  refund_policy?: RefundPolicyTemplate;
  refund_policy_link?: string;
  ticket_link?: string;
  tags: string[];
  location?: LocationDetails | null; // UI-friendly
  agenda_items?: AgendaFormItem[];   // Only for UI
}

// Location details for form input (used in create-post and location-autocomplete)
export interface LocationDetails {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
}

// Lineup item for discovery screen display
export interface LineupItem {
  time: string; // Now includes end time: "10:00 AM - 11:00 AM"
  date?: string; // Date of the lineup item: "Nov 15"
  artist: string;
  stage?: string;
  isHeadliner?: boolean;
}

// Review item for discovery screen display
export interface ReviewItem {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
}

// Agenda form item for create-post screen
export interface AgendaFormItem {
  title: string;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  description: string;
  item_type: string;
}

export type PricingType = "free" | "rsvp" | "paid";

export type RefundPolicyTemplate =
  | "no-refunds"
  | "full-refund-7days"
  | "partial-refund"
  | "custom"
  | "external-link";

export const REFUND_POLICY_TEMPLATES: Record<
  Exclude<RefundPolicyTemplate, "custom" | "external-link">,
  string
> = {
  "no-refunds":
    "All sales are final. No refunds or exchanges will be provided under any circumstances.",
  "full-refund-7days":
    "Full refunds are available up to 7 days before the event start date. Requests after this period will not be honored.",
  "partial-refund":
    "Partial refunds (minus processing fees) are available up to 48 hours before the event. No refunds within 48 hours of the event.",
};
