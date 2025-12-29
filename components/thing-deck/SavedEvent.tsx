import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { ThemedPressable } from '@/components/themed-pressable';
import { useThemeContext } from '@/constants/theme-context';
import { Colors } from '@/constants/theme';
import { Event } from '@/api/events';

// Sizes for icons
const ICON_SIZE = 16;
const NO_IMG_ICON_SIZE = 70;

// Image dimensions
const IMG_WIDTH = 100;
const IMG_HEIGHT = 94;

// Tailwind classes for image dimensions (doing it dynamically won't work)
const TAILWIND_IMG_WIDTH = 'w-[100]';
const TAILWIND_IMG_HEIGHT = 'h-[94]';

/**
 * UI Component that represents a saved event item in the user's ThingDeck.
 * 
 * @param props.event An event object holding all of its information.
 * @param props.onEventPress A function that passes in the event that was pressed into the `setPressed` state.
 * @param props.setEvent A function that will set the `isPressed` state to `true` when a saved event is pressed.
 * @returns A UI component containing all data for singular saved event.
 */
export default function SavedEvent(
  { event, onEventPress, setEvent }: {
    event: Event;
    onEventPress: (isPresssed: boolean) => void;
    setEvent: (pressedEvent: Event | null) => void;
  },
) {
  const { theme } = useThemeContext();

  const viewEvent = () => {
    console.log(`Pressed Event "${event.title}"`);
    onEventPress(true);
    setEvent(event);
  };
  
  // Check if there's any city and state data in the event
  const location: string = event.location.city && event.location.state
    ? `${event.location.city}, ${event.location.state}`
    : 'N/A';
  
  // Assume there's a price at first, then check if price type is free or rsvp
  let price: string = `$${event.cost}`;
  if (event.pricing_type === 'free') {
    price = 'Free';
  } else if (event.pricing_type === 'rsvp') {
    price = 'RSVP';
  }

  let isFinished = event.end_date && event.end_date < new Date();

  return (
    <ThemedPressable
      className={`flex-row p-4 rounded-lg gap-4 shadow-md ${isFinished && "opacity-50"}`}
      variant="popover"
      onPress={viewEvent}
    >
      <ThemedView 
        className={`rounded-lg ${TAILWIND_IMG_WIDTH} ${TAILWIND_IMG_HEIGHT}`} 
        variant="placeholder"
      >
        {/* Display first image (or placeholder if no images are present) */}
        {event.image_urls.length > 0 ? (
          <Image
            source={{ uri: event.image_urls[0] }}
            contentFit="cover"
            style={{
              height: IMG_HEIGHT,
              width: IMG_WIDTH,
              borderRadius: 8,
            }}
          />
        ) : (
            <Ionicons
              className="m-auto"
              name="image"
              size={NO_IMG_ICON_SIZE}
              color="rgba(240, 240, 240)"
            />
        )}
      </ThemedView>
      
      <ThemedView className="flex-1 gap-1" variant="background">
        <ThemedText 
          variant="normal" 
          className="text-xl font-medium" 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {event.title}
        </ThemedText>
        <View className="flex-row gap-2 items-center">
          <Ionicons
            name="calendar-clear-outline"
            size={ICON_SIZE}
            color={Colors[theme].icon}
          />
          <View className="flex flex-row">
            <ThemedText variant="normal">
              {event.start_date.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
                day: "numeric"
              })}
            </ThemedText>
            {event.end_date && (
              <ThemedText variant={isFinished ? "invalid" : "normal"}>
                {' — '}
                {event.end_date.toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                  day: "numeric"
                })}
              </ThemedText>
            )}
          </View>
        </View>
        <View className="flex-row gap-2 items-center">
          <Ionicons
            name="location-outline"
            size={ICON_SIZE}
            color={Colors[theme].icon}
          />
          <ThemedText variant="normal">
            {location}
          </ThemedText>
        </View>
        <View className="flex-row gap-2 items-center">
          <Ionicons
            name="pricetag-outline"
            size={ICON_SIZE}
            color={Colors[theme].icon}
          />
          <ThemedText variant="normal">
            {price}
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedPressable>
  );
}