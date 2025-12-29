/**
 * Shared utility functions for parsing and formatting dates and times from the database.
 */

/**
 * Parse time from database format (HH:MM:SS or HH:MM:SS+00)
 * @param timeStr Time string from database
 * @returns Formatted time string like "10:27 AM" or empty string
 */
export const parseTime = (timeStr: string | null): string => {
  if (!timeStr) return "";
  try {
    // Remove timezone offset if present (e.g., "10:27:08+00" -> "10:27:08")
    const cleanTime = timeStr.split("+")[0].split("-")[0];
    const [hours, minutes] = cleanTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    console.error("❌ Failed to parse time:", timeStr, e);
    return "";
  }
};

/**
 * Format time range from start and end times
 * @param startTime Start time string
 * @param endTime End time string
 * @returns Formatted time range like "10:00 AM - 6:00 PM" or just start time
 */
export const formatTimeRange = (
  startTime: string | null,
  endTime: string | null
): string => {
  const startTimeFormatted = parseTime(startTime);
  const endTimeFormatted = parseTime(endTime);

  if (startTimeFormatted) {
    return endTimeFormatted
      ? `${startTimeFormatted} - ${endTimeFormatted}`
      : startTimeFormatted;
  }
  return "";
};

/**
 * Format date string from database date
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Formatted date like "Nov 12, 2025"
 */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "TBD";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    console.error("❌ Failed to format date:", dateStr, e);
    return "TBD";
  }
};

/**
 * Format date range for multi-day events
 * @param startDate Start date string
 * @param endDate End date string
 * @param isMultiDay Whether the event spans multiple days
 * @returns Formatted date range like "Nov 12, 2025 - Nov 15, 2025" or single date
 */
export const formatDateRange = (
  startDate: string | null,
  endDate: string | null,
  isMultiDay: boolean = false
): string => {
  if (!startDate) return "TBD";

  const startFormatted = formatDate(startDate);

  if (isMultiDay && endDate) {
    const endFormatted = formatDate(endDate);
    return `${startFormatted} - ${endFormatted}`;
  }

  return startFormatted;
};

/**
 * Format agenda item date for display
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Formatted date like "Nov 15" (no year)
 */
export const formatAgendaDate = (dateStr: string | null): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    console.error("❌ Failed to format agenda date:", dateStr, e);
    return "";
  }
};
