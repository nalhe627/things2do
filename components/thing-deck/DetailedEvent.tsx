import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/constants/theme-context';
import { Colors } from '@/constants/theme';
import { useState } from 'react';
import { Event } from '@/api/events';
import DeleteEventModal from '@/components/thing-deck/DeleteEventModal';

/**
 * UI Component for displaying detailed information on a saved event.
 *
 * @param props.event An object representing the event that is being displayed all of its details.
 * @param props.onEventPress A function to set the `setPressedEvent` state to `false` when the back button is pressed.
 * @returns A UI component that shows all of an event's details when the associated event card is pressed.
 */
export default function DetailedEvent(
  { event, savedEvents, setSavedEvents, onEventPress }: {
    event: Event;
    savedEvents: Event[]
    setSavedEvents: (savedEvents: Event[]) => void;
    onEventPress: (isPressed: boolean) => void;
  },
) {
  const { theme } = useThemeContext();
  const [cancelled, setCancelled] = useState<boolean>(true);

  /** Stops displaying the detailed view to to the user. */
  const cancelView = () => {
    console.log('cancelled detailed view');
    onEventPress(false);
  };

  /** Displays a modal to confirm the deletion of a saved event. */
  const pressDelete = () => {
    setCancelled(false);
    console.log('pressed delete');
  };

  let isFinished = event.end_date && event.end_date < new Date();

  return (
    <ThemedView className="absolute inset-0">
      <ScrollView>
        <ThemedView className="pb-15 rounded-lg" variant="popover">
          <View className="flex-row justify-between p-2">
            {/* Back button */}
            <ThemedView className="rounded-xl p-2">
              <Pressable onPress={cancelView}>
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color={Colors[theme].icon}
                />
              </Pressable>
            </ThemedView>

            {/* Delete saved event button */}
            <Pressable
              className="rounded-xl p-2 bg-red-200"
              onPress={pressDelete}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={21} color="#C40606" />
            </Pressable>
          </View>

          {/* Event Image */}
          <ThemedView className="h-[250]" variant="placeholder">
            {/* Display images (or placeholder if no images are present) */}
            {event.image_urls.length > 0 ? (
              <Image
                source={{ uri: event.image_urls[0] }}
                contentFit="cover"
                style={{
                  height: 250,
                  width: "auto",
                }}
              />
            ) : (
              <Ionicons
                className="m-auto"
                name="image"
                size={190}
                color="rgba(240, 240, 240)"
              />
            )}
          </ThemedView>

          <ThemedView
            className="py-5 mx-4 border-b border-gray-300"
            variant="popover"
          >
            <View className="flex-row gap-3 mt-1 mb-3">
              {/* Event Name */}
              <ThemedText variant="subheader" className="">
                {event.title}
              </ThemedText>

              {/* Event Rating */}
              {event.rating && (
                <View className="flex-row gap-1 items-center">
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <ThemedText variant="normal">
                    {event.rating}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Tags */}
            <ThemedView className="flex-row gap-3" variant="popover">
              {/* Display each tag */}
              {event.tags?.map((tag, i) => (
                <ThemedView className="rounded-lg" key={i}>
                  <ThemedText
                    variant="normal"
                    className="py-1.5 px-3 font-medium text-sm"
                  >
                    {tag}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            {/* Date & Location */}
            <ThemedView
              className="flex-auto gap-3 mt-8"
              variant="popover"
            >
              {/* Date */}
              <ThemedView className="flex-row gap-2 p-3 rounded-lg grow">
                <Ionicons
                  className="pt-1"
                  name="calendar-clear-outline"
                  size={16}
                  color={Colors[theme].icon}
                />
                <View className="flex-1">
                  <ThemedText variant="normal">Date & Time</ThemedText>
                  <View className="flex flex-row">
                    <ThemedText variant="normal" className="text-lg">
                      {event.start_date.toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                        day: "numeric"
                      })} 
                    </ThemedText>

                    {/* End date will be red if the event has already passed */}
                    {event.end_date && (
                      <ThemedText variant={isFinished ? "invalid" : "normal"} className="text-lg">
                          {' — '}
                          {event.end_date.toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                            day: "numeric"
                          })}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </ThemedView>

              {/* Location */}
              <ThemedView className="flex-row gap-2 p-3 rounded-lg grow">
                <Ionicons
                  className="pt-1"
                  name="location-outline"
                  size={16}
                  color={Colors[theme].icon}
                />
                <View className="flex-1">
                  <ThemedText variant="normal">Location</ThemedText>
                  <ThemedText variant="normal" className="text-lg">
                    {/* Very basic check to see if there's anything in location */}
                    {event.location.name.trim() === ', , , ,' 
                      ? 'N/A' 
                      : event.location.name
                    }
                  </ThemedText>
                </View>
              </ThemedView>
            </ThemedView>

            {/* Number of people interested */}
            <View className="flex-row gap-2 items-center mt-7">
              <Ionicons
                name="people-outline"
                size={20}
                color={Colors[theme].icon}
              />
              <ThemedText variant="normal">
                {event.interestedCount || 0} interested
              </ThemedText>
            </View>
          </ThemedView>

          {/* About section */}
          <View className="py-5 mx-4 border-b border-gray-300">
            <ThemedText variant="subheader" className="mb-3">
              About this Event
            </ThemedText>
            <ThemedText variant="normal" className="text-base">
              {event.description}
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>

      {!cancelled && (
        <DeleteEventModal 
          event={event} 
          savedEvents={savedEvents}
          setSavedEvents={setSavedEvents}
          setCancelled={setCancelled}
          setPressed={onEventPress}
          testID="delete-event-modal" 
        />
      )}
    </ThemedView>
  );
}